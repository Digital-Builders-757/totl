import type React from "react";

export default function ClientLayout({ children }: { children: React.ReactNode }) {
  return <div data-role="client">{children}</div>;
}
