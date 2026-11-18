import React, { useEffect, useState } from 'react';
import { useApp } from '../../context/AppContext';
import confetti from 'canvas-confetti';
import {
  Play,
  Pause,
  RotateCcw,
  SkipForward,
  X,
  ShieldAlert,
  CheckCircle2,
  MapPin,
  Truck,
  FileCheck,
  Radio,
  Cpu,
  Terminal,
  ExternalLink
} from 'lucide-react';

export const EmergencySimulationModal: React.FC = () => {
  const {
    isSimModalOpen,
    setSimModalOpen,
    simulationState,
    startSimulation,
    stepSimulation,
    stopSimulation,
    resetSimulation,
    setActiveTab,
    setSelectedIncidentId
  } = useApp();

  const [selectedScenario, setSelectedScenario] = useState('chainsaw_poaching');
  const [hasCelebrated, setHasCelebrated] = useState(false);

  const scenarios = [
    {
      id: 'chainsaw_poaching',
      title: 'Primary Scenario: Suspicious Activity (Chainsaw)',
      badge: '20 Steps Complete Workflow',
      desc: 'Chainsaw audio detection → AI 94.2% confidence → LoRa relay → Alert → Map plot → Patrol team dispatch → Live GPS movement → Suspect detention → Incident verification & closure.'
    },
    {
      id: 'forest_fire',
      title: 'Scenario B: Rapid Forest Fire Outbreak',
      badge: '10 Steps Fire Containment',
      desc: 'Smoke spike & thermal rise → Audio crackle verification → Critical alert → Fire Response Tender dispatched → Firebreak trench cut → Extinguished & certified.'
    },
    {
      id: 'animal_distress',
      title: 'Scenario C: Wildlife in Distress',
      badge: '7 Steps Vet Rescue',
      desc: 'Elephant distress call → Bioacoustic classification → High-priority alert → Veterinary Rescue Team Alpha dispatched → Calf winched to safety → Resolved.'
    },
    {
      id: 'node_failure',
      title: 'Scenario D: IoT Node Heartbeat Lost',
      badge: '7 Steps Hardware Repair',
      desc: 'Heartbeat missed >180s → Node status offline → Maintenance alert → Technical Squad deployed → LoRa antenna & solar regulator replaced → Restored.'
    }
  ];

  const currentStep = simulationState.currentStep || 0;
  const totalSteps = simulationState.totalSteps || 20;
  const progressPct = totalSteps > 0 ? Math.min(100, Math.round((currentStep / totalSteps) * 100)) : 0;
  const isFinished = currentStep > 0 && currentStep >= totalSteps;

  // Trigger confetti upon completing scenario
  useEffect(() => {
    if (isFinished && !hasCelebrated) {
      setHasCelebrated(true);
      confetti({
        particleCount: 120,
        spread: 80,
        origin: { y: 0.6 }
      });
    }
    if (!isFinished) {
      setHasCelebrated(false);
    }
  }, [isFinished, hasCelebrated]);

  if (!isSimModalOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
      <div className="bg-forest-card border border-forest-border w-full max-w-4xl rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Modal Header */}
        <div className="px-6 py-4 bg-gradient-to-r from-forest-primary via-forest-card to-forest-secondary border-b border-forest-border flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-red-500/20 border border-red-500/40 text-red-400">
              <ShieldAlert className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-white tracking-wide">
                Integrated Forest Emergency Simulation Engine
              </h2>
              <p className="text-xs text-forest-muted">
                Demonstrates end-to-end telemetry, edge AI, LoRa relay, dispatch, GPS tracking & resolution
              </p>
            </div>
          </div>

          <button
            onClick={() => setSimModalOpen(false)}
            className="p-1.5 rounded-lg text-forest-muted hover:text-white hover:bg-forest-cardHover transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1">
          {/* Scenario Selector */}
          <div>
            <label className="block text-xs font-semibold text-forest-muted uppercase tracking-wider mb-2">
              Select Demonstration Scenario:
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {scenarios.map((sc) => {
                const isSelected = selectedScenario === sc.id;
                return (
                  <div
                    key={sc.id}
                    onClick={() => {
                      setSelectedScenario(sc.id);
                      if (!simulationState.isActive) {
                        // start selected
                      }
                    }}
                    className={`p-3 rounded-xl border text-left cursor-pointer transition-all ${
                      isSelected
                        ? 'bg-forest-primary/80 border-forest-accent shadow-md shadow-emerald-950/40'
                        : 'bg-forest-darkest/60 border-forest-border hover:border-forest-border/80 hover:bg-forest-cardHover'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-bold text-xs text-white">{sc.title}</span>
                      <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-forest-secondary text-forest-accent border border-forest-border">
                        {sc.badge}
                      </span>
                    </div>
                    <p className="text-[11px] text-forest-muted leading-relaxed line-clamp-2">
                      {sc.desc}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Progress Tracker Bar */}
          <div className="p-4 rounded-xl bg-forest-darkest border border-forest-border space-y-3">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-white flex items-center gap-2">
                <span className="relative flex h-2.5 w-2.5">
                  <span className={`animate-ping absolute inline-flex h-full w-full rounded-full ${simulationState.isActive ? 'bg-amber-400' : 'bg-emerald-400'} opacity-75`}></span>
                  <span className={`relative inline-flex rounded-full h-2.5 w-2.5 ${simulationState.isActive ? 'bg-amber-400' : isFinished ? 'bg-emerald-400' : 'bg-forest-muted'}`}></span>
                </span>
                <span>
                  {simulationState.isActive
                    ? `Executing: ${simulationState.scenarioName}`
                    : isFinished
                    ? 'Simulation Complete & Verified'
                    : 'Simulation Ready to Launch'}
                </span>
              </span>
              <span className="font-mono text-forest-accent font-bold">
                Step {currentStep} / {totalSteps} ({progressPct}%)
              </span>
            </div>

            {/* Visual Bar */}
            <div className="w-full h-2.5 bg-forest-card rounded-full overflow-hidden border border-forest-border/60">
              <div
                className="h-full bg-gradient-to-r from-emerald-500 via-amber-500 to-red-500 transition-all duration-500 rounded-full"
                style={{ width: `${progressPct}%` }}
              />
            </div>

            {/* Current Step Spotlight Card */}
            {simulationState.stepInfo && (
              <div className="mt-3 p-3.5 rounded-lg bg-forest-card border border-forest-accent/40 shadow-inner">
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-forest-accent/20 text-forest-accent border border-forest-accent/30 font-mono">
                      Step {simulationState.stepInfo.step}
                    </span>
                    <span className="text-xs font-bold text-white">
                      {simulationState.stepInfo.title}
                    </span>
                  </div>
                  <span className="text-[10px] font-mono text-forest-muted bg-forest-secondary px-2 py-0.5 rounded border border-forest-border">
                    {simulationState.stepInfo.module}
                  </span>
                </div>
                <p className="text-xs text-forest-muted leading-relaxed">
                  {simulationState.stepInfo.desc}
                </p>
              </div>
            )}
          </div>

          {/* Quick Module Jump Links */}
          <div className="flex flex-wrap items-center gap-2 text-xs">
            <span className="text-forest-muted text-[11px] font-medium mr-1">
              Jump to live UI view:
            </span>
            <button
              onClick={() => {
                setSimModalOpen(false);
                setActiveTab('map');
              }}
              className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-forest-primary/70 hover:bg-forest-primary border border-forest-border text-white text-xs transition-colors"
            >
              <MapPin className="w-3.5 h-3.5 text-forest-accent" />
              <span>Live Forest Map</span>
            </button>
            <button
              onClick={() => {
                setSimModalOpen(false);
                setActiveTab('dispatch');
              }}
              className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-forest-primary/70 hover:bg-forest-primary border border-forest-border text-white text-xs transition-colors"
            >
              <Truck className="w-3.5 h-3.5 text-blue-400" />
              <span>Team Dispatch</span>
            </button>
            <button
              onClick={() => {
                setSimModalOpen(false);
                setActiveTab('resolution');
                setSelectedIncidentId('INC-SIM-CH1');
              }}
              className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-forest-primary/70 hover:bg-forest-primary border border-forest-border text-white text-xs transition-colors"
            >
              <FileCheck className="w-3.5 h-3.5 text-emerald-400" />
              <span>Incident Resolution</span>
            </button>
          </div>

          {/* Terminal / Live Logs Output */}
          <div className="rounded-xl bg-forest-darkest border border-forest-border overflow-hidden">
            <div className="px-3.5 py-2 bg-forest-card/80 border-b border-forest-border flex items-center justify-between text-xs">
              <div className="flex items-center gap-2 text-forest-muted font-mono">
                <Terminal className="w-3.5 h-3.5 text-forest-accent" />
                <span>Simulation Event Stream (Real-Time SQLite & LoRa Bus)</span>
              </div>
              <span className="text-[10px] text-forest-muted font-mono">
                {simulationState.logs.length} events logged
              </span>
            </div>

            <div className="p-3 max-h-44 overflow-y-auto font-mono text-[11px] space-y-1.5 text-forest-muted">
              {simulationState.logs.length === 0 ? (
                <div className="text-center py-4 text-forest-muted/50 italic">
                  Press "Run Complete Emergency Simulation" to start.
                </div>
              ) : (
                simulationState.logs.map((l, idx) => (
                  <div key={idx} className="flex items-start gap-2 leading-tight">
                    <span className="text-forest-accent">[{new Date(l.time).toLocaleTimeString()}]</span>
                    <span className="text-amber-400 font-semibold">[Step {l.step}]</span>
                    <span className="text-white font-medium">{l.title}:</span>
                    <span className="text-forest-muted">{l.desc}</span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Modal Controls Footer */}
        <div className="px-6 py-4 bg-forest-darkest border-t border-forest-border flex flex-wrap items-center justify-between gap-3">
          <button
            onClick={resetSimulation}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-forest-card hover:bg-forest-cardHover text-forest-muted hover:text-white border border-forest-border text-xs font-medium transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset Baseline</span>
          </button>

          <div className="flex items-center gap-2">
            {simulationState.isActive ? (
              <button
                onClick={stopSimulation}
                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs uppercase tracking-wider transition-colors shadow-md shadow-amber-950/40"
              >
                <Pause className="w-3.5 h-3.5" />
                <span>Pause</span>
              </button>
            ) : (
              <button
                onClick={() => startSimulation(selectedScenario, true)}
                className="flex items-center gap-2 px-5 py-2 rounded-lg bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs uppercase tracking-wider transition-all shadow-lg shadow-emerald-950/50 hover:shadow-emerald-700/60 active:scale-95"
              >
                <Play className="w-3.5 h-3.5 fill-current" />
                <span>Run Complete Simulation</span>
              </button>
            )}

            <button
              onClick={stepSimulation}
              disabled={isFinished}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-forest-card hover:bg-forest-cardHover disabled:opacity-50 text-white border border-forest-border text-xs font-medium transition-colors"
            >
              <span>Step</span>
              <SkipForward className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

