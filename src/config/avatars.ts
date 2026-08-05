export interface AvatarDefinition {
  id: string;
  label: string;
}

const SPIKE: AvatarDefinition = { id: "spike", label: "Spike" };

export const AVATARS: readonly AvatarDefinition[] = [
  SPIKE,
  { id: "blink", label: "Blink" },
  { id: "grin", label: "Grin" },
  { id: "zigzag", label: "Zigzag" },
  { id: "bolt", label: "Bolt" },
  { id: "wave", label: "Wave" },
  { id: "star", label: "Star" },
  { id: "fang", label: "Fang" },
  { id: "cool", label: "Cool" },
  { id: "gasp", label: "Gasp" },
];

export const DEFAULT_AVATAR_ID = SPIKE.id;

export function getAvatar(avatarId: string): AvatarDefinition {
  return AVATARS.find((avatar) => avatar.id === avatarId) ?? SPIKE;
}
