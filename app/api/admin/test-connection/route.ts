import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const publicVars = !!(
      process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    );
    const serviceVars = !!(process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY);

    // Test connection with service role key if available
    if (serviceVars) {
      const supabaseAdmin = createClient(
        process.env.SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!,
        {
          auth: {
            autoRefreshToken: false,
            persistSession: false,
          },
        }
      );

      // FIXED: Removed aggregate function (count), now just selecting a single row
      const { error } = await supabaseAdmin.from("profiles").select("id").limit(1);

      if (error) {
        return NextResponse.json(
          {
            connected: false,
            error: `Service role connection error: ${error.message}`,
            publicVars,
            serviceVars,
          },
          { status: 200 }
        );
      }

      return NextResponse.json(
        {
          connected: true,
          publicVars,
          serviceVars,
        },
        { status: 200 }
      );
    } else if (publicVars) {
      // Fall back to anon key if service role not available
      const supabaseClient = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
      );

      // FIXED: Removed aggregate function (count), now just selecting a single row
      const { error } = await supabaseClient.from("profiles").select("id").limit(1);

      if (error) {
        return NextResponse.json(
          {
            connected: false,
            error: `Anon key connection error: ${error.message}`,
            publicVars,
            serviceVars,
          },
          { status: 200 }
        );
      }

      return NextResponse.json(
        {
          connected: true,
          publicVars,
          serviceVars,
        },
        { status: 200 }
      );
    } else {
      return NextResponse.json(
        {
          connected: false,
          error: "Missing Supabase environment variables",
          publicVars,
          serviceVars,
        },
        { status: 200 }
      );
    }
  } catch (error) {
    console.error("Error testing connection:", error);
    return NextResponse.json(
      {
        connected: false,
        error: `Server error: ${error instanceof Error ? error.message : "Unknown error"}`,
        publicVars: false,
        serviceVars: false,
      },
      { status: 500 }
    );
  }
}
