# Smart Parking USB-to-Cloud Bridge

This lightweight Node.js service allows you to connect a physical ESP32 to your laptop via USB cable and forward real-time ultrasonic telemetry to the public EMQX MQTT broker when Wi-Fi is unavailable on the microcontroller.

## When Do You Need This?
- **Mode A (Wi-Fi / Wokwi)**: NOT needed. The ESP32 connects directly to Wi-Fi and broadcasts to `broker.emqx.io` independently.
- **Mode B (Physical ESP32 via USB Cable)**: REQUIRED. If your ESP32 is plugged in with no Wi-Fi credentials configured, this script reads the serial stream at 115200 baud and publishes each telemetry packet to `smartparking/esp32/lot4/status`.

## Quick Start

### 1. Install Dependencies
```bash
cd bridge
npm install
```

### 2. Find Your ESP32 Serial Port
```bash
npm run ports
```
- **macOS**: `/dev/cu.usbserial-0001` or `/dev/cu.wchusbserial...`
- **Linux**: `/dev/ttyUSB0` or `/dev/ttyACM0`
- **Windows**: `COM3`, `COM4`, etc.

### 3. Start the Bridge
```bash
# macOS / Linux:
node bridge.js /dev/cu.usbserial-0001

# Windows:
node bridge.js COM3
```

### 4. Observe Live Output
```text
====================================================
 🚗 Smart Parking USB-to-Cloud Bridge Initializing
====================================================
 Serial Port:  /dev/cu.usbserial-0001 (115200 baud)
 MQTT Broker:  mqtt://broker.emqx.io:1883
 MQTT Topic:   smartparking/esp32/lot4/status
----------------------------------------------------
✅ Connected to EMQX MQTT Broker!
⚡ Serial connection opened on /dev/cu.usbserial-0001 @ 115200 baud
[#1] Broadcasted -> Free: 3/4 (🟢 OPEN) | GATE LOCKED (90°) | Slots: [FREE, OCCUPIED, FREE, FREE]
```
The hosted web dashboard and any scanned mobile phone will immediately reflect the live parking lot state in real-time.
