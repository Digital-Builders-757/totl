import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export default function AuthCallbackLoading() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-black page-ambient p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-center text-white">Email Verification</CardTitle>
          <CardDescription className="text-center text-gray-400">Verifying your email address...</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <Skeleton className="mb-6 h-12 w-12 rounded-full bg-white/10" />
          <Skeleton className="h-4 w-64 max-w-full bg-white/10" />
        </CardContent>
      </Card>
    </div>
  );
}
