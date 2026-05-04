import { NextResponse } from "next/server";
import { handleAdminSetUserSuspension } from "@/lib/api/admin-set-user-suspension";
import { logger } from "@/lib/utils/logger";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      userId?: string;
      reason?: string;
      suspended?: boolean;
    };

    const userId = typeof body.userId === "string" ? body.userId.trim() : "";
    if (!userId) {
      return NextResponse.json({ error: "User ID is required" }, { status: 400 });
    }

    if (typeof body.suspended !== "boolean") {
      return NextResponse.json(
        { error: "Field \"suspended\" must be a boolean" },
        { status: 400 }
      );
    }

    const reason = typeof body.reason === "string" ? body.reason : undefined;

    return handleAdminSetUserSuspension({
      userId,
      suspended: body.suspended,
      reason,
    });
  } catch (error) {
    logger.error("[api/admin/set-user-suspension] request parse failed", error);
    return NextResponse.json(
      { error: "We couldn't update suspension right now. Please try again." },
      { status: 500 }
    );
  }
}
