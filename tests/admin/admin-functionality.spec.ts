import { test } from "@playwright/test";

/**
 * Legacy overlap suite retired in favor of dedicated ownership:
 * - users route guardrail -> `tests/admin/admin-users-route.spec.ts`
 * - role promotion API guardrail -> `tests/admin/admin-role-guardrail.spec.ts`
 */
test.skip(true, "Retired overlap suite; replaced by admin route/guardrail specs");
