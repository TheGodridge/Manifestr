import { MusicPack } from "@shared/schema";

// Import MP3 files using @assets alias
import deepSpaceUrl from "@assets/Deep Space 10 Hertz_1762708798127.mp3";
import cosmosUrl from "@assets/Cosmos _1762708798127.mp3";
import forestSonnetUrl from "@assets/Sonnet of the Forest _1762708798127.mp3";
import prairieWhispersUrl from "@assets/Whispers of the Prairie _1762708798127.mp3";

// Track registry mapping MusicPack IDs to file paths
const TRACK_REGISTRY: Record<MusicPack, string> = {
  "Deep Space": deepSpaceUrl,
  "Cosmos": cosmosUrl,
  "Forest Sonnet": forestSonnetUrl,
  "Prairie Whispers": prairieWhispersUrl,
};

class AudioService {
  private audioContext: AudioContext | null = null;
  private currentSource: AudioBufferSourceNode | null = null;
  private nextSource: AudioBufferSourceNode | null = null;
  private currentGain: GainNode | null = null;
  private nextGain: GainNode | null = null;
  private masterGain: GainNode | null = null;
  
  // Audio buffer cache
  private bufferCache: Map<MusicPack, AudioBuffer> = new Map();
  private loadingPromises: Map<MusicPack, Promise<AudioBuffer>> = new Map();
  
  private isPlaying: boolean = false;
  private currentPack: MusicPack = "Deep Space";
  private volume: number = 50;

  initialize() {
    if (!this.audioContext) {
      this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      
      // Create master gain node
      this.masterGain = this.audioContext.createGain();
      this.masterGain.connect(this.audioContext.destination);
      this.masterGain.gain.value = (this.volume / 100);
    }
  }

  async preloadAll() {
    this.initialize();
    const packs: MusicPack[] = ["Deep Space", "Cosmos", "Forest Sonnet", "Prairie Whispers"];
    
    // Preload all tracks in parallel
    await Promise.allSettled(packs.map(pack => this.loadAudioBuffer(pack)));
  }

  private async loadAudioBuffer(pack: MusicPack): Promise<AudioBuffer> {
    // Return cached buffer if available
    if (this.bufferCache.has(pack)) {
      return this.bufferCache.get(pack)!;
    }

    // Return existing loading promise if in progress
    if (this.loadingPromises.has(pack)) {
      return this.loadingPromises.get(pack)!;
    }

    // Start new load
    const loadPromise = (async () => {
      try {
        const url = TRACK_REGISTRY[pack];
        const response = await fetch(url);
        const arrayBuffer = await response.arrayBuffer();
        
        if (!this.audioContext) {
          throw new Error("AudioContext not initialized");
        }

        const audioBuffer = await this.audioContext.decodeAudioData(arrayBuffer);
        this.bufferCache.set(pack, audioBuffer);
        return audioBuffer;
      } catch (error) {
        console.error(`Failed to load audio pack: ${pack}`, error);
        throw error;
      } finally {
        this.loadingPromises.delete(pack);
      }
    })();

    this.loadingPromises.set(pack, loadPromise);
    return loadPromise;
  }

  async play(musicPack: MusicPack, volume?: number) {
    this.initialize();
    if (!this.audioContext || !this.masterGain) return;

    if (volume !== undefined) {
      this.volume = volume;
      this.masterGain.gain.value = (this.volume / 100);
    }

    // Ensure AudioContext is running
    if (this.audioContext.state === "suspended") {
      await this.audioContext.resume();
    }

    // If already playing the same pack, just resume if needed
    if (this.isPlaying && this.currentPack === musicPack) {
      if (this.audioContext.state === "suspended") {
        await this.audioContext.resume();
      }
      return;
    }

    // If playing a different pack, crossfade
    if (this.isPlaying && this.currentPack !== musicPack) {
      await this.crossfade(musicPack);
      return;
    }

    // Start fresh playback
    this.currentPack = musicPack;
    
    try {
      const buffer = await this.loadAudioBuffer(musicPack);
      await this.startPlayback(buffer);
      this.isPlaying = true;
    } catch (error) {
      console.error("Failed to start playback:", error);
    }
  }

