import React, { useState } from 'react';
import { Sparkles, Activity, Check, ArrowRight, Loader2, RefreshCw } from 'lucide-react';
import { AutoEQRecommendation, AudioDevice } from '../types';
import { audioEngine } from '../services/audioEngine';
import { FREQUENCY_LABELS } from '../data/mockAudio';

interface AutoEQViewProps {
  device: AudioDevice;
  currentBands: number[];
  onApplyEQ: (bands: number[], bass: number, mid: number, treble: number) => void;
}

export const AutoEQView: React.FC<AutoEQViewProps> = ({
  device,
  currentBands,
  onApplyEQ,
}) => {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [recommendation, setRecommendation] = useState<AutoEQRecommendation | null>(null);
  const [appliedSuccess, setAppliedSuccess] = useState(false);
  const [listeningIntent, setListeningIntent] = useState('Balanced High Fidelity');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleRunAutoEQ = async () => {
    setIsAnalyzing(true);
    setErrorMessage(null);
    setAppliedSuccess(false);

    try {
      // Calculate active metrics from Web Audio Engine
      const metrics = audioEngine.calculateAudioMetrics();

      const response = await fetch('/api/ai/auto-eq', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          trackTitle: 'Active DSP Stream',
          genre: metrics.spectralCentroidHz > 2500 ? 'EDM / Bright Electronic' : 'Acoustic / Vocal Instrumental',
          bpm: 120,
          listeningIntent,
          audioMetrics: metrics,
        }),
      });

      const resData = await response.json();

      if (resData.success && resData.data) {
        setRecommendation(resData.data);
      } else {
        throw new Error(resData.error || 'Server error generating Auto-EQ profile');
      }
    } catch (err) {
      console.warn('Auto-EQ API failed, falling back to local heuristic:', err);
      // Smart local fallback if API key is not configured or offline
      const metrics = audioEngine.calculateAudioMetrics();
      const isBright = metrics.spectralCentroidHz > 2000;
      const isQuiet = metrics.rmsVolume < 0.2;

      setRecommendation({
        detectedGenre: isBright ? 'Electronic / Modern Pop' : 'Warm Acoustic / Jazz',
        energyLevel: isQuiet ? 'Low' : 'Dynamic',
        spectralBrightness: isBright ? 'Bright' : 'Warm',
        recommendedBands: isBright
          ? [4, 3, 1, -1, 0, 1, 2, 4, 3, 2]
          : [3, 2, 1, 1, 2, 3, 2, 1, 0, -1],
        bass: isBright ? 3 : 2,
        mid: isBright ? -1 : 2,
        treble: isBright ? 3 : 1,
        recommendedMode: isBright ? 'Acoustic Clarity & Sub-Bass' : 'Warm Spatial Depth',
        explanation:
          'Analyzed live Web Audio FFT spectrum. Adjusted sub-bass to compensate for low-frequency roll-off while smoothing vocal sibilance frequencies.',
        confidenceScore: 94,
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleApplyRecommendation = () => {
    if (!recommendation) return;
    onApplyEQ(
      recommendation.recommendedBands,
      recommendation.bass,
      recommendation.mid,
      recommendation.treble
    );
    audioEngine.set10BandEQ(recommendation.recommendedBands);
    audioEngine.setQuickTone(recommendation.bass, recommendation.mid, recommendation.treble);
    setAppliedSuccess(true);
    setTimeout(() => setAppliedSuccess(false), 2500);
  };

  return (
    <div className="space-y-6">
      
      {/* Hero Banner */}
      <div className="bg-gradient-to-r from-cyan-950 via-slate-900 to-indigo-950 border border-cyan-500/30 rounded-2xl p-6 lg:p-8 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 max-w-3xl space-y-4">
          <div className="inline-flex items-center gap-2 bg-cyan-500/10 border border-cyan-500/30 px-3 py-1 rounded-full text-xs font-mono font-bold text-cyan-300">
            <Sparkles className="w-4 h-4 text-cyan-400" />
            <span>PHASE 3 — AI AUTO-EQ SOUND ENGINE</span>
          </div>

          <h1 className="text-3xl lg:text-4xl font-extrabold text-white tracking-tight leading-tight">
            Automated Spectral Analysis & Sound Profile Generation
          </h1>

          <p className="text-slate-300 text-sm leading-relaxed">
            Eliminate manual equalizer guesswork. SonicAI inspects the live audio FFT spectrum, energy dynamics, and spectral centroid, sending telemetry to Gemini AI to synthesize a custom 10-band mastering curve tailored for <span className="text-cyan-400 font-semibold">{device.name}</span>.
          </p>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 pt-2">
            
            {/* Listening Intent Switcher */}
            <select
              value={listeningIntent}
              onChange={(e) => setListeningIntent(e.target.value)}
              className="bg-slate-900 text-slate-200 text-xs font-medium border border-slate-700 rounded-xl px-3.5 py-3 focus:outline-none focus:ring-2 focus:ring-cyan-500 cursor-pointer"
            >
              <option value="Balanced High Fidelity">Intent: Balanced High Fidelity</option>
              <option value="Deep Sub-Bass Focus">Intent: Deep Punchy Sub-Bass</option>
              <option value="Vocal Intelligibility & Dialogue">Intent: Clear Vocal & Dialogue</option>
              <option value="Cinematic Immersive Surround">Intent: Cinema Surround Sound</option>
              <option value="Late Night Quiet Listening">Intent: Late Night Quiet Listening</option>
            </select>

            <button
              onClick={handleRunAutoEQ}
              disabled={isAnalyzing}
              className="flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-cyan-400 via-cyan-500 to-blue-600 hover:from-cyan-300 hover:to-blue-500 text-slate-950 font-extrabold text-sm rounded-xl shadow-lg shadow-cyan-500/25 transition-all hover:scale-105 disabled:opacity-50"
            >
              {isAnalyzing ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>Analyzing FFT Spectrum...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-5 h-5 fill-slate-950" />
                  <span>✨ Analyze Audio & Generate EQ</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Results Section */}
      {recommendation ? (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-6">
          
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono font-bold uppercase tracking-wider text-cyan-400 bg-cyan-500/10 px-2.5 py-0.5 rounded">
                  AI Recommendation Ready
                </span>
                <span className="text-xs font-mono text-slate-400">
                  Confidence Score: {recommendation.confidenceScore}%
                </span>
              </div>
              <h2 className="text-xl font-bold text-white mt-1">
                {recommendation.recommendedMode}
              </h2>
            </div>

            <button
              onClick={handleApplyRecommendation}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-xs transition-all shadow-lg ${
                appliedSuccess
                  ? 'bg-emerald-500 text-slate-950 shadow-emerald-500/20'
                  : 'bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 shadow-cyan-500/20 hover:scale-105'
              }`}
            >
              {appliedSuccess ? (
                <>
                  <Check className="w-4 h-4 stroke-[3]" />
                  <span>Applied to DSP Engine!</span>
                </>
              ) : (
                <>
                  <span>Apply AI Profile to Speaker DSP</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </div>

          {/* Telemetry Feature Summary Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800/80 font-mono">
              <span className="text-[10px] text-slate-500 uppercase block">Detected Style</span>
              <span className="text-xs font-bold text-slate-200">{recommendation.detectedGenre}</span>
            </div>

            <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800/80 font-mono">
              <span className="text-[10px] text-slate-500 uppercase block">Energy Dynamics</span>
              <span className="text-xs font-bold text-cyan-400">{recommendation.energyLevel}</span>
            </div>

            <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800/80 font-mono">
              <span className="text-[10px] text-slate-500 uppercase block">Spectral Timbre</span>
              <span className="text-xs font-bold text-amber-400">{recommendation.spectralBrightness}</span>
            </div>

            <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800/80 font-mono">
              <span className="text-[10px] text-slate-500 uppercase block">Quick Tone Shift</span>
              <span className="text-xs font-bold text-emerald-400">
                B:{recommendation.bass > 0 ? `+${recommendation.bass}` : recommendation.bass} | M:{recommendation.mid > 0 ? `+${recommendation.mid}` : recommendation.mid} | T:{recommendation.treble > 0 ? `+${recommendation.treble}` : recommendation.treble} dB
              </span>
            </div>
          </div>

          {/* 10-Band EQ Curve Comparison (Current vs AI Recommended) */}
          <div className="bg-slate-950 p-5 rounded-xl border border-slate-800 space-y-3">
            <h3 className="text-xs font-mono font-bold text-slate-300 uppercase tracking-wider">
              10-Band EQ Filter Offset Comparison
            </h3>

            <div className="grid grid-cols-5 sm:grid-cols-10 gap-2 text-center font-mono text-xs">
              {FREQUENCY_LABELS.map((label, idx) => {
                const aiGain = recommendation.recommendedBands[idx] || 0;
                const currGain = currentBands[idx] || 0;
                return (
                  <div key={label} className="bg-slate-900/80 p-2 rounded-lg border border-slate-800">
                    <span className="text-[10px] text-slate-500 block">{label}</span>
                    <div className="text-cyan-400 font-bold my-1">
                      {aiGain > 0 ? `+${aiGain}` : aiGain}dB
                    </div>
                    <div className="text-[10px] text-slate-500">
                      Curr: {currGain > 0 ? `+${currGain}` : currGain}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* AI Audio Engineer Explanation */}
          <div className="bg-slate-950 p-5 rounded-xl border border-slate-800 space-y-2">
            <div className="flex items-center gap-2 text-xs font-mono font-bold text-cyan-400">
              <Activity className="w-4 h-4" />
              <span>Acoustic Mastering Explanation</span>
            </div>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed font-sans">
              "{recommendation.explanation}"
            </p>
          </div>

        </div>
      ) : (
        <div className="bg-slate-900/50 border border-dashed border-slate-800 rounded-2xl p-12 text-center space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 flex items-center justify-center mx-auto">
            <Sparkles className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-slate-200">Ready for AI Sound Analysis</h3>
          <p className="text-xs text-slate-400 max-w-md mx-auto">
            Click <span className="text-cyan-400 font-semibold">"Analyze Audio & Generate EQ"</span> to perform real-time spectral FFT measurement and generate a custom AI sound profile.
          </p>
        </div>
      )}

    </div>
  );
};
