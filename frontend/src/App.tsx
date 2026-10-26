import { useState } from 'react';
import { useParkingTelemetry } from './hooks/useParkingTelemetry';
import { Header } from './components/Header';
import { KpiCards } from './components/KpiCards';
import { ParkingGrid } from './components/ParkingGrid';
import { QrCodeSidebar } from './components/QrCodeSidebar';
import { QrModal } from './components/QrModal';
import { HardwareSpecsModal } from './components/HardwareSpecsModal';
import { TelemetryDiagnostics } from './components/TelemetryDiagnostics';
import { DemoControls } from './components/DemoControls';
import { MQTT_CONFIG } from './services/mqttService';
import { Radio, AlertCircle } from 'lucide-react';

export function App() {
  const {
    telemetry,
    connectionStatus,
    isDemoMode,
    stats,
    toggleDemoMode,
    setDemoSlot,
    toggleDemoGate,
  } = useParkingTelemetry();

  const [isQrModalOpen, setIsQrModalOpen] = useState(false);
  const [isSpecsModalOpen, setIsSpecsModalOpen] = useState(false);

  return (
    <div className="min-h-screen bg-[#0a0f1d] text-slate-100 p-4 sm:p-6 lg:p-8 flex flex-col justify-between">
      <div className="max-w-7xl mx-auto w-full">
        {/* Top Header & Status Bar */}
        <Header
          status={connectionStatus}
          isDemoMode={isDemoMode}
          onToggleDemo={toggleDemoMode}
          onOpenQrModal={() => setIsQrModalOpen(true)}
          onOpenSpecsModal={() => setIsSpecsModalOpen(true)}
        />

        {/* Demo Mode Interactive Control Strip */}
        {isDemoMode && (
          <DemoControls
            telemetry={telemetry}
            onToggleSlot={setDemoSlot}
            onToggleGate={toggleDemoGate}
            onExitDemo={toggleDemoMode}
          />
        )}

        {/* Waiting For Hardware Telemetry Banner (when broker is connected but no telemetry has arrived yet) */}
        {!isDemoMode && connectionStatus === 'WAITING' && (
          <div className="mb-6 p-4 rounded-2xl bg-amber-950/40 border border-amber-500/40 flex items-center gap-3 text-amber-200">
            <Radio className="w-5 h-5 text-amber-400 animate-pulse flex-shrink-0" />
            <div className="text-xs">
              <span className="font-bold uppercase tracking-wider font-mono">
                Connected to MQTT Broker &bull; Waiting for ESP32 Telemetry:
              </span>{' '}
              Listening on <code className="bg-amber-950/80 px-1.5 py-0.5 rounded font-mono text-amber-300">{MQTT_CONFIG.TOPIC}</code>.
              Power your ESP32, run the Wokwi simulation, or execute the USB bridge to see live parking updates.
            </div>
          </div>
        )}

        {/* Stale Telemetry Warning Banner */}
        {!isDemoMode && connectionStatus === 'STALE' && (
          <div className="mb-6 p-4 rounded-2xl bg-red-950/40 border border-red-500/40 flex items-center gap-3 text-red-200">
            <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0" />
            <div className="text-xs">
              <span className="font-bold uppercase tracking-wider font-mono">
                Telemetry Stream Interrupted:
              </span>{' '}
              No packets received in the last 3.5 seconds. The ESP32 may have lost power, disconnected from Wi-Fi, or stopped transmitting.
            </div>
          </div>
        )}

        {/* 4 Primary KPI Summary Cards */}
        <KpiCards telemetry={telemetry} />

        {/* Main Content Layout: 2x2 Parking Grid + Live QR Sidebar */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left & Center Columns: 2x2 Interactive Visual Parking Lot */}
          <div className="lg:col-span-2">
            <ParkingGrid
              slots={telemetry?.slots ?? [false, false, false, false]}
              distances={telemetry?.distances ?? [999, 999, 999, 999]}
              isDemoMode={isDemoMode}
              onToggleSlot={(index) => {
                if (isDemoMode && telemetry) {
                  setDemoSlot(index, !telemetry.slots[index]);
                }
              }}
            />
          </div>

          {/* Right Column: Scannable QR Code & Quick Hardware Guide */}
          <div className="space-y-6">
            <QrCodeSidebar onEnlarge={() => setIsQrModalOpen(true)} />

            {/* Quick Architecture Guide Card */}
            <div className="rounded-2xl p-5 bg-slate-900/90 border border-slate-800 shadow-xl">
              <h3 className="text-sm font-bold font-mono uppercase text-white tracking-wider mb-2">
                System Architecture
              </h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                4 HC-SR04 ultrasonic sensors multiplexed through a <strong className="text-cyan-400">CD74HC4067</strong> to ESP32 Pin 17.
                A 5th sensor on Pin 19 controls the servo barrier on Pin 18.
                Telemetry streams every <strong className="text-emerald-400">~400ms</strong> over WebSockets MQTT.
              </p>
              <div className="mt-4 pt-3 border-t border-slate-800 flex items-center justify-between text-xs font-mono">
                <span className="text-slate-400">Hardware Broker:</span>
                <span className="text-emerald-400">broker.emqx.io</span>
              </div>
            </div>
          </div>
        </div>

        {/* Telemetry Diagnostics & Raw JSON Inspector */}
        <TelemetryDiagnostics stats={stats} mqttTopic={MQTT_CONFIG.TOPIC} />
      </div>

      {/* Footer */}
      <footer className="max-w-7xl mx-auto w-full mt-10 pt-6 border-t border-slate-800/80 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs font-mono text-slate-400">
        <div>
          Smart Parking Live Telemetry &bull; Developed by <span className="text-slate-200 font-semibold">abhi-45-dev</span>
        </div>
        <div className="flex items-center gap-4">
          <span>ESP32 DevKit V4</span>
          <span>&bull;</span>
          <span>CD74HC4067</span>
          <span>&bull;</span>
          <span className="text-emerald-400">MQTT WebSockets</span>
        </div>
      </footer>

      {/* Full-Screen QR Code Modal */}
      <QrModal isOpen={isQrModalOpen} onClose={() => setIsQrModalOpen(false)} />

      {/* Hardware Architecture Pinout Reference Modal */}
      <HardwareSpecsModal isOpen={isSpecsModalOpen} onClose={() => setIsSpecsModalOpen(false)} />
    </div>
  );
}

export default App;
