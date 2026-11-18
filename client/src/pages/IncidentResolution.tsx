import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { IncidentItem } from '../types';
import {
  FileCheck,
  CheckCircle2,
  AlertTriangle,
  ShieldCheck,
  Search,
  Filter,
  UserCheck,
  Clock,
  Printer,
  ChevronRight,
  ExternalLink,
  Award,
  Trees
} from 'lucide-react';
import { AudioEvidencePlayer } from '../components/audio/AudioEvidencePlayer';

export const IncidentResolution: React.FC = () => {
  const {
    incidents,
    selectedIncidentId,
    setSelectedIncidentId,
    resolveIncident,
    refreshData
  } = useApp();

  const [activeIncidentId, setActiveIncidentId] = useState<string>(selectedIncidentId || '');
  const [filterOutcome, setFilterOutcome] = useState('all');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form Fields
  const [problemIdentified, setProblemIdentified] = useState('');
  const [investigationNotes, setInvestigationNotes] = useState('');
  const [evidenceDescription, setEvidenceDescription] = useState('');
  const [actionTaken, setActionTaken] = useState('');
  const [resourcesUsed, setResourcesUsed] = useState('');
  const [resolutionSummary, setResolutionSummary] = useState('');
  const [finalOutcome, setFinalOutcome] = useState('Suspicious Activity Investigated');
  const [verifiedBy, setVerifiedBy] = useState('Ranger Vikram Sen (Chief Conservator)');

  const outcomesList = [
    'Wildlife Safely Rescued',
    'Suspicious Activity Investigated',
    'Fire Controlled',
    'Human Intrusion Verified',
    'No Threat Found',
    'False Alarm',
    'Monitoring Node Repaired',
    'Other'
  ];

  // Sync selected incident
  useEffect(() => {
    if (selectedIncidentId) {
      setActiveIncidentId(selectedIncidentId);
    } else if (incidents.length > 0) {
      setActiveIncidentId(incidents[0].id);
    }
  }, [selectedIncidentId, incidents]);

  const activeInc = incidents.find(i => i.id === activeIncidentId) || incidents[0];

  // Populate form with incident data if already present
  useEffect(() => {
    if (activeInc) {
      setProblemIdentified(activeInc.problem_identified || '');
      setInvestigationNotes(activeInc.investigation_notes || '');
      setActionTaken(activeInc.action_taken || '');
      setResourcesUsed(activeInc.resources_used || '4 Rangers, Safari Cruiser, VHF radios');
      setResolutionSummary(activeInc.resolution_summary || '');
      setFinalOutcome(activeInc.final_outcome || 'Suspicious Activity Investigated');
      setVerifiedBy(activeInc.verified_by || 'Ranger Vikram Sen (Chief Conservator)');
    }
  }, [activeIncidentId, activeInc]);

  const handleSubmitResolution = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeInc) return;
    setIsSubmitting(true);
    try {
      await resolveIncident(activeInc.id, {
        problem_identified: problemIdentified,
        investigation_notes: investigationNotes,
        evidence_description: evidenceDescription,
        action_taken: actionTaken,
        resources_used: resourcesUsed,
        resolution_summary: resolutionSummary,
        final_outcome: finalOutcome,
        verified_by: verifiedBy
      });
      refreshData();
    } finally {
      setIsSubmitting(false);
    }
  };

  const isClosed = activeInc?.status === 'closed';

  return (
    <div className="p-4 sm:p-6 space-y-6 max-w-[1600px] mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-white tracking-wide">
              Incident Investigation & Verified Problem Resolution Hub
            </h1>
            <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-forest-primary text-forest-accent border border-forest-border">
              Legal Forest Protocol
            </span>
          </div>
          <p className="text-xs text-forest-muted">
            Formal audit trail: field problem identification, forensic evidence logging, operational mitigation & Chief Conservator verification
          </p>
        </div>

        {/* Incident Selector */}
        <div className="flex items-center gap-2 bg-forest-card px-3 py-1.5 rounded-xl border border-forest-border text-xs">
          <span className="text-forest-muted">Selected Incident:</span>
          <select
            value={activeIncidentId}
            onChange={(e) => {
              setActiveIncidentId(e.target.value);
              setSelectedIncidentId(e.target.value);
            }}
            className="bg-forest-darkest text-white border border-forest-border rounded-lg px-2.5 py-1 font-semibold focus:outline-none focus:border-forest-accent"
          >
            {incidents.map(inc => (
              <option key={inc.id} value={inc.id}>
                {inc.id} - {inc.title} ({inc.status.toUpperCase()})
              </option>
            ))}
          </select>
        </div>
      </div>

      {activeInc && (
        <div className="space-y-6">
          {/* Visual 8-Step Lifecycle Stepper */}
          <div className="p-5 rounded-2xl bg-forest-card border border-forest-border shadow-lg space-y-3">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-white uppercase tracking-wider font-mono">
                Incident Lifecycle Progress
              </span>
              <span className="font-mono text-forest-accent font-bold">
                Current Status: {activeInc.status.toUpperCase()}
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2 pt-2">
              {[
                { label: '1. New Alert', active: true },
                { label: '2. Acknowledged', active: activeInc.status !== 'new' },
                { label: '3. Investigation', active: activeInc.status !== 'new' && activeInc.status !== 'acknowledged' },
                { label: '4. Dispatched', active: ['team_dispatched', 'team_arrived', 'problem_identified', 'action_taken', 'closed'].includes(activeInc.status) },
                { label: '5. Arrived', active: ['team_arrived', 'problem_identified', 'action_taken', 'closed'].includes(activeInc.status) },
                { label: '6. Problem ID', active: ['problem_identified', 'action_taken', 'closed'].includes(activeInc.status) },
                { label: '7. Action Taken', active: ['action_taken', 'closed'].includes(activeInc.status) },
                { label: '8. Verified', active: activeInc.status === 'closed' }
              ].map((step, idx) => (
                <div
                  key={idx}
                  className={`p-2.5 rounded-xl border text-center transition-all ${
                    step.active
                      ? 'bg-forest-primary text-forest-accent border-forest-accent/50 font-bold'
                      : 'bg-forest-darkest/60 text-forest-muted/50 border-forest-border font-medium'
                  }`}
                >
                  <span className="text-[11px] block truncate">{step.label}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Two-Column Form & Certificate Layout */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Left 7 Cols: Incident Investigation & Submission Form */}
            <div className="lg:col-span-7 p-6 rounded-2xl bg-forest-card border border-forest-border shadow-xl space-y-5">
              <div className="flex items-center justify-between border-b border-forest-border pb-3">
                <div>
                  <span className="text-[10px] font-mono uppercase text-forest-accent font-bold">
                    Official Incident Filing Dossier
                  </span>
                  <h3 className="text-sm font-bold text-white">
                    {activeInc.id} — {activeInc.title}
                  </h3>
                </div>

                <span className={`px-2.5 py-0.5 rounded text-xs font-mono font-bold uppercase ${
                  isClosed ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40' : 'bg-amber-500/20 text-amber-300'
                }`}>
                  {activeInc.status}
                </span>
              </div>

              {activeInc.evidence_url && (
                <div className="rounded-xl overflow-hidden">
                  <div className="text-[11px] font-mono text-cyan-300 mb-1.5 flex items-center gap-1.5 font-bold">
                    <span>🎙️ Captured Audio Evidence (Listen Before Filing)</span>
                  </div>
                  <AudioEvidencePlayer
                    audioUrl={activeInc.evidence_url}
                    category={activeInc.category}
                    confidence={activeInc.ai_confidence || 0.88}
                    nodeId={activeInc.source_node}
                    timestamp={activeInc.detection_timestamp}
                    verifiedStatus={activeInc.status === 'closed' ? 'confirmed' : 'unverified'}
                  />
                </div>
              )}

              <form onSubmit={handleSubmitResolution} className="space-y-4 text-xs">
                <div>
                  <label className="block text-forest-muted mb-1 font-semibold">
                    1. Ground Problem Identified
                  </label>
                  <textarea
                    rows={2}
                    required
                    value={problemIdentified}
                    onChange={(e) => setProblemIdentified(e.target.value)}
                    placeholder="Describe specific ecological hazard or illegal intrusion verified on site..."
                    className="w-full bg-forest-darkest text-white p-3 rounded-xl border border-forest-border focus:outline-none focus:border-forest-accent"
                  />
                </div>

                <div>
                  <label className="block text-forest-muted mb-1 font-semibold">
                    2. Tactical Field Investigation Notes
                  </label>
                  <textarea
                    rows={2}
                    value={investigationNotes}
                    onChange={(e) => setInvestigationNotes(e.target.value)}
                    placeholder="Perimeter cordon details, thermal imaging observations, vehicle tire tracks..."
                    className="w-full bg-forest-darkest text-white p-3 rounded-xl border border-forest-border focus:outline-none focus:border-forest-accent"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-forest-muted mb-1 font-semibold">
                      3. Action Taken / Mitigation
                    </label>
                    <input
                      type="text"
                      required
                      value={actionTaken}
                      onChange={(e) => setActionTaken(e.target.value)}
                      placeholder="e.g. Suspects detained / Fire extinguished"
                      className="w-full bg-forest-darkest text-white p-2.5 rounded-xl border border-forest-border"
                    />
                  </div>

                  <div>
                    <label className="block text-forest-muted mb-1 font-semibold">
                      4. Equipment / Resources Used
                    </label>
                    <input
                      type="text"
                      value={resourcesUsed}
                      onChange={(e) => setResourcesUsed(e.target.value)}
                      placeholder="e.g. Safari Cruiser, 4 Officers, GPS"
                      className="w-full bg-forest-darkest text-white p-2.5 rounded-xl border border-forest-border"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-forest-muted mb-1 font-semibold">
                      5. Final Resolution Outcome
                    </label>
                    <select
                      value={finalOutcome}
                      onChange={(e) => setFinalOutcome(e.target.value)}
                      className="w-full bg-forest-darkest text-white p-2.5 rounded-xl border border-forest-border focus:outline-none font-semibold"
                    >
                      {outcomesList.map(o => <option key={o} value={o}>{o}</option>)}
                    </select>
                  </div>

                  <div>
                    <label className="block text-forest-muted mb-1 font-semibold">
                      6. Verifying Officer (Chief Conservator)
                    </label>
                    <input
                      type="text"
                      required
                      value={verifiedBy}
                      onChange={(e) => setVerifiedBy(e.target.value)}
                      className="w-full bg-forest-darkest text-white p-2.5 rounded-xl border border-forest-border font-semibold"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-forest-muted mb-1 font-semibold">
                    7. Final Resolution Summary & Certification Note
                  </label>
                  <textarea
                    rows={2}
                    required
                    value={resolutionSummary}
                    onChange={(e) => setResolutionSummary(e.target.value)}
                    placeholder="Official summary certifying the sector has been restored to safe operating condition..."
                    className="w-full bg-forest-darkest text-white p-3 rounded-xl border border-forest-border focus:outline-none focus:border-forest-accent"
                  />
                </div>

                <div className="pt-2 flex justify-end">
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="px-6 py-2.5 rounded-xl bg-forest-accent hover:bg-forest-accentHover text-forest-darkest font-extrabold text-xs uppercase tracking-wider transition-all shadow-md active:scale-95 disabled:opacity-50 flex items-center gap-2"
                  >
                    <ShieldCheck className="w-4 h-4" />
                    <span>{isSubmitting ? 'Verifying & Archiving...' : 'Submit Resolution & Certify Case'}</span>
                  </button>
                </div>
              </form>
            </div>

            {/* Right 5 Cols: Official Printable Resolution Certificate Preview */}
            <div className="lg:col-span-5 space-y-4">
              <div className="p-6 rounded-2xl bg-gradient-to-b from-[#14231C] to-[#0D1913] border-2 border-forest-accent/50 shadow-2xl relative overflow-hidden space-y-4">
                {/* Certificate Watermark / Header */}
                <div className="flex items-center justify-between border-b border-forest-border/80 pb-3">
                  <div className="flex items-center gap-2">
                    <Trees className="w-5 h-5 text-forest-accent" />
                    <div>
                      <span className="font-extrabold text-xs text-white uppercase tracking-wider block font-sans">
                        Bandhavgarh-Kanha Reserve
                      </span>
                      <span className="text-[10px] text-forest-muted">
                        Official Resolution Certification
                      </span>
                    </div>
                  </div>
                  <Award className="w-6 h-6 text-forest-accent" />
                </div>

                <div className="space-y-2.5 text-xs">
                  <div className="flex justify-between font-mono text-[11px]">
                    <span className="text-forest-muted">Case Docket:</span>
                    <span className="text-white font-bold">{activeInc.id}</span>
                  </div>
                  <div className="flex justify-between font-mono text-[11px]">
                    <span className="text-forest-muted">Classification:</span>
                    <span className="text-forest-accent">{activeInc.category}</span>
                  </div>
                  <div className="flex justify-between font-mono text-[11px]">
                    <span className="text-forest-muted">Source Sentry:</span>
                    <span className="text-white">{activeInc.source_node}</span>
                  </div>
                  <div className="flex justify-between font-mono text-[11px]">
                    <span className="text-forest-muted">Certified Outcome:</span>
                    <span className="text-emerald-400 font-bold">{finalOutcome}</span>
                  </div>

                  <div className="p-3 rounded-xl bg-forest-darkest/80 border border-forest-border space-y-1">
                    <span className="text-[10px] text-forest-muted uppercase tracking-wider font-bold block">
                      Certified Summary:
                    </span>
                    <p className="text-[11px] text-white italic leading-relaxed">
                      "{resolutionSummary || 'Case certified in accordance with Tiger Reserve operating protocols.'}"
                    </p>
                  </div>

                  <div className="pt-3 border-t border-forest-border/80 flex items-center justify-between text-[11px]">
                    <div>
                      <span className="text-[10px] text-forest-muted block">Signed & Verified:</span>
                      <strong className="text-forest-accent">{verifiedBy}</strong>
                    </div>
                    <span className="px-2 py-0.5 rounded font-mono text-[10px] bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-bold uppercase">
                      CERTIFIED
                    </span>
                  </div>
                </div>
              </div>

              {/* Timestamped Timeline Steps */}
              <div className="p-4 rounded-xl bg-forest-card border border-forest-border space-y-2 text-xs">
                <span className="font-bold text-white uppercase tracking-wider text-[11px] block">
                  Incident Chronological Audit Trail
                </span>
                <div className="space-y-2 max-h-48 overflow-y-auto font-mono text-[11px] text-forest-muted">
                  {activeInc.timeline?.map((t: any, idx: number) => (
                    <div key={idx} className="flex items-start gap-2 border-l border-forest-accent pl-2 py-0.5">
                      <span className="text-forest-accent font-semibold">[{t.step}]</span>
                      <span className="text-white">{t.note}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

