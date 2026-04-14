import { NextResponse } from "next/server";
import { handleAdminSetUserSuspension } from "@/lib/api/admin-set-user-suspension";

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
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}
