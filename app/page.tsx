import SupabaseConnectionTest from "@/components/supabase-connection-test"
import DirectUserCreation from "@/components/direct-user-creation"
import AuthSchemaCheck from "@/components/auth-schema-check"

export default function Home() {
  return (
    <main className="container mx-auto py-10 px-4">
      <h1 className="text-3xl font-bold mb-8">Supabase Authentication Diagnostic</h1>

      <div className="grid grid-cols-1 gap-8">
        <SupabaseConnectionTest />

        <AuthSchemaCheck />

        <section>
          <h2 className="text-2xl font-bold mb-4">Direct User Creation</h2>
          <p className="text-gray-600 mb-4">
            This form bypasses the problematic signup flow by using the admin API directly. It will also create the
            necessary profile records.
          </p>
          <DirectUserCreation />
        </section>

        <section className="space-y-4">
          <h2 className="text-2xl font-bold">Troubleshooting Steps</h2>

          <div>
            <h3 className="text-lg font-semibold">1. Check Supabase Configuration</h3>
            <ul className="list-disc pl-5 space-y-1 mt-2">
              <li>Verify your SMTP settings in Supabase Dashboard → Authentication → Email Templates</li>
              <li>Check that your Site URL is correctly set in Authentication → URL Configuration</li>
              <li>Ensure your domain is added to "Additional Redirect URLs"</li>
            </ul>
          </div>

          <div>
            <h3 className="text-lg font-semibold">2. Temporary Workarounds</h3>
            <ul className="list-disc pl-5 space-y-1 mt-2">
              <li>Disable email confirmation in Authentication → Email → "Confirm Email" toggle</li>
              <li>Use the Direct User Creation form above to create users</li>
              <li>Create users directly in the Supabase Dashboard</li>
            </ul>
          </div>

          <div>
            <h3 className="text-lg font-semibold">3. Contact Supabase Support</h3>
            <p className="mt-2">
              If the auth schema is missing or corrupted, contact Supabase support with your project reference and error
              logs to request an auth schema reset.
            </p>
          </div>
        </section>
      </div>
    </main>
  )
}
