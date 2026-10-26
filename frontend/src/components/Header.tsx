import React from 'react';
import { ConnectionStatus } from '../types/parking';
import { QrCode, Cpu, Sliders, RefreshCw, AlertTriangle, Wifi, WifiOff } from 'lucide-react';

interface HeaderProps {
  status: ConnectionStatus;
  isDemoMode: boolean;
  onToggleDemo: () => void;
  onOpenQrModal: () => void;
  onOpenSpecsModal: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  status,
  isDemoMode,
  onToggleDemo,
  onOpenQrModal,
  onOpenSpecsModal,
}) => {
  // Render status badge based on connection state
  const renderStatusBadge = () => {
    switch (status) {
      case 'LIVE':
        return (
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-950/80 border border-emerald-500/60 shadow-glow-green text-emerald-400 text-xs font-mono font-semibold">
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
            </span>
            <span>LIVE • Connected to ESP32</span>
          </div>
        );
      case 'WAITING':
        return (
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-amber-950/70 border border-amber-500/50 text-amber-300 text-xs font-mono font-medium animate-pulse">
            <RefreshCw className="w-3.5 h-3.5 animate-spin" />
            <span>WAITING FOR ESP32 TELEMETRY</span>
          </div>
        );
      case 'STALE':
        return (
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-amber-950/80 border border-amber-500/60 text-amber-400 text-xs font-mono font-semibold">
            <AlertTriangle className="w-3.5 h-3.5" />
            <span>STALE DATA (&gt;3.5s)</span>
          </div>
        );
      case 'RECONNECTING':
        return (
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-amber-950/70 border border-amber-500/50 text-amber-300 text-xs font-mono font-medium">
            <Wifi className="w-3.5 h-3.5 animate-pulse" />
            <span>RECONNECTING TO BROKER...</span>
          </div>
        );
      case 'DISCONNECTED':
        return (
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-red-950/80 border border-red-500/60 text-red-400 text-xs font-mono font-semibold">
            <WifiOff className="w-3.5 h-3.5" />
            <span>DISCONNECTED</span>
          </div>
        );
      case 'DEMO':
        return (
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-violet-950/80 border border-violet-500/60 text-violet-300 text-xs font-mono font-bold animate-pulse">
            <span className="w-2.5 h-2.5 rounded-full bg-violet-400"></span>
            <span>SIMULATION / DEMO MODE ACTIVE</span>
          </div>
        );
    }
  };

  return (
    <header className="relative z-20 mb-6 bg-slate-900/90 border border-slate-800 rounded-2xl p-4 sm:p-5 shadow-2xl backdrop-blur-md">
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        {/* Title and Hardware Badges */}
        <div>
          <div className="flex items-center gap-2.5 flex-wrap">
            <div className="p-2 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-500 text-white shadow-lg shadow-emerald-500/20">
              <Cpu className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-black tracking-tight text-white flex items-center gap-2">
                Smart Parking Live Telemetry Platform
              </h1>
              <p className="text-xs text-slate-400 font-mono flex items-center gap-2 mt-0.5 flex-wrap">
                <span className="text-emerald-400">ESP32 DevKit V4</span>
                <span>•</span>
                <span className="text-cyan-400">CD74HC4067 MUX</span>
                <span>•</span>
                <span className="text-slate-300">broker.emqx.io (WSS 8084)</span>
              </p>
            </div>
          </div>
        </div>

        {/* Right Action Bar: Status & Buttons */}
        <div className="flex items-center gap-3 flex-wrap">
          {/* Status Badge */}
          {renderStatusBadge()}

          {/* Simulate / Demo Mode Toggle */}
          <button
            onClick={onToggleDemo}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium font-mono border transition-all duration-200 ${
              isDemoMode
                ? 'bg-violet-600 text-white border-violet-400 shadow-[0_0_15px_rgba(139,92,246,0.5)]'
                : 'bg-slate-800/90 text-slate-300 hover:text-white border-slate-700 hover:border-slate-600'
            }`}
            title="Toggle simulated sensor inputs for demo testing without physical hardware"
          >
            <Sliders className="w-3.5 h-3.5" />
            <span>{isDemoMode ? 'Exit Demo' : 'Simulate / Demo'}</span>
          </button>

          {/* Enlarge QR Code Button */}
          <button
            onClick={onOpenQrModal}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium font-mono bg-slate-800/90 hover:bg-slate-700/80 text-slate-200 hover:text-white border border-slate-700 transition-colors"
            title="Enlarge QR code for mobile scanning"
          >
            <QrCode className="w-3.5 h-3.5 text-cyan-400" />
            <span>Enlarge QR</span>
          </button>

          {/* Hardware Specs Modal Trigger */}
          <button
            onClick={onOpenSpecsModal}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium font-mono bg-slate-800/90 hover:bg-slate-700/80 text-slate-300 hover:text-white border border-slate-700 transition-colors"
            title="View hardware pinout and CD74HC4067 wiring diagram"
          >
            <Cpu className="w-3.5 h-3.5 text-amber-400" />
            <span>Pinout</span>
          </button>
        </div>
      </div>
    </header>
  );
};
