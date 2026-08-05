"use client";

import { useEffect, useRef, useState } from "react";
import { animate, useReducedMotion } from "framer-motion";
import { cn } from "@/lib/cn";

export interface AnimatedNumberProps {
  value: number;
  className?: string;
  durationSeconds?: number;
  formatter?: (value: number) => string;
  label?: string;
}

export function AnimatedNumber({
  value,
  className,
  durationSeconds = 0.6,
  formatter,
  label,
}: AnimatedNumberProps) {
  const reducedMotion = useReducedMotion();
  const [tweenedValue, setTweenedValue] = useState(value);
  const previousValue = useRef(value);

  useEffect(() => {
    if (reducedMotion) {
      previousValue.current = value;
      return;
    }

    const controls = animate(previousValue.current, value, {
      duration: durationSeconds,
      ease: "easeOut",
      onUpdate: setTweenedValue,
      onComplete: () => {
        previousValue.current = value;
      },
    });

    return () => controls.stop();
  }, [value, reducedMotion, durationSeconds]);

  const format = formatter ?? ((n: number) => String(n));
  const rounded = Math.round(reducedMotion ? value : tweenedValue);

  return (
    <span className="relative inline-block">
      <span className={cn("font-display tabular-nums", className)} aria-hidden="true">
        {format(rounded)}
      </span>
      <span className="sr-only" role="status" aria-live="polite">
        {label ? `${label}: ${format(value)}` : format(value)}
      </span>
    </span>
  );
}
