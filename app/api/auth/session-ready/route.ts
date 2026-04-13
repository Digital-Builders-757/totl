import { NextResponse } from "next/server";
import { createSupabaseServer } from "@/lib/supabase/supabase-server";
import { logger } from "@/lib/utils/logger";

export async function GET() {
  try {
    const supabase = await createSupabaseServer();
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser();

    if (error) {
      logger.warn("[session-ready] getUser error", { message: error.message });
      return NextResponse.json({ ready: false, reason: "auth_error" }, { status: 500 });
    }

    if (!user) {
      return NextResponse.json({ ready: false, reason: "no_session" }, { status: 401 });
    }

    return NextResponse.json({ ready: true }, { status: 200 });
  } catch (unexpected) {
    logger.warn("[session-ready] handler exception", {
      message: unexpected instanceof Error ? unexpected.message : "unknown",
    });
    return NextResponse.json({ ready: false, reason: "server_exception" }, { status: 500 });
  }
}
