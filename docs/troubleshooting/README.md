# Troubleshooting Docs Index

**Date:** March 9, 2026  
**Status:** ✅ ACTIVE  
**Purpose:** Provide a fast triage entry point for common errors, focused debugging guides, and issue-specific implementation notes.

## Start Here

- `COMMON_ERRORS_QUICK_REFERENCE.md` - fastest copy/paste fixes and recurring failure modes
- `TROUBLESHOOTING_GUIDE.md` - broader issue catalog and recovery patterns

## High-Value Debugging Guides

- `AUTH_SESSION_MISSING_ERROR_FIX.md` - auth bootstrap guest-mode noise fix
- `AUTH_TIMEOUT_RECOVERY_IMPLEMENTATION.md` - stale token / timeout recovery flow
- `SUPABASE_API_KEY_FIX.md` - missing env/API key diagnostics overview
- `STRIPE_TROUBLESHOOTING.md` - Stripe integration failure guide
- `STRIPE_WEBHOOKS_RUNBOOK.md` - webhook debugging runbook
- `MCP_PLAYWRIGHT_TROUBLESHOOTING.md` - Playwright MCP troubleshooting guide

## How To Use This Folder

1. Check `COMMON_ERRORS_QUICK_REFERENCE.md` first for known repeat offenders.
2. Move to the specific troubleshooting guide for the failing subsystem.
3. If the issue is historical or superseded, prefer archived docs only after the current guides fail to explain the behavior.
