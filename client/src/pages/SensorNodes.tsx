import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { ForestNode } from '../types';
import {
  Radio,
  Search,
  Plus,
  RotateCcw,
  Wrench,
  Trash2,
  ExternalLink,
  Battery,
  Wifi,
  Thermometer,
  Droplets,
  Flame,
  Activity,
  X,
  CheckCircle2,
  AlertTriangle
} from 'lucide-react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid
} from 'recharts';

export const SensorNodes: React.FC = () => {
  const {
    nodes,
    restartNode,
    toggleNodeMaintenance,
    refreshData
  } = useApp();

  const [search, setSearch] = useState('');
  const [filterZone, setFilterZone] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');

  const [selectedNode, setSelectedNode] = useState<ForestNode | null>(null);
  const [nodeHistory, setNodeHistory] = useState<any[]>([]);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  // New Node Form State
  const [newNode, setNewNode] = useState({
    id: `JS-NODE-${String(nodes.length + 1).padStart(2, '0')}`,
    name: '',
    zone: 'Core Zone Alpha',
    lat: 29.5350,
    lng: 78.7650,
    gateway_id: 'JS-GW-01'
  });

  // Open detailed node profile
  const openNodeProfile = async (node: ForestNode) => {
    setSelectedNode(node);
    try {
      const res = await fetch(`/api/nodes/${node.id}`).then(r => r.json());
      if (res.success && res.data.history) {
        setNodeHistory(res.data.history);
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Add node handler
  const handleAddNode = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/nodes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newNode)
      }).then(r => r.json());

      if (res.success) {
        setIsAddModalOpen(false);
        refreshData();
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Delete node handler
  const handleDeleteNode = async (id: string) => {
    if (confirm(`Are you sure you want to decommission node ${id}?`)) {
      await fetch(`/api/nodes/${id}`, { method: 'DELETE' });
      refreshData();
      if (selectedNode?.id === id) setSelectedNode(null);
    }
  };

  const filteredNodes = nodes.filter(n => {
    const matchesSearch = n.name.toLowerCase().includes(search.toLowerCase()) || n.id.toLowerCase().includes(search.toLowerCase());
    const matchesZone = filterZone === 'all' || n.zone === filterZone;
    const matchesStatus = filterStatus === 'all' || n.status === filterStatus;
    return matchesSearch && matchesZone && matchesStatus;
  });

  return (
    <div className="p-4 sm:p-6 space-y-6 max-w-[1600px] mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-white tracking-wide">
              ESP32 Edge Sensor Monitoring Fleet
            </h1>
            <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-forest-primary text-forest-accent border border-forest-border">
              {nodes.length} Deployed
            </span>
          </div>
          <p className="text-xs text-forest-muted">
            Solar-powered bioacoustic and environmental IoT sentry units communicating via 868.1 MHz LoRa
          </p>
        </div>

        <button
          onClick={() => setIsAddModalOpen(true)}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-forest-accent hover:bg-forest-accentHover text-forest-darkest font-bold text-xs uppercase tracking-wider transition-colors shadow-md shadow-emerald-950/40"
        >
          <Plus className="w-4 h-4" />
          <span>Deploy New Node</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="p-4 rounded-2xl bg-forest-card border border-forest-border shadow-md flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-forest-muted absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search node ID or name..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-8 pr-3 py-1.5 text-xs rounded-xl bg-forest-darkest border border-forest-border text-white placeholder-forest-muted focus:outline-none focus:border-forest-accent w-48 sm:w-64"
            />
          </div>

          <select
            value={filterZone}
            onChange={(e) => setFilterZone(e.target.value)}
            className="bg-forest-darkest text-white border border-forest-border rounded-xl px-2.5 py-1.5 text-xs focus:outline-none"
          >
            <option value="all">All Zones (4)</option>
            <option value="Core Zone Alpha">Core Zone Alpha</option>
            <option value="Buffer Zone Beta">Buffer Zone Beta</option>
            <option value="River Basin Corridor">River Basin Corridor</option>
            <option value="Eco-Tourism Delta">Eco-Tourism Delta</option>
          </select>

          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="bg-forest-darkest text-white border border-forest-border rounded-xl px-2.5 py-1.5 text-xs focus:outline-none"
          >
            <option value="all">All Statuses</option>
            <option value="online">Online</option>
            <option value="warning">Warning</option>
            <option value="low_battery">Low Battery</option>
            <option value="maintenance">Maintenance</option>
            <option value="offline">Offline</option>
          </select>
        </div>

        <span className="text-xs font-mono text-forest-muted">
          Showing {filteredNodes.length} of {nodes.length} Units
        </span>
      </div>

      {/* Nodes Table */}
      <div className="rounded-2xl bg-forest-card border border-forest-border shadow-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-forest-darkest/90 text-forest-muted uppercase text-[10px] tracking-wider font-mono">
              <tr>
                <th className="py-3 px-3.5">Node ID</th>
                <th className="py-3 px-3.5">Sentry Name</th>
                <th className="py-3 px-3.5">Zone</th>
                <th className="py-3 px-3.5">Status</th>
                <th className="py-3 px-3.5">Battery</th>
                <th className="py-3 px-3.5">LoRa RSSI</th>
                <th className="py-3 px-3.5">Temp (°C)</th>
                <th className="py-3 px-3.5">Humidity</th>
                <th className="py-3 px-3.5">Smoke (PPM)</th>
                <th className="py-3 px-3.5">PIR Motion</th>
                <th className="py-3 px-3.5">Heartbeat</th>
                <th className="py-3 px-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-forest-border/40 font-mono text-[11px]">
              {filteredNodes.map((n) => {
                const isVirtualPhone = n.id === 'VIRTUAL-NODE-01' || (n as any).node_type === 'virtual_smartphone';
                return (
                  <tr key={n.id} className="hover:bg-forest-cardHover transition-colors">
                    <td className="py-2.5 px-3.5 font-bold text-white">
                      <button
                        onClick={() => openNodeProfile(n)}
                        className="hover:text-forest-accent flex items-center gap-1.5"
                      >
                        {isVirtualPhone ? (
                          <span className="text-cyan-400">📱</span>
                        ) : (
                          <Radio className="w-3.5 h-3.5 text-forest-accent" />
                        )}
                        <span className={isVirtualPhone ? 'text-cyan-300' : ''}>{n.id}</span>
                      </button>
                    </td>
                    <td className="py-2.5 px-3.5 font-sans font-medium text-white truncate max-w-[170px]">
                      <div className="flex items-center gap-2">
                        <span>{n.name}</span>
                        {isVirtualPhone && (
                          <span className="text-[9px] px-1.5 py-0.5 rounded bg-cyan-950/90 text-cyan-300 border border-cyan-500/40 font-mono font-bold tracking-tight">
                            PHONE NODE
                          </span>
                        )}
                      </div>
                    </td>
                  <td className="py-2.5 px-3.5 font-sans text-forest-muted">{n.zone}</td>
                  <td className="py-2.5 px-3.5">
                    <span className={`px-2 py-0.5 rounded uppercase text-[10px] font-bold ${
                      n.status === 'online' ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' :
                      n.status === 'warning' ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30' :
                      n.status === 'low_battery' ? 'bg-orange-500/20 text-orange-300 border border-orange-500/30' :
                      n.status === 'maintenance' ? 'bg-slate-500/20 text-slate-300 border border-slate-500/30' :
                      'bg-red-500/20 text-red-300 border border-red-500/30'
                    }`}>
                      {n.status}
                    </span>
                  </td>
                  <td className="py-2.5 px-3.5">
                    <div className="flex items-center gap-1.5">
                      <Battery className={`w-3.5 h-3.5 ${n.battery < 20 ? 'text-red-400' : 'text-forest-accent'}`} />
                      <span className={n.battery < 20 ? 'text-red-400 font-bold' : 'text-white'}>{n.battery}%</span>
                    </div>
                  </td>
                  <td className="py-2.5 px-3.5 text-forest-muted">{n.signal_rssi} dBm</td>
                  <td className="py-2.5 px-3.5 text-white">{n.temperature}°C</td>
                  <td className="py-2.5 px-3.5 text-white">{n.humidity}%</td>
                  <td className="py-2.5 px-3.5">
                    <span className={n.smoke_ppm > 40 ? 'text-amber-400 font-bold' : 'text-white'}>
                      {n.smoke_ppm} PPM
                    </span>
                  </td>
                  <td className="py-2.5 px-3.5">
                    <span className={`px-1.5 py-0.5 rounded text-[10px] ${
                      n.pir_motion === 'Detected' ? 'bg-red-500/20 text-red-300 font-bold' : 'text-forest-muted'
                    }`}>
                      {n.pir_motion}
                    </span>
                  </td>
                  <td className="py-2.5 px-3.5 text-forest-muted text-[10px]">
                    {new Date(n.last_heartbeat).toLocaleTimeString()}
                  </td>
                  <td className="py-2.5 px-3.5 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      <button
                        onClick={() => openNodeProfile(n)}
                        title="View Full Profile & History"
                        className="p-1 rounded hover:bg-forest-primary text-forest-muted hover:text-white"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => restartNode(n.id)}
                        title="Reboot Node"
                        className="p-1 rounded hover:bg-forest-primary text-forest-muted hover:text-white"
                      >
                        <RotateCcw className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => toggleNodeMaintenance(n.id)}
                        title="Toggle Maintenance Mode"
                        className="p-1 rounded hover:bg-forest-primary text-forest-muted hover:text-white"
                      >
                        <Wrench className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDeleteNode(n.id)}
                        title="Decommission Node"
                        className="p-1 rounded hover:bg-red-950 text-forest-muted hover:text-red-400"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Node Profile Modal with 24h Sensor History */}
      {selectedNode && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
          <div className="bg-forest-card border border-forest-border w-full max-w-4xl rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
            <div className="p-4 bg-forest-primary/80 border-b border-forest-border flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-forest-accent/20 text-forest-accent">
                  <Radio className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">
                    {selectedNode.name} ({selectedNode.id})
                  </h3>
                  <p className="text-xs text-forest-muted">
                    {selectedNode.zone} • Gateway: {selectedNode.gateway_id} • Firmware: {selectedNode.firmware_version}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setSelectedNode(null)}
                className="p-1.5 rounded-lg text-forest-muted hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-6 flex-1 text-xs">
              {/* Telemetry Snapshot Cards */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 font-mono">
                <div className="p-3 rounded-xl bg-forest-darkest border border-forest-border">
                  <span className="text-[10px] text-forest-muted">Ambient Temp</span>
                  <div className="text-xl font-bold text-white mt-1">{selectedNode.temperature}°C</div>
                </div>
                <div className="p-3 rounded-xl bg-forest-darkest border border-forest-border">
                  <span className="text-[10px] text-forest-muted">Relative Humidity</span>
                  <div className="text-xl font-bold text-white mt-1">{selectedNode.humidity}%</div>
                </div>
                <div className="p-3 rounded-xl bg-forest-darkest border border-forest-border">
                  <span className="text-[10px] text-forest-muted">Smoke Sensor</span>
                  <div className="text-xl font-bold text-amber-400 mt-1">{selectedNode.smoke_ppm} PPM</div>
                </div>
                <div className="p-3 rounded-xl bg-forest-darkest border border-forest-border">
                  <span className="text-[10px] text-forest-muted">Solar Battery</span>
                  <div className="text-xl font-bold text-emerald-400 mt-1">{selectedNode.battery}%</div>
                </div>
              </div>

              {/* 24-Hour Telemetry Line Chart */}
              <div className="p-4 rounded-xl bg-forest-darkest border border-forest-border space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-white uppercase tracking-wider text-[11px]">
                    24-Hour Historical Sensor Telemetry
                  </span>
                  <span className="text-[10px] text-forest-muted font-mono">25 Log Intervals</span>
                </div>
                <div className="h-56 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={nodeHistory}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#234436" opacity={0.4} />
                      <XAxis
                        dataKey="timestamp"
                        tickFormatter={(t) => new Date(t).toLocaleTimeString([], { hour: '2-digit' })}
                        stroke="#8EAA9B"
                        fontSize={10}
                      />
                      <YAxis stroke="#8EAA9B" fontSize={10} />
                      <Tooltip contentStyle={{ backgroundColor: '#14231C', borderColor: '#234436' }} />
                      <Line type="monotone" dataKey="temperature" stroke="#F59E0B" name="Temp (°C)" strokeWidth={2} />
                      <Line type="monotone" dataKey="humidity" stroke="#38BDF8" name="Humidity (%)" strokeWidth={2} />
                      <Line type="monotone" dataKey="smoke_ppm" stroke="#EF4444" name="Smoke (PPM)" strokeWidth={2} />
                      <Line type="monotone" dataKey="battery" stroke="#34D399" name="Battery (%)" strokeWidth={2} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Hardware Diagnostic Info */}
              <div className="p-4 rounded-xl bg-forest-darkest border border-forest-border font-mono text-[11px] space-y-1 text-forest-muted">
                <div>GPS Position: <strong className="text-white">{selectedNode.lat?.toFixed(5)}° N, {selectedNode.lng?.toFixed(5)}° E</strong></div>
                <div>LoRa Transceiver: <strong className="text-white">SX1276 (868.1 MHz, Spreading Factor 7)</strong></div>
                <div>Microphone Audio Bus: <strong className="text-white">INMP441 Omnidirectional MEMS (I2S)</strong></div>
                <div>Deep Sleep Wake Cycle: <strong className="text-white">Every 30 Seconds / Instant Audio Interrupt</strong></div>
                <div>Power Source: <strong className="text-white">3.2V 6000mAh LiFePO4 + 5W Monocrystalline Solar Panel</strong></div>
              </div>
            </div>

            <div className="p-4 bg-forest-darkest border-t border-forest-border flex justify-end gap-2">
              <button
                onClick={() => setSelectedNode(null)}
                className="px-4 py-2 rounded-lg bg-forest-card hover:bg-forest-cardHover text-white text-xs font-semibold"
              >
                Close Profile
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Node Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
          <div className="bg-forest-card border border-forest-border w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-forest-border pb-3">
              <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                Deploy New ESP32 Monitoring Node
              </h3>
              <button onClick={() => setIsAddModalOpen(false)} className="text-forest-muted hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddNode} className="space-y-3 text-xs">
              <div>
                <label className="block text-forest-muted mb-1">Node Identifier</label>
                <input
                  type="text"
                  required
                  value={newNode.id}
                  onChange={(e) => setNewNode({ ...newNode, id: e.target.value })}
                  className="w-full bg-forest-darkest text-white p-2.5 rounded-lg border border-forest-border font-mono"
                />
              </div>

              <div>
                <label className="block text-forest-muted mb-1">Sentry Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Ridge Lookout Sentry"
                  value={newNode.name}
                  onChange={(e) => setNewNode({ ...newNode, name: e.target.value })}
                  className="w-full bg-forest-darkest text-white p-2.5 rounded-lg border border-forest-border"
                />
              </div>

              <div>
                <label className="block text-forest-muted mb-1">Sanctuary Zone</label>
                <select
                  value={newNode.zone}
                  onChange={(e) => setNewNode({ ...newNode, zone: e.target.value })}
                  className="w-full bg-forest-darkest text-white p-2.5 rounded-lg border border-forest-border"
                >
                  <option value="Core Zone Alpha">Core Zone Alpha</option>
                  <option value="Buffer Zone Beta">Buffer Zone Beta</option>
                  <option value="River Basin Corridor">River Basin Corridor</option>
                  <option value="Eco-Tourism Delta">Eco-Tourism Delta</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-forest-muted mb-1">Latitude (°N)</label>
                  <input
                    type="number"
                    step="0.0001"
                    required
                    value={newNode.lat}
                    onChange={(e) => setNewNode({ ...newNode, lat: Number(e.target.value) })}
                    className="w-full bg-forest-darkest text-white p-2.5 rounded-lg border border-forest-border font-mono"
                  />
                </div>
                <div>
                  <label className="block text-forest-muted mb-1">Longitude (°E)</label>
                  <input
                    type="number"
                    step="0.0001"
                    required
                    value={newNode.lng}
                    onChange={(e) => setNewNode({ ...newNode, lng: Number(e.target.value) })}
                    className="w-full bg-forest-darkest text-white p-2.5 rounded-lg border border-forest-border font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-forest-muted mb-1">LoRa Relay Gateway</label>
                <select
                  value={newNode.gateway_id}
                  onChange={(e) => setNewNode({ ...newNode, gateway_id: e.target.value })}
                  className="w-full bg-forest-darkest text-white p-2.5 rounded-lg border border-forest-border"
                >
                  <option value="JS-GW-01">JS-GW-01: Ridge Tower Alpha</option>
                  <option value="JS-GW-02">JS-GW-02: Ranger HQ Beta</option>
                </select>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-forest-border">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 rounded-lg bg-forest-darkest text-forest-muted hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-lg bg-forest-accent hover:bg-forest-accentHover text-forest-darkest font-bold"
                >
                  Save & Initialize Node
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

