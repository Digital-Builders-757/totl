// lib/supabase-browser.ts
"use client";

import { createBrowserClient } from "@supabase/ssr";
import type { Database } from "@/types/supabase";

let client: ReturnType<typeof createBrowserClient<Database>> | null = null;

export function createSupabaseBrowser() {
  if (client) return client;

  client = createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () =>
          document.cookie.split(";").map((c) => {
            const [name, ...rest] = c.trim().split("=");
            return { name, value: rest.join("=") };
          }),
        setAll: (cookies) => {
          cookies.forEach(({ name, value, options }) => {
            let cookieString = `${name}=${value}`;
            if (options?.maxAge) cookieString += `; Max-Age=${options.maxAge}`;
            if (options?.path) cookieString += `; Path=${options.path}`;
            if (options?.domain) cookieString += `; Domain=${options.domain}`;
            if (options?.secure) cookieString += `; Secure`;
            if (options?.httpOnly) cookieString += `; HttpOnly`;
            if (options?.sameSite) cookieString += `; SameSite=${options.sameSite}`;
            document.cookie = cookieString;
          });
        },
      },
    }
  );

  return client;
}
