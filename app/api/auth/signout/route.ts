import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { createSupabaseServer } from "@/lib/supabase/supabase-server";

export async function POST() {
  const supabase = await createSupabaseServer();
  
  // Sign out from Supabase (clears server-side session)
  await supabase.auth.signOut();
  
  // Clear all Supabase-related cookies explicitly
  const cookieStore = await cookies();
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  
  if (supabaseUrl) {
    const projectRef = supabaseUrl.split("//")[1].split(".")[0];
    const cookieBaseName = `sb-${projectRef}-auth-token`;
    
    // Clear all cookie chunks (up to 20 to be safe)
    for (let i = 0; i < 20; i++) {
      const chunkName = i === 0 ? cookieBaseName : `${cookieBaseName}.${i}`;
      cookieStore.delete(chunkName);
    }
    
    // Clear other Supabase cookie patterns
    ["sb-access-token", "sb-refresh-token", "sb-user-token"].forEach((name) => {
      cookieStore.delete(name);
      for (let i = 0; i < 20; i += 1) {
        const chunkName = i === 0 ? name : `${name}.${i}`;
        cookieStore.delete(chunkName);
      }
    });
  }
  
  const response = NextResponse.json({ success: true });
  
  // Set cache headers to prevent caching of sign out response
  response.headers.set("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate");
  response.headers.set("Pragma", "no-cache");
  response.headers.set("Expires", "0");
  
  return response;
}
