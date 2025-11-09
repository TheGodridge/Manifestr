import { Switch, Route } from "wouter";
import { useLayoutEffect } from "react";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeBackground } from "@/components/ThemeBackground";
import { ParticleField } from "@/components/ParticleField";
import { useAppState } from "@/hooks/useLocalStorage";
import { Settings } from "lucide-react";
import { useLocation } from "wouter";
import Manifest from "@/pages/Manifest";
import Bank from "@/pages/Bank";
import SettingsPage from "@/pages/Settings";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Manifest} />
      <Route path="/bank" component={Bank} />
      <Route path="/settings" component={SettingsPage} />
      <Route component={Manifest} />
    </Switch>
  );
}

function App() {
  const [appState] = useAppState();
  const [, setLocation] = useLocation();

  // Sync data-theme attribute with user's theme preference BEFORE paint
  useLayoutEffect(() => {
    document.documentElement.dataset.theme = appState.preferences.theme;
  }, [appState.preferences.theme]);

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <ThemeBackground theme={appState.preferences.theme} />
        <ParticleField theme={appState.preferences.theme} />
        
        {/* Settings Icon */}
        <button
          onClick={() => setLocation("/settings")}
          className="fixed top-5 right-5 z-50 p-2 hover-elevate active-elevate-2 rounded-md transition-transform"
          data-testid="button-settings"
        >
          <Settings className="w-6 h-6 text-theme-text-secondary hover:text-theme-cta transition-colors" />
        </button>

        <div className="relative z-10">
          <Router />
        </div>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
