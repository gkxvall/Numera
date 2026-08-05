import { AnimatedNumber } from "@/components/AnimatedNumber";
import { Badge } from "@/components/Badge";
import { cn } from "@/lib/cn";
import type { DangerLevel } from "@/game-engine/types";

export interface CounterProps {
  value: number;
  dangerLevel: DangerLevel | null;
}

const DANGER_STYLES: Record<
  DangerLevel,
  { ring: string; badgeTone: "blue" | "yellow" | "red"; label: string }
> = {
  safe: { ring: "ring-numera-blue", badgeTone: "blue", label: "Safe" },
  caution: { ring: "ring-numera-yellow", badgeTone: "yellow", label: "Caution" },
  danger: { ring: "ring-numera-red", badgeTone: "red", label: "Danger" },
  critical: { ring: "ring-numera-red", badgeTone: "red", label: "Critical" },
};

export function Counter({ value, dangerLevel }: CounterProps) {
  const style = dangerLevel ? DANGER_STYLES[dangerLevel] : null;

  return (
    <div className="flex flex-col items-center gap-2">
      <div
        className={cn(
          "border-numera-outline bg-numera-surface shadow-chunky-lg flex h-40 w-40 items-center justify-center rounded-full border-4 transition-shadow sm:h-48 sm:w-48",
          style && `ring-8 ring-offset-4 ${style.ring}`,
        )}
      >
        <AnimatedNumber
          value={value}
          label="Shared counter"
          className="text-numera-outline text-6xl sm:text-7xl"
          durationSeconds={0.15}
        />
      </div>
      {style && (
        <Badge
          tone={style.badgeTone}
          className={dangerLevel === "critical" ? "animate-pulse" : undefined}
        >
          {style.label}
        </Badge>
      )}
    </div>
  );
}
