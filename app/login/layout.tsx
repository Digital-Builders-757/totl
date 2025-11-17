// Force dynamic rendering to prevent static caching of login page
// This ensures fresh session reads on every request
export const dynamic = "force-dynamic";

export default function LoginLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}


