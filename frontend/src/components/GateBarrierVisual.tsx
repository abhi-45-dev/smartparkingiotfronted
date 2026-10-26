import React from 'react';

interface GateBarrierVisualProps {
  isOpen: boolean;
  distance: number;
}

export const GateBarrierVisual: React.FC<GateBarrierVisualProps> = ({ isOpen, distance }) => {
  const isVehicleNear = distance < 50;

  return (
    <div className="relative w-full h-24 bg-slate-900/80 rounded-lg p-2 flex items-center justify-between overflow-hidden border border-slate-700/60">
      {/* Road Entry Lane */}
      <div className="absolute inset-0 opacity-20 pointer-events-none">
        <div className="w-full h-1/2 border-b-2 border-dashed border-amber-400/50"></div>
      </div>

      {/* Traffic Signal Pillar */}
      <div className="z-10 flex flex-col items-center bg-slate-800 p-2 rounded border border-slate-700 shadow-md">
        <div className="text-[10px] font-mono uppercase text-slate-400 mb-1">Signal</div>
        <div className="flex gap-1.5">
          {/* Red Signal */}
          <div
            className={`w-3.5 h-3.5 rounded-full transition-all duration-300 ${
              !isOpen
                ? 'bg-red-500 shadow-[0_0_10px_#ef4444]'
                : 'bg-red-950/40 border border-red-900/30'
            }`}
          />
          {/* Green Signal */}
          <div
            className={`w-3.5 h-3.5 rounded-full transition-all duration-300 ${
              isOpen
                ? 'bg-emerald-500 shadow-[0_0_10px_#10b981]'
                : 'bg-emerald-950/40 border border-emerald-900/30'
            }`}
          />
        </div>
      </div>

      {/* Animated Servo Barrier Gate Arm */}
      <div className="relative z-10 flex-1 px-4 flex items-center justify-center">
        <svg viewBox="0 0 200 60" className="w-full h-16">
          {/* Base Stanchion */}
          <rect x="25" y="35" width="20" height="25" rx="3" fill="#334155" stroke="#64748b" strokeWidth="1.5" />
          <circle cx="35" cy="38" r="6" fill="#0f172a" stroke="#94a3b8" strokeWidth="1.5" />

          {/* Boom Barrier Arm: Rotates around (35, 38) */}
          {/* CLOSED (90 deg servo) = Horizontal (0 deg in SVG) */}
          {/* OPEN (0 deg servo) = Vertical (-75 deg in SVG) */}
          <g
            className="transition-transform duration-500 ease-out origin-[35px_38px]"
            style={{
              transform: isOpen ? 'rotate(-72deg)' : 'rotate(0deg)',
            }}
          >
            {/* Striped Boom Arm */}
            <rect x="35" y="35" width="135" height="7" rx="2" fill="#ef4444" />
            <rect x="55" y="35" width="16" height="7" fill="#ffffff" />
            <rect x="85" y="35" width="16" height="7" fill="#ffffff" />
            <rect x="115" y="35" width="16" height="7" fill="#ffffff" />
            <rect x="145" y="35" width="16" height="7" fill="#ffffff" />
            {/* Tip Marker */}
            <circle cx="168" cy="38.5" r="3" fill="#facc15" />
          </g>

          {/* Vehicle Detection Indicator */}
          {isVehicleNear && (
            <g className="animate-pulse">
              <circle cx="185" cy="38" r="5" fill="#f59e0b" />
              <text x="185" y="55" fontSize="8" fill="#f59e0b" textAnchor="middle" fontFamily="sans-serif">
                CAR
              </text>
            </g>
          )}
        </svg>
      </div>

      {/* Barrier Angle Badge */}
      <div className="z-10 text-right pr-1">
        <div className="text-[10px] text-slate-400 font-mono">SERVO PIN 18</div>
        <div
          className={`text-xs font-bold font-mono px-2 py-0.5 rounded border inline-block ${
            isOpen
              ? 'bg-emerald-950/80 text-emerald-400 border-emerald-500/40'
              : 'bg-red-950/80 text-red-400 border-red-500/40'
          }`}
        >
          {isOpen ? '0° (OPEN)' : '90° (LOCKED)'}
        </div>
      </div>
    </div>
  );
};
