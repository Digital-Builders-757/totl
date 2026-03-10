# Security Docs Index

**Date:** March 9, 2026  
**Status:** ✅ ACTIVE  
**Purpose:** Provide a single entry point for security standards, deployment secrets handling, and operational rotation/validation runbooks.

## Start Here

- `SECURITY_CONFIGURATION.md` - primary security setup and configuration guide
- `SECURITY_STANDARDS_ENFORCEMENT.md` - automated checks and enforcement expectations

## Secrets And Rotation

- `SECRETS_ROTATION_AND_WEBHOOK_SECRET_VALIDATION_RUNBOOK_2026-03-04.md` - runbook for rotating leaked Supabase keys and validating Stripe webhook secret pairing
- `SECRETS_ROTATION_EXECUTION_LOG_TEMPLATE_2026-03-04.md` - execution log template for rotation evidence capture

## When To Use This Folder

- Use this folder before changing auth/security-sensitive config.
- Use the rotation runbook when environment secrets or webhook pairings are in doubt.
- Use the execution template when recording real operational rotation work.
