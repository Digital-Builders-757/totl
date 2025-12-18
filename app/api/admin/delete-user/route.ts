import { NextResponse } from "next/server";
import { createSupabaseServer } from "@/lib/supabase/supabase-server";
import { createSupabaseAdminClient } from "@/lib/supabase-admin-client";

type SupabaseLikeError = { message?: string; status?: number };

function isAuthUserNotFoundError(error: SupabaseLikeError): boolean {
  // Supabase Auth admin can return a 404-style error when the user doesn't exist.
  // Treat as success so deletes are idempotent (safe to retry / double-click).
  if (typeof error?.status === "number" && error.status === 404) return true;
  const msg = String(error?.message ?? "");
  return /user not found/i.test(msg) || /not found/i.test(msg);
}

export const POST = async (request: Request) => {
  try {
    const { userId } = await request.json();

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
      console.error("[AdminDeleteUser] Failed to verify admin:", requesterProfileError);
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
    // Use admin client to delete user (cascade delete will handle related DB data)
    const supabaseAdmin = createSupabaseAdminClient();

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
        console.warn("[AdminDeleteUser] Avatar list warning:", avatarListError);
      } else if (paths.length > 0) {
        const { error: avatarRemoveError } = await supabaseAdmin.storage.from("avatars").remove(paths);
        if (avatarRemoveError) {
          console.warn("[AdminDeleteUser] Avatar remove warning:", avatarRemoveError);
        }
      }
    } catch (storageError) {
      console.warn("[AdminDeleteUser] Avatar storage cleanup warning:", storageError);
    }

    try {
      const { paths, error: portfolioListError } = await listAllPathsUnderPrefix("portfolio", userId);
      if (portfolioListError) {
        console.warn("[AdminDeleteUser] Portfolio list warning:", portfolioListError);
      } else if (paths.length > 0) {
        const { error: portfolioRemoveError } = await supabaseAdmin.storage.from("portfolio").remove(paths);
        if (portfolioRemoveError) {
          console.warn("[AdminDeleteUser] Portfolio remove warning:", portfolioRemoveError);
        }
      }
    } catch (storageError) {
      console.warn("[AdminDeleteUser] Portfolio storage cleanup warning:", storageError);
    }

    // Audit breadcrumb (useful even without an audit table)
    console.info("[AdminDeleteUser] Deleting user", {
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
      console.error("Error deleting user:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: "User deleted successfully. All related data has been cascaded.",
    });
  } catch (error) {
    console.error("Error deleting user:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
};
