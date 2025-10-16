import type { Metadata } from "next";
import { Inter } from "next/font/google";
import type React from "react";
import ClientLayout from "./client-layout";
import { ThemeProvider } from "@/components/theme-provider";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || "https://www.thetotlagency.com"),
  title: "TOTL Agency - Premium Modeling Agency",
  description: "Representing exceptional modeling talent worldwide. RISE ABOVE THE REST.",
  openGraph: {
    title: "TOTL Agency - Premium Modeling Agency",
    description: "Representing exceptional modeling talent worldwide. RISE ABOVE THE REST.",
    url: "https://totlagency.com",
    siteName: "TOTL Agency",
    images: [
      {
        url: "/images/solo_logo.png",
        width: 1200,
        height: 630,
        alt: "TOTL Agency",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "TOTL Agency - Premium Modeling Agency",
    description: "Representing exceptional modeling talent worldwide. RISE ABOVE THE REST.",
    images: ["/images/totl-logo-new.png"],
  },
  generator: "v0.dev",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className} suppressHydrationWarning>
        <ThemeProvider
          attribute="class"
          defaultTheme="light"
          enableSystem={false}
          disableTransitionOnChange
        >
          <ClientLayout>{children}</ClientLayout>
        </ThemeProvider>
      </body>
    </html>
  );
}

import "./globals.css";
