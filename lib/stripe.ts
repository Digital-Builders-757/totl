import Stripe from 'stripe';

if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error('STRIPE_SECRET_KEY is required');
}

if (!process.env.STRIPE_WEBHOOK_SECRET) {
  throw new Error('STRIPE_WEBHOOK_SECRET is required');
}

const STRIPE_API_VERSION = '2024-06-20';

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: STRIPE_API_VERSION as Stripe.LatestApiVersion,
  typescript: true,
});

export const STRIPE_WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET;

// Stripe price IDs from environment
export const STRIPE_PRICES = {
  MONTHLY: process.env.STRIPE_PRICE_TALENT_MONTHLY!,
  ANNUAL: process.env.STRIPE_PRICE_TALENT_ANNUAL!,
} as const;

// Validate price IDs are set
if (!STRIPE_PRICES.MONTHLY || !STRIPE_PRICES.ANNUAL) {
  throw new Error('STRIPE_PRICE_TALENT_MONTHLY and STRIPE_PRICE_TALENT_ANNUAL are required');
}

// Helper to get app URL
export function getAppUrl(): string {
  return process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
}
