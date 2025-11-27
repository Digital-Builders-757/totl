"use client";

import { useEffect, useState } from "react";
import Script from "next/script";

const measurementId = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID;
const gaEnabled = process.env.NEXT_PUBLIC_ENABLE_GA === "1";
const consentStorageKey = process.env.NEXT_PUBLIC_GA_CONSENT_KEY ?? "totl_ga_consent";
const analyticsEnvironment =
  process.env.NEXT_PUBLIC_GA_ENVIRONMENT ??
  process.env.NEXT_PUBLIC_VERCEL_ENV ??
  process.env.NODE_ENV ??
  "development";
const debugMode = process.env.NODE_ENV !== "production";

export function Ga4Analytics() {
  const [consentGranted, setConsentGranted] = useState(false);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    const stored = window.localStorage.getItem(consentStorageKey);
    setConsentGranted(stored === "granted");
    setIsMounted(true);
  }, [consentStorageKey]);

  if (!gaEnabled || !measurementId || !consentGranted) {
    return null;
  }

  if (!isMounted) {
    return null;
  }

  return (
    <>
      <Script
        src={`https://www.googletagmanager.com/gtag/js?id=${measurementId}`}
        strategy="afterInteractive"
      />
      <Script id="ga-init" strategy="afterInteractive">
        {`
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          gtag("js", new Date());
          gtag("config", "${measurementId}", {
            page_path: window.location.pathname,
            anonymize_ip: true,
            site_speed_sample_rate: 10,
            send_page_view: true,
            debug_mode: ${debugMode},
            environment: "${analyticsEnvironment}"
          });
        `}
      </Script>
    </>
  );
}

