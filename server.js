// ─────────────────────────────────────────────────────────────────────────────
// SmartGarden IoT Backend — Node.js + Express
// Deploy ke Railway / Render (gratis)
// ─────────────────────────────────────────────────────────────────────────────
const express = require("express");
const cors    = require("cors");
const app     = express();

app.use(cors());
app.use(express.json());

// ─── IN-MEMORY STORAGE ───────────────────────────────────────────────────────
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
const MAX_HISTORY = 100;

// ─── SENSOR DATA ─────────────────────────────────────────────────────────────
// ESP32 kirim data sensor
// POST /api/sensor
app.post("/api/sensor", (req, res) => {
  const { temperature, humidity, airQuality, soilMoisture } = req.body;
  if (temperature === undefined || humidity === undefined) {
    return res.status(400).json({ error: "Data tidak lengkap" });
  }
  const entry = {
    temperature:  parseFloat(temperature),
    humidity:     parseFloat(humidity),
    airQuality:   parseFloat(airQuality ?? 0),
    soilMoisture: parseFloat(soilMoisture ?? 0),
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
  console.log(`[${entry.time}] T:${entry.temperature}°C H:${entry.humidity}% Air:${entry.airQuality}ppm Soil:${entry.soilMoisture}%`);
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
  console.log(`[POMPA] ${latestData.pumpStatus ? "ON" : "OFF"}`);
  res.json({ success: true, pumpStatus: latestData.pumpStatus });
});

// ESP32 polling status pompa
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
  console.log(`[LAMPU] ${latestData.lampStatus ? "ON" : "OFF"}`);
  res.json({ success: true, lampStatus: latestData.lampStatus });
});

// ESP32 polling status lampu
// GET /api/lamp
app.get("/api/lamp", (req, res) => {
  res.json({ lampStatus: latestData.lampStatus });
});

// ─── HEALTH CHECK ─────────────────────────────────────────────────────────────
app.get("/", (req, res) => {
  res.json({
    status:     "Toi Santuy IoT Server running",
    dataPoints: history.length,
    lastUpdate: latestData.timestamp,
    pump:       latestData.pumpStatus,
    lamp:       latestData.lampStatus,
  });
});

// ─── START ────────────────────────────────────────────────────────────────────
const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Toi Santuy Server berjalan di port ${PORT}`);
});
