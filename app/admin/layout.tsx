import { Inter } from "next/font/google";
import type React from "react";
import { AdminModerationCountProvider } from "@/components/admin/admin-moderation-count-provider";
import { ThemeProvider } from "@/components/theme-provider";
import { getAdminSignupNotificationUnreadCount } from "@/lib/actions/admin-user-notification-actions";
import { getAdminModerationCount } from "@/lib/actions/moderation-actions";

const inter = Inter({ subsets: ["latin"] });

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const [moderationCount, signupNotificationUnreadCount] = await Promise.all([
    getAdminModerationCount(),
    getAdminSignupNotificationUnreadCount(),
  ]);
  return (
    <div className={inter.className} data-role="admin">
      <ThemeProvider attribute="class" defaultTheme="dark" enableSystem={false}>
        <AdminModerationCountProvider
          moderationCount={moderationCount}
          signupNotificationUnreadCount={signupNotificationUnreadCount}
        >
          {children}
        </AdminModerationCountProvider>
      </ThemeProvider>
    </div>
  );
}
