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
import { logger } from "@/lib/utils/logger";

async function waitForServerSessionReady(maxAttempts = 6): Promise<boolean> {
  for (let attempt = 0; attempt < maxAttempts; attempt += 1) {
    try {
      const response = await fetch("/api/auth/session-ready", {
        method: "GET",
        cache: "no-store",
        credentials: "include",
      });

      if (response.ok) {
        return true;
      }
    } catch {
      // Ignore probe errors and retry with short backoff.
    }

    if (attempt < maxAttempts - 1) {
      await new Promise((resolve) => setTimeout(resolve, 200 * (attempt + 1)));
    }
  }

  return false;
}

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
  const [hasStartedEditing, setHasStartedEditing] = useState(false);
  const [hasSubmitted, setHasSubmitted] = useState(false);
  const router = useRouter();
  const { toast } = useToast();
  const searchParams = useSearchParams();
  const returnUrl = searchParams?.get("returnUrl") ?? null;
  const { user, profile, userRole, isLoading: authLoading } = useAuth();
  const [applicationStatus, setApplicationStatus] = useState<{
    status: string | null;
    applicationId?: string;
    adminNotes?: string | null;
  } | null>(null);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [isCheckingStatus, setIsCheckingStatus] = useState(false);

  const isCareerBuilder = userRole === "client" || profile?.role === "client";

  useEffect(() => {
    if (authLoading || !user || !isCareerBuilder) return;
    router.replace("/client/dashboard");
  }, [authLoading, user, isCareerBuilder, router]);

  useEffect(() => {
    if (!user) return;

    const metadata = (user.user_metadata ?? {}) as Record<string, unknown>;
    const firstName = typeof metadata.first_name === "string" ? metadata.first_name : "";
    const lastName = typeof metadata.last_name === "string" ? metadata.last_name : "";
    const email = user.email ?? "";

    setFormData((prev) => ({
      ...prev,
      firstName: prev.firstName || firstName,
      lastName: prev.lastName || lastName,
      email: prev.email || email,
    }));
  }, [user]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { id, value } = e.target;
    if (!hasStartedEditing) setHasStartedEditing(true);
    setFormData((prev) => ({ ...prev, [id]: value }));
  };

  const handleSelectChange = (value: string) => {
    setFormData((prev) => ({ ...prev, industry: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const serverSessionReady = await waitForServerSessionReady();
      if (!serverSessionReady) {
        toast({
          title: "Still signing you in",
          description: "Your session is still finishing. Please wait a moment and try again.",
          variant: "destructive",
        });
        setIsSubmitting(false);
        return;
      }

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

      // ✅ Only now do we mark it as successfully submitted
      setHasSubmitted(true);

      // Success - redirect to success page with the application ID for reference
      if (result.applicationId) {
        const search = new URLSearchParams({ applicationId: result.applicationId }).toString();
        router.push(`/client/apply/success?${search}`);
      } else {
        router.push("/client/apply/success");
      }
    } catch (error) {
      logger.error("Application submission error:", error);
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
    if (!userEmail || hasStartedEditing || hasSubmitted) {
      setApplicationStatus(null);
      setStatusMessage(null);
      setIsCheckingStatus(false);
      return;
    }

    const controller = new AbortController();
    const checkStatus = async () => {
      setIsCheckingStatus(true);
      try {
        let response: Response | null = null;

        for (let attempt = 0; attempt < 6; attempt += 1) {
          const serverSessionReady = await waitForServerSessionReady();
          if (!serverSessionReady) {
            setStatusMessage("Finalizing your sign-in. Checking application status...");
            continue;
          }

          response = await fetch(`/api/client-applications/status`, { signal: controller.signal });

          // Invite/callback flows can briefly race server cookie visibility even after
          // the browser session exists. Retry auth failures before surfacing an error.
          if (response.ok) {
            break;
          }

          if (response.status === 401 || response.status === 403) {
            setStatusMessage("Finalizing your sign-in. Checking application status...");
            if (attempt < 5) {
              await new Promise((resolve) => setTimeout(resolve, 200 * (attempt + 1)));
              continue;
            }
          }

          break;
        }

        if (!response?.ok) {
          throw new Error("Unable to check application status");
        }

        const payload = await response.json();

        if (payload.status) {
          setApplicationStatus(payload);

          if (payload.status === "approved") {
            setStatusMessage("Your application is approved — redirecting to the Career Builder dashboard.");
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
        logger.error("Failed to load application status", error);
        setStatusMessage("Unable to load your application status right now.");
      } finally {
        setIsCheckingStatus(false);
      }
    };

    checkStatus();

    return () => {
      controller.abort();
    };
  }, [user?.email, hasStartedEditing, hasSubmitted, router]);

  const showStatusPanel =
    !hasStartedEditing &&
    applicationStatus?.status &&
    applicationStatus.status !== "approved" &&
    user;
  const shouldShowForm =
    !isCareerBuilder &&
    (hasStartedEditing || !applicationStatus?.status) &&
    !isCheckingStatus;
  const labelClass = "text-sm font-semibold text-white/80";
  const inputClass =
    "border-border/50 bg-card/45 text-white placeholder:text-white/45 focus-visible:border-amber-500";

  if (authLoading && user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[var(--oklch-bg)] px-4 pt-20 text-white sm:pt-24">
        <p className="text-white/70 text-center">Loading your account…</p>
      </div>
    );
  }

  if (user && isCareerBuilder) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[var(--oklch-bg)] px-4 pt-20 text-white sm:pt-24">
        <p className="text-white/70 text-center">Redirecting to your Career Builder dashboard…</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--oklch-bg)] pt-20 text-white sm:pt-24">
      <div className="container mx-auto px-4 py-4 sm:py-12">
        <Link
          href={returnUrl ? decodeURIComponent(returnUrl) : "/"}
          className="inline-flex items-center text-white/70 hover:text-white mb-4 sm:mb-8"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back
        </Link>

        <div className="mx-auto max-w-4xl overflow-hidden rounded-3xl panel-frosted card-backlit shadow-xl">
          {statusMessage && (
            <div className="border-b border-border/40 bg-card/25 p-4">
              <Alert className="border-border/40 bg-card/25 text-white">
                <AlertTitle className="text-white">Career Builder Application</AlertTitle>
                <AlertDescription className="text-white/80">{statusMessage}</AlertDescription>
              </Alert>
            </div>
          )}
          <div className="grid md:grid-cols-5">
            <div className="md:col-span-2 relative hidden md:block">
              <div className="absolute inset-0">
                <Image
                  src="/images/client-professional.png"
                  alt="Client professionals in discussion"
                  fill
                  className="object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-r from-slate-950/90 to-transparent"></div>
                <div className="absolute inset-0 bg-gradient-to-r from-black/60 to-transparent"></div>
                <div className="absolute bottom-0 left-0 p-8 text-white">
                  <h2 className="text-2xl font-bold mb-2">Apply to Become a Career Builder</h2>
                  <p className="text-white/80">
                    Join our exclusive network and gain access to our premium talent roster
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-card/10 p-8 md:col-span-3">
              <div className="mb-8">
                <h1 className="text-2xl font-bold mb-2">Career Builder Application</h1>
                <p className="text-white/70">
                  Complete the form below to apply as a Career Builder with TOTL Agency. Our team will
                  review your application and contact you within 2-3 business days.
                </p>
              </div>

              {showStatusPanel ? (
                <div className="panel-frosted card-backlit rounded-2xl p-6 text-left">
                  <p className="text-white font-semibold mb-2">Application Under Review</p>
                  <p className="text-white/70 text-sm">
                    {applicationStatus.status === 'pending'
                      ? "We received your application and our admin team is reviewing it. You&apos;ll be notified when we have an update."
                      : applicationStatus.status === 'rejected'
                        ? 'Your application was rejected. Please reach out to hello@thetotlagency.com to reapply.'
                        : 'We found an existing application. Check your email for the latest status.'}
                  </p>
                </div>
              ) : isCheckingStatus ? (
                <div className="panel-frosted card-backlit rounded-2xl p-6 text-left">
                  <p className="text-white font-semibold mb-2">Checking application status</p>
                  <p className="text-white/70 text-sm">
                    Finalizing your sign-in and checking whether you already have a Career Builder application on file.
                  </p>
                </div>
              ) : shouldShowForm ? (
                <form className="space-y-6 text-white" onSubmit={handleSubmit}>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label className={labelClass} htmlFor="firstName">
                        First Name
                      </Label>
                      <Input
                        id="firstName"
                        className={inputClass}
                        placeholder="Enter your first name"
                        value={formData.firstName}
                        onChange={handleChange}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className={labelClass} htmlFor="lastName">
                        Last Name
                      </Label>
                      <Input
                        id="lastName"
                        className={inputClass}
                        placeholder="Enter your last name"
                        value={formData.lastName}
                        onChange={handleChange}
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label className={labelClass} htmlFor="companyName">
                      Company Name
                    </Label>
                    <Input
                      id="companyName"
                      className={inputClass}
                      placeholder="Enter your company name"
                      value={formData.companyName}
                      onChange={handleChange}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label className={labelClass} htmlFor="email">
                      Business Email
                    </Label>
                    <Input
                      id="email"
                      className={inputClass}
                      type="email"
                      placeholder="Enter your business email"
                      value={formData.email}
                      onChange={handleChange}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label className={labelClass} htmlFor="phone">
                      Phone Number
                    </Label>
                    <Input
                      id="phone"
                      className={inputClass}
                      placeholder="Enter your phone number"
                      value={formData.phone}
                      onChange={handleChange}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label className={labelClass} htmlFor="industry">
                      Industry
                    </Label>
                    <Select value={formData.industry} onValueChange={handleSelectChange}>
                      <SelectTrigger id="industry" className="border-border/50 bg-card/45 text-white">
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
                    <Label className={labelClass} htmlFor="businessDescription">
                      Business Description
                    </Label>
                    <Textarea
                      className={inputClass}
                      id="businessDescription"
                      placeholder="Tell us about your business and what you do"
                      rows={3}
                      value={formData.businessDescription}
                      onChange={handleChange}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label className={labelClass} htmlFor="needsDescription">
                      Talent Needs
                    </Label>
                    <Textarea
                      className={inputClass}
                      id="needsDescription"
                      placeholder="Describe the types of talent you&apos;re looking for and your typical projects"
                      rows={4}
                      value={formData.needsDescription}
                      onChange={handleChange}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label className={labelClass} htmlFor="website">
                      Company Website (Optional)
                    </Label>
                    <Input
                      id="website"
                      className={inputClass}
                      placeholder="Enter your company website"
                      value={formData.website}
                      onChange={handleChange}
                    />
                  </div>

                  <div className="pt-4">
                    <Button
                      type="submit"
                      className="w-full bg-amber-500 text-black hover:bg-amber-400"
                      disabled={
                        isSubmitting ||
                        applicationStatus?.status === "pending"
                      }
                    >
                      {isSubmitting ? "Submitting..." : "Submit Application"}
                    </Button>
                    <p className="text-sm text-white/60 mt-4 text-left">
                      By submitting this form, you agree to our{" "}
                      <Link href="/terms" className="underline text-white/70">
                        Terms of Service
                      </Link>{" "}
                      and{" "}
                      <Link href="/privacy" className="underline text-white/70">
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
