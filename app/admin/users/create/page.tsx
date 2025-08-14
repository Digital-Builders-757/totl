import AdminUserCreation from "@/components/admin-user-creation";

// Force dynamic rendering to prevent static pre-rendering
export const dynamic = "force-dynamic";

export default function CreateUserPage() {
  return (
    <div className="container py-10">
      <h1 className="text-2xl font-bold mb-6">Create New User</h1>
      <AdminUserCreation />
    </div>
  );
}
