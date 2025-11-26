"use client";

import { Flag, Loader2 } from "lucide-react";
import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/use-toast";
import { flagProfileAction } from "@/lib/actions/moderation-actions";

const DEFAULT_REASONS = [
  "Fake or impersonated profile",
  "Inappropriate content",
  "Harassment or discrimination",
  "Spam or fraudulent activity",
  "Other",
];

type FlagProfileDialogProps = {
  profileId: string;
  profileType: "talent_profile" | "client_profile";
  disabled?: boolean;
};

export function FlagProfileDialog({ profileId, profileType, disabled }: FlagProfileDialogProps) {
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [customReason, setCustomReason] = useState("");
  const [details, setDetails] = useState("");
  const { toast } = useToast();
  const [isPending, startTransition] = useTransition();

  const selectedReason = reason === "custom" ? customReason : reason;

  const handleSubmit = () => {
    if (!selectedReason?.trim()) {
      toast({
        title: "Reason required",
        description: "Please select or provide a reason for reporting this profile.",
        variant: "destructive",
      });
      return;
    }

    startTransition(async () => {
      const result = await flagProfileAction({
        profileId,
        profileType,
        reason: selectedReason,
        details,
      });

      if (result.error) {
        toast({
          title: "Unable to submit report",
          description: result.error,
          variant: "destructive",
        });
        return;
      }

      toast({
        title: "Report submitted",
        description: "Our moderation team will review this profile shortly.",
      });
      setReason("");
      setCustomReason("");
      setDetails("");
      setOpen(false);
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          className="w-full border-gray-300 text-gray-700 hover:bg-gray-100"
          disabled={disabled}
        >
          <Flag className="mr-2 h-4 w-4" />
          Report this profile
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Report this profile</DialogTitle>
          <DialogDescription>
            Tell us what feels off about this account. We&apos;ll review it and take action if needed.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          <div className="space-y-2">
            <Label>What&apos;s the issue?</Label>
            <div className="space-y-3">
              {DEFAULT_REASONS.map((preset) => (
                <label
                  key={preset}
                  className={`flex cursor-pointer items-center space-x-3 rounded-xl border p-3 text-sm transition ${
                    reason === preset ? "border-black bg-gray-50" : "border-gray-200"
                  }`}
                >
                  <input
                    type="radio"
                    className="h-4 w-4 border-gray-400"
                    name="flag-profile-reason"
                    value={preset}
                    checked={reason === preset}
                    onChange={() => setReason(preset)}
                  />
                  <span>{preset}</span>
                </label>
              ))}
              <label
                className={`block rounded-xl border p-3 text-sm transition ${
                  reason === "custom" ? "border-black bg-gray-50" : "border-gray-200"
                }`}
              >
                <div className="flex items-center space-x-3">
                  <input
                    type="radio"
                    className="h-4 w-4 border-gray-400"
                    name="flag-profile-reason"
                    value="custom"
                    checked={reason === "custom"}
                    onChange={() => setReason("custom")}
                  />
                  <span>Other (please specify)</span>
                </div>
                {reason === "custom" && (
                  <Textarea
                    placeholder="Describe the issue"
                    value={customReason}
                    onChange={(event) => setCustomReason(event.target.value)}
                    className="mt-3"
                  />
                )}
              </label>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="profile-flag-details">Additional details (optional)</Label>
            <Textarea
              id="profile-flag-details"
              placeholder="Share any extra context that might help our moderation team."
              value={details}
              onChange={(event) => setDetails(event.target.value)}
              rows={4}
            />
          </div>
        </div>

        <DialogFooter className="flex flex-col gap-2 sm:flex-row sm:justify-end">
          <Button variant="outline" onClick={() => setOpen(false)} disabled={isPending}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={isPending}>
            {isPending ? (
              <span className="inline-flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                Submitting...
              </span>
            ) : (
              "Submit report"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

