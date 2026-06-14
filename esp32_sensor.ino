// ╔═══════════════════════════════════════════════════════════════════════════╗
// ║                    TOI SANTUY — Smart Garden IoT Firmware                  ║
// ║                              ESP32 Edition                                 ║
// ╠═══════════════════════════════════════════════════════════════════════════╣
// ║ Sensor   : DHT22 (Suhu & Kelembaban), MQ135 (Kualitas Udara),              ║
// ║            Soil Moisture (Kelembaban Tanah)                                ║
// ║ Aktuator : Relay Pompa Air 12V, Relay Lampu                                ║
// ╠═══════════════════════════════════════════════════════════════════════════╣
// ║ Library yang dibutuhkan (install via Library Manager Arduino IDE):         ║
// ║   - DHT sensor library (by Adafruit)                                       ║
// ║   - Adafruit Unified Sensor                                                ║
// ║   - ArduinoJson (by Benoit Blanchon)                                       ║
// ╚═══════════════════════════════════════════════════════════════════════════╝

#include <WiFi.h>
#include <HTTPClient.h>
#include <ArduinoJson.h>
#include <DHT.h>

// ─────────────────────────────────────────────────────────────────────────────
//  ⚙️  KONFIGURASI — UBAH SESUAI KEBUTUHAN KAMU
// ─────────────────────────────────────────────────────────────────────────────

// WiFi
const char* WIFI_SSID     = "NAMA_WIFI_KAMU";
const char* WIFI_PASSWORD = "PASSWORD_WIFI_KAMU";

// Server (ganti dengan URL Railway/Render kamu, TANPA tanda "/" di akhir)
const char* SERVER_URL = "https://smartgarden-production-2a96.up.railway.app";

// Pin Sensor
#define DHT_PIN    4    // GPIO4  → Data pin DHT22
#define DHT_TYPE   DHT22
#define MQ135_PIN  34   // GPIO34 → Analog MQ135   (ADC1, hindari GPIO 0/2/4 saat WiFi aktif)
#define SOIL_PIN   35   // GPIO35 → Analog Soil Moisture (ADC1)

// Pin Aktuator (Relay)
#define RELAY_PUMP_PIN  26   // GPIO26 → IN Relay Pompa
#define RELAY_LAMP_PIN  27   // GPIO27 → IN Relay Lampu

// Tipe Relay: true jika modul relay kamu Active-LOW (kebanyakan modul relay 1-channel)
#define RELAY_ACTIVE_LOW true

// Kalibrasi Soil Moisture (sesuaikan dengan sensor kamu)
//   - Celupkan sensor ke air  → catat nilai analogRead → masukkan ke WET_VALUE
//   - Keringkan sensor total  → catat nilai analogRead → masukkan ke DRY_VALUE
#define SOIL_DRY_VALUE  3300
#define SOIL_WET_VALUE  1100

// Interval (milidetik)
#define SEND_INTERVAL        2000   // kirim data sensor ke server
#define ACTUATOR_POLL_INTERVAL 1000 // cek status pompa & lampu dari server

// ─────────────────────────────────────────────────────────────────────────────
//  GLOBAL STATE — tidak perlu diubah
// ─────────────────────────────────────────────────────────────────────────────
DHT dht(DHT_PIN, DHT_TYPE);

unsigned long lastSend = 0;
unsigned long lastPoll = 0;

bool pumpState = false;
bool lampState = false;

// ─────────────────────────────────────────────────────────────────────────────
//  HELPER: Tulis ke relay sesuai tipe (active-low / active-high)
// ─────────────────────────────────────────────────────────────────────────────
void writeRelay(int pin, bool on) {
  #if RELAY_ACTIVE_LOW
    digitalWrite(pin, on ? LOW : HIGH);
  #else
    digitalWrite(pin, on ? HIGH : LOW);
  #endif
}

// ─────────────────────────────────────────────────────────────────────────────
//  SETUP
// ─────────────────────────────────────────────────────────────────────────────
void setup() {
  Serial.begin(115200);
  delay(300);
  Serial.println("\n=== TOI SANTUY — Smart Garden IoT ===");

  // Init pin relay (default OFF)
  pinMode(RELAY_PUMP_PIN, OUTPUT);
  pinMode(RELAY_LAMP_PIN, OUTPUT);
  writeRelay(RELAY_PUMP_PIN, false);
  writeRelay(RELAY_LAMP_PIN, false);

  // Init sensor
  dht.begin();
  analogSetAttenuation(ADC_11db); // ADC range 0-3.3V untuk sensor analog

  // Koneksi WiFi
  connectWiFi();
}

void connectWiFi() {
  Serial.print("Menghubungkan ke WiFi");
  WiFi.mode(WIFI_STA);
  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);

  int attempts = 0;
  while (WiFi.status() != WL_CONNECTED && attempts < 40) {
    delay(500);
    Serial.print(".");
    attempts++;
  }

  if (WiFi.status() == WL_CONNECTED) {
    Serial.println("\n✓ WiFi terhubung!");
    Serial.print("  IP Address : "); Serial.println(WiFi.localIP());
    Serial.print("  Server     : "); Serial.println(SERVER_URL);
  } else {
    Serial.println("\n✗ Gagal konek WiFi, akan dicoba ulang di loop()");
  }
}

