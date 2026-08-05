export interface PlayerColorOption {
  id: string;
  label: string;
  bgClassName: string;
  textClassName: string;
}

const BLUE: PlayerColorOption = {
  id: "blue",
  label: "Blue",
  bgClassName: "bg-numera-blue",
  textClassName: "text-white",
};

export const PLAYER_COLORS: readonly PlayerColorOption[] = [
  BLUE,
  { id: "red", label: "Red", bgClassName: "bg-numera-red", textClassName: "text-white" },
  {
    id: "yellow",
    label: "Yellow",
    bgClassName: "bg-numera-yellow",
    textClassName: "text-numera-outline",
  },
  {
    id: "green",
    label: "Green",
    bgClassName: "bg-numera-green",
    textClassName: "text-numera-outline",
  },
  { id: "purple", label: "Purple", bgClassName: "bg-numera-purple", textClassName: "text-white" },
];

export const DEFAULT_PLAYER_COLOR_ID = BLUE.id;

export function getPlayerColor(colorId: string): PlayerColorOption {
  return PLAYER_COLORS.find((color) => color.id === colorId) ?? BLUE;
}
