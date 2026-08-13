import React, { useState, useEffect } from 'react';
import {
  Play,
  Pause,
  SkipForward,
  SkipBack,
  Volume2,
  Radio,
  Zap,
  Activity,
  Cpu,
  Wifi,
  BatteryCharging,
  Sliders,
  Sparkles,
  Music,
  ShieldCheck,
} from 'lucide-react';
import { AudioDevice, AudioTrack, EQPreset, RealtimeAudioMetrics } from '../types';
import { DEMO_TRACKS, DEMO_PRESETS } from '../data/mockAudio';
import { audioEngine } from '../services/audioEngine';
import { VisualizerCanvas } from './VisualizerCanvas';

interface DashboardViewProps {
  device: AudioDevice;
  onUpdateDevice: (updated: Partial<AudioDevice>) => void;
  activePreset: EQPreset;
  onSelectPreset: (preset: EQPreset) => void;
  onNavigateToTab: (tab: string) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  device,
  onUpdateDevice,
  activePreset,
  onSelectPreset,
  onNavigateToTab,
}) => {
  const [currentTrackIndex, setCurrentTrackIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(audioEngine.isAudioPlaying());
  const [trackProgress, setTrackProgress] = useState(25);
  const [metrics, setMetrics] = useState<RealtimeAudioMetrics>({
    rmsVolume: 0.42,
    peakDb: -14,
    spectralCentroidHz: 1850,
    zeroCrossingRate: 0.082,
    dominantFrequencyHz: 440,
  });

  const currentTrack: AudioTrack = DEMO_TRACKS[currentTrackIndex];

  // Update real-time metrics when playing
  useEffect(() => {
    const interval = setInterval(() => {
      if (isPlaying) {
        setMetrics(audioEngine.calculateAudioMetrics());
        setTrackProgress((prev) => (prev >= 100 ? 0 : prev + 0.5));
      }
    }, 200);

    return () => clearInterval(interval);
  }, [isPlaying]);

  const handleTogglePlay = () => {
    const playing = audioEngine.togglePlayback(currentTrack.synthStyle || 'synthwave');
    setIsPlaying(playing);
  };

  const handleNextTrack = () => {
    const nextIdx = (currentTrackIndex + 1) % DEMO_TRACKS.length;
    setCurrentTrackIndex(nextIdx);
    if (isPlaying) {
      audioEngine.startSynthPlayback(DEMO_TRACKS[nextIdx].synthStyle);
    }
  };

  const handlePrevTrack = () => {
    const prevIdx = (currentTrackIndex - 1 + DEMO_TRACKS.length) % DEMO_TRACKS.length;
    setCurrentTrackIndex(prevIdx);
    if (isPlaying) {
      audioEngine.startSynthPlayback(DEMO_TRACKS[prevIdx].synthStyle);
    }
  };

  const handleToneChange = (type: 'bass' | 'mid' | 'treble', value: number) => {
    const updated = { ...device, [type]: value };
    onUpdateDevice(updated);
    audioEngine.setQuickTone(updated.bass, updated.mid, updated.treble);
  };

  return (
    <div className="space-y-6">
      
      {/* Top Banner & Quick Controls */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-indigo-950 border border-slate-800 rounded-2xl p-6 relative overflow-hidden shadow-xl">
        <div className="absolute top-0 right-0 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
        
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6 relative z-10">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-mono font-semibold text-cyan-400 bg-cyan-500/10 px-2.5 py-0.5 rounded-full border border-cyan-500/20">
                ACTIVE HARDWARE STREAM
              </span>
              <span className="text-xs text-slate-400 font-mono">ID: {device.id}</span>
            </div>
            <h1 className="text-2xl lg:text-3xl font-extrabold text-white tracking-tight">
              {device.name}
            </h1>
            <p className="text-slate-400 text-xs sm:text-sm mt-1 max-w-xl">
              {device.model} • Firmware {device.firmwareVersion} • {device.driverSpecs.freqResponse}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto">
            <button
              onClick={() => onNavigateToTab('autoeq')}
              className="flex-1 lg:flex-initial flex items-center justify-center gap-2 px-4 py-2.5 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-bold text-xs rounded-xl shadow-lg shadow-cyan-500/20 transition-all hover:scale-[1.02]"
            >
              <Sparkles className="w-4 h-4 fill-slate-950" />
              <span>✨ AI Auto-EQ Optimize</span>
            </button>

            <button
              onClick={() => onNavigateToTab('room')}
              className="flex-1 lg:flex-initial flex items-center justify-center gap-2 px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs border border-slate-700 rounded-xl transition-all"
            >
              <Radio className="w-4 h-4 text-emerald-400" />
              <span>Room Acoustic Calibrate</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Grid: Player Card & Device Hardware Card */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Column: Music Player & Visualizer (7 cols) */}
        <div className="lg:col-span-7 space-y-6">
          
          {/* Active Audio Player Card */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl relative">
            <div className="flex items-center justify-between mb-4 border-b border-slate-800/80 pb-3">
              <div className="flex items-center gap-2">
                <Music className="w-4 h-4 text-cyan-400" />
                <h2 className="text-sm font-bold text-slate-200 uppercase tracking-wider font-mono">
                  Synthesizer & Audio Stream Player
                </h2>
              </div>
              <span className="text-xs font-mono text-cyan-400 bg-cyan-500/10 px-2 py-0.5 rounded">
                BPM {currentTrack.bpm}
              </span>
            </div>

            <div className="flex flex-col sm:flex-row items-center gap-5 mb-6">
              <img
                src={currentTrack.coverUrl}
                alt={currentTrack.title}
                className="w-28 h-28 rounded-xl object-cover border border-slate-700/60 shadow-lg"
              />
              <div className="flex-1 text-center sm:text-left space-y-1">
                <span className="text-[11px] font-mono text-cyan-400 uppercase tracking-wide">
                  {currentTrack.genre}
                </span>
                <h3 className="text-lg font-bold text-white leading-snug">
                  {currentTrack.title}
                </h3>
                <p className="text-xs text-slate-400 font-medium">
                  {currentTrack.artist} — <span className="italic">{currentTrack.album}</span>
                </p>

                {/* Track Selector Dropdown */}
                <div className="pt-2">
                  <select
                    value={currentTrackIndex}
                    onChange={(e) => {
                      const idx = Number(e.target.value);
                      setCurrentTrackIndex(idx);
                      if (isPlaying) {
                        audioEngine.startSynthPlayback(DEMO_TRACKS[idx].synthStyle);
                      }
                    }}
                    className="bg-slate-800 text-xs text-slate-300 border border-slate-700 rounded-lg px-2.5 py-1 focus:outline-none focus:ring-1 focus:ring-cyan-500 cursor-pointer"
                  >
                    {DEMO_TRACKS.map((t, i) => (
                      <option key={t.id} value={i}>
                        {i + 1}. {t.title} ({t.genre})
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Playback Controls & Progress Bar */}
            <div className="space-y-3 mb-4">
              <div className="flex items-center justify-between text-xs font-mono text-slate-400">
                <span>{Math.floor((trackProgress / 100) * currentTrack.duration)}s</span>
                <span>{currentTrack.duration}s</span>
              </div>
              <div className="w-full bg-slate-800 rounded-full h-1.5 overflow-hidden cursor-pointer">
                <div
                  className="bg-gradient-to-r from-cyan-500 to-blue-500 h-full transition-all duration-300"
                  style={{ width: `${trackProgress}%` }}
                />
              </div>

              <div className="flex items-center justify-center gap-4 pt-2">
                <button
                  onClick={handlePrevTrack}
                  className="p-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl transition-colors"
                  title="Previous Track"
                >
                  <SkipBack className="w-4 h-4" />
                </button>

                <button
                  onClick={handleTogglePlay}
                  className="p-4 bg-gradient-to-tr from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-bold rounded-2xl shadow-lg shadow-cyan-500/25 transition-transform hover:scale-105"
                  title={isPlaying ? 'Pause Web Audio Engine' : 'Play Web Audio Engine'}
                >
                  {isPlaying ? <Pause className="w-6 h-6 fill-slate-950" /> : <Play className="w-6 h-6 fill-slate-950 ml-0.5" />}
                </button>

                <button
                  onClick={handleNextTrack}
                  className="p-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl transition-colors"
                  title="Next Track"
                >
                  <SkipForward className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Real-time Visualizer Canvas Component */}
            <VisualizerCanvas height={140} />
          </div>

          {/* Quick Tone Dials (Bass, Mid, Treble) */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Sliders className="w-4 h-4 text-cyan-400" />
                <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider font-mono">
                  Master Tone Controls (-6dB to +6dB)
                </h3>
              </div>
              <button
                onClick={() => onNavigateToTab('equalizer')}
                className="text-xs font-mono text-cyan-400 hover:underline flex items-center gap-1"
              >
                <span>Open 10-Band Graphic EQ</span>
                <span>→</span>
              </button>
            </div>

            <div className="grid grid-cols-3 gap-4 text-center">
              {[
                { type: 'bass' as const, label: 'BASS (LOW)', val: device.bass, color: 'from-blue-500 to-indigo-500' },
                { type: 'mid' as const, label: 'MID (SPEECH)', val: device.mid, color: 'from-cyan-500 to-teal-500' },
                { type: 'treble' as const, label: 'TREBLE (HIGH)', val: device.treble, color: 'from-emerald-500 to-green-500' },
              ].map((item) => (
                <div key={item.type} className="bg-slate-950/70 border border-slate-800 rounded-xl p-3">
                  <span className="text-[10px] font-mono font-bold text-slate-400 block mb-1">
                    {item.label}
                  </span>
                  <div className="text-lg font-bold font-mono text-white mb-2">
                    {item.val > 0 ? `+${item.val}` : item.val} dB
                  </div>
                  <input
                    type="range"
                    min="-6"
                    max="6"
                    value={item.val}
                    onChange={(e) => handleToneChange(item.type, Number(e.target.value))}
                    className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-cyan-400"
                  />
                </div>
              ))}
            </div>
          </div>

        </div>

        {/* Right Column: Device Details & Audio Data Science (5 cols) */}
        <div className="lg:col-span-5 space-y-6">
          
          {/* Hardware Specs & Connectivity */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider font-mono">
                  Hardware Specifications
                </h3>
              </div>
              <span className="text-xs font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                Connected ✓
              </span>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs font-mono">
              <div className="bg-slate-950 p-2.5 rounded-lg border border-slate-800/80">
                <span className="text-[10px] text-slate-500 block">Tweeter Driver</span>
                <span className="text-slate-200 font-semibold">{device.driverSpecs.tweeter}</span>
              </div>
              <div className="bg-slate-950 p-2.5 rounded-lg border border-slate-800/80">
                <span className="text-[10px] text-slate-500 block">Woofer Driver</span>
                <span className="text-slate-200 font-semibold">{device.driverSpecs.woofer}</span>
              </div>
              <div className="bg-slate-950 p-2.5 rounded-lg border border-slate-800/80">
                <span className="text-[10px] text-slate-500 block">Peak Output Power</span>
                <span className="text-amber-400 font-bold">{device.driverSpecs.maxWattage}W RMS</span>
              </div>
              <div className="bg-slate-950 p-2.5 rounded-lg border border-slate-800/80">
                <span className="text-[10px] text-slate-500 block">Freq Range</span>
                <span className="text-cyan-400 font-bold">{device.driverSpecs.freqResponse}</span>
              </div>
            </div>

            <div className="border-t border-slate-800/80 pt-3 space-y-2 text-xs font-mono text-slate-400">
              <div className="flex justify-between">
                <span>MAC Address:</span>
                <span className="text-slate-200">{device.macAddress}</span>
              </div>
              {device.ipAddress && (
                <div className="flex justify-between">
                  <span>IP Address:</span>
                  <span className="text-slate-200">{device.ipAddress}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span>Signal Strength:</span>
                <span className="text-emerald-400">{device.signalStrength} dBm (Excellent)</span>
              </div>
            </div>
          </div>

          {/* Audio Data Science Metrics Card */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Activity className="w-4 h-4 text-cyan-400 animate-pulse" />
                <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider font-mono">
                  Audio Data Science & Spectral Telemetry
                </h3>
              </div>
              <span className="text-[10px] font-mono text-slate-400 bg-slate-800 px-2 py-0.5 rounded">
                Web Audio FFT
              </span>
            </div>

            <div className="space-y-3">
              
              {/* RMS Volume Meter */}
              <div>
                <div className="flex justify-between text-xs font-mono mb-1">
                  <span className="text-slate-400">RMS Signal Energy</span>
                  <span className="text-cyan-400 font-bold">{(metrics.rmsVolume * 100).toFixed(1)}% ({metrics.peakDb} dBFS)</span>
                </div>
                <div className="w-full bg-slate-950 rounded-full h-2 overflow-hidden border border-slate-800">
                  <div
                    className="bg-gradient-to-r from-emerald-400 via-cyan-400 to-amber-400 h-full transition-all duration-200"
                    style={{ width: `${Math.min(100, metrics.rmsVolume * 150)}%` }}
                  />
                </div>
              </div>

              {/* Spectral Centroid */}
              <div className="bg-slate-950 p-3 rounded-xl border border-slate-800/80 flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-mono text-slate-500 block">Spectral Centroid (Acoustic Brightness)</span>
                  <span className="text-sm font-bold font-mono text-slate-200">{metrics.spectralCentroidHz} Hz</span>
                </div>
                <span className="text-xs font-mono text-cyan-400 bg-cyan-500/10 px-2 py-1 rounded">
                  {metrics.spectralCentroidHz > 2500 ? 'Bright Air' : metrics.spectralCentroidHz > 1200 ? 'Balanced' : 'Warm Lows'}
                </span>
              </div>

              {/* Dominant Frequency & Zero-Crossing */}
              <div className="grid grid-cols-2 gap-3 text-xs font-mono">
                <div className="bg-slate-950 p-2.5 rounded-lg border border-slate-800/80">
                  <span className="text-[10px] text-slate-500 block">Peak Fundamental</span>
                  <span className="text-slate-200 font-bold">{metrics.dominantFrequencyHz} Hz</span>
                </div>
                <div className="bg-slate-950 p-2.5 rounded-lg border border-slate-800/80">
                  <span className="text-[10px] text-slate-500 block">Zero Crossing Rate</span>
                  <span className="text-slate-200 font-bold">{metrics.zeroCrossingRate}</span>
                </div>
              </div>

            </div>
          </div>

          {/* EQ Presets Quick Switch */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider font-mono">
                Equalizer Presets
              </h3>
              <span className="text-xs font-mono text-slate-400">Active: {activePreset.name}</span>
            </div>

            <div className="grid grid-cols-2 gap-2">
              {DEMO_PRESETS.map((preset) => {
                const isActive = activePreset.id === preset.id;
                return (
                  <button
                    key={preset.id}
                    onClick={() => {
                      onSelectPreset(preset);
                      audioEngine.set10BandEQ(preset.bands);
                      audioEngine.setQuickTone(preset.bass, 0, preset.treble);
                    }}
                    className={`p-2.5 rounded-xl border text-left transition-all ${
                      isActive
                        ? 'bg-cyan-500/15 border-cyan-500/40 text-cyan-300 font-semibold shadow-md'
                        : 'bg-slate-950/60 border-slate-800/80 text-slate-300 hover:bg-slate-800/50'
                    }`}
                  >
                    <div className="text-xs font-bold">{preset.name}</div>
                    <div className="text-[10px] text-slate-400 truncate mt-0.5">{preset.description}</div>
                  </button>
                );
              })}
            </div>
          </div>

        </div>

      </div>

    </div>
  );
};
