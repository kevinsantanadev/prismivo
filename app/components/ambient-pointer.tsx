"use client";

import { useEffect } from "react";

/**
 * Moves a restrained prismatic light through the public experience on precise
 * pointers. Touch devices and visitors who prefer reduced motion keep the
 * static background, avoiding unnecessary work and motion.
 */
export function AmbientPointer() {
  useEffect(() => {
    const root = document.documentElement;
    const canAnimate = window.matchMedia("(pointer: fine) and (prefers-reduced-motion: no-preference)");
    if (!canAnimate.matches) return;

    let animationFrame = 0;

    const updatePosition = (event: PointerEvent) => {
      if (animationFrame) cancelAnimationFrame(animationFrame);
      animationFrame = requestAnimationFrame(() => {
        root.style.setProperty("--pointer-x", `${event.clientX}px`);
        root.style.setProperty("--pointer-y", `${event.clientY}px`);
        root.dataset.pointerAtmosphere = "active";
        animationFrame = 0;
      });
    };

    window.addEventListener("pointermove", updatePosition, { passive: true });

    return () => {
      window.removeEventListener("pointermove", updatePosition);
      if (animationFrame) cancelAnimationFrame(animationFrame);
      root.style.removeProperty("--pointer-x");
      root.style.removeProperty("--pointer-y");
      delete root.dataset.pointerAtmosphere;
    };
  }, []);

  return null;
}
