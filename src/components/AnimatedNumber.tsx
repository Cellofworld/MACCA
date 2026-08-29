import { useEffect, useRef, useState } from "react";
import { fmtNum } from "../lib/dates";

/** Число, плавно «переезжающее» к новому значению */
export function AnimatedNumber({
  value,
  digits = 1,
  duration = 650,
  className,
}: {
  value: number;
  digits?: number;
  duration?: number;
  className?: string;
}) {
  const [display, setDisplay] = useState(value);
  const prevRef = useRef(value);

  useEffect(() => {
    const from = prevRef.current;
    const to = value;
    if (from === to) return;
    prevRef.current = to;

    let raf = 0;
    const t0 = performance.now();
    const tick = (t: number) => {
      const p = Math.min(1, (t - t0) / duration);
      const eased = 1 - Math.pow(1 - p, 3);
      setDisplay(from + (to - from) * eased);
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [value, duration]);

  return <span className={`tnum ${className ?? ""}`}>{fmtNum(display, digits)}</span>;
}
