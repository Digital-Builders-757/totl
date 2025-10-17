import { Inter } from "next/font/google";
import type React from "react";
import { ThemeProvider } from "@/components/theme-provider";

const inter = Inter({ subsets: ["latin"] });

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className={inter.className}>
      <ThemeProvider attribute="class" defaultTheme="dark" enableSystem={false}>
        {children}
      </ThemeProvider>
    </div>
  );
}
