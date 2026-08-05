export interface PlayerColorOption {
  id: string;
  label: string;
  bgClassName: string;
  textClassName: string;
  cssVar: string;
}

const BLUE: PlayerColorOption = {
  id: "blue",
  label: "Blue",
  bgClassName: "bg-numera-blue",
  textClassName: "text-white",
  cssVar: "var(--numera-blue)",
};

export const PLAYER_COLORS: readonly PlayerColorOption[] = [
  BLUE,
  {
    id: "red",
    label: "Red",
    bgClassName: "bg-numera-red",
    textClassName: "text-white",
    cssVar: "var(--numera-red)",
  },
  {
    id: "yellow",
    label: "Yellow",
    bgClassName: "bg-numera-yellow",
    textClassName: "text-numera-outline",
    cssVar: "var(--numera-yellow)",
  },
  {
    id: "green",
    label: "Green",
    bgClassName: "bg-numera-green",
    textClassName: "text-numera-outline",
    cssVar: "var(--numera-green)",
  },
  {
    id: "purple",
    label: "Purple",
    bgClassName: "bg-numera-purple",
    textClassName: "text-white",
    cssVar: "var(--numera-purple)",
  },
];

export const DEFAULT_PLAYER_COLOR_ID = BLUE.id;

export function getPlayerColor(colorId: string): PlayerColorOption {
  return PLAYER_COLORS.find((color) => color.id === colorId) ?? BLUE;
}