// ─────────────────────────────────────────────────────────────────────────────
//  BACA SENSOR
// ─────────────────────────────────────────────────────────────────────────────
float readTemperature() {
  float t = dht.readTemperature();
  if (isnan(t)) { Serial.println("  ⚠ Gagal baca suhu DHT"); return 0; }
  return t;
}

float readHumidity() {
  float h = dht.readHumidity();
  if (isnan(h)) { Serial.println("  ⚠ Gagal baca kelembaban DHT"); return 0; }
  return h;
}

// MQ135 — konversi ADC ke perkiraan ppm (kalibrasi sederhana, 0-1000ppm)
float readAirQuality() {
  int raw = analogRead(MQ135_PIN);          // 0 - 4095
  float ppm = (float)raw / 4095.0 * 1000.0; // skala 0-1000ppm
  return ppm;
}

// Soil Moisture — konversi ADC ke persen (0% kering, 100% basah)
float readSoilMoisture() {
  int raw = analogRead(SOIL_PIN);
  float pct = map(raw, SOIL_DRY_VALUE, SOIL_WET_VALUE, 0, 100);
  pct = constrain(pct, 0, 100);
  return pct;
}

// ─────────────────────────────────────────────────────────────────────────────
//  KIRIM DATA SENSOR KE SERVER
//  POST {SERVER_URL}/api/sensor
// ─────────────────────────────────────────────────────────────────────────────
void sendSensorData(float temp, float hum, float air, float soil) {
  if (WiFi.status() != WL_CONNECTED) {
    Serial.println("  ⚠ WiFi putus, reconnect...");
    connectWiFi();
    return;
  }

  HTTPClient http;
  String url = String(SERVER_URL) + "/api/sensor";
  http.begin(url);
  http.addHeader("Content-Type", "application/json");
  http.setTimeout(5000);

  StaticJsonDocument<256> doc;
  doc["temperature"]  = temp;
  doc["humidity"]     = hum;
  doc["airQuality"]   = air;
  doc["soilMoisture"] = soil;

  String body;
  serializeJson(doc, body);

  int code = http.POST(body);
  if (code == 200) {
    Serial.printf("  ✓ Data terkirim | Suhu:%.1f°C Hum:%.1f%% Air:%.0fppm Soil:%.1f%%\n", temp, hum, air, soil);
  } else {
    Serial.printf("  ✗ Gagal kirim data (HTTP %d)\n", code);
  }
  http.end();
}

// ─────────────────────────────────────────────────────────────────────────────
//  POLLING STATUS AKTUATOR (POMPA & LAMPU) DARI SERVER
//  GET {SERVER_URL}/api/pump  &  GET {SERVER_URL}/api/lamp
// ─────────────────────────────────────────────────────────────────────────────
bool fetchStatus(const char* endpoint, const char* jsonKey, bool currentState) {
  if (WiFi.status() != WL_CONNECTED) return currentState;

  HTTPClient http;
  String url = String(SERVER_URL) + endpoint;
  http.begin(url);
  http.setTimeout(3000);

  bool newState = currentState;
  int code = http.GET();
  if (code == 200) {
    String resp = http.getString();
    StaticJsonDocument<64> doc;
    DeserializationError err = deserializeJson(doc, resp);
    if (!err) newState = doc[jsonKey] | currentState;
  }
  http.end();
  return newState;
}

void pollActuators() {
  // Pompa
  bool newPump = fetchStatus("/api/pump", "pumpStatus", pumpState);
  if (newPump != pumpState) {
    pumpState = newPump;
    writeRelay(RELAY_PUMP_PIN, pumpState);
    Serial.printf("  💧 Pompa  -> %s\n", pumpState ? "ON" : "OFF");
  }

  // Lampu
  bool newLamp = fetchStatus("/api/lamp", "lampStatus", lampState);
  if (newLamp != lampState) {
    lampState = newLamp;
    writeRelay(RELAY_LAMP_PIN, lampState);
    Serial.printf("  💡 Lampu  -> %s\n", lampState ? "ON" : "OFF");
  }
}

// ─────────────────────────────────────────────────────────────────────────────
//  LOOP
// ─────────────────────────────────────────────────────────────────────────────
void loop() {
  unsigned long now = millis();

  // Kirim data sensor setiap SEND_INTERVAL
  if (now - lastSend >= SEND_INTERVAL) {
    lastSend = now;
    float temp = readTemperature();
    float hum  = readHumidity();
    float air  = readAirQuality();
    float soil = readSoilMoisture();
    sendSensorData(temp, hum, air, soil);
  }

  // Cek status pompa & lampu setiap ACTUATOR_POLL_INTERVAL
  if (now - lastPoll >= ACTUATOR_POLL_INTERVAL) {
    lastPoll = now;
    pollActuators();
  }
}
