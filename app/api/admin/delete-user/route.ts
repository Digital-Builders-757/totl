import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { createClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

export const POST = async (request: Request) => {
  const { userId } = await request.json();

  if (!userId) {
    return NextResponse.json({ error: "User ID is required." }, { status: 400 });
  }

  const supabase = createRouteHandlerClient({ cookies });

  // First, get the current session to ensure the user making the request
  // is authenticated. You could add more checks here, e.g., only an admin
  // or the user themselves can trigger this.
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  // Now, create a privileged Supabase client using the service role key
  // to perform the deletion.
  const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const { error } = await supabaseAdmin.auth.admin.deleteUser(userId);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({
    message: "User deleted successfully.",
  });
};
