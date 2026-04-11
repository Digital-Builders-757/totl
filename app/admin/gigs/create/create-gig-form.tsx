"use client";

import { ArrowLeft, Plus, Minus, Calendar, Clock, DollarSign, MapPin, Trash2 } from "lucide-react";
import Link from "next/link";
import { useState, useActionState } from "react";
import { useFormStatus } from "react-dom";
import { createGigFormAction } from "./actions";
import { GigImageUploader } from "@/components/gigs/gig-image-uploader";
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
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { VISIBLE_GIG_CATEGORIES, getCategoryLabel } from "@/lib/constants/gig-categories";
import {
  GIG_REFERENCE_LINK_KINDS,
  type GigReferenceLinkFormRow,
  referenceLinkKindLabel,
} from "@/lib/gig-reference-links";

function SubmitButton() {
  const { pending } = useFormStatus();

  return (
    <Button type="submit" disabled={pending} className="button-glow border-0">
      {pending ? "Creating..." : "Create Opportunity"}
    </Button>
  );
}

const MAX_REFERENCE_LINKS = 15;

export function CreateGigForm() {
  const [requirements, setRequirements] = useState<string[]>([""]);
  const [category, setCategory] = useState<string>("modeling");
  const [referenceLinks, setReferenceLinks] = useState<GigReferenceLinkFormRow[]>([]);
  const [state, formAction] = useActionState(createGigFormAction, null);

  const addRequirement = () => {
    setRequirements([...requirements, ""]);
  };

  const removeRequirement = (index: number) => {
    const newRequirements = [...requirements];
    newRequirements.splice(index, 1);
    setRequirements(newRequirements);
  };

  const updateRequirement = (index: number, value: string) => {
    const newRequirements = [...requirements];
    newRequirements[index] = value;
    setRequirements(newRequirements);
  };

  const updateReferenceLink = (index: number, patch: Partial<GigReferenceLinkFormRow>) => {
    setReferenceLinks((prev) => {
      const next = [...prev];
      const row = next[index] ?? { url: "", label: "", kind: "" };
      next[index] = { ...row, ...patch };
      return next;
    });
  };

  const addReferenceLinkRow = () => {
    setReferenceLinks((prev) => {
      if (prev.length >= MAX_REFERENCE_LINKS) return prev;
      return [...prev, { url: "", label: "", kind: "" }];
    });
  };

  const removeReferenceLinkRow = (index: number) => {
    setReferenceLinks((prev) => prev.filter((_, i) => i !== index));
  };

  return (
    <div className="min-h-screen bg-[var(--oklch-bg)] page-ambient text-[var(--oklch-text-primary)]">
      <div className="container mx-auto px-4 py-12">
        <Link
          href="/admin/dashboard"
          className="mb-8 inline-flex items-center text-[var(--oklch-text-secondary)] transition-colors hover:text-[var(--oklch-text-primary)]"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to dashboard
        </Link>

        <div className="mx-auto max-w-4xl overflow-hidden rounded-2xl border border-border/40 bg-card/25 shadow-sm backdrop-blur-md">
          <div className="p-8">
            <div className="mb-8">
              <h1 className="mb-2 text-2xl font-bold text-[var(--oklch-text-primary)]">
                Create a New Opportunity
              </h1>
              <p className="text-[var(--oklch-text-secondary)]">
                Fill out the form below to create a new casting call or opportunity. Be as detailed as
                possible to attract the right talent.
              </p>
            </div>

            <form action={formAction} className="space-y-6">
              <input type="hidden" name="reference_links_json" value={JSON.stringify(referenceLinks)} readOnly />
              {state?.error && (
                <div className="p-4 bg-red-900/20 border border-red-800 rounded-md text-red-400">
                  {state.error}
                </div>
              )}
              <div className="space-y-2">
                <Label htmlFor="title" className="text-[var(--oklch-text-primary)]">Opportunity Title</Label>
                <Input
                  id="title"
                  name="title"
                  placeholder="e.g., Luxury Jewelry Campaign"
                  className="border-border/40 bg-white/5 text-[var(--oklch-text-primary)] placeholder:text-[var(--oklch-text-muted)]"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="company" className="text-[var(--oklch-text-primary)]">Company/Brand Name</Label>
                <Input
                  id="company"
                  name="company"
                  placeholder="Your company or brand name"
                  defaultValue="Admin Company"
                  className="border-border/40 bg-white/5 text-[var(--oklch-text-primary)] placeholder:text-[var(--oklch-text-muted)]"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="category" className="text-[var(--oklch-text-primary)]">Opportunity Type</Label>
                  <Select value={category} onValueChange={setCategory}>
                    <SelectTrigger 
                      id="category"
                      className="border-border/40 bg-white/5 text-[var(--oklch-text-primary)] data-[placeholder]:text-[var(--oklch-text-muted)]"
                    >
                      <SelectValue placeholder="Select opportunity type" />
                    </SelectTrigger>
                    <SelectContent className="border-border/40 bg-card/95 text-[var(--oklch-text-primary)] backdrop-blur-md">
                      {VISIBLE_GIG_CATEGORIES.map((cat) => (
                        <SelectItem key={cat} value={cat} className="focus:bg-white/10 focus:text-[var(--oklch-text-primary)]">
                          {getCategoryLabel(cat)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <input type="hidden" name="category" value={category} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="location" className="text-[var(--oklch-text-primary)]">Location</Label>
                  <div className="relative">
                    <MapPin
                      className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--oklch-text-tertiary)]"
                      size={16}
                    />
                    <Input
                      id="location"
                      name="location"
                      placeholder="e.g., New York, NY"
                      className="border-border/40 bg-white/5 pl-9 text-[var(--oklch-text-primary)] placeholder:text-[var(--oklch-text-muted)]"
                      required
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description" className="text-[var(--oklch-text-primary)]">Description</Label>
                <Textarea
                  id="description"
                  name="description"
                  placeholder="Describe the opportunity, requirements, and what you're looking for..."
                  rows={4}
                  className="border-border/40 bg-white/5 text-[var(--oklch-text-primary)] placeholder:text-[var(--oklch-text-muted)]"
                  required
                />
              </div>

              <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="start_date" className="text-[var(--oklch-text-primary)]">
                    Production Date
                  </Label>
                  <div className="relative">
                    <Calendar
                      className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--oklch-text-tertiary)]"
                      size={16}
                    />
                    <Input
                      id="start_date"
                      name="start_date"
                      type="date"
                      className="border-border/40 bg-white/5 pl-9 text-[var(--oklch-text-primary)]"
                    />
                  </div>
                  <p className="text-xs text-[var(--oklch-text-tertiary)]">When the shoot or production takes place.</p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="application_deadline" className="text-[var(--oklch-text-primary)]">
                    Submission Deadline
                  </Label>
                  <div className="relative">
                    <Clock
                      className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--oklch-text-tertiary)]"
                      size={16}
                    />
                    <Input
                      id="application_deadline"
                      name="application_deadline"
                      type="datetime-local"
                      className="border-border/40 bg-white/5 pl-9 text-[var(--oklch-text-primary)]"
                    />
                  </div>
                  <p className="text-xs text-[var(--oklch-text-tertiary)]">Last day/time talent can apply (optional).</p>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="compensation_min" className="text-[var(--oklch-text-primary)]">Min Compensation</Label>
                  <div className="relative">
                    <DollarSign
                      className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--oklch-text-tertiary)]"
                      size={16}
                    />
                    <Input
                      id="compensation_min"
                      name="compensation_min"
                      type="number"
                      placeholder="0"
                      className="border-border/40 bg-white/5 pl-9 text-[var(--oklch-text-primary)] placeholder:text-[var(--oklch-text-muted)]"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="compensation_max" className="text-[var(--oklch-text-primary)]">Max Compensation</Label>
                  <div className="relative">
                    <DollarSign
                      className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--oklch-text-tertiary)]"
                      size={16}
                    />
                    <Input
                      id="compensation_max"
                      name="compensation_max"
                      type="number"
                      placeholder="1000"
                      className="border-border/40 bg-white/5 pl-9 text-[var(--oklch-text-primary)] placeholder:text-[var(--oklch-text-muted)]"
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-4 rounded-xl border border-border/40 bg-card/20 p-4 backdrop-blur-sm">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <Label className="text-base text-[var(--oklch-text-primary)]">Reference links (optional)</Label>
                    <p className="text-sm text-[var(--oklch-text-tertiary)]">
                      Company site, reels, social, portfolio—help talent see the vibe. Up to {MAX_REFERENCE_LINKS}{" "}
                      links, http(s) only.
                    </p>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={addReferenceLinkRow}
                    disabled={referenceLinks.length >= MAX_REFERENCE_LINKS}
                    className="shrink-0 border-white/15 text-[var(--oklch-text-secondary)] hover:bg-white/10 hover:text-[var(--oklch-text-primary)]"
                  >
                    <Plus className="mr-1 h-4 w-4" />
                    Add link
                  </Button>
                </div>
                {referenceLinks.length === 0 ? (
                  <p className="text-sm text-[var(--oklch-text-muted)]">No reference links yet.</p>
                ) : (
                  <ul className="space-y-4">
                    {referenceLinks.map((row, idx) => (
                      <li
                        key={idx}
                        className="grid grid-cols-1 gap-3 rounded-lg border border-border/40 bg-card/30 p-3 md:grid-cols-12 md:items-end"
                      >
                        <div className="md:col-span-5 space-y-2">
                          <Label htmlFor={`ref-url-${idx}`} className="text-[var(--oklch-text-primary)]">
                            URL
                          </Label>
                          <Input
                            id={`ref-url-${idx}`}
                            placeholder="https://…"
                            value={row.url}
                            onChange={(e) => updateReferenceLink(idx, { url: e.target.value })}
                            className="border-border/40 bg-white/5 text-[var(--oklch-text-primary)] placeholder:text-[var(--oklch-text-muted)]"
                          />
                        </div>
                        <div className="md:col-span-4 space-y-2">
                          <Label htmlFor={`ref-label-${idx}`} className="text-[var(--oklch-text-primary)]">
                            Label
                          </Label>
                          <Input
                            id={`ref-label-${idx}`}
                            placeholder="e.g. Brand reel"
                            value={row.label}
                            onChange={(e) => updateReferenceLink(idx, { label: e.target.value })}
                            className="border-border/40 bg-white/5 text-[var(--oklch-text-primary)] placeholder:text-[var(--oklch-text-muted)]"
                          />
                        </div>
                        <div className="md:col-span-2 space-y-2">
                          <Label htmlFor={`ref-kind-${idx}`} className="text-[var(--oklch-text-primary)]">
                            Type
                          </Label>
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
                              className="border-border/40 bg-white/5 text-[var(--oklch-text-primary)] data-[placeholder]:text-[var(--oklch-text-muted)]"
                            >
                              <SelectValue placeholder="Select" />
                            </SelectTrigger>
                            <SelectContent className="border-border/40 bg-card/95 text-[var(--oklch-text-primary)] backdrop-blur-md">
                              {GIG_REFERENCE_LINK_KINDS.map((k) => (
                                <SelectItem key={k} value={k} className="focus:bg-white/10 focus:text-[var(--oklch-text-primary)]">
                                  {referenceLinkKindLabel(k)}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="flex md:col-span-1 md:justify-end">
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={() => removeReferenceLinkRow(idx)}
                            className="text-rose-400 hover:bg-white/10 hover:text-rose-300"
                            aria-label="Remove link"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              <div className="space-y-4">
                <Label className="text-[var(--oklch-text-primary)]">Requirements</Label>
                {requirements.map((requirement, index) => (
                  <div key={index} className="flex space-x-2">
                    <Input
                      name={`requirement_${index}`}
                      placeholder="e.g., Female, 18-25, athletic build"
                      value={requirement}
                      onChange={(e) => updateRequirement(index, e.target.value)}
                      className="border-border/40 bg-white/5 text-[var(--oklch-text-primary)] placeholder:text-[var(--oklch-text-muted)]"
                    />
                    {requirements.length > 1 && (
                      <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        onClick={() => removeRequirement(index)}
                        className="border-white/15 text-[var(--oklch-text-secondary)] hover:bg-white/10 hover:text-[var(--oklch-text-primary)]"
                      >
                        <Minus size={16} />
                      </Button>
                    )}
                  </div>
                ))}
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={addRequirement} 
                  className="w-full border-white/15 text-[var(--oklch-text-secondary)] hover:bg-white/10 hover:text-[var(--oklch-text-primary)]"
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Add Requirement
                </Button>
              </div>

              <div className="flex items-center space-x-2">
                <Switch 
                  id="urgent" 
                  name="urgent"
                  className="data-[state=checked]:bg-blue-600 data-[state=unchecked]:bg-white/20"
                />
                <Label htmlFor="urgent" className="text-[var(--oklch-text-primary)]">Mark as urgent</Label>
              </div>

              <div className="flex items-center space-x-2">
                <Switch 
                  id="featured" 
                  name="featured"
                  className="data-[state=checked]:bg-blue-600 data-[state=unchecked]:bg-white/20"
                />
                <Label htmlFor="featured" className="text-[var(--oklch-text-primary)]">Feature this gig</Label>
              </div>

              {/* Gig Cover Image Upload */}
              <div className="space-y-2">
                <GigImageUploader formFieldName="gig_image" />
              </div>

              <div className="flex justify-end space-x-4">
                <Button 
                  type="button" 
                  variant="outline" 
                  asChild
                  className="border-white/15 text-[var(--oklch-text-secondary)] hover:bg-white/10 hover:text-[var(--oklch-text-primary)]"
                >
                  <Link href="/admin/dashboard">Cancel</Link>
                </Button>
                <SubmitButton />
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
