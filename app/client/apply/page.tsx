"use client";

import { ArrowLeft } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import type React from "react";
import { useEffect, useState } from "react";
import { useAuth } from "@/components/auth/auth-provider";
import { PageShell } from "@/components/layout/page-shell";
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
import {
  type WaitForServerSessionReadyResult,
  waitForServerSessionReady,
} from "@/lib/auth/wait-for-server-session-ready";
import { logger } from "@/lib/utils/logger";

const APPLY_SUBMIT_SESSION_WAIT_MS = 45_000;
/** One bounded wait after navigation before hitting status API (avoids multi-minute nested loops). */
const APPLY_STATUS_INITIAL_WAIT_MS = 28_000;

function sessionProbeFailureToast(
  probe: Extract<WaitForServerSessionReadyResult, { ok: false }>
): { title: string; description: string } {
  switch (probe.terminal) {
    case "server_error":
      return {
        title: "Could not verify your session on our servers",
        description:
          "The sign-in check failed with a server error. Wait a minute, refresh this page, then tap Submit again. If it keeps failing, contact support with the approximate time you tried.",
      };
    case "fetch_timeout":
      return {
        title: "Sign-in check timed out",
        description:
          "Confirming your session took too long to respond. Check your connection, refresh this page, then tap Submit again.",
      };
    case "network":
      return {
        title: "Connection problem during sign-in check",
        description:
          "We could not reach the server to confirm your session. Check your network, refresh this page, then try again.",
      };
    case "not_ready":
      return {
        title: "Could not confirm your session yet",
        description:
          "Your browser signed you in, but our servers did not see the session in time. Refresh this page, then tap Submit again. If it keeps happening, wait one minute and retry.",
      };
  }
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
  const [submitBusyLabel, setSubmitBusyLabel] = useState("Submitting...");
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
    setSubmitBusyLabel("Finishing sign-in…");

    try {
      const sessionProbe = await waitForServerSessionReady({
        maxWaitMs: APPLY_SUBMIT_SESSION_WAIT_MS,
      });
      if (!sessionProbe.ok) {
        logger.warn("[client/apply] session-ready probe exhausted (submit)", {
          terminal: sessionProbe.terminal,
          attempts: sessionProbe.attempts,
          lastHttpStatus: sessionProbe.lastHttpStatus,
          lastBodyReason: sessionProbe.lastBodyReason,
        });
        const { title, description } = sessionProbeFailureToast(sessionProbe);
        toast({
          title,
          description,
          variant: "destructive",
        });
        setIsSubmitting(false);
        setSubmitBusyLabel("Submitting...");
        return;
      }

      setSubmitBusyLabel("Submitting...");

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
        setSubmitBusyLabel("Submitting...");
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
      setSubmitBusyLabel("Submitting...");
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
        setStatusMessage("Finishing sign-in… Checking whether you already have an application on file.");
        const sessionProbe = await waitForServerSessionReady({
          maxWaitMs: APPLY_STATUS_INITIAL_WAIT_MS,
        });
        if (!sessionProbe.ok) {
          logger.warn("[client/apply] session-ready probe exhausted (status prefetch)", {
            terminal: sessionProbe.terminal,
            attempts: sessionProbe.attempts,
            lastHttpStatus: sessionProbe.lastHttpStatus,
            lastBodyReason: sessionProbe.lastBodyReason,
          });
          if (sessionProbe.terminal === "server_error") {
            setStatusMessage(
              "Our servers could not verify your session yet. You can still fill out the form; refresh the page if this message persists."
            );
          } else if (sessionProbe.terminal === "fetch_timeout" || sessionProbe.terminal === "network") {
            setStatusMessage(
              "The sign-in check timed out or hit a connection issue. You can keep filling out the form; refresh if your application status does not load."
            );
          } else {
            setStatusMessage(
              "Still finishing sign-in. You can continue filling out the form — we will retry status in the background."
            );
          }
        }

        let response: Response | null = null;
        for (let attempt = 0; attempt < 8; attempt += 1) {
          response = await fetch(`/api/client-applications/status`, { signal: controller.signal });

          if (response.ok) {
            break;
          }

          if (response.status === 401 || response.status === 403) {
            setStatusMessage("Finishing sign-in… Checking application status.");
            if (attempt < 7) {
              await new Promise((resolve) => setTimeout(resolve, 450 * (attempt + 1)));
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
  const labelClass = "text-sm font-semibold text-[var(--oklch-text-secondary)]";
  const inputClass =
    "border-border/45 bg-card/50 text-[var(--oklch-text-primary)] placeholder:text-[var(--oklch-text-muted)] focus-visible:border-[var(--totl-violet-light)]";

  if (authLoading && user) {
    return (
      <PageShell ambientTone="lifted">
        <div className="flex min-h-[50vh] items-center justify-center px-4">
          <p className="text-[var(--oklch-text-muted)] text-center">Loading your account…</p>
        </div>
      </PageShell>
    );
  }

  if (user && isCareerBuilder) {
    return (
      <PageShell ambientTone="lifted">
        <div className="flex min-h-[50vh] items-center justify-center px-4">
          <p className="text-[var(--oklch-text-muted)] text-center">Redirecting to your Career Builder dashboard…</p>
        </div>
      </PageShell>
    );
  }

  return (
    <PageShell ambientTone="lifted" containerClassName="py-4 sm:py-12">
      <Link
        href={returnUrl ? decodeURIComponent(returnUrl) : "/"}
        className="inline-flex items-center text-[var(--oklch-text-muted)] hover:text-[var(--oklch-text-primary)] mb-4 sm:mb-8 transition-colors"
      >
        <ArrowLeft className="mr-2 h-4 w-4" />
        Back
      </Link>

      <div className="mx-auto max-w-4xl overflow-hidden rounded-3xl panel-frosted card-backlit shadow-xl">
          {statusMessage && (
            <div className="border-b border-border/40 bg-card/25 p-4">
              <Alert className="border-border/40 bg-card/20">
                <AlertTitle className="text-[var(--oklch-text-primary)]">Career Builder Application</AlertTitle>
                <AlertDescription className="text-[var(--oklch-text-muted)]">{statusMessage}</AlertDescription>
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
                <div className="absolute inset-0 bg-gradient-to-r from-slate-950/70 via-slate-900/35 to-transparent" />
                <div className="absolute inset-0 bg-gradient-to-r from-violet-950/25 to-transparent" />
                <div className="absolute bottom-0 left-0 p-8 text-white">
                  <h2 className="text-2xl font-bold mb-2">Apply to Become a Career Builder</h2>
                  <p className="text-white/80">
                    Join our exclusive network and gain access to our premium talent roster
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-br from-violet-500/[0.08] via-card/16 to-sky-500/[0.05] p-8 md:col-span-3">
              <div className="mb-8">
                <h1 className="text-2xl font-bold mb-2">Career Builder Application</h1>
                <p className="text-[var(--oklch-text-muted)]">
                  Complete the form below to apply as a Career Builder with TOTL Agency. Our team will
                  review your application and contact you within 2-3 business days.
                </p>
              </div>

              {showStatusPanel ? (
                <div className="panel-frosted card-backlit rounded-2xl p-6 text-left">
                  <p className="text-[var(--oklch-text-primary)] font-semibold mb-2">Application Under Review</p>
                  <p className="text-[var(--oklch-text-muted)] text-sm">
                    {applicationStatus.status === "pending"
                      ? "We received your application and our admin team is reviewing it. You'll be notified when we have an update."
                      : applicationStatus.status === 'rejected'
                        ? 'Your application was rejected. Please reach out to hello@thetotlagency.com to reapply.'
                        : 'We found an existing application. Check your email for the latest status.'}
                  </p>
                </div>
              ) : isCheckingStatus ? (
                <div className="panel-frosted card-backlit rounded-2xl p-6 text-left">
                  <p className="text-[var(--oklch-text-primary)] font-semibold mb-2">Checking application status</p>
                  <p className="text-[var(--oklch-text-muted)] text-sm">
                    Finalizing your sign-in and checking whether you already have a Career Builder application on file.
                  </p>
                </div>
              ) : shouldShowForm ? (
                <form className="space-y-6 text-[var(--oklch-text-primary)]" onSubmit={handleSubmit}>
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
                      <SelectTrigger id="industry" className={inputClass}>
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
                      className="w-full button-glow border-0 bg-gradient-to-r from-amber-400 to-amber-500 text-black hover:from-amber-300 hover:to-amber-400"
                      disabled={
                        isSubmitting ||
                        applicationStatus?.status === "pending"
                      }
                    >
                      {isSubmitting ? submitBusyLabel : "Submit Application"}
                    </Button>
                    <p className="text-sm text-[var(--oklch-text-muted)] mt-4 text-left">
                      By submitting this form, you agree to our{" "}
                      <Link href="/terms" className="underline text-[var(--oklch-accent)] hover:brightness-110">
                        Terms of Service
                      </Link>{" "}
                      and{" "}
                      <Link href="/privacy" className="underline text-[var(--oklch-accent)] hover:brightness-110">
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
    </PageShell>
  );
}
