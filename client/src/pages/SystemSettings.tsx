import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import {
  Settings,
  RotateCcw,
  Save,
  CheckCircle2,
  AlertTriangle,
  Radio,
  Wifi,
  Sliders,
  ShieldAlert,
  Volume2,
  Trees,
  X
} from 'lucide-react';

export const SystemSettings: React.FC = () => {
  const { settings, resetDemoData, refreshData } = useApp();

  const [formData, setFormData] = useState<any>({});
  const [isSaved, setIsSaved] = useState(false);
  const [isResetModalOpen, setIsResetModalOpen] = useState(false);
  const [isResetting, setIsResetting] = useState(false);

  useEffect(() => {
    setFormData({
      forest_name: settings.forest_name || 'Bandhavgarh-Kanha Wildlife Corridor Reserve',
      forest_zone_count: settings.forest_zone_count || '4 Zones (Core, Buffer, River, Ridge)',
      center_lat: settings.center_lat || '29.5300',
      center_lng: settings.center_lng || '78.7700',
      smoke_threshold_ppm: settings.smoke_threshold_ppm || '50',
      temp_threshold_c: settings.temp_threshold_c || '42',
      battery_low_threshold: settings.battery_low_threshold || '20',
      heartbeat_timeout_sec: settings.heartbeat_timeout_sec || '90',
      ai_confidence_threshold: settings.ai_confidence_threshold || '75',
      gateway_frequency: settings.gateway_frequency || '868.1 MHz LoRa EU/IN Band',
      sound_alert_enabled: settings.sound_alert_enabled || 'true',
      demo_mode: settings.demo_mode || 'true'
    });
  }, [settings]);

  const handleChange = (key: string, value: string) => {
    setFormData((prev: any) => ({ ...prev, [key]: value }));
    setIsSaved(false);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await fetch('/api/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      setIsSaved(true);
      refreshData();
      setTimeout(() => setIsSaved(false), 3000);
    } catch (e) {
      console.error(e);
    }
  };

  const handleConfirmReset = async () => {
    setIsResetting(true);
    try {
      await resetDemoData();
      setIsResetModalOpen(false);
    } finally {
      setIsResetting(false);
    }
  };

  return (
    <div className="p-4 sm:p-6 space-y-6 max-w-[1400px] mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-white tracking-wide">
              System Parameters & Operational Thresholds
            </h1>
            <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-forest-primary text-forest-accent border border-forest-border">
              Config Master
            </span>
          </div>
          <p className="text-xs text-forest-muted">
            Customize bioacoustic inference thresholds, sensor tripwires, LoRa mesh frequencies and demo settings
          </p>
        </div>

        <button
          onClick={() => setIsResetModalOpen(true)}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-red-950/40 hover:bg-red-900/50 text-red-300 border border-red-500/40 text-xs font-semibold transition-colors"
        >
          <RotateCcw className="w-4 h-4 text-red-400" />
          <span>Reset All Demo Data</span>
        </button>
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        {/* Geographic & Sanctuary Identity */}
        <div className="p-6 rounded-2xl bg-forest-card border border-forest-border shadow-lg space-y-4">
          <div className="flex items-center gap-2 border-b border-forest-border pb-3">
            <Trees className="w-4 h-4 text-forest-accent" />
            <h3 className="text-sm font-bold text-white uppercase tracking-wider">
              Reserve Identity & Geographic Coordinates
            </h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="block text-forest-muted mb-1 font-semibold">Reserve Name</label>
              <input
                type="text"
                value={formData.forest_name || ''}
                onChange={(e) => handleChange('forest_name', e.target.value)}
                className="w-full bg-forest-darkest text-white p-2.5 rounded-lg border border-forest-border"
              />
            </div>

            <div>
              <label className="block text-forest-muted mb-1 font-semibold">Zonal Configuration</label>
              <input
                type="text"
                value={formData.forest_zone_count || ''}
                onChange={(e) => handleChange('forest_zone_count', e.target.value)}
                className="w-full bg-forest-darkest text-white p-2.5 rounded-lg border border-forest-border"
              />
            </div>

            <div>
              <label className="block text-forest-muted mb-1 font-semibold">Center Latitude (°N)</label>
              <input
                type="text"
                value={formData.center_lat || ''}
                onChange={(e) => handleChange('center_lat', e.target.value)}
                className="w-full bg-forest-darkest text-white p-2.5 rounded-lg border border-forest-border font-mono"
              />
            </div>

            <div>
              <label className="block text-forest-muted mb-1 font-semibold">Center Longitude (°E)</label>
              <input
                type="text"
                value={formData.center_lng || ''}
                onChange={(e) => handleChange('center_lng', e.target.value)}
                className="w-full bg-forest-darkest text-white p-2.5 rounded-lg border border-forest-border font-mono"
              />
            </div>
          </div>
        </div>

        {/* Sensor Alert Thresholds */}
        <div className="p-6 rounded-2xl bg-forest-card border border-forest-border shadow-lg space-y-4">
          <div className="flex items-center gap-2 border-b border-forest-border pb-3">
            <Sliders className="w-4 h-4 text-forest-accent" />
            <h3 className="text-sm font-bold text-white uppercase tracking-wider">
              IoT Sensor Tripwire Thresholds
            </h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
            <div>
              <label className="block text-forest-muted mb-1 font-semibold">Smoke Alert Level (PPM)</label>
              <input
                type="number"
                value={formData.smoke_threshold_ppm || ''}
                onChange={(e) => handleChange('smoke_threshold_ppm', e.target.value)}
                className="w-full bg-forest-darkest text-white p-2.5 rounded-lg border border-forest-border font-mono"
              />
              <span className="text-[10px] text-forest-muted mt-1 block">Trigger critical fire alert above this value</span>
            </div>

            <div>
              <label className="block text-forest-muted mb-1 font-semibold">Temperature Warning (°C)</label>
              <input
                type="number"
                value={formData.temp_threshold_c || ''}
                onChange={(e) => handleChange('temp_threshold_c', e.target.value)}
                className="w-full bg-forest-darkest text-white p-2.5 rounded-lg border border-forest-border font-mono"
              />
              <span className="text-[10px] text-forest-muted mt-1 block">Ambient temperature outlier threshold</span>
            </div>

            <div>
              <label className="block text-forest-muted mb-1 font-semibold">Low Battery Reserve (%)</label>
              <input
                type="number"
                value={formData.battery_low_threshold || ''}
                onChange={(e) => handleChange('battery_low_threshold', e.target.value)}
                className="w-full bg-forest-darkest text-white p-2.5 rounded-lg border border-forest-border font-mono"
              />
              <span className="text-[10px] text-forest-muted mt-1 block">Triggers technical maintenance alert</span>
            </div>
          </div>
        </div>

        {/* AI & Telemetry Heartbeats */}
        <div className="p-6 rounded-2xl bg-forest-card border border-forest-border shadow-lg space-y-4">
          <div className="flex items-center gap-2 border-b border-forest-border pb-3">
            <Radio className="w-4 h-4 text-forest-accent" />
            <h3 className="text-sm font-bold text-white uppercase tracking-wider">
              Edge AI & Telemetry Frequency
            </h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
            <div>
              <label className="block text-forest-muted mb-1 font-semibold">AI Confidence Threshold (%)</label>
              <input
                type="number"
                value={formData.ai_confidence_threshold || ''}
                onChange={(e) => handleChange('ai_confidence_threshold', e.target.value)}
                className="w-full bg-forest-darkest text-white p-2.5 rounded-lg border border-forest-border font-mono"
              />
              <span className="text-[10px] text-forest-muted mt-1 block">Minimum confidence to trigger alert</span>
            </div>

            <div>
              <label className="block text-forest-muted mb-1 font-semibold">Heartbeat Timeout (Seconds)</label>
              <input
                type="number"
                value={formData.heartbeat_timeout_sec || ''}
                onChange={(e) => handleChange('heartbeat_timeout_sec', e.target.value)}
                className="w-full bg-forest-darkest text-white p-2.5 rounded-lg border border-forest-border font-mono"
              />
              <span className="text-[10px] text-forest-muted mt-1 block">Timeout before node flagged offline</span>
            </div>

            <div>
              <label className="block text-forest-muted mb-1 font-semibold">LoRa Frequency Channel</label>
              <input
                type="text"
                value={formData.gateway_frequency || ''}
                onChange={(e) => handleChange('gateway_frequency', e.target.value)}
                className="w-full bg-forest-darkest text-white p-2.5 rounded-lg border border-forest-border font-mono"
              />
              <span className="text-[10px] text-forest-muted mt-1 block">Regional Sub-GHz ISM channel</span>
            </div>
          </div>
        </div>

        {/* Save Bar */}
        <div className="flex items-center justify-end gap-3 pt-2">
          {isSaved && (
            <span className="text-xs font-mono text-emerald-400 flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4" />
              <span>Configuration successfully saved to database</span>
            </span>
          )}

          <button
            type="submit"
            className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-forest-accent hover:bg-forest-accentHover text-forest-darkest font-extrabold text-xs uppercase tracking-wider transition-colors shadow-md shadow-emerald-950/40"
          >
            <Save className="w-4 h-4" />
            <span>Save System Configuration</span>
          </button>
        </div>
      </form>

      {/* Reset Confirmation Modal */}
      {isResetModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
          <div className="bg-forest-card border border-red-500/50 w-full max-w-md rounded-2xl shadow-2xl p-6 space-y-4">
            <div className="flex items-center gap-3 text-red-400">
              <div className="p-2 rounded-xl bg-red-500/20 border border-red-500/40">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">Reset Demonstration Data?</h3>
                <span className="text-xs text-red-400">This action will restore factory defaults</span>
              </div>
            </div>

            <p className="text-xs text-forest-muted leading-relaxed">
              This will re-initialize the SQLite database with 12 fresh ESP32 nodes, 2 LoRa gateways, 5 emergency response teams, 438 audio dataset records, and historical telemetry curves.
            </p>

            <div className="flex justify-end gap-2 pt-2 border-t border-forest-border">
              <button
                type="button"
                onClick={() => setIsResetModalOpen(false)}
                className="px-4 py-2 rounded-lg bg-forest-darkest text-forest-muted hover:text-white text-xs"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmReset}
                disabled={isResetting}
                className="px-5 py-2 rounded-lg bg-red-600 hover:bg-red-500 text-white font-bold text-xs uppercase tracking-wider"
              >
                {isResetting ? 'Restoring Database...' : 'Confirm Factory Reset'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

