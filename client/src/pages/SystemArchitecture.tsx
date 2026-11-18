import React, { useState } from 'react';
import {
  Layers,
  Radio,
  Cpu,
  Wifi,
  Server,
  Truck,
  Trees,
  CheckCircle2,
  ArrowDown,
  Terminal,
  Code2,
  Activity,
  ShieldCheck,
  Zap
} from 'lucide-react';

export const SystemArchitecture: React.FC = () => {
  const [selectedLayer, setSelectedLayer] = useState<number>(2);

  const layers = [
    {
      id: 1,
      name: 'Layer 1: Forest Environment & Bio-Signals',
      badge: 'Physical Biosphere',
      icon: Trees,
      color: 'border-emerald-500/40 text-emerald-400',
      summary: 'Raw acoustic, atmospheric, and motion signals generated in natural sanctuary habitats.',
      specs: [
        { label: 'Fauna Vocalizations', val: 'Tiger roars, elephant trumpets, primate alarms, canopy bird whistles' },
        { label: 'Anthropogenic Threats', val: 'Chainsaw two-stroke motors, firearm ballistic impulses, trespassers' },
        { label: 'Thermal / Combustion', val: 'Timber blaze particulate smoke, heat gradients, dry lightning fires' },
        { label: 'Geographic Coverage', val: '4 Designated Sanctuary Zones across 350 sq. km reserve perimeter' }
      ],
      packetSnippet: `// Environmental Stimulus Spectrum
Acoustic Wave: 20 Hz - 20 kHz Pressure Transients
Thermal Range: -5°C to +55°C Forest Ambient
Gas Dispersion: Smoke PM2.5/PM10 Particulates > 50 PPM`
    },
    {
      id: 2,
      name: 'Layer 2: Autonomous ESP32 Sentry Hardware',
      badge: 'Edge IoT Nodes',
      icon: Radio,
      color: 'border-emerald-400 text-forest-accent',
      summary: 'Ultra-low-power, weatherproof field sensor stations deployed in dense jungle canopies.',
      specs: [
        { label: 'Microcontroller', val: 'Espressif ESP32-S3 Dual-Core Xtensa LX7 @ 240 MHz (512KB SRAM, 8MB Flash)' },
        { label: 'Acoustic Sensor', val: 'INMP441 Omnidirectional Digital MEMS Microphone (I2S Interface, 61dB SNR)' },
        { label: 'Environmental Sensors', val: 'Sensirion SHT31 (Temp/Hum) + MQ-2/MQ-135 (Combustion/Smoke PPM)' },
        { label: 'Perimeter Motion', val: 'Dual Passive Infrared (PIR) Motion Beam Detector' },
        { label: 'Power Subsystem', val: '3.2V 6000mAh LiFePO4 Battery + 5W Monocrystalline Solar Panel + MPPT Charger' },
        { label: 'RF Transceiver', val: 'Semtech SX1276 LoRa Sub-GHz (868.1 MHz, +20dBm PA Output)' }
      ],
      packetSnippet: `// Pin Mapping & Hardware Bus Config
#define I2S_WS    15
#define I2S_SD    13
#define I2S_SCK   14
#define LORA_CS   18
#define LORA_RST  14
#define LORA_DIO0 26
#define SMOKE_PIN 34 // ADC1_CH6`
    },
    {
      id: 3,
      name: 'Layer 3: Edge AI Sound Recognition',
      badge: 'TinyML Intelligence',
      icon: Cpu,
      color: 'border-amber-400 text-amber-300',
      summary: 'Local machine learning inference on ESP32 without relying on continuous cloud connectivity.',
      specs: [
        { label: 'Model Architecture', val: 'Lightweight MobileNetV2-Edge with Depthwise Separable Convolutions' },
        { label: 'Quantization', val: 'INT8 Post-Training Quantization (TensorFlow Lite for Microcontrollers)' },
        { label: 'Inference Latency', val: '42.5 milliseconds per 3.5-second audio window' },
        { label: 'Memory Footprint', val: '1.84 MB Flash Storage, 320 KB Dynamic Arena RAM' },
        { label: 'Feature Extraction', val: '40 Mel-Frequency Filterbank Energy Bins, 13 MFCCs' },
        { label: 'Target Classes', val: '11 Discrete Bioacoustic & Threat Signatures' }
      ],
      packetSnippet: `// Edge ML Pipeline (C++ / TFLite Micro)
tflite::MicroInterpreter interpreter(
    model, resolver, tensor_arena, kArenaSize);
TfLiteStatus status = interpreter.Invoke();
TfLiteTensor* output = interpreter.output(0);
float chainsaw_prob = output->data.int8[6] / 127.0f;`
    },
    {
      id: 4,
      name: 'Layer 4: LoRa Long-Range Communication',
      badge: 'Sub-GHz Mesh / LoRaWAN',
      icon: Wifi,
      color: 'border-blue-400 text-blue-300',
      summary: 'Long-range low-bitrate radio frequency telemetry overcoming dense foliage and mountainous topography.',
      specs: [
        { label: 'Frequency Band', val: '868.1 MHz EU/IN ISM License-Free Spectrum' },
        { label: 'Modulation', val: 'Chirp Spread Spectrum (CSS) with Spreading Factor SF7 - SF12' },
        { label: 'RF Range', val: '12 - 15 km Line-of-Sight, 4 - 6 km Deep Canopy Penetration' },
        { label: 'Packet Overhead', val: 'Compressed 32-byte Binary Payload (NodeID, CRC, GPS, Conf, Batt)' },
        { label: 'Gateways', val: '2 Strategic Concentrators (Ridge Tower Alpha & Ranger Station Beta)' },
        { label: 'Backhaul Link', val: '4G LTE Cellular Modem with VHF / Starlink Satellite Redundancy' }
      ],
      packetSnippet: `// 32-Byte Packed Binary Telemetry Frame
struct LoRaPacket {
    uint8_t  preamble;     // 0xAA
    uint8_t  node_id;      // 0x01 .. 0x0C
    int16_t  temp_x100;    // 24.60°C -> 2460
    uint16_t hum_x100;     // 68.20%  -> 6820
    uint16_t smoke_ppm;    // 14 PPM
    uint8_t  battery_pct;  // 88%
    uint8_t  ai_class_id;  // 6 (Chainsaw)
    uint8_t  ai_conf_pct;  // 94%
    int32_t  lat_x10000;   // 295385
    int32_t  lng_x10000;   // 787610
    uint16_t crc16;        // Integrity Check
} __attribute__((packed));`
    },
    {
      id: 5,
      name: 'Layer 5: Central Platform & GIS Engine',
      badge: 'Command & Analytics',
      icon: Server,
      color: 'border-purple-400 text-purple-300',
      summary: 'Full-stack application managing live alerts, GIS location plotting, telemetry, and automated dispatch.',
      specs: [
        { label: 'Backend Server', val: 'Node.js Express with Native node:sqlite Persistent Storage' },
        { label: 'GIS Mapping', val: 'Leaflet OpenStreetMap with Geofenced Sanctuary Zone Polygons' },
        { label: 'Real-Time Bus', val: 'Bi-directional WebSockets for Instant Threat Alert Broadcast' },
        { label: 'Dispatch Engine', val: 'Haversine Geodesic Distance Matrix + Equipment Suitability Matcher' },
        { label: 'Data Integrity', val: 'ACID Persistent Database with Complete Incident Audit Trail' }
      ],
      packetSnippet: `// Automated Team Haversine Dispatch Calculation
const distanceKm = haversine(team.lat, team.lng, incident.lat, incident.lng);
const etaMinutes = Math.round((distanceKm / 25.0) * 60); // 25 km/h off-road
const suitability = computeCategoryMatch(incident.category, team.name);`
    },
    {
      id: 6,
      name: 'Layer 6: Emergency Response & Legal Closure',
      badge: 'Field Resolution Hub',
      icon: Truck,
      color: 'border-red-400 text-red-300',
      summary: 'Actionable forestry operations: team mobilization, tactical GPS navigation, evidence logging & certification.',
      specs: [
        { label: '5 Specialized Units', val: 'Wildlife Rescue, Forest Patrol, Rapid Fire, Anti-Poaching, Technical Squad' },
        { label: 'Field Navigation', val: 'Simulated Dynamic GPS Movement Tracking along Firebreak Trails' },
        { label: 'Evidence Dossier', val: 'Forensic Photo Ingestion, Suspect Apprehension & Seizure Records' },
        { label: 'Legal Audit Trail', val: 'Strict Multi-Stage Lifecycle Stepper with Officer Verification' },
        { label: 'Resolution Outcomes', val: 'Rescued, Neutralized, Fire Controlled, Verified, Repaired, Closed' }
      ],
      packetSnippet: `// Multi-Stage Incident Lifecycle Verification
enum IncidentStatus {
  NEW -> ACKNOWLEDGED -> INVESTIGATION_STARTED
  -> TEAM_DISPATCHED -> TEAM_ARRIVED -> PROBLEM_IDENTIFIED
  -> ACTION_TAKEN -> RESOLUTION_SUBMITTED -> CLOSED
}`
    }
  ];

  const current = layers.find(l => l.id === selectedLayer) || layers[1];

  return (
    <div className="p-4 sm:p-6 space-y-6 max-w-[1600px] mx-auto">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2">
          <h1 className="text-xl font-bold text-white tracking-wide">
            Jungle Saathi Integrated 6-Layer System Architecture
          </h1>
          <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-forest-primary text-forest-accent border border-forest-border">
            Edge-to-Command
          </span>
        </div>
        <p className="text-xs text-forest-muted">
          Click any architecture layer below to inspect hardware schematics, binary protocols, ML models, and algorithmic pipelines
        </p>
      </div>

      {/* Layer Navigation Horizontal Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        {layers.map((l) => {
          const Icon = l.icon;
          const isSelected = selectedLayer === l.id;
          return (
            <div
              key={l.id}
              onClick={() => setSelectedLayer(l.id)}
              className={`p-3.5 rounded-2xl border transition-all cursor-pointer shadow-md flex flex-col justify-between ${
                isSelected
                  ? 'bg-forest-primary border-forest-accent shadow-emerald-950/40'
                  : 'bg-forest-card border-forest-border hover:bg-forest-cardHover'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="font-mono text-[10px] font-bold text-forest-muted">
                  LAYER {l.id}
                </span>
                <Icon className={`w-4 h-4 ${isSelected ? 'text-forest-accent' : 'text-forest-muted'}`} />
              </div>
              <h3 className="font-bold text-xs text-white line-clamp-1">{l.name.replace(`Layer ${l.id}: `, '')}</h3>
              <span className="text-[10px] font-mono text-forest-accent mt-1 truncate">
                {l.badge}
              </span>
            </div>
          );
        })}
      </div>

      {/* Selected Layer Detailed Blueprint */}
      <div className="p-6 rounded-2xl bg-forest-card border border-forest-border shadow-xl space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-forest-border pb-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-forest-primary text-forest-accent border border-forest-accent/40">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">{current.name}</h2>
              <p className="text-xs text-forest-muted">{current.summary}</p>
            </div>
          </div>

          <span className="px-3 py-1 rounded-lg bg-forest-darkest text-forest-accent font-mono text-xs font-bold border border-forest-border self-start sm:self-auto">
            {current.badge}
          </span>
        </div>

        {/* Specifications & Code Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left 7 Cols: Detailed Specifications */}
          <div className="lg:col-span-7 space-y-3">
            <span className="text-xs font-bold text-white uppercase tracking-wider block font-mono">
              Technical Specifications & System Boundaries
            </span>

            <div className="space-y-2">
              {current.specs.map((s, idx) => (
                <div key={idx} className="p-3 rounded-xl bg-forest-darkest border border-forest-border/80 flex flex-col sm:flex-row sm:items-center justify-between gap-1 text-xs">
                  <span className="text-forest-muted font-medium sm:w-1/3">{s.label}</span>
                  <span className="text-white font-mono text-[11px] sm:w-2/3 sm:text-right">{s.val}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Right 5 Cols: Data Packet / Schema Snippet */}
          <div className="lg:col-span-5 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-forest-muted uppercase tracking-wider block font-mono">
                Protocol & Data Interface Schema
              </span>
              <Code2 className="w-4 h-4 text-forest-accent" />
            </div>

            <div className="p-4 rounded-xl bg-forest-darkest border border-forest-border font-mono text-[11px] text-forest-muted overflow-x-auto leading-relaxed shadow-inner">
              <pre className="text-emerald-300 font-mono">
                <code>{current.packetSnippet}</code>
              </pre>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

