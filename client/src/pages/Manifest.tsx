import { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { AnimatedCounter } from "@/components/AnimatedCounter";
import { DepositModal } from "@/components/DepositModal";
import { FocusMultiplierBar } from "@/components/FocusMultiplierBar";
import { ThemeBackground } from "@/components/ThemeBackground";
import { useAppState } from "@/hooks/useLocalStorage";
import { DIFFICULTY_CONFIGS, STARTER_QUOTES, SessionState, DepositHistory } from "@shared/schema";
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

  // Shuffle array utility
  const shuffleArray = <T,>(array: T[]): T[] => {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  };

  // Combined quotes: custom + starter, shuffled on every render
  const allQuotes = useMemo(
    () => shuffleArray([...appState.customQuotes, ...STARTER_QUOTES]),
    [appState.customQuotes]
  );

  // Calculate exponential multiplier based on session duration and difficulty
  const calculateMultiplier = useCallback((seconds: number): number => {
    const config = DIFFICULTY_CONFIGS[appState.preferences.focusLevel || "Intermediate"];
    const rawMultiplier = Math.pow(config.growthFactor, seconds / config.growthIntervalSec);
    return Math.min(rawMultiplier, config.maxMultiplier);
  }, [appState.preferences.focusLevel]);

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
          
          // Get difficulty config with safety check
          const focusLevel = appState.preferences.focusLevel || "Intermediate";
          const config = DIFFICULTY_CONFIGS[focusLevel];
          
          // Calculate multiplier inline to avoid dependency issues
          const rawMultiplier = Math.pow(config.growthFactor, nextSeconds / config.growthIntervalSec);
          const multiplier = Math.min(rawMultiplier, config.maxMultiplier);
          
          // Calculate exact earnings with fractional cents
          const exactEarnings = config.baseRateCentsPerSec * multiplier;
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
  }, [sessionState, appState.preferences.focusLevel]);

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
    // Pause session when opening deposit modal to freeze counter
    if (sessionState === "running") {
      setSessionState("paused");
      audioService.pause();
    }
    setShowDepositModal(true);
  };
  
  const handleModalClose = (open: boolean) => {
    setShowDepositModal(open);
    // Resume session if user closes modal without depositing
    if (!open && sessionState === "paused" && sessionCents > 0) {
      setSessionState("running");
      audioService.resume();
    }
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
    <div className="relative h-screen overflow-hidden flex flex-col">
      <ThemeBackground theme={appState.preferences.theme} />
      
      {/* Main Content - Centered */}
      <div className="flex-1 flex flex-col items-center justify-center px-5">
        {/* Affirmation - Responsive text that shrinks to fit */}
        <div className="mb-8 max-w-2xl w-full px-4 min-h-[80px] flex items-center justify-center">
          <p 
            className="text-center text-theme-text-secondary font-inter font-medium leading-relaxed"
            style={{
              fontSize: "clamp(0.875rem, 2vw + 0.5rem, 1.25rem)",
              wordBreak: "break-word",
              hyphens: "auto",
            }}
            data-testid="affirmation-text"
          >
            {allQuotes[currentQuoteIndex] || "Add a quote to begin."}
          </p>
        </div>

        {/* Separator */}
        <div className="w-full max-w-2xl mb-8 flex items-center justify-center">
          <div className="flex-1 h-px bg-gradient-to-r from-transparent via-theme-separator/40 to-transparent" />
        </div>

        {/* Counter - Centered in fixed-width container */}
        <div className="relative mb-6 w-full max-w-2xl flex justify-center">
          {/* Radial glow effect */}
          <div
            className="absolute inset-0 blur-3xl opacity-30"
            style={{
              background: "radial-gradient(circle at center, hsl(var(--color-glow) / 0.6) 0%, transparent 70%)",
            }}
          />
          
          <AnimatedCounter
            value={sessionCents}
            className="text-6xl sm:text-7xl md:text-8xl lg:text-9xl relative z-10 text-center tabular-nums"
            isDepositing={isDepositing}
          />
        </div>

        {/* Focus Multiplier Progress Bar */}
        {sessionState === "running" && (
          <div className="mb-6 w-full max-w-2xl">
            <FocusMultiplierBar multiplier={currentMultiplier} />
          </div>
        )}
        

        {/* Manifest/Deposit Button */}
        <Button
          onClick={sessionState === "running" ? handleDeposit : handlePlayPause}
          className="micro-interact bg-theme-cta text-theme-cta-text hover:bg-theme-cta-hover h-[54px] px-8 rounded-[14px] font-medium tracking-cta"
          style={{
            boxShadow: "0 0 30px hsl(var(--color-glow) / 0.3)",
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
      <div className="flex-none border-t border-theme-separator/20 bg-black/50 backdrop-blur-sm">
        <div className="max-w-md mx-auto flex items-center justify-around py-4 px-5">
          {/* Bank Button */}
          <Button
            onClick={() => setLocation("/bank")}
            className="micro-interact bg-theme-nav-bg text-theme-nav-text border border-theme-separator/20 hover-elevate h-[50px] px-6 rounded-xl"
            data-testid="button-bank"
          >
            <TrendingUp className="w-5 h-5" />
            <span className="ml-2">History</span>
          </Button>

          {/* Settings Button */}
          <Button
            onClick={() => setLocation("/settings")}
            className="micro-interact bg-theme-nav-bg text-theme-nav-text border border-theme-separator/20 hover-elevate h-[50px] px-6 rounded-xl"
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
        onOpenChange={handleModalClose}
        amount={sessionCents}
        onConfirm={confirmDeposit}
      />
    </div>
  );
}
