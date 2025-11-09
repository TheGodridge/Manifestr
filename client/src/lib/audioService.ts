import { MusicPack } from "@shared/schema";

class AudioService {
  private audioContext: AudioContext | null = null;
  private oscillator: OscillatorNode | null = null;
  private gainNode: GainNode | null = null;
  private isPlaying: boolean = false;
  private currentPack: MusicPack = "LoFi";

  initialize() {
    if (!this.audioContext) {
      this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
  }

  async play(musicPack: MusicPack) {
    this.initialize();
    if (!this.audioContext) return;

    // Ensure AudioContext is running (resume if suspended)
    if (this.audioContext.state === "suspended") {
      await this.audioContext.resume();
    }

    this.stop(); // Stop any existing playback
    this.currentPack = musicPack;

    // Create gain node for volume control
    this.gainNode = this.audioContext.createGain();
    this.gainNode.connect(this.audioContext.destination);
    this.gainNode.gain.value = 0.05; // Very low volume as per spec

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
      const lfo = this.audioContext.createOscillator();
      const lfoGain = this.audioContext.createGain();
      lfo.frequency.value = 1; // 1 Hz modulation
      lfoGain.gain.value = 5; // Small frequency deviation
      lfo.connect(lfoGain);
      lfoGain.connect(this.oscillator.frequency);
      lfo.start();
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

    const source = this.audioContext.createBufferSource();
    source.buffer = buffer;
    source.loop = true;
    source.connect(this.gainNode);
    source.start();
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
    if (this.gainNode) {
      this.gainNode.disconnect();
      this.gainNode = null;
    }
    this.isPlaying = false;
  }

  getIsPlaying(): boolean {
    return this.isPlaying;
  }

  getCurrentPack(): MusicPack {
    return this.currentPack;
  }
}

export const audioService = new AudioService();
