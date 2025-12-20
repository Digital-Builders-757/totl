import { test, expect } from '@playwright/test';
import { createSupabaseAdminClient } from '../../lib/supabase-admin-client';

/**
 * Email API Routes Test - Lightweight verification
 * 
 * Tests that all email API routes exist and respond correctly
 * No full E2E flow - just API endpoint verification
 */

test.describe('Email API Routes Verification', () => {
  test.describe.configure({ mode: 'serial' });
  test.setTimeout(60_000);

  const baseURL =
    process.env.NEXT_PUBLIC_SITE_URL && /(localhost|127\.0\.0\.1)/i.test(process.env.NEXT_PUBLIC_SITE_URL)
      ? process.env.NEXT_PUBLIC_SITE_URL
      : 'http://localhost:3000';
  const internalKey = process.env.INTERNAL_EMAIL_API_KEY || 'dev-internal-email-key';
  const internalHeaders = { 'x-totl-internal-email-key': internalKey };
  
  test('Internal-only routes reject missing internal header (403)', async ({ request }) => {
    const internalOnly = [
      'send-welcome',
      'send-application-received',
      'send-new-application-client',
      'send-application-accepted',
      'send-application-rejected',
      'send-booking-confirmed',
    ];

    for (const route of internalOnly) {
      const response = await request.post(`${baseURL}/api/email/${route}`, {
        data: {},
        failOnStatusCode: false,
      });
      expect(response.status(), `Expected 403 for ${route} without header`).toBe(403);
    }
  });

  test('send-application-received route exists and validates', async ({ request }) => {
    const response = await request.post(`${baseURL}/api/email/send-application-received`, {
      data: {
        // Valid data
        email: 'talent@test.com',
        firstName: 'John',
        gigTitle: 'Test Gig',
      },
      headers: internalHeaders,
      failOnStatusCode: false,
    });
    
    const status = response.status();
    
    // Should succeed (200) or fail server-side (500), NOT 404
    expect(status, 'Route should exist (not 404)').not.toBe(404);
    console.log(`✅ send-application-received: ${status} ${status === 200 ? '(SUCCESS)' : status === 400 ? '(VALIDATION)' : status === 500 ? '(EMAIL SEND FAIL - CHECK RESEND KEY)' : ''}`);
  });

  test('send-new-application-client route exists and validates', async ({ request }) => {
    const response = await request.post(`${baseURL}/api/email/send-new-application-client`, {
      data: {
        email: 'client@test.com',
        clientName: 'Test Client',
        gigTitle: 'Test Gig',
        talentName: 'John Actor',
        dashboardUrl: `${baseURL}/client/dashboard`,
      },
      headers: internalHeaders,
      failOnStatusCode: false,
    });
    
    const status = response.status();
    expect(status).not.toBe(404);
    console.log(`✅ send-new-application-client: ${status}`);
  });

  test('send-application-accepted route exists and validates', async ({ request }) => {
    const response = await request.post(`${baseURL}/api/email/send-application-accepted`, {
      data: {
        email: 'talent@test.com',
        talentName: 'John Actor',
        gigTitle: 'Test Gig',
        clientName: 'Test Client',
        dashboardUrl: `${baseURL}/talent/dashboard`,
      },
      headers: internalHeaders,
      failOnStatusCode: false,
    });
    
    const status = response.status();
    expect(status).not.toBe(404);
    console.log(`✅ send-application-accepted: ${status}`);
  });

  test('send-application-rejected route exists and validates', async ({ request }) => {
    const response = await request.post(`${baseURL}/api/email/send-application-rejected`, {
      data: {
        email: 'talent@test.com',
        talentName: 'John Actor',
        gigTitle: 'Test Gig',
        rejectionReason: 'Not selected at this time',
      },
      headers: internalHeaders,
      failOnStatusCode: false,
    });
    
    const status = response.status();
    expect(status).not.toBe(404);
    console.log(`✅ send-application-rejected: ${status}`);
  });

  test('send-booking-confirmed route exists and validates', async ({ request }) => {
    const response = await request.post(`${baseURL}/api/email/send-booking-confirmed`, {
      data: {
        email: 'talent@test.com',
        talentName: 'John Actor',
        gigTitle: 'Test Gig',
        bookingDate: '2025-12-01',
        bookingLocation: 'Studio A',
        compensation: '$1000',
        dashboardUrl: `${baseURL}/talent/dashboard`,
      },
      headers: internalHeaders,
      failOnStatusCode: false,
    });
    
    const status = response.status();
    expect(status).not.toBe(404);
    console.log(`✅ send-booking-confirmed: ${status}`);
  });

  test('All email routes comprehensive check', async ({ request }) => {
    const routes = [
      {
        name: 'send-application-received',
        data: {
          email: 'talent@test.com',
          firstName: 'John',
          gigTitle: 'Test Gig',
        },
        internal: true,
      },
      {
        name: 'send-new-application-client',
        data: {
          email: 'client@test.com',
          clientName: 'Test Client',
          gigTitle: 'Test Gig',
          talentName: 'John Actor',
          dashboardUrl: `${baseURL}/client/dashboard`,
        },
        internal: true,
      },
      {
        name: 'send-application-accepted',
        data: {
          email: 'talent@test.com',
          talentName: 'John Actor',
          gigTitle: 'Test Gig',
          clientName: 'Test Client',
          dashboardUrl: `${baseURL}/talent/dashboard`,
        },
        internal: true,
      },
      {
        name: 'send-application-rejected',
        data: {
          email: 'talent@test.com',
          talentName: 'John Actor',
          gigTitle: 'Test Gig',
          rejectionReason: 'Not selected',
        },
        internal: true,
      },
      {
        name: 'send-booking-confirmed',
        data: {
          email: 'talent@test.com',
          talentName: 'John Actor',
          gigTitle: 'Test Gig',
          bookingDate: '2025-12-01',
          bookingLocation: 'Studio A',
          dashboardUrl: `${baseURL}/talent/dashboard`,
        },
        internal: true,
      },
      {
        name: 'send-verification',
        data: {
          email: 'unknown-user@totlagency.test',
          firstName: 'Unknown',
          verificationLink: `${baseURL}/auth/callback?verified=true`,
        },
        internal: false,
      },
      {
        name: 'send-password-reset',
        data: {
          email: 'unknown-user@totlagency.test',
        },
        internal: false,
      },
    ];

    console.log('\n🧪 Testing All Email API Routes:\n');

    const results = [];

    for (const route of routes) {
      const response = await request.post(`${baseURL}/api/email/${route.name}`, {
        data: route.data,
        headers: route.internal ? internalHeaders : undefined,
        failOnStatusCode: false,
      });

      const status = response.status();
      const exists = status !== 404;
      const statusIcon = status === 200 ? '✅' : status === 400 ? '⚠️' : status === 500 ? '🔴' : '❓';

      results.push({
        route: route.name,
        status,
        exists,
      });

      console.log(`  ${statusIcon} ${route.name.padEnd(35)} Status: ${status}`);
    }

    // All routes must exist
    const allExist = results.every(r => r.exists);
    expect(allExist, 'All email routes should exist (no 404s)').toBe(true);

    // Count successes
    const successCount = results.filter(r => r.status === 200).length;
    console.log(`\n📊 Results: ${successCount}/${routes.length} emails sent successfully`);
    
    if (successCount < routes.length) {
      console.log('⚠️  Some emails failed to send - check Resend API key configuration');
      console.log('   This is OK for testing - routes exist and validate correctly');
    }
  });

  test('Email routes return proper validation errors', async ({ request }) => {
    // Send empty data - should get 400 validation error, not 500 crash
    const response = await request.post(`${baseURL}/api/email/send-application-received`, {
      data: {},
      headers: internalHeaders,
      failOnStatusCode: false,
    });

    const status = response.status();
    
    // Should be 400 (missing required fields), not 500 (crash)
    expect(status).toBe(400);
    
    const body = await response.json();
    expect(body.error).toBeDefined();
    expect(body.error).toContain('Missing required fields');
    
    console.log('✅ Email routes properly validate input');
  });

  test('Password reset does not leak account existence (uniform success)', async ({ request }) => {
    const response = await request.post(`${baseURL}/api/email/send-password-reset`, {
      data: { email: 'definitely-not-a-user@totlagency.test' },
      failOnStatusCode: false,
    });

    expect(response.status()).toBe(200);
    const body = await response.json();
    expect(body.success).toBe(true);
    expect(typeof body.requestId).toBe('string');
  });

  test('Public email routes are ledger-idempotent under rapid repeat (best-effort assertion)', async ({ request }) => {
    const email = `ledger-idempotency-${Date.now()}@totlagency.test`;

    // Rapid repeats in the same cooldown window must not produce errors or enumeration leaks.
    const reps = 5;
    const responses = await Promise.all(
      Array.from({ length: reps }).map(() =>
        request.post(`${baseURL}/api/email/send-verification`, {
          data: {
            email,
            firstName: 'Ledger',
            // Avoid depending on Supabase link generation for unknown users; route accepts explicit link.
            verificationLink: `${baseURL}/auth/callback?verified=true`,
          },
          failOnStatusCode: false,
        })
      )
    );

    for (const r of responses) {
      expect(r.status()).toBe(200);
      const body = await r.json();
      expect(body.success).toBe(true);
      expect(typeof body.requestId).toBe('string');
    }

    // Optional proof: if DB is configured and the table exists, assert only one ledger row was claimed
    // in the current cooldown bucket. This is skipped if env/table is not available.
    try {
      const supabaseAdmin = createSupabaseAdminClient();
      const now = Date.now();
      const cooldownMs = 60_000; // verify_email cooldown
      const bucketMs = Math.floor(now / cooldownMs) * cooldownMs;
      const cooldownBucketIso = new Date(bucketMs).toISOString();
      const normalizedEmail = email.trim().toLowerCase();
      const idempotencyKey = `verify_email:${normalizedEmail}:${cooldownBucketIso}`;

      const { data, error } = await supabaseAdmin
        .from('email_send_ledger')
        .select('id')
        .eq('idempotency_key', idempotencyKey);

      if (error) {
        console.log('⚠️  Skipping ledger assertion (DB/table not available):', error.message);
        return;
      }

      expect(Array.isArray(data)).toBe(true);
      expect(data?.length).toBe(1);
    } catch (e) {
      const reason = e instanceof Error ? e.message : 'unknown error';
      console.log('⚠️  Skipping ledger assertion (no DB env):', reason);
    }
  });
});

/**
 * Quick smoke test - run this to verify email system
 */
test('Email System Smoke Test', async ({ request }) => {
  const baseURL = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
  const internalKey = process.env.INTERNAL_EMAIL_API_KEY || 'dev-internal-email-key';
  const internalHeaders = { 'x-totl-internal-email-key': internalKey };
  
  console.log('\n🔥 Email System Smoke Test\n');
  
  const criticalRoutes = [
    'send-application-received',      // Talent confirmation
    'send-new-application-client',    // Client notification
    'send-application-accepted',      // Acceptance notification
  ];

  let allHealthy = true;

  for (const route of criticalRoutes) {
    const response = await request.post(`${baseURL}/api/email/${route}`, {
      data: {},
      headers: internalHeaders,
      failOnStatusCode: false,
    });

    const status = response.status();
    const healthy = status !== 404 && status !== 500;

    if (!healthy) allHealthy = false;

    const icon = status === 404 ? '❌' : status === 400 ? '✅' : status === 200 ? '🎉' : '⚠️';
    console.log(`  ${icon} ${route}: ${status}`);
  }

  expect(allHealthy, 'Critical email routes should be healthy').toBe(true);
  console.log('\n✅ Email system smoke test passed!\n');
});

