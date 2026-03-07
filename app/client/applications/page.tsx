import ClientApplicationsClient from "@/app/client/applications/client-applications-client";
import type { Application } from "@/app/client/applications/types";
import { getClientApplications } from "@/lib/actions/client-applications-actions";
import { logger } from "@/lib/utils/logger";

export const dynamic = "force-dynamic";

export default async function ClientApplicationsPage() {
  const result = await getClientApplications();
  if (result.error || !result.userId) {
    if (result.error && result.error !== "Unauthorized") {
      logger.warn("Client applications page fallback to empty state", { error: result.error });
    }
    return <ClientApplicationsClient userId="" initialApplications={[]} />;
  }

  return (
    <ClientApplicationsClient
      userId={result.userId}
      initialApplications={(result.applications ?? []) as Application[]}
    />
  );
}
