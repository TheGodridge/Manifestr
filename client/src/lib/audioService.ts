import { MusicPack } from "@shared/schema";

class AudioService {
  private audioContext: AudioContext | null = null;
  private oscillator: OscillatorNode | null = null;
  private gainNode: GainNode | null = null;
  private bufferSource: AudioBufferSourceNode | null = null;
  private lfo: OscillatorNode | null = null;
  private isPlaying: boolean = false;
  private currentPack: MusicPack = "Theta Waves";
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

    // Generate appropriate meditation audio based on music pack
    if (musicPack === "Theta Waves") {
      // Binaural beats for deep meditation (theta waves 4-8 Hz)
      this.createBinauralBeats();
    } else if (musicPack === "Ocean Meditation") {
      // Enhanced ocean waves with natural rhythm
      this.createOceanWaves();
    } else {
      // Forest Ambience - layered nature sounds
      this.createForestAmbience();
    }

    this.isPlaying = true;
  }

  private createBinauralBeats() {
    if (!this.audioContext || !this.gainNode) return;

    // Binaural beats: Left ear 200Hz, Right ear 206Hz = 6Hz difference (theta waves)
    // Theta waves (4-8 Hz) promote deep meditation and relaxation
    const baseFreq = 200;
    const beatFreq = 6; // Theta wave frequency

    // Create stereo oscillators
    const leftOsc = this.audioContext.createOscillator();
    const rightOsc = this.audioContext.createOscillator();
    
    leftOsc.type = "sine";
    rightOsc.type = "sine";
    leftOsc.frequency.value = baseFreq;
    rightOsc.frequency.value = baseFreq + beatFreq;

    // Create stereo panner
    const merger = this.audioContext.createChannelMerger(2);
    const leftGain = this.audioContext.createGain();
    const rightGain = this.audioContext.createGain();
    
    leftGain.gain.value = 0.5;
    rightGain.gain.value = 0.5;

    leftOsc.connect(leftGain);
    rightOsc.connect(rightGain);
    leftGain.connect(merger, 0, 0);
    rightGain.connect(merger, 0, 1);
    merger.connect(this.gainNode);

    leftOsc.start();
    rightOsc.start();

    this.oscillator = leftOsc;
    this.lfo = rightOsc; // Reuse lfo to store right oscillator
  }

  private createOceanWaves() {
    if (!this.audioContext || !this.gainNode) return;

    // Create pink noise for wave texture
    const bufferSize = 4 * this.audioContext.sampleRate;
    const buffer = this.audioContext.createBuffer(1, bufferSize, this.audioContext.sampleRate);
    const data = buffer.getChannelData(0);

    // Generate pink noise
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
      data[i] *= 0.15; // Adjust volume
      b6 = white * 0.115926;
    }

    this.bufferSource = this.audioContext.createBufferSource();
    this.bufferSource.buffer = buffer;
    this.bufferSource.loop = true;

    // Add wave-like modulation (0.2 Hz = slow rolling waves)
    const waveLFO = this.audioContext.createOscillator();
    const lfoGain = this.audioContext.createGain();
    waveLFO.frequency.value = 0.2;
    lfoGain.gain.value = 0.3;
    
    const modGain = this.audioContext.createGain();
    waveLFO.connect(lfoGain);
    lfoGain.connect(modGain.gain);
    
    this.bufferSource.connect(modGain);
    modGain.connect(this.gainNode);
    
    this.bufferSource.start();
    waveLFO.start();
    
    this.lfo = waveLFO;
  }

  private createForestAmbience() {
    if (!this.audioContext || !this.gainNode) return;

    // Base ambient drone (wind through trees)
    const drone = this.audioContext.createOscillator();
    drone.type = "sawtooth";
    drone.frequency.value = 110; // Low A
    
    const droneFilter = this.audioContext.createBiquadFilter();
    droneFilter.type = "lowpass";
    droneFilter.frequency.value = 300;
    droneFilter.Q.value = 0.5;
    
    const droneGain = this.audioContext.createGain();
    droneGain.gain.value = 0.15;
    
    drone.connect(droneFilter);
    droneFilter.connect(droneGain);
    droneGain.connect(this.gainNode);
    drone.start();

    // Wind modulation
    const windLFO = this.audioContext.createOscillator();
    const windLFOGain = this.audioContext.createGain();
    windLFO.frequency.value = 0.3;
    windLFOGain.gain.value = 20;
    windLFO.connect(windLFOGain);
    windLFOGain.connect(droneFilter.frequency);
    windLFO.start();

    // Soft white noise for rustling leaves
    const noiseSize = 2 * this.audioContext.sampleRate;
    const noiseBuffer = this.audioContext.createBuffer(1, noiseSize, this.audioContext.sampleRate);
    const noiseData = noiseBuffer.getChannelData(0);
    
    for (let i = 0; i < noiseSize; i++) {
      noiseData[i] = (Math.random() * 2 - 1) * 0.1;
    }

    const noiseSource = this.audioContext.createBufferSource();
    noiseSource.buffer = noiseBuffer;
    noiseSource.loop = true;
    
    const noiseFilter = this.audioContext.createBiquadFilter();
    noiseFilter.type = "highpass";
    noiseFilter.frequency.value = 2000;
    
    const noiseGain = this.audioContext.createGain();
    noiseGain.gain.value = 0.08;
    
    noiseSource.connect(noiseFilter);
    noiseFilter.connect(noiseGain);
    noiseGain.connect(this.gainNode);
    noiseSource.start();

    this.oscillator = drone;
    this.lfo = windLFO;
    this.bufferSource = noiseSource;
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
    if (newPack === "Theta Waves") {
      this.createBinauralBeats();
    } else if (newPack === "Ocean Meditation") {
      this.createOceanWaves();
    } else {
      // Forest Ambience
      this.createForestAmbience();
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
