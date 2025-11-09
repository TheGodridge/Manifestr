interface FocusMultiplierBarProps {
  multiplier: number;
  maxMultiplier?: number;
}

export function FocusMultiplierBar({ multiplier, maxMultiplier = 4 }: FocusMultiplierBarProps) {
  // Calculate fill percentage: (current - 1) / (max - 1)
  const fillPercentage = Math.min(((multiplier - 1) / (maxMultiplier - 1)) * 100, 100);
  
  // Determine color intensity based on milestones
  const getBarColor = () => {
    if (multiplier >= 4) return "from-gold-primary via-gold-pressed to-gold-primary";
    if (multiplier >= 3) return "from-aurora-purple via-pulse-purple to-aurora-purple";
    if (multiplier >= 2) return "from-pulse-purple/80 via-aurora-purple/80 to-pulse-purple/80";
    return "from-pulse-purple/50 via-aurora-purple/50 to-pulse-purple/50";
  };

  const getGlowIntensity = () => {
    if (multiplier >= 4) return "0 0 40px rgba(248, 217, 78, 0.8)";
    if (multiplier >= 3) return "0 0 30px rgba(59, 10, 102, 0.6)";
    if (multiplier >= 2) return "0 0 20px rgba(59, 10, 102, 0.4)";
    return "0 0 10px rgba(59, 10, 102, 0.2)";
  };

  return (
    <div className="w-full max-w-2xl" data-testid="focus-multiplier-bar">
      {/* Label */}
      <div className="flex items-center justify-between mb-2">
        <span className="text-mist-lavender text-sm font-inter">
          Focus Multiplier
        </span>
        <span 
          className="text-gold-primary text-sm font-poppins font-bold"
          data-testid="multiplier-value"
        >
          {multiplier.toFixed(2)}×
        </span>
      </div>

      {/* Progress Bar */}
      <div className="relative h-3 bg-aurora-purple/20 rounded-full overflow-hidden border border-pulse-purple/20">
        {/* Animated fill */}
        <div
          className={`h-full bg-gradient-to-r ${getBarColor()} transition-all duration-1000 ease-out`}
          style={{
            width: `${fillPercentage}%`,
            boxShadow: getGlowIntensity(),
          }}
          data-testid="multiplier-fill"
        />
        
        {/* Milestone markers - absolutely positioned */}
        {/* 2x marker */}
        <div 
          className="absolute top-0 w-px h-full bg-mist-lavender/30"
          style={{ left: `${((2 - 1) / (maxMultiplier - 1)) * 100}%` }}
        />
        {/* 3x marker */}
        <div 
          className="absolute top-0 w-px h-full bg-mist-lavender/30"
          style={{ left: `${((3 - 1) / (maxMultiplier - 1)) * 100}%` }}
        />
      </div>

      {/* Milestone labels (optional, shows when near/at milestone) */}
      {multiplier >= 3.9 && (
        <p className="text-gold-primary text-xs font-inter mt-1 text-center animate-pulse" data-testid="milestone-message">
          Maximum Focus!
        </p>
      )}
    </div>
  );
}
