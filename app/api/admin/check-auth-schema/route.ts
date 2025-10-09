import { NextResponse } from "next/server";
import { createSupabaseAdminClient } from "@/lib/supabase/supabase-admin-client";

export async function GET() {
  try {
    const supabase = createSupabaseAdminClient();

    // Use the RPC function to safely access information_schema
    const { data, error } = await supabase.rpc("check_auth_schema");

    if (error) {
      return NextResponse.json(
        {
          exists: false,
          tables: [],
          hasUsersTable: false,
          error: "Could not query auth schema: " + error.message,
        },
        { status: 200 }
      );
    }

    // Type the RPC return value
    const rpcData = data as { schemas: string[]; auth_tables: string[] } | null;
    const schemas = rpcData?.schemas || [];
    const authTables = rpcData?.auth_tables || [];
    const hasAuthSchema = schemas.includes("auth");
    const hasUsersTable = authTables.includes("users");

    return NextResponse.json(
      {
        exists: hasAuthSchema,
        tables: authTables,
        hasUsersTable,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error in check-auth-schema route:", error);
    return NextResponse.json(
      {
        exists: false,
        tables: [],
        hasUsersTable: false,
        error: "Server error: " + (error instanceof Error ? error.message : "Unknown error"),
      },
      { status: 500 }
    );
  }
}
