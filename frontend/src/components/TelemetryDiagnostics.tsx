import React, { useState } from 'react';
import { TelemetryStats } from '../types/parking';
import { Terminal, Database, Clock, ChevronDown, ChevronUp } from 'lucide-react';

interface TelemetryDiagnosticsProps {
  stats: TelemetryStats;
  mqttTopic: string;
}

export const TelemetryDiagnostics: React.FC<TelemetryDiagnosticsProps> = ({
  stats,
  mqttTopic,
}) => {
  const [showJson, setShowJson] = useState(false);

  return (
    <div className="rounded-2xl p-5 bg-slate-900/90 border border-slate-800 shadow-xl mt-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-3 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <Terminal className="w-5 h-5 text-emerald-400" />
          <h3 className="text-sm font-bold tracking-tight text-white uppercase font-mono">
            Live Telemetry Diagnostics & Broker Stream
          </h3>
        </div>

        <button
          onClick={() => setShowJson(!showJson)}
          className="flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-mono bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors"
        >
          <span>{showJson ? 'Hide JSON Contract' : 'Inspect Raw JSON Payload'}</span>
          {showJson ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
        </button>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 my-4">
        <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800">
          <div className="text-[11px] font-mono text-slate-400 flex items-center gap-1.5 mb-1">
            <Database className="w-3.5 h-3.5 text-cyan-400" />
            <span>Packets Received</span>
          </div>
          <div className="text-xl font-bold font-mono text-white">
            {stats.packetsReceived.toLocaleString()}
          </div>
        </div>

        <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800">
          <div className="text-[11px] font-mono text-slate-400 flex items-center gap-1.5 mb-1">
            <Clock className="w-3.5 h-3.5 text-emerald-400" />
            <span>Telemetry Interval</span>
          </div>
          <div className="text-xl font-bold font-mono text-emerald-400">
            ~{stats.averageIntervalMs} ms
          </div>
        </div>

        <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800">
          <div className="text-[11px] font-mono text-slate-400 mb-1">Last Telemetry Timestamp</div>
          <div className="text-xs font-bold font-mono text-slate-200 truncate">
            {stats.lastPacketTimestamp
              ? stats.lastPacketTimestamp.toLocaleTimeString() +
                '.' +
                stats.lastPacketTimestamp.getMilliseconds().toString().padStart(3, '0')
              : 'Waiting for packet...'}
          </div>
        </div>

        <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800">
          <div className="text-[11px] font-mono text-slate-400 mb-1">MQTT Telemetry Topic</div>
          <div className="text-xs font-mono text-cyan-300 truncate" title={mqttTopic}>
            {mqttTopic}
          </div>
        </div>
      </div>

      {/* Collapsible Raw JSON Viewer */}
      {showJson && (
        <div className="mt-3 p-4 bg-slate-950 rounded-xl border border-slate-800 animate-in fade-in duration-200">
          <div className="flex items-center justify-between mb-2 text-xs font-mono text-slate-400">
            <span>Payload Stream (JSON Data Contract)</span>
            <span className="text-[10px] text-emerald-400">Validated Schema</span>
          </div>
          <pre className="text-xs font-mono text-emerald-300 bg-slate-900/90 p-3 rounded-lg overflow-x-auto border border-emerald-950">
            {stats.rawPayload ||
              `// No packets received yet. Telemetry will appear here once ESP32 or Bridge starts transmitting.\n// Expected contract:\n{\n  "slots": [true, false, false, true],\n  "distances": [62, 381, 330, 45],\n  "free": 2,\n  "total": 4,\n  "gateDist": 384,\n  "gateOpen": false\n}`}
          </pre>
        </div>
      )}
    </div>
  );
};
