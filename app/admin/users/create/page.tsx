import AdminUserCreation from "@/components/admin-user-creation"

export default function CreateUserPage() {
  return (
    <div className="container py-10">
      <h1 className="text-2xl font-bold mb-6">Create New User</h1>
      <AdminUserCreation />
    </div>
  )
}
