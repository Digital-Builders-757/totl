import { afterEach, beforeEach, describe, expect, it } from "vitest";
import {
  generateClientApplicationApprovedEmail,
  generateClientApplicationConfirmationEmail,
  generateClientApplicationFollowUpAdminEmail,
  generateClientApplicationFollowUpApplicantEmail,
  generateClientApplicationRejectedEmail,
} from "@/lib/services/email-templates";

const originalSiteUrl = process.env.NEXT_PUBLIC_SITE_URL;

beforeEach(() => {
  process.env.NEXT_PUBLIC_SITE_URL = "https://tests.totl.agency";
});

afterEach(() => {
  process.env.NEXT_PUBLIC_SITE_URL = originalSiteUrl;
});

describe("client application email templates", () => {
  it("builds a confirmation email with escaped company metadata", () => {
    const template = generateClientApplicationConfirmationEmail({
      name: "Jordan Avery",
      companyName: "Sunrise & Co <LLC>",
      industry: "Media & Entertainment",
      applicationId: "cab-test-123",
      applicationDate: "Jan 1, 2025",
    });

    expect(template.subject).toBe("✅ Application Received - TOTL Agency Client Onboarding");
    expect(template.html).toContain("Sunrise &amp; Co &lt;LLC&gt;");
    expect(template.html).toContain("<code>cab-test-123</code>");
    expect(template.html).toContain("Jan 1, 2025");
    expect(template.html).toContain('href="https://tests.totl.agency/talent"');
  });

  it("includes admin notes and login CTA in approval emails", () => {
    const template = generateClientApplicationApprovedEmail({
      name: "Morgan Lee",
      adminNotes: "Excited to onboard <VIP talent>",
      loginUrl: "https://portal.totl.agency/login",
    });

    expect(template.subject).toBe("🎉 Welcome to TOTL Agency - Application Approved!");
    expect(template.html).toContain("Excited to onboard &lt;VIP talent&gt;");
    expect(template.html).toContain('href="https://portal.totl.agency/login"');
  });

  it("renders rejection feedback when provided", () => {
    const template = generateClientApplicationRejectedEmail({
      name: "Morgan Lee",
      adminNotes: "Need more runway work & experience.",
    });

    expect(template.subject).toBe("Application Status Update - TOTL Agency");
    expect(template.html).toContain("Need more runway work &amp; experience.");
  });

  it("summarizes metadata in applicant follow-up emails", () => {
    const template = generateClientApplicationFollowUpApplicantEmail({
      name: "Jordan Avery",
      companyName: "Sunrise Model Group",
      applicationId: "cab-follow-789",
      applicationDate: "Oct 15, 2025",
    });

    expect(template.subject).toBe("We’re still reviewing your TOTL Agency application");
    expect(template.html).toContain("<code>cab-follow-789</code>");
    expect(template.html).toContain("Submitted: Oct 15, 2025");
  });

  it("uses the configured site url and escapes details in admin follow-ups", () => {
    const template = generateClientApplicationFollowUpAdminEmail({
      name: "Jordan Avery",
      clientName: "ops@sunrise.agency",
      companyName: "Sunrise & Co",
      industry: "Events",
      applicationId: "cab-pending-001",
      applicationDate: "Oct 10, 2025",
      businessDescription: "Need <models> with brand experience",
      needsDescription: "Editorial & runway talent",
    });

    expect(template.subject).toBe("Reminder: Pending client application awaiting review");
    expect(template.html).toContain('href="https://tests.totl.agency/admin/client-applications"');
    expect(template.html).toContain("Sunrise &amp; Co");
    expect(template.html).toContain("Need &lt;models&gt; with brand experience");
    expect(template.html).toContain("Editorial &amp; runway talent");
  });
});

