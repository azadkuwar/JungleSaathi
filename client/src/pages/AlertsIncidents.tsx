import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { AlertItem } from '../types';
import {
  Bell,
  Search,
  Filter,
  ShieldAlert,
  Flame,
  CheckCircle2,
  AlertTriangle,
  Radio,
  ExternalLink,
  ChevronRight,
  X,
  Volume2
} from 'lucide-react';
import { AudioEvidencePlayer } from '../components/audio/AudioEvidencePlayer';

export const AlertsIncidents: React.FC = () => {
  const {
    alerts,
    acknowledgeAlert,
    escalateAlert,
    resolveAlert,
    setSelectedIncidentId,
    setActiveTab,
    playChime
  } = useApp();

  const [search, setSearch] = useState('');
  const [filterSeverity, setFilterSeverity] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterCategory, setFilterCategory] = useState('all');
  const [selectedAlert, setSelectedAlert] = useState<AlertItem | null>(null);

  const categories = [
    'Chainsaw-like Sound',
    'Gunshot-like Sound',
    'Fire/Smoke',
    'Wildlife Activity',
    'Animal Distress',
    'Human Intrusion',
    'Temperature Anomaly',
    'Motion Detection',
    'Node Failure',
    'Low Battery'
  ];

  const filteredAlerts = alerts.filter(a => {
    const matchesSearch = a.title.toLowerCase().includes(search.toLowerCase()) ||
                          a.id.toLowerCase().includes(search.toLowerCase()) ||
                          a.source_node.toLowerCase().includes(search.toLowerCase());
    const matchesSeverity = filterSeverity === 'all' || a.severity === filterSeverity;
    const matchesStatus = filterStatus === 'all' || a.status === filterStatus;
    const matchesCategory = filterCategory === 'all' || a.category === filterCategory;
    return matchesSearch && matchesSeverity && matchesStatus && matchesCategory;
  });

  return (
    <div className="p-4 sm:p-6 space-y-6 max-w-[1600px] mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-white tracking-wide">
              Centralized Forest Alert & Anomaly Dispatch System
            </h1>
            <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-forest-primary text-forest-accent border border-forest-border">
              {alerts.length} Total Logged
            </span>
          </div>
          <p className="text-xs text-forest-muted">
            Aggregated threat events from edge acoustic CNNs, environmental smoke sensors, PIR motion beams & LoRa heartbeat monitors
          </p>
        </div>

        <button
          onClick={playChime}
          className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-forest-card hover:bg-forest-cardHover text-forest-muted hover:text-white border border-forest-border text-xs font-semibold"
        >
          <Volume2 className="w-4 h-4 text-forest-accent" />
          <span>Test Emergency Alert Chime</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="p-4 rounded-2xl bg-forest-card border border-forest-border shadow-md flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-forest-muted absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search alert title, node or ID..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-8 pr-3 py-1.5 text-xs rounded-xl bg-forest-darkest border border-forest-border text-white placeholder-forest-muted focus:outline-none focus:border-forest-accent w-48 sm:w-64"
            />
          </div>

          <select
            value={filterSeverity}
            onChange={(e) => setFilterSeverity(e.target.value)}
            className="bg-forest-darkest text-white border border-forest-border rounded-xl px-2.5 py-1.5 text-xs focus:outline-none"
          >
            <option value="all">All Severities</option>
            <option value="critical">Critical</option>
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </select>

          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="bg-forest-darkest text-white border border-forest-border rounded-xl px-2.5 py-1.5 text-xs focus:outline-none"
          >
            <option value="all">All Statuses</option>
            <option value="new">New</option>
            <option value="acknowledged">Acknowledged</option>
            <option value="under_investigation">Under Investigation</option>
            <option value="resolved">Resolved</option>
            <option value="false_alarm">False Alarm</option>
          </select>

          <select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            className="bg-forest-darkest text-white border border-forest-border rounded-xl px-2.5 py-1.5 text-xs focus:outline-none"
          >
            <option value="all">All Categories</option>
            {categories.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>

        <span className="text-xs font-mono text-forest-muted">
          Showing {filteredAlerts.length} Alerts
        </span>
      </div>

      {/* Alerts List */}
      <div className="space-y-3">
        {filteredAlerts.map((alt) => {
          const isCritical = alt.severity === 'critical';
          const isHigh = alt.severity === 'high';
          const isResolved = alt.status === 'resolved' || alt.status === 'false_alarm';

          return (
            <div
              key={alt.id}
              onClick={() => setSelectedAlert(alt)}
              className={`p-4 rounded-2xl border transition-all cursor-pointer shadow-md flex flex-col md:flex-row md:items-center justify-between gap-4 ${
                isCritical && !isResolved
                  ? 'bg-red-950/20 border-red-500/40 hover:border-red-500/70'
                  : isHigh && !isResolved
                  ? 'bg-amber-950/20 border-amber-500/40 hover:border-amber-500/70'
                  : 'bg-forest-card border-forest-border hover:bg-forest-cardHover'
              }`}
            >
              <div className="flex items-start gap-3.5">
                <div className={`p-2.5 rounded-xl flex-shrink-0 ${
                  isCritical ? 'bg-red-500/20 text-red-400' : isHigh ? 'bg-amber-500/20 text-amber-400' : 'bg-forest-primary text-forest-accent'
                }`}>
                  {isCritical ? <ShieldAlert className="w-5 h-5 animate-pulse" /> : <Bell className="w-5 h-5" />}
                </div>

                <div className="space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-mono text-[11px] text-forest-muted font-bold">{alt.id}</span>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase ${
                      alt.severity === 'critical' ? 'bg-red-500 text-white' :
                      alt.severity === 'high' ? 'bg-amber-500 text-black' :
                      'bg-forest-secondary text-forest-accent'
                    }`}>
                      {alt.severity}
                    </span>
                    <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-forest-darkest text-forest-muted border border-forest-border">
                      {alt.status.replace('_', ' ')}
                    </span>
                    {alt.source_node === 'VIRTUAL-NODE-01' && (
                      <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-cyan-950/80 text-cyan-300 border border-cyan-500/40 font-bold flex items-center gap-1">
                        <span>📱</span> PHONE SENTRY
                      </span>
                    )}
                    <span className="font-semibold text-white text-xs">{alt.title}</span>
                  </div>

                  <p className="text-xs text-forest-muted leading-relaxed line-clamp-1 max-w-3xl">
                    {alt.description}
                  </p>

                  <div className="flex flex-wrap items-center gap-3 text-[11px] text-forest-muted font-mono pt-1">
                    <span>Source: <strong className="text-white">{alt.source_node}</strong></span>
                    <span>•</span>
                    <span>Method: {alt.detection_method}</span>
                    {alt.confidence && (
                      <>
                        <span>•</span>
                        <span className="text-forest-accent">Confidence: {alt.confidence}%</span>
                      </>
                    )}
                    <span>•</span>
                    <span>{new Date(alt.timestamp).toLocaleString()}</span>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2 flex-shrink-0 self-end md:self-center" onClick={(e) => e.stopPropagation()}>
                {alt.status === 'new' && (
                  <button
                    onClick={() => acknowledgeAlert(alt.id)}
                    className="px-3 py-1.5 rounded-lg bg-forest-primary hover:bg-forest-secondary text-forest-accent border border-forest-accent/30 text-xs font-semibold transition-colors"
                  >
                    Acknowledge
                  </button>
                )}

                {alt.status !== 'resolved' && (
                  <button
                    onClick={() => escalateAlert(alt.id)}
                    className="px-3.5 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold transition-colors shadow-sm"
                  >
                    Escalate & Dispatch
                  </button>
                )}

                <button
                  onClick={() => setSelectedAlert(alt)}
                  className="p-1.5 rounded-lg bg-forest-darkest hover:bg-forest-card text-forest-muted hover:text-white border border-forest-border"
                  title="View Details"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          );
        })}

        {filteredAlerts.length === 0 && (
          <div className="p-12 text-center text-forest-muted text-xs rounded-2xl bg-forest-card border border-forest-border">
            No alerts found matching filter criteria.
          </div>
        )}
      </div>

      {/* Alert Details Modal */}
      {selectedAlert && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
          <div className="bg-forest-card border border-forest-border w-full max-w-xl rounded-2xl shadow-2xl overflow-hidden p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-forest-border pb-3">
              <div className="flex items-center gap-2">
                <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase ${
                  selectedAlert.severity === 'critical' ? 'bg-red-500 text-white' : 'bg-amber-500 text-black'
                }`}>
                  {selectedAlert.severity}
                </span>
                <span className="font-mono text-xs text-forest-muted">{selectedAlert.id}</span>
              </div>
              <button onClick={() => setSelectedAlert(null)} className="text-forest-muted hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <h3 className="text-base font-bold text-white">{selectedAlert.title}</h3>
              <p className="text-forest-muted leading-relaxed">{selectedAlert.description}</p>

              <div className="p-3.5 rounded-xl bg-forest-darkest border border-forest-border space-y-1.5 font-mono text-[11px]">
                <div>Category: <strong className="text-white">{selectedAlert.category}</strong></div>
                <div>Source Node: <strong className="text-white">{selectedAlert.source_node}</strong></div>
                <div>Detection Method: <strong className="text-white">{selectedAlert.detection_method}</strong></div>
                {selectedAlert.confidence && (
                  <div>AI Confidence: <strong className="text-forest-accent">{selectedAlert.confidence}%</strong></div>
                )}
                <div>Coordinates: <strong className="text-white">{selectedAlert.lat?.toFixed(4)}° N, {selectedAlert.lng?.toFixed(4)}° E</strong></div>
                <div>Timestamp: <strong className="text-white">{new Date(selectedAlert.timestamp).toLocaleString()}</strong></div>
              </div>

              <div className="p-3.5 rounded-xl bg-forest-primary/50 border border-forest-accent/30 space-y-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-forest-accent block">
                  Recommended Protocol:
                </span>
                <p className="text-white leading-relaxed">{selectedAlert.recommended_action}</p>
              </div>

              {(selectedAlert.source_node === 'VIRTUAL-NODE-01' || (selectedAlert as any).evidence_url) && (
                <div className="pt-2">
                  <AudioEvidencePlayer
                    audioUrl={(selectedAlert as any).evidence_url || `/uploads/virt-audio-${selectedAlert.id}.webm`}
                    category={selectedAlert.category}
                    confidence={selectedAlert.confidence ? selectedAlert.confidence / 100 : 0.88}
                    nodeId={selectedAlert.source_node}
                    timestamp={selectedAlert.timestamp}
                    verifiedStatus={selectedAlert.status === 'resolved' ? 'confirmed' : 'unverified'}
                  />
                </div>
              )}
            </div>

            <div className="flex items-center justify-between pt-3 border-t border-forest-border">
              {selectedAlert.status !== 'resolved' && (
                <button
                  onClick={() => {
                    resolveAlert(selectedAlert.id);
                    setSelectedAlert(null);
                  }}
                  className="px-3.5 py-2 rounded-lg bg-emerald-600/30 hover:bg-emerald-600/50 text-emerald-300 border border-emerald-500/40 text-xs font-semibold"
                >
                  Mark Resolved
                </button>
              )}

              <button
                onClick={() => {
                  escalateAlert(selectedAlert.id);
                  setSelectedAlert(null);
                }}
                className="px-5 py-2 rounded-lg bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs uppercase tracking-wider ml-auto shadow-md"
              >
                Escalate to Incident & Dispatch
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

