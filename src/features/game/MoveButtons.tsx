import { Button } from "@/components/Button";

export interface MoveButtonsProps {
  maxMove: number;
  disabled: boolean;
  onSelect: (amount: number) => void;
}

export function MoveButtons({ maxMove, disabled, onSelect }: MoveButtonsProps) {
  const options = Array.from({ length: maxMove }, (_, i) => i + 1);

  return (
    <div className="flex flex-wrap justify-center gap-3" role="group" aria-label="Choose your move">
      {options.map((amount) => (
        <Button
          key={amount}
          size="lg"
          variant="primary"
          disabled={disabled}
          onClick={() => onSelect(amount)}
          className="min-w-20"
        >
          +{amount}
        </Button>
      ))}
    </div>
  );
}
