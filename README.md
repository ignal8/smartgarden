# 🌱 Toi Santuy — Smart Garden IoT Monitor

Sistem monitoring & kontrol IoT untuk kebun/greenhouse menggunakan ESP32, dengan dashboard realtime ala Grafana — **bisa dibuka langsung dari browser HP atau laptop manapun**, tanpa perlu Claude.

---

## 📦 Isi Proyek

| File | Fungsi |
|---|---|
| `server.js` | Backend API + menyajikan dashboard (Node.js + Express) |
| `package.json` | Daftar dependency backend |
| `public/index.html` | **Dashboard web** (HTML/JS murni, mobile-friendly) |
| `esp32_sensor.ino` | Firmware ESP32 — baca sensor & kontrol relay |
| `iot_dashboard.jsx` | (Opsional) versi dashboard React untuk Claude artifact |

---

## 🌐 Cara Buka Dashboard

Setelah server dideploy ke Railway, **buka URL Railway-nya langsung** di browser HP/laptop, contoh:

```
https://smartgarden-production-2a96.up.railway.app
```

Dashboard akan tampil dan otomatis polling data sensor dari server yang sama (tidak perlu setting "Koneksi Server" lagi). Semua tombol, toggle, jadwal, dan setting tersimpan otomatis di browser (localStorage).

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

### 1. Backend + Dashboard (Railway)
```bash
git add .
git commit -m "deploy toi santuy"
git push
```
Railway otomatis deploy ulang. Pastikan struktur folder di repo seperti ini:
```
smartgarden/
├── server.js
├── package.json
└── public/
    └── index.html
```

### 2. Firmware ESP32
Edit bagian konfigurasi di `esp32_sensor.ino`:
```cpp
const char* WIFI_SSID     = "NAMA_WIFI";
const char* WIFI_PASSWORD = "PASSWORD_WIFI";
const char* SERVER_URL    = "https://smartgarden-production-xxxx.up.railway.app";
```
Upload ke ESP32 via Arduino IDE.

### 3. Buka Dashboard
Buka URL Railway kamu langsung di browser HP/laptop — selesai!

---

## 🔌 API Endpoints

| Method | Endpoint | Fungsi |
|---|---|---|
| GET | `/` | Dashboard web (public/index.html) |
| GET | `/api/status` | Health check server |
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
- 📲 Mobile-friendly — bisa dibuka di browser HP manapun, semua tombol berfungsi normal

---

✦ **TOI SANTUY** ✦
