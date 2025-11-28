 "use client";

import { ArrowLeft } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import type React from "react";
import { useEffect, useState } from "react";
import { useAuth } from "@/components/auth/auth-provider";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
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
import { submitClientApplication } from "@/lib/actions/client-actions";
export default function ClientApplicationPage() {
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    companyName: "",
    email: "",
    phone: "",
    industry: "",
    businessDescription: "",
    needsDescription: "",
    website: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const router = useRouter();
  const { toast } = useToast();
  const searchParams = useSearchParams();
  const returnUrl = searchParams?.get("returnUrl") ?? null;
  const { user } = useAuth();
  const [applicationStatus, setApplicationStatus] = useState<{
    status: string | null;
    applicationId?: string;
    adminNotes?: string | null;
  } | null>(null);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [statusLoading, setStatusLoading] = useState(false);

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
      const result = await submitClientApplication({
        firstName: formData.firstName,
        lastName: formData.lastName,
        companyName: formData.companyName,
        email: formData.email,
        phone: formData.phone || null,
        industry: formData.industry || null,
        businessDescription: formData.businessDescription,
        needsDescription: formData.needsDescription,
        website: formData.website || null,
      });

      if (result.error) {
        toast({
          title: "Error submitting application",
          description: result.error,
          variant: "destructive",
        });
        setIsSubmitting(false);
        return;
      }

      // Success - redirect to success page with the application ID for reference
      if (result.applicationId) {
        const search = new URLSearchParams({ applicationId: result.applicationId }).toString();
        router.push(`/client/apply/success?${search}`);
      } else {
        router.push("/client/apply/success");
      }
    } catch (error) {
      console.error("Application submission error:", error);
      toast({
        title: "Error",
        description: "An unexpected error occurred. Please try again.",
        variant: "destructive",
      });
      setIsSubmitting(false);
    }
  };

  useEffect(() => {
    const userEmail = user?.email;
    if (!userEmail) {
      setApplicationStatus(null);
      setStatusMessage(null);
      return;
    }

    const controller = new AbortController();
    const checkStatus = async () => {
      try {
        setStatusLoading(true);
        const response = await fetch(
          `/api/client-applications/status?email=${encodeURIComponent(userEmail)}`,
          { signal: controller.signal }
        );

        if (!response.ok) {
          throw new Error("Unable to check application status");
        }

        const payload = await response.json();

        if (payload.status) {
          setApplicationStatus(payload);

          if (payload.status === "approved") {
            setStatusMessage("Your application is approved — redirecting to the client dashboard.");
            router.push("/client/dashboard");
            return;
          }

          if (payload.status === "pending") {
            setStatusMessage("Thanks for applying! Your application is still under review.");
            return;
          }

          if (payload.status === "rejected") {
            setStatusMessage("Your previous application has been rejected. Please reach out to hello@thetotlagency.com to reapply.");
            return;
          }
        } else {
          setApplicationStatus({ status: null });
          setStatusMessage(null);
        }
      } catch (error) {
        console.error("Failed to load application status", error);
        setStatusMessage("Unable to load your application status right now.");
      } finally {
        if (!controller.signal.aborted) {
          setStatusLoading(false);
        }
      }
    };

    checkStatus();

    return () => controller.abort();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.email]);

  const showStatusPanel =
    applicationStatus?.status && applicationStatus.status !== "approved" && user;
  const shouldShowForm = !applicationStatus?.status;

  return (
    <div className="min-h-screen bg-gray-50 pt-20 sm:pt-24">
      <div className="container mx-auto px-4 py-4 sm:py-12">
        <Link
          href={returnUrl ? decodeURIComponent(returnUrl) : "/"}
          className="inline-flex items-center text-gray-600 hover:text-black mb-4 sm:mb-8"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back
        </Link>

        <div className="max-w-4xl mx-auto bg-white rounded-xl shadow-sm overflow-hidden">
          {statusMessage && (
            <div className="p-4">
              <Alert>
                <AlertTitle>Client Application</AlertTitle>
                <AlertDescription>{statusMessage}</AlertDescription>
              </Alert>
            </div>
          )}
          <div className="grid md:grid-cols-5">
            <div className="md:col-span-2 relative hidden md:block">
              <div className="absolute inset-0 bg-black">
                <Image
                  src="/images/totl-logo.png"
                  alt="Client application"
                  fill
                  className="object-cover opacity-80"
                />
                <div className="absolute inset-0 bg-gradient-to-r from-black/60 to-transparent"></div>
                <div className="absolute bottom-0 left-0 p-8 text-white">
                  <h2 className="text-2xl font-bold mb-2">Apply to Become a Client</h2>
                  <p className="text-white/80">
                    Join our exclusive network and gain access to our premium talent roster
                  </p>
                </div>
              </div>
            </div>

            <div className="md:col-span-3 p-8">
              <div className="mb-8">
                <h1 className="text-2xl font-bold mb-2">Client Application</h1>
                <p className="text-gray-600">
                  Complete the form below to apply as a client with TOTL Agency. Our team will
                  review your application and contact you within 2-3 business days.
                </p>
              </div>

              {showStatusPanel ? (
                <div className="rounded-xl border border-gray-200 bg-gray-50 p-6 text-center">
                  <p className="text-gray-700 font-semibold mb-2">Application Under Review</p>
                  <p className="text-gray-500 text-sm">
                    {applicationStatus.status === 'pending'
                      ? "We received your application and our admin team is reviewing it. You&apos;ll be notified when we have an update."
                      : applicationStatus.status === 'rejected'
                        ? 'Your application was rejected. Please reach out to hello@thetotlagency.com to reapply.'
                        : 'We found an existing application. Check your email for the latest status.'}
                  </p>
                </div>
              ) : shouldShowForm ? (
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
                    <Label htmlFor="businessDescription">Business Description</Label>
                    <Textarea
                      id="businessDescription"
                      placeholder="Tell us about your business and what you do"
                      rows={3}
                      value={formData.businessDescription}
                      onChange={handleChange}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="needsDescription">Talent Needs</Label>
                    <Textarea
                      id="needsDescription"
                      placeholder="Describe the types of talent you&apos;re looking for and your typical projects"
                      rows={4}
                      value={formData.needsDescription}
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
                      disabled={
                        isSubmitting ||
                        applicationStatus?.status === "pending" ||
                        Boolean(statusLoading && user?.email)
                      }
                    >
                      {isSubmitting ? "Submitting..." : "Submit Application"}
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
              ) : null}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
