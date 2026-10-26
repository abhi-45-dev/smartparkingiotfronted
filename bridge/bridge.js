#!/usr/bin/env node
/**
 * =============================================================================
 * Smart Parking System - USB Serial to MQTT Cloud Bridge
 * =============================================================================
 * Description:
 *   Forwards telemetry packets from a physical ESP32 connected via USB cable
 *   (when Wi-Fi is unavailable on the microcontroller) to the public EMQX MQTT
 *   broker so the hosted web dashboard and mobile QR code viewers update live.
 *
 * Usage:
 *   npm install
 *   node bridge.js [PORT]
 *
 * Examples:
 *   macOS / Linux: node bridge.js /dev/cu.usbserial-0001
 *   Windows:       node bridge.js COM3
 * =============================================================================
 */

const { SerialPort } = require('serialport');
const { ReadlineParser } = require('@serialport/parser-readline');
const mqtt = require('mqtt');

// Detect default port depending on platform
const DEFAULT_PORT = process.platform === 'win32' ? 'COM3' : '/dev/cu.usbserial-0001';
const COM_PORT = process.argv[2] || process.env.SERIAL_PORT || DEFAULT_PORT;
const BAUD_RATE = 115200;
const BROKERS = [
  process.env.MQTT_BROKER || 'mqtt://broker.emqx.io:1883',
  'mqtt://broker.hivemq.com:1883',
];
let currentBrokerIdx = 0;
const MQTT_TOPIC = process.env.MQTT_TOPIC || 'smartparking/esp32/lot4/status';

console.log('====================================================');
console.log(' 🚗 Smart Parking USB-to-Cloud Bridge Initializing');
console.log('====================================================');
console.log(` Serial Port:  ${COM_PORT} (${BAUD_RATE} baud)`);
console.log(` MQTT Broker:  ${BROKERS[currentBrokerIdx]} (with failover)`);
console.log(` MQTT Topic:   ${MQTT_TOPIC}`);
console.log('----------------------------------------------------');

// Connect to MQTT Broker
let client = mqtt.connect(BROKERS[currentBrokerIdx], {
  clientId: `bridge_usb_${Math.random().toString(16).substring(2, 8)}`,
  clean: true,
  reconnectPeriod: 2500,
  connectTimeout: 5000,
});

client.on('connect', () => {
  console.log('✅ Connected to EMQX MQTT Broker!');
  console.log(`📡 Listening for ESP32 telemetry on ${COM_PORT}...`);
});

client.on('error', (err) => {
  console.error('❌ MQTT Client Error:', err.message);
});

client.on('offline', () => {
  console.warn('⚠️  MQTT Client offline, attempting reconnect...');
});

// Helper: list available ports if the requested port cannot be opened
async function listAvailablePorts() {
  try {
    const ports = await SerialPort.list();
    if (ports.length === 0) {
      console.log('ℹ️  No active serial ports detected. Connect ESP32 via USB.');
    } else {
      console.log('ℹ️  Available Serial Ports on this system:');
      ports.forEach((p) => {
        console.log(`   - ${p.path} (${p.manufacturer || 'Generic'})`);
      });
    }
  } catch (e) {
    console.error('Failed to query serial ports:', e.message);
  }
}

// Open Serial Port
let port;
try {
  port = new SerialPort({
    path: COM_PORT,
    baudRate: BAUD_RATE,
    autoOpen: true,
  });
} catch (err) {
  console.error(`❌ Could not open port ${COM_PORT}:`, err.message);
  listAvailablePorts();
}

if (port) {
  port.on('open', () => {
    console.log(`⚡ Serial connection opened on ${COM_PORT} @ 115200 baud`);
  });

  port.on('error', (err) => {
    console.error(`❌ Serial Port Error [${COM_PORT}]:`, err.message);
    listAvailablePorts();
  });

  const parser = port.pipe(new ReadlineParser({ delimiter: '\r\n' }));

  let packetCount = 0;

  parser.on('data', (rawLine) => {
    const line = rawLine.toString().trim();

    if (line.startsWith('JSON_DATA:')) {
      const jsonPayload = line.replace('JSON_DATA:', '').trim();

      // Validate JSON packet
      try {
        const parsed = JSON.parse(jsonPayload);

        // Basic schema verification
        if (Array.isArray(parsed.slots) && Array.isArray(parsed.distances)) {
          packetCount++;
          // Publish over MQTT (with retain: true so late joiners get latest state immediately)
          client.publish(MQTT_TOPIC, jsonPayload, { retain: true, qos: 0 }, (pubErr) => {
            if (pubErr) {
              console.error('❌ Failed to publish packet:', pubErr.message);
            } else {
              const freeCount = parsed.free;
              const lotStatus = freeCount > 0 ? '🟢 OPEN' : '🔴 FULL';
              const gateState = parsed.gateOpen ? 'GATE OPEN (0°)' : 'GATE LOCKED (90°)';
              console.log(
                `[#${packetCount}] Broadcasted -> Free: ${freeCount}/4 (${lotStatus}) | ${gateState} | Slots: [${parsed.slots.map(s => s ? 'OCCUPIED' : 'FREE').join(', ')}]`
              );
            }
          });
        }
      } catch (err) {
        console.warn('⚠️  Received malformed JSON string:', jsonPayload);
      }
    } else if (line.length > 0) {
      // Print other debug lines from ESP32 Serial
      console.log(`[ESP32 LOG]: ${line}`);
    }
  });
}

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\nStopping USB Bridge...');
  if (port && port.isOpen) {
    port.close();
  }
  client.end(true, () => {
    console.log('Bridge stopped cleanly.');
    process.exit(0);
  });
});
