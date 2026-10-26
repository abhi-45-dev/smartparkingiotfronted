import React from 'react';
import { ParkingTelemetry } from '../types/parking';
import { Sliders, Car, Shield, Play, Pause } from 'lucide-react';

interface DemoControlsProps {
  telemetry: ParkingTelemetry | null;
  onToggleSlot: (index: number, occupied: boolean) => void;
  onToggleGate: () => void;
  onExitDemo: () => void;
}

export const DemoControls: React.FC<DemoControlsProps> = ({
  telemetry,
  onToggleSlot,
  onToggleGate,
  onExitDemo,
}) => {
  const [autoCycle, setAutoCycle] = React.useState(false);

  // Auto cycle effect for automated demo presentation
  React.useEffect(() => {
    if (!autoCycle) return;
    const interval = setInterval(() => {
      // Pick random slot to flip
      const randomSlot = Math.floor(Math.random() * 4);
      if (telemetry) {
        onToggleSlot(randomSlot, !telemetry.slots[randomSlot]);
      }
    }, 2000);
    return () => clearInterval(interval);
  }, [autoCycle, telemetry, onToggleSlot]);

  if (!telemetry) return null;

  return (
    <div className="mb-6 p-4 rounded-2xl bg-gradient-to-r from-violet-950/80 via-slate-900 to-indigo-950/80 border border-violet-500/50 shadow-2xl animate-in slide-in-from-top-4 duration-300">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        {/* Left: Info */}
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-violet-600 text-white shadow-lg">
            <Sliders className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold text-white font-mono uppercase tracking-wider">
                Interactive Simulation Controls
              </h3>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-violet-500/20 text-violet-300 border border-violet-400/30">
                Local Only &bull; Isolated
              </span>
            </div>
            <p className="text-xs text-slate-300 mt-0.5">
              Simulate sensor events when ESP32 is offline. Real MQTT topic remains untouched.
            </p>
          </div>
        </div>

        {/* Right: Controls */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Individual Slot Toggles */}
          {[0, 1, 2, 3].map((slotIdx) => {
            const isOcc = telemetry.slots[slotIdx];
            return (
              <button
                key={slotIdx}
                onClick={() => onToggleSlot(slotIdx, !isOcc)}
                className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold flex items-center gap-1.5 border transition-all ${
                  isOcc
                    ? 'bg-red-500/20 text-red-300 border-red-500/50 hover:bg-red-500/30'
                    : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/50 hover:bg-emerald-500/30'
                }`}
                title={`Toggle Slot ${slotIdx + 1}`}
              >
                <Car className="w-3.5 h-3.5" />
                <span>S{slotIdx + 1}: {isOcc ? 'OCC' : 'FREE'}</span>
              </button>
            );
          })}

          {/* Gate Barrier Toggle */}
          <button
            onClick={onToggleGate}
            className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold flex items-center gap-1.5 border transition-all ${
              telemetry.gateOpen
                ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/50'
                : 'bg-slate-800 text-slate-300 border-slate-700'
            }`}
            title="Toggle Entrance Barrier"
          >
            <Shield className="w-3.5 h-3.5" />
            <span>Gate: {telemetry.gateOpen ? 'OPEN (0°)' : 'LOCK (90°)'}</span>
          </button>

          {/* Auto Sequence Toggle */}
          <button
            onClick={() => setAutoCycle(!autoCycle)}
            className={`px-3 py-1.5 rounded-lg text-xs font-mono font-medium flex items-center gap-1.5 border transition-all ${
              autoCycle
                ? 'bg-amber-600 text-white border-amber-400'
                : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700'
            }`}
          >
            {autoCycle ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
            <span>{autoCycle ? 'Stop Auto' : 'Auto Sim'}</span>
          </button>

          {/* Exit Demo Mode */}
          <button
            onClick={onExitDemo}
            className="px-3 py-1.5 rounded-lg text-xs font-mono font-medium bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white border border-slate-700 transition-colors"
          >
            Exit
          </button>
        </div>
      </div>
    </div>
  );
};
