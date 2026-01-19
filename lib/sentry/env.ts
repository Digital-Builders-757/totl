const nodeEnv = process.env.NODE_ENV ?? "development";
const clientVercelEnv = process.env.NEXT_PUBLIC_VERCEL_ENV;
const serverVercelEnv = process.env.VERCEL_ENV;
const isProduction = nodeEnv === "production" || clientVercelEnv === "production";
const serverIsProduction = nodeEnv === "production" || serverVercelEnv === "production";

const sharedPublicDSN =
  process.env.NEXT_PUBLIC_SENTRY_DSN ?? process.env.SENTRY_DSN ?? null;

const productionDSN =
  process.env.SENTRY_DSN_PROD ??
  process.env.NEXT_PUBLIC_SENTRY_DSN_PROD ??
  sharedPublicDSN ??
  null;

const developmentDSN =
  process.env.SENTRY_DSN_DEV ??
  process.env.NEXT_PUBLIC_SENTRY_DSN_DEV ??
  sharedPublicDSN ??
  null;

// No hardcoded fallback - require DSN via env vars (fail loudly, don't silently fail)
const currentDSN = isProduction
  ? productionDSN ?? developmentDSN ?? null
  : developmentDSN ?? productionDSN ?? null;

const expectedProjectId = "4510191108292609";
const currentProjectId = currentDSN ? parseProjectId(currentDSN) : null;
const projectIdMatches = currentProjectId === expectedProjectId;

function parseProjectId(dsn: string): string | null {
  const match = dsn.match(/\/(\d+)(?:\?|$)/);
  return match ? match[1] : null;
}

export {
  currentDSN,
  currentProjectId,
  expectedProjectId,
  productionDSN,
  developmentDSN,
  isProduction,
  serverIsProduction,
  nodeEnv,
  projectIdMatches,
  parseProjectId,
};

