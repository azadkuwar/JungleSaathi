import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { ResponseTeam, IncidentItem } from '../types';
import {
  Truck,
  Users,
  MapPin,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Play,
  RotateCcw,
  ExternalLink,
  ShieldCheck,
  Compass,
  ArrowRight
} from 'lucide-react';

export const TeamDispatch: React.FC = () => {
  const {
    teams,
    incidents,
    selectedIncidentId,
    setSelectedIncidentId,
    dispatchTeam,
    setActiveTab
  } = useApp();

  const [activeIncidentId, setActiveIncidentId] = useState<string>(selectedIncidentId || '');
  const [recommendation, setRecommendation] = useState<any>(null);
  const [selectedTeamId, setSelectedTeamId] = useState<string>('');
  const [etaInput, setEtaInput] = useState<number>(10);
  const [isDispatching, setIsDispatching] = useState(false);

  // Sync selected incident if set from outside
  useEffect(() => {
    if (selectedIncidentId) {
      setActiveIncidentId(selectedIncidentId);
    } else {
      const firstActive = incidents.find(i => i.status !== 'closed');
      if (firstActive) setActiveIncidentId(firstActive.id);
    }
  }, [selectedIncidentId, incidents]);

  // Fetch team recommendation whenever active incident changes
  useEffect(() => {
    if (!activeIncidentId) return;
    fetch(`/api/teams/recommend/${activeIncidentId}`)
      .then(r => r.json())
      .then(d => {
        if (d.success) {
          setRecommendation(d.data);
          if (d.data.recommendedTeam) {
            setSelectedTeamId(d.data.recommendedTeam.id);
            setEtaInput(d.data.recommendedTeam.etaMinutes || 10);
          }
        }
      })
      .catch(console.error);
  }, [activeIncidentId]);

  // Handle Dispatch
  const handleDispatch = async () => {
    if (!selectedTeamId || !activeIncidentId) return;
    setIsDispatching(true);
    try {
      await dispatchTeam(selectedTeamId, activeIncidentId, etaInput);
      // Switch view or provide next steps
    } finally {
      setIsDispatching(false);
    }
  };

  const activeIncidents = incidents.filter(i => i.status !== 'closed');
  const targetIncident = incidents.find(i => i.id === activeIncidentId);

  return (
    <div className="p-4 sm:p-6 space-y-6 max-w-[1600px] mx-auto">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2">
          <h1 className="text-xl font-bold text-white tracking-wide">
            Forest Emergency Response & Team Dispatch Center
          </h1>
          <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-forest-primary text-forest-accent border border-forest-border">
            5 Specialized Units
          </span>
        </div>
        <p className="text-xs text-forest-muted">
          Haversine distance routing, vehicle dispatch, tactical readiness tracking and field arrival confirmation
        </p>
      </div>

      {/* Dispatch Wizard Card */}
      <div className="p-6 rounded-2xl bg-forest-card border border-forest-border shadow-xl space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-forest-border pb-4">
          <div>
            <span className="text-xs font-bold text-forest-accent uppercase tracking-wider block font-mono">
              Emergency Dispatch Control Workflow
            </span>
            <h2 className="text-base font-bold text-white">
              Assign & Mobilize Field Response Unit
            </h2>
          </div>

          {/* Active Incident Dropdown */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-forest-muted">Target Incident:</span>
            <select
              value={activeIncidentId}
              onChange={(e) => setActiveIncidentId(e.target.value)}
              className="bg-forest-darkest text-white border border-forest-border rounded-xl px-3 py-1.5 text-xs font-semibold focus:outline-none focus:border-forest-accent"
            >
              {activeIncidents.map(inc => (
                <option key={inc.id} value={inc.id}>
                  {inc.id} - {inc.title} ({inc.severity.toUpperCase()})
                </option>
              ))}
              {activeIncidents.length === 0 && (
                <option value="">No Active Incidents Pending</option>
              )}
            </select>
          </div>
        </div>

        {targetIncident ? (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Left 5 Cols: Incident Target Profile */}
            <div className="lg:col-span-5 p-4 rounded-xl bg-forest-darkest border border-forest-border space-y-3">
              <div className="flex items-center justify-between">
                <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase ${
                  targetIncident.severity === 'critical' ? 'bg-red-500 text-white' : 'bg-amber-500 text-black'
                }`}>
                  {targetIncident.severity}
                </span>
                <span className="font-mono text-xs text-forest-muted">{targetIncident.id}</span>
              </div>

              <div>
                <h3 className="font-bold text-white text-sm">{targetIncident.title}</h3>
                <p className="text-xs text-forest-muted mt-1 leading-relaxed">
                  {targetIncident.problem_identified || 'Field response required to secure zone.'}
                </p>
              </div>

              <div className="p-3 rounded-lg bg-forest-card border border-forest-border space-y-1 font-mono text-[11px] text-forest-muted">
                <div>Source Node: <strong className="text-white">{targetIncident.source_node}</strong></div>
                <div>Coordinates: <strong className="text-white">{targetIncident.lat?.toFixed(4)}° N, {targetIncident.lng?.toFixed(4)}° E</strong></div>
                {targetIncident.ai_confidence && (
                  <div>AI Classification: <strong className="text-forest-accent">{targetIncident.category} ({targetIncident.ai_confidence}%)</strong></div>
                )}
                <div>Status: <strong className="text-forest-accent uppercase">{targetIncident.status}</strong></div>
              </div>
            </div>

            {/* Right 7 Cols: Automated Recommendation & Team Selection */}
            <div className="lg:col-span-7 space-y-4">
              {recommendation?.recommendedTeam && (
                <div className="p-4 rounded-xl bg-forest-primary/70 border border-forest-accent/50 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-forest-accent/20 text-forest-accent text-[10px] font-mono font-bold uppercase">
                      <Compass className="w-3 h-3" />
                      Algorithmic Best Fit (Haversine + Equipment Match)
                    </span>
                    <span className="font-mono text-xs text-forest-accent font-bold">
                      {recommendation.recommendedTeam.distanceKm} km away • ETA ~{recommendation.recommendedTeam.etaMinutes} mins
                    </span>
                  </div>

                  <div className="flex items-center justify-between pt-1">
                    <div>
                      <h4 className="font-extrabold text-white text-sm">
                        {recommendation.recommendedTeam.name}
                      </h4>
                      <p className="text-xs text-forest-muted">
                        Led by {recommendation.recommendedTeam.leader} ({recommendation.recommendedTeam.members_count} officers)
                      </p>
                    </div>

                    <span className="px-2.5 py-0.5 rounded text-xs font-mono font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                      {recommendation.recommendedTeam.status.toUpperCase()}
                    </span>
                  </div>
                </div>
              )}

              {/* All Team Options Selector */}
              <div>
                <label className="block text-xs font-semibold text-forest-muted uppercase tracking-wider mb-2">
                  Select Unit to Deploy:
                </label>
                <div className="space-y-2">
                  {teams.map((t) => {
                    const isSelected = selectedTeamId === t.id;
                    const isAvail = t.status === 'available';

                    return (
                      <div
                        key={t.id}
                        onClick={() => setSelectedTeamId(t.id)}
                        className={`p-3 rounded-xl border flex items-center justify-between cursor-pointer transition-all ${
                          isSelected
                            ? 'bg-forest-primary border-forest-accent shadow-md shadow-emerald-950/40'
                            : 'bg-forest-darkest border-forest-border hover:bg-forest-cardHover'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <Truck className={`w-4 h-4 ${isSelected ? 'text-forest-accent' : 'text-forest-muted'}`} />
                          <div>
                            <div className="font-bold text-xs text-white flex items-center gap-2">
                              <span>{t.name}</span>
                              <span className="font-mono text-[10px] text-forest-muted">({t.id})</span>
                            </div>
                            <span className="text-[11px] text-forest-muted">{t.vehicle}</span>
                          </div>
                        </div>

                        <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase ${
                          isAvail ? 'bg-emerald-500/20 text-emerald-300' : 'bg-amber-500/20 text-amber-300'
                        }`}>
                          {t.status}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Dispatch Action Bar */}
              <div className="flex items-center justify-between pt-2">
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-forest-muted" />
                  <span className="text-xs text-forest-muted">Estimated Travel Time:</span>
                  <input
                    type="number"
                    value={etaInput}
                    onChange={(e) => setEtaInput(Number(e.target.value))}
                    className="w-16 bg-forest-darkest text-white text-xs font-mono font-bold p-1.5 rounded border border-forest-border text-center"
                  />
                  <span className="text-xs text-forest-muted">Mins</span>
                </div>

                <button
                  onClick={handleDispatch}
                  disabled={isDispatching}
                  className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-red-600 via-orange-600 to-amber-600 hover:from-red-500 hover:to-amber-500 text-white font-extrabold text-xs uppercase tracking-wider transition-all shadow-lg active:scale-95 disabled:opacity-50"
                >
                  {isDispatching ? 'Transmitting Orders...' : 'Authorize & Dispatch Unit'}
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className="text-center py-8 text-forest-muted text-xs">
            No active emergency incidents selected. Select an incident from Alerts or run the Simulation.
          </div>
        )}
      </div>

      {/* Fleet Roster Status Cards (5 Teams) */}
      <div className="space-y-3">
        <h3 className="text-xs font-bold text-forest-muted uppercase tracking-wider block font-mono">
          Forest Response Fleet Roster (5 Specialized Units)
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {teams.map((t) => (
            <div key={t.id} className="p-4 rounded-xl bg-forest-card border border-forest-border space-y-3 shadow-md">
              <div className="flex items-center justify-between">
                <span className="font-mono text-xs font-bold text-forest-accent">{t.id}</span>
                <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase ${
                  t.status === 'available' ? 'bg-emerald-500/20 text-emerald-300' :
                  t.status === 'en_route' ? 'bg-amber-500/20 text-amber-300 animate-pulse' :
                  'bg-blue-500/20 text-blue-300'
                }`}>
                  {t.status.replace('_', ' ')}
                </span>
              </div>

              <div>
                <h4 className="font-bold text-white text-xs">{t.name}</h4>
                <p className="text-[11px] text-forest-muted mt-0.5">Leader: {t.leader}</p>
              </div>

              <div className="p-2.5 rounded-lg bg-forest-darkest border border-forest-border font-mono text-[10px] space-y-1 text-forest-muted">
                <div>Vehicle: <strong className="text-white">{t.vehicle}</strong></div>
                <div>Equipment: {t.equipment}</div>
                <div>Contact: {t.contact}</div>
                <div>Coordinates: {t.current_lat?.toFixed(4)}, {t.current_lng?.toFixed(4)}</div>
                {t.assigned_incident_id && (
                  <div className="text-amber-400">Assigned: {t.assigned_incident_id} (ETA: {t.eta_minutes || 0}m)</div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

