# 🌱 Toi Santuy — Smart Garden IoT Monitor

Sistem monitoring & kontrol IoT untuk kebun/greenhouse menggunakan ESP32, dengan dashboard realtime ala Grafana.

---

## 📦 Isi Proyek

| File | Fungsi |
|---|---|
| `server.js` | Backend API (Node.js + Express) — jembatan ESP32 ↔ Dashboard |
| `package.json` | Daftar dependency backend |
| `esp32_sensor.ino` | Firmware ESP32 — baca sensor & kontrol relay |
| `iot_dashboard.jsx` | Dashboard web realtime (React) |

---

## 🔧 Hardware

- ESP32 (DevKit / NodeMCU-32S)
- Sensor DHT22 → Suhu & Kelembaban Udara
- Sensor MQ135 → Kualitas Udara
- Sensor Soil Moisture → Kelembaban Tanah
- 2x Relay Module → Pompa Air 12V & Lampu

### Wiring (default pin di kode)

| Komponen | Pin ESP32 |
|---|---|
| DHT22 Data | GPIO 4 |
| MQ135 Analog | GPIO 34 |
| Soil Moisture Analog | GPIO 35 |
| Relay Pompa (IN) | GPIO 26 |
| Relay Lampu (IN) | GPIO 27 |

> ⚠️ Sesuaikan `RELAY_ACTIVE_LOW` di kode jika modul relay kamu active-high.

---

## 🚀 Cara Deploy

### 1. Backend (Railway)
```bash
git init
git add .
git commit -m "deploy toi santuy server"
git branch -M main
git remote add origin https://github.com/USERNAME/smartgarden.git
git push -u origin main
```
Lalu di [railway.app](https://railway.app):
- New Project → Deploy from GitHub repo → pilih repo `smartgarden`
- Set **Root Directory** = `/` (jika file langsung di root) atau sesuaikan
- Setelah deploy, copy domain (contoh: `https://smartgarden-production-xxxx.up.railway.app`)

### 2. Firmware ESP32
Edit bagian konfigurasi di `esp32_sensor.ino`:
```cpp
const char* WIFI_SSID     = "NAMA_WIFI";
const char* WIFI_PASSWORD = "PASSWORD_WIFI";
const char* SERVER_URL    = "https://smartgarden-production-xxxx.up.railway.app";
```
Upload ke ESP32 via Arduino IDE.

### 3. Dashboard
Buka `iot_dashboard.jsx` di Claude / React project.
Di tab **🔌 Server**, masukkan URL Railway yang sama, klik **HUBUNGKAN**.

---

## 🔌 API Endpoints

| Method | Endpoint | Fungsi |
|---|---|---|
| POST | `/api/sensor` | ESP32 kirim data sensor |
| GET | `/api/sensor/latest` | Dashboard ambil data terbaru |
| GET | `/api/sensor/history?limit=40` | Dashboard ambil histori |
| POST | `/api/pump` | Dashboard set status pompa |
| GET | `/api/pump` | ESP32 cek status pompa |
| POST | `/api/lamp` | Dashboard set status lampu |
| GET | `/api/lamp` | ESP32 cek status lampu |

---

## ✨ Fitur Dashboard

- 📊 Grafik realtime 4 sensor (Suhu, Kelembaban Udara, Kualitas Udara, Kelembaban Tanah)
- 💧 Kontrol Pompa (manual + jadwal otomatis per hari & jam dengan clock picker 24 jam)
- 💡 Kontrol Lampu (manual + jadwal otomatis, sama seperti pompa)
- ⚙️ Setting batas Warning/Danger per sensor
- 📱 Notifikasi WhatsApp otomatis via CallMeBot saat sensor melewati batas bahaya, atau saat pompa/lampu nyala-mati sesuai jadwal

---

✦ **TOI SANTUY** ✦
