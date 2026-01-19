"use client";

import { Send, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { applyToGig } from "./actions";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useSupabase } from "@/lib/hooks/use-supabase";

interface ApplyToGigFormProps {
  gig: {
    id: string;
    title: string;
    description: string;
    location: string;
    compensation: string;
    category?: string;
    date?: string;
    image_url: string | null;
    client_id: string;
  };
}

export function ApplyToGigForm({ gig }: ApplyToGigFormProps) {
  const router = useRouter();
  const supabase = useSupabase();

  const [coverLetter, setCoverLetter] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  async function handleApply(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError("");

    // Hard guard: prevent any Supabase calls if client is null
    // In production, this should never happen (client throws on init)
    // In development, show clear error message
    if (!supabase) {
      const errorMsg = 
        process.env.NODE_ENV === "production"
          ? "Application error: Database connection unavailable. Please contact support."
          : "Database connection not available. Check NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in .env.local";
      
      console.error("[ApplyToGigForm] Supabase client is null", {
        nodeEnv: process.env.NODE_ENV,
        hasUrl: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
        hasKey: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      });
      
      setError(errorMsg);
      setSubmitting(false);
      return;
    }

    try {
      // Get current user
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError || !user) {
        console.error("[ApplyToGigForm] Auth error:", userError);
        setError("You must be logged in to apply for gigs.");
        setSubmitting(false);
        return;
      }

      // Double-check if already applied
      // Guard: ensure supabase client is still valid before query
      if (!supabase) {
        setError("Session expired. Please refresh the page.");
        setSubmitting(false);
        return;
      }

      // Use maybeSingle() since application might not exist yet
      const { data: existingApplication, error: queryError } = await supabase
        .from("applications")
        .select("id")
        .eq("gig_id", gig.id)
        .eq("talent_id", user.id)
        .maybeSingle();

      // Handle query errors (including missing apikey header)
      if (queryError) {
        const errorDetails = {
          code: queryError.code,
          message: queryError.message,
          details: queryError.details,
          hint: queryError.hint,
          gigId: gig.id,
        };

        console.error("[ApplyToGigForm] Query error:", errorDetails);

        // Send to Sentry with full context
        const Sentry = await import("@sentry/nextjs");
        Sentry.captureException(queryError, {
          tags: {
            feature: "application-check",
            error_type: "supabase_query_error",
            error_code: queryError.code || "UNKNOWN",
            supabase_env_present: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
          },
          extra: {
            ...errorDetails,
            userId: user.id,
            userEmail: user.email,
            hasSupabaseClient: !!supabase,
          },
          level: "error",
        });

        // Check for missing API key error specifically
        if (queryError.message?.includes("No API key found") || queryError.message?.includes("apikey")) {
          setError(
            "Configuration error: Database connection failed. " +
            "Please refresh the page. If the problem persists, contact support."
          );
        } else {
          setError("Failed to check application status. Please try again.");
        }
        
        setSubmitting(false);
        return;
      }

      if (existingApplication) {
        setError("You have already applied for this gig.");
        setSubmitting(false);
        return;
      }

      // Submit application using server action
      const result = await applyToGig({
        gigId: gig.id,
        message: coverLetter.trim() || null,
      });

      if (result.error) {
        setError(result.error);
        setSubmitting(false);
        return;
      }

      // Success! Redirect to dashboard with success message
      router.push("/talent/dashboard?applied=success");
    } catch (err) {
      // Enhanced error logging for production debugging
      const errorMessage = err instanceof Error ? err.message : String(err);
      const errorStack = err instanceof Error ? err.stack : undefined;
      
      console.error("[ApplyToGigForm] Unexpected error:", {
        error: err,
        message: errorMessage,
        stack: errorStack,
        gigId: gig.id,
        hasSupabase: !!supabase,
      });

      // Send to Sentry with full context
      const Sentry = await import("@sentry/nextjs");
      Sentry.captureException(err instanceof Error ? err : new Error(errorMessage), {
        tags: {
          feature: "application-submission",
          error_type: "unexpected_error",
          supabase_env_present: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
        },
        extra: {
          message: errorMessage,
          stack: errorStack,
          gigId: gig.id,
          hasSupabase: !!supabase,
          release: process.env.NEXT_PUBLIC_VERCEL_GIT_COMMIT_SHA || "unknown",
        },
        level: "error",
      });
      
      // User-friendly error message
      const userMessage = err instanceof Error && err.message.includes("NEXT_PUBLIC_SUPABASE")
        ? "Configuration error: Please refresh the page. If the problem persists, contact support."
        : "An unexpected error occurred. Please try again.";
      
      setError(userMessage);
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleApply} className="space-y-6">
      <div className="space-y-2">
        <label htmlFor="coverLetter" className="text-sm font-medium text-white">
          Cover Letter (Optional)
        </label>
        <Textarea
          id="coverLetter"
          value={coverLetter}
          onChange={(e) => setCoverLetter(e.target.value)}
          placeholder="Tell the client why you're perfect for this gig. Include any relevant experience, availability, or special skills..."
          className="min-h-[120px] bg-gray-800 border-gray-600 text-white placeholder-gray-400"
          maxLength={1000}
        />
        <p className="text-xs text-gray-400">{coverLetter.length}/1000 characters</p>
      </div>

      <div className="flex gap-3">
        <Button type="submit" disabled={submitting} className="flex-1 button-glow border-0">
          {submitting ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Submitting...
            </>
          ) : (
            <>
              <Send className="h-4 w-4 mr-2" />
              Submit Application
            </>
          )}
        </Button>
        <Button
          type="button"
          variant="outline"
          disabled={submitting}
          onClick={() => router.push(`/gigs/${gig.id}`)}
          className="border-gray-600 text-gray-300 hover:bg-gray-800"
        >
          Cancel
        </Button>
      </div>

      {error && (
        <Alert variant="destructive" className="bg-red-500/10 border-red-500/20">
          <AlertDescription className="text-red-300">{error}</AlertDescription>
        </Alert>
      )}
    </form>
  );
}
