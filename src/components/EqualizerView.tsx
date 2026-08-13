import React, { useState } from 'react';
import { Sliders, RotateCcw, Save, Sparkles, Check } from 'lucide-react';
import { EQPreset } from '../types';
import { FREQUENCY_LABELS, FREQUENCY_NUMBERS, DEMO_PRESETS } from '../data/mockAudio';
import { audioEngine } from '../services/audioEngine';

interface EqualizerViewProps {
  currentBands: number[];
  onBandsChange: (bands: number[]) => void;
  activePreset: EQPreset;
  onSelectPreset: (preset: EQPreset) => void;
}

export const EqualizerView: React.FC<EqualizerViewProps> = ({
  currentBands,
  onBandsChange,
  activePreset,
  onSelectPreset,
}) => {
  const [bassVal, setBassVal] = useState(0);
  const [midVal, setMidVal] = useState(0);
  const [trebleVal, setTrebleVal] = useState(0);
  const [savedSuccess, setSavedSuccess] = useState(false);

  const handleSliderChange = (index: number, val: number) => {
    const updated = [...currentBands];
    updated[index] = val;
    onBandsChange(updated);
    audioEngine.set10BandEQ(updated);
  };

  const handleResetFlat = () => {
    const flat = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
    onBandsChange(flat);
    setBassVal(0);
    setMidVal(0);
    setTrebleVal(0);
    audioEngine.set10BandEQ(flat);
    audioEngine.setQuickTone(0, 0, 0);
  };

  const handleSaveCustom = () => {
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 2000);
  };

  // Generate SVG path for the response curve
  const width = 800;
  const height = 160;
  const zeroY = height / 2;

  const points = currentBands.map((gain, i) => {
    const x = (i / (currentBands.length - 1)) * (width - 60) + 30;
    const y = zeroY - (gain / 12) * (height / 2 - 15);
    return { x, y };
  });

  // Simple cubic spline path builder
  let pathD = `M ${points[0].x} ${points[0].y}`;
  for (let i = 0; i < points.length - 1; i++) {
    const p0 = points[i];
    const p1 = points[i + 1];
    const cp1x = p0.x + (p1.x - p0.x) / 2;
    const cp1y = p0.y;
    const cp2x = p0.x + (p1.x - p0.x) / 2;
    const cp2y = p1.y;
    pathD += ` C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${p1.x} ${p1.y}`;
  }

  // Fill path to zero
  const fillD = `${pathD} L ${points[points.length - 1].x} ${zeroY} L ${points[0].x} ${zeroY} Z`;

  return (
    <div className="space-y-6">
      
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Sliders className="w-5 h-5 text-cyan-400" />
            <h1 className="text-2xl font-bold text-white tracking-tight">10-Band Graphic Equalizer</h1>
          </div>
          <p className="text-slate-400 text-xs sm:text-sm">
            Precision Web Audio DSP filter bank across sub-bass, midrange, and high treble frequencies.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleResetFlat}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium text-xs rounded-xl border border-slate-700 transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset Flat</span>
          </button>

          <button
            onClick={handleSaveCustom}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-cyan-500/15 hover:bg-cyan-500/25 text-cyan-300 font-semibold text-xs border border-cyan-500/30 rounded-xl transition-colors"
          >
            {savedSuccess ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Save className="w-3.5 h-3.5" />}
            <span>{savedSuccess ? 'Saved to Profile!' : 'Save Preset'}</span>
          </button>
        </div>
      </div>

      {/* SVG Frequency Response Curve Visualizer */}
      <div className="bg-slate-950 border border-slate-800 rounded-2xl p-5 shadow-xl relative overflow-hidden">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-mono font-bold text-slate-300 uppercase tracking-wider">
            Combined Frequency Response Curve (+12dB to -12dB)
          </span>
          <span className="text-[11px] font-mono text-cyan-400">20 Hz — 20 kHz</span>
        </div>

        <div className="relative w-full overflow-x-auto">
          <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-44 drop-shadow-lg">
            {/* Horizontal Grid lines */}
            <line x1="0" y1={zeroY - 40} x2={width} y2={zeroY - 40} stroke="#1e293b" strokeDasharray="4 4" />
            <line x1="0" y1={zeroY} x2={width} y2={zeroY} stroke="#334155" strokeWidth="1.5" />
            <line x1="0" y1={zeroY + 40} x2={width} y2={zeroY + 40} stroke="#1e293b" strokeDasharray="4 4" />

            <text x="5" y={zeroY - 38} fill="#64748b" fontSize="10" fontFamily="monospace">+6dB</text>
            <text x="5" y={zeroY - 3} fill="#94a3b8" fontSize="10" fontFamily="monospace"> 0dB</text>
            <text x="5" y={zeroY + 42} fill="#64748b" fontSize="10" fontFamily="monospace">-6dB</text>

            {/* Filled Area Under Curve */}
            <defs>
              <linearGradient id="curveGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#22d3ee" stopOpacity="0.35" />
                <stop offset="100%" stopColor="#22d3ee" stopOpacity="0.0" />
              </linearGradient>
            </defs>
            <path d={fillD} fill="url(#curveGradient)" />

            {/* Main Response Spline */}
            <path d={pathD} fill="none" stroke="#22d3ee" strokeWidth="3" strokeLinecap="round" />

            {/* Control Node Points */}
            {points.map((p, idx) => (
              <circle
                key={idx}
                cx={p.x}
                cy={p.y}
                r="5"
                fill="#0284c7"
                stroke="#38bdf8"
                strokeWidth="2"
                className="transition-all duration-150"
              />
            ))}
          </svg>
        </div>
      </div>

      {/* 10-Band Vertical Slider Control Bank */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl">
        <h2 className="text-xs font-bold text-slate-300 uppercase tracking-wider font-mono mb-6">
          10-Band Graphic Gain Controls (-12 dB to +12 dB)
        </h2>

        <div className="grid grid-cols-5 sm:grid-cols-10 gap-3 sm:gap-2 text-center">
          {FREQUENCY_NUMBERS.map((freq, idx) => {
            const gain = currentBands[idx] || 0;
            return (
              <div
                key={freq}
                className="bg-slate-950/80 border border-slate-800/80 rounded-xl p-3 flex flex-col items-center justify-between space-y-3 hover:border-cyan-500/40 transition-colors"
              >
                {/* Gain Readout */}
                <div className={`text-xs font-bold font-mono ${gain > 0 ? 'text-cyan-400' : gain < 0 ? 'text-amber-400' : 'text-slate-400'}`}>
                  {gain > 0 ? `+${gain}` : gain} <span className="text-[10px]">dB</span>
                </div>

                {/* Vertical Slider */}
                <div className="h-40 flex items-center justify-center relative my-2">
                  <input
                    type="range"
                    min="-12"
                    max="12"
                    step="1"
                    value={gain}
                    onChange={(e) => handleSliderChange(idx, Number(e.target.value))}
                    className="w-32 h-2 appearance-none bg-slate-800 rounded-lg cursor-pointer -rotate-90 origin-center accent-cyan-400"
                  />
                </div>

                {/* Frequency Label */}
                <div>
                  <div className="text-xs font-bold font-mono text-slate-200">
                    {FREQUENCY_LABELS[idx]}
                  </div>
                  <button
                    onClick={() => handleSliderChange(idx, 0)}
                    className="text-[9px] font-mono text-slate-500 hover:text-slate-300 transition-colors mt-0.5"
                  >
                    Reset
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Presets Grid */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xs font-bold text-slate-300 uppercase tracking-wider font-mono">
            Acoustic Target Presets
          </h2>
          <span className="text-xs text-slate-400 font-mono">Click to apply preset profile</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {DEMO_PRESETS.map((preset) => {
            const isActive = activePreset.id === preset.id;
            return (
              <button
                key={preset.id}
                onClick={() => {
                  onSelectPreset(preset);
                  onBandsChange(preset.bands);
                  audioEngine.set10BandEQ(preset.bands);
                  audioEngine.setQuickTone(preset.bass, 0, preset.treble);
                }}
                className={`p-4 rounded-xl border text-left transition-all relative overflow-hidden ${
                  isActive
                    ? 'bg-cyan-500/15 border-cyan-500/50 text-cyan-200 shadow-lg shadow-cyan-500/10'
                    : 'bg-slate-950/60 border-slate-800 text-slate-300 hover:bg-slate-800/60'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="font-bold text-sm text-white">{preset.name}</span>
                  {isActive && <Sparkles className="w-4 h-4 text-cyan-400" />}
                </div>
                <p className="text-xs text-slate-400 leading-relaxed line-clamp-2">
                  {preset.description}
                </p>
              </button>
            );
          })}
        </div>
      </div>

    </div>
  );
};
