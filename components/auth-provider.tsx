"use client";

import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import type { SupabaseClient, User, Session, AuthError } from "@supabase/supabase-js";
import { useRouter } from "next/navigation";
import type React from "react";

import { createContext, useContext, useEffect, useState } from "react";
import { createSupabaseAdminClient } from "@/lib/supabase-admin-client";
import type { Database } from "@/types/supabase";

type UserRole = "talent" | "client" | "admin" | null;

type SignUpOptions = {
  data?: Record<string, unknown>;
  emailRedirectTo?: string;
};

type AuthContextType = {
  supabase: SupabaseClient<Database>;
  user: User | null;
  session: Session | null;
  userRole: UserRole;
  isLoading: boolean;
  isEmailVerified: boolean;
  signIn: (email: string, password: string) => Promise<{ error: AuthError | null }>;
  signUp: (
    email: string,
    password: string,
    options?: SignUpOptions
  ) => Promise<{ error: AuthError | null }>;
  signOut: () => Promise<{ error: AuthError | null }>;
  sendVerificationEmail: () => Promise<{ error: Error | null }>;
  resetPassword: (email: string) => Promise<{ error: AuthError | null }>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const supabase = createClientComponentClient<Database>();
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [userRole, setUserRole] = useState<UserRole>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isEmailVerified, setIsEmailVerified] = useState(false);
  const router = useRouter();

  useEffect(() => {
    // This immediately handles the initial session check, and the listener will take over from there.
    const initialSession = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      // If there is no session on initial load, we can stop loading.
      // The listener will handle the case where the user signs in.
      if (!session) {
        setIsLoading(false);
        router.push("/login");
        return;
      }

      // If there is a session, proceed to set user and fetch profile
      setUser(session.user);
      const { data: profile } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", session.user.id)
        .single();
      const role = profile?.role as UserRole;
      setUserRole(role);
      setIsLoading(false); // Stop loading after initial fetch
    };

    initialSession();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      setIsLoading(true); // Start loading on any auth change
      setSession(session);
      setUser(session?.user ?? null);

      if (event === "SIGNED_IN" && session) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("role")
          .eq("id", session.user.id)
          .single();

        const role = profile?.role as UserRole;
        setUserRole(role);
        setIsEmailVerified(session.user.email_confirmed_at !== null);

        // Redirect based on role
        if (role === "talent") {
          router.push("/admin/talentdashboard");
        } else if (role === "client") {
          router.push("/admin/dashboard");
        } else if (role === "admin") {
          router.push("/admin/dashboard");
        } else {
          // If no role, perhaps go to a role selection or onboarding page
          router.push("/choose-role");
        }
      } else if (event === "SIGNED_OUT") {
        setUser(null);
        setSession(null);
        setUserRole(null);
        setIsEmailVerified(false);
        router.push("/login");
      }
      setIsLoading(false); // Stop loading after handling the auth event
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [supabase, router]);

  const signIn = async (email: string, password: string): Promise<{ error: AuthError | null }> => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    return { error };
  };

  const signUp = async (
    email: string,
    password: string,
    options?: SignUpOptions
  ): Promise<{ error: AuthError | null }> => {
    const { error } = await supabase.auth.signUp({
      email,
      password,
      ...options,
    });
    return { error };
  };

  const signOut = async (): Promise<{ error: AuthError | null }> => {
    const { error } = await supabase.auth.signOut();
    setUser(null);
    setSession(null);
    setUserRole(null);
    setIsEmailVerified(false);
    router.push("/login");
    return { error };
  };

  const sendVerificationEmail = async (): Promise<{ error: Error | null }> => {
    if (!user?.email) {
      return { error: new Error("No user email found") };
    }

    try {
      // 1. Generate new verification link
      const supabaseAdmin = createSupabaseAdminClient();
      const { data: linkData, error: linkError } = await supabaseAdmin.auth.admin.generateLink({
        type: "signup",
        email: user.email,
        password: "",
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
        },
      });

      if (linkError || !linkData.properties?.action_link) {
        return { error: linkError ?? new Error("No action link returned") };
      }

      // 2. Send custom verification email
      const response = await fetch("/api/email/send-verification", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: user.email,
          userId: user.id,
          verificationUrl: linkData.properties.action_link,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to send verification email");
      }

      return { error: null };
    } catch (err) {
      console.error("Error sending verification email:", err);
      return { error: err instanceof Error ? err : new Error("Unknown error") };
    }
  };

  const resetPassword = async (email: string): Promise<{ error: AuthError | null }> => {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/update-password`,
    });
    return { error };
  };

  const value = {
    supabase,
    user,
    session,
    userRole,
    isLoading,
    isEmailVerified,
    signIn,
    signUp,
    signOut,
    sendVerificationEmail,
    resetPassword,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}

export function useSupabaseStatus() {
  const [isSupabaseConnected, setIsSupabaseConnected] = useState(true);

  const checkConnection = async () => {
    try {
      const supabaseAdmin = createSupabaseAdminClient();
      const { error } = await supabaseAdmin.from("profiles").select("id").limit(1);

      if (error) {
        throw error;
      }
      setIsSupabaseConnected(true);
    } catch {
      setIsSupabaseConnected(false);
    }
  };

  return { isSupabaseConnected, checkConnection };
}


