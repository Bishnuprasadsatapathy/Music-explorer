import { FREQUENCY_NUMBERS } from '../data/mockAudio';
import { RealtimeAudioMetrics } from '../types';

class WebAudioEngine {
  private ctx: AudioContext | null = null;
  private analyser: AnalyserNode | null = null;
  private masterGain: GainNode | null = null;
  private eqFilters: BiquadFilterNode[] = [];
  
  // Quick tone filters
  private bassFilter: BiquadFilterNode | null = null;
  private midFilter: BiquadFilterNode | null = null;
  private trebleFilter: BiquadFilterNode | null = null;

  // Active playback state
  private isPlaying: boolean = false;
  private synthTimer: number | null = null;
  private synthStep: number = 0;
  private currentStyle: string = 'synthwave';
  private customAudioElement: HTMLAudioElement | null = null;
  private mediaSourceNode: MediaElementAudioSourceNode | null = null;

  // Room Measurement Mic
  private micStream: MediaStream | null = null;
  private micAnalyser: AnalyserNode | null = null;

  constructor() {
    // Lazy init on first user interaction
  }

  public init() {
    if (this.ctx) return;
    const AudioCtxClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    this.ctx = new AudioCtxClass();

    // Master Analyser
    this.analyser = this.ctx.createAnalyser();
    this.analyser.fftSize = 512;
    this.analyser.smoothingTimeConstant = 0.8;

    // Master Gain
    this.masterGain = this.ctx.createGain();
    this.masterGain.gain.value = 0.7; // default 70%

    // Create 10 EQ BiquadFilterNodes
    this.eqFilters = FREQUENCY_NUMBERS.map((freq) => {
      const filter = this.ctx!.createBiquadFilter();
      filter.type = 'peaking';
      filter.frequency.value = freq;
      filter.Q.value = 1.4; // Q factor
      filter.gain.value = 0;
      return filter;
    });

    // Create Bass, Mid, Treble filters
    this.bassFilter = this.ctx.createBiquadFilter();
    this.bassFilter.type = 'lowshelf';
    this.bassFilter.frequency.value = 150;
    this.bassFilter.gain.value = 0;

    this.midFilter = this.ctx.createBiquadFilter();
    this.midFilter.type = 'peaking';
    this.midFilter.frequency.value = 1000;
    this.midFilter.Q.value = 1.0;
    this.midFilter.gain.value = 0;

    this.trebleFilter = this.ctx.createBiquadFilter();
    this.trebleFilter.type = 'highshelf';
    this.trebleFilter.frequency.value = 4000;
    this.trebleFilter.gain.value = 0;

    // Chain nodes:
    // Audio Source -> eqFilter[0] -> ... -> eqFilter[9] -> bassFilter -> midFilter -> trebleFilter -> masterGain -> analyser -> destination
    let currentChainNode: AudioNode = this.eqFilters[0];
    for (let i = 1; i < this.eqFilters.length; i++) {
      currentChainNode.connect(this.eqFilters[i]);
      currentChainNode = this.eqFilters[i];
    }

    currentChainNode.connect(this.bassFilter);
    this.bassFilter.connect(this.midFilter);
    this.midFilter.connect(this.trebleFilter);
    this.trebleFilter.connect(this.masterGain);
    this.masterGain.connect(this.analyser);
    this.analyser.connect(this.ctx.destination);
  }

  public getInputEntryPoint(): AudioNode {
    this.init();
    return this.eqFilters[0];
  }

  public setVolume(vol0to100: number) {
    if (!this.masterGain) this.init();
    const targetGain = Math.max(0, Math.min(1, vol0to100 / 100));
    if (this.masterGain && this.ctx) {
      this.masterGain.gain.setTargetAtTime(targetGain, this.ctx.currentTime, 0.05);
    }
  }

  public setQuickTone(bass: number, mid: number, treble: number) {
    if (!this.ctx) this.init();
    if (this.ctx) {
      const now = this.ctx.currentTime;
      if (this.bassFilter) this.bassFilter.gain.setTargetAtTime(bass * 2, now, 0.05);
      if (this.midFilter) this.midFilter.gain.setTargetAtTime(mid * 2, now, 0.05);
      if (this.trebleFilter) this.trebleFilter.gain.setTargetAtTime(treble * 2, now, 0.05);
    }
  }

  public set10BandEQ(gains: number[]) {
    if (!this.ctx) this.init();
    if (this.ctx) {
      const now = this.ctx.currentTime;
      gains.forEach((gainVal, idx) => {
        if (this.eqFilters[idx]) {
          // Clamp gain to -12dB to +12dB
          const clampedGain = Math.max(-12, Math.min(12, gainVal));
          this.eqFilters[idx].gain.setTargetAtTime(clampedGain, now, 0.05);
        }
      });
    }
  }

