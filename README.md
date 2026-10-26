# 4-Slot Smart Parking Live Telemetry Platform

A complete, production-ready IoT smart parking system powered by an **ESP32 DevKit V4**, a **CD74HC4067 16-channel multiplexer**, 5 **HC-SR04 ultrasonic sensors**, a **servo boom barrier**, a **20x4 I2C LCD**, and a high-performance **React + TypeScript + Vite + Tailwind CSS** web dashboard streaming real-time telemetry over **EMQX MQTT WebSockets**.

![Smart Parking System Architecture](https://img.shields.io/badge/Architecture-ESP32%20%2B%20CD74HC4067%20%2B%20MQTT-emerald)
![Broker](https://img.shields.io/badge/Broker-broker.emqx.io-blue)
![Topic](https://img.shields.io/badge/Topic-smartparking%2Fesp32%2Flot4%2Fstatus-cyan)
![Frontend](https://img.shields.io/badge/Frontend-React%2018%20%7C%20Vite%20%7C%20TailwindCSS-purple)

---

## 1. System Architecture Overview

The system supports two complementary transport modes so that the dashboard functions identically whether the ESP32 runs in the **Wokwi Simulator** or is connected physically via **USB Cable / Wi-Fi Hotspot**:

```
[4x HC-SR04 Slot Sensors]   [1x Gate HC-SR04 Sensor]
          │ (Echos C0-C3)                 │
          ▼                               │
  [CD74HC4067 MUX]                        │
          │ (COM Pin 17)                  │
          ▼                               ▼
┌─────────────────────────────────────────────────────────┐
│                    ESP32 DevKit V4                      │
│ - Reads Slot Distances (<100 cm = Occupied)             │
│ - Reads Gate Sensor (<50 cm triggers barrier)           │
│ - Actuates Servo Barrier (Pin 18: 0° OPEN / 90° LOCKED) │
│ - Displays Live Status on 20x4 I2C LCD (0x27)           │
│ - Formats JSON Contract Every ~400ms                    │
└────────────────────────────┬────────────────────────────┘
                             │
            ┌────────────────┴────────────────┐
            ▼                                 ▼
   [Mode A: Wi-Fi / Wokwi]          [Mode B: USB Serial]
  Direct MQTT over TCP 1883        Prints "JSON_DATA:{...}"
  broker.emqx.io:1883              at 115200 baud to Laptop
            │                                 │
            │                      [Node.js bridge.js]
            │                      Forwards Serial -> MQTT
            │                                 │
            └────────────────┬────────────────┘
                             │
                             ▼
              [Public EMQX MQTT Broker]
          Topic: smartparking/esp32/lot4/status
          Secure WebSockets: wss://broker.emqx.io:8084/mqtt
                             │
                             ▼
         [React 18 + TypeScript Web Dashboard]
      - Hosted on Vercel
      - Live Connection Badge & Stale Packet Detection
      - 2x2 Interactive Parking Grid (Emerald Green / Crimson Red)
      - 4 Functional KPI Cards & Animated Barrier
      - Scannable Mobile Sync QR Code (window.location.href)
      - Interactive Demo / Simulation Mode
```

---

## 2. Hardware Pinout & Wiring Specifications

### A. 4-Slot Parking Ultrasonic Sensors (HC-SR04) via CD74HC4067 Multiplexer
The trigger pins are driven directly by dedicated ESP32 GPIOs, while the echo return pulses from all 4 sensors are routed through channels C0–C3 of the CD74HC4067 multiplexer to a single ESP32 pin (GPIO 17).

| Component | ESP32 Trigger Pin | MUX Channel | Echo Route | Occupancy Threshold |
| :--- | :--- | :--- | :--- | :--- |
| **Slot 1** | GPIO 13 | Channel C0 | MUX COM &rarr; GPIO 17 | &lt; 100 cm = OCCUPIED, &ge; 100 cm = AVAILABLE |
| **Slot 2** | GPIO 12 | Channel C1 | MUX COM &rarr; GPIO 17 | &lt; 100 cm = OCCUPIED, &ge; 100 cm = AVAILABLE |
| **Slot 3** | GPIO 14 | Channel C2 | MUX COM &rarr; GPIO 17 | &lt; 100 cm = OCCUPIED, &ge; 100 cm = AVAILABLE |
| **Slot 4** | GPIO 27 | Channel C3 | MUX COM &rarr; GPIO 17 | &lt; 100 cm = OCCUPIED, &ge; 100 cm = AVAILABLE |

### B. CD74HC4067 Multiplexer Address Control Lines
| MUX Pin | ESP32 GPIO | Description |
| :--- | :--- | :--- |
| **S0** | GPIO 32 | Channel Select Bit 0 |
| **S1** | GPIO 33 | Channel Select Bit 1 |
| **S2** | GPIO 25 | Channel Select Bit 2 |
| **S3** | GPIO 26 | Channel Select Bit 3 |
| **COM / SIG** | GPIO 17 | Common Signal Out &rarr; ESP32 Echo Input |
| **EN** | GND | Active-low enable (permanently tied to Ground) |
| **VCC / GND** | 5V / GND | Power supply |

### C. Entrance Gate & Actuators
| Component | ESP32 Pin | Function / Logic |
| :--- | :--- | :--- |
| **Entrance HC-SR04** | GPIO 19 | Vehicle detection (&lt; 50 cm triggers barrier open if free slots &gt; 0) |
| **Gate Servo Barrier** | GPIO 18 | PWM Servo control: **0° = OPEN**, **90° = CLOSED / LOCKED** |
| **20x4 I2C LCD** | GPIO 21 (SDA), GPIO 22 (SCL) | Address `0x27`: Live occupancy, free count, and barrier state |

---

## 3. MQTT JSON Data Contract

The ESP32 broadcasts this structured JSON payload every **~400ms** over MQTT and prints it to USB Serial prefixed with `JSON_DATA:`:

```json
{
  "slots": [true, false, false, true],
  "distances": [62, 381, 330, 45],
  "free": 2,
  "total": 4,
  "gateDist": 384,
  "gateOpen": false
}
```

### Contract Fields:
- `slots`: Array of 4 booleans. `true` = **OCCUPIED** (Crimson Red `#ef4444`), `false` = **AVAILABLE** (Emerald Green `#10b981`).
- `distances`: Array of 4 numbers showing real-time ultrasonic sensor distances in cm.
- `free`: Count of currently available parking bays (`0` to `4`).
- `total`: Total capacity (`4`).
- `gateDist`: Ultrasonic distance measured at the entrance sensor (cm).
- `gateOpen`: Boolean reflecting boom barrier state (`true` = 0° OPEN, `false` = 90° LOCKED).

---

## 4. Project Directory Structure

```
smartparkingiotfronted/
├── esp32/
│   ├── sketch.ino               # Complete ESP32 firmware (C++)
│   └── libraries.txt            # Wokwi library dependencies
│
├── wokwi/
│   ├── diagram.json             # Complete Wokwi circuit simulation
│   └── wokwi.toml               # Simulation configuration
│
├── frontend/
│   ├── index.html               # Entry HTML with meta & fonts
│   ├── package.json             # Vite, React, TypeScript, Tailwind, MQTT, QR dependencies
│   ├── tsconfig.json            # Strict TypeScript configuration
│   ├── vite.config.ts           # Vite bundler configuration
│   ├── tailwind.config.js       # Custom theme colors and neon glow tokens
│   └── src/
│       ├── types/parking.ts     # Telemetry interfaces & metadata
│       ├── services/mqttService.ts # Secure WebSockets MQTT client
│       ├── hooks/useParkingTelemetry.ts # Telemetry stream & stale detection
│       ├── components/
│       │   ├── Header.tsx       # Status indicator & action bar
│       │   ├── KpiCards.tsx     # 4 functional KPI cards
│       │   ├── ParkingGrid.tsx  # 2x2 parking road layout
│       │   ├── ParkingSlotCard.tsx # Visual bay with car / empty markings
│       │   ├── GateBarrierVisual.tsx # Animated SVG servo barrier
│       │   ├── QrCodeSidebar.tsx# Scannable mobile sync QR
│       │   ├── QrModal.tsx      # Fullscreen QR enlargement modal
│       │   ├── TelemetryDiagnostics.tsx # Live packet rates & JSON inspector
│       │   ├── HardwareSpecsModal.tsx # Pinout & architecture reference
│       │   └── DemoControls.tsx # Interactive isolated simulation
│       ├── App.tsx              # Root dashboard application
│       ├── index.css            # Tailwind directives & scrollbar styling
│       └── main.tsx             # React DOM root
│
├── bridge/
│   ├── bridge.js                # USB Serial to MQTT Cloud Bridge
│   ├── package.json             # SerialPort & MQTT dependencies
│   └── README.md                # Bridge usage guide
│
├── .gitignore                   # Excludes node_modules, dist, .env
└── README.md                    # Comprehensive master documentation
```

---

## 5. Running the Project

### A. Frontend Dashboard
1. Navigate to the `frontend` directory:
   ```bash
   cd frontend
   npm install
   ```
2. Start the local development server:
   ```bash
   npm run dev
   ```
3. Open `http://localhost:5173` in your browser.

### B. Wokwi Hardware Simulation
1. Install the **Wokwi Simulator** extension in VS Code / Antigravity IDE, or open [wokwi.com](https://wokwi.com).
2. Load `wokwi/diagram.json` and `esp32/sketch.ino`.
3. Start the simulation. The ESP32 will connect to `Wokwi-GUEST` Wi-Fi and publish live telemetry to `smartparking/esp32/lot4/status`.
4. Drag the sliders on any of the 4 ultrasonic sensors:
   - When distance &lt; 100 cm &rarr; The slot turns **Crimson Red (OCCUPIED)** on the dashboard.
   - When distance &ge; 100 cm &rarr; The slot turns **Emerald Green (AVAILABLE)** on the dashboard.
   - Adjust the gate sensor &lt; 50 cm &rarr; The servo rotates to **0° (OPEN)** and the dashboard barrier opens.

### C. USB Serial Bridge (For Physical ESP32 without Wi-Fi)
If using a physical ESP32 connected via USB without local Wi-Fi:
1. Navigate to the `bridge` directory:
   ```bash
   cd bridge
   npm install
   ```
2. Run the bridge specifying your ESP32's serial COM port:
   ```bash
   # macOS / Linux:
   node bridge.js /dev/cu.usbserial-0001

   # Windows:
   node bridge.js COM3
   ```
3. The bridge reads `JSON_DATA:` lines at 115200 baud and forwards them immediately to `broker.emqx.io`.

---

## 6. Live QR Code Mobile Sync

1. When hosted publicly on Vercel, the dashboard dynamically detects `window.location.href`.
2. A scannable QR code is rendered in the sidebar and can be enlarged to full-screen with the **"Enlarge QR"** button.
3. Anyone in the presentation room or auditorium can scan the QR code with their mobile phone.
4. The mobile device connects directly to `wss://broker.emqx.io:8084/mqtt` and displays the exact same live-updating 2x2 grid and gate telemetry in real time.

---

## 7. Interactive Demo / Simulation Mode

- Click the **"Simulate / Demo"** button in the top navigation bar to test UI interactions when the physical ESP32 or simulation is offline.
- Allows toggling Slot 1–4 and the Gate Barrier manually, or running an automatic simulation sequence.
- **Strict Isolation Guarantee**: Demo mode operates entirely inside local React state and **never** publishes mock data to the real MQTT broker topic.

---

## 8. Deployment to Vercel

1. Push this repository to GitHub:
   ```bash
   git add .
   git commit -m "feat: build complete smart parking platform"
   git push origin main
   ```
2. Import the `frontend` directory into [Vercel](https://vercel.com):
   - **Framework Preset**: Vite
   - **Root Directory**: `frontend`
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
3. Once deployed, open the permanent public URL (e.g., `https://smartparkingiotfronted.vercel.app`).
4. The QR code will automatically lock to this live public URL.

---

## 9. License

Developed for IoT Smart City & Embedded Systems Engineering presentations. MIT License.
