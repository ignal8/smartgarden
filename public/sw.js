// ─────────────────────────────────────────────────────────────────────────────
// TOI SANTUY — Smart Garden IoT Backend (Node.js + Express)
// Deploy ke Railway / Render (gratis)
//
// Fitur:
//  - REST API untuk ESP32 (sensor data, kontrol pompa/lampu)
//  - Menyajikan dashboard (folder "public/")
//  - Persistensi data ke file (data.json) — bertahan walau server restart
//  - Bridge MQTT (opsional) — ESP32 bisa komunikasi via broker MQTT,
//    server akan menjembatani data MQTT <-> REST API/dashboard
// ─────────────────────────────────────────────────────────────────────────────
const express = require("express");
const cors    = require("cors");
const path    = require("path");
const fs      = require("fs");
const mqtt    = require("mqtt");
const app     = express();

app.use(cors());
app.use(express.json());

// Serve dashboard HTML
const publicDir = path.join(__dirname, "public");
console.log(`[STATIC] Serving from: ${publicDir}`);
console.log(`[STATIC] public/ exists: ${fs.existsSync(publicDir)}`);
if (fs.existsSync(publicDir)) {
  app.use(express.static(publicDir));
  app.get("/", (req, res) => {
    res.sendFile(path.join(publicDir, "index.html"));
  });
}

// ─── PERSISTENSI (file data.json) ────────────────────────────────────────────
const DATA_FILE = path.join(__dirname, "data.json");
const MAX_HISTORY = 100;

let latestData = {
  temperature:  null,
  humidity:     null,
  airQuality:   null,
  soilMoisture: null,
  pumpStatus:   false,
  lampStatus:   false,
  timestamp:    null,
};
let history = [];
let mqttConfig = {
  enabled:    false,
  brokerUrl:  "",   // contoh: mqtt://broker.hivemq.com:1883  atau  mqtts://xxxx.hivemq.cloud:8883
  username:   "",
  password:   "",
  deviceCode: "",   // namespace/topik unik milik user, contoh: "toisantuy-ab12cd"
};

function loadData() {
  try {
    const raw = fs.readFileSync(DATA_FILE, "utf8");
    const parsed = JSON.parse(raw);
    if (parsed.latestData) latestData = { ...latestData, ...parsed.latestData };
    if (Array.isArray(parsed.history)) history = parsed.history.slice(-MAX_HISTORY);
    if (parsed.mqttConfig) mqttConfig = { ...mqttConfig, ...parsed.mqttConfig };
    console.log(`[DATA] Loaded ${history.length} history points from ${DATA_FILE}`);
  } catch {
    console.log("[DATA] Tidak ada data tersimpan sebelumnya, mulai dari kosong");
  }
}

let saveTimer = null;
function saveData() {
  // Debounce — hindari terlalu sering menulis file saat data masuk cepat
  if (saveTimer) return;
  saveTimer = setTimeout(() => {
    saveTimer = null;
    const payload = JSON.stringify({ latestData, history, mqttConfig }, null, 2);
    fs.writeFile(DATA_FILE, payload, (err) => {
      if (err) console.error("[DATA] Gagal simpan:", err.message);
    });
  }, 500);
}

loadData();

// ─── INGEST SENSOR DATA (dipakai oleh REST & MQTT) ───────────────────────────
function ingestSensorData({ temperature, humidity, airQuality, soilMoisture }) {
  const entry = {
    temperature:  parseFloat(temperature)  || 0,
    humidity:     parseFloat(humidity)     || 0,
    airQuality:   parseFloat(airQuality)   || 0,
    soilMoisture: parseFloat(soilMoisture) || 0,
    pumpStatus:   latestData.pumpStatus,
    lampStatus:   latestData.lampStatus,
    timestamp:    new Date().toISOString(),
    time:         new Date().toLocaleTimeString("id-ID", {
                    hour: "2-digit", minute: "2-digit", second: "2-digit",
                    timeZone: "Asia/Jakarta"
                  }),
  };
  latestData = { ...latestData, ...entry };
  history.push(entry);
  if (history.length > MAX_HISTORY) history.shift();
  saveData();
  console.log(`[SENSOR] T:${entry.temperature}°C H:${entry.humidity}% Air:${entry.airQuality}ppm Soil:${entry.soilMoisture}%`);
  return entry;
}

