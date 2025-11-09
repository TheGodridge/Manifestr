import { useEffect, useRef } from "react";
import { formatCents } from "@/lib/formatCurrency";

interface AnimatedCounterProps {
  value: number;
  className?: string;
  isDepositing?: boolean;
}

export function AnimatedCounter({ value, className = "", isDepositing = false }: AnimatedCounterProps) {
  const displayRef = useRef<HTMLDivElement>(null);
  const prevValueRef = useRef(value);

  useEffect(() => {
    const element = displayRef.current;
    if (!element) return;

    const startValue = prevValueRef.current;
    const endValue = value;
    const duration = 1000; // 1 second tween
    const startTime = Date.now();

    const animate = () => {
      const now = Date.now();
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);

      // easeOutQuad
      const eased = 1 - Math.pow(1 - progress, 2);
      const currentValue = Math.round(startValue + (endValue - startValue) * eased);

      element.textContent = formatCents(currentValue);

      if (progress < 1) {
        requestAnimationFrame(animate);
      } else {
        prevValueRef.current = endValue;
      }
    };

    if (startValue !== endValue) {
      animate();
    } else {
      element.textContent = formatCents(value);
    }
  }, [value]);

  return (
    <div
      ref={displayRef}
      className={`font-poppins font-bold text-gold-primary ${isDepositing ? "animate-coin-drop" : ""} ${className}`}
      style={{
        textShadow: "0 0 20px rgba(59, 10, 102, 0.8)",
      }}
      data-testid="counter-display"
    >
      {formatCents(value)}
    </div>
  );
}
