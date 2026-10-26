import React from 'react';
import { ParkingSlotCard } from './ParkingSlotCard';
import { PARKING_SLOTS_METADATA } from '../types/parking';

interface ParkingGridProps {
  slots: [boolean, boolean, boolean, boolean];
  distances: [number, number, number, number];
  isDemoMode?: boolean;
  onToggleSlot?: (index: number) => void;
}

export const ParkingGrid: React.FC<ParkingGridProps> = ({
  slots,
  distances,
  isDemoMode = false,
  onToggleSlot,
}) => {
  return (
    <div className="relative rounded-2xl p-6 bg-slate-900/90 border border-slate-800 shadow-2xl overflow-hidden">
      {/* Parking Lot Header */}
      <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-800">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
            <span>2×2 Interactive Parking Grid</span>
            <span className="text-xs font-mono font-normal px-2 py-0.5 rounded bg-cyan-950/80 text-cyan-400 border border-cyan-800/40">
              CD74HC4067 MUX
            </span>
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Real-time ultrasonic occupancy detection (<span className="text-red-400">&lt;100 cm = Occupied</span>,{' '}
            <span className="text-emerald-400">&ge;100 cm = Available</span>)
          </p>
        </div>
      </div>

      {/* Main Parking Yard / Asphalt Road Layout */}
      <div className="relative p-4 rounded-xl bg-[#0f172a] border border-slate-800/90 shadow-inner">
        {/* Top Row: Slot 1 & Slot 2 */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <ParkingSlotCard
            slotMeta={PARKING_SLOTS_METADATA[0]}
            isOccupied={slots[0]}
            distance={distances[0]}
            isDemoMode={isDemoMode}
            onToggle={() => onToggleSlot?.(0)}
          />
          <ParkingSlotCard
            slotMeta={PARKING_SLOTS_METADATA[1]}
            isOccupied={slots[1]}
            distance={distances[1]}
            isDemoMode={isDemoMode}
            onToggle={() => onToggleSlot?.(1)}
          />
        </div>

        {/* Central Driveway / Driving Lane Road Texture */}
        <div className="my-5 py-3 px-6 rounded-lg bg-slate-950/70 border-y border-dashed border-amber-400/40 flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs font-mono text-amber-300/80 tracking-wider">
            <span>&#9654;&#9654;</span>
            <span className="uppercase font-semibold">One-Way Circulation Aisle</span>
          </div>

          {/* White Center Dashed Line */}
          <div className="hidden sm:flex flex-1 mx-6 items-center justify-center gap-4">
            <span className="w-12 h-1 bg-white/40 rounded"></span>
            <span className="w-12 h-1 bg-white/40 rounded"></span>
            <span className="w-12 h-1 bg-white/40 rounded"></span>
            <span className="w-12 h-1 bg-white/40 rounded"></span>
          </div>

          <div className="text-xs font-mono text-slate-400">
            SPEED LIMIT <span className="text-amber-400 font-bold">5 KM/H</span>
          </div>
        </div>

        {/* Bottom Row: Slot 3 & Slot 4 */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <ParkingSlotCard
            slotMeta={PARKING_SLOTS_METADATA[2]}
            isOccupied={slots[2]}
            distance={distances[2]}
            isDemoMode={isDemoMode}
            onToggle={() => onToggleSlot?.(2)}
          />
          <ParkingSlotCard
            slotMeta={PARKING_SLOTS_METADATA[3]}
            isOccupied={slots[3]}
            distance={distances[3]}
            isDemoMode={isDemoMode}
            onToggle={() => onToggleSlot?.(3)}
          />
        </div>
      </div>
    </div>
  );
};
