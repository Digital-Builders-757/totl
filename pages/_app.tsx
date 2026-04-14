import type { AppProps } from "next/app";

/**
 * Minimal Pages Router shell so production builds emit `pages-manifest.json`.
 * All product routes live under `app/`; this file is build plumbing only.
 */
export default function PagesApp({ Component, pageProps }: AppProps) {
  return <Component {...pageProps} />;
}
