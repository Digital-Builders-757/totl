import { Suspense } from "react";
import AuthSchemaCheck from "@/components/auth-schema-check";
import DirectUserCreation from "@/components/direct-user-creation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function DiagnosticPage() {
  return (
    <div className="container mx-auto py-10 space-y-8">
      <h1 className="text-3xl font-bold">Supabase Diagnostic Tools</h1>
      <p className="text-gray-600">
        Use these tools to diagnose and fix issues with your Supabase authentication setup.
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <Suspense fallback={<div>Loading auth schema check...</div>}>
          <AuthSchemaCheck />
        </Suspense>

        <Card>
          <CardHeader>
            <CardTitle>Environment Variables</CardTitle>
            <CardDescription>
              Check if your Supabase environment variables are properly set
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              <li className="flex items-center">
                <span className="font-medium mr-2">NEXT_PUBLIC_SUPABASE_URL:</span>
                <span>{process.env.NEXT_PUBLIC_SUPABASE_URL ? "âœ… Set" : "âŒ Not set"}</span>
              </li>
              <li className="flex items-center">
                <span className="font-medium mr-2">NEXT_PUBLIC_SUPABASE_ANON_KEY:</span>
                <span>{process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? "âœ… Set" : "âŒ Not set"}</span>
              </li>
              <li className="flex items-center">
                <span className="font-medium mr-2">SUPABASE_URL:</span>
                <span>{process.env.SUPABASE_URL ? "âœ… Set" : "âŒ Not set"}</span>
              </li>
              <li className="flex items-center">
                <span className="font-medium mr-2">SUPABASE_SERVICE_ROLE_KEY:</span>
                <span>{process.env.SUPABASE_SERVICE_ROLE_KEY ? "âœ… Set" : "âŒ Not set"}</span>
              </li>
            </ul>
          </CardContent>
        </Card>
      </div>

      <div className="mt-8">
        <Suspense fallback={<div>Loading user creation form...</div>}>
          <DirectUserCreation />
        </Suspense>
      </div>
    </div>
  );
}
