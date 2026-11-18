const { DatabaseSync } = require('node:sqlite');
const path = require('node:path');
const fs = require('node:fs');

const dbPath = path.join(__dirname, '..', '..', 'jungle_saathi.db');
const db = new DatabaseSync(dbPath);

// Enable foreign keys and WAL mode for high concurrency
db.exec('PRAGMA foreign_keys = ON;');

function initSchema() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS settings (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS nodes (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      zone TEXT NOT NULL,
      lat REAL NOT NULL,
      lng REAL NOT NULL,
      status TEXT NOT NULL,
      battery INTEGER NOT NULL,
      signal_rssi INTEGER NOT NULL,
      temperature REAL NOT NULL,
      humidity REAL NOT NULL,
      smoke_ppm REAL NOT NULL,
      pir_motion TEXT NOT NULL,
      mic_status TEXT NOT NULL,
      gateway_id TEXT NOT NULL,
      last_heartbeat TEXT NOT NULL,
      firmware_version TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS gateways (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      zone TEXT NOT NULL,
      lat REAL NOT NULL,
      lng REAL NOT NULL,
      status TEXT NOT NULL,
      frequency_mhz REAL NOT NULL,
      packets_received INTEGER NOT NULL,
      packets_lost INTEGER NOT NULL,
      snr_db REAL NOT NULL,
      uptime_hours REAL NOT NULL,
      last_communication TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS response_teams (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      leader TEXT NOT NULL,
      members_count INTEGER NOT NULL,
      contact TEXT NOT NULL,
      vehicle TEXT NOT NULL,
      equipment TEXT NOT NULL,
      current_lat REAL NOT NULL,
      current_lng REAL NOT NULL,
      status TEXT NOT NULL,
      assigned_incident_id TEXT,
      eta_minutes INTEGER,
      last_update TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS alerts (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      category TEXT NOT NULL,
      severity TEXT NOT NULL,
      source_node TEXT NOT NULL,
      detection_method TEXT NOT NULL,
      confidence REAL,
      lat REAL NOT NULL,
      lng REAL NOT NULL,
      timestamp TEXT NOT NULL,
      description TEXT NOT NULL,
      recommended_action TEXT NOT NULL,
      status TEXT NOT NULL,
      incident_id TEXT
    );

    CREATE TABLE IF NOT EXISTS incidents (
      id TEXT PRIMARY KEY,
      alert_id TEXT,
      title TEXT NOT NULL,
      category TEXT NOT NULL,
      severity TEXT NOT NULL,
      source_node TEXT NOT NULL,
      lat REAL NOT NULL,
      lng REAL NOT NULL,
      detection_timestamp TEXT NOT NULL,
      ai_classification TEXT,
      ai_confidence REAL,
      assigned_team_id TEXT,
      status TEXT NOT NULL,
      evidence_url TEXT,
      problem_identified TEXT,
      investigation_notes TEXT,
      action_taken TEXT,
      resources_used TEXT,
      resolution_summary TEXT,
      verified_by TEXT,
      final_outcome TEXT,
      closed_at TEXT,
      timeline TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS rfid_vehicles (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      tag_id TEXT NOT NULL,
      vehicle_reg TEXT NOT NULL,
      vehicle_type TEXT NOT NULL,
      checkpoint TEXT NOT NULL,
      entry_time TEXT NOT NULL,
      exit_time TEXT,
      status TEXT NOT NULL,
      personnel TEXT NOT NULL,
      purpose TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS dataset_records (
      id INTEGER PRIMARY KEY,
      filename TEXT NOT NULL,
      label TEXT NOT NULL,
      duration REAL NOT NULL,
      sample_rate INTEGER NOT NULL,
      channels INTEGER NOT NULL,
      split TEXT NOT NULL,
      snr_db REAL NOT NULL,
      is_demo INTEGER NOT NULL,
      source TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS sensor_telemetry_history (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      node_id TEXT NOT NULL,
      timestamp TEXT NOT NULL,
      temperature REAL NOT NULL,
      humidity REAL NOT NULL,
      smoke_ppm REAL NOT NULL,
      battery INTEGER NOT NULL,
      signal_rssi INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS virtual_pairing_sessions (
      id TEXT PRIMARY KEY,
      code TEXT NOT NULL,
      node_id TEXT NOT NULL,
      device_name TEXT,
      status TEXT NOT NULL,
      created_at TEXT NOT NULL,
      expires_at TEXT NOT NULL,
      ip_address TEXT,
      battery_level INTEGER,
      mic_status TEXT,
      streaming_status TEXT,
      lat REAL,
      lng REAL
    );

    CREATE TABLE IF NOT EXISTS virtual_audio_events (
      id TEXT PRIMARY KEY,
      node_id TEXT NOT NULL,
      audio_url TEXT NOT NULL,
      category TEXT NOT NULL,
      confidence REAL,
      risk_level TEXT,
      timestamp TEXT NOT NULL,
      rms_energy REAL,
      alert_id TEXT,
      incident_id TEXT,
      verified_status TEXT DEFAULT 'pending'
    );
  `);

  try {
    db.exec("ALTER TABLE nodes ADD COLUMN node_type TEXT DEFAULT 'physical_esp32'");
  } catch (e) {
    // column already exists
  }
}

initSchema();

module.exports = {
  db,
  initSchema
};

