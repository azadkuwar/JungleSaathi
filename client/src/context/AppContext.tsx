import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import {
  ForestNode,
  LoRaGateway,
  AlertItem,
  IncidentItem,
  ResponseTeam,
  RfidVehicle,
  SimulationState,
  SystemSettingsMap
} from '../types';

export interface AppNotification {
  id: string;
  type: 'critical' | 'warning' | 'info' | 'success';
  title: string;
  message: string;
  timestamp: string;
}

interface AppContextType {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  selectedIncidentId: string | null;
  setSelectedIncidentId: (id: string | null) => void;
  selectedNodeId: string | null;
  setSelectedNodeId: (id: string | null) => void;
  nodes: ForestNode[];
  gateways: LoRaGateway[];
  alerts: AlertItem[];
  incidents: IncidentItem[];
  teams: ResponseTeam[];
  rfidVehicles: RfidVehicle[];
  settings: SystemSettingsMap;
  simulationState: SimulationState;
  isSimModalOpen: boolean;
  setSimModalOpen: (open: boolean) => void;
  selectedScenario: string;
  setSelectedScenario: (id: string) => void;
  notifications: AppNotification[];
  addNotification: (type: 'critical' | 'warning' | 'info' | 'success', title: string, message: string) => void;
  dismissNotification: (id: string) => void;
  refreshData: () => Promise<void>;
  
