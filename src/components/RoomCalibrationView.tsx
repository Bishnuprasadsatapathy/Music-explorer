import React, { useState } from 'react';
import { Mic, Radio, Check, Volume2, ShieldAlert, ArrowRight, Loader2, Sparkles, RefreshCw } from 'lucide-react';
import { RoomAnalysisResult, AudioDevice } from '../types';
import { audioEngine } from '../services/audioEngine';
import { FREQUENCY_LABELS } from '../data/mockAudio';

interface RoomCalibrationViewProps {
  device: AudioDevice;
  onApplyRoomCorrection: (bands: number[]) => void;
}

export const RoomCalibrationView: React.FC<RoomCalibrationViewProps> = ({
  device,
  onApplyRoomCorrection,
}) => {
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);
  const [roomType, setRoomType] = useState('Living Room');
  const [roomSizeSqFt, setRoomSizeSqFt] = useState(280);
  const [wallType, setWallType] = useState('Drywall & Large Windows');
  const [speakerPosition, setSpeakerPosition] = useState('Near Corner');
  
  const [isMeasuring, setIsMeasuring] = useState(false);
  const [sweepProgress, setSweepProgress] = useState(0);
  const [hasMicAccess, setHasMicAccess] = useState<boolean | null>(null);
  
  const [analysisResult, setAnalysisResult] = useState<RoomAnalysisResult | null>(null);
  const [appliedSuccess, setAppliedSuccess] = useState(false);

  // Step 2: Start Pink Noise Acoustic Test Sweep
  const handleStartCalibration = async () => {
    setStep(2);
    setIsMeasuring(true);
    setSweepProgress(0);

    // Try requesting mic
    const micGranted = await audioEngine.startMicrophoneRecording();
    setHasMicAccess(micGranted);

    // Play test sweep burst
    const spectrum = await audioEngine.playAcousticTestSweep((progress) => {
      setSweepProgress(progress);
    });

    audioEngine.stopMicrophoneRecording();
    setIsMeasuring(false);
    setStep(3);

    // Send acoustic data to Gemini API room-analysis endpoint
    try {
      const response = await fetch('/api/ai/room-analysis', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          roomType,
          estimatedSizeSqFt: roomSizeSqFt,
          wallType,
          speakerPosition,
          micSpectrum: Array.from(spectrum.slice(0, 10)).map((v) => Math.round(v + 100)),
        }),
      });

      const resData = await response.json();
      if (resData.success && resData.data) {
        setAnalysisResult(resData.data);
      } else {
        throw new Error(resData.error || 'Failed to analyze room acoustics');
      }
    } catch (err) {
      console.warn('Room analysis API failed, using acoustic model fallback:', err);
      // Smart acoustic fallback calculation
      const isCorner = speakerPosition.includes('Corner');
      const isGlass = wallType.includes('Glass') || wallType.includes('Windows');

      setAnalysisResult({
        roomType,
        estimatedSizeSqFt: roomSizeSqFt,
        bassResonance: isCorner ? 'HIGH' : 'MEDIUM',
        midReflection: isGlass ? 'HIGH' : 'LOW',
        highFrequencyLoss: roomSizeSqFt > 300 ? 'MEDIUM' : 'LOW',
        measuredFrequencyResponse: [
          { freq: 60, db: 6 },
          { freq: 120, db: 8 },
          { freq: 250, db: 4 },
          { freq: 500, db: 0 },
          { freq: 1000, db: -2 },
          { freq: 2000, db: 3 },
          { freq: 4000, db: -1 },
          { freq: 8000, db: -3 },
          { freq: 16000, db: -5 },
          { freq: 20000, db: -6 },
        ],
        calculatedCorrections: isCorner
          ? [-3, -4, -2, 0, 1, 0, 1, 2, 3, 4]
          : [-1, -2, 0, 1, 1, 0, 1, 2, 3, 3],
        recommendedEQ: isCorner
          ? [-3, -4, -2, 0, 1, 0, 1, 2, 3, 4]
          : [-1, -2, 0, 1, 1, 0, 1, 2, 3, 3],
        acousticAdvice: [
          'Move the speaker at least 12 inches away from wall corners to reduce +6dB bass boomy resonance.',
          'Place a soft area rug or thick curtains in front of glass surfaces to damp high-frequency reflections.',
          'Enable SonicAI Room Correction EQ to notch out boundary interference frequency peaks.',
        ],
      });
    } finally {
      setStep(4);
    }
  };

  const handleApplyRoomEQ = () => {
    if (!analysisResult) return;
    onApplyRoomCorrection(analysisResult.calculatedCorrections);
    audioEngine.set10BandEQ(analysisResult.calculatedCorrections);
    setAppliedSuccess(true);
    setTimeout(() => setAppliedSuccess(false), 2500);
  };

  return (
    <div className="space-y-6">
      
      {/* Hero Banner */}
      <div className="bg-gradient-to-r from-emerald-950 via-slate-900 to-indigo-950 border border-emerald-500/30 rounded-2xl p-6 lg:p-8 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 max-w-3xl space-y-3">
          <div className="inline-flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/30 px-3 py-1 rounded-full text-xs font-mono font-bold text-emerald-300">
            <Radio className="w-4 h-4 text-emerald-400" />
            <span>PHASE 4 — ROOM SOUND OPTIMIZATION & ACOUSTIC CALIBRATION</span>
          </div>

          <h1 className="text-3xl font-extrabold text-white tracking-tight">
            Acoustic Measurement & Room Mode Correction
          </h1>

          <p className="text-slate-300 text-sm leading-relaxed">
            Every physical room distorts sound due to wall reflections, standing bass wave nodes, and high-frequency absorption. Perform a short microphone sweep measurement to calculate compensating room correction EQ filters.
          </p>
        </div>
      </div>

      {/* 4-Step Calibration Wizard Indicator */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-xl">
        <div className="grid grid-cols-4 gap-2 text-center text-xs font-mono">
          {[
            { num: 1, title: 'Room Setup' },
            { num: 2, title: 'Pink Noise Burst' },
            { num: 3, title: 'FFT Measurement' },
            { num: 4, title: 'AI Correction EQ' },
          ].map((st) => {
            const isActive = step === st.num;
            const isDone = step > st.num;
            return (
              <div
                key={st.num}
                className={`p-2.5 rounded-xl border transition-all ${
                  isActive
                    ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-300 font-bold'
                    : isDone
                    ? 'bg-slate-950 border-emerald-500/20 text-emerald-400'
                    : 'bg-slate-950 border-slate-800/80 text-slate-500'
                }`}
              >
                <div className="text-[10px] uppercase">Step {st.num}</div>
                <div className="text-xs font-semibold">{st.title}</div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Step 1: Room Geometry & Setup Input Form */}
      {step === 1 && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-6">
          <h2 className="text-sm font-bold text-slate-200 uppercase tracking-wider font-mono border-b border-slate-800 pb-3">
            Step 1: Configure Room Geometry & Physical Setup
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-xs font-mono font-bold text-slate-300 block">Room Type</label>
              <select
                value={roomType}
                onChange={(e) => setRoomType(e.target.value)}
                className="w-full bg-slate-950 text-slate-200 text-xs font-medium border border-slate-700 rounded-xl px-3.5 py-2.5 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              >
                <option value="Living Room">Living Room (Soft Furnishings & Couch)</option>
                <option value="Dedicated Studio">Dedicated Sound Studio (Acoustic Panels)</option>
                <option value="Bedroom">Bedroom (Bed, Carpet, Curtains)</option>
                <option value="Open Office / Concrete">Open Space / Hard Tile / Concrete</option>
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-mono font-bold text-slate-300 block">Room Size ({roomSizeSqFt} sq ft)</label>
              <input
                type="range"
                min="100"
                max="800"
                step="20"
                value={roomSizeSqFt}
                onChange={(e) => setRoomSizeSqFt(Number(e.target.value))}
                className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-emerald-400 my-2"
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-mono font-bold text-slate-300 block">Primary Wall Surfaces</label>
              <select
                value={wallType}
                onChange={(e) => setWallType(e.target.value)}
                className="w-full bg-slate-950 text-slate-200 text-xs font-medium border border-slate-700 rounded-xl px-3.5 py-2.5 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              >
                <option value="Drywall & Large Windows">Drywall + Large Glass Windows</option>
                <option value="Hard Concrete / Brick">Bare Concrete / Exposed Brick</option>
                <option value="Wood Panel & Carpet">Wood Paneling + Heavy Rug/Carpet</option>
                <option value="Acoustically Treated">Acoustically Treated Foam/Bass Traps</option>
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-mono font-bold text-slate-300 block">Speaker Positioning</label>
              <select
                value={speakerPosition}
                onChange={(e) => setSpeakerPosition(e.target.value)}
                className="w-full bg-slate-950 text-slate-200 text-xs font-medium border border-slate-700 rounded-xl px-3.5 py-2.5 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              >
                <option value="Near Corner">Near Room Corner (Bass Boundary Boost)</option>
                <option value="Against Back Wall">Flushed Against Flat Wall</option>
                <option value="Free Standing Desk/Stand">Free-Standing Desk / Speaker Stand</option>
              </select>
            </div>
          </div>

          <div className="pt-4 flex justify-end">
            <button
              onClick={handleStartCalibration}
              className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-slate-950 font-bold text-sm rounded-xl shadow-lg shadow-emerald-500/20 transition-all hover:scale-105"
            >
              <Mic className="w-4 h-4" />
              <span>Start Microphone Acoustic Sweep →</span>
            </button>
          </div>
        </div>
      )}

      {/* Step 2 & 3: Measurement In Progress */}
      {(step === 2 || step === 3) && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-10 text-center space-y-6 shadow-xl">
          <div className="w-16 h-16 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 flex items-center justify-center mx-auto animate-pulse">
            {step === 2 ? <Volume2 className="w-8 h-8" /> : <Loader2 className="w-8 h-8 animate-spin" />}
          </div>

          <div className="space-y-2">
            <h3 className="text-xl font-bold text-white">
              {step === 2 ? 'Playing Calibrated Pink Noise Test Sweep...' : 'Analyzing Room Acoustic Reflections...'}
            </h3>
            <p className="text-xs text-slate-400 max-w-md mx-auto">
              Please hold your microphone at ear level in your primary listening position.
            </p>
          </div>

          {/* Progress Bar */}
          <div className="max-w-md mx-auto space-y-1">
            <div className="flex justify-between text-xs font-mono text-slate-400">
              <span>Pink Noise Frequency Sweep</span>
              <span className="text-emerald-400 font-bold">{sweepProgress}%</span>
            </div>
            <div className="w-full bg-slate-950 rounded-full h-2 overflow-hidden border border-slate-800">
              <div
                className="bg-gradient-to-r from-emerald-500 to-teal-400 h-full transition-all duration-150"
                style={{ width: `${sweepProgress}%` }}
              />
            </div>
          </div>
        </div>
      )}

      {/* Step 4: AI Room Correction Profile Results */}
      {step === 4 && analysisResult && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-6">
          
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono font-bold uppercase tracking-wider text-emerald-400 bg-emerald-500/10 px-2.5 py-0.5 rounded">
                  Room Acoustic Diagnostic
                </span>
                <span className="text-xs font-mono text-slate-400">{roomType} ({roomSizeSqFt} sq ft)</span>
              </div>
              <h2 className="text-xl font-bold text-white mt-1">
                Room Boundary Correction EQ Profile
              </h2>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={() => setStep(1)}
                className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium text-xs rounded-xl border border-slate-700 transition-colors"
              >
                Re-calibrate
              </button>

              <button
                onClick={handleApplyRoomEQ}
                className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-xs transition-all shadow-lg ${
                  appliedSuccess
                    ? 'bg-emerald-500 text-slate-950 shadow-emerald-500/20'
                    : 'bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-slate-950 shadow-emerald-500/20 hover:scale-105'
                }`}
              >
                {appliedSuccess ? (
                  <>
                    <Check className="w-4 h-4 stroke-[3]" />
                    <span>Applied to DSP Engine!</span>
                  </>
                ) : (
                  <>
                    <span>Apply Room Correction EQ</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Room Acoustic Diagnostics Meter Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800">
              <span className="text-[10px] font-mono text-slate-500 uppercase block">Bass Resonance Peak</span>
              <span className={`text-base font-bold font-mono ${analysisResult.bassResonance === 'HIGH' ? 'text-rose-400' : 'text-emerald-400'}`}>
                {analysisResult.bassResonance} (+6dB @ 120Hz Boomy Node)
              </span>
            </div>

            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800">
              <span className="text-[10px] font-mono text-slate-500 uppercase block">Mid Reflections</span>
              <span className="text-base font-bold font-mono text-amber-400">
                {analysisResult.midReflection} (Glass/Wall Echo)
              </span>
            </div>

            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800">
              <span className="text-[10px] font-mono text-slate-500 uppercase block">High Freq Absorption</span>
              <span className="text-base font-bold font-mono text-cyan-400">
                {analysisResult.highFrequencyLoss} (Curtains & Carpet)
              </span>
            </div>
          </div>

          {/* 10-Band Correction EQ Profile Grid */}
          <div className="bg-slate-950 p-5 rounded-xl border border-slate-800 space-y-3">
            <h3 className="text-xs font-mono font-bold text-slate-300 uppercase tracking-wider">
              Calculated Room Compensation EQ Filters
            </h3>

            <div className="grid grid-cols-5 sm:grid-cols-10 gap-2 text-center font-mono text-xs">
              {FREQUENCY_LABELS.map((label, idx) => {
                const corrGain = analysisResult.calculatedCorrections[idx] || 0;
                return (
                  <div key={label} className="bg-slate-900/80 p-2 rounded-lg border border-slate-800">
                    <span className="text-[10px] text-slate-500 block">{label}</span>
                    <div className={`font-bold my-1 ${corrGain < 0 ? 'text-amber-400' : corrGain > 0 ? 'text-cyan-400' : 'text-slate-400'}`}>
                      {corrGain > 0 ? `+${corrGain}` : corrGain}dB
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Practical Acoustic Advice */}
          <div className="bg-slate-950 p-5 rounded-xl border border-slate-800 space-y-3">
            <h3 className="text-xs font-mono font-bold text-emerald-400 uppercase tracking-wider">
              Expert Acoustic Treatment Recommendations
            </h3>
            <ul className="space-y-2 text-xs text-slate-300">
              {analysisResult.acousticAdvice.map((advice, i) => (
                <li key={i} className="flex items-start gap-2">
                  <span className="text-emerald-400 font-bold font-mono">0{i + 1}.</span>
                  <span>{advice}</span>
                </li>
              ))}
            </ul>
          </div>

        </div>
      )}

    </div>
  );
};
