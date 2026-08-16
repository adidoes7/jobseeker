"use client";

import { useEffect, useRef } from "react";

const NAV_HEIGHT_PX = 56;

/**
 * Sticks its children directly below the app nav, and publishes its own
 * rendered height as --applications-header-bottom so the table header
 * (rendered separately, in the server component) knows exactly where to
 * stick below it without hardcoding a guessed pixel offset.
 */
export function StickySubheader({ children }: { children: React.ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const update = () => {
      document.documentElement.style.setProperty(
        "--applications-header-bottom",
        `${NAV_HEIGHT_PX + el.offsetHeight}px`
      );
    };
    update();

    const observer = new ResizeObserver(update);
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <div ref={ref} className="sticky top-14 z-30 -mx-6 bg-background px-6 pb-0">
      {children}
    </div>
  );
}
