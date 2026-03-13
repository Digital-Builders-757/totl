/**
 * Global type augmentations for third-party scripts (GA4, etc.)
 */
declare global {
  interface Window {
    dataLayer?: unknown[];
    gtag?: (...args: unknown[]) => void;
  }
}

export {};