  private async startPlayback(buffer: AudioBuffer) {
    if (!this.audioContext || !this.masterGain) return;

    // Stop any existing playback
    this.stopCurrentSource();

    // Create new gain node for this track
    this.currentGain = this.audioContext.createGain();
    this.currentGain.connect(this.masterGain);
    this.currentGain.gain.value = 1.0;

    // Create buffer source
    this.currentSource = this.audioContext.createBufferSource();
    this.currentSource.buffer = buffer;
    this.currentSource.loop = true;
    this.currentSource.connect(this.currentGain);
    this.currentSource.start(0);
  }

  private async crossfade(newPack: MusicPack) {
    if (!this.audioContext || !this.masterGain) return;

    const crossfadeDuration = 0.75; // 750ms
    const now = this.audioContext.currentTime;

    try {
      // Load new buffer
      const newBuffer = await this.loadAudioBuffer(newPack);

      // Store old gain for fade out
      const oldGain = this.currentGain;
      const oldSource = this.currentSource;

      // Fade out old audio
      if (oldGain) {
        oldGain.gain.setValueAtTime(oldGain.gain.value, now);
        oldGain.gain.linearRampToValueAtTime(0, now + crossfadeDuration);
      }

      // Create new gain node starting at 0
      this.nextGain = this.audioContext.createGain();
      this.nextGain.connect(this.masterGain);
      this.nextGain.gain.setValueAtTime(0, now);
      this.nextGain.gain.linearRampToValueAtTime(1.0, now + crossfadeDuration);

      // Create new source
      this.nextSource = this.audioContext.createBufferSource();
      this.nextSource.buffer = newBuffer;
      this.nextSource.loop = true;
      this.nextSource.connect(this.nextGain);
      this.nextSource.start(0);

      // Update current references
      this.currentPack = newPack;

      // Clean up old nodes after crossfade
      setTimeout(() => {
        if (oldSource) {
          try {
            oldSource.stop();
            oldSource.disconnect();
          } catch (e) {
            // Already stopped
          }
        }
        if (oldGain) {
          oldGain.disconnect();
        }

        // Swap next to current
        this.currentSource = this.nextSource;
        this.currentGain = this.nextGain;
        this.nextSource = null;
        this.nextGain = null;
      }, crossfadeDuration * 1000 + 100);

    } catch (error) {
      console.error("Crossfade failed:", error);
    }
  }

  private stopCurrentSource() {
    if (this.currentSource) {
      try {
        this.currentSource.stop();
        this.currentSource.disconnect();
      } catch (e) {
        // Already stopped
      }
      this.currentSource = null;
    }
    if (this.currentGain) {
      this.currentGain.disconnect();
      this.currentGain = null;
    }
  }

  async pause() {
    if (this.audioContext && this.audioContext.state === "running") {
      await this.audioContext.suspend();
      this.isPlaying = false;
    }
  }

  async resume() {
    if (this.audioContext && this.audioContext.state === "suspended") {
      await this.audioContext.resume();
      this.isPlaying = true;
    }
  }

  stop() {
    this.stopCurrentSource();
    
    if (this.nextSource) {
      try {
        this.nextSource.stop();
        this.nextSource.disconnect();
      } catch (e) {
        // Already stopped
      }
      this.nextSource = null;
    }
    if (this.nextGain) {
      this.nextGain.disconnect();
      this.nextGain = null;
    }
    
    this.isPlaying = false;
  }

  setVolume(volume: number) {
    this.volume = Math.max(0, Math.min(100, volume));
    if (this.masterGain && this.audioContext) {
      // Smooth transition to new volume
      const now = this.audioContext.currentTime;
      this.masterGain.gain.setValueAtTime(this.masterGain.gain.value, now);
      this.masterGain.gain.linearRampToValueAtTime(this.volume / 100, now + 0.1);
    }
  }

  getIsPlaying(): boolean {
    return this.isPlaying;
  }

  getCurrentPack(): MusicPack {
    return this.currentPack;
  }
}

export const audioService = new AudioService();
