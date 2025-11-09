import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useAppState } from "@/hooks/useLocalStorage";
import { DEFAULT_APP_STATE, Theme, MusicPack } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";
import { ChevronLeft } from "lucide-react";
import { audioService } from "@/lib/audioService";

export default function Settings() {
  const [, setLocation] = useLocation();
  const [appState, setAppState] = useAppState();
  const { toast } = useToast();

  const handleThemeChange = (theme: Theme) => {
    setAppState({
      ...appState,
      preferences: {
        ...appState.preferences,
        theme,
      },
    });
  };

  const handleMusicChange = (music: MusicPack) => {
    const wasPlaying = audioService.getIsPlaying();
    
    setAppState({
      ...appState,
      preferences: {
        ...appState.preferences,
        music,
      },
    });
    
    // If audio is playing, switch to new pack (will trigger crossfade)
    if (wasPlaying) {
      audioService.play(music, appState.preferences.volume);
    }
  };

  const handleVolumeChange = (value: number[]) => {
    const volume = value[0];
    setAppState({
      ...appState,
      preferences: {
        ...appState.preferences,
        volume,
      },
    });
    audioService.setVolume(volume);
  };

  const handleQuoteSpeedChange = (speed: string) => {
    setAppState({
      ...appState,
      preferences: {
        ...appState.preferences,
        quoteIntervalSec: parseInt(speed),
      },
    });
  };

  const handleAutoDepositToggle = (checked: boolean) => {
    setAppState({
      ...appState,
      preferences: {
        ...appState.preferences,
        autoDepositOnExit: checked,
      },
    });
  };

  const handleResetBank = () => {
    setAppState(DEFAULT_APP_STATE);
    toast({
      title: "Bank reset complete",
      description: "All your data has been cleared. Time to start fresh.",
    });
  };

  return (
    <div className="min-h-screen px-5 py-8">
      <div className="max-w-2xl mx-auto">
        <Button
          variant="ghost"
          onClick={() => setLocation("/")}
          className="mb-6 text-mist-lavender hover:text-gold-primary -ml-2"
          data-testid="button-back"
        >
          <ChevronLeft className="w-5 h-5 mr-1" />
          Back to Manifest
        </Button>

        <h1 className="text-3xl font-poppins font-bold text-gold-primary mb-8">
          Settings
        </h1>

        <div className="space-y-6">
          {/* Themes */}
          <Card className="bg-aurora-purple/20 border-pulse-purple/30 rounded-xl p-6">
            <h2 className="text-xl font-poppins font-semibold text-gold-primary mb-4">
              Themes
            </h2>
            <div className="space-y-3">
              <Label htmlFor="theme-select" className="text-mist-lavender">
                Visual Theme
              </Label>
              <Select
                value={appState.preferences.theme}
                onValueChange={(value) => handleThemeChange(value as Theme)}
              >
                <SelectTrigger
                  id="theme-select"
                  className="bg-night-sky border-pulse-purple/30 text-gold-soft"
                  data-testid="select-theme"
                >
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-night-sky border-pulse-purple/30">
                  <SelectItem value="Galaxy" className="text-gold-soft">Galaxy</SelectItem>
                  <SelectItem value="Ocean" className="text-gold-soft">Ocean</SelectItem>
                  <SelectItem value="Neon Glow" className="text-gold-soft">Neon Glow</SelectItem>
                  <SelectItem value="Minimal" className="text-gold-soft">Minimal</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-mist-lavender/70 text-sm">
                Changes background gradient and particle effects
              </p>
            </div>
          </Card>

          {/* Music Packs */}
          <Card className="bg-aurora-purple/20 border-pulse-purple/30 rounded-xl p-6">
            <h2 className="text-xl font-poppins font-semibold text-gold-primary mb-4">
              Music Packs
            </h2>
            <div className="space-y-3">
              <Label htmlFor="music-select" className="text-mist-lavender">
                Audio Experience
              </Label>
              <Select
                value={appState.preferences.music}
                onValueChange={(value) => handleMusicChange(value as MusicPack)}
              >
                <SelectTrigger
                  id="music-select"
                  className="bg-night-sky border-pulse-purple/30 text-gold-soft"
                  data-testid="select-music"
                >
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-night-sky border-pulse-purple/30">
                  <SelectItem value="LoFi" className="text-gold-soft">Lo-Fi Focus</SelectItem>
                  <SelectItem value="528Hz" className="text-gold-soft">528 Hz Tone</SelectItem>
                  <SelectItem value="Waves" className="text-gold-soft">Rain + Waves</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-3 mt-6">
              <div className="flex justify-between items-center">
                <Label htmlFor="volume-slider" className="text-mist-lavender">
                  Volume
                </Label>
                <span className="text-gold-soft font-mono text-sm">
                  {appState.preferences.volume}%
                </span>
              </div>
              <Slider
                id="volume-slider"
                min={0}
                max={100}
                step={1}
                value={[appState.preferences.volume]}
                onValueChange={handleVolumeChange}
                className="cursor-pointer"
                data-testid="slider-volume"
              />
              <p className="text-mist-lavender/70 text-sm">
                Adjust ambient audio level
              </p>
            </div>
          </Card>

          {/* Session Options */}
          <Card className="bg-aurora-purple/20 border-pulse-purple/30 rounded-xl p-6">
            <h2 className="text-xl font-poppins font-semibold text-gold-primary mb-4">
              Session Options
            </h2>
            <div className="space-y-6">
              <div className="space-y-3">
                <Label className="text-mist-lavender">
                  Earn Rate
                </Label>
                <p className="text-gold-soft font-mono text-lg">
                  $0.05 / second
                </p>
                <p className="text-mist-lavender/70 text-sm">
                  Fixed rate for v1
                </p>
              </div>

              <div className="space-y-3">
                <Label htmlFor="quote-speed" className="text-mist-lavender">
                  Quote Speed
                </Label>
                <Select
                  value={appState.preferences.quoteIntervalSec.toString()}
                  onValueChange={handleQuoteSpeedChange}
                >
                  <SelectTrigger
                    id="quote-speed"
                    className="bg-night-sky border-pulse-purple/30 text-gold-soft"
                    data-testid="select-quote-speed"
                  >
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-night-sky border-pulse-purple/30">
                    <SelectItem value="10" className="text-gold-soft">10 seconds</SelectItem>
                    <SelectItem value="15" className="text-gold-soft">15 seconds</SelectItem>
                    <SelectItem value="30" className="text-gold-soft">30 seconds</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <Label htmlFor="auto-deposit" className="text-mist-lavender">
                    Auto-Deposit on Exit
                  </Label>
                  <p className="text-mist-lavender/70 text-sm">
                    Automatically save progress when leaving
                  </p>
                </div>
                <Switch
                  id="auto-deposit"
                  checked={appState.preferences.autoDepositOnExit}
                  onCheckedChange={handleAutoDepositToggle}
                  data-testid="switch-auto-deposit"
                />
              </div>
            </div>
          </Card>

          {/* Data Management */}
          <Card className="bg-aurora-purple/20 border-pulse-purple/30 rounded-xl p-6">
            <h2 className="text-xl font-poppins font-semibold text-gold-primary mb-4">
              Data
            </h2>
            <div className="space-y-4">
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button
                    variant="destructive"
                    className="w-full"
                    data-testid="button-reset-bank"
                  >
                    Reset Bank
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent className="bg-night-sky border-aurora-purple/30">
                  <AlertDialogHeader>
                    <AlertDialogTitle className="text-gold-primary">
                      Reset your bank?
                    </AlertDialogTitle>
                    <AlertDialogDescription className="text-mist-lavender">
                      This will permanently delete all your deposits and history. This action cannot be undone.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel className="bg-aurora-purple text-gold-primary border-pulse-purple/20">
                      Cancel
                    </AlertDialogCancel>
                    <AlertDialogAction
                      onClick={handleResetBank}
                      className="bg-destructive text-destructive-foreground"
                      data-testid="button-reset-confirm"
                    >
                      Reset Everything
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
