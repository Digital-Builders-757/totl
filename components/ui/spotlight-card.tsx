"use client";

import React, { useCallback, useEffect, useRef, useState, type ReactNode } from "react";

interface SpotlightCardProps {
  children: ReactNode;
  className?: string;
}

/**
 * SpotlightCard — cursor-following glow border accent.
 * - Per-card pointer tracking (onPointerMove on wrapper), no global listener.
 * - Respects prefers-reduced-motion: static center glow.
 * - Glow styles live in globals.css; no <style> injection.
 */
export function SpotlightCard({ children, className = "" }: SpotlightCardProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [reducedMotion, setReducedMotion] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReducedMotion(mq.matches);
    const handler = () => setReducedMotion(mq.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);

  const updateSpotlight = useCallback(
    (clientX: number, clientY: number) => {
      if (reducedMotion || !ref.current) return;
      const rect = ref.current.getBoundingClientRect();
      const x = clientX - rect.left;
      const y = clientY - rect.top;
      ref.current.style.setProperty("--spotlight-x", String(x));
      ref.current.style.setProperty("--spotlight-y", String(y));
    },
    [reducedMotion]
  );

  const handlePointerMove = useCallback(
    (e: React.PointerEvent) => {
      updateSpotlight(e.clientX, e.clientY);
    },
    [updateSpotlight]
  );

  const handlePointerLeave = useCallback(() => {
    if (reducedMotion || !ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    updateSpotlight(rect.left + rect.width / 2, rect.top + rect.height / 2);
  }, [reducedMotion, updateSpotlight]);

  return (
    <div
      ref={ref}
      data-spotlight
      onPointerMove={handlePointerMove}
      onPointerLeave={handlePointerLeave}
      className={className}
    >
      {children}
    </div>
  );
}
