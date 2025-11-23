-- Add subscription system for talent users
-- Migration: 20251121194107_add_subscription_system.sql
-- Created: November 21, 2025
-- Purpose: Add Stripe subscription support for talent premium features

-- Create subscription_status enum
CREATE TYPE public.subscription_status AS ENUM (
  'none',         -- never subscribed
  'active',       -- current paid subscription
  'past_due',     -- payment issues, limited access
  'canceled'      -- canceled / expired
);

-- Add subscription columns to profiles table
ALTER TABLE public.profiles
ADD COLUMN subscription_status subscription_status NOT NULL DEFAULT 'none',
ADD COLUMN stripe_customer_id TEXT,
ADD COLUMN stripe_subscription_id TEXT,
ADD COLUMN subscription_plan TEXT,                -- 'monthly' | 'annual'
ADD COLUMN subscription_current_period_end TIMESTAMPTZ;

-- Add index for subscription status filtering (performance optimization)
CREATE INDEX profiles_subscription_status_idx ON public.profiles (subscription_status);

-- Add index for Stripe customer ID lookups (used by webhooks)
CREATE INDEX profiles_stripe_customer_id_idx ON public.profiles (stripe_customer_id) WHERE stripe_customer_id IS NOT NULL;

-- Add comments for documentation
COMMENT ON TYPE public.subscription_status IS 'Tracks talent subscription status for premium features';
COMMENT ON COLUMN public.profiles.subscription_status IS 'Current subscription status for talent users';
COMMENT ON COLUMN public.profiles.stripe_customer_id IS 'Stripe customer ID for billing operations';
COMMENT ON COLUMN public.profiles.stripe_subscription_id IS 'Active Stripe subscription ID';
COMMENT ON COLUMN public.profiles.subscription_plan IS 'Subscription plan type: monthly or annual';
COMMENT ON COLUMN public.profiles.subscription_current_period_end IS 'When the current subscription period ends';
