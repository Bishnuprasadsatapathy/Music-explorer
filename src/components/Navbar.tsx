import React from 'react';
import { Volume2, VolumeX, Bluetooth, Wifi, Battery, Sparkles, Mic, Cpu } from 'lucide-react';
import { AudioDevice } from '../types';

interface NavbarProps {
  devices: AudioDevice[];
  selectedDevice: AudioDevice;
  onSelectDevice: (device: AudioDevice) => void;
  volume: number;
  onVolumeChange: (vol: number) => void;
  isAudioEngineActive: boolean;
  onToggleAudioEngine: () => void;
  activeTab: string;
  onTabChange: (tab: string) => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  devices,
  selectedDevice,
  onSelectDevice,
  volume,
  onVolumeChange,
  isAudioEngineActive,
  onToggleAudioEngine,
  activeTab,
  onTabChange,
}) => {
  const isMuted = volume === 0;

  return (
    <header className="sticky top-0 z-50 bg-slate-900/90 backdrop-blur-md border-b border-slate-800 text-slate-100 px-4 lg:px-8 py-3">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
        
        {/* Brand Logo & Active Device Selector */}
        <div className="flex items-center justify-between w-full md:w-auto gap-4">
          <div 
            className="flex items-center gap-2.5 cursor-pointer group"
            onClick={() => onTabChange('dashboard')}
          >
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-cyan-500 via-blue-600 to-indigo-600 p-0.5 flex items-center justify-center shadow-lg shadow-cyan-500/20 group-hover:scale-105 transition-transform">
              <div className="w-full h-full bg-slate-950 rounded-[10px] flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-cyan-400 animate-pulse" />
              </div>
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-bold text-lg tracking-tight bg-gradient-to-r from-white via-slate-200 to-slate-400 bg-clip-text text-transparent">
                  SonicAI
                </span>
                <span className="text-[10px] font-mono uppercase bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 px-1.5 py-0.5 rounded font-semibold">
                  DSP v2.5
                </span>
              </div>
              <p className="text-[11px] text-slate-400 font-mono">Smart Sound Platform</p>
            </div>
          </div>

          {/* Device Selector */}
          <div className="relative">
            <select
              value={selectedDevice.id}
              onChange={(e) => {
                const found = devices.find((d) => d.id === e.target.value);
                if (found) onSelectDevice(found);
              }}
              className="bg-slate-800/80 hover:bg-slate-800 text-xs font-medium text-slate-200 border border-slate-700/80 rounded-lg px-3 py-1.5 pr-8 focus:outline-none focus:ring-2 focus:ring-cyan-500 cursor-pointer transition-colors"
            >
              {devices.map((d) => (
                <option key={d.id} value={d.id} className="bg-slate-900 text-slate-200">
                  {d.name} ({d.connectionType.toUpperCase()})
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Tab Navigation Links */}
        <nav className="flex items-center gap-1 overflow-x-auto w-full md:w-auto py-1 no-scrollbar text-xs font-medium">
          {[
            { id: 'dashboard', label: 'Dashboard', icon: 'Home' },
            { id: 'equalizer', label: '10-Band EQ', icon: 'Sliders' },
            { id: 'autoeq', label: '✨ AI Auto-EQ', icon: 'Sparkles' },
            { id: 'room', label: 'Room Acoustic', icon: 'Mic' },
            { id: 'assistant', label: 'AI Assistant', icon: 'Bot' },
            { id: 'hardware', label: 'ESP32 IoT', icon: 'Cpu' },
          ].map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => onTabChange(tab.id)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg whitespace-nowrap transition-all ${
                  isActive
                    ? 'bg-cyan-500/15 text-cyan-300 border border-cyan-500/30 font-semibold shadow-sm'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                }`}
              >
                {tab.id === 'autoeq' && <Sparkles className="w-3.5 h-3.5 text-cyan-400" />}
                {tab.id === 'room' && <Mic className="w-3.5 h-3.5 text-emerald-400" />}
                {tab.id === 'hardware' && <Cpu className="w-3.5 h-3.5 text-amber-400" />}
                <span>{tab.label}</span>
              </button>
            );
          })}
        </nav>

        {/* Device Status Pills & Volume Slider */}
        <div className="flex items-center gap-4 w-full md:w-auto justify-end border-t md:border-t-0 border-slate-800 pt-2 md:pt-0">
          
          {/* Status Badges */}
          <div className="flex items-center gap-2 text-xs font-mono bg-slate-950/60 border border-slate-800 px-2.5 py-1 rounded-lg">
            {selectedDevice.connectionType === 'wifi' && (
              <div className="flex items-center gap-1 text-emerald-400" title="Wi-Fi 6 Lossless">
                <Wifi className="w-3.5 h-3.5" />
                <span className="text-[11px]">Wi-Fi</span>
              </div>
            )}
            {selectedDevice.connectionType === 'bluetooth' && (
              <div className="flex items-center gap-1 text-blue-400" title="Bluetooth 5.3">
                <Bluetooth className="w-3.5 h-3.5" />
                <span className="text-[11px]">BLE</span>
              </div>
            )}
            {selectedDevice.connectionType === 'i2s_esp32' && (
              <div className="flex items-center gap-1 text-amber-400" title="ESP32 I2S Hardware">
                <Cpu className="w-3.5 h-3.5" />
                <span className="text-[11px]">I2S</span>
              </div>
            )}

            <div className="w-px h-3 bg-slate-800" />

            <div className="flex items-center gap-1 text-slate-300" title="Battery Level">
              <Battery className="w-3.5 h-3.5 text-slate-400" />
              <span className="text-[11px]">{selectedDevice.batteryLevel}%</span>
            </div>
          </div>

          {/* Web Audio Engine Toggle */}
          <button
            onClick={onToggleAudioEngine}
            className={`px-2.5 py-1 rounded-lg text-xs font-mono font-medium border transition-colors flex items-center gap-1.5 ${
              isAudioEngineActive
                ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                : 'bg-slate-800 text-slate-400 border-slate-700 hover:text-slate-200'
            }`}
            title="Toggle Web Audio DSP Engine"
          >
            <div className={`w-2 h-2 rounded-full ${isAudioEngineActive ? 'bg-emerald-400 animate-ping' : 'bg-slate-500'}`} />
            <span>{isAudioEngineActive ? 'DSP Active' : 'Start Audio'}</span>
          </button>

          {/* Master Volume Slider */}
          <div className="flex items-center gap-2 bg-slate-800/60 border border-slate-700/60 px-2.5 py-1 rounded-lg">
            <button
              onClick={() => onVolumeChange(isMuted ? 70 : 0)}
              className="text-slate-400 hover:text-slate-100 transition-colors"
            >
              {isMuted ? <VolumeX className="w-4 h-4 text-rose-400" /> : <Volume2 className="w-4 h-4 text-cyan-400" />}
            </button>
            <input
              type="range"
              min="0"
              max="100"
              value={volume}
              onChange={(e) => onVolumeChange(Number(e.target.value))}
              className="w-20 lg:w-24 h-1.5 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-cyan-400"
            />
            <span className="text-xs font-mono text-slate-300 w-7 text-right">{volume}%</span>
          </div>

        </div>

      </div>
    </header>
  );
};
