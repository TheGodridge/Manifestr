import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useAppState } from "@/hooks/useLocalStorage";
import { formatCents, formatDuration, formatTimestamp } from "@/lib/formatCurrency";
import { ChevronLeft, ChevronRight } from "lucide-react";

export default function Bank() {
  const [, setLocation] = useLocation();
  const [appState] = useAppState();

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <div className="flex-none px-5 pt-8 pb-6 border-b border-aurora-purple/20">
        <div className="max-w-4xl mx-auto">
          <Button
            variant="ghost"
            onClick={() => setLocation("/")}
            className="mb-6 text-mist-lavender hover:text-gold-primary -ml-2"
            data-testid="button-back"
          >
            <ChevronLeft className="w-5 h-5 mr-1" />
            Back to Manifest
          </Button>
          
          <div className="text-center">
            <p className="text-mist-lavender text-sm uppercase tracking-wider mb-2" data-testid="label-total">
              Total Manifested
            </p>
            <div className="relative inline-block">
              <div
                className="absolute inset-0 blur-xl opacity-40 animate-shimmer"
                style={{
                  background: "linear-gradient(90deg, transparent, rgba(248, 217, 78, 0.3), transparent)",
                  backgroundSize: "200% 100%",
                }}
              />
              <h1
                className="font-poppins font-bold text-5xl sm:text-6xl md:text-7xl text-gold-primary relative z-10"
                data-testid="total-amount"
              >
                {formatCents(appState.bankTotalCents)}
              </h1>
            </div>
          </div>
        </div>
      </div>

      {/* History List */}
      <div className="flex-1 px-5 py-8">
        <div className="max-w-4xl mx-auto">
          {appState.history.length === 0 ? (
            <div className="text-center py-16">
              <p className="text-mist-lavender text-lg mb-6" data-testid="empty-state">
                No deposits yet. Your focus is worth more than you think—start one now.
              </p>
              <Button
                onClick={() => setLocation("/")}
                className="bg-gold-primary text-night-sky hover:bg-gold-pressed h-[54px] px-8 rounded-[14px] font-medium tracking-cta"
                style={{
                  boxShadow: "0 0 30px rgba(59, 10, 102, 0.3)",
                }}
                data-testid="button-start-manifest"
              >
                Start Manifest
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              {appState.history.map((entry) => (
                <Card
                  key={entry.id}
                  className="bg-aurora-purple/20 border-pulse-purple/30 hover-elevate rounded-xl p-5 cursor-pointer transition-all"
                  data-testid={`history-item-${entry.id}`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <p className="text-gold-primary font-poppins font-bold text-xl mb-1">
                        + {formatCents(entry.amountCents)}
                      </p>
                      <p className="text-mist-lavender text-sm">
                        {entry.label} · {formatDuration(entry.durationSec)} · {formatTimestamp(entry.timestamp)}
                      </p>
                    </div>
                    <ChevronRight className="w-5 h-5 text-mist-lavender/50" />
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Footer Widgets (placeholder for future features) */}
      {appState.history.length > 0 && (
        <div className="flex-none px-5 pb-8">
          <div className="max-w-4xl mx-auto flex flex-wrap gap-3 justify-center">
            <div className="bg-aurora-purple/20 border border-pulse-purple/30 rounded-xl px-4 py-2">
              <p className="text-gold-soft text-sm font-medium">
                {appState.history.length} deposit{appState.history.length !== 1 ? "s" : ""}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
