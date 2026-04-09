"use client";

// NOTE: This component is shared by both /post-gig (legacy alias) and /client/post-gig (canonical).

import { ArrowLeft, AlertCircle } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type React from "react";
import { useState } from "react";

import { createGigAction, updateGigAction } from "./actions";
import { useAuth } from "@/components/auth/auth-provider";
import { GigImageUploader } from "@/components/gigs/gig-image-uploader";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/use-toast";
import { VISIBLE_GIG_CATEGORIES, getCategoryLabel } from "@/lib/constants/gig-categories";
import { logger } from "@/lib/utils/logger";

const emptyForm = {
  title: "",
  description: "",
  category: "",
  location: "",
  compensation: "",
  duration: "",
  date: "",
  application_deadline: "",
};

export type PostGigClientProps = {
  mode?: "create" | "edit";
  gigId?: string;
  initialValues?: typeof emptyForm;
  hasApplications?: boolean;
  editLocked?: boolean;
  editLockedReason?: string;
};

export function PostGigClient({
  mode = "create",
  gigId,
  initialValues,
  hasApplications = false,
  editLocked = false,
  editLockedReason,
}: PostGigClientProps = {}) {
  const router = useRouter();
  const { user } = useAuth();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState(() => initialValues ?? emptyForm);
  const [imageFile, setImageFile] = useState<File | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { id, value } = e.target;
    setFormData((prev) => ({ ...prev, [id]: value }));
  };

  const handleSelectChange = (value: string) => {
    setFormData((prev) => ({ ...prev, category: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    if (!user) {
      setError(
        mode === "edit"
          ? "You must be logged in to edit an opportunity"
          : "You must be logged in to post an opportunity"
      );
      setIsSubmitting(false);
      return;
    }

    try {
      if (mode === "edit") {
        if (!gigId) throw new Error("Missing opportunity identifier");
        const result = await updateGigAction({
          gigId,
          title: formData.title,
          description: formData.description,
          category: formData.category,
          location: formData.location,
          compensation: formData.compensation,
          duration: formData.duration,
          date: formData.date,
          application_deadline: formData.application_deadline || null,
        });
        if (!result.ok) throw new Error(result.error);
        toast({
          title: "Opportunity updated",
          description: "Your changes have been saved.",
        });
      } else {
        const result = await createGigAction({
          title: formData.title,
          description: formData.description,
          category: formData.category,
          location: formData.location,
          compensation: formData.compensation,
          duration: formData.duration,
          date: formData.date,
          application_deadline: formData.application_deadline || null,
          imageFile: imageFile,
        });

        if (!result.ok) throw new Error(result.error);

        toast({
          title: "Opportunity Posted Successfully!",
          description: "Your opportunity has been created and is now visible to talent.",
        });
      }

      router.push("/client/dashboard");
    } catch (err) {
      logger.error(mode === "edit" ? "Error updating gig" : "Error creating gig", err);
      setError(
        err instanceof Error
          ? err.message
          : mode === "edit"
            ? "Failed to update opportunity"
            : "Failed to create opportunity"
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen">
        <div className="container mx-auto px-4 py-12">
          <div className="max-w-md mx-auto text-center">
            <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-foreground mb-2">Authentication Required</h2>
            <p className="text-muted-foreground mb-4">You must be logged in to post a gig.</p>
            <Button asChild>
              <Link href="/login">Log In</Link>
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (editLocked) {
    return (
      <div className="min-h-screen">
        <div className="container mx-auto px-4 py-12">
          <Link
            href="/client/dashboard"
            className="inline-flex items-center text-muted-foreground hover:text-foreground mb-8 transition-colors"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Dashboard
          </Link>

          <div className="max-w-3xl mx-auto rounded-3xl border border-border bg-card/80 shadow-2xl shadow-black/40 backdrop-blur overflow-hidden">
            <div className="p-10 space-y-6">
              <h1 className="text-2xl font-bold text-foreground">Editing unavailable</h1>
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  {editLockedReason ??
                    "This opportunity can’t be edited right now. Return to your dashboard for other actions."}
                </AlertDescription>
              </Alert>
              <Button asChild>
                <Link href="/client/dashboard">Back to Dashboard</Link>
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const isEdit = mode === "edit";

  return (
    <div className="min-h-screen" data-testid={isEdit ? "edit-gig-page" : undefined}>
      <div className="container mx-auto px-4 py-12">
        <Link
          href="/client/dashboard"
          className="inline-flex items-center text-muted-foreground hover:text-foreground mb-8 transition-colors"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Dashboard
        </Link>

        <div className="max-w-3xl mx-auto rounded-3xl border border-border bg-card/80 shadow-2xl shadow-black/40 backdrop-blur overflow-hidden">
          <div className="p-10 space-y-8">
            <div className="space-y-3">
              <h1 className="text-3xl font-bold text-foreground">
                {isEdit ? "Edit opportunity" : "Post a New Opportunity"}
              </h1>
              <p className="text-muted-foreground">
                {isEdit
                  ? "Update the details below. Changes apply immediately for talent viewing this opportunity."
                  : "Fill out the form below to create a new casting call or opportunity. Be as detailed as possible to attract the right talent."}
              </p>
            </div>

            {isEdit && hasApplications && (
              <Alert className="border-amber-500/50 bg-amber-500/10">
                <AlertCircle className="h-4 w-4 text-amber-600" />
                <AlertDescription className="text-amber-950 dark:text-amber-100">
                  This opportunity already has applications. Applicants may have relied on the original
                  details—review changes carefully so talent aren’t surprised.
                </AlertDescription>
              </Alert>
            )}

            {error && (
              <Alert variant="destructive" className="mb-6">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <form className="space-y-6" onSubmit={handleSubmit} data-testid={isEdit ? "edit-gig-form" : undefined}>
              <div className="space-y-2">
                <Label htmlFor="title">Opportunity Title *</Label>
                <Input
                  id="title"
                  data-testid="title"
                  placeholder="e.g., Fashion Editorial Model Needed"
                  value={formData.title}
                  onChange={handleChange}
                  required
                  className="bg-background text-foreground placeholder:text-muted-foreground/70"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description *</Label>
                <Textarea
                  id="description"
                  placeholder="Provide a detailed description of the opportunity, requirements, and what you're looking for..."
                  value={formData.description}
                  onChange={handleChange}
                  rows={4}
                  required
                  className="bg-background text-foreground placeholder:text-muted-foreground/70"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="category">Opportunity Type *</Label>
                  <Select value={formData.category} onValueChange={handleSelectChange}>
                    <SelectTrigger
                      id="category"
                      className="bg-background text-foreground placeholder:text-muted-foreground/70"
                    >
                      <SelectValue placeholder="Select opportunity type" />
                    </SelectTrigger>
                    <SelectContent>
                      {VISIBLE_GIG_CATEGORIES.map((category) => (
                        <SelectItem key={category} value={category}>
                          {getCategoryLabel(category)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="location">Location *</Label>
                  <Input
                    id="location"
                    placeholder="e.g., New York, NY"
                    value={formData.location}
                    onChange={handleChange}
                    required
                    className="bg-background text-foreground placeholder:text-muted-foreground/70"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="duration">Duration *</Label>
                  <Input
                    id="duration"
                    placeholder="e.g., 1 Day Shoot, 3 Days, etc."
                    value={formData.duration}
                    onChange={handleChange}
                    required
                    className="bg-background text-foreground placeholder:text-muted-foreground/70"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="compensation">Compensation *</Label>
                  <Input
                    id="compensation"
                    placeholder="e.g., $1,200, $500-$800, etc."
                    value={formData.compensation}
                    onChange={handleChange}
                    required
                    className="bg-background text-foreground placeholder:text-muted-foreground/70"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="date">Opportunity Date *</Label>
                  <Input
                    id="date"
                    type="date"
                    value={formData.date}
                    onChange={handleChange}
                    required
                    className="bg-background text-foreground"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="application_deadline">Application Deadline</Label>
                  <Input
                    id="application_deadline"
                    type="datetime-local"
                    value={formData.application_deadline}
                    onChange={handleChange}
                    className="bg-background text-foreground"
                  />
                </div>
              </div>

              {!isEdit && (
                <div className="space-y-2">
                  <GigImageUploader onFileSelect={setImageFile} disabled={isSubmitting} />
                </div>
              )}

              <div className="flex flex-col gap-4 pt-6 md:flex-row">
                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 button-glow border-0"
                  data-testid={isEdit ? "submit-edit-gig" : undefined}
                >
                  {isSubmitting ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      {isEdit ? "Saving…" : "Creating Opportunity..."}
                    </>
                  ) : isEdit ? (
                    "Save changes"
                  ) : (
                    "Post Opportunity"
                  )}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => router.push("/client/dashboard")}
                  disabled={isSubmitting}
                >
                  Cancel
                </Button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
