"use client";

import { createContext, useContext } from "react";

interface AdminModerationCountContextValue {
  moderationCount: number;
}

const AdminModerationCountContext = createContext<AdminModerationCountContextValue>({
  moderationCount: 0,
});

export function AdminModerationCountProvider({
  children,
  moderationCount,
}: {
  children: React.ReactNode;
  moderationCount: number;
}) {
  return (
    <AdminModerationCountContext.Provider value={{ moderationCount }}>
      {children}
    </AdminModerationCountContext.Provider>
  );
}

export function useAdminModerationCount() {
  return useContext(AdminModerationCountContext);
}
