import * as Sentry from "@sentry/nextjs";
import { NextResponse } from "next/server";
import { createSupabaseServer } from "@/lib/supabase/supabase-server";
import { createSupabaseAdminClient } from "@/lib/supabase-admin-client";
import { logger } from "@/lib/utils/logger";

type SupabaseLikeError = { message?: string; status?: number };

function serializeSupabaseAuthError(error: unknown): Record<string, unknown> {
  if (error instanceof Error) {
    const e = error as Error & { status?: number; code?: string };
    return {
      name: e.name,
      message: e.message,
      status: e.status,
      code: e.code,
    };
  }
  if (error && typeof error === "object") {
    const o = error as Record<string, unknown>;
    return {
      message: o.message,
      status: o.status,
      code: o.code,
      name: o.name,
    };
  }
  return { message: String(error) };
}

function isAuthUserNotFoundError(error: SupabaseLikeError): boolean {
  // Supabase Auth admin can return a 404-style error when the user doesn't exist.
  // Treat as success so deletes are idempotent (safe to retry / double-click).
  if (typeof error?.status === "number" && error.status === 404) return true;
  const msg = String(error?.message ?? "");
  return /user not found/i.test(msg) || /not found/i.test(msg);
}

function isForeignKeyConstraintError(error: SupabaseLikeError): boolean {
  const msg = String(error?.message ?? "");
  return (
    error?.status === 409 ||
    /foreign key/i.test(msg) ||
    /constraint/i.test(msg) ||
    /23503/i.test(msg) ||
    /violates foreign key/i.test(msg) ||
    /referenced from table/i.test(msg) ||
    /still referenced/i.test(msg)
  );
}

/** GoTrue often wraps Postgres failures as this generic string; treat like a constraint block for UX. */
function isGenericDatabaseDeletingUserMessage(error: SupabaseLikeError): boolean {
  return /database error deleting user/i.test(String(error?.message ?? ""));
}

