const { db, initSchema } = require('./database');

function seedDatabase(force = false) {
  initSchema();

  const nodeCount = db.prepare('SELECT COUNT(*) as count FROM nodes').get().count;
  if (nodeCount > 0 && !force) {
    console.log(`Database already seeded (${nodeCount} nodes exist). Skipping initial seed.`);
    return;
  }

  console.log('Seeding Jungle Saathi database with realistic demonstration dataset...');

  // Clear existing
  db.exec(`
    DELETE FROM settings;
    DELETE FROM nodes;
    DELETE FROM gateways;
    DELETE FROM response_teams;
    DELETE FROM alerts;
    DELETE FROM incidents;
    DELETE FROM rfid_vehicles;
    DELETE FROM dataset_records;
    DELETE FROM sensor_telemetry_history;
  `);

  // 1. Settings
  const defaultSettings = [
    ['forest_name', 'Bandhavgarh-Kanha Wildlife Corridor Reserve'],
    ['forest_zone_count', '4 Zones (Core, Buffer, River, Ridge)'],
    ['center_lat', '29.5300'],
    ['center_lng', '78.7700'],
    ['smoke_threshold_ppm', '50'],
    ['temp_threshold_c', '42'],
    ['battery_low_threshold', '20'],
    ['heartbeat_timeout_sec', '90'],
    ['ai_confidence_threshold', '75'],
    ['sound_alert_enabled', 'true'],
    ['demo_mode', 'true'],
    ['gateway_frequency', '868.1 MHz LoRa EU/IN Band']
  ];

  const insertSetting = db.prepare('INSERT INTO settings (key, value) VALUES (?, ?)');
  for (const [k, v] of defaultSettings) {
    insertSetting.run(k, v);
  }

  // 2. Gateways (2 Gateways)
  const gateways = [
    {
      id: 'JS-GW-01',
      name: 'Ridge Tower Gateway Alpha',
      zone: 'North Ridge Lookout',
      lat: 29.5480,
      lng: 78.7620,
      status: 'online',
      frequency_mhz: 868.1,
      packets_received: 48920,
      packets_lost: 412,
      snr_db: 9.8,
      uptime_hours: 742.5,
      last_communication: new Date().toISOString()
    },
    {
      id: 'JS-GW-02',
      name: 'Ranger HQ Repeater Beta',
      zone: 'Southern Administrative Post',
      lat: 29.5120,
      lng: 78.7840,
      status: 'online',
      frequency_mhz: 868.3,
      packets_received: 52180,
      packets_lost: 388,
      snr_db: 11.2,
      uptime_hours: 890.1,
      last_communication: new Date().toISOString()
    }
  ];

  const insertGateway = db.prepare(`
    INSERT INTO gateways (id, name, zone, lat, lng, status, frequency_mhz, packets_received, packets_lost, snr_db, uptime_hours, last_communication)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  for (const g of gateways) {
    insertGateway.run(
      g.id, g.name, g.zone, g.lat, g.lng, g.status,
      g.frequency_mhz, g.packets_received, g.packets_lost,
      g.snr_db, g.uptime_hours, g.last_communication
    );
  }

  // 3. 12 ESP32 Nodes
  const nodes = [
    {
      id: 'JS-NODE-01',
      name: 'Sal Forest Deep Sentry',
      zone: 'Core Zone Alpha',
      lat: 29.5385,
      lng: 78.7610,
      status: 'online',
      battery: 88,
      signal_rssi: -72,
      temperature: 24.6,
      humidity: 68.2,
      smoke_ppm: 14.2,
      pir_motion: 'Clear',
      mic_status: 'active',
      gateway_id: 'JS-GW-01',
      last_heartbeat: new Date(Date.now() - 1000 * 25).toISOString(),
      firmware_version: 'v2.4.1-EdgeAI'
    },
    {
      id: 'JS-NODE-02',
      name: 'Bamboo Ridge Acoustic Node',
      zone: 'Core Zone Alpha',
      lat: 29.5440,
      lng: 78.7720,
      status: 'online',
      battery: 92,
      signal_rssi: -68,
      temperature: 23.8,
      humidity: 71.0,
      smoke_ppm: 12.0,
      pir_motion: 'Clear',
      mic_status: 'active',
      gateway_id: 'JS-GW-01',
      last_heartbeat: new Date(Date.now() - 1000 * 40).toISOString(),
      firmware_version: 'v2.4.1-EdgeAI'
    },
    {
      id: 'JS-NODE-03',
      name: 'Tiger Corridor Watcher 3',
      zone: 'Core Zone Alpha',
      lat: 29.5310,
      lng: 78.7550,
      status: 'online',
      battery: 84,
      signal_rssi: -78,
      temperature: 25.1,
      humidity: 66.5,
      smoke_ppm: 16.5,
      pir_motion: 'Clear',
      mic_status: 'active',
      gateway_id: 'JS-GW-01',
      last_heartbeat: new Date(Date.now() - 1000 * 15).toISOString(),
      firmware_version: 'v2.4.1-EdgeAI'
    },
    {
      id: 'JS-NODE-04',
      name: 'Buffer Border West Post',
      zone: 'Buffer Zone Beta',
      lat: 29.5220,
      lng: 78.7480,
      status: 'online',
      battery: 79,
      signal_rssi: -82,
      temperature: 26.4,
      humidity: 62.0,
      smoke_ppm: 18.1,
      pir_motion: 'Clear',
      mic_status: 'active',
      gateway_id: 'JS-GW-02',
      last_heartbeat: new Date(Date.now() - 1000 * 50).toISOString(),
      firmware_version: 'v2.4.1-EdgeAI'
    },
    {
      id: 'JS-NODE-05',
      name: 'Village Boundary Fence Sentry',
      zone: 'Buffer Zone Beta',
      lat: 29.5160,
      lng: 78.7650,
      status: 'warning',
      battery: 65,
      signal_rssi: -85,
      temperature: 38.5, // High temperature warning
      humidity: 48.0,
      smoke_ppm: 42.8, // Elevated smoke reading close to threshold
      pir_motion: 'Detected',
      mic_status: 'active',
      gateway_id: 'JS-GW-02',
      last_heartbeat: new Date(Date.now() - 1000 * 10).toISOString(),
      firmware_version: 'v2.4.1-EdgeAI'
    },
    {
      id: 'JS-NODE-06',
      name: 'Forest Nursery Weather Post',
      zone: 'Buffer Zone Beta',
      lat: 29.5080,
      lng: 78.7780,
      status: 'low_battery',
      battery: 16, // Low battery!
      signal_rssi: -89,
      temperature: 25.8,
      humidity: 64.0,
      smoke_ppm: 15.0,
      pir_motion: 'Clear',
      mic_status: 'standby',
      gateway_id: 'JS-GW-02',
      last_heartbeat: new Date(Date.now() - 1000 * 65).toISOString(),
      firmware_version: 'v2.3.9'
    },
    {
      id: 'JS-NODE-07',
      name: 'River Basin Elephant Crossing',
      zone: 'River Basin Corridor',
      lat: 29.5280,
      lng: 78.7820,
      status: 'online',
      battery: 95,
      signal_rssi: -64,
      temperature: 22.9,
      humidity: 82.5,
      smoke_ppm: 9.8,
      pir_motion: 'Clear',
      mic_status: 'active',
      gateway_id: 'JS-GW-02',
      last_heartbeat: new Date(Date.now() - 1000 * 18).toISOString(),
      firmware_version: 'v2.4.1-EdgeAI'
    },
    {
      id: 'JS-NODE-08',
      name: 'Ramganga Tributary Outpost',
      zone: 'River Basin Corridor',
      lat: 29.5360,
      lng: 78.7910,
      status: 'online',
      battery: 81,
      signal_rssi: -74,
      temperature: 23.4,
      humidity: 79.1,
      smoke_ppm: 11.4,
      pir_motion: 'Clear',
      mic_status: 'active',
      gateway_id: 'JS-GW-01',
      last_heartbeat: new Date(Date.now() - 1000 * 30).toISOString(),
      firmware_version: 'v2.4.1-EdgeAI'
    },
    {
      id: 'JS-NODE-09',
      name: 'Marshland Bio-Acoustic Sentry',
      zone: 'River Basin Corridor',
      lat: 29.5430,
      lng: 78.8020,
      status: 'online',
      battery: 76,
      signal_rssi: -80,
      temperature: 24.0,
      humidity: 85.0,
      smoke_ppm: 10.2,
      pir_motion: 'Clear',
      mic_status: 'active',
      gateway_id: 'JS-GW-01',
      last_heartbeat: new Date(Date.now() - 1000 * 45).toISOString(),
      firmware_version: 'v2.4.1-EdgeAI'
    },
    {
      id: 'JS-NODE-10',
      name: 'North Ridge Cliff Monitor',
      zone: 'Eco-Tourism Delta',
      lat: 29.5520,
      lng: 78.7760,
      status: 'online',
      battery: 89,
      signal_rssi: -66,
      temperature: 21.8,
      humidity: 60.5,
      smoke_ppm: 8.5,
      pir_motion: 'Clear',
      mic_status: 'active',
      gateway_id: 'JS-GW-01',
      last_heartbeat: new Date(Date.now() - 1000 * 20).toISOString(),
      firmware_version: 'v2.4.1-EdgeAI'
    },
    {
      id: 'JS-NODE-11',
      name: 'Safari Trail Junction 4',
      zone: 'Eco-Tourism Delta',
      lat: 29.5240,
      lng: 78.7690,
      status: 'online',
      battery: 87,
      signal_rssi: -71,
      temperature: 25.5,
      humidity: 63.8,
      smoke_ppm: 13.6,
      pir_motion: 'Clear',
      mic_status: 'active',
      gateway_id: 'JS-GW-02',
      last_heartbeat: new Date(Date.now() - 1000 * 35).toISOString(),
      firmware_version: 'v2.4.1-EdgeAI'
    },
    {
      id: 'JS-NODE-12',
      name: 'Canyon Watchpoint Unit',
      zone: 'Eco-Tourism Delta',
      lat: 29.5190,
      lng: 78.7950,
      status: 'maintenance',
      battery: 45,
      signal_rssi: -94,
      temperature: 24.2,
      humidity: 67.0,
      smoke_ppm: 14.0,
      pir_motion: 'Clear',
      mic_status: 'standby',
      gateway_id: 'JS-GW-02',
      last_heartbeat: new Date(Date.now() - 1000 * 120).toISOString(),
      firmware_version: 'v2.4.0'
    }
  ];

  const insertNode = db.prepare(`
    INSERT INTO nodes (id, name, zone, lat, lng, status, battery, signal_rssi, temperature, humidity, smoke_ppm, pir_motion, mic_status, gateway_id, last_heartbeat, firmware_version)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  for (const n of nodes) {
    insertNode.run(
      n.id, n.name, n.zone, n.lat, n.lng, n.status,
      n.battery, n.signal_rssi, n.temperature, n.humidity,
      n.smoke_ppm, n.pir_motion, n.mic_status, n.gateway_id,
      n.last_heartbeat, n.firmware_version
    );
  }

  // 4. Response Teams (5 Teams)
  const teams = [
    {
      id: 'TEAM-01',
      name: 'Wildlife Rescue Team Alpha',
      leader: 'Dr. Rajesh Verma (Sr. Wildlife Veterinarian)',
      members_count: 5,
      contact: '+91-98711-20451 / VHF Ch 4',
      vehicle: 'Rescue Gypsy 4x4 (UK-04-W-3821) with Hydraulic Winch & Stretcher',
      equipment: 'Tranquilizer Dart Gun, Animal Transport Cage, Vet Medical Kit, Thermal Binoculars',
      current_lat: 29.5290,
      current_lng: 78.7680,
      status: 'available',
      assigned_incident_id: null,
      eta_minutes: null,
      last_update: new Date().toISOString()
    },
    {
      id: 'TEAM-02',
      name: 'Forest Patrol Delta',
      leader: 'Ranger Ananya Sharma (Range Officer)',
      members_count: 6,
      contact: '+91-98711-40912 / VHF Ch 2',
      vehicle: 'Tactical Safari Cruiser (UK-04-P-1180)',
      equipment: 'Bodycams, GPS Navigators, Night-Vision Optics, VHF Repeaters, First Aid Pack',
      current_lat: 29.5350,
      current_lng: 78.7520,
      status: 'available',
      assigned_incident_id: null,
      eta_minutes: null,
      last_update: new Date().toISOString()
    },
    {
      id: 'TEAM-03',
      name: 'Rapid Fire Response Unit',
      leader: 'Captain Vikram Deshmukh (Fire Safety Officer)',
      members_count: 6,
      contact: '+91-98711-55823 / VHF Ch 1',
      vehicle: 'All-Terrain Water Tender 3500L (UK-04-F-8899)',
      equipment: 'High-Pressure Fire Pumps, Fire Beaters, Nomex Thermal Suits, Chainsaws, Drone Scout',
      current_lat: 29.5140,
      current_lng: 78.7800,
      status: 'available',
      assigned_incident_id: null,
      eta_minutes: null,
      last_update: new Date().toISOString()
    },
    {
      id: 'TEAM-04',
      name: 'Anti-Poaching Taskforce',
      leader: 'Inspector Tariq Khan (Special Task Unit)',
      members_count: 4,
      contact: '+91-98711-77319 / VHF Ch 3',
      vehicle: 'Stealth 4x4 Interceptor (UK-04-X-9002)',
      equipment: 'Acoustic Direction Finders, Forensic Evidence Kits, Drone with FLIR Camera',
      current_lat: 29.5460,
      current_lng: 78.7680,
      status: 'available',
      assigned_incident_id: null,
      eta_minutes: null,
      last_update: new Date().toISOString()
    },
    {
      id: 'TEAM-05',
      name: 'Technical Maintenance Squad',
      leader: 'Er. Suman Nair (IoT Infrastructure Lead)',
      members_count: 3,
      contact: '+91-98711-99201 / VHF Ch 5',
      vehicle: 'Field Utility Workshop Truck (UK-04-M-5512)',
      equipment: 'LiFePO4 Replacement Battery Banks, LoRa Antennas, ESP32 Modules, Solar Testing Kits',
      current_lat: 29.5180,
      current_lng: 78.7880,
      status: 'available',
      assigned_incident_id: null,
      eta_minutes: null,
      last_update: new Date().toISOString()
    }
  ];

  const insertTeam = db.prepare(`
    INSERT INTO response_teams (id, name, leader, members_count, contact, vehicle, equipment, current_lat, current_lng, status, assigned_incident_id, eta_minutes, last_update)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  for (const t of teams) {
    insertTeam.run(
      t.id, t.name, t.leader, t.members_count, t.contact,
      t.vehicle, t.equipment, t.current_lat, t.current_lng,
      t.status, t.assigned_incident_id, t.eta_minutes, t.last_update
    );
  }

  // 5. Initial Active & Historical Alerts (30 alerts)
  const alertCategories = [
    { cat: 'Chainsaw-like Sound', sev: 'high', method: 'Edge AI Acoustic CNN', desc: 'Acoustic pattern matched two-stroke combustion motor with cutting harmonics.' },
    { cat: 'Gunshot-like Sound', sev: 'critical', method: 'Edge AI Acoustic CNN', desc: 'Sharp acoustic impulse with fast rise-time and muzzle reverberation signature.' },
    { cat: 'Fire/Smoke', sev: 'critical', method: 'Smoke IoT Sensor', desc: 'Gas sensor detected sustained particulate concentration over 55 PPM with rapid temperature gradient.' },
    { cat: 'Animal Distress', sev: 'high', method: 'Edge AI Acoustic CNN', desc: 'Rapid distress vocalization pattern registered in high-density elephant sector.' },
    { cat: 'Wildlife Activity', sev: 'low', method: 'Edge AI Acoustic CNN', desc: 'Normal bioacoustic activity: Bengal Tiger vocalization recorded near watering stream.' },
    { cat: 'Human Intrusion', sev: 'medium', method: 'PIR Motion Trigger', desc: 'Dual PIR sensors detected unauthorized human presence in restricted Core Zone sector.' },
    { cat: 'Temperature Anomaly', sev: 'medium', method: 'Temperature Sensor', desc: 'Sudden 14°C ambient spike detected over 8 minutes.' },
    { cat: 'Node Failure', sev: 'medium', method: 'LoRa Heartbeat Monitor', desc: 'Heartbeat signal missed for 3 consecutive intervals; node flagged offline.' },
    { cat: 'Low Battery', sev: 'low', method: 'Battery Management System', desc: 'Node solar power bank level dropped below 18% reserve limit.' }
  ];

  const insertAlert = db.prepare(`
    INSERT INTO alerts (id, title, category, severity, source_node, detection_method, confidence, lat, lng, timestamp, description, recommended_action, status, incident_id)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  // Active Alert 1 (High priority chainsaw)
  insertAlert.run(
    'ALT-2026-001',
    'Suspected Chainsaw Acoustic Signature Detected',
    'Chainsaw-like Sound',
    'high',
    'JS-NODE-01',
    'Edge AI Acoustic CNN',
    94.2,
    29.5385,
    78.7610,
    new Date(Date.now() - 1000 * 60 * 12).toISOString(),
    'Acoustic pattern matched two-stroke combustion motor with continuous load harmonics in Core Zone Alpha.',
    'Dispatch nearest Forest Patrol Team to verify illegal timber felling and secure perimeter.',
    'new',
    null
  );

  // Active Alert 2 (Elevated smoke reading at Node 05)
  insertAlert.run(
    'ALT-2026-002',
    'Elevated Smoke & Thermal Rise Detected',
    'Fire/Smoke',
    'warning',
    'JS-NODE-05',
    'Smoke IoT Sensor',
    89.0,
    29.5160,
    78.7650,
    new Date(Date.now() - 1000 * 60 * 25).toISOString(),
    'Smoke density spiked to 42.8 PPM with temperature at 38.5°C near Village Boundary fence.',
    'Alert Rapid Fire Response Unit for preliminary reconnaissance.',
    'acknowledged',
    null
  );

  // Active Alert 3 (Node 06 low battery)
  insertAlert.run(
    'ALT-2026-003',
    'Sub-20% Battery Voltage Alert',
    'Low Battery',
    'low',
    'JS-NODE-06',
    'Battery Management System',
    99.0,
    29.5080,
    78.7780,
    new Date(Date.now() - 1000 * 60 * 45).toISOString(),
    'Node battery cell level dropped to 16%. Solar charging circuit efficiency reduced by canopy shade.',
    'Schedule Technical Maintenance Squad for solar panel cleaning and battery replacement.',
    'acknowledged',
    null
  );

  // Generate 27 historical alerts spread over the past 14 days
  for (let i = 4; i <= 30; i++) {
    const template = alertCategories[(i * 3) % alertCategories.length];
    const nodeObj = nodes[i % nodes.length];
    const hoursAgo = (i - 3) * 11 + (i % 7);
    const alertTime = new Date(Date.now() - hoursAgo * 3600 * 1000).toISOString();
    const isResolved = i > 6;
    const status = isResolved ? 'resolved' : (i % 2 === 0 ? 'under_investigation' : 'acknowledged');

    insertAlert.run(
      `ALT-2026-${String(i).padStart(3, '0')}`,
      `${template.cat} Recorded at ${nodeObj.name}`,
      template.cat,
      template.sev,
      nodeObj.id,
      template.method,
      template.method.includes('AI') ? 85.0 + ((i * 7) % 13) : null,
      nodeObj.lat + ((i % 5) - 2) * 0.001,
      nodeObj.lng + ((i % 4) - 2) * 0.001,
      alertTime,
      template.desc,
      'Standard operating procedure inspection by assigned forestry team.',
      status,
      isResolved ? `INC-2026-${String(i - 3).padStart(3, '0')}` : null
    );
  }

  // 6. Incidents (20 historical/active incidents with full lifecycle timelines)
  const insertIncident = db.prepare(`
    INSERT INTO incidents (id, alert_id, title, category, severity, source_node, lat, lng, detection_timestamp, ai_classification, ai_confidence, assigned_team_id, status, evidence_url, problem_identified, investigation_notes, action_taken, resources_used, resolution_summary, verified_by, final_outcome, closed_at, timeline)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const outcomes = [
    'Wildlife Safely Rescued',
    'Suspicious Activity Investigated',
    'Fire Controlled',
    'Human Intrusion Verified',
    'No Threat Found',
    'False Alarm',
    'Monitoring Node Repaired'
  ];

  for (let i = 1; i <= 20; i++) {
    const incId = `INC-2026-${String(i).padStart(3, '0')}`;
    const altId = `ALT-2026-${String(i + 3).padStart(3, '0')}`;
    const cat = alertCategories[i % alertCategories.length].cat;
    const sev = alertCategories[i % alertCategories.length].sev;
    const nodeObj = nodes[i % nodes.length];
    const teamObj = teams[i % teams.length];
    const hoursAgo = i * 16 + 2;
    const detectTime = new Date(Date.now() - hoursAgo * 3600 * 1000).toISOString();
    const outcome = outcomes[i % outcomes.length];
    const isClosed = i > 2;

    const timeline = JSON.stringify([
      { step: 'Alert Triggered', time: detectTime, note: `Edge node ${nodeObj.id} transmitted anomaly detection via LoRa.` },
      { step: 'Operator Acknowledged', time: new Date(new Date(detectTime).getTime() + 1000 * 180).toISOString(), note: 'Chief Ranger reviewed acoustic / sensor telemetry.' },
      { step: 'Team Dispatched', time: new Date(new Date(detectTime).getTime() + 1000 * 420).toISOString(), note: `${teamObj.name} deployed from station.` },
      { step: 'Team Arrived', time: new Date(new Date(detectTime).getTime() + 1000 * 1320).toISOString(), note: 'Team reached coordinate via patrol vehicle.' },
      { step: 'Investigation Conducted', time: new Date(new Date(detectTime).getTime() + 1000 * 2400).toISOString(), note: 'Perimeter secured and physical inspection performed.' },
      { step: 'Resolution Verified', time: new Date(new Date(detectTime).getTime() + 1000 * 3600).toISOString(), note: `Case closed with outcome: ${outcome}.` }
    ]);

    insertIncident.run(
      incId,
      altId,
      `${cat} Incident near ${nodeObj.name}`,
      cat,
      sev,
      nodeObj.id,
      nodeObj.lat,
      nodeObj.lng,
      detectTime,
      cat.includes('Sound') ? cat : null,
      cat.includes('Sound') ? 91.5 : null,
      teamObj.id,
      isClosed ? 'closed' : 'investigation_started',
      `/samples/${cat.toLowerCase().replace(/[^a-z]/g, '_')}.png`,
      `Anomaly confirmed in sector ${nodeObj.zone}. Corroborated with IoT sensor logs.`,
      `Field officers verified ground conditions within a 350m radius around node ${nodeObj.id}.`,
      `Necessary field mitigation and protective measures executed as per Tiger Reserve protocols.`,
      `${teamObj.vehicle}, 4 Officers, GPS Navigators, VHF radios.`,
      `Situation resolved safely. Forest integrity verified and logged in central repository.`,
      'Ranger Vikram Sen (Chief Conservator)',
      outcome,
      isClosed ? new Date(new Date(detectTime).getTime() + 1000 * 4200).toISOString() : null,
      timeline
    );
  }

  // 7. RFID Vehicle Monitoring Records (15 records)
  const insertRfid = db.prepare(`
    INSERT INTO rfid_vehicles (tag_id, vehicle_reg, vehicle_type, checkpoint, entry_time, exit_time, status, personnel, purpose)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const rfidRecords = [
    {
      tag_id: 'RFID-TAG-101',
      vehicle_reg: 'UK-04-GA-1042',
      vehicle_type: 'Forest Dept Gypsy',
      checkpoint: 'North Gate Checkpoint',
      entry_time: new Date(Date.now() - 1000 * 3600 * 2.5).toISOString(),
      exit_time: null,
      status: 'authorized',
      personnel: 'Ranger Ananya Sharma',
      purpose: 'Routine Boundary Perimeter Patrol'
    },
    {
      tag_id: 'RFID-TAG-102',
      vehicle_reg: 'UK-04-TR-4029',
      vehicle_type: 'Tourist Safari Vehicle',
      checkpoint: 'North Gate Checkpoint',
      entry_time: new Date(Date.now() - 1000 * 3600 * 4).toISOString(),
      exit_time: new Date(Date.now() - 1000 * 3600 * 1).toISOString(),
      status: 'authorized',
      personnel: 'Driver Manoj Bisht (Licensed Guide)',
      purpose: 'Permitted Eco-Safari Zone Delta'
    },
    {
      tag_id: 'RFID-TAG-103',
      vehicle_reg: 'UK-04-RV-9901',
      vehicle_type: 'Wildlife Research Van',
      checkpoint: 'River Bridge Post',
      entry_time: new Date(Date.now() - 1000 * 3600 * 6).toISOString(),
      exit_time: null,
      status: 'authorized',
      personnel: 'Dr. Rajesh Verma (Wildlife Institute)',
      purpose: 'Camera Trap Battery Replacements'
    },
    {
      tag_id: 'RFID-TAG-999-UNAUTH',
      vehicle_reg: 'UP-14-BT-0077',
      vehicle_type: 'Unregistered Mahindra Pickup',
      checkpoint: 'South Boundary Gate',
      entry_time: new Date(Date.now() - 1000 * 60 * 32).toISOString(),
      exit_time: null,
      status: 'unauthorized_breach',
      personnel: 'Unverified Civilian Occupants',
      purpose: 'Illegal Entry Attempt Detected by RFID Antenna'
    },
    {
      tag_id: 'RFID-TAG-104',
      vehicle_reg: 'UK-04-FT-3321',
      vehicle_type: 'Fire Tender Truck',
      checkpoint: 'South Boundary Gate',
      entry_time: new Date(Date.now() - 1000 * 3600 * 22).toISOString(),
      exit_time: new Date(Date.now() - 1000 * 3600 * 20).toISOString(),
      status: 'authorized',
      personnel: 'Capt Vikram Deshmukh',
      purpose: 'Controlled Burn Prevention Inspection'
    }
  ];

  for (const r of rfidRecords) {
    insertRfid.run(
      r.tag_id, r.vehicle_reg, r.vehicle_type, r.checkpoint,
      r.entry_time, r.exit_time, r.status, r.personnel, r.purpose
    );
  }

  // 8. 438 Audio Dataset Records for Model Training Studio
  const soundClasses = [
    'Bird Calls',
    'Animal Calls',
    'Elephant Sounds',
    'Tiger/Roaring Sounds',
    'Human Speech',
    'Human Shouting/Distress Calls',
    'Chainsaw-like Sounds',
    'Gunshot-like Sounds',
    'Vehicle Engine Sounds',
    'Fire Crackling',
    'Unknown/Suspicious Sounds'
  ];

  const insertDatasetRecord = db.prepare(`
    INSERT INTO dataset_records (id, filename, label, duration, sample_rate, channels, split, snr_db, is_demo, source)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  let recordId = 1;
  const totalTargetRecords = 438;
  const baseCountPerClass = Math.floor(totalTargetRecords / soundClasses.length);
  const remainder = totalTargetRecords % soundClasses.length;

  for (let cIdx = 0; cIdx < soundClasses.length; cIdx++) {
    const label = soundClasses[cIdx];
    const classCount = baseCountPerClass + (cIdx < remainder ? 1 : 0);

    for (let j = 1; j <= classCount; j++) {
      // 70% train, 15% val, 15% test
      let split = 'train';
      const pct = (j / classCount) * 100;
      if (pct > 85) split = 'test';
      else if (pct > 70) split = 'val';

      const cleanLabel = label.toLowerCase().replace(/[^a-z]/g, '_').substring(0, 15);
      const filename = `${cleanLabel}_${String(j).padStart(3, '0')}.wav`;
      const snr = Number((14.0 + (Math.sin(j * 0.7) * 8.5)).toFixed(1));

      insertDatasetRecord.run(
        recordId,
        filename,
        label,
        3.5,
        22050,
        1,
        split,
        snr,
        1,
        j <= 5 ? 'Acoustic Array Station 1' : 'Historical Sanctuary Dataset 2025'
      );
      recordId++;
    }
  }

  // 9. Sensor Telemetry History (Hourly points over past 24 hours for all 12 nodes)
  const insertHistory = db.prepare(`
    INSERT INTO sensor_telemetry_history (node_id, timestamp, temperature, humidity, smoke_ppm, battery, signal_rssi)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);

  for (const n of nodes) {
    for (let h = 24; h >= 0; h--) {
      const time = new Date(Date.now() - h * 3600 * 1000).toISOString();
      const tempVariation = Math.sin((24 - h) / 3.8) * 4.0;
      const humVariation = -Math.sin((24 - h) / 3.8) * 7.0;
      const smokeVariation = (h === 0 && n.status === 'warning') ? 30 : Math.sin(h * 1.5) * 3;

      insertHistory.run(
        n.id,
        time,
        Number((n.temperature + tempVariation).toFixed(1)),
        Number((Math.min(99, Math.max(30, n.humidity + humVariation))).toFixed(1)),
        Number((Math.max(5, n.smoke_ppm + smokeVariation)).toFixed(1)),
        Math.max(10, Math.min(100, Math.round(n.battery - (h * 0.15)))),
        n.signal_rssi + (h % 3)
      );
    }
  }

  console.log(`Database successfully seeded:`);
  console.log(`- 12 ESP32 Monitoring Nodes`);
  console.log(`- 2 LoRa Gateways`);
  console.log(`- 5 Emergency Response Teams`);
  console.log(`- 30 Alerts (Active & Historical)`);
  console.log(`- 20 Incidents with full lifecycle timelines`);
  console.log(`- 438 Audio Dataset Records across 11 sound classes`);
  console.log(`- 25 Telemetry history snapshots per node`);
  console.log(`- 5 RFID Checkpoint Records`);
}

module.exports = {
  seedDatabase
};

if (require.main === module) {
  seedDatabase(true);
}

