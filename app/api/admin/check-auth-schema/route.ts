import { NextResponse } from "next/server";
import { createSupabaseAdminClient } from "@/lib/supabase-admin-client";

export async function GET() {
  try {
    const supabase = createSupabaseAdminClient();

    // FIXED: Removed RPC call that might use aggregates
    // Instead, directly query information_schema tables

    // First check if auth schema exists
    const { data: namespaceData, error: namespaceError } = await supabase
      .from("information_schema.schemata")
      .select("schema_name")
      .eq("schema_name", "auth")
      .maybeSingle();

    if (namespaceError || !namespaceData) {
      return NextResponse.json(
        {
          exists: false,
          tables: [],
          hasUsersTable: false,
          error: "Auth schema not found or insufficient permissions",
        },
        { status: 200 }
      );
    }

    // Then get tables in auth schema
    const { data: tablesData, error: tablesError } = await supabase
      .from("information_schema.tables")
      .select("table_name")
      .eq("table_schema", "auth");

    if (tablesError) {
      return NextResponse.json(
        {
          exists: true,
          tables: [],
          hasUsersTable: false,
          error: "Could not query auth schema tables",
        },
        { status: 200 }
      );
    }

    const tables = tablesData.map((t) => t.table_name);
    const hasUsersTable = tables.includes("users");

    return NextResponse.json(
      {
        exists: true,
        tables,
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
        error: "Server error: " + error.message,
      },
      { status: 500 }
    );
  }
}