export const POST = async (request: Request) => {
  try {
    const body = (await request.json()) as { userId?: string };
    const userId = typeof body.userId === "string" ? body.userId.trim() : "";

    if (!userId) {
      return NextResponse.json({ error: "User ID is required" }, { status: 400 });
    }

    const supabase = await createSupabaseServer();

    // Check if requester is authenticated and is admin
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Verify requester is admin
    const { data: requesterProfile, error: requesterProfileError } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .maybeSingle();

    if (requesterProfileError) {
      logger.error("[AdminDeleteUser] Failed to verify admin:", requesterProfileError);
      return NextResponse.json({ error: "Failed to verify admin" }, { status: 500 });
    }

    if (!requesterProfile || requesterProfile.role !== "admin") {
      return NextResponse.json({ error: "Forbidden: Admin access required" }, { status: 403 });
    }

    // Prevent self-deletion
    if (userId === user.id) {
      return NextResponse.json({ error: "Cannot delete your own account" }, { status: 400 });
    }

    // HARD DELETE CONTRACT:
    // - Do not delete from public.profiles directly.
    // - Always delete the auth user, and rely on DB cascades for related app data.
    //
    // NOTE: DB cascades do NOT delete Storage objects; we must remove those explicitly.
    //
    const supabaseAdmin = createSupabaseAdminClient();

    const { data: targetProfile, error: targetProfileError } = await supabaseAdmin
      .from("profiles")
      .select("id, role")
      .eq("id", userId)
      .maybeSingle();

    if (targetProfileError) {
      return NextResponse.json({ error: "Failed to load target user profile" }, { status: 500 });
    }

    if (!targetProfile) {
      return NextResponse.json({ error: "Target user not found" }, { status: 404 });
    }

    if (targetProfile.role === "admin") {
      return NextResponse.json({ error: "Cannot hard-delete another admin account" }, { status: 403 });
    }

    // Career Builder accounts are disable-only because dependent rows can block auth user deletes.
    if (targetProfile.role === "client") {
      return NextResponse.json(
        {
          error:
            "Hard delete is blocked for Career Builder accounts because dependent records can violate foreign key constraints. Use Suspend User instead.",
        },
        { status: 409 }
      );
    }

    if (targetProfile.role !== "talent") {
      return NextResponse.json(
        { error: "Hard delete is not available for this user from the Admin Users workflow" },
        { status: 400 }
      );
    }

    // Optional (recommended): Storage cleanup hook before deleting auth user.
    // - This prevents orphaned storage objects for deleted accounts.
    // - Failures here should NOT block deletion; log and proceed.
    //
    // Buckets currently in use:
    // - avatars: path prefix `${userId}/...` (current uploads use flat `${userId}/avatar-...`)
    // - portfolio: path prefix `${userId}/...` (current uploads use flat `${userId}/portfolio-...`)
    //
    // Listing is NOT guaranteed recursive in Supabase Storage, so we do a best-effort recursive walk
    // to catch nested folders if conventions drift over time.
    const listAllPathsUnderPrefix = async (bucket: "avatars" | "portfolio", prefix: string) => {
      const paths: string[] = [];
      const queue: string[] = [prefix];

      while (queue.length > 0) {
        const currentPrefix = queue.shift()!;
        // list() returns objects and "folders" (folders typically have id=null).
        const { data: entries, error: listError } = await supabaseAdmin.storage
          .from(bucket)
          .list(currentPrefix);

        if (listError) {
          return { paths, error: listError };
        }

        for (const entry of entries ?? []) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const anyEntry = entry as any;
          const name: string = String(anyEntry?.name ?? "");
          if (!name) continue;

          const isFolder = anyEntry?.id == null;
          if (isFolder) {
            queue.push(`${currentPrefix}/${name}`.replace(/\/+/g, "/"));
            continue;
          }

          paths.push(`${currentPrefix}/${name}`.replace(/\/+/g, "/"));
        }
      }

      return { paths, error: null as null };
    };

    try {
      const { paths, error: avatarListError } = await listAllPathsUnderPrefix("avatars", userId);
      if (avatarListError) {
        logger.warn("[AdminDeleteUser] Avatar list warning:", { error: avatarListError });
      } else if (paths.length > 0) {
        const { error: avatarRemoveError } = await supabaseAdmin.storage.from("avatars").remove(paths);
        if (avatarRemoveError) {
          logger.warn("[AdminDeleteUser] Avatar remove warning:", { error: avatarRemoveError });
        }
      }
    } catch (storageError) {
      logger.warn("[AdminDeleteUser] Avatar storage cleanup warning:", { error: storageError });
    }

    try {
      const { paths, error: portfolioListError } = await listAllPathsUnderPrefix("portfolio", userId);
      if (portfolioListError) {
        logger.warn("[AdminDeleteUser] Portfolio list warning:", { error: portfolioListError });
      } else if (paths.length > 0) {
        const { error: portfolioRemoveError } = await supabaseAdmin.storage.from("portfolio").remove(paths);
        if (portfolioRemoveError) {
          logger.warn("[AdminDeleteUser] Portfolio remove warning:", { error: portfolioRemoveError });
        }
      }
    } catch (storageError) {
      logger.warn("[AdminDeleteUser] Portfolio storage cleanup warning:", { error: storageError });
    }

    // Audit breadcrumb (useful even without an audit table)
    logger.info("[AdminDeleteUser] Deleting user", {
      deleted_by: user.id,
      deleted_user_id: userId,
    });

    const { error } = await supabaseAdmin.auth.admin.deleteUser(userId);

    if (error) {
      if (isAuthUserNotFoundError(error as SupabaseLikeError)) {
        // Idempotent delete: if it's already gone, treat as success.
        return NextResponse.json({
          success: true,
          message: "User already deleted.",
        });
      }

      const serialized = serializeSupabaseAuthError(error);
      const constraintLike =
        isForeignKeyConstraintError(error as SupabaseLikeError) ||
        isGenericDatabaseDeletingUserMessage(error as SupabaseLikeError);

      logger.error("[AdminDeleteUser] auth.admin.deleteUser failed", {
        deleted_user_id: userId,
        deleted_by: user.id,
        ...serialized,
      });

      Sentry.withScope((scope) => {
        scope.setTag("admin_operation", "delete_user");
        scope.setContext("supabase_auth_admin", {
          target_user_id: userId,
          requester_user_id: user.id,
          error: serialized,
        });
        if (constraintLike) {
          Sentry.captureMessage("Admin delete user blocked (constraint or wrapped DB error)", "warning");
        } else {
          Sentry.captureException(
            error instanceof Error ? error : new Error(String(serialized.message ?? "deleteUser failed"))
          );
        }
      });

      if (constraintLike) {
        return NextResponse.json(
          {
            error:
              "Hard delete failed due to related data constraints. Use Suspend User instead. If this persists after a schema deploy, check Postgres logs and supabase/diagnostics/auth-user-delete-fk-audit.sql.",
          },
          { status: 409 }
        );
      }

      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: "User deleted successfully. All related data has been cascaded.",
    });
  } catch (error) {
    logger.error("Error deleting user:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
};
