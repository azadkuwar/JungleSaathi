import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import {
  Wifi,
  Radio,
  RotateCcw,
  CheckCircle2,
  AlertTriangle,
  Activity,
  Layers,
  Server,
  ArrowRight,
  Sliders,
  ExternalLink,
  ShieldCheck
} from 'lucide-react';

export const LoRaGateways: React.FC = () => {
  const { gateways, nodes, restartGateway } = useApp();

  const [selectedGatewayId, setSelectedGatewayId] = useState<string>('JS-GW-01');
  const [packetLogs, setPacketLogs] = useState<any[]>([]);

  // Simulate incoming LoRa packets ticker
  useEffect(() => {
    const timer = setInterval(() => {
      const randomNode = nodes[Math.floor(Math.random() * nodes.length)];
      if (!randomNode) return;

      const newLog = {
        id: Math.random().toString(36).substring(7),
        time: new Date().toLocaleTimeString(),
        nodeId: randomNode.id,
        gatewayId: randomNode.gateway_id || 'JS-GW-01',
        rssi: randomNode.signal_rssi,
        snr: Number((8.5 + Math.random() * 4).toFixed(1)),
        payloadSize: '32 B',
        freq: '868.1 MHz',
        type: 'TELEMETRY_PKT'
      };

      setPacketLogs(prev => [newLog, ...prev.slice(0, 14)]);
    }, 4000);

    return () => clearInterval(timer);
  }, [nodes]);

  const activeGw = gateways.find(g => g.id === selectedGatewayId) || gateways[0];
  const connectedNodes = nodes.filter(n => n.gateway_id === activeGw?.id);

  return (
    <div className="p-4 sm:p-6 space-y-6 max-w-[1600px] mx-auto">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2">
          <h1 className="text-xl font-bold text-white tracking-wide">
            LoRa Long-Range Gateway Infrastructure
          </h1>
          <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-forest-primary text-forest-accent border border-forest-border">
            868 MHz Sub-GHz Band
          </span>
        </div>
        <p className="text-xs text-forest-muted">
          Manages regional concentrators collecting bioacoustic telemetry packets from dispersed edge ESP32 nodes
        </p>
      </div>

      {/* Architecture Flow Banner */}
      <div className="p-5 rounded-2xl bg-forest-card border border-forest-border shadow-lg space-y-3">
        <span className="text-xs font-bold text-forest-muted uppercase tracking-wider block font-mono">
          Physical Communication Architecture Pipeline
        </span>

        <div className="grid grid-cols-1 md:grid-cols-5 gap-3 items-center text-xs">
          <div className="p-3.5 rounded-xl bg-forest-darkest border border-forest-border text-center space-y-1">
            <Radio className="w-5 h-5 text-forest-accent mx-auto" />
            <div className="font-bold text-white">ESP32 Sentry Node</div>
            <p className="text-[10px] text-forest-muted">INMP441 Mic + TinyML</p>
          </div>

          <div className="hidden md:flex flex-col items-center text-forest-accent">
            <span className="text-[10px] font-mono mb-0.5">LoRa 868.1 MHz</span>
            <div className="w-full h-0.5 bg-forest-accent relative flex items-center justify-end">
              <ArrowRight className="w-4 h-4 text-forest-accent -mr-1" />
            </div>
            <span className="text-[9px] text-forest-muted mt-0.5">Range &gt; 12 km</span>
          </div>

          <div className="p-3.5 rounded-xl bg-forest-primary border border-forest-accent/40 text-center space-y-1 shadow-md shadow-emerald-950/40">
            <Wifi className="w-5 h-5 text-forest-accent mx-auto" />
            <div className="font-bold text-white">LoRa Gateway Base</div>
            <p className="text-[10px] text-forest-accent font-semibold">SX1302 Concentrator</p>
          </div>

          <div className="hidden md:flex flex-col items-center text-forest-muted">
            <span className="text-[10px] font-mono mb-0.5">4G Backhaul / Satellite</span>
            <div className="w-full h-0.5 bg-forest-border relative flex items-center justify-end">
              <ArrowRight className="w-4 h-4 text-forest-muted -mr-1" />
            </div>
            <span className="text-[9px] text-forest-muted mt-0.5">Encrypted TLS</span>
          </div>

          <div className="p-3.5 rounded-xl bg-forest-darkest border border-forest-border text-center space-y-1">
            <Server className="w-5 h-5 text-blue-400 mx-auto" />
            <div className="font-bold text-white">Jungle Saathi Server</div>
            <p className="text-[10px] text-forest-muted">GIS Engine & Dispatch</p>
          </div>
        </div>
      </div>

      {/* Gateway Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {gateways.map((gw) => {
          const isSelected = gw.id === selectedGatewayId;
          const lossRate = Number(((gw.packets_lost / (gw.packets_received + gw.packets_lost)) * 100).toFixed(2));

          return (
            <div
              key={gw.id}
              onClick={() => setSelectedGatewayId(gw.id)}
              className={`p-5 rounded-2xl border transition-all cursor-pointer shadow-lg space-y-4 ${
                isSelected
                  ? 'bg-forest-card border-forest-accent shadow-emerald-950/40'
                  : 'bg-forest-card/60 border-forest-border hover:bg-forest-card'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-xl bg-forest-primary text-forest-accent border border-forest-accent/30">
                    <Wifi className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-white">{gw.name}</h3>
                    <p className="text-xs text-forest-muted font-mono">{gw.id} • {gw.zone}</p>
                  </div>
                </div>

                <span className="px-2.5 py-0.5 rounded-full text-xs font-mono font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  ONLINE
                </span>
              </div>

              {/* Metrics Grid */}
              <div className="grid grid-cols-3 gap-2 text-xs font-mono">
                <div className="p-2.5 rounded-xl bg-forest-darkest border border-forest-border">
                  <span className="text-[10px] text-forest-muted">Packets Received</span>
                  <div className="text-base font-bold text-white mt-0.5">{gw.packets_received.toLocaleString()}</div>
                </div>
                <div className="p-2.5 rounded-xl bg-forest-darkest border border-forest-border">
                  <span className="text-[10px] text-forest-muted">Packet Loss Rate</span>
                  <div className="text-base font-bold text-emerald-400 mt-0.5">{lossRate}%</div>
                </div>
                <div className="p-2.5 rounded-xl bg-forest-darkest border border-forest-border">
                  <span className="text-[10px] text-forest-muted">Signal SNR</span>
                  <div className="text-base font-bold text-white mt-0.5">{gw.snr_db} dB</div>
                </div>
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-forest-border/60 text-xs text-forest-muted font-mono">
                <span>Frequency: <strong className="text-white">{gw.frequency_mhz} MHz</strong></span>
                <span>Uptime: <strong className="text-white">{gw.uptime_hours} hrs</strong></span>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    restartGateway(gw.id);
                  }}
                  className="px-3 py-1 rounded-lg bg-forest-primary hover:bg-forest-secondary text-forest-accent border border-forest-accent/30 flex items-center gap-1.5 transition-colors"
                >
                  <RotateCcw className="w-3 h-3" />
                  <span>Restart</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Bottom Row: Connected Nodes for Selected Gateway & Live Packet Log */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left: Connected Nodes List */}
        <div className="p-5 rounded-2xl bg-forest-card border border-forest-border shadow-lg space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-xs font-bold text-white uppercase tracking-wider">
                Nodes Linked to {activeGw?.name}
              </h3>
              <p className="text-[11px] text-forest-muted">
                {connectedNodes.length} ESP32 sentry units within RF transmission radius
              </p>
            </div>
            <span className="text-xs font-mono text-forest-accent font-bold">
              {connectedNodes.length} Units
            </span>
          </div>

          <div className="space-y-2 max-h-72 overflow-y-auto">
            {connectedNodes.map((n) => (
              <div
                key={n.id}
                className="p-3 rounded-xl bg-forest-darkest border border-forest-border flex items-center justify-between text-xs font-mono"
              >
                <div className="flex items-center gap-2.5">
                  <Radio className="w-4 h-4 text-forest-accent" />
                  <div>
                    <span className="font-bold text-white">{n.name}</span>
                    <div className="text-[10px] text-forest-muted">{n.id} • {n.zone}</div>
                  </div>
                </div>

                <div className="text-right">
                  <span className="text-forest-accent">{n.signal_rssi} dBm</span>
                  <div className="text-[10px] text-forest-muted">Batt: {n.battery}%</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right: Live Packet Transmission Ticker */}
        <div className="p-5 rounded-2xl bg-forest-card border border-forest-border shadow-lg space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Activity className="w-4 h-4 text-forest-accent" />
              <h3 className="text-xs font-bold text-white uppercase tracking-wider">
                Live LoRa Uplink Packet Sniffer
              </h3>
            </div>
            <span className="w-2 h-2 rounded-full bg-forest-accent animate-ping" />
          </div>

          <div className="space-y-1.5 max-h-72 overflow-y-auto font-mono text-[11px]">
            {packetLogs.map((p) => (
              <div
                key={p.id}
                className="p-2.5 rounded-lg bg-forest-darkest border border-forest-border/60 flex items-center justify-between text-forest-muted hover:border-forest-accent/30 transition-colors"
              >
                <div className="flex items-center gap-2">
                  <span className="text-forest-accent">[{p.time}]</span>
                  <span className="text-white font-bold">{p.nodeId}</span>
                  <span>→</span>
                  <span className="text-amber-400">{p.gatewayId}</span>
                </div>
                <div className="flex items-center gap-3">
                  <span>RSSI: {p.rssi} dBm</span>
                  <span>SNR: {p.snr} dB</span>
                  <span className="text-forest-accent font-semibold">{p.payloadSize}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

