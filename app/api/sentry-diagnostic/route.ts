import * as Sentry from "@sentry/nextjs";
import { NextResponse } from "next/server";

/**
 * Sentry Diagnostic Endpoint
 * GET /api/sentry-diagnostic
 * 
 * Returns detailed information about Sentry configuration
 */
export async function GET() {
  const isProduction = process.env.VERCEL_ENV === "production";
  
  // Get DSNs from environment
  const productionDSN = process.env.SENTRY_DSN_PROD;
  const devDSN = process.env.SENTRY_DSN_DEV;
  const nextPublicProdDSN = process.env.NEXT_PUBLIC_SENTRY_DSN_PROD;
  const nextPublicDevDSN = process.env.NEXT_PUBLIC_SENTRY_DSN_DEV;
  
  // Extract project IDs from DSNs
  const extractProjectId = (dsn: string | undefined): string | null => {
    if (!dsn) return null;
    const match = dsn.match(/\/(\d+)$/);
    return match ? match[1] : null;
  };
  
  const prodProjectId = extractProjectId(productionDSN || nextPublicProdDSN);
  const devProjectId = extractProjectId(devDSN || nextPublicDevDSN);
  
  // Get current DSN being used (from Sentry's internal state)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const currentDSN = (Sentry as any).getCurrentHub?.()?.getClient?.()?.getDsn?.()?.toString();
  const currentProjectId = extractProjectId(currentDSN);
  
  // Test error capture
  let testErrorId: string | null = null;
  try {
    const testError = new Error("🧪 Sentry Diagnostic Test Error - This should appear in Sentry!");
    testErrorId = Sentry.captureException(testError, {
      tags: {
        diagnostic: true,
        endpoint: "/api/sentry-diagnostic",
        testType: "diagnostic-test",
      },
      extra: {
        timestamp: new Date().toISOString(),
        purpose: "Testing Sentry connection",
        testPurpose: "Verify diagnostic endpoint can send errors",
      },
      level: "info", // Use info level so it doesn't trigger alerts
    }) || null;
    
    // Flush to ensure it's sent immediately
    await Sentry.flush(2000);
    
    // eslint-disable-next-line no-console
    console.log("[Sentry Diagnostic] Test error sent. Event ID:", testErrorId);
  } catch (error) {
    console.error("Failed to capture test error:", error);
  }
  
  return NextResponse.json({
    success: true,
    timestamp: new Date().toISOString(),
    environment: {
      nodeEnv: process.env.NODE_ENV,
      vercelEnv: process.env.VERCEL_ENV,
      isProduction,
    },
    configuration: {
      server: {
        productionDSN: productionDSN ? `${productionDSN.substring(0, 30)}...` : "Not set",
        productionProjectId: prodProjectId,
        devDSN: devDSN ? `${devDSN.substring(0, 30)}...` : "Not set",
        devProjectId: devProjectId,
        currentDSN: currentDSN ? `${currentDSN.substring(0, 30)}...` : "Unknown",
        currentProjectId: currentProjectId,
      },
      client: {
        nextPublicProdDSN: nextPublicProdDSN ? `${nextPublicProdDSN.substring(0, 30)}...` : "Not set",
        nextPublicProdProjectId: extractProjectId(nextPublicProdDSN),
        nextPublicDevDSN: nextPublicDevDSN ? `${nextPublicDevDSN.substring(0, 30)}...` : "Not set",
        nextPublicDevProjectId: extractProjectId(nextPublicDevDSN),
      },
    },
    expectedProject: {
      name: "sentry-yellow-notebook",
      id: "4510191108292609",
      url: "https://sentry.io/organizations/the-digital-builders-bi/projects/sentry-yellow-notebook/",
    },
    testError: {
      captured: !!testErrorId,
      errorId: testErrorId,
      note: testErrorId 
        ? `Test error sent! Check Sentry dashboard. Error ID: ${testErrorId}`
        : "Failed to capture test error",
    },
    recommendations: [
      currentProjectId !== "4510191108292609" 
        ? `⚠️ Currently using project ID ${currentProjectId}, but expected 4510191108292609. Update your .env.local DSNs.`
        : "✅ Project ID matches expected value",
      !productionDSN && !devDSN
        ? "⚠️ No SENTRY_DSN_* env vars set - using hardcoded fallback"
        : "✅ DSN environment variables are set",
    ],
  });
}

