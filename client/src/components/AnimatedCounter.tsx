import { useEffect, useRef } from "react";

interface AnimatedCounterProps {
  value: number;
  className?: string;
  isDepositing?: boolean;
}

// Split formatted currency into parts for anchored decimal layout
function splitCurrency(cents: number): { sign: string; dollars: string; decimal: string; cents: string } {
  const dollars = Math.floor(cents / 100);
  const centsOnly = cents % 100;
  return {
    sign: "$",
    dollars: dollars.toString(),
    decimal: ".",
    cents: centsOnly.toString().padStart(2, "0"),
  };
}

export function AnimatedCounter({ value, className = "", isDepositing = false }: AnimatedCounterProps) {
  const dollarsRef = useRef<HTMLSpanElement>(null);
  const centsRef = useRef<HTMLSpanElement>(null);
  const prevValueRef = useRef(value);

  useEffect(() => {
    const dollarsElement = dollarsRef.current;
    const centsElement = centsRef.current;
    if (!dollarsElement || !centsElement) return;

    const startValue = prevValueRef.current;
    const endValue = value;
    const duration = 150; // Fast 150ms animation for smooth increments
    const startTime = Date.now();

    const animate = () => {
      const now = Date.now();
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);

      // Linear easing for smooth, predictable movement
      const currentValue = Math.round(startValue + (endValue - startValue) * progress);

      const parts = splitCurrency(currentValue);
      dollarsElement.textContent = parts.sign + parts.dollars;
      centsElement.textContent = parts.cents;

      if (progress < 1) {
        requestAnimationFrame(animate);
      } else {
        prevValueRef.current = endValue;
      }
    };

    if (startValue !== endValue) {
      animate();
    } else {
      const parts = splitCurrency(value);
      dollarsElement.textContent = parts.sign + parts.dollars;
      centsElement.textContent = parts.cents;
    }
  }, [value]);

  const initialParts = splitCurrency(value);

  return (
    <div
      className={`font-poppins font-bold text-gold-primary tabular-nums ${isDepositing ? "animate-coin-drop" : ""} ${className}`}
      style={{
        textShadow: "0 0 20px rgba(59, 10, 102, 0.8)",
        display: "grid",
        gridTemplateColumns: "1fr auto 1fr",
        alignItems: "baseline",
        width: "100%",
      }}
      data-testid="counter-display"
    >
      <span ref={dollarsRef} className="text-right" style={{ justifySelf: "end" }}>
        {initialParts.sign + initialParts.dollars}
      </span>
      <span style={{ padding: "0 0.25rem", justifySelf: "center" }}>{initialParts.decimal}</span>
      <span ref={centsRef} className="text-left" style={{ minWidth: "2ch", justifySelf: "start" }}>
        {initialParts.cents}
      </span>
    </div>
  );
}
