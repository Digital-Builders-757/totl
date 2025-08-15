import SupabaseConnectionTest from "@/components/supabase-connection-test";

export default function DebugPage() {
  return (
    <div className="container mx-auto py-12 px-4">
      <h1 className="text-3xl font-bold mb-8">Debug Tools</h1>
      <div className="bg-white p-6 rounded-lg shadow-md">
        <SupabaseConnectionTest />
      </div>
    </div>
  );
}
