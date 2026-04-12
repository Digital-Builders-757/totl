import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { PATHS } from "@/lib/constants/routes";
import { Database } from "@/types/supabase";

// Use generated database types instead of custom interfaces
type TalentProfile = Pick<
  Database["public"]["Tables"]["talent_profiles"]["Row"],
  "id" | "experience" | "specialties" | "experience_years" | "portfolio_url"
>;

type ApplicationRow = Database["public"]["Tables"]["applications"]["Row"];

type Application = Pick<ApplicationRow, "id" | "status" | "created_at"> & {
  gigs: {
    id: string;
    title: string;
    company_name: string;
  };
};

function applicationStatusVariant(status: string) {
  switch (status) {
    case "accepted":
      return "accepted" as const;
    case "rejected":
      return "rejected" as const;
    case "new":
      return "new" as const;
    case "under_review":
      return "under_review" as const;
    case "shortlisted":
      return "shortlisted" as const;
    default:
      return "under_review" as const;
  }
}

export function TalentData({
  talentProfile,
  applications,
}: {
  talentProfile: TalentProfile | null;
  applications: Application[] | null;
}) {
  return (
    <div className="space-y-6">
      <Card className="grain-texture">
        <CardHeader>
          <CardTitle className="font-display text-xl text-[var(--oklch-text-primary)] sm:text-2xl">
            Talent profile
          </CardTitle>
          <CardDescription className="text-[var(--oklch-text-secondary)]">
            Your professional information
          </CardDescription>
        </CardHeader>
        <CardContent>
          {!talentProfile ? (
            <div className="space-y-4">
              <p className="text-sm text-[var(--oklch-text-secondary)] sm:text-base">
                You haven&apos;t added your talent details yet.
              </p>
              <Button variant="default" className="rounded-full font-semibold" asChild>
                <Link href={PATHS.TALENT_PROFILE}>Complete talent profile</Link>
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              <div>
                <h3 className="mb-1 text-sm font-medium text-[var(--oklch-text-muted)]">Experience</h3>
                <p className="text-[var(--oklch-text-secondary)]">
                  {talentProfile.experience || "No experience provided"}
                </p>
              </div>

              <div>
                <h3 className="mb-1 text-sm font-medium text-[var(--oklch-text-muted)]">Specialties</h3>
                {talentProfile.specialties && talentProfile.specialties.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {talentProfile.specialties.map((specialty, index) => (
                      <Badge
                        key={index}
                        variant="outline"
                        className="border-[var(--oklch-border-alpha)] bg-white/[0.06] font-normal text-[var(--oklch-text-secondary)]"
                      >
                        {specialty}
                      </Badge>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-[var(--oklch-text-muted)]">No specialties listed</p>
                )}
              </div>

              <div className="flex flex-col gap-4 sm:flex-row sm:justify-between sm:gap-8">
                <div>
                  <h3 className="mb-1 text-sm font-medium text-[var(--oklch-text-muted)]">Years of experience</h3>
                  <p className="text-[var(--oklch-text-secondary)]">
                    {talentProfile.experience_years
                      ? `${talentProfile.experience_years} years`
                      : "Not specified"}
                  </p>
                </div>

                <div>
                  <h3 className="mb-1 text-sm font-medium text-[var(--oklch-text-muted)]">Portfolio</h3>
                  {talentProfile.portfolio_url ? (
                    <a
                      href={talentProfile.portfolio_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="focus-hint text-sm font-medium text-[var(--oklch-accent)] underline-offset-4 hover:underline"
                    >
                      View portfolio
                    </a>
                  ) : (
                    <p className="text-sm text-[var(--oklch-text-muted)]">No portfolio link</p>
                  )}
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="grain-texture">
        <CardHeader>
          <CardTitle className="font-display text-xl text-[var(--oklch-text-primary)] sm:text-2xl">
            Your applications
          </CardTitle>
          <CardDescription className="text-[var(--oklch-text-secondary)]">
            Opportunities you&apos;ve applied to
          </CardDescription>
        </CardHeader>
        <CardContent>
          {!applications || applications.length === 0 ? (
            <div className="space-y-4 text-center sm:text-left">
              <p className="text-sm text-[var(--oklch-text-secondary)] sm:text-base">
                You haven&apos;t applied to any opportunities yet.
              </p>
              <Button variant="default" className="rounded-full font-semibold" asChild>
                <Link href={PATHS.GIGS}>Browse opportunities</Link>
              </Button>
            </div>
          ) : (
            <ul className="space-y-4">
              {applications.map((application) => (
                <li
                  key={application.id}
                  className="border-b border-[var(--oklch-border-alpha)] pb-4 last:border-b-0 last:pb-0"
                >
                  <Link
                    href={`/gigs/${application.gigs.id}`}
                    className="focus-hint font-medium text-[var(--oklch-text-primary)] hover:underline"
                  >
                    {application.gigs.title}
                  </Link>
                  <p className="mt-1 text-sm text-[var(--oklch-text-secondary)]">
                    {application.gigs.company_name}
                  </p>
                  <div className="mt-2 flex flex-wrap items-center justify-between gap-2">
                    <Badge variant={applicationStatusVariant(application.status)}>
                      {application.status}
                    </Badge>
                    <span className="text-xs text-[var(--oklch-text-muted)]">
                      Applied {new Date(application.created_at).toLocaleDateString()}
                    </span>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
