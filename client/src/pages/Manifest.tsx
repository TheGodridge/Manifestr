import { useState, useEffect, useRef } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { AnimatedCounter } from "@/components/AnimatedCounter";
import { DepositModal } from "@/components/DepositModal";
import { FireChip } from "@/components/FireChip";
import { FocusMultiplierBar } from "@/components/FocusMultiplierBar";
import { useAppState } from "@/hooks/useLocalStorage";
import { EARN_RATE_CENTS_PER_SEC, STARTER_QUOTES, SessionState, DepositHistory } from "@shared/schema";
import { Headphones, DollarSign, TrendingUp } from "lucide-react";
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
  const [currentMultiplier, setCurrentMultiplier] = useState(1);
  
  const timerRef = useRef<NodeJS.Timeout>();
  const quoteTimerRef = useRef<NodeJS.Timeout>();
  const fractionalCentsRef = useRef(0); // Track fractional cents for precision

  // Combined quotes: custom + starter
  const allQuotes = [...appState.customQuotes, ...STARTER_QUOTES];

  // Calculate exponential multiplier based on session duration
  const calculateMultiplier = (seconds: number): number => {
    // Exponential growth: 2% increase every 30 seconds
    // Formula: multiplier = 1.02^(seconds/30)
    // Reaches ~1.14x at 5 min, ~1.31x at 10 min, caps at 4x around 20 min
    const rawMultiplier = Math.pow(1.02, seconds / 30);
    return Math.min(rawMultiplier, 4);
  };

  // Quote rotation
  useEffect(() => {
    const rotateQuote = () => {
      setCurrentQuoteIndex((prev) => (prev + 1) % allQuotes.length);
    };

    if (quoteTimerRef.current) {
      clearInterval(quoteTimerRef.current);
    }

    if (allQuotes.length > 0) {
      quoteTimerRef.current = setInterval(rotateQuote, appState.preferences.quoteIntervalSec * 1000);
    }

    return () => {
      if (quoteTimerRef.current) {
        clearInterval(quoteTimerRef.current);
      }
    };
  }, [appState.preferences.quoteIntervalSec, allQuotes.length]);

  // Auto-deposit on exit (beforeunload)
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      // Only trigger if there are unsaved cents and auto-deposit is enabled
      if (sessionCents > 0) {
        if (appState.preferences.autoDepositOnExit) {
          // Auto-deposit silently
          const depositAmount = sessionCents;
          const durationSec = focusedSeconds;
          const now = Date.now();
          
          // Calculate streak (same logic as confirmDeposit)
          const todayStart = new Date(now).setHours(0, 0, 0, 0);
          const lastDepositStart = appState.lastDepositDate ? new Date(appState.lastDepositDate).setHours(0, 0, 0, 0) : null;
          
          let newStreak = appState.currentStreak;
          let isNewDay = false;
          
          if (!lastDepositStart) {
            // First ever deposit
            newStreak = 1;
            isNewDay = true;
          } else {
            const daysDiff = Math.floor((todayStart - lastDepositStart) / (1000 * 60 * 60 * 24));
            
            if (daysDiff === 0) {
              // Same day - maintain streak
              newStreak = appState.currentStreak;
            } else if (daysDiff === 1) {
              // Next day - increment streak
              newStreak = appState.currentStreak + 1;
              isNewDay = true;
            } else {
              // Missed days - reset streak
              newStreak = 1;
              isNewDay = true;
            }
          }
          
          // Calculate overnight compound interest (only for consecutive days)
          let compoundBonus = 0;
          if (lastDepositStart) {
            const daysDiff = Math.floor((todayStart - lastDepositStart) / (1000 * 60 * 60 * 24));
            // Award compound interest only if exactly 1 day passed (consecutive streak)
            if (daysDiff === 1 && appState.currentStreak > 0) {
              // 1% compound interest per day of previous streak
              compoundBonus = Math.floor(appState.bankTotalCents * 0.01 * appState.currentStreak);
            }
          }
          
          const newHistory: DepositHistory = {
            id: `hx_${now}`,
            timestamp: now,
            durationSec,
            amountCents: depositAmount,
            label: getSessionLabel(),
          };
          
          const newLongestStreak = Math.max(newStreak, appState.longestStreak);
          
          // Update state synchronously before page unload
          const newState = {
            ...appState,
            bankTotalCents: appState.bankTotalCents + depositAmount + compoundBonus,
            history: [newHistory, ...appState.history],
            currentStreak: newStreak,
            longestStreak: newLongestStreak,
            lastDepositDate: now,
          };
          
          // Write to localStorage immediately
          localStorage.setItem("manifestr_state", JSON.stringify(newState));
          
          // No browser confirmation needed
        } else {
          // Show browser confirmation dialog
          const message = `You have $${(sessionCents / 100).toFixed(2)} unsaved. Deposit before leaving?`;
          e.preventDefault();
          e.returnValue = message;
          return message;
        }
      }
    };

    window.addEventListener("beforeunload", handleBeforeUnload);

    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, [sessionCents, focusedSeconds, appState]);

  // Session counter with exponential growth
  useEffect(() => {
    if (sessionState === "running") {
      timerRef.current = setInterval(() => {
        setFocusedSeconds((prev) => {
          const nextSeconds = prev + 1;
          const multiplier = calculateMultiplier(nextSeconds);
          
          // Calculate exact earnings with fractional cents
          const exactEarnings = EARN_RATE_CENTS_PER_SEC * multiplier;
          const totalWithFraction = fractionalCentsRef.current + exactEarnings;
          
          // Extract whole cents and keep remainder
          const wholeCents = Math.floor(totalWithFraction);
          fractionalCentsRef.current = totalWithFraction - wholeCents;
          
          setSessionCents((prevCents) => prevCents + wholeCents);
          setCurrentMultiplier(multiplier);
          
          return nextSeconds;
        });
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
        audioService.play(appState.preferences.music, appState.preferences.volume);
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
    const now = Date.now();
    
    // Calculate streak
    const todayStart = new Date(now).setHours(0, 0, 0, 0);
    const lastDepositStart = appState.lastDepositDate ? new Date(appState.lastDepositDate).setHours(0, 0, 0, 0) : null;
    
    let newStreak = appState.currentStreak;
    let isNewDay = false;
    
    if (!lastDepositStart) {
      // First ever deposit
      newStreak = 1;
      isNewDay = true;
    } else {
      const daysDiff = Math.floor((todayStart - lastDepositStart) / (1000 * 60 * 60 * 24));
      
      if (daysDiff === 0) {
        // Same day - maintain streak
        newStreak = appState.currentStreak;
      } else if (daysDiff === 1) {
        // Next day - increment streak
        newStreak = appState.currentStreak + 1;
        isNewDay = true;
      } else {
        // Missed days - reset streak
        newStreak = 1;
        isNewDay = true;
      }
    }
    
    const newLongestStreak = Math.max(newStreak, appState.longestStreak);
    
    // Calculate overnight compound interest (only for consecutive days)
    let compoundBonus = 0;
    if (lastDepositStart) {
      const daysDiff = Math.floor((todayStart - lastDepositStart) / (1000 * 60 * 60 * 24));
      // Award compound interest only if exactly 1 day passed (consecutive streak)
      if (daysDiff === 1 && appState.currentStreak > 0) {
        // 1% compound interest per day of previous streak
        compoundBonus = Math.floor(appState.bankTotalCents * 0.01 * appState.currentStreak);
      }
    }
    
    const newHistory: DepositHistory = {
      id: `hx_${now}`,
      amountCents: depositAmount,
      durationSec,
      label: getSessionLabel(),
      timestamp: now,
    };

    // Trigger deposit animation
    setIsDepositing(true);
    
    // Update state after brief delay for animation
    setTimeout(() => {
      setAppState({
        ...appState,
        bankTotalCents: appState.bankTotalCents + depositAmount + compoundBonus,
        history: [newHistory, ...appState.history],
        currentStreak: newStreak,
        longestStreak: newLongestStreak,
        lastDepositDate: now,
      });

      let toastDescription = `Your future self says thanks.`;
      if (compoundBonus > 0) {
        toastDescription = `Night bonus: +$${(compoundBonus / 100).toFixed(2)} from ${appState.currentStreak}-day streak!`;
      }

      toast({
        title: `Banked ${formatDuration(durationSec)} of focus`,
        description: toastDescription,
      });

      // 7-day milestone celebration
      if (newStreak === 7) {
        setTimeout(() => {
          toast({
            title: "🔥 7-Day Streak!",
            description: "A week of focus. You're building something real.",
            duration: 5000,
          });
        }, 1000);
      }

      // Reset session
      setSessionCents(0);
      setFocusedSeconds(0);
      setSessionState("idle");
      setIsDepositing(false);
      setCurrentMultiplier(1);
      fractionalCentsRef.current = 0; // Reset fractional cents accumulator
      audioService.stop();
    }, 600); // Match coin-drop animation duration
  };

  const getSessionLabel = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Morning Focus";
    if (hour < 17) return "Afternoon Flow";
    return "Evening Practice";
  };


  return (
    <div 
      className="relative h-screen overflow-hidden flex flex-col animate-gradient-drift"
      style={{
        background: "linear-gradient(135deg, #0A0D2A 0%, #1a0d3d 25%, #0A0D2A 50%, #1a1040 75%, #0A0D2A 100%)",
      }}
    >
      {/* Main Content - Centered */}
      <div className="flex-1 flex flex-col items-center justify-center px-5">
        {/* Affirmation */}
        <p 
          className="text-center text-mist-lavender text-lg sm:text-xl font-inter font-medium leading-relaxed mb-8 max-w-2xl"
          data-testid="affirmation-text"
        >
          {allQuotes[currentQuoteIndex] || "Add a quote to begin."}
        </p>

        {/* Separator */}
        <div className="w-full max-w-2xl mb-8 flex items-center justify-center">
          <div className="flex-1 h-px bg-gradient-to-r from-transparent via-pulse-purple/40 to-transparent" />
        </div>

        {/* Counter - Left-aligned to prevent shifting */}
        <div className="relative mb-6 w-full max-w-2xl">
          {/* Radial glow effect */}
          <div
            className="absolute left-0 top-0 blur-3xl opacity-30 w-full h-full"
            style={{
              background: "radial-gradient(circle at left center, rgba(59, 10, 102, 0.6) 0%, transparent 70%)",
            }}
          />
          
          <AnimatedCounter
            value={sessionCents}
            className="text-6xl sm:text-7xl md:text-8xl lg:text-9xl relative z-10 text-left"
            isDepositing={isDepositing}
          />
        </div>

        {/* Focus Multiplier Progress Bar */}
        {sessionState === "running" && (
          <div className="mb-6 w-full max-w-2xl">
            <FocusMultiplierBar multiplier={currentMultiplier} />
          </div>
        )}
        
        <p className="text-mist-lavender text-sm sm:text-base font-inter mb-8" data-testid="subtext">
          Stay present — your energy compounds.
        </p>

        {/* Manifest/Deposit Button */}
        <Button
          onClick={sessionState === "running" ? handleDeposit : handlePlayPause}
          className="micro-interact bg-gold-primary text-night-sky hover:bg-gold-pressed h-[54px] px-8 rounded-[14px] font-medium tracking-cta"
          style={{
            boxShadow: "0 0 30px rgba(59, 10, 102, 0.3)",
          }}
          data-testid={sessionState === "running" ? "button-deposit" : "button-manifest"}
        >
          {sessionState === "running" ? (
            <>
              <DollarSign className="w-5 h-5" />
              <span className="ml-2">Deposit</span>
            </>
          ) : (
            <>
              <Headphones className="w-5 h-5" />
              <span className="ml-2">Manifest</span>
            </>
          )}
        </Button>
      </div>

      {/* Bottom Navigation Bar */}
      <div className="flex-none border-t border-pulse-purple/20 bg-night-sky/50 backdrop-blur-sm">
        <div className="max-w-md mx-auto flex items-center justify-around py-4 px-5">
          {/* Bank Button */}
          <Button
            onClick={() => setLocation("/bank")}
            className="micro-interact bg-aurora-purple text-gold-primary border border-pulse-purple/20 hover:bg-pulse-purple h-[50px] px-6 rounded-xl"
            data-testid="button-bank"
          >
            <TrendingUp className="w-5 h-5" />
            <span className="ml-2">History</span>
          </Button>

          {/* Settings Button */}
          <Button
            onClick={() => setLocation("/settings")}
            className="micro-interact bg-aurora-purple text-gold-primary border border-pulse-purple/20 hover:bg-pulse-purple h-[50px] px-6 rounded-xl"
            data-testid="button-settings"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            <span className="ml-2">Settings</span>
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
