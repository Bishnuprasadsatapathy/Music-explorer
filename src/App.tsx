import React, { useState } from 'react';
import { Navbar } from './components/Navbar';
import { DashboardView } from './components/DashboardView';
import { EqualizerView } from './components/EqualizerView';
import { AutoEQView } from './components/AutoEQView';
import { RoomCalibrationView } from './components/RoomCalibrationView';
import { AIAssistantView } from './components/AIAssistantView';
import { ESP32HardwareView } from './components/ESP32HardwareView';

import { DEMO_DEVICES, DEMO_PRESETS } from './data/mockAudio';
import { AudioDevice, EQPreset } from './types';
import { audioEngine } from './services/audioEngine';

export default function App() {
  const [devices, setDevices] = useState<AudioDevice[]>(DEMO_DEVICES);
  const [selectedDevice, setSelectedDevice] = useState<AudioDevice>(DEMO_DEVICES[0]);
  const [activeTab, setActiveTab] = useState<string>('dashboard');
  
  const [activePreset, setActivePreset] = useState<EQPreset>(DEMO_PRESETS[1]); // Music
  const [currentBands, setCurrentBands] = useState<number[]>(DEMO_PRESETS[1].bands);
  
  const [volume, setVolume] = useState<number>(70);
  const [isAudioEngineActive, setIsAudioEngineActive] = useState<boolean>(false);

  const handleSelectDevice = (device: AudioDevice) => {
    setSelectedDevice(device);
    setCurrentBands(device.eqBands);
    setVolume(device.volume);
    audioEngine.set10BandEQ(device.eqBands);
    audioEngine.setVolume(device.volume);
  };

  const handleUpdateDevice = (updated: Partial<AudioDevice>) => {
    const newDevice = { ...selectedDevice, ...updated };
    setSelectedDevice(newDevice);
    setDevices((prev) => prev.map((d) => (d.id === newDevice.id ? newDevice : d)));
  };

  const handleVolumeChange = (vol: number) => {
    setVolume(vol);
    audioEngine.setVolume(vol);
    handleUpdateDevice({ volume: vol });
  };

  const handleToggleAudioEngine = () => {
    const nextState = !isAudioEngineActive;
    setIsAudioEngineActive(nextState);
    if (nextState) {
      audioEngine.startSynthPlayback('synthwave');
    } else {
      audioEngine.stopPlayback();
    }
  };

  const handleApplyBands = (bands: number[], bass = 0, mid = 0, treble = 0) => {
    setCurrentBands(bands);
    handleUpdateDevice({ eqBands: bands, bass, mid, treble });
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans selection:bg-cyan-500 selection:text-slate-950">
      
      {/* Top Navbar */}
      <Navbar
        devices={devices}
        selectedDevice={selectedDevice}
        onSelectDevice={handleSelectDevice}
        volume={volume}
        onVolumeChange={handleVolumeChange}
        isAudioEngineActive={isAudioEngineActive}
        onToggleAudioEngine={handleToggleAudioEngine}
        activeTab={activeTab}
        onTabChange={setActiveTab}
      />

      {/* Main View Container */}
      <main className="max-w-7xl mx-auto px-4 lg:px-8 py-6">
        {activeTab === 'dashboard' && (
          <DashboardView
            device={selectedDevice}
            onUpdateDevice={handleUpdateDevice}
            activePreset={activePreset}
            onSelectPreset={setActivePreset}
            onNavigateToTab={setActiveTab}
          />
        )}

        {activeTab === 'equalizer' && (
          <EqualizerView
            currentBands={currentBands}
            onBandsChange={handleApplyBands}
            activePreset={activePreset}
            onSelectPreset={setActivePreset}
          />
        )}

        {activeTab === 'autoeq' && (
          <AutoEQView
            device={selectedDevice}
            currentBands={currentBands}
            onApplyEQ={(bands, b, m, t) => {
              handleApplyBands(bands, b, m, t);
            }}
          />
        )}

        {activeTab === 'room' && (
          <RoomCalibrationView
            device={selectedDevice}
            onApplyRoomCorrection={(bands) => {
              handleApplyBands(bands);
            }}
          />
        )}

        {activeTab === 'assistant' && (
          <AIAssistantView
            device={selectedDevice}
            currentBands={currentBands}
            onApplyAssistantEQ={(bands, b, m, t) => {
              handleApplyBands(bands, b, m, t);
            }}
          />
        )}

        {activeTab === 'hardware' && (
          <ESP32HardwareView />
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-900 bg-slate-950 text-slate-500 text-xs py-6 mt-12">
        <div className="max-w-7xl mx-auto px-4 lg:px-8 flex flex-col md:flex-row items-center justify-between gap-4 font-mono">
          <div>
            <span className="text-slate-300 font-bold">SonicAI Platform</span> — AI-Powered Smart Sound System & DSP Audio Engine
          </div>
          <div className="flex items-center gap-4 text-[11px]">
            <span>Web Audio API</span>
            <span>•</span>
            <span>Gemini 3.6 Flash AI</span>
            <span>•</span>
            <span>ESP32 I2S Telemetry</span>
          </div>
        </div>
      </footer>

    </div>
  );
}
