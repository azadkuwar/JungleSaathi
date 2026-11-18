export type NodeStatus = 'online' | 'offline' | 'warning' | 'low_battery' | 'maintenance';
export type AlertSeverity = 'low' | 'medium' | 'high' | 'critical';
export type AlertStatus = 'new' | 'acknowledged' | 'under_investigation' | 'team_dispatched' | 'resolved' | 'false_alarm';
export type TeamStatus = 'available' | 'assigned' | 'dispatched' | 'en_route' | 'arrived' | 'investigating' | 'action_taken' | 'completed';
export type IncidentStatus = 'new' | 'acknowledged' | 'investigation_started' | 'team_assigned' | 'team_dispatched' | 'team_arrived' | 'problem_identified' | 'action_taken' | 'resolution_submitted' | 'verified' | 'closed';

export interface ForestNode {
  id: string;
  name: string;
  zone: string;
  lat: number;
  lng: number;
  status: NodeStatus;
  battery: number;
  signal_rssi: number;
  temperature: number;
  humidity: number;
  smoke_ppm: number;
  pir_motion: string;
  mic_status: string;
  gateway_id: string;
  last_heartbeat: string;
  firmware_version: string;
  node_type?: 'physical_esp32' | 'virtual_smartphone';
  history?: TelemetryHistory[];
  alerts?: AlertItem[];
}

export interface TelemetryHistory {
  id?: number;
  node_id: string;
  timestamp: string;
  temperature: number;
  humidity: number;
  smoke_ppm: number;
  battery: number;
  signal_rssi: number;
}

export interface LoRaGateway {
  id: string;
  name: string;
  zone: string;
  lat: number;
  lng: number;
  status: string;
  frequency_mhz: number;
  packets_received: number;
  packets_lost: number;
  snr_db: number;
  uptime_hours: number;
  last_communication: string;
  connected_node_count?: number;
  connected_nodes?: ForestNode[];
}

export interface AlertItem {
  id: string;
  title: string;
  category: string;
  severity: AlertSeverity;
  source_node: string;
  detection_method: string;
  confidence: number | null;
  lat: number;
  lng: number;
  timestamp: string;
  description: string;
  recommended_action: string;
  status: AlertStatus;
  incident_id?: string | null;
  node?: ForestNode;
  incident?: IncidentItem;
}

export interface IncidentTimelineStep {
  step: string;
  time: string;
  note: string;
}

export interface IncidentItem {
  id: string;
  alert_id?: string | null;
  title: string;
  category: string;
  severity: AlertSeverity;
  source_node: string;
  lat: number;
  lng: number;
  detection_timestamp: string;
  ai_classification?: string | null;
  ai_confidence?: number | null;
  assigned_team_id?: string | null;
  status: IncidentStatus;
  evidence_url?: string | null;
  problem_identified?: string | null;
  investigation_notes?: string | null;
  action_taken?: string | null;
  resources_used?: string | null;
  resolution_summary?: string | null;
  verified_by?: string | null;
  final_outcome?: string | null;
  closed_at?: string | null;
  timeline: IncidentTimelineStep[];
  node?: ForestNode;
  team?: ResponseTeam;
}

export interface ResponseTeam {
  id: string;
  name: string;
  leader: string;
  members_count: number;
  contact: string;
  vehicle: string;
  equipment: string;
  current_lat: number;
  current_lng: number;
  status: TeamStatus;
  assigned_incident_id?: string | null;
  eta_minutes?: number | null;
  last_update: string;
  incident?: IncidentItem | null;
  distanceKm?: number;
  suitabilityScore?: number;
  categoryMatch?: boolean;
}

export interface RfidVehicle {
  id: number;
  tag_id: string;
  vehicle_reg: string;
  vehicle_type: string;
  checkpoint: string;
  entry_time: string;
  exit_time?: string | null;
  status: 'authorized' | 'unauthorized_breach' | 'flagged';
  personnel: string;
  purpose: string;
}

export interface DatasetRecord {
  id: number;
  filename: string;
  label: string;
  duration: number;
  sample_rate: number;
  channels: number;
  split: 'train' | 'val' | 'test';
  snr_db: number;
  is_demo: number;
  source: string;
}

export interface SimulationStepLog {
  step: number;
  time: string;
  title: string;
  desc: string;
  module: string;
}

export interface SimulationState {
  isActive: boolean;
  scenarioId: string | null;
  scenarioName: string;
  currentStep: number;
  totalSteps: number;
  stepInfo: {
    step: number;
    title: string;
    desc: string;
    module: string;
  } | null;
  logs: SimulationStepLog[];
}

export interface SystemSettingsMap {
  forest_name?: string;
  forest_zone_count?: string;
  center_lat?: string;
  center_lng?: string;
  smoke_threshold_ppm?: string;
  temp_threshold_c?: string;
  battery_low_threshold?: string;
  heartbeat_timeout_sec?: string;
  ai_confidence_threshold?: string;
  sound_alert_enabled?: string;
  demo_mode?: string;
  gateway_frequency?: string;
  [key: string]: string | undefined;
}

export interface VirtualPairingSession {
  id: string;
  code: string;
  node_id: string;
  device_name?: string | null;
  status: 'pending' | 'paired' | 'disconnected' | 'expired';
  created_at: string;
  expires_at: string;
  ip_address?: string | null;
  battery_level?: number | null;
  mic_status?: string | null;
  streaming_status?: 'idle' | 'streaming' | 'paused' | 'error';
  lat?: number | null;
  lng?: number | null;
}

export interface VirtualAudioEvent {
  id: string;
  node_id: string;
  audio_url: string;
  category: string;
  confidence: number;
  risk_level: string;
  timestamp: string;
  rms_energy: number;
  alert_id?: string | null;
  incident_id?: string | null;
  verified_status: 'unverified' | 'confirmed' | 'false_alarm';
}

