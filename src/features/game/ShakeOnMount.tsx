"use client";

import type { ReactNode } from "react";
import { motion, useReducedMotion } from "framer-motion";

/** Plays a brief screen-shake once when mounted (plan §16.1: "Elimination screen shake"). */
export function ShakeOnMount({ children }: { children: ReactNode }) {
  const reducedMotion = useReducedMotion();

  return (
    <motion.div
      initial={false}
      animate={reducedMotion ? { x: 0 } : { x: [0, -10, 10, -8, 8, -4, 4, 0] }}
      transition={{ duration: 0.5, ease: "easeOut" }}
      className="flex flex-1 flex-col"
    >
      {children}
    </motion.div>
  );
}
