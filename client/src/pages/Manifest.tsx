import { useState, useEffect, useRef } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { AnimatedCounter } from "@/components/AnimatedCounter";
import { DepositModal } from "@/components/DepositModal";
import { useAppState } from "@/hooks/useLocalStorage";
import { EARN_RATE_CENTS_PER_SEC, STARTER_QUOTES, SessionState, DepositHistory } from "@shared/schema";
import { Headphones, DollarSign, TrendingUp, Star } from "lucide-react";
import { formatDuration } from "@/lib/formatCurrency";
import { audioService } from "@/lib/audioService";

export default function Manifest() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [appState, setAppState] = useAppState();
  
  const [sessionState, setSessionState] = useState<SessionState>("idle");
  const [sessionCents, setSessionCents] = useState(0);
  const [focusedSeconds, setFocusedSeconds] = useState(0);
  const [currentQuoteIndex, setCurrentQuoteIndex] = useState(0);
  const [showDepositModal, setShowDepositModal] = useState(false);
  const [isDepositing, setIsDepositing] = useState(false);
  
  const timerRef = useRef<NodeJS.Timeout>();
  const quoteTimerRef = useRef<NodeJS.Timeout>();

  // Quote rotation
  useEffect(() => {
    const rotateQuote = () => {
      setCurrentQuoteIndex((prev) => (prev + 1) % STARTER_QUOTES.length);
    };

    if (quoteTimerRef.current) {
      clearInterval(quoteTimerRef.current);
    }

    quoteTimerRef.current = setInterval(rotateQuote, appState.preferences.quoteIntervalSec * 1000);

    return () => {
      if (quoteTimerRef.current) {
        clearInterval(quoteTimerRef.current);
      }
    };
  }, [appState.preferences.quoteIntervalSec]);

  // Session counter
  useEffect(() => {
    if (sessionState === "running") {
      timerRef.current = setInterval(() => {
        setSessionCents((prev) => prev + EARN_RATE_CENTS_PER_SEC);
        setFocusedSeconds((prev) => prev + 1);
      }, 1000);
    } else {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    }

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [sessionState]);

  const handlePlayPause = () => {
    if (sessionState === "idle" || sessionState === "paused") {
      setSessionState("running");
      if (sessionState === "idle") {
        audioService.play(appState.preferences.music);
      } else {
        audioService.resume();
      }
    } else if (sessionState === "running") {
      setSessionState("paused");
      audioService.pause();
    }
  };

  const handleDeposit = () => {
    if (sessionCents === 0) {
      toast({
        title: "No focus to deposit",
        description: "Start a session first to build your balance.",
        variant: "destructive",
      });
      return;
    }
    setShowDepositModal(true);
  };

  const confirmDeposit = () => {
    const depositAmount = sessionCents;
    const durationSec = focusedSeconds;
    
    const newHistory: DepositHistory = {
      id: `hx_${Date.now()}`,
      amountCents: depositAmount,
      durationSec,
      label: getSessionLabel(),
      timestamp: Date.now(),
    };

    // Trigger deposit animation
    setIsDepositing(true);
    
    // Update state after brief delay for animation
    setTimeout(() => {
      setAppState({
        ...appState,
        bankTotalCents: appState.bankTotalCents + depositAmount,
        history: [newHistory, ...appState.history],
      });

      toast({
        title: `Banked ${formatDuration(durationSec)} of focus`,
        description: `Your future self says thanks.`,
      });

      // Reset session
      setSessionCents(0);
      setFocusedSeconds(0);
      setSessionState("idle");
      setIsDepositing(false);
      audioService.stop();
    }, 600); // Match coin-drop animation duration
  };

  const getSessionLabel = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Morning Focus";
    if (hour < 17) return "Afternoon Flow";
    return "Evening Practice";
  };

  const toggleFavorite = () => {
    const currentQuote = STARTER_QUOTES[currentQuoteIndex];
    const isFavorited = appState.favorites.includes(currentQuote);
    
    if (isFavorited) {
      setAppState({
        ...appState,
        favorites: appState.favorites.filter((q) => q !== currentQuote),
      });
    } else {
      setAppState({
        ...appState,
        favorites: [...appState.favorites, currentQuote],
      });
    }
  };

  const isFavorited = appState.favorites.includes(STARTER_QUOTES[currentQuoteIndex]);

  return (
    <div className="relative h-screen overflow-hidden flex flex-col">
      {/* Top Section - Affirmation */}
      <div className="flex-none pt-12 px-5">
        <div className="relative max-w-2xl mx-auto">
          <p 
            className="text-center text-mist-lavender text-lg sm:text-xl font-inter font-medium leading-relaxed min-h-[4rem] flex items-center justify-center px-8"
            data-testid="affirmation-text"
          >
            {STARTER_QUOTES[currentQuoteIndex]}
          </p>
          <button
            onClick={toggleFavorite}
            className="absolute right-0 top-1/2 -translate-y-1/2 p-2 hover-elevate active-elevate-2 rounded-md transition-transform"
            data-testid="button-favorite"
          >
            <Star
              className={`w-6 h-6 ${isFavorited ? "fill-gold-primary text-gold-primary" : "text-mist-lavender"}`}
            />
          </button>
        </div>
      </div>

      {/* Center Section - Counter */}
      <div className="flex-1 flex flex-col items-center justify-center px-5 space-y-2">
        <div className="relative">
          {/* Radial glow effect */}
          <div
            className="absolute inset-0 blur-3xl opacity-30"
            style={{
              background: "radial-gradient(circle, rgba(59, 10, 102, 0.6) 0%, transparent 70%)",
            }}
          />
          
          <AnimatedCounter
            value={sessionCents}
            className="text-6xl sm:text-7xl md:text-8xl lg:text-9xl relative z-10"
            isDepositing={isDepositing}
          />
        </div>
        
        <p className="text-mist-lavender text-sm sm:text-base font-inter mt-2" data-testid="subtext">
          Stay present — your energy compounds.
        </p>
      </div>

      {/* Bottom Controls */}
      <div className="flex-none pb-8 px-5">
        <div className="max-w-md mx-auto flex items-center justify-center gap-3">
          {/* Play/Pause Button */}
          <Button
            onClick={handlePlayPause}
            className={`bg-aurora-purple text-gold-primary border border-pulse-purple/20 hover:bg-pulse-purple h-[50px] w-[50px] sm:w-auto sm:px-6 rounded-xl transition-all ${
              sessionState === "running" ? "ring-2 ring-gold-primary/30" : ""
            }`}
            data-testid="button-play-pause"
          >
            <Headphones className={`w-5 h-5 ${sessionState === "running" ? "animate-pulse" : ""}`} />
            <span className="hidden sm:inline ml-2">
              {sessionState === "running" ? "Pause" : sessionState === "paused" ? "Resume" : "Play"}
            </span>
          </Button>

          {/* Deposit Button */}
          <Button
            onClick={handleDeposit}
            className="bg-gold-primary text-night-sky hover:bg-gold-pressed h-[54px] px-8 rounded-[14px] font-medium tracking-cta flex-1 sm:flex-initial"
            style={{
              boxShadow: "0 0 30px rgba(59, 10, 102, 0.3)",
            }}
            data-testid="button-deposit"
          >
            <DollarSign className="w-5 h-5" />
            <span className="ml-2">Deposit</span>
          </Button>

          {/* Bank Button */}
          <Button
            onClick={() => setLocation("/bank")}
            className="bg-aurora-purple text-gold-primary border border-pulse-purple/20 hover:bg-pulse-purple h-[50px] w-[50px] sm:w-auto sm:px-6 rounded-xl"
            data-testid="button-bank"
          >
            <TrendingUp className="w-5 h-5" />
            <span className="hidden sm:inline ml-2">Bank</span>
          </Button>
        </div>
      </div>

      <DepositModal
        open={showDepositModal}
        onOpenChange={setShowDepositModal}
        amount={sessionCents}
        onConfirm={confirmDeposit}
      />
    </div>
  );
}