// ─── MQTT BRIDGE ──────────────────────────────────────────────────────────────
// Topik yang dipakai (ganti {code} dengan mqttConfig.deviceCode):
//   {code}/sensor   -> ESP32 publish JSON sensor (server subscribe)
//   {code}/pump     -> server publish status pompa (ESP32 subscribe)
//   {code}/lamp     -> server publish status lampu (ESP32 subscribe)
let mqttClient = null;
let mqttStatus = "disabled"; // disabled | connecting | connected | error

function topicSensor() { return `${mqttConfig.deviceCode}/sensor`; }
function topicPump()   { return `${mqttConfig.deviceCode}/pump`;   }
function topicLamp()   { return `${mqttConfig.deviceCode}/lamp`;   }

function connectMQTT() {
  if (mqttClient) {
    try { mqttClient.end(true); } catch {}
    mqttClient = null;
  }
  if (!mqttConfig.enabled || !mqttConfig.brokerUrl || !mqttConfig.deviceCode) {
    mqttStatus = "disabled";
    return;
  }

  mqttStatus = "connecting";
  console.log(`[MQTT] Menghubungkan ke ${mqttConfig.brokerUrl} ...`);

  const opts = { reconnectPeriod: 5000, connectTimeout: 8000 };
  if (mqttConfig.username) opts.username = mqttConfig.username;
  if (mqttConfig.password) opts.password = mqttConfig.password;

  try {
    mqttClient = mqtt.connect(mqttConfig.brokerUrl, opts);
  } catch (e) {
    mqttStatus = "error";
    console.error("[MQTT] Gagal connect:", e.message);
    return;
  }

  mqttClient.on("connect", () => {
    mqttStatus = "connected";
    console.log("[MQTT] Terhubung ke broker");
    mqttClient.subscribe(topicSensor(), (err) => {
      if (err) console.error("[MQTT] Gagal subscribe:", err.message);
      else console.log(`[MQTT] Subscribe ke ${topicSensor()}`);
    });
    // Kirim status pompa/lampu terkini ke ESP32 saat baru konek
    mqttClient.publish(topicPump(), JSON.stringify({ status: latestData.pumpStatus }), { retain: true });
    mqttClient.publish(topicLamp(), JSON.stringify({ status: latestData.lampStatus }), { retain: true });
  });

  mqttClient.on("message", (topic, message) => {
    if (topic === topicSensor()) {
      try {
        const data = JSON.parse(message.toString());
        ingestSensorData(data);
      } catch (e) {
        console.error("[MQTT] Payload sensor tidak valid:", e.message);
      }
    }
  });

  mqttClient.on("error", (err) => {
    mqttStatus = "error";
    console.error("[MQTT] Error:", err.message);
  });

  mqttClient.on("close", () => {
    if (mqttStatus !== "error") mqttStatus = "disconnected";
  });
}

function publishDeviceState(device) {
  if (!mqttClient || mqttStatus !== "connected") return;
  if (device === "pump") {
    mqttClient.publish(topicPump(), JSON.stringify({ status: latestData.pumpStatus }), { retain: true });
  } else if (device === "lamp") {
    mqttClient.publish(topicLamp(), JSON.stringify({ status: latestData.lampStatus }), { retain: true });
  }
}

connectMQTT(); // mulai bridge jika config tersimpan sudah enabled

// ─── SENSOR DATA (REST) ───────────────────────────────────────────────────────
// ESP32 kirim data sensor via HTTP
// POST /api/sensor
app.post("/api/sensor", (req, res) => {
  const { temperature, humidity, airQuality, soilMoisture } = req.body;
  if (temperature === undefined || humidity === undefined) {
    return res.status(400).json({ error: "Data tidak lengkap" });
  }
  const entry = ingestSensorData({ temperature, humidity, airQuality, soilMoisture });
  res.json({ success: true, received: entry });
});

// Dashboard ambil data terbaru
// GET /api/sensor/latest
app.get("/api/sensor/latest", (req, res) => {
  res.json(latestData);
});

