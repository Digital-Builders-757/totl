import { redirect } from "next/navigation";
import { ClientProfileDetails } from "@/components/client/client-profile-details";
import ClientProfileForm from "@/components/forms/client-profile-form";
import { PATHS } from "@/lib/constants/routes";
import { createSupabaseServer } from "@/lib/supabase/supabase-server";

export const dynamic = "force-dynamic";

interface ClientProfilePageProps {
  searchParams: Promise<{ userId?: string }>;
}

export default async function ClientProfilePage({
  searchParams,
}: ClientProfilePageProps) {
  // Check if Supabase environment variables are available
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY");
  }

  const { userId } = await searchParams;
  const supabase = await createSupabaseServer();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    redirect("/login");
  }

  // Get current user's profile to check admin role
  const { data: currentProfile, error: profileError } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();

  if (profileError || !currentProfile) {
    redirect("/login");
  }

  // Determine target user ID (admin viewing other user, or self)
  // CRITICAL: If not admin, ignore userId entirely (prevents client → other client viewing)
  const requestedUserId = userId;
  const isAdmin = currentProfile.role === "admin";
  
  // If not admin, force targetUserId = user.id regardless of query param (security)
  const targetUserId = isAdmin && requestedUserId ? requestedUserId : user.id;
  const isViewingOtherUser = isAdmin && requestedUserId && requestedUserId !== user.id;

  // Allow admin to view any client profile, or allow client to view own profile
  if (!isAdmin && currentProfile.role !== "client") {
    redirect(PATHS.TALENT_DASHBOARD);
  }

  // Fetch client profile for target user
  // If admin viewing other user and profile doesn't exist, show empty state instead of redirecting
  const { data: clientProfile } = await supabase
    .from("client_profiles")
    .select(
      "id,user_id,company_name,industry,website,contact_name,contact_email,contact_phone,company_size,created_at,updated_at"
    )
    .eq("user_id", targetUserId)
    .maybeSingle();

  // If admin viewing other user and no client profile exists, show friendly empty state
  if (isAdmin && isViewingOtherUser && !clientProfile) {
    return (
      <div className="min-h-screen bg-black py-8">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-4 p-3 bg-blue-900/30 border border-blue-700 rounded text-blue-300 text-sm">
            Admin viewing as staff
          </div>
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-white">Client Profile (Admin View)</h1>
            <p className="text-gray-300 mt-2">
              This user does not have a client profile yet.
            </p>
          </div>
          <div className="p-6 bg-gray-900 rounded-lg border border-gray-700">
            <p className="text-gray-400 text-sm">
              The client profile has not been created for this user. They may need to complete their profile setup.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black py-8">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
        {isAdmin && isViewingOtherUser && (
          <div className="mb-4 p-3 bg-blue-900/30 border border-blue-700 rounded text-blue-300 text-sm">
            Admin viewing as staff
          </div>
        )}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white">
            {isAdmin && isViewingOtherUser ? "Client Profile (Admin View)" : "Complete Your Company Profile"}
          </h1>
          <p className="text-gray-300 mt-2">
            {isAdmin && isViewingOtherUser
              ? "Viewing client profile information"
              : "Add your company information to make your gigs more attractive to talent"}
          </p>
        </div>
        {isAdmin && isViewingOtherUser ? (
          <ClientProfileDetails clientProfile={clientProfile} />
        ) : (
          <ClientProfileForm initialData={clientProfile || undefined} />
        )}
      </div>
    </div>
  );
}
