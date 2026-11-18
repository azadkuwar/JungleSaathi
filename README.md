# 🌿 JUNGLE SAATHI (जंगल साथी)
## AI + IoT Based Smart Forest Monitoring, Wildlife Protection & Emergency Response Management System

[![Node.js](https://img.shields.io/badge/Node.js-v24-123B2A?logo=node.js)](https://nodejs.org)
[![React](https://img.shields.io/badge/React-19-1D5B40?logo=react)](https://react.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.7-34D399?logo=typescript)](https://www.typescriptlang.org)
[![Tailwind CSS](https://img.shields.io/badge/TailwindCSS-v3.4-123B2A?logo=tailwind-css)](https://tailwindcss.com)
[![Leaflet GIS](https://img.shields.io/badge/Leaflet-GIS_Mapping-1D5B40?logo=leaflet)](https://leafletjs.com)
[![SQLite](https://img.shields.io/badge/Database-SQLite_WAL-34D399?logo=sqlite)](https://sqlite.org)
[![TinyML](https://img.shields.io/badge/Edge_AI-MobileNet_INT8-123B2A?logo=tensorflow)](https://tensorflow.org)
[![LoRa 868MHz](https://img.shields.io/badge/LoRa-Sub--GHz_Mesh-34D399)](https://lora-alliance.org)

---

### Executive Overview & Purpose

**Jungle Saathi** is an end-to-end, integrated AI and IoT-powered forest monitoring, bioacoustic detection, and emergency incident response command platform. Designed for wildlife sanctuaries, national parks, and bio-corridors, the system detects suspicious activities (illegal logging/chainsaws, firearm gunshots, poachers, and unauthorized vehicles), monitors wildlife movements (tigers, elephants, canopy fauna), detects environmental hazards (forest fires, smoke spikes), and coordinates rapid ranger dispatch and verified legal resolution.

---

### Complete System Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                       LAYER 1: FOREST BIOSPHERE                             │
│  Wildlife Bioacoustics • Illegal Chainsaws • Gunshots • Fires • Intruders   │
└──────────────────────────────────────┬──────────────────────────────────────┘
                                       │ Physical Audio & Environmental Wave
┌──────────────────────────────────────▼──────────────────────────────────────┐
│                    LAYER 2: DISTRIBUTED ESP32 NODES (12)                    │
│  INMP441 I2S Mic • SHT31 Temp/Hum • MQ-2 Smoke • PIR Motion • GPS • Solar   │
└──────────────────────────────────────┬──────────────────────────────────────┘
                                       │ 22.05 kHz PCM Audio & Telemetry
┌──────────────────────────────────────▼──────────────────────────────────────┐
│               LAYER 3: EDGE AI AUDIO CLASSIFICATION (TinyML)                │
│  Mel Spectrogram Filterbanks • MFCC • Quantized MobileNet-Edge INT8 CNN     │
└──────────────────────────────────────┬──────────────────────────────────────┘
                                       │ Compressed 32-Byte LoRa Packet
┌──────────────────────────────────────▼──────────────────────────────────────┐
│                LAYER 4: LoRa COMMUNICATION & GATEWAYS (868MHz)              │
│  Semtech SX1276 • Ridge Tower Alpha (GW-01) & Ranger HQ Beta (GW-02)       │
└──────────────────────────────────────┬──────────────────────────────────────┘
                                       │ Encrypted 4G / Satellite Backhaul
┌──────────────────────────────────────▼──────────────────────────────────────┐
│                LAYER 5: JUNGLE SAATHI COMMAND PLATFORM                      │
│  Express API • Native SQLite DB • Leaflet GIS • Real-Time WebSockets        │
└──────────────────────────────────────┬──────────────────────────────────────┘
                                       │ Automated Alert & Haversine Routing
┌──────────────────────────────────────▼──────────────────────────────────────┐
│                   LAYER 6: EMERGENCY TEAM DISPATCH & CLOSURE                │
│  Wildlife Rescue • Forest Patrol • Fire Unit • Anti-Poaching • Verification │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

### Key Visual & Technological Stack

| Tier | Technologies Used |
| :--- | :--- |
| **Frontend** | React 19, Vite, TypeScript, Tailwind CSS, Lucide React icons, Recharts |
| **GIS Mapping** | Leaflet, OpenStreetMap (100% Free, No API Key Required), Geofenced zone polygons |
| **Backend** | Node.js (v24), Express.js, Native `node:sqlite` DatabaseSync engine, WebSocket (`ws`) |
| **Database** | Persistent SQLite (`jungle_saathi.db`) with full transactional audit logging |
| **AI / ML** | Python 3, NumPy, SciPy, Mel Spectrogram, MFCC feature extraction, MobileNet-Edge |
| **Audio Processing** | Web Audio API live waveform visualizer, browser microphone audio recorder |
| **Hardware Specs** | ESP32-S3, INMP441 I2S Mic, SX1276 LoRa transceiver, SHT31, MQ-2, NEO-6M GPS |

---

### The 13 Integrated Functional Modules

1. **Overview Dashboard**: High-level command telemetry displaying 10 interactive KPI cards, active critical alert triggers, 24-hour diurnal forest activity area chart, node health donut chart, response duration benchmarks, and a prominent one-click "Simulate Forest Emergency" launcher.
2. **Live Forest Map**: Interactive GIS sanctuary map geofenced across 4 zones (*Core Zone Alpha, Buffer Zone Beta, River Basin Corridor, Eco-Tourism Delta*), displaying live status pins for 12 ESP32 nodes, 2 LoRa gateways, wildlife detections, active incidents, and response teams with dynamic en-route polyline routes.
3. **AI Sound Recognition**: Bioacoustic analysis console featuring audio waveform & 40-band Mel-frequency spectrogram canvas, sample selector across all 11 forest classes, live browser microphone recording, file upload, and one-click incident creation.
4. **Model Training Studio**: Machine learning lifecycle suite including dataset management with **438 bioacoustic records**, 7-stage preprocessing pipeline, train/val/test data partitioner (70/15/15), live epoch training runner with convergence curves, 11x11 interactive Confusion Matrix, and INT8 gateway export.
5. **Sensor Monitoring Nodes**: Fleet management for 12 ESP32 nodes with battery discharge curves, LoRa RSSI signal monitoring, temperature/humidity/smoke telemetry, interactive 24-hour sensor history charts, node deployment modal, and reboot/maintenance controls.
6. **LoRa Gateway Management**: Concentrator control monitoring RF spectrum (868.1 MHz), packet loss rates, signal-to-noise ratios (SNR), connected node rosters, and a live LoRa packet sniffer stream.
7. **Alerts & Incidents**: Centralized incident queue filterable by severity (*Low, Medium, High, Critical*), status (*New, Acknowledged, Under Investigation, Resolved*), and category, with audible emergency alert chimes and escalation controls.
8. **Emergency Team Dispatch**: Geospatial deployment station for 5 specialized field units (*Wildlife Rescue, Forest Patrol, Rapid Fire, Anti-Poaching, Technical Squad*). Calculates nearest available team using Haversine distance, estimates travel ETA, and animates simulated GPS patrol movement.
9. **Incident Resolution & Legal Hub**: Formal 8-step lifecycle workflow tracker (*New → Acknowledged → Investigation → Dispatched → Arrived → Problem Identified → Action Taken → Verified & Closed*). Enforces mandatory evidence logging and Chief Conservator verification before generating official legal closure certificates.
10. **RFID Vehicle Monitoring**: Access control monitoring barrier checkpoints (*North Gate, South Boundary, River Bridge*). Automatically generates high-priority Security Intrusion Alerts when an unregistered RFID tag is detected.
11. **Analytics & Reports**: Visual analytics comparing zone threat density, detection category distribution, and average response times, with instant export to formatted CSV and printable Official Reserve Incident Dockets.
12. **System Architecture**: Interactive 6-layer technical blueprint detailing sensor pinouts, 32-byte binary packet frames, TinyML C++ inference loops, and Haversine routing algorithms.
13. **System Settings**: Reserve parameter controls for smoke/temperature tripwires, battery reserves, heartbeat timeouts, Sub-GHz frequencies, and a factory reset modal to re-seed the SQLite database.
14. **Virtual Audio Node (Smartphone Sentry)**: Turns any smartphone into a wireless acoustic monitoring node (`VIRTUAL-NODE-01`) capturing real microphone environmental audio, streaming audio chunks over WebSocket (`/ws`), using an integrated Cloudflare HTTPS Tunnel for SSL compliance on mobile browsers, and providing an Audio Evidence Player with official verification workflows.

---

### Demonstration Emergency Scenarios

#### Primary Scenario: Suspicious Forest Activity (20-Step Full Workflow)
- **Step 1**: Node `JS-NODE-01` detects high-frequency mechanical acoustic vibrations.
- **Step 2**: Edge AI classifies sound signature as **"Chainsaw-like Sound"** with **94.2% confidence**.
- **Step 3**: GPS coordinates `(29.5385° N, 78.7610° E)` in Core Zone Alpha attached.
- **Step 4**: LoRa Gateway `JS-GW-01` receives 868.1 MHz packet and relays via 4G backhaul.
- **Step 5**: Central platform receives telemetry and generates **HIGH severity Alert ALT-SIM-CH1**.
- **Step 6**: Emergency audio chime and visual notification banner trigger on dashboard.
- **Step 7**: Incident pin plotted on Live Forest Map with danger perimeter.
- **Step 8**: Command Operator acknowledges alert.
- **Step 9**: Haversine GIS engine recommends **Forest Patrol Delta (TEAM-02)** (1.8 km away).
- **Step 10**: Operator approves dispatch order to Ranger Ananya Sharma.
- **Step 11**: Team departs station; status changes to `En Route`.
- **Step 12**: Simulated GPS coordinates update live on map along firebreak route.
- **Step 13**: Team arrives at Sal Forest Deep Sentry perimeter. Status: `Arrived`.
- **Step 14**: Tactical cordon established; fresh vehicle tire tracks located.
- **Step 15**: Two illegal loggers intercepted with Stihl 070 chainsaw and felled teak logs.
- **Step 16**: Suspects detained under Wildlife Protection Act; chainsaw and timber impounded.
- **Step 17**: Chief Conservator Ranger Vikram Sen verifies filed incident dossier.
- **Step 18**: Incident marked `Resolved` and archived in legal registry.
- **Step 19**: Command KPIs update automatically (Active Alerts -1, Resolved Incidents +1).
- **Step 20**: Forest Patrol Delta returns to base; status resets to `Available`.

#### Additional Scenarios Included:
- **Forest Fire Outbreak**: Smoke sensor threshold spike (78 PPM) → Flame crackle audio corroboration → Rapid Fire Response Unit deployment → Firebreak trench cut → Fire extinguished & certified.
- **Wildlife in Distress**: Agitated elephant distress trumpeting → AI bioacoustic detection → Veterinary Rescue Team Alpha dispatched → Calf winched from muddy ravine & reunited with breeding herd.
- **IoT Node Heartbeat Outage**: Node missed 3 consecutive keep-alive intervals (>180s) → Automatic OFFLINE transition → Technical Maintenance Squad dispatched → Solar regulator & LoRa antenna replaced → Heartbeat restored.
- **RFID Checkpoint Breach**: Unregistered RFID tag scanned at South Boundary Gate → Automatic barrier held down → Critical Security Alert generated → Armed intercept dispatched.

---

### Installation & Quick Start Guide

#### Prerequisites
- **Node.js**: v18 or later (v24 recommended)
- **Python**: v3.10 or later (for standalone Python AI feature extractor)
- **Git**

#### 1. Clone & Install Dependencies
```bash
git clone https://github.com/azadkuwar/JungleSaathi.git
cd JungleSaathi

# Install server dependencies
cd server
npm install

# Install client dependencies
cd ../client
npm install
cd ..
```

#### 2. Generate Audio Samples (Optional - Already Built-in)
```bash
python ai_engine/generate_sample_audio.py
```

#### 3. Build & Run Application
You can run the unified server which hosts both the API and client simultaneously:
```bash
# Build React client
npm run build

# Start unified server
npm start
```

Or run client and server in development mode:
```bash
# Terminal 1: Backend API (Port 5000)
npm run server

# Terminal 2: Vite React Frontend (Port 5173 with proxy)
npm run client
```

#### 4. Access Application
Open your web browser and navigate to:
```
http://localhost:5000/
```
*(Or `http://localhost:5173/` if using Vite development server)*

---

### Hardware Integration Documentation

#### ESP32-S3 Sentry Node Pinout Schematic
```
┌────────────────────────────────────────────────────────┐
│                   ESP32-S3 DevKit                      │
│                                                        │
│  [INMP441 Microphone]        [Semtech SX1276 LoRa]     │
│   - VDD   -> 3.3V             - VCC   -> 3.3V          │
│   - GND   -> GND              - GND   -> GND           │
│   - SD    -> GPIO 13          - NSS   -> GPIO 18       │
│   - SCK   -> GPIO 14          - SCK   -> GPIO 5        │
│   - WS    -> GPIO 15          - MOSI  -> GPIO 27       │
│   - L/R   -> GND (Left Chan)  - MISO  -> GPIO 19       │
│                               - RST   -> GPIO 14       │
│  [Sensors & Peripherals]      - DIO0  -> GPIO 26       │
│   - MQ-2 Smoke -> GPIO 34 (ADC1)                       │
│   - PIR Motion -> GPIO 21                              │
│   - SHT31 SDA  -> GPIO 21, SCL -> GPIO 22              │
│   - NEO-6M GPS -> RX: GPIO 16, TX: GPIO 17             │
│   - Solar Batt -> TP4056 / MPPT to 3.2V LiFePO4 Cell   │
└────────────────────────────────────────────────────────┘
```

---

### Genuine Implementation vs. Honest Simulation

To uphold strict technical credibility for hackathon judges:

| Capability | Implementation Status | Implementation Notes |
| :--- | :--- | :--- |
| **Web Dashboard & Command Center** | **Genuinely Implemented** | Full React 19, TypeScript, Tailwind, Recharts interface. |
| **SQLite Persistent Database** | **Genuinely Implemented** | Real ACID transactions using Node 24 `node:sqlite`. Data persists across restarts. |
| **Interactive Leaflet GIS Map** | **Genuinely Implemented** | Real OpenStreetMap tiles, geofenced zone polygons, dynamic team GPS pathing. |
| **Python Audio Feature Extractor** | **Genuinely Implemented** | Real FFT, RMS energy, zero-crossing rate, and Mel filterbank script (`ai_engine/audio_classifier.py`). |
| **Audio Playback & Waveform** | **Genuinely Implemented** | Generates real WAV audio files for 11 classes, Web Audio API waveform canvas rendering. |
| **438-Sample ML Training Studio** | **Genuinely Implemented** | Full dataset management, live epoch training runner, 11x11 Confusion Matrix. |
| **Emergency Simulation Workflow** | **Genuinely Implemented** | Shared state engine updates SQLite DB, map markers, alerts, and teams on each step. |
| **Physical ESP32 & LoRa Hardware** | **Honest Simulation** | Demonstrated via realistic 32-byte binary structures, RSSI/SNR metrics, and packet tickers. |
| **Field Ranger Radio Dispatch** | **Honest Simulation** | Simulated GPS coordinate interpolation along sanctuary trails; no actual field personnel contacted. |

---

### Verification & Testing Results

- **Backend API Endpoints**: All REST routes (`/api/nodes`, `/api/gateways`, `/api/alerts`, `/api/incidents`, `/api/teams`, `/api/dataset`, `/api/rfid`, `/api/analytics`, `/api/simulations`) tested and verified returning HTTP 200 with persistent SQLite storage.
- **Client TypeScript Compilation**: Verified error-free bundling with Vite (`npm run build` produces optimized production assets in `<7s`).
- **Real-Time WebSocket Stream**: Live telemetry broadcast verified over `ws://localhost:5000/ws`.
- **End-to-End Emergency Simulation**: All 20 steps of the primary Chainsaw Poaching scenario executed, state verified across all 13 modules, and reset to factory baseline cleanly.

---

### Team & License
**Jungle Saathi — Protecting Wildlife, Forests & Rangers Through AI + IoT.**  
Developed for Hackathon Presentation. MIT License.

