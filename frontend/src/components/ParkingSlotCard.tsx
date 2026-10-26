import React from 'react';
import { SlotHardwareMetadata } from '../types/parking';
import { Cpu, ArrowDown } from 'lucide-react';

interface ParkingSlotCardProps {
  slotMeta: SlotHardwareMetadata;
  isOccupied: boolean;
  distance: number;
  isDemoMode?: boolean;
  onToggle?: () => void;
}

export const ParkingSlotCard: React.FC<ParkingSlotCardProps> = ({
  slotMeta,
  isOccupied,
  distance,
  isDemoMode = false,
  onToggle,
}) => {
  return (
    <div
      onClick={isDemoMode ? onToggle : undefined}
      className={`relative group rounded-xl p-4 transition-all duration-300 border flex flex-col justify-between overflow-hidden ${
        isDemoMode ? 'cursor-pointer hover:scale-[1.02]' : ''
      } ${
        isOccupied
          ? 'bg-gradient-to-b from-red-950/40 to-slate-900/90 border-red-500/70 shadow-glow-red'
          : 'bg-gradient-to-b from-emerald-950/30 to-slate-900/90 border-emerald-500/70 shadow-glow-green'
      }`}
    >
      {/* Background Parking Spot Border Lines */}
      <div className="absolute inset-0 pointer-events-none border-2 border-dashed border-slate-700/30 rounded-xl m-1"></div>

      {/* Top Header: Bay ID & Occupancy Badge */}
      <div className="relative z-10 flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="text-xs font-mono font-bold tracking-widest text-slate-400">
            BAY #{slotMeta.id}
          </span>
          <h3 className="text-lg font-black tracking-tight text-white">{slotMeta.label}</h3>
        </div>

        {/* Occupancy Pill Badge */}
        <div
          className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold font-mono tracking-wider transition-colors duration-300 ${
            isOccupied
              ? 'bg-red-500/20 text-red-400 border border-red-500/50'
              : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/50'
          }`}
        >
          <span
            className={`w-2 h-2 rounded-full ${
              isOccupied ? 'bg-red-500 animate-pulse' : 'bg-emerald-400'
            }`}
          />
          {isOccupied ? 'OCCUPIED' : 'AVAILABLE'}
        </div>
      </div>

      {/* Center Visual: Car Graphic or Empty Bay Marking */}
      <div className="relative z-10 my-2 h-36 flex items-center justify-center">
        {isOccupied ? (
          // Top-Down Sleek Sports Car SVG
          <div className="relative w-28 h-32 flex items-center justify-center animate-in fade-in zoom-in-95 duration-300">
            <svg viewBox="0 0 100 160" className="w-full h-full drop-shadow-[0_10px_15px_rgba(239,68,68,0.3)]">
              {/* Car Body Shadow */}
              <rect x="18" y="15" width="64" height="130" rx="18" fill="#000000" opacity="0.5" />
              {/* Wheels */}
              <rect x="10" y="30" width="8" height="22" rx="3" fill="#1e293b" />
              <rect x="82" y="30" width="8" height="22" rx="3" fill="#1e293b" />
              <rect x="10" y="105" width="8" height="24" rx="3" fill="#1e293b" />
              <rect x="82" y="105" width="8" height="24" rx="3" fill="#1e293b" />
              {/* Main Chassis */}
              <rect x="16" y="12" width="68" height="136" rx="20" fill="#dc2626" stroke="#ef4444" strokeWidth="2" />
              {/* Front Hood Line */}
              <path d="M 24 35 Q 50 42 76 35" stroke="#991b1b" strokeWidth="2" fill="none" />
              {/* Headlights */}
              <path d="M 22 18 L 32 20 L 26 26 Z" fill="#fef08a" />
              <path d="M 78 18 L 68 20 L 74 26 Z" fill="#fef08a" />
              {/* Windshield */}
              <path d="M 25 45 L 75 45 L 70 70 L 30 70 Z" fill="#0f172a" stroke="#334155" strokeWidth="1.5" />
              {/* Roof */}
              <rect x="28" y="70" width="44" height="34" rx="4" fill="#b91c1c" />
              {/* Rear Windshield */}
              <path d="M 30 104 L 70 104 L 74 122 L 26 122 Z" fill="#0f172a" stroke="#334155" strokeWidth="1.5" />
              {/* Tail Lights */}
              <rect x="22" y="142" width="12" height="4" rx="2" fill="#f87171" />
              <rect x="66" y="142" width="12" height="4" rx="2" fill="#f87171" />
            </svg>
          </div>
        ) : (
          // Empty Bay Marking with Drive-in Chevron
          <div className="w-full h-full border border-dashed border-emerald-500/30 rounded-lg flex flex-col items-center justify-center p-4 bg-emerald-500/[0.03]">
            <div className="w-10 h-10 rounded-full bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 mb-2">
              <ArrowDown className="w-5 h-5 animate-bounce" />
            </div>
            <span className="text-xs font-mono font-medium text-emerald-400/80 uppercase tracking-widest">
              Ready for Parking
            </span>
            <span className="text-[10px] text-slate-500 mt-1">Drive Forward</span>
          </div>
        )}
      </div>

      {/* Middle Row: Live Ultrasonic Distance */}
      <div className="relative z-10 flex items-center justify-between py-2 border-t border-slate-700/40">
        <span className="text-xs text-slate-400 font-medium">Distance Sensor:</span>
        <div className="flex items-baseline gap-1 font-mono">
          <span
            className={`text-xl font-bold tracking-tight ${
              isOccupied ? 'text-red-400' : 'text-emerald-400'
            }`}
          >
            {distance >= 999 ? 'CLEAR (>4m)' : `${distance}`}
          </span>
          {distance < 999 && <span className="text-xs text-slate-400">cm</span>}
        </div>
      </div>

      {/* Card Footer: Hardware Metadata */}
      <div className="relative z-10 pt-2 border-t border-slate-800/80 flex items-center justify-between text-[11px] font-mono text-slate-400">
        <div className="flex items-center gap-1.5">
          <Cpu className="w-3.5 h-3.5 text-cyan-400" />
          <span className="text-slate-300 font-semibold">{slotMeta.muxChannel}</span>
          <span className="text-slate-500">•</span>
          <span className="text-slate-300">Trig Pin {slotMeta.triggerPin}</span>
        </div>
        <span className="text-[10px] text-slate-500">{slotMeta.echoPin}</span>
      </div>

      {isDemoMode && (
        <div className="absolute top-1 right-1 text-[9px] font-mono bg-violet-600/80 text-white px-1.5 py-0.5 rounded">
          Click to Toggle
        </div>
      )}
    </div>
  );
};
