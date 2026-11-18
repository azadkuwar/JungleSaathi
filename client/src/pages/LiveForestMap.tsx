import React, { useEffect, useRef, useState } from 'react';
import { useApp } from '../context/AppContext';
import L from 'leaflet';
import {
  Layers,
  Search,
  Filter,
  Radio,
  Wifi,
  ShieldAlert,
  Flame,
  Truck,
  Activity,
  Maximize2,
  Minimize2,
  Crosshair,
  Compass,
  AlertTriangle,
  X,
  Play
} from 'lucide-react';

export const LiveForestMap: React.FC = () => {
  const {
    nodes,
    gateways,
    alerts,
    incidents,
    teams,
    rfidVehicles,
    setActiveTab,
    setSelectedIncidentId,
    setSimModalOpen
  } = useApp();

  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markersLayerRef = useRef<L.LayerGroup | null>(null);
  const routesLayerRef = useRef<L.LayerGroup | null>(null);
  const zonesLayerRef = useRef<L.LayerGroup | null>(null);

  const [activeFilter, setActiveFilter] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedEntity, setSelectedEntity] = useState<any>(null);

  // Initialize Leaflet map
  useEffect(() => {
    if (!mapContainerRef.current || mapInstanceRef.current) return;

    // Sanctuary Center coordinates: 29.5300 N, 78.7700 E
    const map = L.map(mapContainerRef.current, {
      center: [29.5300, 78.7700],
      zoom: 13,
      zoomControl: false,
      attributionControl: true
    });

    L.control.zoom({ position: 'bottomright' }).addTo(map);

    // OpenStreetMap tile layer (100% Free, no API key required)
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener noreferrer">OpenStreetMap</a> contributors'
    }).addTo(map);

    // Initialize layer groups
    const zonesGroup = L.layerGroup().addTo(map);
    const routesGroup = L.layerGroup().addTo(map);
    const markersGroup = L.layerGroup().addTo(map);

    zonesLayerRef.current = zonesGroup;
    routesLayerRef.current = routesGroup;
    markersLayerRef.current = markersGroup;
    mapInstanceRef.current = map;

    // Render Forest Zone Polygons
    // 1. Core Zone Alpha
    L.polygon([
      [29.5500, 78.7500],
      [29.5520, 78.7750],
      [29.5300, 78.7780],
      [29.5250, 78.7520]
    ], {
      color: '#34D399',
      weight: 1.5,
      dashArray: '4, 4',
      fillColor: '#123B2A',
      fillOpacity: 0.15
    }).bindTooltip('Core Zone Alpha (Strict Preservation)', { permanent: false, direction: 'center' }).addTo(zonesGroup);

    // 2. Buffer Zone Beta
    L.polygon([
      [29.5250, 78.7400],
      [29.5280, 78.7700],
      [29.5050, 78.7750],
      [29.5050, 78.7420]
    ], {
      color: '#F59E0B',
      weight: 1.5,
      dashArray: '4, 4',
      fillColor: '#F59E0B',
      fillOpacity: 0.08
    }).bindTooltip('Buffer Zone Beta (Fringe Boundary)', { permanent: false }).addTo(zonesGroup);

    // 3. River Basin Corridor
    L.polygon([
      [29.5450, 78.7800],
      [29.5480, 78.8050],
      [29.5220, 78.8020],
      [29.5200, 78.7750]
    ], {
      color: '#38BDF8',
      weight: 1.5,
      dashArray: '4, 4',
      fillColor: '#0284C7',
      fillOpacity: 0.12
    }).bindTooltip('River Basin Corridor (Elephant Route)', { permanent: false }).addTo(zonesGroup);

    // 4. Eco-Tourism Delta
    L.polygon([
      [29.5550, 78.7650],
      [29.5600, 78.7900],
      [29.5450, 78.7950],
      [29.5420, 78.7680]
    ], {
      color: '#A7F3D0',
      weight: 1.5,
      dashArray: '4, 4',
      fillColor: '#10B981',
      fillOpacity: 0.08
    }).bindTooltip('Eco-Tourism & Cliff Ridge Delta', { permanent: false }).addTo(zonesGroup);

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  // Update Markers and Dynamic Team Routes whenever entities update
  useEffect(() => {
    if (!mapInstanceRef.current || !markersLayerRef.current || !routesLayerRef.current) return;

    const markersGroup = markersLayerRef.current;
    const routesGroup = routesLayerRef.current;

    markersGroup.clearLayers();
    routesGroup.clearLayers();

    // Helper to create custom HTML markers
    const createHtmlIcon = (htmlString: string, size = 32) => {
      return L.divIcon({
        className: 'custom-leaflet-marker',
        html: htmlString,
        iconSize: [size, size],
        iconAnchor: [size / 2, size / 2],
        popupAnchor: [0, -size / 2]
      });
    };

    // 1. ESP32 Nodes
    if (activeFilter === 'all' || activeFilter === 'nodes') {
      nodes.forEach((node) => {
        if (searchTerm && !node.name.toLowerCase().includes(searchTerm.toLowerCase()) && !node.id.toLowerCase().includes(searchTerm.toLowerCase())) {
          return;
        }

        const isVirtualPhone = node.id === 'VIRTUAL-NODE-01' || (node as any).node_type === 'virtual_smartphone';

        let iconHtml = '';
        let markerSize = 28;

        if (isVirtualPhone) {
          markerSize = 34;
          iconHtml = `
            <div style="position:relative; width:34px; height:34px; display:flex; align-items:center; justify-content:center; cursor:pointer;">
              <div class="pulse-ring" style="position:absolute; width:100%; height:100%; border-radius:50%; background:#22D3EE; opacity:0.4;"></div>
              <div style="width:24px; height:24px; border-radius:6px; background:#083344; border:2px solid #22D3EE; display:flex; align-items:center; justify-content:center; font-size:12px; box-shadow:0 0 12px #22D3EE;">
                📱
              </div>
            </div>
          `;
        } else {
          const color =
            node.status === 'online' ? '#34D399' :
            node.status === 'warning' ? '#F59E0B' :
            node.status === 'low_battery' ? '#F97316' :
            node.status === 'maintenance' ? '#94A3B8' : '#EF4444';

          iconHtml = `
            <div style="position:relative; width:28px; height:28px; display:flex; align-items:center; justify-content:center; cursor:pointer;">
              <div style="position:absolute; width:100%; height:100%; border-radius:50%; background:${color}; opacity:0.25;"></div>
              <div style="width:16px; height:16px; border-radius:50%; background:#14231C; border:2px solid ${color}; display:flex; align-items:center; justify-content:center; box-shadow:0 0 8px ${color};">
                <div style="width:6px; height:6px; border-radius:50%; background:${color};"></div>
              </div>
            </div>
          `;
        }

        const marker = L.marker([node.lat, node.lng], { icon: createHtmlIcon(iconHtml, markerSize) });
        marker.on('click', () => setSelectedEntity({ type: 'node', data: node }));
        marker.addTo(markersGroup);
      });
    }

    // 2. LoRa Gateways
    if (activeFilter === 'all' || activeFilter === 'gateways') {
      gateways.forEach((gw) => {
        const iconHtml = `
          <div style="position:relative; width:34px; height:34px; display:flex; align-items:center; justify-content:center; cursor:pointer;">
            <div style="position:absolute; width:100%; height:100%; border-radius:8px; background:#1D5B40; border:2px solid #34D399; box-shadow:0 0 12px rgba(52,211,153,0.6); display:flex; align-items:center; justify-content:center;">
              <span style="color:#34D399; font-size:14px; font-weight:bold;">📡</span>
            </div>
          </div>
        `;
        const marker = L.marker([gw.lat, gw.lng], { icon: createHtmlIcon(iconHtml, 34) });
        marker.on('click', () => setSelectedEntity({ type: 'gateway', data: gw }));
        marker.addTo(markersGroup);
      });
    }

    // 3. Active Emergency Incidents & Alerts
    if (activeFilter === 'all' || activeFilter === 'incidents' || activeFilter === 'wildlife' || activeFilter === 'threats') {
      const activeIncidents = incidents.filter(i => i.status !== 'closed');
      activeIncidents.forEach((inc) => {
        const isFire = inc.category.includes('Fire');
        const isPoaching = inc.category.includes('Chainsaw') || inc.category.includes('Gunshot');
        const isWildlife = inc.category.includes('Wildlife') || inc.category.includes('Distress');

        if (activeFilter === 'wildlife' && !isWildlife) return;
        if (activeFilter === 'threats' && !isPoaching && !isFire) return;

        const pulseColor = isFire ? '#EF4444' : isPoaching ? '#F59E0B' : '#34D399';
        const emoji = isFire ? '🔥' : isPoaching ? '🪓' : '🐾';

        const iconHtml = `
          <div style="position:relative; width:38px; height:38px; display:flex; align-items:center; justify-content:center; cursor:pointer;">
            <div class="pulse-ring" style="position:absolute; width:100%; height:100%; border-radius:50%; background:${pulseColor}; opacity:0.4;"></div>
            <div style="width:24px; height:24px; border-radius:50%; background:#0B1511; border:2px solid ${pulseColor}; display:flex; align-items:center; justify-content:center; font-size:12px; box-shadow:0 0 14px ${pulseColor};">
              ${emoji}
            </div>
          </div>
        `;

        const marker = L.marker([inc.lat, inc.lng], { icon: createHtmlIcon(iconHtml, 38) });
        marker.on('click', () => setSelectedEntity({ type: 'incident', data: inc }));
        marker.addTo(markersGroup);
      });
    }

    // 4. Response Teams (with dynamic line to assigned incident)
    if (activeFilter === 'all' || activeFilter === 'teams') {
      teams.forEach((team) => {
        const isDispatched = team.status !== 'available';
        const teamColor = isDispatched ? '#F59E0B' : '#38BDF8';

        const iconHtml = `
          <div style="position:relative; width:34px; height:34px; display:flex; align-items:center; justify-content:center; cursor:pointer;">
            <div style="width:24px; height:24px; border-radius:6px; background:#14231C; border:2px solid ${teamColor}; display:flex; align-items:center; justify-content:center; font-size:13px; box-shadow:0 0 10px ${teamColor};">
              🚙
            </div>
          </div>
        `;

        const marker = L.marker([team.current_lat, team.current_lng], { icon: createHtmlIcon(iconHtml, 34) });
        marker.on('click', () => setSelectedEntity({ type: 'team', data: team }));
        marker.addTo(markersGroup);

        // Draw polyline route towards assigned incident if dispatched/en_route
        if (team.assigned_incident_id) {
          const inc = incidents.find(i => i.id === team.assigned_incident_id);
          if (inc) {
            L.polyline([
              [team.current_lat, team.current_lng],
              [inc.lat, inc.lng]
            ], {
              color: '#F59E0B',
              weight: 3,
              dashArray: '6, 8',
              opacity: 0.8
            }).addTo(routesGroup);
          }
        }
      });
    }

    // 5. RFID Checkpoint Gates
    if (activeFilter === 'all' || activeFilter === 'rfid') {
      const checkpoints = [
        { name: 'North Gate Checkpoint', lat: 29.5520, lng: 78.7560 },
        { name: 'South Boundary Gate', lat: 29.5080, lng: 78.7620 },
        { name: 'River Bridge Post', lat: 29.5250, lng: 78.7920 }
      ];

      checkpoints.forEach((cp) => {
        const iconHtml = `
          <div style="position:relative; width:30px; height:30px; display:flex; align-items:center; justify-content:center; cursor:pointer;">
            <div style="width:20px; height:20px; border-radius:4px; background:#123B2A; border:1.8px solid #A7F3D0; display:flex; align-items:center; justify-content:center; font-size:11px;">
              🚧
            </div>
          </div>
        `;
        const marker = L.marker([cp.lat, cp.lng], { icon: createHtmlIcon(iconHtml, 30) });
        marker.on('click', () => setSelectedEntity({ type: 'checkpoint', data: cp }));
        marker.addTo(markersGroup);
      });
    }
  }, [nodes, gateways, incidents, teams, activeFilter, searchTerm]);

  return (
    <div className="relative h-[calc(100vh-4rem)] w-full overflow-hidden flex">
      {/* Top Map Floating Toolbar */}
      <div className="absolute top-4 left-4 right-4 z-20 flex flex-wrap items-center justify-between gap-3 pointer-events-none">
        {/* Filter Pills */}
        <div className="flex flex-wrap items-center gap-1.5 p-1.5 rounded-xl bg-forest-card/90 backdrop-blur-md border border-forest-border shadow-xl pointer-events-auto">
          {[
            { id: 'all', label: 'All Layers' },
            { id: 'nodes', label: 'ESP32 Nodes (12)' },
            { id: 'gateways', label: 'LoRa Gateways (2)' },
            { id: 'threats', label: 'Threats & Fires' },
            { id: 'wildlife', label: 'Wildlife Detections' },
            { id: 'teams', label: 'Response Teams (5)' },
            { id: 'rfid', label: 'RFID Checkpoints' }
          ].map((f) => (
            <button
              key={f.id}
              onClick={() => setActiveFilter(f.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                activeFilter === f.id
                  ? 'bg-forest-primary text-forest-accent border border-forest-accent/40 shadow-sm'
                  : 'text-forest-muted hover:text-white hover:bg-forest-cardHover'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        {/* Search & Simulation trigger */}
        <div className="flex items-center gap-2 pointer-events-auto">
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-forest-muted absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search node or team..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-8 pr-3 py-1.5 text-xs rounded-xl bg-forest-card/90 backdrop-blur-md border border-forest-border text-white placeholder-forest-muted focus:outline-none focus:border-forest-accent w-48 sm:w-60 shadow-xl"
            />
          </div>

          <button
            onClick={() => setSimModalOpen(true)}
            className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-red-600 to-amber-600 hover:from-red-500 hover:to-amber-500 text-white font-bold text-xs uppercase tracking-wider shadow-lg shadow-red-950/60 transition-all border border-red-400/40 active:scale-95"
          >
            <Play className="w-3 h-3 fill-current" />
            <span className="hidden sm:inline">Simulate Threat</span>
          </button>
        </div>
      </div>

      {/* Main Map Container */}
      <div ref={mapContainerRef} className="h-full w-full z-10" />

      {/* Map Legend Overlay */}
      <div className="absolute bottom-4 left-4 z-20 p-3 rounded-xl bg-forest-card/90 backdrop-blur-md border border-forest-border shadow-xl text-xs space-y-1.5 hidden sm:block">
        <div className="font-bold text-white text-[11px] uppercase tracking-wider mb-1 flex items-center gap-1.5">
          <Compass className="w-3.5 h-3.5 text-forest-accent" />
          <span>GIS Legend & Status</span>
        </div>
        <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-[11px] font-mono">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
            <span className="text-forest-muted">Online Node</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-400" />
            <span className="text-forest-muted">Warning Node</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-red-400" />
            <span className="text-forest-muted">Offline Node</span>
          </div>
          <div className="flex items-center gap-2">
            <span>📡</span>
            <span className="text-forest-muted">LoRa Gateway</span>
          </div>
          <div className="flex items-center gap-2">
            <span>📱</span>
            <span className="text-cyan-300">Virtual Audio Node</span>
          </div>
          <div className="flex items-center gap-2">
            <span>🚙</span>
            <span className="text-forest-muted">Response Team</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-0.5 border-t-2 border-dashed border-amber-400" />
            <span className="text-forest-muted">Dispatch Route</span>
          </div>
        </div>
      </div>

      {/* Selected Entity Drawer / Modal */}
      {selectedEntity && (
        <div className="absolute top-16 right-4 bottom-4 w-80 sm:w-96 z-30 bg-forest-card border border-forest-border rounded-2xl shadow-2xl overflow-hidden flex flex-col backdrop-blur-lg animate-in fade-in slide-in-from-right duration-200">
          <div className="p-4 bg-forest-primary/80 border-b border-forest-border flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-base">
                {selectedEntity.type === 'node' ? '📡' : selectedEntity.type === 'incident' ? '🚨' : selectedEntity.type === 'team' ? '🚙' : '🚧'}
              </span>
              <div>
                <span className="text-[10px] font-mono uppercase text-forest-accent font-bold tracking-wider">
                  {selectedEntity.type} details
                </span>
                <h3 className="text-xs font-bold text-white truncate max-w-[220px]">
                  {selectedEntity.data.name || selectedEntity.data.title || selectedEntity.data.id}
                </h3>
              </div>
            </div>
            <button
              onClick={() => setSelectedEntity(null)}
              className="p-1 rounded-lg text-forest-muted hover:text-white hover:bg-forest-cardHover"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="p-4 overflow-y-auto space-y-4 flex-1 text-xs">
            {/* Node Telemetry View */}
            {selectedEntity.type === 'node' && (
              <div className="space-y-3">
                {(selectedEntity.data.id === 'VIRTUAL-NODE-01' || selectedEntity.data.node_type === 'virtual_smartphone') && (
                  <div className="p-2.5 rounded-xl bg-cyan-950/80 border border-cyan-500/40 text-cyan-200 flex items-center justify-between">
                    <span className="font-bold flex items-center gap-1.5">
                      <span>📱</span> SMARTPHONE VIRTUAL NODE
                    </span>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-cyan-500/20 text-cyan-300">LIVE SENTRY</span>
                  </div>
                )}
                <div className="grid grid-cols-2 gap-2 text-xs font-mono">
                  <div className="p-2.5 rounded-lg bg-forest-darkest border border-forest-border">
                    <span className="text-[10px] text-forest-muted">Zone</span>
                    <div className="font-bold text-white truncate">{selectedEntity.data.zone}</div>
                  </div>
                  <div className="p-2.5 rounded-lg bg-forest-darkest border border-forest-border">
                    <span className="text-[10px] text-forest-muted">Status</span>
                    <div className="font-bold text-forest-accent uppercase">{selectedEntity.data.status}</div>
                  </div>
                  <div className="p-2.5 rounded-lg bg-forest-darkest border border-forest-border">
                    <span className="text-[10px] text-forest-muted">Temperature</span>
                    <div className="font-bold text-white">{selectedEntity.data.temperature}°C</div>
                  </div>
                  <div className="p-2.5 rounded-lg bg-forest-darkest border border-forest-border">
                    <span className="text-[10px] text-forest-muted">Humidity</span>
                    <div className="font-bold text-white">{selectedEntity.data.humidity}%</div>
                  </div>
                  <div className="p-2.5 rounded-lg bg-forest-darkest border border-forest-border">
                    <span className="text-[10px] text-forest-muted">Smoke Density</span>
                    <div className="font-bold text-white">{selectedEntity.data.smoke_ppm} PPM</div>
                  </div>
                  <div className="p-2.5 rounded-lg bg-forest-darkest border border-forest-border">
                    <span className="text-[10px] text-forest-muted">Battery Level</span>
                    <div className="font-bold text-white">{selectedEntity.data.battery}%</div>
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-forest-darkest border border-forest-border space-y-1 font-mono text-[11px]">
                  <div className="text-forest-muted">Coordinates: {selectedEntity.data.lat?.toFixed(4)}, {selectedEntity.data.lng?.toFixed(4)}</div>
                  <div className="text-forest-muted">Signal: {selectedEntity.data.signal_rssi} dBm (LoRa)</div>
                  <div className="text-forest-muted">PIR Motion: {selectedEntity.data.pir_motion}</div>
                  <div className="text-forest-muted">Microphone: {selectedEntity.data.mic_status}</div>
                  <div className="text-forest-muted text-[10px]">Heartbeat: {new Date(selectedEntity.data.last_heartbeat).toLocaleTimeString()}</div>
                </div>

                <button
                  onClick={() => {
                    if (selectedEntity.data.id === 'VIRTUAL-NODE-01' || selectedEntity.data.node_type === 'virtual_smartphone') {
                      setActiveTab('virtual-node');
                    } else {
                      setActiveTab('nodes');
                    }
                  }}
                  className="w-full py-2 rounded-lg bg-forest-primary hover:bg-forest-secondary text-forest-accent border border-forest-accent/30 font-bold text-xs transition-colors"
                >
                  {(selectedEntity.data.id === 'VIRTUAL-NODE-01' || selectedEntity.data.node_type === 'virtual_smartphone')
                    ? 'Open Virtual Audio Node Console →'
                    : 'Open Full Node Profile & Charts →'}
                </button>
              </div>
            )}

            {/* Incident Details View */}
            {selectedEntity.type === 'incident' && (
              <div className="space-y-3">
                <div className="p-3 rounded-xl bg-red-950/30 border border-red-500/40 space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-red-500 text-white font-mono">
                      {selectedEntity.data.severity}
                    </span>
                    <span className="font-mono text-forest-muted text-[11px]">{selectedEntity.data.id}</span>
                  </div>
                  <h4 className="font-bold text-white text-xs">{selectedEntity.data.title}</h4>
                  <p className="text-[11px] text-forest-muted">{selectedEntity.data.problem_identified || 'Field investigation required.'}</p>
                </div>

                <div className="p-3 rounded-xl bg-forest-darkest border border-forest-border space-y-1 font-mono text-[11px]">
                  <div className="text-forest-muted">Category: <strong className="text-white">{selectedEntity.data.category}</strong></div>
                  <div className="text-forest-muted">Source: <strong className="text-white">{selectedEntity.data.source_node}</strong></div>
                  {selectedEntity.data.ai_confidence && (
                    <div className="text-forest-accent">AI Confidence: {selectedEntity.data.ai_confidence}%</div>
                  )}
                  <div className="text-forest-muted">Status: <strong className="text-forest-accent uppercase">{selectedEntity.data.status}</strong></div>
                  <div className="text-forest-muted text-[10px]">Detected: {new Date(selectedEntity.data.detection_timestamp).toLocaleString()}</div>
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      setSelectedIncidentId(selectedEntity.data.id);
                      setActiveTab('dispatch');
                    }}
                    className="flex-1 py-2 rounded-lg bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs transition-colors shadow-md"
                  >
                    Dispatch Team
                  </button>
                  <button
                    onClick={() => {
                      setSelectedIncidentId(selectedEntity.data.id);
                      setActiveTab('resolution');
                    }}
                    className="flex-1 py-2 rounded-lg bg-forest-primary hover:bg-forest-secondary text-forest-accent border border-forest-accent/30 font-bold text-xs transition-colors"
                  >
                    Resolution Hub
                  </button>
                </div>
              </div>
            )}

            {/* Response Team View */}
            {selectedEntity.type === 'team' && (
              <div className="space-y-3">
                <div className="p-3 rounded-xl bg-blue-950/30 border border-blue-500/40 space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-xs font-bold text-blue-300">{selectedEntity.data.id}</span>
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-blue-500/20 text-blue-300 border border-blue-500/40 font-mono">
                      {selectedEntity.data.status}
                    </span>
                  </div>
                  <h4 className="font-bold text-white text-xs">{selectedEntity.data.name}</h4>
                  <p className="text-[11px] text-forest-muted">Leader: {selectedEntity.data.leader}</p>
                </div>

                <div className="p-3 rounded-xl bg-forest-darkest border border-forest-border space-y-1 font-mono text-[11px]">
                  <div className="text-forest-muted">Vehicle: {selectedEntity.data.vehicle}</div>
                  <div className="text-forest-muted">Members: {selectedEntity.data.members_count} Forestry Officers</div>
                  <div className="text-forest-muted">Contact: {selectedEntity.data.contact}</div>
                  <div className="text-forest-muted">Assigned Incident: {selectedEntity.data.assigned_incident_id || 'None (Available)'}</div>
                </div>

                <button
                  onClick={() => setActiveTab('dispatch')}
                  className="w-full py-2 rounded-lg bg-forest-primary hover:bg-forest-secondary text-forest-accent border border-forest-accent/30 font-bold text-xs transition-colors"
                >
                  Manage Team Dispatch →
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

