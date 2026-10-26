/**
 * Telemetry payload contract matching ESP32 firmware output
 */
export interface ParkingTelemetry {
  /**
   * Status of 4 parking slots:
   * true = OCCUPIED (Crimson Red)
   * false = AVAILABLE (Emerald Green)
   */
  slots: [boolean, boolean, boolean, boolean];

  /**
   * Real-time ultrasonic distances in centimeters for Slots 1-4
   */
  distances: [number, number, number, number];

  /**
   * Count of free / available parking spaces (0 - 4)
   */
  free: number;

  /**
   * Total capacity (fixed at 4)
   */
  total: number;

  /**
   * Real-time ultrasonic distance measured at the entrance gate (cm)
   * (< 50 cm triggers barrier opening if space is available)
   */
  gateDist: number;

  /**
   * True = 0 deg (OPEN), False = 90 deg (LOCKED / CLOSED)
   */
  gateOpen: boolean;
}

export type ConnectionStatus =
  | 'LIVE'
  | 'WAITING'
  | 'STALE'
  | 'DISCONNECTED'
  | 'RECONNECTING'
  | 'DEMO';

export interface SlotHardwareMetadata {
  id: number;
  label: string;
  muxChannel: string;
  triggerPin: number;
  echoPin: string;
}

export const PARKING_SLOTS_METADATA: SlotHardwareMetadata[] = [
  { id: 1, label: 'SLOT 1', muxChannel: 'MUX C0', triggerPin: 13, echoPin: 'Pin 17 (COM)' },
  { id: 2, label: 'SLOT 2', muxChannel: 'MUX C1', triggerPin: 12, echoPin: 'Pin 17 (COM)' },
  { id: 3, label: 'SLOT 3', muxChannel: 'MUX C2', triggerPin: 14, echoPin: 'Pin 17 (COM)' },
  { id: 4, label: 'SLOT 4', muxChannel: 'MUX C3', triggerPin: 27, echoPin: 'Pin 17 (COM)' },
];

export interface TelemetryStats {
  packetsReceived: number;
  lastPacketTimestamp: Date | null;
  averageIntervalMs: number;
  rawPayload: string;
}
