"use client";

import { ArrowLeft, AlertCircle } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type React from "react";
import { useState } from "react";

import { createGigAction } from "./actions";
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

// Force dynamic rendering to prevent build-time issues
export const dynamic = "force-dynamic";

export default function PostGigPage() {
  const router = useRouter();
  const { user } = useAuth();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    category: "",
    location: "",
    compensation: "",
    duration: "",
    date: "",
    application_deadline: "",
  });
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
      setError("You must be logged in to post a gig");
      setIsSubmitting(false);
      return;
    }

    try {
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
        title: "Gig Posted Successfully!",
        description: "Your gig has been created and is now visible to talent.",
      });

      // Redirect to client dashboard
      router.push("/client/dashboard");
    } catch (err) {
      console.error("Error creating gig:", err);
      setError(err instanceof Error ? err.message : "Failed to create gig");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 pt-24">
        <div className="container mx-auto px-4 py-12">
          <div className="max-w-md mx-auto text-center">
            <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Authentication Required</h2>
            <p className="text-gray-600 mb-4">You must be logged in to post a gig.</p>
            <Button asChild>
              <Link href="/login">Log In</Link>
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 pt-24 text-slate-900">
      <div className="container mx-auto px-4 py-12">
        <Link
          href="/client/dashboard"
          className="inline-flex items-center text-slate-600 hover:text-slate-900 mb-8 transition-colors"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Dashboard
        </Link>

        <div className="max-w-3xl mx-auto rounded-3xl panel-frosted border border-white/40 shadow-2xl shadow-slate-900/20 overflow-hidden">
          <div className="p-10 space-y-8">
            <div className="space-y-3">
              <h1 className="text-3xl font-bold text-slate-900">Post a New Gig</h1>
              <p className="text-slate-500">
                Fill out the form below to create a new casting call or gig. Be as detailed as
                possible to attract the right talent.
              </p>
            </div>

            {error && (
              <Alert variant="destructive" className="mb-6">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <form className="space-y-6" onSubmit={handleSubmit}>
              <div className="space-y-2">
                <Label htmlFor="title">Gig Title *</Label>
                <Input
                  id="title"
                  placeholder="e.g., Fashion Editorial Model Needed"
                  value={formData.title}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description *</Label>
                <Textarea
                  id="description"
                  placeholder="Provide a detailed description of the gig, requirements, and what you're looking for..."
                  value={formData.description}
                  onChange={handleChange}
                  rows={4}
                  required
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="category">Category *</Label>
                  <Select value={formData.category} onValueChange={handleSelectChange}>
                    <SelectTrigger id="category">
                      <SelectValue placeholder="Select category" />
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
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="date">Gig Date *</Label>
                  <Input
                    id="date"
                    type="date"
                    value={formData.date}
                    onChange={handleChange}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="application_deadline">Application Deadline</Label>
                  <Input
                    id="application_deadline"
                    type="datetime-local"
                    value={formData.application_deadline}
                    onChange={handleChange}
                  />
                </div>
              </div>

              {/* Gig Cover Image Upload */}
              <div className="space-y-2">
                <GigImageUploader
                  onFileSelect={setImageFile}
                  disabled={isSubmitting}
                />
              </div>

              <div className="flex flex-col gap-4 pt-6 md:flex-row">
                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 button-glow border-0"
                >
                  {isSubmitting ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Creating Gig...
                    </>
                  ) : (
                    "Post Gig"
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
