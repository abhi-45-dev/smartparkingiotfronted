import mqtt, { MqttClient } from 'mqtt';
import { ParkingTelemetry } from '../types/parking';

export const MQTT_CONFIG = {
  PRIMARY_BROKER: 'wss://broker.emqx.io:8084/mqtt',
  FALLBACK_BROKER: 'wss://broker.hivemq.com:8884/mqtt',
  TOPIC: 'smartparking/esp32/lot4/status',
  CLIENT_ID_PREFIX: 'smartparking_web_',
};

/**
 * Validate incoming JSON against the strict data contract:
 * {
 *   "slots": [boolean, boolean, boolean, boolean],
 *   "distances": [number, number, number, number],
 *   "free": number,
 *   "total": 4,
 *   "gateDist": number,
 *   "gateOpen": boolean
 * }
 */
export function validateTelemetryPayload(data: unknown): ParkingTelemetry | null {
  if (!data || typeof data !== 'object') return null;

  const candidate = data as Record<string, unknown>;

  if (
    !Array.isArray(candidate.slots) ||
    candidate.slots.length !== 4 ||
    !candidate.slots.every((s) => typeof s === 'boolean')
  ) {
    return null;
  }

  if (
    !Array.isArray(candidate.distances) ||
    candidate.distances.length !== 4 ||
    !candidate.distances.every((d) => typeof d === 'number')
  ) {
    return null;
  }

  if (typeof candidate.free !== 'number') return null;
  if (typeof candidate.total !== 'number') return null;
  if (typeof candidate.gateDist !== 'number') return null;
  if (typeof candidate.gateOpen !== 'boolean') return null;

  return {
    slots: candidate.slots as [boolean, boolean, boolean, boolean],
    distances: candidate.distances as [number, number, number, number],
    free: candidate.free,
    total: candidate.total,
    gateDist: candidate.gateDist,
    gateOpen: candidate.gateOpen,
  };
}

export type MqttEventCallback = {
  onConnect?: (brokerUrl: string) => void;
  onDisconnect?: () => void;
  onError?: (err: Error) => void;
  onReconnecting?: () => void;
  onTelemetry?: (telemetry: ParkingTelemetry, rawString: string) => void;
};

export class MqttParkingService {
  private client: MqttClient | null = null;
  private callbacks: MqttEventCallback = {};
  private currentBrokerIndex = 0;
  private brokers = [MQTT_CONFIG.PRIMARY_BROKER, MQTT_CONFIG.FALLBACK_BROKER];
  private connectTimeoutTimer: NodeJS.Timeout | null = null;
  private isDestroyed = false;

  public connect(callbacks: MqttEventCallback) {
    this.callbacks = callbacks;
    this.isDestroyed = false;
    this.tryCurrentBroker();
  }

  private tryCurrentBroker() {
    if (this.isDestroyed) return;

    if (this.client) {
      try {
        this.client.end(true);
      } catch (e) {
        // ignore cleanup error
      }
      this.client = null;
    }

    const brokerUrl = this.brokers[this.currentBrokerIndex];
    const clientId = `${MQTT_CONFIG.CLIENT_ID_PREFIX}${Math.random().toString(16).substring(2, 10)}`;

    // Set connection timeout: if current broker doesn't connect in 6s, failover to fallback
    if (this.connectTimeoutTimer) clearTimeout(this.connectTimeoutTimer);
    this.connectTimeoutTimer = setTimeout(() => {
      if (this.client && !this.client.connected && !this.isDestroyed) {
        console.warn(`[MQTT] Broker ${brokerUrl} connection timed out. Failing over...`);
        this.currentBrokerIndex = (this.currentBrokerIndex + 1) % this.brokers.length;
        this.tryCurrentBroker();
      }
    }, 6000);

    try {
      this.client = mqtt.connect(brokerUrl, {
        clientId,
        clean: true,
        reconnectPeriod: 3000,
        connectTimeout: 5000,
        keepalive: 30,
      });

      this.client.on('connect', () => {
        if (this.connectTimeoutTimer) clearTimeout(this.connectTimeoutTimer);
        console.log(`[MQTT] Connected to broker: ${brokerUrl}`);
        this.callbacks.onConnect?.(brokerUrl);
        this.client?.subscribe(MQTT_CONFIG.TOPIC, { qos: 0 }, (err) => {
          if (err) {
            this.callbacks.onError?.(err);
          }
        });
      });

      this.client.on('reconnect', () => {
        this.callbacks.onReconnecting?.();
      });

      this.client.on('offline', () => {
        this.callbacks.onDisconnect?.();
      });

      this.client.on('close', () => {
        this.callbacks.onDisconnect?.();
      });

      this.client.on('error', (err) => {
        this.callbacks.onError?.(err);
      });

      this.client.on('message', (topic, messageBuffer) => {
        if (topic === MQTT_CONFIG.TOPIC) {
          const rawString = messageBuffer.toString('utf-8');
          try {
            const parsed = JSON.parse(rawString);
            const validated = validateTelemetryPayload(parsed);
            if (validated) {
              this.callbacks.onTelemetry?.(validated, rawString);
            } else {
              console.warn('[MQTT] Dropped malformed telemetry payload:', rawString);
            }
          } catch (e) {
            console.error('[MQTT] JSON parse failure:', e);
          }
        }
      });
    } catch (err) {
      this.callbacks.onError?.(err instanceof Error ? err : new Error(String(err)));
    }
  }

  public getActiveBroker(): string {
    return this.brokers[this.currentBrokerIndex];
  }

  public disconnect() {
    this.isDestroyed = true;
    if (this.connectTimeoutTimer) clearTimeout(this.connectTimeoutTimer);
    if (this.client) {
      this.client.end(true);
      this.client = null;
    }
  }
}
