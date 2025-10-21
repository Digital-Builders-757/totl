"use client";

import { CheckCircle2, Calendar, DollarSign, FileText, Loader2 } from "lucide-react";
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { acceptApplication } from "@/lib/actions/booking-actions";

interface AcceptApplicationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  applicationId: string;
  talentName: string;
  gigTitle: string;
  suggestedCompensation?: string;
  onSuccess?: () => void;
}

export function AcceptApplicationDialog({
  open,
  onOpenChange,
  applicationId,
  talentName,
  gigTitle,
  suggestedCompensation,
  onSuccess,
}: AcceptApplicationDialogProps) {
  const [loading, setLoading] = useState(false);
  const [date, setDate] = useState("");
  const [compensation, setCompensation] = useState(suggestedCompensation || "");
  const [notes, setNotes] = useState("");
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const compensationNumber = compensation
        ? parseFloat(compensation.replace(/[^0-9.-]/g, ""))
        : undefined;

      const result = await acceptApplication({
        applicationId,
        date: date || undefined,
        compensation: compensationNumber,
        notes: notes || undefined,
      });

      if (result.error) {
        setError(result.error);
      } else {
        onOpenChange(false);
        onSuccess?.();
        // Reset form
        setDate("");
        setCompensation(suggestedCompensation || "");
        setNotes("");
      }
    } catch (err) {
      setError("An unexpected error occurred");
      console.error("Accept application error:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] bg-gray-900 border-gray-700 text-white">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-white">
            <CheckCircle2 className="h-5 w-5 text-green-500" />
            Accept Application
          </DialogTitle>
          <DialogDescription className="text-gray-300">
            Accept <span className="font-semibold">{talentName}</span> for{" "}
            <span className="font-semibold">{gigTitle}</span> and create a booking.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit}>
          <div className="space-y-4 py-4">
            {/* Date */}
            <div className="space-y-2">
              <Label htmlFor="date" className="flex items-center gap-2 text-gray-200">
                <Calendar className="h-4 w-4" />
                Booking Date
              </Label>
              <Input
                id="date"
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="bg-gray-800 border-gray-600 text-white"
                min={new Date().toISOString().split("T")[0]}
              />
              <p className="text-sm text-gray-400">
                Leave empty to default to 7 days from now
              </p>
            </div>

            {/* Compensation */}
            <div className="space-y-2">
              <Label htmlFor="compensation" className="flex items-center gap-2 text-gray-200">
                <DollarSign className="h-4 w-4" />
                Compensation
              </Label>
              <Input
                id="compensation"
                type="text"
                placeholder="e.g., 5000 or $5,000"
                value={compensation}
                onChange={(e) => setCompensation(e.target.value)}
                className="bg-gray-800 border-gray-600 text-white"
              />
              <p className="text-sm text-gray-400">
                Final agreed compensation amount
              </p>
            </div>

            {/* Notes */}
            <div className="space-y-2">
              <Label htmlFor="notes" className="flex items-center gap-2 text-gray-200">
                <FileText className="h-4 w-4" />
                Booking Notes (Optional)
              </Label>
              <Textarea
                id="notes"
                placeholder="Additional details, requirements, or instructions..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={4}
                className="bg-gray-800 border-gray-600 text-white resize-none"
              />
            </div>

            {error && (
              <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-md">
                <p className="text-sm text-red-400">{error}</p>
              </div>
            )}
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
              className="button-glow border-0"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Creating Booking...
                </>
              ) : (
                <>
                  <CheckCircle2 className="h-4 w-4 mr-2" />
                  Accept & Create Booking
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

