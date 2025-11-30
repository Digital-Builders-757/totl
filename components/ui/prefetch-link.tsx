"use client";

import Link, { type LinkProps } from "next/link";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

type PrefetchLinkProps = LinkProps & {
  className?: string;
  children: React.ReactNode;
};

export function PrefetchLink({ href, ...props }: PrefetchLinkProps) {
  const router = useRouter();

  useEffect(() => {
    if (typeof href === "string") {
      router.prefetch(href);
    }
  }, [href, router]);

  return <Link href={href} {...props} />;
}