  // Play Web Audio synthesized music track
  public startSynthPlayback(style: string = 'synthwave') {
    this.init();
    if (this.ctx?.state === 'suspended') {
      this.ctx.resume();
    }
    this.currentStyle = style;
    this.isPlaying = true;

    if (this.synthTimer) {
      window.clearInterval(this.synthTimer);
    }

    const bpm = style === 'lofi' ? 80 : style === 'synthwave' ? 120 : style === 'bass' ? 140 : 100;
    const intervalMs = (60 / bpm / 4) * 1000; // 16th notes

    this.synthStep = 0;
    this.synthTimer = window.setInterval(() => {
      this.playSynthStep();
    }, intervalMs);
  }

  public stopPlayback() {
    this.isPlaying = false;
    if (this.synthTimer) {
      window.clearInterval(this.synthTimer);
      this.synthTimer = null;
    }
    if (this.customAudioElement) {
      this.customAudioElement.pause();
    }
  }

  public togglePlayback(style: string = 'synthwave'): boolean {
    if (this.isPlaying) {
      this.stopPlayback();
      return false;
    } else {
      this.startSynthPlayback(style);
      return true;
    }
  }

  public isAudioPlaying(): boolean {
    return this.isPlaying;
  }

  private playSynthStep() {
    if (!this.ctx || !this.isPlaying) return;

    const entry = this.getInputEntryPoint();
    const t = this.ctx.currentTime;
    const step = this.synthStep % 16;

    // Kick Drum (on steps 0, 8, 10 for synthwave/bass, 0, 10 for lofi)
    if (step === 0 || step === 8 || (step === 10 && this.currentStyle !== 'lofi') || (step === 14 && this.currentStyle === 'bass')) {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.frequency.setValueAtTime(this.currentStyle === 'bass' ? 130 : 110, t);
      osc.frequency.exponentialRampToValueAtTime(0.01, t + 0.25);
      gain.gain.setValueAtTime(0.8, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.25);
      osc.connect(gain);
      gain.connect(entry);
      osc.start(t);
      osc.stop(t + 0.25);
    }

    // Snare Drum / Backbeat (on steps 4, 12)
    if (step === 4 || step === 12) {
      const noise = this.createNoiseBufferNode();
      const noiseFilter = this.ctx.createBiquadFilter();
      noiseFilter.type = 'highpass';
      noiseFilter.frequency.value = 1000;

      const gain = this.ctx.createGain();
      gain.gain.setValueAtTime(0.4, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.18);

      noise.connect(noiseFilter);
      noiseFilter.connect(gain);
      gain.connect(entry);
      noise.start(t);
      noise.stop(t + 0.18);
    }

    // Hi-Hat / Cymbal (even 16th notes)
    if (step % 2 === 0) {
      const noise = this.createNoiseBufferNode();
      const noiseFilter = this.ctx.createBiquadFilter();
      noiseFilter.type = 'highpass';
      noiseFilter.frequency.value = 6000;

      const gain = this.ctx.createGain();
      const hatVol = step % 4 === 2 ? 0.25 : 0.12;
      gain.gain.setValueAtTime(hatVol, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.05);

      noise.connect(noiseFilter);
      noiseFilter.connect(gain);
      gain.connect(entry);
      noise.start(t);
      noise.stop(t + 0.05);
    }

    // Bass Synth Melodic Notes
    const synthNotes = this.currentStyle === 'lofi'
      ? [130.81, 146.83, 164.81, 196.00] // C3, D3, E3, G3
      : this.currentStyle === 'vocal'
      ? [220.00, 261.63, 293.66, 329.63] // A3, C4, D4, E4
      : [65.41, 73.42, 82.41, 98.00];   // C2, D2, E2, G2

    if (step % 4 === 0 || step === 6 || step === 14) {
      const noteFreq = synthNotes[(step + Math.floor(this.synthStep / 16)) % synthNotes.length];
      const osc = this.ctx.createOscillator();
      const filter = this.ctx.createBiquadFilter();
      const gain = this.ctx.createGain();

      osc.type = this.currentStyle === 'synthwave' ? 'sawtooth' : this.currentStyle === 'bass' ? 'square' : 'triangle';
      osc.frequency.setValueAtTime(noteFreq, t);

      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(this.currentStyle === 'bass' ? 600 : 1800, t);
      filter.frequency.exponentialRampToValueAtTime(300, t + 0.3);

      gain.gain.setValueAtTime(0.35, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.35);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(entry);
      osc.start(t);
      osc.stop(t + 0.35);
    }

    this.synthStep++;
  }

  private createNoiseBufferNode(): AudioBufferSourceNode {
    if (!this.ctx) this.init();
    const bufferSize = this.ctx!.sampleRate * 0.5;
    const buffer = this.ctx!.createBuffer(1, bufferSize, this.ctx!.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }
    const noise = this.ctx!.createBufferSource();
    noise.buffer = buffer;
    return noise;
  }

