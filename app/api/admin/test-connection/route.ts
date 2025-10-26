import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase-client";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/types/supabase";

export async function GET(request: NextRequest) {
  try {
    // Check environment variables
    const publicVars = !!(
      process.env.NEXT_PUBLIC_SUPABASE_URL && 
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    );
    
    const serviceVars = !!(
      process.env.NEXT_PUBLIC_SUPABASE_URL && 
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );

    if (!publicVars) {
      return NextResponse.json({
        connected: false,
        error: "Missing public environment variables (NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY)",
        publicVars: false,
        serviceVars: false,
      });
    }

    // Test connection with anon key
    const supabase = createClient<Database>(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    // Test basic connection by querying a simple table
    const { data, error } = await supabase
      .from('profiles')
      .select('id')
      .limit(1);

    if (error) {
      return NextResponse.json({
        connected: false,
        error: `Database connection failed: ${error.message}`,
        publicVars,
        serviceVars,
      });
    }

    return NextResponse.json({
      connected: true,
      error: null,
      publicVars,
      serviceVars,
      testQuery: data,
    });

  } catch (error) {
    console.error("Connection test error:", error);
    return NextResponse.json({
      connected: false,
      error: error instanceof Error ? error.message : "Unknown error occurred",
      publicVars: false,
      serviceVars: false,
    });
  }
}