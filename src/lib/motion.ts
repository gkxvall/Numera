import type { Transition } from "framer-motion";

export const chunkySpring: Transition = {
  type: "spring",
  stiffness: 500,
  damping: 30,
};

export function pressScale(reducedMotion: boolean): number {
  return reducedMotion ? 1 : 0.94;
}

export function hoverScale(reducedMotion: boolean): number {
  return reducedMotion ? 1 : 1.03;
}
