import { MusicPack } from "@shared/schema";

class AudioService {
  private audioContext: AudioContext | null = null;
  private oscillator: OscillatorNode | null = null;
  private gainNode: GainNode | null = null;
  private bufferSource: AudioBufferSourceNode | null = null;
  private lfo: OscillatorNode | null = null;
  private isPlaying: boolean = false;
  private currentPack: MusicPack = "LoFi";
  private volume: number = 50;

  initialize() {
    if (!this.audioContext) {
      this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
  }

  async play(musicPack: MusicPack, volume?: number) {
    this.initialize();
    if (!this.audioContext) return;

    if (volume !== undefined) {
      this.volume = volume;
    }

    // Ensure AudioContext is running (resume if suspended)
    if (this.audioContext.state === "suspended") {
      await this.audioContext.resume();
    }

    // If already playing a different pack, crossfade
    if (this.isPlaying && this.currentPack !== musicPack) {
      await this.crossfade(musicPack);
      return;
    }

    this.stop(); // Stop any existing playback
    this.currentPack = musicPack;

    // Create gain node for volume control
    this.gainNode = this.audioContext.createGain();
    this.gainNode.connect(this.audioContext.destination);
    // Convert 0-100 volume to 0-0.15 gain (max slightly higher for user control)
    this.gainNode.gain.value = (this.volume / 100) * 0.15;

    // Generate appropriate audio based on music pack
    if (musicPack === "528Hz") {
      // 528 Hz healing frequency
      this.oscillator = this.audioContext.createOscillator();
      this.oscillator.type = "sine";
      this.oscillator.frequency.setValueAtTime(528, this.audioContext.currentTime);
      this.oscillator.connect(this.gainNode);
      this.oscillator.start();
    } else if (musicPack === "Waves") {
      // Pink noise approximation for waves
      this.createPinkNoise();
    } else {
      // LoFi - simple ambient tone at 60 BPM feel
      this.oscillator = this.audioContext.createOscillator();
      this.oscillator.type = "sine";
      this.oscillator.frequency.setValueAtTime(220, this.audioContext.currentTime); // A3
      this.oscillator.connect(this.gainNode);
      this.oscillator.start();
      
      // Add subtle LFO for ambient feel
      this.lfo = this.audioContext.createOscillator();
      const lfoGain = this.audioContext.createGain();
      this.lfo.frequency.value = 1; // 1 Hz modulation
      lfoGain.gain.value = 5; // Small frequency deviation
      this.lfo.connect(lfoGain);
      lfoGain.connect(this.oscillator.frequency);
      this.lfo.start();
    }

    this.isPlaying = true;
  }

  private createPinkNoise() {
    if (!this.audioContext || !this.gainNode) return;

    // Create buffer for pink noise
    const bufferSize = 2 * this.audioContext.sampleRate;
    const buffer = this.audioContext.createBuffer(1, bufferSize, this.audioContext.sampleRate);
    const data = buffer.getChannelData(0);

    // Generate pink noise using Paul Kellet's algorithm
    let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;
    for (let i = 0; i < bufferSize; i++) {
      const white = Math.random() * 2 - 1;
      b0 = 0.99886 * b0 + white * 0.0555179;
      b1 = 0.99332 * b1 + white * 0.0750759;
      b2 = 0.96900 * b2 + white * 0.1538520;
      b3 = 0.86650 * b3 + white * 0.3104856;
      b4 = 0.55000 * b4 + white * 0.5329522;
      b5 = -0.7616 * b5 - white * 0.0168980;
      data[i] = b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362;
      data[i] *= 0.11; // Reduce volume
      b6 = white * 0.115926;
    }

    this.bufferSource = this.audioContext.createBufferSource();
    this.bufferSource.buffer = buffer;
    this.bufferSource.loop = true;
    this.bufferSource.connect(this.gainNode);
    this.bufferSource.start();
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
    if (this.oscillator) {
      try {
        this.oscillator.stop();
        this.oscillator.disconnect();
      } catch (e) {
        // Oscillator may already be stopped
      }
      this.oscillator = null;
    }
    if (this.lfo) {
      try {
        this.lfo.stop();
        this.lfo.disconnect();
      } catch (e) {
        // LFO may already be stopped
      }
      this.lfo = null;
    }
    if (this.bufferSource) {
      try {
        this.bufferSource.stop();
        this.bufferSource.disconnect();
      } catch (e) {
        // Buffer source may already be stopped
      }
      this.bufferSource = null;
    }
    if (this.gainNode) {
      this.gainNode.disconnect();
      this.gainNode = null;
    }
    this.isPlaying = false;
  }

  setVolume(volume: number) {
    this.volume = Math.max(0, Math.min(100, volume));
    if (this.gainNode) {
      // Smooth transition to new volume
      const now = this.audioContext?.currentTime || 0;
      this.gainNode.gain.setValueAtTime(this.gainNode.gain.value, now);
      this.gainNode.gain.linearRampToValueAtTime((this.volume / 100) * 0.15, now + 0.1);
    }
  }

  private async crossfade(newPack: MusicPack) {
    if (!this.audioContext) return;

    const crossfadeDuration = 0.5; // 500ms
    const now = this.audioContext.currentTime;

    // Store old nodes for cleanup
    const oldGain = this.gainNode;
    const oldOscillator = this.oscillator;
    const oldBuffer = this.bufferSource;
    const oldLfo = this.lfo;

    // Fade out old audio
    if (oldGain) {
      oldGain.gain.setValueAtTime(oldGain.gain.value, now);
      oldGain.gain.linearRampToValueAtTime(0, now + crossfadeDuration);
    }

    // Create new gain node and start new audio at 0 volume
    this.gainNode = this.audioContext.createGain();
    this.gainNode.connect(this.audioContext.destination);
    this.gainNode.gain.setValueAtTime(0, now);
    this.gainNode.gain.linearRampToValueAtTime((this.volume / 100) * 0.15, now + crossfadeDuration);

    // Reset node references for new playback
    this.oscillator = null;
    this.bufferSource = null;
    this.lfo = null;
    this.currentPack = newPack;

    // Start new audio source
    if (newPack === "528Hz") {
      this.oscillator = this.audioContext.createOscillator();
      this.oscillator.type = "sine";
      this.oscillator.frequency.setValueAtTime(528, this.audioContext.currentTime);
      this.oscillator.connect(this.gainNode);
      this.oscillator.start();
    } else if (newPack === "Waves") {
      this.createPinkNoise();
    } else {
      // LoFi
      this.oscillator = this.audioContext.createOscillator();
      this.oscillator.type = "sine";
      this.oscillator.frequency.setValueAtTime(220, this.audioContext.currentTime);
      this.oscillator.connect(this.gainNode);
      this.oscillator.start();
      
      this.lfo = this.audioContext.createOscillator();
      const lfoGain = this.audioContext.createGain();
      this.lfo.frequency.value = 1;
      lfoGain.gain.value = 5;
      this.lfo.connect(lfoGain);
      lfoGain.connect(this.oscillator.frequency);
      this.lfo.start();
    }

    // Clean up old nodes after crossfade completes
    setTimeout(() => {
      if (oldOscillator) {
        try {
          oldOscillator.stop();
          oldOscillator.disconnect();
        } catch (e) {}
      }
      if (oldLfo) {
        try {
          oldLfo.stop();
          oldLfo.disconnect();
        } catch (e) {}
      }
      if (oldBuffer) {
        try {
          oldBuffer.stop();
          oldBuffer.disconnect();
        } catch (e) {}
      }
      if (oldGain) {
        oldGain.disconnect();
      }
    }, crossfadeDuration * 1000 + 100);
  }

  getIsPlaying(): boolean {
    return this.isPlaying;
  }

  getCurrentPack(): MusicPack {
    return this.currentPack;
  }
}

export const audioService = new AudioService();
