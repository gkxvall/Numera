"use client";

import { motion, useReducedMotion } from "framer-motion";
import { Heart } from "lucide-react";
import { cn } from "@/lib/cn";
import { getPlayerColor } from "@/config/playerColors";

export interface PlayerChipProps {
  name: string;
  colorId: string;
  lives?: number;
  maxLives?: number;
  isActive?: boolean;
  isEliminated?: boolean;
  size?: "sm" | "md" | "lg";
  className?: string;
}

const sizeClasses = {
  sm: { avatar: "h-9 w-9 text-sm", name: "text-xs" },
  md: { avatar: "h-12 w-12 text-lg", name: "text-sm" },
  lg: { avatar: "h-16 w-16 text-2xl", name: "text-base" },
} as const;

export function PlayerChip({
  name,
  colorId,
  lives,
  maxLives,
  isActive = false,
  isEliminated = false,
  size = "md",
  className,
}: PlayerChipProps) {
  const reducedMotion = useReducedMotion();
  const color = getPlayerColor(colorId);
  const initial = name.trim().charAt(0).toUpperCase() || "?";
  const sizing = sizeClasses[size];

  return (
    <div
      className={cn(
        "flex flex-col items-center gap-1",
        isEliminated && "opacity-50 grayscale",
        className,
      )}
      aria-label={isEliminated ? `${name}, eliminated` : isActive ? `${name}, current turn` : name}
    >
      <motion.div
        className={cn(
          "border-numera-outline shadow-chunky-sm relative flex items-center justify-center rounded-full border-4 font-bold",
          color.bgClassName,
          color.textClassName,
          sizing.avatar,
          isActive && "ring-numera-yellow ring-4 ring-offset-2",
        )}
        animate={isActive && !reducedMotion ? { scale: [1, 1.06, 1] } : { scale: 1 }}
        transition={isActive && !reducedMotion ? { duration: 1.2, repeat: Infinity } : undefined}
      >
        {initial}
        {isEliminated && (
          <span className="absolute inset-0 flex items-center justify-center text-xl font-black text-white/90">
            ✕
          </span>
        )}
      </motion.div>
      <span className={cn("text-foreground max-w-20 truncate font-semibold", sizing.name)}>
        {name}
      </span>
      {typeof lives === "number" && typeof maxLives === "number" && maxLives > 0 && (
        <div className="flex items-center gap-0.5" aria-hidden="true">
          {Array.from({ length: maxLives }).map((_, index) => (
            <Heart
              key={index}
              size={12}
              className={
                index < lives
                  ? "fill-numera-red text-numera-outline"
                  : "text-foreground/30 fill-transparent"
              }
            />
          ))}
        </div>
      )}
    </div>
  );
}
