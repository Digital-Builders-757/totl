"use client";

import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import TalentSignupForm from "@/components/forms/talent-signup-form";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

export default function TalentSignupPage() {
  const searchParams = useSearchParams();
  const returnUrl = searchParams?.get("returnUrl") ?? null;

  return (
    <div className="min-h-screen bg-gray-50 pt-24">
      <div className="container mx-auto px-4 py-12">
        <Link
          href={returnUrl ? `${returnUrl}` : "/"}
          className="inline-flex items-center text-gray-600 hover:text-black mb-8"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back
        </Link>

        <Card className="max-w-4xl mx-auto">
          <CardHeader>
            <CardTitle>Create Your Talent Account</CardTitle>
            <CardDescription>
              Apply to join our talent roster. It&apos;s completely free to create an account.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <TalentSignupForm />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
