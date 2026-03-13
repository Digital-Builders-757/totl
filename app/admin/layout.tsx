import { Inter } from "next/font/google";
import type React from "react";
import { AdminModerationCountProvider } from "@/components/admin/admin-moderation-count-provider";
import { ThemeProvider } from "@/components/theme-provider";
import { getAdminModerationCount } from "@/lib/actions/moderation-actions";

const inter = Inter({ subsets: ["latin"] });

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const moderationCount = await getAdminModerationCount();
  return (
    <div className={inter.className} data-role="admin">
      <ThemeProvider attribute="class" defaultTheme="dark" enableSystem={false}>
        <AdminModerationCountProvider moderationCount={moderationCount}>
          {children}
        </AdminModerationCountProvider>
      </ThemeProvider>
    </div>
  );
}
