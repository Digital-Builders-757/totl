// Follow this setup guide to integrate the Deno language server with your editor:
// https://deno.land/manual/getting_started/setup_your_environment
// This enables autocomplete, go to definition, etc.

import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      // Supabase API URL - env var exported by default.
      Deno.env.get("SUPABASE_URL") ?? "",
      // Supabase API SERVICE ROLE KEY - env var exported by default.
      // WARNING: The service key has admin privileges and should only be used in secure server environments!
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    )

    // Check if auth schema exists
    const { data: schemaData, error: schemaError } = await supabaseClient
      .from("pg_catalog.pg_namespace")
      .select("nspname")
      .eq("nspname", "auth")
      .single()

    if (schemaError) {
      return new Response(
        JSON.stringify({
          exists: false,
          tables: [],
          has_users_table: false,
          error: schemaError.message,
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 200,
        },
      )
    }

    // Get tables in auth schema
    const { data: tablesData, error: tablesError } = await supabaseClient
      .from("pg_catalog.pg_tables")
      .select("tablename")
      .eq("schemaname", "auth")

    if (tablesError) {
      return new Response(
        JSON.stringify({
          exists: true,
          tables: [],
          has_users_table: false,
          error: tablesError.message,
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 200,
        },
      )
    }

    const tables = tablesData.map((t) => t.tablename)
    const hasUsersTable = tables.includes("users")

    return new Response(
      JSON.stringify({
        exists: true,
        tables,
        has_users_table: hasUsersTable,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      },
    )
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    })
  }
})
