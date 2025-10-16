"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { upsertClientProfile } from "../actions";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/components/ui/use-toast";
import type { Database } from "@/types/supabase";

type Client = Database["public"]["Tables"]["client_profiles"]["Row"];

const clientSchema = z.object({
  company_name: z
    .string()
    .min(2, "Company name must be at least 2 characters")
    .max(100, "Company name cannot exceed 100 characters"),
  industry: z.string().max(100, "Industry cannot exceed 100 characters").optional(),
  website: z.string().url("Please enter a valid URL").optional().or(z.literal("")),
  contact_name: z
    .string()
    .min(2, "Contact name must be at least 2 characters")
    .max(100, "Contact name cannot exceed 100 characters"),
  contact_email: z.string().email("Please enter a valid email address"),
  contact_phone: z.string().optional(),
  company_size: z.string().max(50, "Company size cannot exceed 50 characters").optional(),
});

type ClientFormData = z.infer<typeof clientSchema>;

interface ClientDetailsSectionProps {
  client: Client | null;
}

export function ClientDetailsSection({ client }: ClientDetailsSectionProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const {
    register,
    handleSubmit,
    formState: { errors, isDirty },
    reset,
    setValue,
    watch,
  } = useForm<ClientFormData>({
    resolver: zodResolver(clientSchema),
    defaultValues: {
      company_name: client?.company_name || "",
      industry: client?.industry || "",
      website: client?.website || "",
      contact_name: client?.contact_name || "",
      contact_email: client?.contact_email || "",
      contact_phone: client?.contact_phone || "",
      company_size: client?.company_size || "",
    },
  });

  const onSubmit = async (data: ClientFormData) => {
    setIsSubmitting(true);

    try {
      const result = await upsertClientProfile({
        company_name: data.company_name,
        industry: data.industry || undefined,
        website: data.website || undefined,
        contact_name: data.contact_name,
        contact_email: data.contact_email,
        contact_phone: data.contact_phone || undefined,
        company_size: data.company_size || undefined,
      });

      if (result.error) {
        toast({
          title: "Update failed",
          description: result.error,
          variant: "destructive",
        });
      } else {
        toast({
          title: "Profile updated",
          description: "Your client details have been updated successfully.",
        });
        reset(data); // Reset form with new values
      }
    } catch (error) {
      console.error("Client profile update error:", error);
      toast({
        title: "Update failed",
        description: "An unexpected error occurred. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const industryOptions = [
    "Fashion",
    "Technology",
    "Entertainment",
    "Advertising",
    "Media",
    "Retail",
    "Healthcare",
    "Education",
    "Finance",
    "Real Estate",
    "Food & Beverage",
    "Sports",
    "Beauty",
    "Automotive",
    "Other",
  ];

  const companySizeOptions = [
    "1-10 employees",
    "11-50 employees",
    "51-200 employees",
    "201-500 employees",
    "501-1000 employees",
    "1000+ employees",
  ];

  return (
    <Card className="bg-gray-800 border-gray-700">
      <CardHeader>
        <CardTitle className="text-white">Client Details</CardTitle>
        <CardDescription className="text-gray-400">
          Update your company and contact information
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Company Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-white">Company Information</h3>

            <div className="space-y-2">
              <Label
                htmlFor="company_name"
                className={errors.company_name ? "text-red-400" : "text-gray-300"}
              >
                Company Name *
              </Label>
              <Input
                id="company_name"
                placeholder="Enter your company name"
                {...register("company_name")}
                className={
                  errors.company_name
                    ? "border-red-500 bg-gray-700 text-white"
                    : "bg-gray-700 border-gray-600 text-white"
                }
                disabled={isSubmitting}
              />
              {errors.company_name && (
                <p className="text-sm text-red-500">{errors.company_name.message}</p>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="industry" className="text-gray-300">
                  Industry
                </Label>
                <Select
                  value={watch("industry") || ""}
                  onValueChange={(value) => setValue("industry", value)}
                  disabled={isSubmitting}
                >
                  <SelectTrigger className="bg-gray-700 border-gray-600 text-white">
                    <SelectValue placeholder="Select industry" />
                  </SelectTrigger>
                  <SelectContent className="bg-gray-700 border-gray-600">
                    {industryOptions.map((industry) => (
                      <SelectItem
                        key={industry}
                        value={industry}
                        className="text-white hover:bg-gray-600"
                      >
                        {industry}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="company_size" className="text-gray-300">
                  Company Size
                </Label>
                <Select
                  value={watch("company_size") || ""}
                  onValueChange={(value) => setValue("company_size", value)}
                  disabled={isSubmitting}
                >
                  <SelectTrigger className="bg-gray-700 border-gray-600 text-white">
                    <SelectValue placeholder="Select company size" />
                  </SelectTrigger>
                  <SelectContent className="bg-gray-700 border-gray-600">
                    {companySizeOptions.map((size) => (
                      <SelectItem key={size} value={size} className="text-white hover:bg-gray-600">
                        {size}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label
                htmlFor="website"
                className={errors.website ? "text-red-400" : "text-gray-300"}
              >
                Company Website
              </Label>
              <Input
                id="website"
                type="url"
                placeholder="https://your-company.com"
                {...register("website")}
                className={
                  errors.website
                    ? "border-red-500 bg-gray-700 text-white"
                    : "bg-gray-700 border-gray-600 text-white"
                }
                disabled={isSubmitting}
              />
              {errors.website && <p className="text-sm text-red-400">{errors.website.message}</p>}
            </div>
          </div>

          {/* Contact Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-white">Contact Information</h3>

            <div className="space-y-2">
              <Label
                htmlFor="contact_name"
                className={errors.contact_name ? "text-red-400" : "text-gray-300"}
              >
                Contact Person Name *
              </Label>
              <Input
                id="contact_name"
                placeholder="Enter the primary contact person's name"
                {...register("contact_name")}
                className={
                  errors.contact_name
                    ? "border-red-500 bg-gray-700 text-white"
                    : "bg-gray-700 border-gray-600 text-white"
                }
                disabled={isSubmitting}
              />
              {errors.contact_name && (
                <p className="text-sm text-red-400">{errors.contact_name.message}</p>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label
                  htmlFor="contact_email"
                  className={errors.contact_email ? "text-red-400" : "text-gray-300"}
                >
                  Contact Email *
                </Label>
                <Input
                  id="contact_email"
                  type="email"
                  placeholder="contact@your-company.com"
                  {...register("contact_email")}
                  className={
                    errors.contact_email
                      ? "border-red-500 bg-gray-700 text-white"
                      : "bg-gray-700 border-gray-600 text-white"
                  }
                  disabled={isSubmitting}
                />
                {errors.contact_email && (
                  <p className="text-sm text-red-400">{errors.contact_email.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="contact_phone" className="text-gray-300">
                  Contact Phone
                </Label>
                <Input
                  id="contact_phone"
                  placeholder="Enter contact phone number"
                  {...register("contact_phone")}
                  disabled={isSubmitting}
                  className="bg-gray-700 border-gray-600 text-white"
                />
              </div>
            </div>
          </div>

          <div className="flex justify-end pt-4">
            <Button
              type="submit"
              disabled={isSubmitting || !isDirty}
              className="min-w-[100px] bg-white text-black hover:bg-gray-200"
            >
              {isSubmitting ? "Saving..." : "Save Changes"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
