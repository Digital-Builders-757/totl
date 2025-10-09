"use client";

import { ArrowLeft } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import type React from "react";

import { useState } from "react";
import { useAuth } from "@/components/auth/auth-provider";
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

export default function ClientSignup() {
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    companyName: "",
    email: "",
    password: "",
    phone: "",
    industry: "",
    projectDescription: "",
    website: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { signUp, supabase } = useAuth(); // Moved useAuth here to prevent conditional hook call
  const router = useRouter();
  const { toast } = useToast();
  const searchParams = useSearchParams();
  const returnUrl = searchParams.get("returnUrl");

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { id, value } = e.target;
    setFormData((prev) => ({ ...prev, [id]: value }));
  };

  const handleSelectChange = (value: string) => {
    setFormData((prev) => ({ ...prev, industry: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // Register the user with Supabase Auth
      const { error } = await signUp(formData.email, formData.password, {
        data: {
          role: "client",
          first_name: formData.firstName,
          last_name: formData.lastName,
        },
      });

      if (error) {
        toast({
          title: "Error creating account",
          description: error.message,
          variant: "destructive",
        });
        setIsSubmitting(false);
        return;
      }

      // Create client profile
      const user = (await supabase.auth.getUser()).data.user;

      if (user) {
        const { error: profileError } = await supabase.from("client_profiles").insert([
          {
            user_id: user.id,
            company_name: formData.companyName,
            industry: formData.industry || null,
            website: formData.website || null,
            contact_name: `${formData.firstName} ${formData.lastName}`,
            contact_email: formData.email,
            contact_phone: formData.phone || null,
            company_size: null,
          },
        ]);

        if (profileError) {
          console.error("Error creating client profile:", profileError);
          toast({
            title: "Profile creation issue",
            description:
              "Your account was created but we had trouble setting up your profile. Please contact support.",
            variant: "destructive",
          });
        }

        // Update the user's profile with first and last name
        const { error: updateError } = await supabase
          .from("profiles")
          .update({
            first_name: formData.firstName,
            last_name: formData.lastName,
            updated_at: new Date().toISOString(),
          })
          .eq("id", user.id);

        if (updateError) {
          console.error("Error updating profile:", updateError);
        }
      }

      // Success - redirect to returnUrl, success page or dashboard
      toast({
        title: "Account created!",
        description: "Your client account has been created successfully.",
      });

      if (returnUrl) {
        router.push(decodeURIComponent(returnUrl));
      } else {
        router.push("/admin/dashboard");
      }
    } catch (error) {
      console.error("Signup error:", error);
      toast({
        title: "Error",
        description: "An unexpected error occurred. Please try again.",
        variant: "destructive",
      });
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 pt-24">
      <div className="container mx-auto px-4 py-12">
        <Link
          href={returnUrl ? `/choose-role?returnUrl=${returnUrl}` : "/"}
          className="inline-flex items-center text-gray-600 hover:text-black mb-8"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back
        </Link>

        <div className="max-w-4xl mx-auto bg-white rounded-xl shadow-sm overflow-hidden">
          <div className="grid md:grid-cols-5">
            <div className="md:col-span-2 relative hidden md:block">
              <div className="absolute inset-0 bg-black">
                <Image
                  src="/images/totl-logo.png"
                  alt="Client registration"
                  fill
                  className="object-cover opacity-80"
                />
                <div className="absolute inset-0 bg-gradient-to-r from-black/60 to-transparent"></div>
                <div className="absolute bottom-0 left-0 p-8 text-white">
                  <h2 className="text-2xl font-bold mb-2">Register as a Client</h2>
                  <p className="text-white/80">
                    Access our premium talent pool and build your dream campaigns
                  </p>
                </div>
              </div>
            </div>

            <div className="md:col-span-3 p-8">
              <div className="mb-8">
                <h1 className="text-2xl font-bold mb-2">Client Registration</h1>
                <p className="text-gray-600">
                  Complete the form below to register as a client with TOTL Agency. Our team will
                  review your information and set up your account within 1-2 business days.
                </p>
              </div>

              <form className="space-y-6" onSubmit={handleSubmit}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="firstName">First Name</Label>
                    <Input
                      id="firstName"
                      placeholder="Enter your first name"
                      value={formData.firstName}
                      onChange={handleChange}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="lastName">Last Name</Label>
                    <Input
                      id="lastName"
                      placeholder="Enter your last name"
                      value={formData.lastName}
                      onChange={handleChange}
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="companyName">Company Name</Label>
                  <Input
                    id="companyName"
                    placeholder="Enter your company name"
                    value={formData.companyName}
                    onChange={handleChange}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">Business Email</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="Enter your business email"
                    value={formData.email}
                    onChange={handleChange}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <Input
                    id="password"
                    type="password"
                    placeholder="Create a password"
                    value={formData.password}
                    onChange={handleChange}
                    required
                    minLength={8}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone">Phone Number</Label>
                  <Input
                    id="phone"
                    placeholder="Enter your phone number"
                    value={formData.phone}
                    onChange={handleChange}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="industry">Industry</Label>
                  <Select value={formData.industry} onValueChange={handleSelectChange}>
                    <SelectTrigger id="industry">
                      <SelectValue placeholder="Select your industry" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="fashion">Fashion</SelectItem>
                      <SelectItem value="advertising">Advertising</SelectItem>
                      <SelectItem value="editorial">Editorial</SelectItem>
                      <SelectItem value="commercial">Commercial</SelectItem>
                      <SelectItem value="entertainment">Entertainment</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="projectDescription">Project Description</Label>
                  <Textarea
                    id="projectDescription"
                    placeholder="Tell us about your typical projects and talent needs"
                    rows={4}
                    value={formData.projectDescription}
                    onChange={handleChange}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="website">Company Website (Optional)</Label>
                  <Input
                    id="website"
                    placeholder="Enter your company website"
                    value={formData.website}
                    onChange={handleChange}
                  />
                </div>

                <div className="pt-4">
                  <Button
                    type="submit"
                    className="w-full bg-black text-white hover:bg-black/90"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? "Registering..." : "Register as Client"}
                  </Button>
                  <p className="text-sm text-gray-500 mt-4 text-center">
                    By submitting this form, you agree to our{" "}
                    <Link href="/terms" className="underline">
                      Terms of Service
                    </Link>{" "}
                    and{" "}
                    <Link href="/privacy" className="underline">
                      Privacy Policy
                    </Link>
                    .
                  </p>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
