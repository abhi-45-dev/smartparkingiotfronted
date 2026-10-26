/*
 * =========================================================================================
 * 4-SLOT SMART PARKING SYSTEM - ESP32 FIRMWARE
 * -----------------------------------------------------------------------------------------
 * Hardware Specification:
 * - Microcontroller: ESP32 DevKit V4
 * - Multiplexer: CD74HC4067 16-Channel Analog/Digital MUX
 * - Slot Sensors: 4x HC-SR04 Ultrasonic (Slots 1-4)
 *     Slot 1: MUX Channel C0 | Trigger GPIO 13
 *     Slot 2: MUX Channel C1 | Trigger GPIO 12
 *     Slot 3: MUX Channel C2 | Trigger GPIO 14
 *     Slot 4: MUX Channel C3 | Trigger GPIO 27
 *     Echo Input: Common MUX COM/SIG pin -> ESP32 GPIO 17
 *     MUX Select Pins: S0=GPIO 32, S1=GPIO 33, S2=GPIO 25, S3=GPIO 26
 * - Gate Sensor: HC-SR04 Ultrasonic -> GPIO 19 (Threshold < 50 cm)
 * - Gate Servo Barrier: ESP32 GPIO 18 (0 deg = OPEN, 90 deg = CLOSED/LOCKED)
 * - Display: 20x4 I2C LCD (SDA=GPIO 21, SCL=GPIO 22, Address 0x27)
 * - Cloud Sync: MQTT over Wi-Fi (broker.emqx.io:1883) & USB Serial (115200 baud)
 * - Telemetry Topic: smartparking/esp32/lot4/status
 * =========================================================================================
 */

#include <WiFi.h>
#include <PubSubClient.h>
#include <Wire.h>
#include <LiquidCrystal_I2C.h>
#include <ESP32Servo.h>
#include <ArduinoJson.h>

// -----------------------------------------------------------------------------
// Pin Definitions
// -----------------------------------------------------------------------------
// 4 Slot Ultrasonic Trigger Pins
const int SLOT_TRIG_PINS[4] = {13, 12, 14, 27};

// CD74HC4067 Multiplexer Pins
const int MUX_COM_PIN = 17; // Common signal pin connected to ESP32 for Echo readings
const int MUX_S0 = 32;
const int MUX_S1 = 33;
const int MUX_S2 = 25;
const int MUX_S3 = 26;

// Entrance Gate Sensor & Servo
const int GATE_PIN = 19;     // Trigger & Echo for Gate HC-SR04 (1-pin mode or tied TRIG/ECHO)
const int SERVO_PIN = 18;    // Servo PWM Control

// I2C LCD (20x4)
#define LCD_ADDR 0x27
#define LCD_COLS 20
#define LCD_ROWS 4

// -----------------------------------------------------------------------------
// Operational Thresholds & Constants
// -----------------------------------------------------------------------------
const int OCCUPANCY_THRESHOLD_CM = 100; // < 100cm = OCCUPIED (true), >= 100cm = AVAILABLE (false)
const int GATE_TRIGGER_THRESHOLD_CM = 50; // < 50cm triggers gate logic
const int TIMEOUT_DISTANCE_CM = 999;     // Fallback when sensor times out

const int SERVO_ANGLE_OPEN = 0;          // 0 deg = OPEN
const int SERVO_ANGLE_CLOSED = 90;       // 90 deg = CLOSED/LOCKED

const unsigned long TELEMETRY_INTERVAL_MS = 400; // Emit telemetry ~every 400ms

// -----------------------------------------------------------------------------
// Network & MQTT Settings
// -----------------------------------------------------------------------------
// For Wokwi simulation, Wokwi-GUEST connects automatically without password.
// For physical ESP32, replace with local Wi-Fi or run bridge/bridge.js over USB.
const char* WIFI_SSID = "Wokwi-GUEST";
const char* WIFI_PASSWORD = "";

const char* MQTT_BROKERS[2] = {"broker.emqx.io", "broker.hivemq.com"};
int   currentBrokerIdx = 0;
const int   MQTT_PORT = 1883;
const char* MQTT_TOPIC = "smartparking/esp32/lot4/status";

// -----------------------------------------------------------------------------
// Global Objects & State Variables
// -----------------------------------------------------------------------------
WiFiClient espClient;
PubSubClient mqttClient(espClient);
LiquidCrystal_I2C lcd(LCD_ADDR, LCD_COLS, LCD_ROWS);
Servo gateServo;

