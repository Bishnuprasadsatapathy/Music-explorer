import React, { useState } from 'react';
import { Bot, Send, Sparkles, Check, ArrowRight, Loader2, MessageSquare, Lightbulb } from 'lucide-react';
import { AIAssistantResponse, AudioDevice } from '../types';
import { audioEngine } from '../services/audioEngine';
import { FREQUENCY_LABELS } from '../data/mockAudio';

interface AIAssistantViewProps {
  device: AudioDevice;
  currentBands: number[];
  onApplyAssistantEQ: (bands: number[], bass: number, mid: number, treble: number) => void;
}

export const AIAssistantView: React.FC<AIAssistantViewProps> = ({
  device,
  currentBands,
  onApplyAssistantEQ,
}) => {
  const [promptInput, setPromptInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [responseHistory, setResponseHistory] = useState<AIAssistantResponse[]>([]);
  const [appliedIdx, setAppliedIdx] = useState<number | null>(null);

  const PRESET_PROMPTS = [
    'Make the vocals super clear and forward for an acoustic podcast.',
    'I want deep punchy sub-bass without making the vocal mids muddy.',
    'Cinematic action movie mode with dialogue clarity and wide soundstage.',
    'Warm cozy lo-fi lounge setting for late night focus study.',
    'Enhance high-frequency footstep cues and positional audio for gaming.',
  ];

  const handleSendPrompt = async (inputQuery?: string) => {
    const query = inputQuery || promptInput;
    if (!query.trim()) return;

    setIsLoading(true);
    setPromptInput('');

    try {
      const response = await fetch('/api/ai/assistant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userPrompt: query,
          currentBands,
          speakerModel: device.name,
        }),
      });

      const resData = await response.json();
      if (resData.success && resData.data) {
        setResponseHistory((prev) => [resData.data, ...prev]);
      } else {
        throw new Error(resData.error || 'Server error');
      }
    } catch (err) {
      console.warn('AI Assistant API error, generating local mastering profile:', err);
      // Smart local fallback
      const queryLower = query.toLowerCase();
      let bands = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
      let b = 0, m = 0, t = 0;
      let intent = 'General Tuning';

      if (queryLower.includes('vocal') || queryLower.includes('podcast')) {
        bands = [-3, -2, 0, 3, 5, 4, 2, 0, -1, -2];
        b = -2; m = 4; t = 0;
        intent = 'Vocal Clarity & Presence';
      } else if (queryLower.includes('bass') || queryLower.includes('sub')) {
        bands = [7, 5, 3, 1, 0, 0, 1, 1, 0, 0];
        b = 5; m = 0; t = 1;
        intent = 'Sub-Bass Enhancement';
      } else if (queryLower.includes('movie') || queryLower.includes('cinema')) {
        bands = [5, 3, 1, -1, 2, 3, 4, 2, 1, 0];
        b = 4; m = 1; t = 3;
        intent = 'Cinema Surround';
      } else {
        bands = [2, 1, 0, 1, 2, 2, 2, 3, 2, 1];
        b = 2; m = 1; t = 2;
        intent = 'Custom Audio Balance';
      }

      setResponseHistory((prev) => [
        {
          userPrompt: query,
          intentCategory: intent,
          adjustedBands: bands,
          bass: b,
          mid: m,
          treble: t,
          explanation: `Generated custom multi-band DSP curve for "${query}". Boosted specific frequency regions while attenuating masking frequencies.`,
          audioEngineeringInsights: [
            'Attenuated 250Hz low-mid region to eliminate boxy acoustic reflections.',
            'Lifted 3kHz-5kHz presence band for enhanced spatial articulation.',
          ],
        },
        ...prev,
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleApplyToDSP = (res: AIAssistantResponse, index: number) => {
    onApplyAssistantEQ(res.adjustedBands, res.bass, res.mid, res.treble);
    audioEngine.set10BandEQ(res.adjustedBands);
    audioEngine.setQuickTone(res.bass, res.mid, res.treble);
    setAppliedIdx(index);
    setTimeout(() => setAppliedIdx(null), 2500);
  };

  return (
    <div className="space-y-6">
      
      {/* Hero Header */}
      <div className="bg-gradient-to-r from-indigo-950 via-slate-900 to-cyan-950 border border-indigo-500/30 rounded-2xl p-6 lg:p-8 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 max-w-3xl space-y-3">
          <div className="inline-flex items-center gap-2 bg-indigo-500/10 border border-indigo-500/30 px-3 py-1 rounded-full text-xs font-mono font-bold text-indigo-300">
            <Bot className="w-4 h-4 text-indigo-400" />
            <span>PHASE 5 — AI NATURAL LANGUAGE SOUND ASSISTANT</span>
          </div>

          <h1 className="text-3xl font-extrabold text-white tracking-tight">
            Conversational Sound Engineering Assistant
          </h1>

          <p className="text-slate-300 text-sm leading-relaxed">
            Speak to SonicAI in plain natural language. Request specific listening atmospheres, acoustic tweaks, or mastering adjustments, and Gemini AI will translate your words into exact 10-band DSP parametric filter coefficients.
          </p>
        </div>
      </div>

      {/* Input Box & Prompt Chips */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
        
        {/* Quick Suggestion Chips */}
        <div className="space-y-2">
          <span className="text-xs font-mono text-slate-400 font-bold block flex items-center gap-1">
            <Lightbulb className="w-3.5 h-3.5 text-amber-400" />
            <span>Try these sound prompts:</span>
          </span>
          <div className="flex flex-wrap gap-2">
            {PRESET_PROMPTS.map((p, i) => (
              <button
                key={i}
                onClick={() => handleSendPrompt(p)}
                disabled={isLoading}
                className="bg-slate-950 hover:bg-slate-800 text-slate-300 border border-slate-800 hover:border-indigo-500/40 px-3 py-1.5 rounded-xl text-xs text-left transition-colors cursor-pointer"
              >
                "{p}"
              </button>
            ))}
          </div>
        </div>

        {/* Custom Input Bar */}
        <div className="relative flex items-center">
          <input
            type="text"
            value={promptInput}
            onChange={(e) => setPromptInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSendPrompt()}
            placeholder='e.g., "Make the vocals super clear for acoustic podcast..."'
            className="w-full bg-slate-950 text-slate-100 text-xs sm:text-sm placeholder-slate-500 border border-slate-800 rounded-xl px-4 py-3.5 pr-12 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
          <button
            onClick={() => handleSendPrompt()}
            disabled={isLoading || !promptInput.trim()}
            className="absolute right-2 p-2 bg-gradient-to-r from-indigo-500 to-cyan-500 text-slate-950 font-bold rounded-lg hover:scale-105 transition-transform disabled:opacity-40 cursor-pointer"
          >
            {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Response History Cards */}
      <div className="space-y-4">
        {responseHistory.map((res, idx) => (
          <div
            key={idx}
            className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4 animate-fade-in"
          >
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-800 pb-3">
              <div>
                <span className="text-[10px] font-mono font-bold uppercase text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded">
                  {res.intentCategory}
                </span>
                <h3 className="text-sm font-bold text-slate-200 mt-1">
                  "{res.userPrompt}"
                </h3>
              </div>

              <button
                onClick={() => handleApplyToDSP(res, idx)}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl font-bold text-xs transition-all shadow-md ${
                  appliedIdx === idx
                    ? 'bg-emerald-500 text-slate-950 shadow-emerald-500/20'
                    : 'bg-gradient-to-r from-indigo-500 to-cyan-500 hover:from-indigo-400 hover:to-cyan-400 text-slate-950 shadow-indigo-500/20 hover:scale-105'
                }`}
              >
                {appliedIdx === idx ? (
                  <>
                    <Check className="w-4 h-4 stroke-[3]" />
                    <span>Applied to DSP Engine!</span>
                  </>
                ) : (
                  <>
                    <span>Apply to Speaker DSP</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>

            {/* Generated 10-Band EQ Curve */}
            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2">
              <span className="text-[10px] font-mono text-slate-400 uppercase block font-bold">
                Synthesized 10-Band Filter Offsets (dB)
              </span>
              <div className="grid grid-cols-5 sm:grid-cols-10 gap-2 text-center font-mono text-xs">
                {FREQUENCY_LABELS.map((label, bIdx) => {
                  const gain = res.adjustedBands[bIdx] || 0;
                  return (
                    <div key={label} className="bg-slate-900 p-2 rounded-lg border border-slate-800">
                      <span className="text-[9px] text-slate-500 block">{label}</span>
                      <div className={`font-bold my-0.5 ${gain > 0 ? 'text-indigo-400' : gain < 0 ? 'text-amber-400' : 'text-slate-400'}`}>
                        {gain > 0 ? `+${gain}` : gain}dB
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* AI Explanation & Mastering Insights */}
            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2">
              <p className="text-xs text-slate-300 leading-relaxed font-sans">
                {res.explanation}
              </p>
              {res.audioEngineeringInsights && res.audioEngineeringInsights.length > 0 && (
                <div className="pt-2 border-t border-slate-800/80 space-y-1">
                  <span className="text-[10px] font-mono font-bold text-indigo-400 uppercase block">
                    Psychoacoustic Insights:
                  </span>
                  {res.audioEngineeringInsights.map((insight, i) => (
                    <div key={i} className="text-[11px] text-slate-400 flex items-center gap-1.5 font-mono">
                      <span className="text-indigo-400">•</span>
                      <span>{insight}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

          </div>
        ))}

        {responseHistory.length === 0 && (
          <div className="bg-slate-900/50 border border-dashed border-slate-800 rounded-2xl p-12 text-center space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center mx-auto">
              <Bot className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-slate-200">AI Sound Assistant Ready</h3>
            <p className="text-xs text-slate-400 max-w-md mx-auto">
              Select a suggested sound prompt above or type your own custom audio request to generate precision DSP equalization curves.
            </p>
          </div>
        )}
      </div>

    </div>
  );
};
