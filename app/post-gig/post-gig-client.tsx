"use client";

// NOTE: This component is shared by both /post-gig (legacy alias) and /client/post-gig (canonical).

import { ArrowLeft, AlertCircle, Plus, Trash2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type React from "react";
import { useState } from "react";

import { createGigAction, updateGigAction } from "./actions";
import { updateGigAsAdminAction } from "@/app/admin/gigs/edit-actions";
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
import {
  GIG_REFERENCE_LINK_KINDS,
  type GigReferenceLinkFormRow,
  referenceLinkKindLabel,
} from "@/lib/gig-reference-links";
import {
  fieldErrorsFromMissing,
  selectValueFromCategory,
  validateClientOpportunityRequired,
} from "@/lib/opportunity-form-helpers";
import { logger } from "@/lib/utils/logger";
import { cn } from "@/lib/utils/utils";

const emptyForm = {
  title: "",
  description: "",
  category: "",
  location: "",
  compensation: "",
  duration: "",
  date: "",
  application_deadline: "",
  referenceLinks: [] as GigReferenceLinkFormRow[],
};

export type PostGigClientProps = {
  mode?: "create" | "edit";
  gigId?: string;
  /** Career Builder (default) vs platform admin edit surface */
  surface?: "client" | "admin";
  initialValues?: typeof emptyForm;
  hasApplications?: boolean;
  /** Admin only: at least one completed booking exists (informational warning; save still allowed) */
  hasCompletedBookings?: boolean;
  editLocked?: boolean;
  editLockedReason?: string;
};

export function PostGigClient({
  mode = "create",
  gigId,
  surface = "client",
  initialValues,
  hasApplications = false,
  hasCompletedBookings = false,
  editLocked = false,
  editLockedReason,
}: PostGigClientProps = {}) {
  const router = useRouter();
  const { user } = useAuth();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const [formData, setFormData] = useState(() => ({
    ...emptyForm,
    ...initialValues,
    referenceLinks: initialValues?.referenceLinks ?? emptyForm.referenceLinks,
  }));
  const [imageFile, setImageFile] = useState<File | null>(null);

  const isAdminSurface = surface === "admin";
  const backHref = isAdminSurface ? "/admin/gigs" : "/client/dashboard";
  const backLabel = isAdminSurface ? "Back to All Opportunities" : "Back to Dashboard";

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { id, value } = e.target;
    setFieldErrors((prev) => {
      if (!prev[id]) return prev;
      const next = { ...prev };
      delete next[id];
      return next;
    });
    setFormData((prev) => ({ ...prev, [id]: value }));
  };

  const handleSelectChange = (value: string) => {
    setFieldErrors((prev) => {
      if (!prev.category) return prev;
      const next = { ...prev };
      delete next.category;
      return next;
    });
    setFormData((prev) => ({ ...prev, category: value }));
  };

  const MAX_REFERENCE_LINKS = 15;

  const updateReferenceLink = (index: number, patch: Partial<GigReferenceLinkFormRow>) => {
    setFormData((prev) => {
      const next = [...prev.referenceLinks];
      const row = next[index] ?? { url: "", label: "", kind: "" };
      next[index] = { ...row, ...patch };
      return { ...prev, referenceLinks: next };
    });
  };

  const addReferenceLinkRow = () => {
    setFormData((prev) => {
      if (prev.referenceLinks.length >= MAX_REFERENCE_LINKS) return prev;
      return {
        ...prev,
        referenceLinks: [...prev.referenceLinks, { url: "", label: "", kind: "" }],
      };
    });
  };

  const removeReferenceLinkRow = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      referenceLinks: prev.referenceLinks.filter((_, i) => i !== index),
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);
    setFieldErrors({});

    if (!user) {
      setError(
        mode === "edit"
          ? "You must be logged in to edit an opportunity"
          : "You must be logged in to post an opportunity"
      );
      setIsSubmitting(false);
      return;
    }

    const surfaceTag = isAdminSurface
      ? mode === "edit"
        ? "admin-edit"
        : "admin-create"
      : mode === "edit"
        ? "client-edit"
        : "client-create";

    const validation = validateClientOpportunityRequired({
      title: formData.title,
      description: formData.description,
      category: formData.category,
      location: formData.location,
      duration: formData.duration,
      compensation: formData.compensation,
      date: formData.date,
    });

    if (!validation.ok) {
      setFieldErrors(fieldErrorsFromMissing(validation.missingFields));
      setError(validation.message);
      setIsSubmitting(false);
      logger.warn("[PostGigClient] Client validation failed", {
        surface: surfaceTag,
        mode,
        validation: "required_fields",
        missingFields: validation.missingFields,
        referenceLinkRowCount: formData.referenceLinks.length,
        hasImageAttempt: Boolean(imageFile && imageFile.size > 0),
      });
      return;
    }

    const trimmed = validation.data;

    try {
      if (mode === "edit") {
        if (!gigId) {
          logger.error(
            "[PostGigClient] Missing gigId in edit mode",
            new Error("missing gigId"),
            { surface: surfaceTag, mode }
          );
          setError("Something went wrong. Refresh the page and try again.");
          setIsSubmitting(false);
          return;
        }
        const payload = {
          gigId,
          title: trimmed.title,
          description: trimmed.description,
          category: trimmed.category,
          location: trimmed.location,
          compensation: trimmed.compensation,
          duration: trimmed.duration,
          date: trimmed.date,
          application_deadline: formData.application_deadline?.trim()
            ? formData.application_deadline.trim()
            : null,
          referenceLinks: formData.referenceLinks,
        };
        const result = isAdminSurface ? await updateGigAsAdminAction(payload) : await updateGigAction(payload);
        if (!result.ok) {
          const message =
            typeof result.error === "string" && result.error.trim()
              ? result.error
              : "We couldn’t save your changes. Please try again.";
          logger.warn("[PostGigClient] Update action returned error", {
            surface: surfaceTag,
            mode,
            gigId,
            validation: "server_rejected",
            hasServerMessage: Boolean(
              typeof result.error === "string" && result.error.trim()
            ),
            referenceLinkRowCount: formData.referenceLinks.length,
          });
          setError(message);
          setIsSubmitting(false);
          return;
        }
        toast({
          title: "Opportunity updated",
          description: isAdminSurface
            ? "Changes saved as administrator."
            : "Your changes have been saved.",
        });
      } else {
        const result = await createGigAction({
          title: trimmed.title,
          description: trimmed.description,
          category: trimmed.category,
          location: trimmed.location,
          compensation: trimmed.compensation,
          duration: trimmed.duration,
          date: trimmed.date,
          application_deadline: formData.application_deadline?.trim()
            ? formData.application_deadline.trim()
            : null,
          imageFile: imageFile,
          referenceLinks: formData.referenceLinks,
        });

        if (!result.ok) {
          const message =
            typeof result.error === "string" && result.error.trim()
              ? result.error
              : "We couldn’t create this opportunity. Please try again.";
          logger.warn("[PostGigClient] Create action returned error", {
            surface: surfaceTag,
            mode,
            validation: "server_rejected",
            hasServerMessage: Boolean(
              typeof result.error === "string" && result.error.trim()
            ),
            referenceLinkRowCount: formData.referenceLinks.length,
            hasImageAttempt: Boolean(imageFile && imageFile.size > 0),
          });
          setError(message);
          setIsSubmitting(false);
          return;
        }

        toast({
          title: "Opportunity Posted Successfully!",
          description: "Your opportunity has been created and is now visible to talent.",
        });
      }

      if (mode === "edit" && isAdminSurface && gigId) {
        /** Navigate to admin detail so you can verify applicant context after save */
        router.push(`/admin/gigs/${gigId}`);
      } else {
        router.push("/client/dashboard");
      }
    } catch (err) {
      logger.error(
        mode === "edit" ? "[PostGigClient] Error updating gig" : "[PostGigClient] Error creating gig",
        err,
        {
          surface: surfaceTag,
          mode,
          gigId: gigId ?? null,
          hasImageAttempt: Boolean(imageFile && imageFile.size > 0),
          referenceLinkRowCount: formData.referenceLinks.length,
        }
      );
      setError(
        err instanceof Error && err.message.trim()
          ? err.message
          : mode === "edit"
            ? "Failed to update opportunity."
            : "Failed to create opportunity."
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
            <p className="text-muted-foreground mb-4">
              {isAdminSurface
                ? "You must be logged in as an administrator to edit this opportunity."
                : "You must be logged in to post a gig."}
            </p>
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
            href={backHref}
            className="inline-flex items-center text-muted-foreground hover:text-foreground mb-8 transition-colors"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            {backLabel}
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
                <Link href={backHref}>{backLabel}</Link>
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
          href={backHref}
          className="inline-flex items-center text-muted-foreground hover:text-foreground mb-8 transition-colors"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          {backLabel}
        </Link>

        <div className="max-w-3xl mx-auto rounded-3xl border border-border bg-card/80 shadow-2xl shadow-black/40 backdrop-blur overflow-hidden">
          <div className="p-10 space-y-8">
            <div className="space-y-3">
              <h1 className="text-3xl font-bold text-foreground">
                {isEdit
                  ? isAdminSurface
                    ? "Edit opportunity (admin)"
                    : "Edit opportunity"
                  : "Post a New Opportunity"}
              </h1>
              <p className="text-muted-foreground">
                {isEdit
                  ? isAdminSurface
                    ? "You are editing as a platform administrator. Changes apply immediately on the public listing."
                    : "Update the details below. Changes apply immediately for talent viewing this opportunity."
                  : "Fill out the form below to create a new casting call or opportunity. Be as detailed as possible to attract the right talent."}
              </p>
            </div>

            {isEdit && isAdminSurface && hasCompletedBookings && (
              <Alert className="border-amber-500/50 bg-amber-500/10">
                <AlertCircle className="h-4 w-4 text-amber-600" />
                <AlertDescription className="text-amber-950 dark:text-amber-100">
                  This opportunity has at least one completed booking. Editing may affect how historical records align with
                  what talent and clients saw—use extra care.
                </AlertDescription>
              </Alert>
            )}

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
                  aria-invalid={Boolean(fieldErrors.title)}
                  className={cn(
                    "bg-background text-foreground placeholder:text-muted-foreground/70",
                    fieldErrors.title && "border-destructive"
                  )}
                />
                {fieldErrors.title ? (
                  <p className="text-sm text-destructive">{fieldErrors.title}</p>
                ) : null}
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
                  aria-invalid={Boolean(fieldErrors.description)}
                  className={cn(
                    "bg-background text-foreground placeholder:text-muted-foreground/70",
                    fieldErrors.description && "border-destructive"
                  )}
                />
                {fieldErrors.description ? (
                  <p className="text-sm text-destructive">{fieldErrors.description}</p>
                ) : null}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="category">Opportunity Type *</Label>
                  <Select
                    value={selectValueFromCategory(formData.category)}
                    onValueChange={handleSelectChange}
                  >
                    <SelectTrigger
                      id="category"
                      aria-invalid={Boolean(fieldErrors.category)}
                      className={cn(
                        "bg-background text-foreground placeholder:text-muted-foreground/70",
                        fieldErrors.category && "border-destructive"
                      )}
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
                  {fieldErrors.category ? (
                    <p className="text-sm text-destructive">{fieldErrors.category}</p>
                  ) : null}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="location">Location *</Label>
                  <Input
                    id="location"
                    placeholder="e.g., New York, NY"
                    value={formData.location}
                    onChange={handleChange}
                    required
                    aria-invalid={Boolean(fieldErrors.location)}
                    className={cn(
                      "bg-background text-foreground placeholder:text-muted-foreground/70",
                      fieldErrors.location && "border-destructive"
                    )}
                  />
                  {fieldErrors.location ? (
                    <p className="text-sm text-destructive">{fieldErrors.location}</p>
                  ) : null}
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
                    aria-invalid={Boolean(fieldErrors.duration)}
                    className={cn(
                      "bg-background text-foreground placeholder:text-muted-foreground/70",
                      fieldErrors.duration && "border-destructive"
                    )}
                  />
                  {fieldErrors.duration ? (
                    <p className="text-sm text-destructive">{fieldErrors.duration}</p>
                  ) : null}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="compensation">Compensation *</Label>
                  <Input
                    id="compensation"
                    placeholder="e.g., Paid, $1,200, Paid · $500-$800"
                    value={formData.compensation}
                    onChange={handleChange}
                    required
                    aria-invalid={Boolean(fieldErrors.compensation)}
                    className={cn(
                      "bg-background text-foreground placeholder:text-muted-foreground/70",
                      fieldErrors.compensation && "border-destructive"
                    )}
                  />
                  {fieldErrors.compensation ? (
                    <p className="text-sm text-destructive">{fieldErrors.compensation}</p>
                  ) : null}
                </div>
              </div>

              <div className="space-y-4 rounded-lg border border-border/80 bg-muted/20 p-4">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <Label className="text-base">Reference links (optional)</Label>
                    <p className="text-sm text-muted-foreground">
                      Company site, reels, social, portfolio—help talent see the vibe. Up to {MAX_REFERENCE_LINKS}{" "}
                      links, http(s) only.
                    </p>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={addReferenceLinkRow}
                    disabled={isSubmitting || formData.referenceLinks.length >= MAX_REFERENCE_LINKS}
                    className="shrink-0"
                  >
                    <Plus className="h-4 w-4 mr-1" />
                    Add link
                  </Button>
                </div>

                {formData.referenceLinks.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No reference links yet.</p>
                ) : (
                  <ul className="space-y-4">
                    {formData.referenceLinks.map((row, idx) => (
                      <li
                        key={idx}
                        className="grid grid-cols-1 gap-3 md:grid-cols-12 md:items-end border border-border/60 rounded-md p-3 bg-background/50"
                      >
                        <div className="md:col-span-5 space-y-2">
                          <Label htmlFor={`ref-url-${idx}`}>URL</Label>
                          <Input
                            id={`ref-url-${idx}`}
                            placeholder="https://…"
                            value={row.url}
                            onChange={(e) => updateReferenceLink(idx, { url: e.target.value })}
                            className="bg-background text-foreground placeholder:text-muted-foreground/70"
                          />
                        </div>
                        <div className="md:col-span-4 space-y-2">
                          <Label htmlFor={`ref-label-${idx}`}>Label</Label>
                          <Input
                            id={`ref-label-${idx}`}
                            placeholder="e.g. Brand reel"
                            value={row.label}
                            onChange={(e) => updateReferenceLink(idx, { label: e.target.value })}
                            className="bg-background text-foreground placeholder:text-muted-foreground/70"
                          />
                        </div>
                        <div className="md:col-span-2 space-y-2">
                          <Label htmlFor={`ref-kind-${idx}`}>Type</Label>
                          <Select
                            value={row.kind || undefined}
                            onValueChange={(value) =>
                              updateReferenceLink(idx, {
                                kind: value as GigReferenceLinkFormRow["kind"],
                              })
                            }
                          >
                            <SelectTrigger
                              id={`ref-kind-${idx}`}
                              className="bg-background text-foreground placeholder:text-muted-foreground/70"
                            >
                              <SelectValue placeholder="Select" />
                            </SelectTrigger>
                            <SelectContent>
                              {GIG_REFERENCE_LINK_KINDS.map((k) => (
                                <SelectItem key={k} value={k}>
                                  {referenceLinkKindLabel(k)}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="md:col-span-1 flex md:justify-end">
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={() => removeReferenceLinkRow(idx)}
                            disabled={isSubmitting}
                            aria-label="Remove link"
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="date">Production Date *</Label>
                  <Input
                    id="date"
                    type="date"
                    value={formData.date}
                    onChange={handleChange}
                    required
                    aria-invalid={Boolean(fieldErrors.date)}
                    className={cn(
                      "bg-background text-foreground",
                      fieldErrors.date && "border-destructive"
                    )}
                  />
                  {fieldErrors.date ? (
                    <p className="text-sm text-destructive">{fieldErrors.date}</p>
                  ) : null}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="application_deadline">Submission Deadline</Label>
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
                  onClick={() => router.push(backHref)}
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