// Telemetry State
bool slotOccupied[4] = {false, false, false, false};
int  slotDistances[4] = {999, 999, 999, 999};
int  freeSlotCount = 4;
int  gateDistance = 999;
bool isGateOpen = false;

unsigned long lastTelemetryTime = 0;
unsigned long lastMqttRetryTime = 0;
unsigned long gateOpenedTimestamp = 0;

// -----------------------------------------------------------------------------
// CD74HC4067 Multiplexer Channel Selector
// -----------------------------------------------------------------------------
void selectMuxChannel(int channel) {
  digitalWrite(MUX_S0, (channel & 0x01) ? HIGH : LOW);
  digitalWrite(MUX_S1, (channel & 0x02) ? HIGH : LOW);
  digitalWrite(MUX_S2, (channel & 0x04) ? HIGH : LOW);
  digitalWrite(MUX_S3, (channel & 0x08) ? HIGH : LOW);
  delayMicroseconds(5); // Stabilize MUX channel routing
}

// -----------------------------------------------------------------------------
// Read Parking Slot Distance via Multiplexer
// -----------------------------------------------------------------------------
int readSlotDistance(int slotIndex) {
  int trigPin = SLOT_TRIG_PINS[slotIndex];

  // 1. Switch MUX to channel C0, C1, C2, or C3
  selectMuxChannel(slotIndex);

  // 2. Clear trigger pin
  digitalWrite(trigPin, LOW);
  delayMicroseconds(2);

  // 3. Send 10us HIGH pulse on trigger
  digitalWrite(trigPin, HIGH);
  delayMicroseconds(10);
  digitalWrite(trigPin, LOW);

  // 4. Measure Echo pulse duration arriving at MUX_COM_PIN (GPIO 17)
  // Max wait 25ms (~430 cm limit)
  long duration = pulseIn(MUX_COM_PIN, HIGH, 25000);

  if (duration <= 0) {
    return TIMEOUT_DISTANCE_CM; // No echo received or vehicle beyond range
  }

  int dist = (int)(duration * 0.0343 / 2.0);
  if (dist <= 0 || dist > 400) {
    return TIMEOUT_DISTANCE_CM;
  }
  return dist;
}

// -----------------------------------------------------------------------------
// Read Entrance Gate Ultrasonic Sensor (Pin 19)
// Supports tied TRIG+ECHO or single-pin pulse
// -----------------------------------------------------------------------------
int readGateDistance() {
  pinMode(GATE_PIN, OUTPUT);
  digitalWrite(GATE_PIN, LOW);
  delayMicroseconds(2);
  digitalWrite(GATE_PIN, HIGH);
  delayMicroseconds(10);
  digitalWrite(GATE_PIN, LOW);

  pinMode(GATE_PIN, INPUT);
  long duration = pulseIn(GATE_PIN, HIGH, 25000);

  if (duration <= 0) {
    return TIMEOUT_DISTANCE_CM;
  }

  int dist = (int)(duration * 0.0343 / 2.0);
  if (dist <= 0 || dist > 400) {
    return TIMEOUT_DISTANCE_CM;
  }
  return dist;
}

// -----------------------------------------------------------------------------
// Update 20x4 I2C LCD Display
// -----------------------------------------------------------------------------
void updateLcd() {
  // Row 0: System Header
  lcd.setCursor(0, 0);
  lcd.print("SMART PARKING 4-SLOT");

  // Row 1: Lot Status and Available Count
  lcd.setCursor(0, 1);
  if (freeSlotCount > 0) {
    lcd.print("LOT: OPEN   FREE: ");
  } else {
    lcd.print("LOT: FULL!  FREE: ");
  }
  lcd.print(freeSlotCount);
  lcd.print("/4 ");

  // Row 2: Individual Slot Indicators ([O]=Occupied, [.]=Available)
  lcd.setCursor(0, 2);
  for (int i = 0; i < 4; i++) {
    lcd.print("S");
    lcd.print(i + 1);
    lcd.print(slotOccupied[i] ? ":[X] " : ":[ ] ");
  }

  // Row 3: Entrance Barrier State & Sensor Distance
  lcd.setCursor(0, 3);
  if (isGateOpen) {
    lcd.print("GATE: OPEN  (0\xDF)   ");
  } else {
    lcd.print("GATE: LOCK (90\xDF)   ");
  }
  lcd.setCursor(14, 3);
  if (gateDistance < 100) lcd.print(" ");
  if (gateDistance < 10)  lcd.print(" ");
  lcd.print(gateDistance);
  lcd.print("cm");
}

