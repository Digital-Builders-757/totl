"use client";

import { createContext, useContext } from "react";

export interface NotificationItem {
  id: string;
  type: string;
  reference_id: string;
  title: string;
  body: string | null;
  read_at: string | null;
  created_at: string;
}

interface NotificationCountContextValue {
  notificationCount: number;
  notifications: NotificationItem[];
}

const NotificationCountContext = createContext<NotificationCountContextValue>({
  notificationCount: 0,
  notifications: [],
});

export function NotificationCountProvider({
  children,
  notificationCount,
  notifications = [],
}: {
  children: React.ReactNode;
  notificationCount: number;
  notifications?: NotificationItem[];
}) {
  return (
    <NotificationCountContext.Provider value={{ notificationCount, notifications }}>
      {children}
    </NotificationCountContext.Provider>
  );
}

export function useNotificationCount() {
  return useContext(NotificationCountContext);
}
