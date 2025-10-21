"use client";

import { motion } from "framer-motion";

export function FloatingPathsBackground({ 
  opacity = 0.08,
  color = "var(--oklch-brand-3)"
}: { 
  opacity?: number;
  color?: string;
}) {
  const paths = Array.from({ length: 36 }, (_, i) => ({
    id: i,
    d: `M-${380 - i * 5} -${189 + i * 6}C-${380 - i * 5} -${189 + i * 6} -${312 - i * 5} ${216 - i * 6} ${152 - i * 5} ${343 - i * 6}C${616 - i * 5} ${470 - i * 6} ${684 - i * 5} ${875 - i * 6} ${684 - i * 5} ${875 - i * 6}`,
    width: 0.5 + i * 0.03,
  }));

  const pathsMirrored = Array.from({ length: 36 }, (_, i) => ({
    id: i + 36,
    d: `M-${380 - i * 5 * -1} -${189 + i * 6}C-${380 - i * 5 * -1} -${189 + i * 6} -${312 - i * 5 * -1} ${216 - i * 6} ${152 - i * 5 * -1} ${343 - i * 6}C${616 - i * 5 * -1} ${470 - i * 6} ${684 - i * 5 * -1} ${875 - i * 6} ${684 - i * 5 * -1} ${875 - i * 6}`,
    width: 0.5 + i * 0.03,
  }));

  const allPaths = [...paths, ...pathsMirrored];

  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden">
      <svg
        className="w-full h-full"
        viewBox="0 0 696 316"
        fill="none"
        preserveAspectRatio="xMidYMid slice"
        style={{ color }}
      >
        <title>Floating Background Paths</title>
        {allPaths.map((path) => (
          <motion.path
            key={path.id}
            d={path.d}
            stroke="currentColor"
            strokeWidth={path.width}
            strokeOpacity={opacity}
            initial={{ pathLength: 0.3, opacity: 0.3 }}
            animate={{
              pathLength: 1,
              opacity: [opacity * 0.5, opacity, opacity * 0.5],
              pathOffset: [0, 1, 0],
            }}
            transition={{
              duration: 20 + Math.random() * 10,
              repeat: Number.POSITIVE_INFINITY,
              ease: "linear",
              delay: path.id * 0.1,
            }}
          />
        ))}
      </svg>
    </div>
  );
}