// -----------------------------------------------------------------------------
// Build Structured JSON Telemetry String
// -----------------------------------------------------------------------------
String buildJsonPayload() {
  StaticJsonDocument<256> doc;

  JsonArray slotsArray = doc.createNestedArray("slots");
  JsonArray distArray = doc.createNestedArray("distances");

  for (int i = 0; i < 4; i++) {
    slotsArray.add(slotOccupied[i]);
    distArray.add(slotDistances[i]);
  }

  doc["free"] = freeSlotCount;
  doc["total"] = 4;
  doc["gateDist"] = gateDistance;
  doc["gateOpen"] = isGateOpen;

  String output;
  serializeJson(doc, output);
  return output;
}

// -----------------------------------------------------------------------------
// MQTT Connection Management (Non-blocking)
// -----------------------------------------------------------------------------
void maintainMqtt() {
  if (WiFi.status() != WL_CONNECTED) {
    return; // Cannot connect MQTT without Wi-Fi; Serial bridge still functions
  }

  if (!mqttClient.connected()) {
    unsigned long now = millis();
    if (now - lastMqttRetryTime > 4000) {
      lastMqttRetryTime = now;
      const char* activeBroker = MQTT_BROKERS[currentBrokerIdx];
      mqttClient.setServer(activeBroker, MQTT_PORT);
      String clientId = "ESP32-SmartParking-" + String(random(0xffff), HEX);
      Serial.print("[MQTT] Connecting to ");
      Serial.print(activeBroker);
      Serial.print(" as ");
      Serial.println(clientId);
      if (mqttClient.connect(clientId.c_str())) {
        Serial.print("[MQTT] Connected successfully to ");
        Serial.println(activeBroker);
      } else {
        Serial.print("[MQTT] Connection failed, rc=");
        Serial.println(mqttClient.state());
        // Switch to alternative broker on failure
        currentBrokerIdx = (currentBrokerIdx + 1) % 2;
      }
    }
  } else {
    mqttClient.loop();
  }
}

// -----------------------------------------------------------------------------
// Setup Routine
// -----------------------------------------------------------------------------
void setup() {
  Serial.begin(115200);
  delay(100);
  Serial.println("\n==================================================");
  Serial.println("  4-Slot Smart Parking System Initializing...     ");
  Serial.println("==================================================");

  // Initialize Multiplexer Select Pins
  pinMode(MUX_S0, OUTPUT);
  pinMode(MUX_S1, OUTPUT);
  pinMode(MUX_S2, OUTPUT);
  pinMode(MUX_S3, OUTPUT);
  digitalWrite(MUX_S0, LOW);
  digitalWrite(MUX_S1, LOW);
  digitalWrite(MUX_S2, LOW);
  digitalWrite(MUX_S3, LOW);

  // Common MUX Echo Signal Pin
  pinMode(MUX_COM_PIN, INPUT);

  // Slot Ultrasonic Trigger Pins
  for (int i = 0; i < 4; i++) {
    pinMode(SLOT_TRIG_PINS[i], OUTPUT);
    digitalWrite(SLOT_TRIG_PINS[i], LOW);
  }

  // Gate Sensor Pin
  pinMode(GATE_PIN, OUTPUT);
  digitalWrite(GATE_PIN, LOW);

  // Initialize Servo Barrier (GPIO 18)
  ESP32PWM::allocateTimer(0);
  ESP32PWM::allocateTimer(1);
  ESP32PWM::allocateTimer(2);
  ESP32PWM::allocateTimer(3);
  gateServo.setPeriodHertz(50); // Standard 50Hz servo
  gateServo.attach(SERVO_PIN, 500, 2400);
  gateServo.write(SERVO_ANGLE_CLOSED); // Default CLOSED (90 deg)
  isGateOpen = false;

  // Initialize 20x4 I2C LCD (SDA=21, SCL=22)
  Wire.begin(21, 22);
  lcd.init();
  lcd.backlight();
  lcd.clear();
  lcd.setCursor(0, 0);
  lcd.print(" SMART PARKING LOT ");
  lcd.setCursor(0, 1);
  lcd.print("Initializing System");
  lcd.setCursor(0, 2);
  lcd.print("Connecting WiFi...");

  // Wi-Fi Connection
  Serial.print("[WIFI] Connecting to ");
  Serial.println(WIFI_SSID);
  WiFi.mode(WIFI_STA);
  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);

  // Non-blocking wait for up to 3 seconds for initial Wi-Fi in Wokwi
  unsigned long startWifi = millis();
  while (WiFi.status() != WL_CONNECTED && millis() - startWifi < 3500) {
    delay(200);
    Serial.print(".");
  }

  if (WiFi.status() == WL_CONNECTED) {
    Serial.println("\n[WIFI] Connected! IP: " + WiFi.localIP().toString());
    lcd.setCursor(0, 3);
    lcd.print("WiFi OK: ");
    lcd.print(WiFi.localIP());
  } else {
    Serial.println("\n[WIFI] Running in Offline / USB Serial Bridge mode");
    lcd.setCursor(0, 3);
    lcd.print("USB Serial Mode     ");
  }

  // Setup MQTT (Defaults to primary broker.emqx.io with automatic failover)
  mqttClient.setServer(MQTT_BROKERS[0], MQTT_PORT);
  mqttClient.setBufferSize(512);

  delay(1000);
  lcd.clear();
  Serial.println("[SYSTEM] Ready! Emitting JSON telemetry every ~400ms.");
}

