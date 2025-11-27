"use client";

import Script from "next/script";
import { useEffect, useState } from "react";

const MEASUREMENT_ID = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID;
const GA_ENABLED = process.env.NEXT_PUBLIC_ENABLE_GA === "1";
const CONSENT_STORAGE_KEY =
  process.env.NEXT_PUBLIC_GA_CONSENT_KEY || "totl_ga_consent";

const ANALYTICS_ENVIRONMENT =
  process.env.NEXT_PUBLIC_GA_ENVIRONMENT ||
  process.env.NEXT_PUBLIC_VERCEL_ENV ||
  process.env.NODE_ENV ||
  "development";

const DEBUG_MODE = process.env.NODE_ENV !== "production";

export function Ga4Analytics() {
  const [consentGranted, setConsentGranted] = useState(false);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    try {
      const stored =
        typeof window !== "undefined"
          ? window.localStorage.getItem(CONSENT_STORAGE_KEY)
          : null;
      setConsentGranted(stored === "granted");
    } catch {
      setConsentGranted(false);
    }
    setIsMounted(true);
  }, []);

  if (!GA_ENABLED || !MEASUREMENT_ID || !consentGranted || !isMounted) {
    return null;
  }

  return (
    <>
      <Script
        src={`https://www.googletagmanager.com/gtag/js?id=${MEASUREMENT_ID}`}
        strategy="afterInteractive"
      />
      <Script id="ga4-init" strategy="afterInteractive">
        {`
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          gtag('js', new Date());
          gtag('config', '${MEASUREMENT_ID}', {
            page_path: window.location.pathname,
            anonymize_ip: true,
            site_speed_sample_rate: 10,
            send_page_view: true,
            debug_mode: ${JSON.stringify(DEBUG_MODE)},
            environment: ${JSON.stringify(ANALYTICS_ENVIRONMENT)}
          });
        `}
      </Script>
    </>
  );
}

