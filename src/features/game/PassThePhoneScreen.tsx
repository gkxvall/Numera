import { Avatar } from "@/components/Avatar";
import { Button } from "@/components/Button";
import { Badge } from "@/components/Badge";
import type { Player } from "@/game-engine/types";

export interface PassThePhoneScreenProps {
  player: Player;
  round: number;
  onReady: () => void;
}

export function PassThePhoneScreen({ player, round, onReady }: PassThePhoneScreenProps) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-6 text-center">
      <Badge tone="neutral">Round {round}</Badge>
      <p className="text-foreground/70 text-sm">Pass the phone to</p>
      <Avatar avatarId={player.avatarId} colorId={player.colorId} size={120} title={player.name} />
      <h1 className="font-display text-foreground text-3xl">{player.name}</h1>
      {player.isBot && <Badge tone="purple">Bot turn</Badge>}
      <p className="text-foreground/60 max-w-xs text-sm">
        The counter and controls are hidden until you confirm you have the phone.
      </p>
      <Button size="lg" onClick={onReady}>
        Tap when ready
      </Button>
    </div>
  );
}
