/**
 * SonicAI Platform - Shared Types & Interfaces
 */

export interface AudioTrack {
  id: string;
  title: string;
  artist: string;
  album: string;
  duration: number; // in seconds
  coverUrl: string;
  genre: string;
  bpm: number;
  audioUrl?: string;
  synthStyle?: 'lofi' | 'synthwave' | 'vocal' | 'bass' | 'classical' | 'ambient';
}

export type DeviceType = 'speaker' | 'headphones' | 'soundbar' | 'esp32_prototype';
export type ConnectionType = 'bluetooth' | 'wifi' | 'i2s_esp32';

export interface EQBand {
  freq: number; // Hz: 60, 120, 250, 500, 1000, 2000, 4000, 8000, 16000
  gain: number; // dB: -12 to +12
  label: string;
}

export interface EQPreset {
  id: string;
  name: string;
  iconName: string;
  description: string;
  bands: number[]; // 10 gain values corresponding to frequencies [60, 120, 250, 500, 1000, 2000, 4000, 8000, 16000, 20000]
  bass: number; // -6 to +6
  mid: number;  // -6 to +6
  treble: number; // -6 to +6
}

export interface AudioDevice {
  id: string;
  name: string;
  model: string;
  type: DeviceType;
  connectionType: ConnectionType;
  isConnected: boolean;
  batteryLevel: number; // 0 - 100
  volume: number; // 0 - 100
  bass: number; // -6 to +6
  mid: number; // -6 to +6
  treble: number; // -6 to +6
  signalStrength: number; // dBm (-30 to -90)
  ipAddress?: string;
  macAddress: string;
  firmwareVersion: string;
  activePresetId: string;
  eqBands: number[]; // 10 values
  driverSpecs: {
    tweeter: string;
    woofer: string;
    subwoofer?: string;
    maxWattage: number;
    freqResponse: string;
  };
}

export interface AutoEQRecommendation {
  detectedGenre: string;
  energyLevel: 'Low' | 'Medium' | 'High' | 'Dynamic';
  spectralBrightness: 'Dark' | 'Warm' | 'Balanced' | 'Bright';
  recommendedBands: number[]; // 10 values
  bass: number;
  mid: number;
  treble: number;
  recommendedMode: string;
  explanation: string;
  confidenceScore: number; // 0 - 100
}

export interface RoomAnalysisResult {
  roomType: string;
  estimatedSizeSqFt: number;
  bassResonance: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  midReflection: 'LOW' | 'MEDIUM' | 'HIGH';
  highFrequencyLoss: 'LOW' | 'MEDIUM' | 'HIGH';
  measuredFrequencyResponse: { freq: number; db: number }[];
  calculatedCorrections: number[]; // 10 values
  recommendedEQ: number[];
  acousticAdvice: string[];
}

export interface AIAssistantResponse {
  userPrompt: string;
  intentCategory: string;
  adjustedBands: number[];
  bass: number;
  mid: number;
  treble: number;
  explanation: string;
  audioEngineeringInsights: string[];
}

export interface ESP32Telemetry {
  cpuUsage: number; // %
  freeHeapKb: number;
  wifiRssi: number; // dBm
  dacSampleRate: number; // Hz (e.g. 96000)
  dacBitDepth: number; // 24 / 32
  ampTemperatureC: number;
  outputWattage: number;
  gpioStatus: {
    pinI2S_BCK: boolean;
    pinI2S_LRCK: boolean;
    pinI2S_DATA: boolean;
    pinAmpMute: boolean;
    pinStatusLED: boolean;
  };
  serialLogs: { timestamp: string; level: 'INFO' | 'WARN' | 'DSP'; message: string }[];
}

export interface RealtimeAudioMetrics {
  rmsVolume: number; // 0 - 1
  peakDb: number; // dB
  spectralCentroidHz: number;
  zeroCrossingRate: number;
  dominantFrequencyHz: number;
}
