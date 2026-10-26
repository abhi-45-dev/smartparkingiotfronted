import React, { useEffect } from 'react';
import { X, Cpu, Layers, Radio, Activity, CheckCircle2 } from 'lucide-react';

interface HardwareSpecsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const HardwareSpecsModal: React.FC<HardwareSpecsModalProps> = ({
  isOpen,
  onClose,
}) => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="absolute inset-0" onClick={onClose} />

      <div className="relative z-10 w-full max-w-2xl bg-slate-900 border border-slate-700 rounded-3xl p-6 sm:p-8 shadow-2xl max-h-[90vh] overflow-y-auto">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-full bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700 transition-colors"
          title="Close Modal"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="flex items-center gap-3 mb-6 pb-4 border-b border-slate-800">
          <div className="p-2.5 rounded-xl bg-cyan-950 text-cyan-400 border border-cyan-800/40">
            <Cpu className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-black text-white tracking-tight">
              Hardware Architecture &amp; Pinout
            </h2>
            <p className="text-xs text-slate-400 font-mono">
              CD74HC4067 16-Ch Multiplexer &bull; ESP32 DevKit V4 Wiring
            </p>
          </div>
        </div>

        {/* Hardware Specs Content */}
        <div className="space-y-6 text-left">
          {/* Slot Ultrasonic Sensors Table */}
          <div>
            <h3 className="text-sm font-bold uppercase font-mono text-cyan-400 flex items-center gap-2 mb-3">
              <Layers className="w-4 h-4" />
              <span>4-Slot Parking Sensors (HC-SR04)</span>
            </h3>
            <div className="overflow-x-auto">
              <table className="w-full text-xs font-mono text-left border border-slate-800 rounded-lg overflow-hidden">
                <thead className="bg-slate-950 text-slate-300">
                  <tr>
                    <th className="p-2.5 border-b border-slate-800">Slot #</th>
                    <th className="p-2.5 border-b border-slate-800">Trigger Pin</th>
                    <th className="p-2.5 border-b border-slate-800">MUX Channel</th>
                    <th className="p-2.5 border-b border-slate-800">Echo Route</th>
                    <th className="p-2.5 border-b border-slate-800">Occupancy Rule</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 bg-slate-900/40 text-slate-300">
                  <tr>
                    <td className="p-2.5 font-bold text-white">SLOT 1</td>
                    <td className="p-2.5 text-cyan-400">GPIO 13</td>
                    <td className="p-2.5 text-amber-300">Channel C0</td>
                    <td className="p-2.5 text-slate-400">MUX COM &rarr; Pin 17</td>
                    <td className="p-2.5 text-emerald-400">&lt;100 cm = Occupied</td>
                  </tr>
                  <tr>
                    <td className="p-2.5 font-bold text-white">SLOT 2</td>
                    <td className="p-2.5 text-cyan-400">GPIO 12</td>
                    <td className="p-2.5 text-amber-300">Channel C1</td>
                    <td className="p-2.5 text-slate-400">MUX COM &rarr; Pin 17</td>
                    <td className="p-2.5 text-emerald-400">&lt;100 cm = Occupied</td>
                  </tr>
                  <tr>
                    <td className="p-2.5 font-bold text-white">SLOT 3</td>
                    <td className="p-2.5 text-cyan-400">GPIO 14</td>
                    <td className="p-2.5 text-amber-300">Channel C2</td>
                    <td className="p-2.5 text-slate-400">MUX COM &rarr; Pin 17</td>
                    <td className="p-2.5 text-emerald-400">&lt;100 cm = Occupied</td>
                  </tr>
                  <tr>
                    <td className="p-2.5 font-bold text-white">SLOT 4</td>
                    <td className="p-2.5 text-cyan-400">GPIO 27</td>
                    <td className="p-2.5 text-amber-300">Channel C3</td>
                    <td className="p-2.5 text-slate-400">MUX COM &rarr; Pin 17</td>
                    <td className="p-2.5 text-emerald-400">&lt;100 cm = Occupied</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* CD74HC4067 Control Lines */}
          <div>
            <h3 className="text-sm font-bold uppercase font-mono text-amber-400 flex items-center gap-2 mb-2">
              <Cpu className="w-4 h-4" />
              <span>Multiplexer Control Address Pins</span>
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs font-mono">
              <div className="p-2.5 bg-slate-950 rounded-lg border border-slate-800">
                <span className="text-slate-400 block">S0 Address</span>
                <span className="text-white font-bold">GPIO 32</span>
              </div>
              <div className="p-2.5 bg-slate-950 rounded-lg border border-slate-800">
                <span className="text-slate-400 block">S1 Address</span>
                <span className="text-white font-bold">GPIO 33</span>
              </div>
              <div className="p-2.5 bg-slate-950 rounded-lg border border-slate-800">
                <span className="text-slate-400 block">S2 Address</span>
                <span className="text-white font-bold">GPIO 25</span>
              </div>
              <div className="p-2.5 bg-slate-950 rounded-lg border border-slate-800">
                <span className="text-slate-400 block">S3 Address</span>
                <span className="text-white font-bold">GPIO 26</span>
              </div>
            </div>
          </div>

          {/* Gate & Servo Actuator */}
          <div>
            <h3 className="text-sm font-bold uppercase font-mono text-emerald-400 flex items-center gap-2 mb-2">
              <Activity className="w-4 h-4" />
              <span>Entrance Gate &amp; Barrier Actuator</span>
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs font-mono">
              <div className="p-3 bg-slate-950 rounded-xl border border-slate-800">
                <div className="flex items-center gap-2 text-cyan-400 font-semibold mb-1">
                  <Radio className="w-4 h-4" />
                  <span>Entrance HC-SR04 Sensor</span>
                </div>
                <p className="text-slate-300">Pin 19 (TRIG &amp; ECHO)</p>
                <p className="text-slate-400 text-[11px] mt-1">
                  Threshold &lt; 50 cm triggers barrier opening logic when slots are available.
                </p>
              </div>

              <div className="p-3 bg-slate-950 rounded-xl border border-slate-800">
                <div className="flex items-center gap-2 text-amber-400 font-semibold mb-1">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Gate Barrier Servo</span>
                </div>
                <p className="text-slate-300">Pin 18 (PWM Signal)</p>
                <p className="text-slate-400 text-[11px] mt-1">
                  0&deg; = OPEN &bull; 90&deg; = CLOSED / LOCKED
                </p>
              </div>
            </div>
          </div>

          {/* Display & Peripherals */}
          <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 text-xs font-mono">
            <div className="font-semibold text-slate-300 mb-1">20x4 I2C LCD Display:</div>
            <div className="text-slate-400">
              SDA &rarr; GPIO 21 &bull; SCL &rarr; GPIO 22 &bull; I2C Address 0x27 &bull; Real-time slot and gate status readout
            </div>
          </div>
        </div>

        <button
          onClick={onClose}
          className="mt-6 w-full py-2.5 px-4 rounded-xl text-xs font-mono font-bold uppercase tracking-wider bg-slate-800 hover:bg-slate-700 text-white transition-colors"
        >
          Close Hardware Reference
        </button>
      </div>
    </div>
  );
};
