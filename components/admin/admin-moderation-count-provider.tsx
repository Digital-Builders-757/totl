"use client";

import { createContext, useContext } from "react";

interface AdminModerationCountContextValue {
  moderationCount: number;
  signupNotificationUnreadCount: number;
}

const AdminModerationCountContext = createContext<AdminModerationCountContextValue>({
  moderationCount: 0,
  signupNotificationUnreadCount: 0,
});

export function AdminModerationCountProvider({
  children,
  moderationCount,
  signupNotificationUnreadCount,
}: {
  children: React.ReactNode;
  moderationCount: number;
  signupNotificationUnreadCount: number;
}) {
  return (
    <AdminModerationCountContext.Provider
      value={{ moderationCount, signupNotificationUnreadCount }}
    >
      {children}
    </AdminModerationCountContext.Provider>
  );
}

export function useAdminModerationCount() {
  return useContext(AdminModerationCountContext);
}
