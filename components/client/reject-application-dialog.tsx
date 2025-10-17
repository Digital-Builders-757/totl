"use client";

import { XCircle, FileText, Loader2 } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { rejectApplication } from "@/lib/actions/booking-actions";

interface RejectApplicationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  applicationId: string;
  talentName: string;
  gigTitle: string;
  onSuccess?: () => void;
}

export function RejectApplicationDialog({
  open,
  onOpenChange,
  applicationId,
  talentName,
  gigTitle,
  onSuccess,
}: RejectApplicationDialogProps) {
  const [loading, setLoading] = useState(false);
  const [reason, setReason] = useState("");
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const result = await rejectApplication({
        applicationId,
        reason: reason || undefined,
      });

      if (result.error) {
        setError(result.error);
      } else {
        onOpenChange(false);
        onSuccess?.();
        // Reset form
        setReason("");
      }
    } catch (err) {
      setError("An unexpected error occurred");
      console.error("Reject application error:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] bg-gray-900 border-gray-700 text-white">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-white">
            <XCircle className="h-5 w-5 text-red-500" />
            Reject Application
          </DialogTitle>
          <DialogDescription className="text-gray-300">
            Reject <span className="font-semibold">{talentName}</span>&apos;s application
            for <span className="font-semibold">{gigTitle}</span>.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit}>
          <div className="space-y-4 py-4">
            {/* Reason */}
            <div className="space-y-2">
              <Label htmlFor="reason" className="flex items-center gap-2 text-gray-200">
                <FileText className="h-4 w-4" />
                Reason (Optional)
              </Label>
              <Textarea
                id="reason"
                placeholder="Optionally provide a reason for rejection..."
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                rows={4}
                className="bg-gray-800 border-gray-600 text-white resize-none"
              />
              <p className="text-sm text-gray-400">
                This reason will be recorded for internal tracking
              </p>
            </div>

            {error && (
              <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-md">
                <p className="text-sm text-red-400">{error}</p>
              </div>
            )}

            <div className="p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-md">
              <p className="text-sm text-yellow-400">
                ⚠️ This action will mark the application as rejected and cannot be undone.
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
              className="border-gray-600 text-gray-300 hover:bg-gray-800"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={loading}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Rejecting...
                </>
              ) : (
                <>
                  <XCircle className="h-4 w-4 mr-2" />
                  Reject Application
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

