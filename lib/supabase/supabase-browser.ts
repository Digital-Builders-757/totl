// lib/supabase-browser.ts
"use client";

import { createBrowserClient } from "@supabase/ssr";
import type { Database } from "@/types/supabase";

let client: ReturnType<typeof createBrowserClient<Database>> | null = null;

export function createSupabaseBrowser() {
  // Only create client on client-side
  if (typeof window === 'undefined') {
    return null;
  }

  if (client) return client;

  // Check if environment variables are available
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    console.warn('Supabase environment variables not found - using fallback auth provider');
    return null;
  }

  client = createBrowserClient<Database>(
    supabaseUrl,
    supabaseAnonKey,
    {
      cookies: {
        getAll: () => {
          if (typeof document === 'undefined') return [];
          return document.cookie.split(";").map((c) => {
            const [name, ...rest] = c.trim().split("=");
            return { name, value: rest.join("=") };
          });
        },
        setAll: (cookies) => {
          if (typeof document === 'undefined') return;
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
