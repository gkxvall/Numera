"use client";

import { useMemo } from "react";
import { motion, useReducedMotion } from "framer-motion";

const COLORS = [
  "var(--numera-blue)",
  "var(--numera-yellow)",
  "var(--numera-red)",
  "var(--numera-purple)",
  "var(--numera-green)",
];

interface Piece {
  id: number;
  left: number;
  color: string;
  delay: number;
  duration: number;
  rotation: number;
  drift: number;
}

function generatePieces(count: number): Piece[] {
  return Array.from({ length: count }, (_, id) => ({
    id,
    left: Math.random() * 100,
    color: COLORS[id % COLORS.length]!,
    delay: Math.random() * 0.4,
    duration: 1.6 + Math.random() * 1.2,
    rotation: Math.random() * 360,
    drift: (Math.random() - 0.5) * 120,
  }));
}

/** Original Numera-palette confetti burst — no third-party assets or libraries. */
export function ConfettiBurst({ pieceCount = 50 }: { pieceCount?: number }) {
  const reducedMotion = useReducedMotion();
  const pieces = useMemo(() => generatePieces(pieceCount), [pieceCount]);

  if (reducedMotion) return null;

  return (
    <div className="pointer-events-none fixed inset-0 z-40 overflow-hidden" aria-hidden="true">
      {pieces.map((piece) => (
        <motion.span
          key={piece.id}
          className="absolute top-0 block h-3 w-2 rounded-sm"
          style={{ left: `${piece.left}%`, backgroundColor: piece.color }}
          initial={{ y: -20, x: 0, rotate: 0, opacity: 1 }}
          animate={{
            y: "110vh",
            x: piece.drift,
            rotate: piece.rotation,
            opacity: [1, 1, 0],
          }}
          transition={{
            duration: piece.duration,
            delay: piece.delay,
            ease: "easeIn",
          }}
        />
      ))}
    </div>
  );
}
