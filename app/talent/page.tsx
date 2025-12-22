import { ArrowRight, Briefcase, CheckCircle, Lock, Shield, Users } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export const dynamic = "force-dynamic";

export default function TalentPage() {
  return (
    <div className="min-h-screen bg-seamless-primary text-white pt-20">
      {/* Hero Section */}
      <section className="relative py-16 sm:py-24 md:py-32 overflow-hidden">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-4xl mx-auto text-center space-y-8">
            <div className="space-y-4">
              <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold text-white leading-tight font-display">
                Talent, Reimagined
              </h1>
              <p className="text-xl sm:text-2xl md:text-3xl text-gray-300 leading-relaxed max-w-3xl mx-auto">
                Hiring for real work — without public rosters
              </p>
            </div>
            <p className="text-lg sm:text-xl text-gray-300 leading-relaxed max-w-2xl mx-auto">
              TOTL is a private talent and opportunity platform built for{" "}
              <strong className="text-white">real-world hiring across industries</strong>.
              We connect professionals to legitimate opportunities without turning people into searchable listings.
            </p>
            <div className="flex flex-wrap justify-center gap-4 text-sm text-gray-400">
              <div className="flex items-center gap-2">
                <Shield className="h-4 w-4" />
                <span>No public directories</span>
              </div>
              <div className="flex items-center gap-2">
                <Lock className="h-4 w-4" />
                <span>No talent scraping</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4" />
                <span>Just real work, real intent</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* What "Talent" Means Section */}
      <section className="py-16 bg-seamless-secondary">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-3xl sm:text-4xl font-bold text-white mb-6 text-center">
              What &quot;Talent&quot; Means on TOTL
            </h2>
            <p className="text-lg text-gray-300 mb-8 text-center max-w-2xl mx-auto">
              On TOTL, <em>talent</em> isn&apos;t limited to modeling.
            </p>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {[
                "Models & performers",
                "Creatives & media professionals",
                "Event staff & brand ambassadors",
                "Production crews & technical specialists",
                "Emerging roles tied to new and evolving industries",
              ].map((item, index) => (
                <Card key={index} className="bg-white/5 border-white/10">
                  <CardContent className="p-6">
                    <p className="text-gray-300">{item}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
            <p className="text-center text-gray-300 mt-8 max-w-2xl mx-auto">
              If the work is legitimate and people are being hired for it, TOTL is built to support it.
            </p>
          </div>
        </div>
      </section>

      {/* How TOTL Works Section */}
      <section className="py-16">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-3xl sm:text-4xl font-bold text-white mb-8 text-center">
              How TOTL Works
            </h2>
            <p className="text-lg text-gray-300 mb-12 text-center max-w-2xl mx-auto">
              TOTL is designed around <strong className="text-white">intentional access</strong>, not public exposure.
            </p>
            <div className="space-y-8">
              {[
                {
                  step: "1",
                  title: "Talent Applies",
                  description: "Professionals create a profile and apply to join the platform. Profiles are private by default.",
                },
                {
                  step: "2",
                  title: "Opportunities Are Posted",
                  description: "Career Builders and clients post real opportunities tied to real work.",
                },
                {
                  step: "3",
                  title: "Matches Happen Through Participation",
                  description: "Talent applies to opportunities. Clients review applicants — not a public roster.",
                },
                {
                  step: "4",
                  title: "Contact Unlocks Through Relationship",
                  description: "Contact details unlock only after an application, booking, or verified relationship exists.",
                },
              ].map((item) => (
                <Card key={item.step} className="bg-white/5 border-white/10">
                  <CardContent className="p-6 sm:p-8">
                    <div className="flex gap-6">
                      <div className="flex-shrink-0">
                        <div className="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center text-white font-bold text-xl">
                          {item.step}
                        </div>
                      </div>
                      <div className="flex-grow">
                        <h3 className="text-xl font-semibold text-white mb-2">{item.title}</h3>
                        <p className="text-gray-300 leading-relaxed">{item.description}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
            <p className="text-center text-gray-300 mt-8 italic">
              This keeps the platform focused on work — not browsing.
            </p>
          </div>
        </div>
      </section>

      {/* Why No Public Directory Section */}
      <section className="py-16 bg-seamless-secondary">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl mx-auto">
            <h2 className="text-3xl sm:text-4xl font-bold text-white mb-6 text-center">
              Why You Won&apos;t Find a Public Talent Directory
            </h2>
            <p className="text-lg text-gray-300 mb-8 text-center">
              TOTL intentionally avoids public talent search and open rosters.
            </p>
            <div className="space-y-4 mb-8">
              {[
                "Protect talent privacy",
                "Prevent scraping and misuse",
                "Reduce bias and vanity-based selection",
                "Encourage real hiring instead of passive browsing",
              ].map((reason, index) => (
                <div key={index} className="flex items-start gap-3">
                  <CheckCircle className="h-5 w-5 text-green-400 mt-0.5 flex-shrink-0" />
                  <p className="text-gray-300">{reason}</p>
                </div>
              ))}
            </div>
            <p className="text-center text-white font-medium">
              Access on TOTL is earned through participation, not clicks.
            </p>
          </div>
        </div>
      </section>

      {/* Who TOTL Is For Section */}
      <section className="py-16">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-5xl mx-auto">
            <h2 className="text-3xl sm:text-4xl font-bold text-white mb-12 text-center">
              Who TOTL Is For
            </h2>
            <div className="grid md:grid-cols-2 gap-8">
              {/* For Talent */}
              <Card className="bg-white/5 border-white/10">
                <CardContent className="p-8">
                  <div className="flex items-center gap-3 mb-6">
                    <Users className="h-8 w-8 text-white" />
                    <h3 className="text-2xl font-semibold text-white">For Talent</h3>
                  </div>
                  <ul className="space-y-3 mb-8">
                    <li className="flex items-start gap-3">
                      <CheckCircle className="h-5 w-5 text-green-400 mt-0.5 flex-shrink-0" />
                      <span className="text-gray-300">Apply once and be considered for real opportunities</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <CheckCircle className="h-5 w-5 text-green-400 mt-0.5 flex-shrink-0" />
                      <span className="text-gray-300">Control when your contact information is shared</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <CheckCircle className="h-5 w-5 text-green-400 mt-0.5 flex-shrink-0" />
                      <span className="text-gray-300">Avoid being publicly indexed or scraped</span>
                    </li>
                  </ul>
                  <Button asChild className="w-full bg-white text-black hover:bg-gray-100">
                    <Link href="/talent/signup">
                      Apply as Talent <ArrowRight className="ml-2 h-4 w-4" />
                    </Link>
                  </Button>
                </CardContent>
              </Card>

              {/* For Career Builders */}
              <Card className="bg-white/5 border-white/10">
                <CardContent className="p-8">
                  <div className="flex items-center gap-3 mb-6">
                    <Briefcase className="h-8 w-8 text-white" />
                    <h3 className="text-2xl font-semibold text-white">For Career Builders & Clients</h3>
                  </div>
                  <ul className="space-y-3 mb-8">
                    <li className="flex items-start gap-3">
                      <CheckCircle className="h-5 w-5 text-green-400 mt-0.5 flex-shrink-0" />
                      <span className="text-gray-300">Post legitimate work opportunities</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <CheckCircle className="h-5 w-5 text-green-400 mt-0.5 flex-shrink-0" />
                      <span className="text-gray-300">Review applicants who are actually interested</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <CheckCircle className="h-5 w-5 text-green-400 mt-0.5 flex-shrink-0" />
                      <span className="text-gray-300">Unlock contact details only when there&apos;s real intent</span>
                    </li>
                  </ul>
                  <Button asChild className="w-full bg-white text-black hover:bg-gray-100">
                    <Link href="/client/apply">
                      Apply as Career Builder <ArrowRight className="ml-2 h-4 w-4" />
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* Future-Facing Section */}
      <section className="py-16 bg-seamless-secondary">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl mx-auto text-center space-y-6">
            <h2 className="text-3xl sm:text-4xl font-bold text-white">
              Built for What&apos;s Next
            </h2>
            <p className="text-lg text-gray-300 leading-relaxed">
              TOTL isn&apos;t limited to a single industry.
            </p>
            <p className="text-gray-300 leading-relaxed">
              As new sectors emerge and the nature of work evolves, our model scales — without sacrificing privacy, integrity, or trust.
            </p>
            <div className="pt-6 space-y-4">
              <p className="text-white font-medium text-lg">
                This is talent discovery without exploitation.
              </p>
              <p className="text-white font-medium text-lg">
                Hiring without noise.
              </p>
              <p className="text-white font-medium text-lg">
                Access with intention.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-2xl mx-auto text-center space-y-8">
            <h2 className="text-3xl sm:text-4xl font-bold text-white">
              Ready to Get Started?
            </h2>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button asChild size="lg" className="bg-white text-black hover:bg-gray-100">
                <Link href="/talent/signup">
                  Apply as Talent <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline" className="border-white text-white hover:bg-white/10">
                <Link href="/client/apply">
                  Apply as Career Builder <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