// -----------------------------------------------------------------------------
// Main Loop
// -----------------------------------------------------------------------------
void loop() {
  // Maintain Wi-Fi and MQTT connection
  maintainMqtt();

  unsigned long currentMillis = millis();

  // Run telemetry cycle every ~400ms
  if (currentMillis - lastTelemetryTime >= TELEMETRY_INTERVAL_MS) {
    lastTelemetryTime = currentMillis;

    // 1. Read all 4 parking slot sensors via CD74HC4067 MUX
    int freeCount = 0;
    for (int i = 0; i < 4; i++) {
      int dist = readSlotDistance(i);
      slotDistances[i] = dist;

      // Occupancy rule: < 100cm = OCCUPIED (true), >= 100cm = AVAILABLE (false)
      if (dist < OCCUPANCY_THRESHOLD_CM) {
        slotOccupied[i] = true;
      } else {
        slotOccupied[i] = false;
        freeCount++;
      }
      delayMicroseconds(200); // Inter-sensor settling time
    }
    freeSlotCount = freeCount;

    // 2. Read Entrance Gate HC-SR04 Sensor (Pin 19)
    gateDistance = readGateDistance();

    // 3. Gate Barrier Control Logic
    // Vehicle approaching entrance (< 50 cm)
    if (gateDistance < GATE_TRIGGER_THRESHOLD_CM) {
      if (freeSlotCount > 0) {
        // Space available: Open Barrier (0 deg)
        if (!isGateOpen) {
          gateServo.write(SERVO_ANGLE_OPEN);
          isGateOpen = true;
          gateOpenedTimestamp = currentMillis;
          Serial.println("[GATE] Vehicle detected & slots available -> BARRIER OPENED (0 deg)");
        }
      } else {
        // Lot full: Keep Barrier Locked (90 deg)
        if (isGateOpen) {
          gateServo.write(SERVO_ANGLE_CLOSED);
          isGateOpen = false;
        }
        Serial.println("[GATE] Vehicle at gate but LOT FULL -> BARRIER REMAINS LOCKED (90 deg)");
      }
    } else {
      // No vehicle at gate (>= 50 cm)
      if (isGateOpen) {
        // Close barrier once vehicle has cleared
        gateServo.write(SERVO_ANGLE_CLOSED);
        isGateOpen = false;
        Serial.println("[GATE] Vehicle cleared entrance -> BARRIER CLOSED (90 deg)");
      }
    }

    // 4. Update Physical 20x4 LCD
    updateLcd();

    // 5. Build Structured JSON Telemetry String
    String payload = buildJsonPayload();

    // 6. Prints structured JSON over USB Serial so laptop can read via USB OR Wi-Fi:
    Serial.println("JSON_DATA:" + payload);

    // 7. Publish Telemetry over MQTT if connected
    if (mqttClient.connected()) {
      mqttClient.publish(MQTT_TOPIC, payload.c_str());
    }
  }
}