// Dashboard ambil history
// GET /api/sensor/history?limit=40
app.get("/api/sensor/history", (req, res) => {
  const limit = parseInt(req.query.limit ?? "40");
  res.json(history.slice(-limit));
});

// ─── POMPA ────────────────────────────────────────────────────────────────────
// Dashboard kontrol pompa
// POST /api/pump  body: { status: true/false }
app.post("/api/pump", (req, res) => {
  const { status } = req.body;
  latestData.pumpStatus = !!status;
  saveData();
  publishDeviceState("pump");
  console.log(`[POMPA] ${latestData.pumpStatus ? "ON" : "OFF"}`);
  res.json({ success: true, pumpStatus: latestData.pumpStatus });
});

// ESP32 polling status pompa (mode HTTP, tidak perlu jika pakai MQTT)
// GET /api/pump
app.get("/api/pump", (req, res) => {
  res.json({ pumpStatus: latestData.pumpStatus });
});

// ─── LAMPU ────────────────────────────────────────────────────────────────────
// Dashboard kontrol lampu
// POST /api/lamp  body: { status: true/false }
app.post("/api/lamp", (req, res) => {
  const { status } = req.body;
  latestData.lampStatus = !!status;
  saveData();
  publishDeviceState("lamp");
  console.log(`[LAMPU] ${latestData.lampStatus ? "ON" : "OFF"}`);
  res.json({ success: true, lampStatus: latestData.lampStatus });
});

// ESP32 polling status lampu (mode HTTP, tidak perlu jika pakai MQTT)
// GET /api/lamp
app.get("/api/lamp", (req, res) => {
  res.json({ lampStatus: latestData.lampStatus });
});

// ─── MQTT CONFIG ──────────────────────────────────────────────────────────────
// Dashboard simpan konfigurasi broker MQTT
// POST /api/mqtt-config  body: { enabled, brokerUrl, username, password, deviceCode }
// Catatan: jika "password" tidak dikirim (undefined), password lama tetap dipakai
// — supaya dashboard tidak perlu mengirim ulang password setiap kali simpan.
app.post("/api/mqtt-config", (req, res) => {
  const { enabled, brokerUrl, username, password, deviceCode } = req.body;
  mqttConfig = {
    enabled:    !!enabled,
    brokerUrl:  (brokerUrl ?? "").trim(),
    username:   username ?? "",
    password:   password !== undefined ? password : mqttConfig.password,
    deviceCode: (deviceCode ?? "").trim(),
  };
  saveData();
  connectMQTT();
  res.json({ success: true, mqttConfig: { ...mqttConfig, password: mqttConfig.password ? "••••••" : "" } });
});

// Dashboard ambil konfigurasi MQTT (password disensor)
// GET /api/mqtt-config
app.get("/api/mqtt-config", (req, res) => {
  res.json({ ...mqttConfig, password: mqttConfig.password ? "••••••" : "" });
});

// Dashboard cek status koneksi MQTT
// GET /api/mqtt-status
app.get("/api/mqtt-status", (req, res) => {
  res.json({ status: mqttStatus, topics: mqttConfig.deviceCode ? {
    sensor: topicSensor(), pump: topicPump(), lamp: topicLamp(),
  } : null });
});

// ─── EXPORT DATA ──────────────────────────────────────────────────────────────
// Download seluruh history sebagai JSON
// GET /api/export
app.get("/api/export", (req, res) => {
  res.setHeader("Content-Disposition", "attachment; filename=toisantuy-data.json");
  res.json({ exportedAt: new Date().toISOString(), latestData, history });
});

// ─── HEALTH CHECK / STATUS ────────────────────────────────────────────────────
app.get("/api/status", (req, res) => {
  res.json({
    status:     "Toi Santuy IoT Server running",
    dataPoints: history.length,
    lastUpdate: latestData.timestamp,
    pump:       latestData.pumpStatus,
    lamp:       latestData.lampStatus,
    mqtt:       mqttStatus,
  });
});

// ─── START ────────────────────────────────────────────────────────────────────
const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Toi Santuy Server berjalan di port ${PORT}`);
});
