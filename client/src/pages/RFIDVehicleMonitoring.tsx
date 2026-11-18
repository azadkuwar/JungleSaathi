import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { RfidVehicle } from '../types';
import {
  Shield,
  Truck,
  Plus,
  Search,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  KeyRound,
  X,
  Radio,
  Clock,
  ExternalLink
} from 'lucide-react';

export const RFIDVehicleMonitoring: React.FC = () => {
  const { rfidVehicles, scanRfid, refreshData } = useApp();

  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterCheckpoint, setFilterCheckpoint] = useState('all');

  const [isScanModalOpen, setIsScanModalOpen] = useState(false);
  const [isRegisterModalOpen, setIsRegisterModalOpen] = useState(false);

  // Scan simulation state
  const [tagToScan, setTagToScan] = useState('RFID-TAG-101');
  const [scanCheckpoint, setScanCheckpoint] = useState('North Gate Checkpoint');
  const [scanResult, setScanResult] = useState<any>(null);

  // Register vehicle state
  const [newVehicle, setNewVehicle] = useState({
    tag_id: `RFID-TAG-${Math.floor(100 + Math.random() * 899)}`,
    vehicle_reg: 'UK-04-XX-0000',
    vehicle_type: 'Forest Dept Gypsy',
    checkpoint: 'North Gate Checkpoint',
    personnel: '',
    purpose: 'Routine Boundary Perimeter Patrol'
  });

  const handleScanSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await scanRfid(tagToScan, scanCheckpoint);
    setScanResult(res);
  };

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await fetch('/api/rfid/register-vehicle', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newVehicle)
    });
    setIsRegisterModalOpen(false);
    refreshData();
  };

  const filtered = rfidVehicles.filter(v => {
    const matchesSearch = v.vehicle_reg.toLowerCase().includes(search.toLowerCase()) ||
                          v.tag_id.toLowerCase().includes(search.toLowerCase()) ||
                          v.personnel.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = filterStatus === 'all' || v.status === filterStatus;
    const matchesCheckpoint = filterCheckpoint === 'all' || v.checkpoint === filterCheckpoint;
    return matchesSearch && matchesStatus && matchesCheckpoint;
  });

  return (
    <div className="p-4 sm:p-6 space-y-6 max-w-[1600px] mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-white tracking-wide">
              RFID & NFC Forest Checkpoint Vehicle Monitoring
            </h1>
            <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-forest-primary text-forest-accent border border-forest-border">
              Access Control & Intrusion Detection
            </span>
          </div>
          <p className="text-xs text-forest-muted">
            Automated vehicular perimeter tracking at forest barrier gates. Detects unregistered transport and logs entry/exit timestamps
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              setScanResult(null);
              setIsScanModalOpen(true);
            }}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-forest-accent hover:bg-forest-accentHover text-forest-darkest font-bold text-xs uppercase tracking-wider transition-colors shadow-md shadow-emerald-950/40"
          >
            <Radio className="w-4 h-4" />
            <span>Simulate RFID Tag Scan</span>
          </button>

          <button
            onClick={() => setIsRegisterModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-forest-card hover:bg-forest-cardHover text-white border border-forest-border text-xs font-semibold"
          >
            <Plus className="w-4 h-4" />
            <span>Register Vehicle</span>
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="p-4 rounded-2xl bg-forest-card border border-forest-border shadow-md flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-forest-muted absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search registration, tag or personnel..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-8 pr-3 py-1.5 text-xs rounded-xl bg-forest-darkest border border-forest-border text-white placeholder-forest-muted focus:outline-none focus:border-forest-accent w-48 sm:w-64"
            />
          </div>

          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="bg-forest-darkest text-white border border-forest-border rounded-xl px-2.5 py-1.5 text-xs focus:outline-none"
          >
            <option value="all">All Access Statuses</option>
            <option value="authorized">Authorized Entry</option>
            <option value="unauthorized_breach">Unauthorized Breach</option>
          </select>

          <select
            value={filterCheckpoint}
            onChange={(e) => setFilterCheckpoint(e.target.value)}
            className="bg-forest-darkest text-white border border-forest-border rounded-xl px-2.5 py-1.5 text-xs focus:outline-none"
          >
            <option value="all">All Checkpoints (3)</option>
            <option value="North Gate Checkpoint">North Gate Checkpoint</option>
            <option value="South Boundary Gate">South Boundary Gate</option>
            <option value="River Bridge Post">River Bridge Post</option>
          </select>
        </div>

        <span className="text-xs font-mono text-forest-muted">
          Showing {filtered.length} Vehicle Records
        </span>
      </div>

      {/* Vehicles Table */}
      <div className="rounded-2xl bg-forest-card border border-forest-border shadow-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-forest-darkest/90 text-forest-muted uppercase text-[10px] tracking-wider font-mono">
              <tr>
                <th className="py-3 px-3.5">RFID Tag ID</th>
                <th className="py-3 px-3.5">Vehicle Reg</th>
                <th className="py-3 px-3.5">Vehicle Type</th>
                <th className="py-3 px-3.5">Checkpoint Gate</th>
                <th className="py-3 px-3.5">Entry Timestamp</th>
                <th className="py-3 px-3.5">Exit Timestamp</th>
                <th className="py-3 px-3.5">Driver / Personnel</th>
                <th className="py-3 px-3.5">Purpose</th>
                <th className="py-3 px-3.5">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-forest-border/40 font-mono text-[11px]">
              {filtered.map((v) => {
                const isBreach = v.status === 'unauthorized_breach';
                return (
                  <tr key={v.id} className={`transition-colors ${isBreach ? 'bg-red-950/20 hover:bg-red-950/30' : 'hover:bg-forest-cardHover'}`}>
                    <td className="py-2.5 px-3.5 font-bold text-white flex items-center gap-1.5">
                      <KeyRound className={`w-3.5 h-3.5 ${isBreach ? 'text-red-400' : 'text-forest-accent'}`} />
                      <span>{v.tag_id}</span>
                    </td>
                    <td className="py-2.5 px-3.5 font-sans font-bold text-white">{v.vehicle_reg}</td>
                    <td className="py-2.5 px-3.5 text-forest-muted font-sans">{v.vehicle_type}</td>
                    <td className="py-2.5 px-3.5 font-sans">{v.checkpoint}</td>
                    <td className="py-2.5 px-3.5 text-forest-muted">{new Date(v.entry_time).toLocaleString()}</td>
                    <td className="py-2.5 px-3.5 text-forest-muted">{v.exit_time ? new Date(v.exit_time).toLocaleTimeString() : 'Inside Reserve'}</td>
                    <td className="py-2.5 px-3.5 font-sans text-white">{v.personnel}</td>
                    <td className="py-2.5 px-3.5 font-sans text-forest-muted truncate max-w-[180px]">{v.purpose}</td>
                    <td className="py-2.5 px-3.5">
                      <span className={`px-2 py-0.5 rounded uppercase text-[10px] font-bold ${
                        isBreach
                          ? 'bg-red-500/20 text-red-300 border border-red-500/40 animate-pulse'
                          : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                      }`}>
                        {isBreach ? 'UNAUTHORIZED' : 'AUTHORIZED'}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* RFID Scan Simulation Modal */}
      {isScanModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
          <div className="bg-forest-card border border-forest-border w-full max-w-md rounded-2xl shadow-2xl p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-forest-border pb-3">
              <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                <Radio className="w-4 h-4 text-forest-accent" />
                Simulate RFID Checkpoint Scan
              </h3>
              <button onClick={() => setIsScanModalOpen(false)} className="text-forest-muted hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleScanSubmit} className="space-y-3 text-xs">
              <div>
                <label className="block text-forest-muted mb-1">Select or Enter Tag ID</label>
                <div className="space-y-1">
                  <select
                    value={tagToScan}
                    onChange={(e) => setTagToScan(e.target.value)}
                    className="w-full bg-forest-darkest text-white p-2.5 rounded-lg border border-forest-border font-mono font-bold"
                  >
                    <option value="RFID-TAG-101">RFID-TAG-101 (Authorized Forest Gypsy)</option>
                    <option value="RFID-TAG-102">RFID-TAG-102 (Tourist Safari Cruiser)</option>
                    <option value="RFID-TAG-103">RFID-TAG-103 (Wildlife Research Van)</option>
                    <option value="RFID-TAG-999-UNAUTH">RFID-TAG-999-UNAUTH (Unknown / Unregistered Tag - Intruder)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-forest-muted mb-1">Checkpoint Location</label>
                <select
                  value={scanCheckpoint}
                  onChange={(e) => setScanCheckpoint(e.target.value)}
                  className="w-full bg-forest-darkest text-white p-2.5 rounded-lg border border-forest-border"
                >
                  <option value="North Gate Checkpoint">North Gate Checkpoint</option>
                  <option value="South Boundary Gate">South Boundary Gate</option>
                  <option value="River Bridge Post">River Bridge Post</option>
                </select>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  className="w-full py-2.5 rounded-xl bg-forest-accent hover:bg-forest-accentHover text-forest-darkest font-bold uppercase tracking-wider text-xs shadow-md transition-colors"
                >
                  Trigger Antenna Scan Pulse
                </button>
              </div>

              {scanResult && (
                <div className={`p-3.5 rounded-xl border mt-3 space-y-1 ${
                  scanResult.authorized ? 'bg-emerald-950/30 border-emerald-500/40 text-emerald-300' : 'bg-red-950/30 border-red-500/40 text-red-300'
                }`}>
                  <div className="font-bold flex items-center gap-1.5">
                    {scanResult.authorized ? <CheckCircle2 className="w-4 h-4" /> : <AlertTriangle className="w-4 h-4" />}
                    <span>{scanResult.authorized ? 'Access Granted: Tag Verified' : 'Access Denied: Unregistered Tag'}</span>
                  </div>
                  <p className="text-[11px] leading-relaxed text-forest-muted">
                    {scanResult.warning || `${scanResult.action} recorded at ${scanResult.checkpoint}`}
                  </p>
                </div>
              )}
            </form>
          </div>
        </div>
      )}

      {/* Register Vehicle Modal */}
      {isRegisterModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
          <div className="bg-forest-card border border-forest-border w-full max-w-md rounded-2xl shadow-2xl p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-forest-border pb-3">
              <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                Register Authorized Vehicle Tag
              </h3>
              <button onClick={() => setIsRegisterModalOpen(false)} className="text-forest-muted hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleRegisterSubmit} className="space-y-3 text-xs">
              <div>
                <label className="block text-forest-muted mb-1">RFID Tag UID</label>
                <input
                  type="text"
                  required
                  value={newVehicle.tag_id}
                  onChange={(e) => setNewVehicle({ ...newVehicle, tag_id: e.target.value })}
                  className="w-full bg-forest-darkest text-white p-2.5 rounded-lg border border-forest-border font-mono font-bold"
                />
              </div>

              <div>
                <label className="block text-forest-muted mb-1">Vehicle License Plate</label>
                <input
                  type="text"
                  required
                  value={newVehicle.vehicle_reg}
                  onChange={(e) => setNewVehicle({ ...newVehicle, vehicle_reg: e.target.value })}
                  className="w-full bg-forest-darkest text-white p-2.5 rounded-lg border border-forest-border font-mono"
                />
              </div>

              <div>
                <label className="block text-forest-muted mb-1">Vehicle Classification</label>
                <select
                  value={newVehicle.vehicle_type}
                  onChange={(e) => setNewVehicle({ ...newVehicle, vehicle_type: e.target.value })}
                  className="w-full bg-forest-darkest text-white p-2.5 rounded-lg border border-forest-border"
                >
                  <option value="Forest Dept Gypsy">Forest Dept Gypsy</option>
                  <option value="Tourist Safari Vehicle">Tourist Safari Vehicle</option>
                  <option value="Wildlife Research Van">Wildlife Research Van</option>
                  <option value="Fire Tender Truck">Fire Tender Truck</option>
                  <option value="Maintenance Truck">Maintenance Truck</option>
                </select>
              </div>

              <div>
                <label className="block text-forest-muted mb-1">Assigned Driver / Ranger</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Officer Sunita Rawat"
                  value={newVehicle.personnel}
                  onChange={(e) => setNewVehicle({ ...newVehicle, personnel: e.target.value })}
                  className="w-full bg-forest-darkest text-white p-2.5 rounded-lg border border-forest-border"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsRegisterModalOpen(false)}
                  className="px-4 py-2 rounded-lg bg-forest-darkest text-forest-muted hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-lg bg-forest-accent hover:bg-forest-accentHover text-forest-darkest font-bold"
                >
                  Register & Authorize Tag
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

