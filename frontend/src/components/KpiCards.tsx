import React from 'react';
import { ParkingTelemetry } from '../types/parking';
import { GateBarrierVisual } from './GateBarrierVisual';
import { Car, ShieldCheck, ShieldAlert, Radio, Activity } from 'lucide-react';

interface KpiCardsProps {
  telemetry: ParkingTelemetry | null;
}

export const KpiCards: React.FC<KpiCardsProps> = ({ telemetry }) => {
  const free = telemetry?.free ?? 4;
  const total = telemetry?.total ?? 4;
  const occupiedCount = total - free;
  const occupancyPercentage = Math.round((occupiedCount / total) * 100);
  const isLotOpen = free > 0;
  const isGateOpen = telemetry?.gateOpen ?? false;
  const gateDist = telemetry?.gateDist ?? 999;
  const isVehicleAtGate = gateDist < 50;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      {/* 1. Parking Lot Status Card */}
      <div className="relative rounded-xl p-5 bg-slate-900/90 border border-slate-800 shadow-lg flex flex-col justify-between overflow-hidden">
        <div className="flex items-center justify-between text-slate-400 mb-2">
          <span className="text-xs font-mono uppercase tracking-wider">Lot Status</span>
          {isLotOpen ? (
            <ShieldCheck className="w-5 h-5 text-emerald-400" />
          ) : (
            <ShieldAlert className="w-5 h-5 text-red-400" />
          )}
        </div>

        <div className="my-2">
          <div
            className={`text-3xl font-black tracking-tight inline-flex items-center gap-2.5 ${
              isLotOpen ? 'text-emerald-400' : 'text-red-400'
            }`}
          >
            <span
              className={`w-3.5 h-3.5 rounded-full ${
                isLotOpen ? 'bg-emerald-500 shadow-[0_0_12px_#10b981]' : 'bg-red-500 shadow-[0_0_12px_#ef4444]'
              }`}
            />
            {isLotOpen ? 'OPEN' : 'FULL'}
          </div>
        </div>

        <div className="text-xs text-slate-400 font-medium pt-2 border-t border-slate-800/80 flex items-center justify-between">
          <span>Availability:</span>
          <span className={isLotOpen ? 'text-emerald-400 font-bold' : 'text-red-400 font-bold'}>
            {isLotOpen ? `${free} Bays Free` : 'No Bays Available'}
          </span>
        </div>
      </div>

      {/* 2. Available Capacity Card */}
      <div className="relative rounded-xl p-5 bg-slate-900/90 border border-slate-800 shadow-lg flex flex-col justify-between overflow-hidden">
        <div className="flex items-center justify-between text-slate-400 mb-2">
          <span className="text-xs font-mono uppercase tracking-wider">Available Capacity</span>
          <Car className="w-5 h-5 text-cyan-400" />
        </div>

        <div className="my-1">
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-black text-white font-mono">{free}</span>
            <span className="text-sm text-slate-400 font-mono">/ {total} SLOTS FREE</span>
          </div>

          {/* Visual Occupancy Progress Bar */}
          <div className="mt-3">
            <div className="w-full bg-slate-800 rounded-full h-2.5 overflow-hidden">
              <div
                className={`h-2.5 rounded-full transition-all duration-500 ${
                  occupancyPercentage >= 100
                    ? 'bg-red-500 shadow-[0_0_10px_#ef4444]'
                    : occupancyPercentage >= 50
                    ? 'bg-amber-500'
                    : 'bg-emerald-500'
                }`}
                style={{ width: `${occupancyPercentage}%` }}
              />
            </div>
          </div>
        </div>

        <div className="text-xs text-slate-400 font-medium pt-2 border-t border-slate-800/80 flex items-center justify-between">
          <span>Occupancy:</span>
          <span className="text-white font-mono font-semibold">{occupancyPercentage}% Occupied</span>
        </div>
      </div>

      {/* 3. Entrance Boom Barrier Card */}
      <div className="relative rounded-xl p-5 bg-slate-900/90 border border-slate-800 shadow-lg flex flex-col justify-between overflow-hidden">
        <div className="flex items-center justify-between text-slate-400 mb-1">
          <span className="text-xs font-mono uppercase tracking-wider">Boom Barrier</span>
          <Activity className="w-5 h-5 text-amber-400" />
        </div>

        {/* Animated Boom Barrier Graphic */}
        <div className="my-1">
          <GateBarrierVisual isOpen={isGateOpen} distance={gateDist} />
        </div>

        <div className="text-xs text-slate-400 font-medium pt-2 border-t border-slate-800/80 flex items-center justify-between">
          <span>Servo State:</span>
          <span className={isGateOpen ? 'text-emerald-400 font-bold' : 'text-slate-300 font-bold'}>
            {isGateOpen ? 'Barrier Open (0°)' : 'Barrier Locked (90°)'}
          </span>
        </div>
      </div>

      {/* 4. Gate Sensor Distance Card */}
      <div className="relative rounded-xl p-5 bg-slate-900/90 border border-slate-800 shadow-lg flex flex-col justify-between overflow-hidden">
        <div className="flex items-center justify-between text-slate-400 mb-2">
          <span className="text-xs font-mono uppercase tracking-wider">Gate Sensor (Pin 19)</span>
          <Radio className={`w-5 h-5 ${isVehicleAtGate ? 'text-amber-400 animate-pulse' : 'text-slate-500'}`} />
        </div>

        <div className="my-2">
          <div className="flex items-baseline gap-1.5 font-mono">
            <span
              className={`text-3xl font-black tracking-tight ${
                isVehicleAtGate ? 'text-amber-400' : 'text-white'
              }`}
            >
              {gateDist >= 999 ? 'CLEAR' : gateDist}
            </span>
            {gateDist < 999 && <span className="text-sm text-slate-400">cm</span>}
          </div>
        </div>

        <div className="text-xs pt-2 border-t border-slate-800/80 flex items-center justify-between">
          <span className="text-slate-400">Approach Status:</span>
          {isVehicleAtGate ? (
            <span className="px-2 py-0.5 rounded text-[11px] font-mono font-bold bg-amber-950/80 text-amber-300 border border-amber-500/40 animate-pulse">
              CAR DETECTED (&lt;50cm)
            </span>
          ) : (
            <span className="text-slate-400 font-mono text-[11px]">NO VEHICLE (&ge;50cm)</span>
          )}
        </div>
      </div>
    </div>
  );
};
