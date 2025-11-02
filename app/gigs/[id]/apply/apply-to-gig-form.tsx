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

    try {
      // Get current user
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError || !user) {
        setError("You must be logged in to apply for gigs.");
        setSubmitting(false);
        return;
      }

      // Double-check if already applied
      const { data: existingApplication } = await supabase
        .from("applications")
        .select("id")
        .eq("gig_id", gig.id)
        .eq("talent_id", user.id)
        .single();

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
      console.error("Error submitting application:", err);
      setError("An unexpected error occurred. Please try again.");
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
