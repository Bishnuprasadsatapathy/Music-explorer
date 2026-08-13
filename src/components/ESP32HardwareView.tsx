import React, { useState, useEffect } from 'react';
import { Cpu, Wifi, Zap, Activity, ShieldAlert, Terminal, RefreshCw, Volume2, Power } from 'lucide-react';
import { ESP32Telemetry } from '../types';
import { INITIAL_ESP32_TELEMETRY } from '../data/mockAudio';

export const ESP32HardwareView: React.FC = () => {
  const [telemetry, setTelemetry] = useState<ESP32Telemetry>(INITIAL_ESP32_TELEMETRY);
  const [isMuted, setIsMuted] = useState(false);

  // Live telemetry simulation
  useEffect(() => {
    const interval = setInterval(() => {
      setTelemetry((prev) => {
        const cpu = Number((15 + Math.random() * 8).toFixed(1));
        const heap = 280 + Math.floor(Math.random() * 10);
        const rssi = -42 + Math.floor(Math.random() * 5);
        const temp = Number((41 + Math.random() * 1.5).toFixed(1));
        const watts = Number((22 + Math.random() * 6).toFixed(1));

        return {
          ...prev,
          cpuUsage: cpu,
          freeHeapKb: heap,
          wifiRssi: rssi,
          ampTemperatureC: temp,
          outputWattage: watts,
        };
      });
    }, 1500);

    return () => clearInterval(interval);
  }, []);

  const handleAction = (msg: string) => {
    const newLog = {
      timestamp: new Date().toLocaleTimeString('en-US', { hour12: false }),
      level: 'DSP' as const,
      message: msg,
    };
    setTelemetry((prev) => ({
      ...prev,
      serialLogs: [newLog, ...prev.serialLogs.slice(0, 15)],
    }));
  };

  return (
    <div className="space-y-6">
      
      {/* Hero Banner */}
      <div className="bg-gradient-to-r from-amber-950 via-slate-900 to-indigo-950 border border-amber-500/30 rounded-2xl p-6 lg:p-8 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 max-w-3xl space-y-3">
          <div className="inline-flex items-center gap-2 bg-amber-500/10 border border-amber-500/30 px-3 py-1 rounded-full text-xs font-mono font-bold text-amber-300">
            <Cpu className="w-4 h-4 text-amber-400" />
            <span>HARDWARE & IOT PROTOTYPE SIMULATOR</span>
          </div>

          <h1 className="text-3xl font-extrabold text-white tracking-tight">
            ESP32-S3 + PCM5102A I2S Smart Speaker Pipeline
          </h1>

          <p className="text-slate-300 text-sm leading-relaxed">
            Real-time IoT telemetry and hardware architecture simulation. The SonicAI platform communicates over Wi-Fi/MQTT or BLE directly with the microcontroller to set 10-band biquad hardware filter coefficients in real time.
          </p>
        </div>
      </div>

      {/* Visual Hardware Architecture Block Diagram */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
        <h2 className="text-xs font-bold text-slate-300 uppercase tracking-wider font-mono">
          Hardware Block Architecture Diagram
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-5 gap-3 text-center text-xs font-mono">
          
          <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2">
            <div className="w-8 h-8 rounded-lg bg-cyan-500/10 text-cyan-400 flex items-center justify-center mx-auto">
              <Wifi className="w-4 h-4" />
            </div>
            <span className="font-bold text-slate-200 block">SonicAI Web / Phone</span>
            <span className="text-[10px] text-slate-500 block">Wi-Fi 6 / BLE 5.3</span>
          </div>

          <div className="hidden md:flex items-center justify-center text-slate-600 font-bold">→</div>

          <div className="bg-slate-950 p-4 rounded-xl border border-amber-500/30 space-y-2">
            <div className="w-8 h-8 rounded-lg bg-amber-500/10 text-amber-400 flex items-center justify-center mx-auto">
              <Cpu className="w-4 h-4" />
            </div>
            <span className="font-bold text-amber-300 block">ESP32-S3 Dual Core</span>
            <span className="text-[10px] text-slate-500 block">240MHz • DSP Biquad Pipeline</span>
          </div>

          <div className="hidden md:flex items-center justify-center text-slate-600 font-bold">→</div>

          <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center mx-auto">
              <Zap className="w-4 h-4" />
            </div>
            <span className="font-bold text-emerald-300 block">PCM5102A I2S DAC + Amp</span>
            <span className="text-[10px] text-slate-500 block">96kHz / 24-bit 50W RMS</span>
          </div>

        </div>
      </div>

      {/* Telemetry Gauges Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        <div className="bg-slate-900 p-4 rounded-2xl border border-slate-800 font-mono space-y-1">
          <span className="text-[10px] text-slate-500 uppercase block">MCU CPU Usage</span>
          <div className="text-xl font-bold text-amber-400">{telemetry.cpuUsage}%</div>
          <span className="text-[10px] text-slate-400">Core 0 & Core 1</span>
        </div>

        <div className="bg-slate-900 p-4 rounded-2xl border border-slate-800 font-mono space-y-1">
          <span className="text-[10px] text-slate-500 uppercase block">Free PSRAM Heap</span>
          <div className="text-xl font-bold text-cyan-400">{telemetry.freeHeapKb} KB</div>
          <span className="text-[10px] text-slate-400">DMA Buffer Active</span>
        </div>

        <div className="bg-slate-900 p-4 rounded-2xl border border-slate-800 font-mono space-y-1">
          <span className="text-[10px] text-slate-500 uppercase block">Wi-Fi Signal</span>
          <div className="text-xl font-bold text-emerald-400">{telemetry.wifiRssi} dBm</div>
          <span className="text-[10px] text-slate-400">SonicNet_5G</span>
        </div>

        <div className="bg-slate-900 p-4 rounded-2xl border border-slate-800 font-mono space-y-1">
          <span className="text-[10px] text-slate-500 uppercase block">I2S DAC Sample Rate</span>
          <div className="text-xl font-bold text-indigo-400">96 kHz</div>
          <span className="text-[10px] text-slate-400">24-bit PCM Depth</span>
        </div>

        <div className="bg-slate-900 p-4 rounded-2xl border border-slate-800 font-mono space-y-1">
          <span className="text-[10px] text-slate-500 uppercase block">Amplifier Temp</span>
          <div className="text-xl font-bold text-rose-400">{telemetry.ampTemperatureC} °C</div>
          <span className="text-[10px] text-slate-400">Thermal Nominal</span>
        </div>

        <div className="bg-slate-900 p-4 rounded-2xl border border-slate-800 font-mono space-y-1">
          <span className="text-[10px] text-slate-500 uppercase block">Output Power</span>
          <div className="text-xl font-bold text-teal-400">{telemetry.outputWattage} W</div>
          <span className="text-[10px] text-slate-400">RMS Class-D</span>
        </div>
      </div>

      {/* Hardware Actions & Serial Terminal */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Controls Column (5 cols) */}
        <div className="lg:col-span-5 bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
          <h2 className="text-xs font-bold text-slate-300 uppercase tracking-wider font-mono border-b border-slate-800 pb-3">
            Hardware Trigger Commands
          </h2>

          <div className="space-y-3">
            <button
              onClick={() => handleAction('Hardware Soft Reset executed. Re-initializing I2S bus.')}
              className="w-full flex items-center justify-between p-3 bg-slate-950 hover:bg-slate-800 border border-slate-800 rounded-xl text-xs font-mono text-slate-200 transition-colors"
            >
              <div className="flex items-center gap-2">
                <RefreshCw className="w-4 h-4 text-cyan-400" />
                <span>Soft Reset MCU</span>
              </div>
              <span className="text-[10px] text-slate-500">RESET_PIN</span>
            </button>

            <button
              onClick={() => handleAction('I2S DMA Ring Buffer flushed and resynchronized.')}
              className="w-full flex items-center justify-between p-3 bg-slate-950 hover:bg-slate-800 border border-slate-800 rounded-xl text-xs font-mono text-slate-200 transition-colors"
            >
              <div className="flex items-center gap-2">
                <Zap className="w-4 h-4 text-amber-400" />
                <span>Flush I2S DMA Buffer</span>
              </div>
              <span className="text-[10px] text-slate-500">I2S_DMA</span>
            </button>

            <button
              onClick={() => {
                setIsMuted(!isMuted);
                handleAction(`Amplifier hardware mute set to ${!isMuted}.`);
              }}
              className="w-full flex items-center justify-between p-3 bg-slate-950 hover:bg-slate-800 border border-slate-800 rounded-xl text-xs font-mono text-slate-200 transition-colors"
            >
              <div className="flex items-center gap-2">
                <Power className="w-4 h-4 text-rose-400" />
                <span>{isMuted ? 'Unmute Hardware Amp' : 'Mute Hardware Amp'}</span>
              </div>
              <span className="text-[10px] text-slate-500">GPIO_4</span>
            </button>
          </div>
        </div>

        {/* Serial Terminal Logs (7 cols) */}
        <div className="lg:col-span-7 bg-slate-950 border border-slate-800 rounded-2xl p-5 font-mono shadow-xl space-y-3">
          <div className="flex items-center justify-between border-b border-slate-800 pb-2">
            <div className="flex items-center gap-2 text-xs font-bold text-slate-300">
              <Terminal className="w-4 h-4 text-amber-400" />
              <span>ESP32-S3 Live Serial Console</span>
            </div>
            <span className="text-[10px] text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded">
              115200 Baud
            </span>
          </div>

          <div className="h-48 overflow-y-auto space-y-1 text-[11px] no-scrollbar">
            {telemetry.serialLogs.map((log, idx) => (
              <div key={idx} className="flex items-start gap-2 text-slate-300">
                <span className="text-slate-500">[{log.timestamp}]</span>
                <span className={log.level === 'DSP' ? 'text-amber-400 font-bold' : 'text-cyan-400'}>
                  [{log.level}]
                </span>
                <span className="text-slate-300">{log.message}</span>
              </div>
            ))}
          </div>
        </div>

      </div>

    </div>
  );
};
