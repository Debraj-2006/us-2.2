import type { MouseEvent } from "react";

interface TiltOptions {
  maxDeg?: number;
  /** Include a perspective() term in the transform — needed when the element
   * has no ancestor with a CSS `perspective` already set. */
  perspective?: number;
  lift?: number;
}

function prefersReducedMotion() {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

export function handleTiltMove(e: MouseEvent<HTMLElement>, options: TiltOptions = {}) {
  if (prefersReducedMotion()) return;
  const { maxDeg = 8, perspective, lift = 0 } = options;
  const el = e.currentTarget;
  const rect = el.getBoundingClientRect();
  const x = (e.clientX - rect.left) / rect.width - 0.5;
  const y = (e.clientY - rect.top) / rect.height - 0.5;

  const parts: string[] = [];
  if (perspective) parts.push(`perspective(${perspective}px)`);
  parts.push(`rotateX(${(-y * maxDeg).toFixed(2)}deg)`, `rotateY(${(x * maxDeg).toFixed(2)}deg)`);
  if (lift) parts.push(`translateY(-${lift}px)`);
  el.style.transform = parts.join(" ");
}

export function handleTiltLeave(e: MouseEvent<HTMLElement>) {
  e.currentTarget.style.transform = "";
}
