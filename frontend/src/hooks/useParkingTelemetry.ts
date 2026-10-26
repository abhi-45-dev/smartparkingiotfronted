import { useState, useEffect, useRef, useCallback } from 'react';
import { ParkingTelemetry, ConnectionStatus, TelemetryStats } from '../types/parking';
import { MqttParkingService } from '../services/mqttService';

// Time threshold after which telemetry is considered stale (ESP32 emits every ~400ms)
const STALE_TIMEOUT_MS = 3500;

export function useParkingTelemetry() {
  const [telemetry, setTelemetry] = useState<ParkingTelemetry | null>(null);
  const [status, setStatus] = useState<ConnectionStatus>('WAITING');
  const [isDemoMode, setIsDemoMode] = useState<boolean>(false);
  const [stats, setStats] = useState<TelemetryStats>({
    packetsReceived: 0,
    lastPacketTimestamp: null,
    averageIntervalMs: 400,
    rawPayload: '',
  });

  const lastPacketTimeRef = useRef<number>(0);
  const serviceRef = useRef<MqttParkingService | null>(null);
  const staleTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Demo mode local state
  const [demoState, setDemoState] = useState<ParkingTelemetry>({
    slots: [true, false, false, true],
    distances: [62, 381, 330, 45],
    free: 2,
    total: 4,
    gateDist: 384,
    gateOpen: false,
  });

  // Stale packet monitor check
  const resetStaleTimer = useCallback(() => {
    if (staleTimerRef.current) {
      clearTimeout(staleTimerRef.current);
    }
    staleTimerRef.current = setTimeout(() => {
      setStatus((current) => {
        if (current === 'LIVE') {
          return 'STALE';
        }
        return current;
      });
    }, STALE_TIMEOUT_MS);
  }, []);

  useEffect(() => {
    if (isDemoMode) {
      if (staleTimerRef.current) clearTimeout(staleTimerRef.current);
      setStatus('DEMO');
      return;
    }

    const service = new MqttParkingService();
    serviceRef.current = service;

    service.connect({
      onConnect: () => {
        // Connected to broker, but status is WAITING until first telemetry packet arrives
        setStatus((prev) => (prev === 'LIVE' ? 'LIVE' : 'WAITING'));
      },
      onReconnecting: () => {
        setStatus('RECONNECTING');
      },
      onDisconnect: () => {
        setStatus('DISCONNECTED');
      },
      onError: (err) => {
        console.error('[Hook] MQTT Error:', err);
        setStatus('DISCONNECTED');
      },
      onTelemetry: (data, rawString) => {
        const now = Date.now();
        const delta = lastPacketTimeRef.current ? now - lastPacketTimeRef.current : 400;
        lastPacketTimeRef.current = now;

        setTelemetry(data);
        setStatus('LIVE');
        resetStaleTimer();

        setStats((prev) => ({
          packetsReceived: prev.packetsReceived + 1,
          lastPacketTimestamp: new Date(),
          averageIntervalMs: Math.round(prev.averageIntervalMs * 0.8 + delta * 0.2),
          rawPayload: rawString,
        }));
      },
    });

    return () => {
      if (staleTimerRef.current) clearTimeout(staleTimerRef.current);
      service.disconnect();
    };
  }, [isDemoMode, resetStaleTimer]);

  // Demo toggle handlers
  const toggleDemoMode = () => {
    setIsDemoMode((prev) => !prev);
  };

  const setDemoSlot = (slotIndex: number, occupied: boolean) => {
    setDemoState((prev) => {
      const nextSlots = [...prev.slots] as [boolean, boolean, boolean, boolean];
      const nextDistances = [...prev.distances] as [number, number, number, number];
      nextSlots[slotIndex] = occupied;
      nextDistances[slotIndex] = occupied ? 45 + slotIndex * 15 : 250 + slotIndex * 30;

      const free = nextSlots.filter((s) => !s).length;
      return {
        ...prev,
        slots: nextSlots,
        distances: nextDistances,
        free,
      };
    });
  };

  const toggleDemoGate = () => {
    setDemoState((prev) => {
      const nextGate = !prev.gateOpen;
      return {
        ...prev,
        gateOpen: nextGate,
        gateDist: nextGate ? 35 : 380,
      };
    });
  };

  // Active telemetry depends on whether Demo Mode is toggled
  const activeTelemetry = isDemoMode ? demoState : telemetry;

  return {
    telemetry: activeTelemetry,
    connectionStatus: isDemoMode ? 'DEMO' : status,
    isDemoMode,
    stats,
    toggleDemoMode,
    setDemoSlot,
    toggleDemoGate,
  };
}
