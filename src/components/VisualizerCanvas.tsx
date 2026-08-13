import React, { useEffect, useRef, useState } from 'react';
import { audioEngine } from '../services/audioEngine';
import { FREQUENCY_LABELS } from '../data/mockAudio';

interface VisualizerCanvasProps {
  height?: number;
}

export const VisualizerCanvas: React.FC<VisualizerCanvasProps> = ({ height = 180 }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [visualMode, setVisualMode] = useState<'spectrum' | 'waveform' | 'spectrogram'>('spectrum');

  useEffect(() => {
    let animationFrameId: number;

    const render = () => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const width = canvas.width;
      const h = canvas.height;

      ctx.clearRect(0, 0, width, h);

      if (visualMode === 'spectrum') {
        const freqData = audioEngine.getFrequencyData();
        const numBars = 10;
        const barWidth = (width - (numBars - 1) * 8) / numBars;

        // Group FFT bins into 10 frequency ranges
        for (let i = 0; i < numBars; i++) {
          const binStart = Math.floor((i / numBars) * freqData.length);
          const binEnd = Math.floor(((i + 1) / numBars) * freqData.length);
          let sum = 0;
          for (let b = binStart; b < binEnd; b++) {
            sum += freqData[b];
          }
          const avg = sum / (binEnd - binStart || 1);
          const barHeight = Math.max(4, (avg / 255) * (h - 28));

          const x = i * (barWidth + 8);
          const y = h - 20 - barHeight;

          // Bar Gradient
          const gradient = ctx.createLinearGradient(0, y, 0, h - 20);
          gradient.addColorStop(0, '#22d3ee'); // Cyan
          gradient.addColorStop(0.5, '#3b82f6'); // Blue
          gradient.addColorStop(1, '#6366f1'); // Indigo

          ctx.fillStyle = gradient;
          ctx.beginPath();
          ctx.roundRect(x, y, barWidth, barHeight, [4, 4, 0, 0]);
          ctx.fill();

          // Peak cap
          ctx.fillStyle = '#38bdf8';
          ctx.fillRect(x, Math.max(0, y - 3), barWidth, 2);

          // Frequency Label
          ctx.fillStyle = '#94a3b8';
          ctx.font = '10px monospace';
          ctx.textAlign = 'center';
          ctx.fillText(FREQUENCY_LABELS[i], x + barWidth / 2, h - 4);
        }
      } else if (visualMode === 'waveform') {
        const waveform = audioEngine.getWaveformData();

        ctx.lineWidth = 2;
        ctx.strokeStyle = '#22d3ee';
        ctx.beginPath();

        const sliceWidth = width / waveform.length;
        let x = 0;

        for (let i = 0; i < waveform.length; i++) {
          const v = waveform[i] / 128.0;
          const y = (v * h) / 2;

          if (i === 0) {
            ctx.moveTo(x, y);
          } else {
            ctx.lineTo(x, y);
          }

          x += sliceWidth;
        }

        ctx.lineTo(width, h / 2);
        ctx.stroke();

        // Zero line
        ctx.strokeStyle = 'rgba(148, 163, 184, 0.2)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(0, h / 2);
        ctx.lineTo(width, h / 2);
        ctx.stroke();
      } else if (visualMode === 'spectrogram') {
        const freqData = audioEngine.getFrequencyData();
        const numCols = freqData.length;
        const colWidth = width / numCols;

        for (let i = 0; i < numCols; i++) {
          const val = freqData[i];
          const hue = 220 - (val / 255) * 180; // Blue to Cyan to Red
          ctx.fillStyle = `hsl(${hue}, 90%, ${Math.max(10, (val / 255) * 60)}%)`;
          ctx.fillRect(i * colWidth, 0, colWidth + 1, h);
        }
      }

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, [visualMode]);

  return (
    <div className="bg-slate-950 border border-slate-800 rounded-xl p-3 relative shadow-inner">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
          <span className="text-xs font-mono font-medium text-slate-300">
            Real-Time Audio Visualizer ({visualMode.toUpperCase()})
          </span>
        </div>
        <div className="flex items-center gap-1 bg-slate-900 border border-slate-800 rounded-lg p-0.5">
          {(['spectrum', 'waveform', 'spectrogram'] as const).map((m) => (
            <button
              key={m}
              onClick={() => setVisualMode(m)}
              className={`px-2 py-0.5 rounded text-[10px] font-mono capitalize transition-colors ${
                visualMode === m ? 'bg-cyan-500/20 text-cyan-300 font-semibold' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {m}
            </button>
          ))}
        </div>
      </div>

      <canvas
        ref={canvasRef}
        width={700}
        height={height}
        className="w-full rounded-lg bg-slate-950/80 border border-slate-900"
      />
    </div>
  );
};
