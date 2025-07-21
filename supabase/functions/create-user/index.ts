// Follow this setup guide to integrate the Deno language server with your editor:
// https://deno.land/manual/getting_started/setup_your_environment
// This enables autocomplete, go to definition, etc.

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      // Supabase API URL - env var exported by default.
      Deno.env.get("SUPABASE_URL") ?? "",
      // Supabase API SERVICE ROLE KEY - env var exported by default.
      // WARNING: The service key has admin privileges and should only be used in secure server environments!
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    // Get the request body
    const { email, password, firstName, lastName, role } = await req.json();

    console.log(`Creating user with email: ${email}, role: ${role}`);

    // Create the user
    const { data: userData, error: createUserError } = await supabaseClient.auth.admin.createUser({
      email,
      password,
      email_confirm: true, // Skip email verification
      user_metadata: {
        first_name: firstName,
        last_name: lastName,
        role,
      },
    });

    if (createUserError) {
      console.error("Error creating user:", createUserError);
      return new Response(
        JSON.stringify({ error: `Failed to create user: ${createUserError.message}` }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 400,
        }
      );
    }

    const userId = userData.user.id;

    // Create profile record
    const { error: profileError } = await supabaseClient.from("profiles").insert([
      {
        id: userId,
        first_name: firstName,
        last_name: lastName,
        display_name: `${firstName} ${lastName}`,
        role,
        email_verified: true,
        updated_at: new Date().toISOString(),
      },
    ]);

    if (profileError) {
      console.error("Error creating profile:", profileError);
      // Continue anyway since the auth account was created
    }

    // Create role-specific profile if needed
    if (role === "talent") {
      const { error: talentProfileError } = await supabaseClient.from("talent_profiles").insert([
        {
          user_id: userId,
          first_name: firstName,
          last_name: lastName,
        },
      ]);

      if (talentProfileError) {
        console.error("Error creating talent profile:", talentProfileError);
      }
    } else if (role === "client") {
      const { error: clientProfileError } = await supabaseClient.from("client_profiles").insert([
        {
          user_id: userId,
          company_name: `${firstName} ${lastName}'s Company`,
        },
      ]);

      if (clientProfileError) {
        console.error("Error creating client profile:", clientProfileError);
      }
    }

    return new Response(JSON.stringify({ success: true, user: userData.user }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    console.error("Unexpected error:", error);
    return new Response(JSON.stringify({ error: `Unexpected error: ${error.message}` }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
