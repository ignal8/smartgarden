// ─────────────────────────────────────────────────────────────────────────────
// SmartGarden IoT Backend — Node.js + Express
// Deploy ke Railway / Render (gratis)
// ─────────────────────────────────────────────────────────────────────────────
// Install: npm install express cors
// Jalankan: node server.js
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
  timestamp:    null,
};

let history = [];          // simpan 100 data terakhir
const MAX_HISTORY = 100;

// ─── ROUTES ──────────────────────────────────────────────────────────────────

// ESP32 kirim data sensor ke sini
// POST /api/sensor
// Body: { temperature, humidity, airQuality, soilMoisture }
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
    timestamp:    new Date().toISOString(),
    time:         new Date().toLocaleTimeString("id-ID", {
                    hour: "2-digit", minute: "2-digit", second: "2-digit",
                    timeZone: "Asia/Jakarta"
                  }),
  };

  latestData = entry;
  history.push(entry);
  if (history.length > MAX_HISTORY) history.shift();

  console.log(`[${entry.time}] Temp:${entry.temperature}°C Hum:${entry.humidity}% Air:${entry.airQuality}ppm Soil:${entry.soilMoisture}%`);
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

// Dashboard kontrol pompa
// POST /api/pump
// Body: { status: true/false }
app.post("/api/pump", (req, res) => {
  const { status } = req.body;
  latestData.pumpStatus = !!status;
  console.log(`[PUMP] Status: ${latestData.pumpStatus ? "ON" : "OFF"}`);
  res.json({ success: true, pumpStatus: latestData.pumpStatus });
});

// ESP32 polling status pompa
// GET /api/pump
app.get("/api/pump", (req, res) => {
  res.json({ pumpStatus: latestData.pumpStatus });
});

// Health check
app.get("/", (req, res) => {
  res.json({
    status: "SmartGarden IoT Server running",
    dataPoints: history.length,
    lastUpdate: latestData.timestamp,
  });
});

// ─── START ───────────────────────────────────────────────────────────────────
const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`SmartGarden Server berjalan di port ${PORT}`);
});
