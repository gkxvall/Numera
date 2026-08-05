import type { HTMLAttributes, ReactNode } from "react";
import { cn } from "@/lib/cn";

export type BadgeTone = "neutral" | "blue" | "yellow" | "red" | "green" | "purple";

const toneClasses: Record<BadgeTone, string> = {
  neutral: "bg-numera-surface text-foreground",
  blue: "bg-numera-blue text-white",
  yellow: "bg-numera-yellow text-numera-outline",
  red: "bg-numera-red text-white",
  green: "bg-numera-green text-numera-outline",
  purple: "bg-numera-purple text-white",
};

export interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  tone?: BadgeTone;
  icon?: ReactNode;
}

export function Badge({ tone = "neutral", icon, className, children, ...props }: BadgeProps) {
  return (
    <span
      className={cn(
        "border-numera-outline inline-flex items-center gap-1 rounded-full border-2 px-3 py-1 text-xs font-bold tracking-wide uppercase",
        toneClasses[tone],
        className,
      )}
      {...props}
    >
      {icon}
      {children}
    </span>
  );
}
