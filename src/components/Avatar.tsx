import { cn } from "@/lib/cn";
import { getPlayerColor } from "@/config/playerColors";

export interface AvatarProps {
  avatarId: string;
  colorId: string;
  size?: number;
  className?: string;
  title?: string;
}

function Eyes({ avatarId }: { avatarId: string }) {
  if (avatarId === "cool") {
    return (
      <>
        <rect x={16} y={26} width={12} height={4} rx={2} fill="#111827" />
        <rect x={36} y={26} width={12} height={4} rx={2} fill="#111827" />
      </>
    );
  }
  if (avatarId === "blink") {
    return (
      <>
        <circle cx={22} cy={28} r={6} fill="white" stroke="#111827" strokeWidth={2} />
        <circle cx={22} cy={28} r={2.5} fill="#111827" />
        <path
          d="M36 28 Q42 24 48 28"
          stroke="#111827"
          strokeWidth={2.5}
          fill="none"
          strokeLinecap="round"
        />
      </>
    );
  }
  if (avatarId === "gasp") {
    return (
      <>
        <circle cx={21} cy={28} r={7.5} fill="white" stroke="#111827" strokeWidth={2} />
        <circle cx={21} cy={28} r={4} fill="#111827" />
        <circle cx={43} cy={28} r={7.5} fill="white" stroke="#111827" strokeWidth={2} />
        <circle cx={43} cy={28} r={4} fill="#111827" />
      </>
    );
  }
  return (
    <>
      <circle cx={22} cy={28} r={6} fill="white" stroke="#111827" strokeWidth={2} />
      <circle cx={22} cy={28} r={2.5} fill="#111827" />
      <circle cx={42} cy={28} r={6} fill="white" stroke="#111827" strokeWidth={2} />
      <circle cx={42} cy={28} r={2.5} fill="#111827" />
    </>
  );
}

function Mouth({ avatarId }: { avatarId: string }) {
  switch (avatarId) {
    case "grin":
      return (
        <path
          d="M18 42 Q32 54 46 42 Q32 48 18 42 Z"
          fill="#111827"
          stroke="#111827"
          strokeWidth={2}
          strokeLinejoin="round"
        />
      );
    case "zigzag":
      return (
        <path
          d="M16 42 L22 46 L28 42 L34 46 L40 42 L48 46"
          stroke="#111827"
          strokeWidth={3}
          fill="none"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      );
    case "bolt":
    case "gasp":
      return <ellipse cx={32} cy={44} rx={5} ry={6} fill="#111827" />;
    case "wave":
      return (
        <path
          d="M16 42 Q24 48 32 42 Q40 36 48 42"
          stroke="#111827"
          strokeWidth={3}
          fill="none"
          strokeLinecap="round"
        />
      );
    case "fang":
      return (
        <g>
          <path
            d="M18 40 Q32 50 46 40"
            stroke="#111827"
            strokeWidth={3}
            fill="none"
            strokeLinecap="round"
          />
          <path d="M25 42 L25 48 L29 42 Z" fill="white" stroke="#111827" strokeWidth={1.5} />
          <path d="M35 42 L35 48 L39 42 Z" fill="white" stroke="#111827" strokeWidth={1.5} />
        </g>
      );
    case "cool":
      return (
        <path
          d="M22 44 Q32 48 42 44"
          stroke="#111827"
          strokeWidth={3}
          fill="none"
          strokeLinecap="round"
        />
      );
    default:
      return (
        <path
          d="M20 40 Q32 50 44 40"
          stroke="#111827"
          strokeWidth={3}
          fill="none"
          strokeLinecap="round"
        />
      );
  }
}

function Accessory({ avatarId }: { avatarId: string }) {
  switch (avatarId) {
    case "spike":
      return <path d="M32 4 L26 16 L38 16 Z" fill="#111827" />;
    case "bolt":
      return (
        <path
          d="M34 2 L24 18 L31 18 L28 30 L42 12 L34 12 Z"
          fill="var(--numera-yellow)"
          stroke="#111827"
          strokeWidth={2}
          strokeLinejoin="round"
        />
      );
    case "star":
      return (
        <path
          d="M32 2 L34.5 9 L42 9 L36 13.5 L38 21 L32 16.5 L26 21 L28 13.5 L22 9 L29.5 9 Z"
          fill="var(--numera-yellow)"
          stroke="#111827"
          strokeWidth={1.5}
          strokeLinejoin="round"
        />
      );
    default:
      return null;
  }
}

/** Original SVG character avatars — no third-party or copyrighted artwork. */
export function Avatar({ avatarId, colorId, size = 48, className, title }: AvatarProps) {
  const color = getPlayerColor(colorId);
  return (
    <svg
      viewBox="0 0 64 64"
      width={size}
      height={size}
      className={cn("shrink-0", className)}
      role={title ? "img" : "presentation"}
      aria-label={title}
    >
      <circle cx={32} cy={32} r={28} fill={color.cssVar} stroke="#111827" strokeWidth={4} />
      <Eyes avatarId={avatarId} />
      <Mouth avatarId={avatarId} />
      <Accessory avatarId={avatarId} />
    </svg>
  );
}
