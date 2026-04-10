import { AuthEntryShell } from "@/components/layout/auth-entry-shell";
import { PATHS } from "@/lib/constants/routes";

export default function SelectAccountTypeLoading() {
  return (
    <AuthEntryShell backHref={PATHS.HOME} backLabel="Back to home" panelPaddingClassName="p-8">
      <div className="space-y-6">
        <div className="space-y-2 text-center">
          <div className="mx-auto h-8 w-48 animate-pulse rounded bg-white/10 sm:h-9" />
          <div className="mx-auto h-4 w-full max-w-sm animate-pulse rounded bg-white/10" />
        </div>
        <div className="space-y-3 rounded-xl border border-border/30 bg-white/5 p-4">
          <div className="h-4 w-full animate-pulse rounded bg-white/10" />
          <div className="h-4 w-5/6 animate-pulse rounded bg-white/10" />
          <div className="h-10 w-full animate-pulse rounded bg-white/10" />
        </div>
      </div>
    </AuthEntryShell>
  );
}
