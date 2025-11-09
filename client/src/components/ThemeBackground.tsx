import { Theme } from "@shared/schema";

interface ThemeBackgroundProps {
  theme: Theme;
}

export function ThemeBackground({ theme }: ThemeBackgroundProps) {
  const getGradient = () => {
    switch (theme) {
      case "Galaxy":
        return "linear-gradient(to bottom, #0A0D2A, #1A1E3E)";
      case "Ocean":
        return "linear-gradient(to bottom, #06182E, #0B2C3A)";
      case "Neon Glow":
        return "linear-gradient(to bottom, #0A0D2A, #2A0A26)";
      case "Minimal":
        return "linear-gradient(to bottom, #0B0B0F, #0B0B0F)";
    }
  };

  return (
    <div
      className="fixed inset-0 -z-10"
      style={{
        background: getGradient(),
      }}
    />
  );
}
