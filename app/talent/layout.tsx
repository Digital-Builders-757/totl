import type React from "react";

import { NotificationCountProvider } from "@/components/notification-count-provider";
import {
  getUnreadNotificationCount,
  getRecentNotifications,
} from "@/lib/actions/notification-actions";

export default async function TalentLayout({ children }: { children: React.ReactNode }) {
  const [notificationCount, { notifications }] = await Promise.all([
    getUnreadNotificationCount(),
    getRecentNotifications(10),
  ]);
  return (
    <div data-role="talent">
      <NotificationCountProvider
        notificationCount={notificationCount}
        notifications={notifications}
      >
        {children}
      </NotificationCountProvider>
    </div>
  );
}