  // Play room acoustic measurement burst (pink noise sweep)
  public async playAcousticTestSweep(onProgress?: (progress0to100: number) => void): Promise<Float32Array> {
    this.init();
    if (this.ctx?.state === 'suspended') {
      await this.ctx.resume();
    }

    return new Promise((resolve) => {
      const entry = this.getInputEntryPoint();
      const durationSec = 2.0;
      const t = this.ctx!.currentTime;

      // Create pink noise burst
      const noiseNode = this.createNoiseBufferNode();
      const sweepFilter = this.ctx!.createBiquadFilter();
      sweepFilter.type = 'bandpass';
      sweepFilter.frequency.setValueAtTime(50, t);
      sweepFilter.frequency.exponentialRampToValueAtTime(18000, t + durationSec);
      sweepFilter.Q.value = 1.0;

      const gain = this.ctx!.createGain();
      gain.gain.setValueAtTime(0.5, t);
      gain.gain.setValueAtTime(0.5, t + durationSec - 0.1);
      gain.gain.exponentialRampToValueAtTime(0.001, t + durationSec);

      noiseNode.connect(sweepFilter);
      sweepFilter.connect(gain);
      gain.connect(entry);

      noiseNode.start(t);
      noiseNode.stop(t + durationSec);

      // Track progress
      let elapsed = 0;
      const interval = setInterval(() => {
        elapsed += 100;
        const progress = Math.min(100, Math.round((elapsed / (durationSec * 1000)) * 100));
        if (onProgress) onProgress(progress);
        if (elapsed >= durationSec * 1000) {
          clearInterval(interval);
          // Return sample spectrum
          const freqData = new Float32Array(this.analyser?.frequencyBinCount || 128);
          if (this.analyser) {
            this.analyser.getFloatFrequencyData(freqData);
          }
          resolve(freqData);
        }
      }, 100);
    });
  }

  // Request Microphone for Room Acoustic Measurement
  public async startMicrophoneRecording(): Promise<boolean> {
    try {
      this.init();
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      this.micStream = stream;
      const micSource = this.ctx!.createMediaStreamSource(stream);
      this.micAnalyser = this.ctx!.createAnalyser();
      this.micAnalyser.fftSize = 512;
      micSource.connect(this.micAnalyser);
      return true;
    } catch (err) {
      console.warn('Microphone permission denied or unavailable:', err);
      return false;
    }
  }

  public stopMicrophoneRecording() {
    if (this.micStream) {
      this.micStream.getTracks().forEach((track) => track.stop());
      this.micStream = null;
      this.micAnalyser = null;
    }
  }

  // Get real-time audio visualization data
  public getFrequencyData(): Uint8Array {
    if (!this.analyser) return new Uint8Array(128);
    const data = new Uint8Array(this.analyser.frequencyBinCount);
    this.analyser.getByteFrequencyData(data);
    return data;
  }

  public getWaveformData(): Uint8Array {
    if (!this.analyser) return new Uint8Array(128);
    const data = new Uint8Array(this.analyser.fftSize);
    this.analyser.getByteTimeDomainData(data);
    return data;
  }

  // Get Real-time Audio Data Science Metrics
  public calculateAudioMetrics(): RealtimeAudioMetrics {
    if (!this.analyser || !this.ctx) {
      return {
        rmsVolume: 0,
        peakDb: -60,
        spectralCentroidHz: 1000,
        zeroCrossingRate: 0.1,
        dominantFrequencyHz: 440,
      };
    }

    const freqData = new Uint8Array(this.analyser.frequencyBinCount);
    const timeData = new Uint8Array(this.analyser.fftSize);
    this.analyser.getByteFrequencyData(freqData);
    this.analyser.getByteTimeDomainData(timeData);

    // RMS Volume
    let sumSquares = 0;
    let zeroCrossings = 0;
    for (let i = 0; i < timeData.length; i++) {
      const normalized = (timeData[i] - 128) / 128;
      sumSquares += normalized * normalized;
      if (i > 0) {
        const prevNorm = (timeData[i - 1] - 128) / 128;
        if ((normalized >= 0 && prevNorm < 0) || (normalized < 0 && prevNorm >= 0)) {
          zeroCrossings++;
        }
      }
    }
    const rmsVolume = Math.sqrt(sumSquares / timeData.length);
    const peakDb = rmsVolume > 0.0001 ? Math.max(-60, 20 * Math.log10(rmsVolume)) : -60;

    // Spectral Centroid = sum(f * mag) / sum(mag)
    let weightedSum = 0;
    let totalMagnitude = 0;
    let maxBinIdx = 0;
    let maxBinMag = 0;
    const nyquist = this.ctx.sampleRate / 2;
    const binWidth = nyquist / freqData.length;

    for (let i = 0; i < freqData.length; i++) {
      const mag = freqData[i];
      const freqHz = i * binWidth;
      weightedSum += freqHz * mag;
      totalMagnitude += mag;

      if (mag > maxBinMag) {
        maxBinMag = mag;
        maxBinIdx = i;
      }
    }

    const spectralCentroidHz = totalMagnitude > 0 ? Math.round(weightedSum / totalMagnitude) : 1000;
    const dominantFrequencyHz = Math.round(maxBinIdx * binWidth);
    const zeroCrossingRate = Number((zeroCrossings / timeData.length).toFixed(3));

    return {
      rmsVolume: Number(rmsVolume.toFixed(3)),
      peakDb: Math.round(peakDb),
      spectralCentroidHz,
      zeroCrossingRate,
      dominantFrequencyHz,
    };
  }
}

export const audioEngine = new WebAudioEngine();
