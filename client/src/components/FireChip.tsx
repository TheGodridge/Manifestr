import { Flame } from "lucide-react";

interface FireChipProps {
  streak: number;
}

export function FireChip({ streak }: FireChipProps) {
  if (streak === 0) return null;

  return (
    <div
      className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-orange-500/20 to-red-500/20 border border-orange-500/30 rounded-full backdrop-blur-sm"
      data-testid="fire-chip"
    >
      <Flame className="w-4 h-4 text-orange-400 animate-pulse" />
      <span className="text-orange-200 font-semibold text-sm" data-testid="text-streak-count">
        {streak} day{streak !== 1 ? "s" : ""}
      </span>
    </div>
  );
}