  // Actions
  startSimulation: (scenarioId?: string, autoPlay?: boolean) => Promise<void>;
  stepSimulation: () => Promise<void>;
  stopSimulation: () => Promise<void>;
  resetSimulation: () => Promise<void>;
  acknowledgeAlert: (alertId: string) => Promise<void>;
  escalateAlert: (alertId: string) => Promise<void>;
  resolveAlert: (alertId: string) => Promise<void>;
  dispatchTeam: (teamId: string, incidentId: string, etaMinutes?: number) => Promise<void>;
  resolveIncident: (incidentId: string, data: any) => Promise<void>;
  restartNode: (nodeId: string) => Promise<void>;
  toggleNodeMaintenance: (nodeId: string) => Promise<void>;
  restartGateway: (gatewayId: string) => Promise<void>;
  scanRfid: (tagId: string, checkpoint?: string) => Promise<any>;
  resetDemoData: () => Promise<void>;
  playChime: () => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

// Web Audio API emergency chime
function playEmergencyChime() {
  try {
    const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContext) return;
    const ctx = new AudioContext();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(880, ctx.currentTime); // A5
    osc.frequency.exponentialRampToValueAtTime(440, ctx.currentTime + 0.35);

    gain.gain.setValueAtTime(0.3, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.35);

    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.35);
  } catch (e) {
    // Ignore audio autoplay restrictions
  }
}

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [activeTab, setActiveTab] = useState<string>('overview');
  const [selectedIncidentId, setSelectedIncidentId] = useState<string | null>(null);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);

  const [nodes, setNodes] = useState<ForestNode[]>([]);
  const [gateways, setGateways] = useState<LoRaGateway[]>([]);
  const [alerts, setAlerts] = useState<AlertItem[]>([]);
  const [incidents, setIncidents] = useState<IncidentItem[]>([]);
  const [teams, setTeams] = useState<ResponseTeam[]>([]);
  const [rfidVehicles, setRfidVehicles] = useState<RfidVehicle[]>([]);
  const [settings, setSettings] = useState<SystemSettingsMap>({});

  const [simulationState, setSimulationState] = useState<SimulationState>({
    isActive: false,
    scenarioId: null,
    scenarioName: '',
    currentStep: 0,
    totalSteps: 0,
    stepInfo: null,
    logs: []
  });

  const [isSimModalOpen, setSimModalOpen] = useState(false);
  const [selectedScenario, setSelectedScenario] = useState('chainsaw_poaching');
  const [notifications, setNotifications] = useState<AppNotification[]>([]);

  const addNotification = useCallback((type: 'critical' | 'warning' | 'info' | 'success', title: string, message: string) => {
    const id = Date.now().toString() + Math.random().toString().slice(2, 6);
    const newNotif: AppNotification = { id, type, title, message, timestamp: new Date().toLocaleTimeString() };
    setNotifications(prev => [newNotif, ...prev.slice(0, 9)]);

    if (type === 'critical' || type === 'warning') {
      playEmergencyChime();
    }
  }, []);

  const dismissNotification = useCallback((id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  }, []);

  // Fetch full system state
  const refreshData = useCallback(async () => {
    try {
      const [
        nodesRes,
        gatewaysRes,
        alertsRes,
        incidentsRes,
        teamsRes,
        rfidRes,
        settingsRes,
        simRes
      ] = await Promise.all([
        fetch('/api/nodes').then(r => r.json()),
        fetch('/api/gateways').then(r => r.json()),
        fetch('/api/alerts?limit=50').then(r => r.json()),
        fetch('/api/incidents?limit=50').then(r => r.json()),
        fetch('/api/teams').then(r => r.json()),
        fetch('/api/rfid?limit=30').then(r => r.json()),
        fetch('/api/settings').then(r => r.json()),
        fetch('/api/simulations/status').then(r => r.json()),
      ]);

      if (nodesRes.success) setNodes(nodesRes.data);
      if (gatewaysRes.success) setGateways(gatewaysRes.data);
      if (alertsRes.success) setAlerts(alertsRes.data);
      if (incidentsRes.success) setIncidents(incidentsRes.data);
      if (teamsRes.success) setTeams(teamsRes.data);
      if (rfidRes.success) setRfidVehicles(rfidRes.data);
      if (settingsRes.success) setSettings(settingsRes.data);
      if (simRes.success) setSimulationState(simRes.data);
    } catch (err) {
      console.error('Failed to load application data:', err);
    }
  }, []);

  // Setup WebSocket listener for real-time telemetry, alerts, and simulation updates
  useEffect(() => {
    refreshData();

    let ws: WebSocket | null = null;
    let reconnectTimeout: any = null;

    function connectWs() {
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const wsUrl = `${protocol}//${window.location.host}/ws`;

      ws = new WebSocket(wsUrl);

      ws.onmessage = (event) => {
        try {
          const msg = JSON.parse(event.data);
          const { type, payload } = msg;

          switch (type) {
            case 'ALERT_CREATED':
              setAlerts(prev => [payload, ...prev]);
              addNotification(
                payload.severity === 'critical' ? 'critical' : 'warning',
                `NEW ALERT: ${payload.title}`,
                `${payload.category} at Node ${payload.source_node}`
              );
              break;

            case 'ALERT_UPDATED':
              setAlerts(prev => prev.map(a => a.id === payload.id ? payload : a));
              break;

            case 'INCIDENT_CREATED':
              setIncidents(prev => [payload, ...prev]);
              addNotification('info', `Incident Opened: ${payload.id}`, payload.title);
              break;

            case 'INCIDENT_UPDATED':
            case 'INCIDENT_RESOLVED':
              setIncidents(prev => prev.map(i => i.id === payload.id ? payload : i));
              if (type === 'INCIDENT_RESOLVED') {
                addNotification('success', `Incident Resolved: ${payload.id}`, payload.resolution_summary || 'Incident successfully resolved.');
              }
              break;

            case 'TEAM_DISPATCHED':
            case 'TEAM_UPDATED':
            case 'TEAM_MOVED':
              setTeams(prev => prev.map(t => t.id === payload.id ? payload : t));
              break;

            case 'NODE_CREATED':
              setNodes(prev => [...prev, payload]);
              break;

            case 'NODE_UPDATED':
              setNodes(prev => prev.map(n => n.id === payload.id ? payload : n));
              break;

            case 'GATEWAY_UPDATED':
              setGateways(prev => prev.map(g => g.id === payload.id ? payload : g));
              break;

            case 'SIMULATION_STEP':
              setSimulationState({
                isActive: payload.currentStep < payload.totalSteps,
                scenarioId: payload.scenarioId,
                scenarioName: payload.scenarioName,
                currentStep: payload.currentStep,
                totalSteps: payload.totalSteps,
                stepInfo: payload.stepInfo,
                logs: payload.logs
              });
              // Refresh full data on key steps so map and dashboard update instantly
              refreshData();
              break;

            case 'SIMULATION_RESET':
            case 'DEMO_RESET':
              refreshData();
              break;

            case 'TELEMETRY_PULSE':
              // Light periodic pulse
              break;

            case 'RFID_SCANNED':
              setRfidVehicles(prev => [payload, ...prev]);
              break;

            default:
              break;
          }
        } catch (e) {
          // ignore
        }
      };

      ws.onclose = () => {
        reconnectTimeout = setTimeout(connectWs, 3000);
      };

      ws.onerror = () => {
        ws?.close();
      };
    }

    connectWs();

    // Poll every 30 seconds as fallback
    const interval = setInterval(refreshData, 30000);

    return () => {
      clearInterval(interval);
      clearTimeout(reconnectTimeout);
      if (ws) ws.close();
    };
  }, [refreshData, addNotification]);

  // Action implementations
  const startSimulation = async (scenarioId = 'chainsaw_poaching', autoPlay = true) => {
    try {
      const res = await fetch('/api/simulations/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ scenarioId, autoPlay, intervalMs: 2500 })
      }).then(r => r.json());

      if (res.success) {
        setSimulationState(res.data);
        setSimModalOpen(true);
        addNotification('info', 'Simulation Initiated', `Running scenario: ${res.data.scenarioName}`);
        refreshData();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const stepSimulation = async () => {
    try {
      const res = await fetch('/api/simulations/step', { method: 'POST' }).then(r => r.json());
      if (res.success) {
        setSimulationState(res.data);
        refreshData();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const stopSimulation = async () => {
    try {
      const res = await fetch('/api/simulations/stop', { method: 'POST' }).then(r => r.json());
      if (res.success) {
        setSimulationState(res.data);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const resetSimulation = async () => {
    try {
      const res = await fetch('/api/simulations/reset', { method: 'POST' }).then(r => r.json());
      if (res.success) {
        setSimulationState({
          isActive: false,
          scenarioId: null,
          scenarioName: '',
          currentStep: 0,
          totalSteps: 0,
          stepInfo: null,
          logs: []
        });
        refreshData();
        addNotification('info', 'Simulation Reset', 'All simulation states restored to normal.');
      }
    } catch (e) {
      console.error(e);
    }
  };

  const acknowledgeAlert = async (alertId: string) => {
    try {
      await fetch(`/api/alerts/${alertId}/acknowledge`, { method: 'PUT' });
      refreshData();
      addNotification('success', 'Alert Acknowledged', `Alert ${alertId} acknowledged.`);
    } catch (e) {
      console.error(e);
    }
  };

  const escalateAlert = async (alertId: string) => {
    try {
      const res = await fetch(`/api/alerts/${alertId}/escalate`, { method: 'PUT' }).then(r => r.json());
      if (res.success) {
        refreshData();
        addNotification('warning', 'Alert Escalated', `Opened Incident ${res.data.incident.id}`);
        setSelectedIncidentId(res.data.incident.id);
        setActiveTab('resolution');
      }
    } catch (e) {
      console.error(e);
    }
  };

  const resolveAlert = async (alertId: string) => {
    try {
      await fetch(`/api/alerts/${alertId}/resolve`, { method: 'PUT' });
      refreshData();
      addNotification('success', 'Alert Resolved', `Alert ${alertId} marked as resolved.`);
    } catch (e) {
      console.error(e);
    }
  };

  const dispatchTeam = async (teamId: string, incidentId: string, etaMinutes = 12) => {
    try {
      const res = await fetch(`/api/teams/${teamId}/dispatch`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ incident_id: incidentId, eta_minutes: etaMinutes })
      }).then(r => r.json());

      if (res.success) {
        refreshData();
        addNotification('success', 'Team Dispatched', `Team deployed towards Incident ${incidentId}. ETA: ${etaMinutes} mins.`);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const resolveIncident = async (incidentId: string, data: any) => {
    try {
      const res = await fetch(`/api/incidents/${incidentId}/resolve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      }).then(r => r.json());

      if (res.success) {
        refreshData();
        addNotification('success', 'Incident Resolved & Closed', `Incident ${incidentId} certified as resolved.`);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const restartNode = async (nodeId: string) => {
    try {
      const res = await fetch(`/api/nodes/${nodeId}/restart`, { method: 'POST' }).then(r => r.json());
      if (res.success) {
        refreshData();
        addNotification('info', 'Node Rebooted', `Node ${nodeId} reconnected.`);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const toggleNodeMaintenance = async (nodeId: string) => {
    try {
      const res = await fetch(`/api/nodes/${nodeId}/maintenance`, { method: 'POST' }).then(r => r.json());
      if (res.success) {
        refreshData();
        addNotification('info', 'Node Status Changed', `Node ${nodeId} updated.`);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const restartGateway = async (gatewayId: string) => {
    try {
      const res = await fetch(`/api/gateways/${gatewayId}/restart`, { method: 'POST' }).then(r => r.json());
      if (res.success) {
        refreshData();
        addNotification('info', 'Gateway Reconnected', `Gateway ${gatewayId} restarted.`);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const scanRfid = async (tagId: string, checkpoint = 'North Gate Checkpoint') => {
    try {
      const res = await fetch('/api/rfid/scan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tag_id: tagId, checkpoint })
      }).then(r => r.json());

      refreshData();
      if (!res.authorized) {
        addNotification('critical', 'SECURITY BREACH', res.warning);
      } else {
        addNotification('success', 'RFID Verified', `${res.action}: ${res.data?.vehicle_reg}`);
      }
      return res;
    } catch (e) {
      console.error(e);
    }
  };

  const resetDemoData = async () => {
    try {
      const res = await fetch('/api/settings/reset-demo-data', { method: 'POST' }).then(r => r.json());
      if (res.success) {
        refreshData();
        addNotification('info', 'Demo Data Reset', 'All demonstration data restored to factory defaults.');
      }
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <AppContext.Provider
      value={{
        activeTab,
        setActiveTab,
        selectedIncidentId,
        setSelectedIncidentId,
        selectedNodeId,
        setSelectedNodeId,
        nodes,
        gateways,
        alerts,
        incidents,
        teams,
        rfidVehicles,
        settings,
        simulationState,
        isSimModalOpen,
        setSimModalOpen,
        selectedScenario,
        setSelectedScenario,
        notifications,
        addNotification,
        dismissNotification,
        refreshData,
        startSimulation,
        stepSimulation,
        stopSimulation,
        resetSimulation,
        acknowledgeAlert,
        escalateAlert,
        resolveAlert,
        dispatchTeam,
        resolveIncident,
        restartNode,
        toggleNodeMaintenance,
        restartGateway,
        scanRfid,
        resetDemoData,
        playChime: playEmergencyChime
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
