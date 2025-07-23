"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { AlertCircle, Save, Building, Globe, Phone, Users } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/use-toast";

// Define the client profile interface based on database schema
interface ClientProfile {
  id?: string;
  user_id?: string;
  company_name: string;
  industry?: string | null;
  website?: string | null;
  contact_name: string;
  contact_email: string;
  contact_phone?: string | null;
  company_size?: string | null;
  created_at?: string;
  updated_at?: string;
}

// Define the form schema
const profileSchema = z.object({
  company_name: z
    .string()
    .min(2, { message: "Company name must be at least 2 characters" })
    .max(100, { message: "Company name cannot exceed 100 characters" }),
  industry: z.string().optional(),
  website: z
    .string()
    .url({ message: "Please enter a valid website URL" })
    .optional()
    .or(z.literal("")),
  contact_name: z
    .string()
    .min(2, { message: "Contact name must be at least 2 characters" })
    .max(100, { message: "Contact name cannot exceed 100 characters" }),
  contact_email: z.string().email({ message: "Please enter a valid email address" }),
  contact_phone: z
    .string()
    .optional()
    .refine((val) => !val || /^[+]?[1-9][\d]{0,15}$/.test(val), {
      message: "Please enter a valid phone number",
    }),
  company_size: z.string().optional(),
});

type ProfileFormValues = z.infer<typeof profileSchema>;

interface ClientProfileFormProps {
  initialData?: ClientProfile | null;
}

export default function ClientProfileForm({ initialData }: ClientProfileFormProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const supabase = createClientComponentClient();

  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      company_name: initialData?.company_name || "",
      industry: initialData?.industry || "",
      website: initialData?.website || "",
      contact_name: initialData?.contact_name || "",
      contact_email: initialData?.contact_email || "",
      contact_phone: initialData?.contact_phone || "",
      company_size: initialData?.company_size || "",
    },
  });

  const onSubmit = async (data: ProfileFormValues) => {
    setIsSubmitting(true);
    setError(null);

    try {
      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser();

      if (authError || !user) {
        throw new Error("Authentication error. Please log in again.");
      }

      // Update client profile
      const { error: profileError } = await supabase.from("client_profiles").upsert({
        user_id: user.id,
        company_name: data.company_name,
        industry: data.industry || null,
        website: data.website || null,
        contact_name: data.contact_name,
        contact_email: data.contact_email,
        contact_phone: data.contact_phone || null,
        company_size: data.company_size || null,
        updated_at: new Date().toISOString(),
      });

      if (profileError) {
        throw new Error(`Profile update failed: ${profileError.message}`);
      }

      // Update display_name in profiles table
      const { error: displayNameError } = await supabase
        .from("profiles")
        .update({
          display_name: data.company_name,
          updated_at: new Date().toISOString(),
        })
        .eq("id", user.id);

      if (displayNameError) {
        console.warn("Failed to update display name:", displayNameError);
      }

      toast({
        title: "Profile Updated",
        description: "Your company profile has been successfully updated.",
      });

      // Redirect to dashboard
      router.push("/client/dashboard");
    } catch (err) {
      console.error("Error updating profile:", err);
      setError(err instanceof Error ? err.message : "An unexpected error occurred");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Building className="h-5 w-5" />
          Company Information
        </CardTitle>
        <CardDescription>
          Update your company details to improve your gig postings and attract better talent.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Company Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-gray-900">Company Details</h3>

            <div className="space-y-2">
              <Label htmlFor="company_name">Company Name *</Label>
              <Input
                id="company_name"
                placeholder="Your company or brand name"
                {...form.register("company_name")}
              />
              {form.formState.errors.company_name && (
                <p className="text-sm text-red-600">{form.formState.errors.company_name.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="industry">Industry</Label>
              <Input
                id="industry"
                placeholder="e.g., Fashion, Technology, Entertainment"
                {...form.register("industry")}
              />
              {form.formState.errors.industry && (
                <p className="text-sm text-red-600">{form.formState.errors.industry.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="website">Website</Label>
              <Input
                id="website"
                placeholder="https://yourcompany.com"
                {...form.register("website")}
              />
              {form.formState.errors.website && (
                <p className="text-sm text-red-600">{form.formState.errors.website.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="company_size">Company Size</Label>
              <Input
                id="company_size"
                placeholder="e.g., 10-50 employees, 100+ employees"
                {...form.register("company_size")}
              />
              {form.formState.errors.company_size && (
                <p className="text-sm text-red-600">{form.formState.errors.company_size.message}</p>
              )}
            </div>
          </div>

          {/* Contact Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-gray-900">Contact Information</h3>

            <div className="space-y-2">
              <Label htmlFor="contact_name">Contact Name *</Label>
              <Input
                id="contact_name"
                placeholder="Primary contact person"
                {...form.register("contact_name")}
              />
              {form.formState.errors.contact_name && (
                <p className="text-sm text-red-600">{form.formState.errors.contact_name.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="contact_email">Contact Email *</Label>
              <Input
                id="contact_email"
                type="email"
                placeholder="contact@yourcompany.com"
                {...form.register("contact_email")}
              />
              {form.formState.errors.contact_email && (
                <p className="text-sm text-red-600">
                  {form.formState.errors.contact_email.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="contact_phone">Contact Phone</Label>
              <Input
                id="contact_phone"
                placeholder="+1-555-0123"
                {...form.register("contact_phone")}
              />
              {form.formState.errors.contact_phone && (
                <p className="text-sm text-red-600">
                  {form.formState.errors.contact_phone.message}
                </p>
              )}
            </div>
          </div>

          <div className="flex gap-4">
            <Button type="submit" disabled={isSubmitting} className="flex-1">
              {isSubmitting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Saving...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Save Profile
                </>
              )}
            </Button>

            <Button
              type="button"
              variant="outline"
              onClick={() => router.push("/client/dashboard")}
            >
              Cancel
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
