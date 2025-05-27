import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import Link from "next/link"

type TalentProfile = {
  id: string
  bio: string | null
  skills: string[] | null
  experience_years: number | null
  portfolio_url: string | null
}

type Application = {
  id: string
  status: string
  created_at: string
  gigs: {
    id: string
    title: string
    company_name: string
  }
}

export function TalentData({
  talentProfile,
  applications,
}: {
  talentProfile: TalentProfile | null
  applications: Application[] | null
}) {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Talent Profile</CardTitle>
          <CardDescription>Your professional information</CardDescription>
        </CardHeader>
        <CardContent>
          {!talentProfile ? (
            <div className="space-y-4">
              <p className="text-gray-500">You haven't created a talent profile yet.</p>
              <Link
                href="/talent/create-profile"
                className="inline-block px-4 py-2 bg-black text-white rounded-md hover:bg-gray-800"
              >
                Create Talent Profile
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              <div>
                <h3 className="font-medium mb-1">Bio</h3>
                <p className="text-gray-600">{talentProfile.bio || "No bio provided"}</p>
              </div>

              <div>
                <h3 className="font-medium mb-1">Skills</h3>
                {talentProfile.skills && talentProfile.skills.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {talentProfile.skills.map((skill, index) => (
                      <Badge key={index} variant="outline">
                        {skill}
                      </Badge>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500">No skills listed</p>
                )}
              </div>

              <div className="flex justify-between">
                <div>
                  <h3 className="font-medium mb-1">Experience</h3>
                  <p className="text-gray-600">
                    {talentProfile.experience_years ? `${talentProfile.experience_years} years` : "Not specified"}
                  </p>
                </div>

                <div>
                  <h3 className="font-medium mb-1">Portfolio</h3>
                  {talentProfile.portfolio_url ? (
                    <a
                      href={talentProfile.portfolio_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:underline"
                    >
                      View Portfolio
                    </a>
                  ) : (
                    <p className="text-gray-500">No portfolio link</p>
                  )}
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Your Applications</CardTitle>
          <CardDescription>Gigs you've applied to</CardDescription>
        </CardHeader>
        <CardContent>
          {!applications || applications.length === 0 ? (
            <p className="text-gray-500">You haven't applied to any gigs yet.</p>
          ) : (
            <ul className="space-y-4">
              {applications.map((application) => (
                <li key={application.id} className="border-b pb-4 last:border-b-0 last:pb-0">
                  <Link href={`/gigs/${application.gigs.id}`} className="font-medium hover:underline">
                    {application.gigs.title}
                  </Link>
                  <p className="text-sm text-gray-600 mt-1">{application.gigs.company_name}</p>
                  <div className="flex justify-between mt-2">
                    <Badge
                      variant={
                        application.status === "accepted"
                          ? "success"
                          : application.status === "rejected"
                            ? "destructive"
                            : "default"
                      }
                    >
                      {application.status}
                    </Badge>
                    <span className="text-xs text-gray-500">
                      Applied on {new Date(application.created_at).toLocaleDateString()}
                    </span>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
