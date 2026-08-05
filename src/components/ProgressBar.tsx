"use client";

import { motion, useReducedMotion } from "framer-motion";
import { cn } from "@/lib/cn";

export interface ProgressBarProps {
  value: number;
  max: number;
  label: string;
  colorClassName?: string;
  className?: string;
}

export function ProgressBar({
  value,
  max,
  label,
  colorClassName = "bg-numera-blue",
  className,
}: ProgressBarProps) {
  const reducedMotion = useReducedMotion();
  const clamped = max <= 0 ? 0 : Math.min(100, Math.max(0, (value / max) * 100));

  return (
    <div
      role="progressbar"
      aria-label={label}
      aria-valuenow={Math.round(clamped)}
      aria-valuemin={0}
      aria-valuemax={100}
      className={cn(
        "border-numera-outline bg-numera-surface h-5 w-full overflow-hidden rounded-full border-2",
        className,
      )}
    >
      <motion.div
        className={cn("h-full rounded-full", colorClassName)}
        initial={false}
        animate={{ width: `${clamped}%` }}
        transition={
          reducedMotion ? { duration: 0 } : { type: "spring", stiffness: 120, damping: 20 }
        }
      />
    </div>
  );
}
