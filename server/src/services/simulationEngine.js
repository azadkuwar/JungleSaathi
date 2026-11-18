const { db } = require('../db/database');
const { broadcast } = require('./socketService');

let activeSimulation = null;
let simulationInterval = null;

const SCENARIOS = {
  'chainsaw_poaching': {
    id: 'chainsaw_poaching',
    name: 'Suspicious Forest Activity (Illegal Logging & Chainsaw)',
    category: 'Chainsaw-like Sound',
    nodeId: 'JS-NODE-01',
    teamId: 'TEAM-02',
    targetLat: 29.5385,
    targetLng: 78.7610,
    steps: [
      { step: 1, title: 'Acoustic Sensor Triggered', desc: 'Monitoring node JS-NODE-01 microphone detects high-frequency mechanical vibration.', module: 'IoT Nodes' },
      { step: 2, title: 'Edge AI Classification', desc: 'Lightweight MobileNet CNN on ESP32 classifies audio as "Chainsaw-like Sound" (Confidence: 94.2%).', module: 'AI Audio' },
      { step: 3, title: 'GPS Geotagging Attached', desc: 'Node coordinates (29.5385° N, 78.7610° E) in Core Zone Alpha attached to transmission packet.', module: 'GIS Engine' },
      { step: 4, title: 'LoRa Packet Relayed', desc: 'LoRa Gateway JS-GW-01 receives packet at 868.1 MHz and relays payload via 4G backhaul to server.', module: 'LoRa Gateways' },
      { step: 5, title: 'High-Severity Alert Generated', desc: 'Central Engine receives packet; creates Alert ALT-SIM-CH1 with HIGH severity.', module: 'Alerts' },
      { step: 6, title: 'Command Notification Triggered', desc: 'Visual banner and acoustic alert chime displayed on Central Command Dashboard.', module: 'Dashboard' },
      { step: 7, title: 'Incident Plotted on Forest Map', desc: 'Incident marker positioned on Live Forest Map with pulsating danger perimeter.', module: 'Live Map' },
      { step: 8, title: 'Operator Acknowledgment', desc: 'Command Operator reviews spectral signature and acknowledges emergency alert.', module: 'Alerts' },
      { step: 9, title: 'Automated Team Recommendation', desc: 'Haversine GIS engine recommends Forest Patrol Delta (TEAM-02) as nearest capable unit (1.8 km).', module: 'Team Dispatch' },
      { step: 10, title: 'Patrol Team Dispatched', desc: 'Operator approves dispatch order. Mobilization alert sent to Ranger Ananya Sharma.', module: 'Team Dispatch' },
      { step: 11, title: 'Team En Route', desc: 'Forest Patrol Delta departs station aboard Safari Cruiser UK-04-P-1180; status changed to En Route.', module: 'Team Dispatch' },
      { step: 12, title: 'Live GPS Route Tracking', desc: 'Patrol cruiser coordinates update live on GIS map tracking along forest firebreak track.', module: 'Live Map' },
      { step: 13, title: 'Team Arrives at Location', desc: 'Forest Patrol Delta arrives at Sal Forest Deep Sentry perimeter. Status: Arrived.', module: 'Incident Resolution' },
      { step: 14, title: 'Perimeter Investigation Begun', desc: 'Rangers initiate tactical cordon and deploy night-vision optics. Fresh tire marks located.', module: 'Incident Resolution' },
      { step: 15, title: 'Problem Identified & Evidence Logged', desc: 'Two illegal timber fellers intercepted with motorized chainsaw and teak logs. Photographic evidence recorded.', module: 'Incident Resolution' },
      { step: 16, title: 'Action Taken & Resolution Filed', desc: 'Suspects detained under Wildlife Protection Act. Chainsaw seized and incident report compiled.', module: 'Incident Resolution' },
      { step: 17, title: 'Chief Ranger Verification', desc: 'Chief Conservator Ranger Vikram Sen audits filed report, logs and evidence dossier.', module: 'Incident Resolution' },
      { step: 18, title: 'Incident Marked Resolved', desc: 'Incident INC-SIM-CH1 marked Resolved and archived in legal enforcement registry.', module: 'Alerts' },
      { step: 19, title: 'Command KPIs Updated', desc: 'Dashboard metrics update automatically: Active Alerts -1, Resolved Incidents +1.', module: 'Dashboard' },
      { step: 20, title: 'Team Returned to Available', desc: 'Forest Patrol Delta returns to base. Status reset to Available for next deployment.', module: 'Team Dispatch' }
    ]
  },
  'forest_fire': {
    id: 'forest_fire',
    name: 'Rapid Forest Fire Outbreak',
    category: 'Fire/Smoke',
    nodeId: 'JS-NODE-05',
    teamId: 'TEAM-03',
    targetLat: 29.5160,
    targetLng: 78.7650,
    steps: [
      { step: 1, title: 'Smoke Sensor Threshold Spike', desc: 'Gas sensor on JS-NODE-05 detects 78 PPM smoke density with 43.5°C thermal rise.', module: 'IoT Nodes' },
      { step: 2, title: 'Audio Crackle Corroboration', desc: 'Acoustic microphone records timber flame crackle; multi-sensor fusion triggers CRITICAL alert.', module: 'AI Audio' },
      { step: 3, title: 'Gateway Relay & Geotag', desc: 'Transmitted via LoRa Gateway JS-GW-02 from Village Boundary sector.', module: 'LoRa Gateways' },
      { step: 4, title: 'Critical Alert Generated', desc: 'Alert ALT-SIM-FIRE created with CRITICAL severity level.', module: 'Alerts' },
      { step: 5, title: 'Fire Unit Mobilized', desc: 'Rapid Fire Response Unit (TEAM-03) dispatched with 3500L All-Terrain Water Tender.', module: 'Team Dispatch' },
      { step: 6, title: 'GPS En-Route Tracking', desc: 'Water tender advances rapidly towards Southern Village boundary track.', module: 'Live Map' },
      { step: 7, title: 'Arrival & Containment', desc: 'Fire crew deploys high-pressure hoses and cuts firebreak trench.', module: 'Incident Resolution' },
      { step: 8, title: 'Fire Controlled & Cool Down', desc: 'Dry brush fire extinguished before reaching canopy. Thermal imaging confirms no embers.', module: 'Incident Resolution' },
      { step: 9, title: 'Resolution Verification', desc: 'Chief Conservator verifies containment report. Incident marked Resolved.', module: 'Incident Resolution' },
      { step: 10, title: 'Team Available & Stats Updated', desc: 'TEAM-03 replenished and available. Dashboard stats updated.', module: 'Dashboard' }
    ]
  },
  'animal_distress': {
    id: 'animal_distress',
    name: 'Endangered Wildlife in Distress',
    category: 'Animal Distress',
    nodeId: 'JS-NODE-07',
    teamId: 'TEAM-01',
    targetLat: 29.5280,
    targetLng: 78.7820,
    steps: [
      { step: 1, title: 'Distress Vocalization Detected', desc: 'JS-NODE-07 microphone captures agitated high-amplitude elephant distress trumpeting.', module: 'IoT Nodes' },
      { step: 2, title: 'AI Bioacoustic Classifier', desc: 'CNN acoustic model flags "Elephant Distress / Agitation" with 93.8% confidence.', module: 'AI Audio' },
      { step: 3, title: 'Alert Escalated to High', desc: 'System generates alert ALT-SIM-WLD for Elephant River Crossing sector.', module: 'Alerts' },
      { step: 4, title: 'Wildlife Rescue Team Alpha Dispatched', desc: 'Dr. Rajesh Verma mobilized with veterinary rescue gypsy and tranquilizer equipment.', module: 'Team Dispatch' },
      { step: 5, title: 'Field Navigation & Arrival', desc: 'Rescue unit navigates to Ramganga river tributary bank.', module: 'Live Map' },
      { step: 6, title: 'Juvenile Elephant Assisted', desc: 'Juvenile elephant trapped in muddy ravine winched to safety. Minor leg scrape treated.', module: 'Incident Resolution' },
      { step: 7, title: 'Herd Reunited & Resolution', desc: 'Calf safely rejoined breeding herd. Resolution report certified by Dr. Verma.', module: 'Incident Resolution' }
    ]
  },
  'node_failure': {
    id: 'node_failure',
    name: 'IoT Node Heartbeat Lost & Hardware Repair',
    category: 'Node Failure',
    nodeId: 'JS-NODE-12',
    teamId: 'TEAM-05',
    targetLat: 29.5190,
    targetLng: 78.7950,
    steps: [
      { step: 1, title: 'Heartbeat Timeout Detected', desc: 'Node JS-NODE-12 missed 3 consecutive keep-alive intervals (>180s silence).', module: 'IoT Nodes' },
      { step: 2, title: 'Node Flagged Offline', desc: 'System automatically transitions node status to OFFLINE and flags hardware fault.', module: 'IoT Nodes' },
      { step: 3, title: 'Maintenance Alert Generated', desc: 'Alert ALT-SIM-NODE generated: Node Communication Outage.', module: 'Alerts' },
      { step: 4, title: 'Technical Squad Dispatched', desc: 'Technical Maintenance Squad (TEAM-05) mobilized with field utility workshop.', module: 'Team Dispatch' },
      { step: 5, title: 'En Route to Canyon Watchpoint', desc: 'Mobile workshop vehicle tracks towards Canyon Watchpoint Unit.', module: 'Live Map' },
      { step: 6, title: 'Hardware Diagnosis & Antenna Replacement', desc: 'Technicians replace damaged LoRa whip antenna and faulty solar charge regulator.', module: 'Incident Resolution' },
      { step: 7, title: 'Node Restored Online', desc: 'Heartbeat signal successfully restored at -68 dBm. Incident resolved.', module: 'IoT Nodes' }
    ]
  }
};

function executeStep(sim) {
  const scenario = SCENARIOS[sim.scenarioId];
  if (!scenario || sim.currentStep >= scenario.steps.length) {
    stopSimulation();
    return;
  }

  sim.currentStep++;
  const stepInfo = scenario.steps[sim.currentStep - 1];
  sim.currentStepInfo = stepInfo;
  sim.logs.push({
    step: sim.currentStep,
    time: new Date().toISOString(),
    title: stepInfo.title,
    desc: stepInfo.desc,
    module: stepInfo.module
  });

  // Apply state mutations to database depending on current step
  const now = new Date().toISOString();

  // Step logic for chainsaw_poaching
  if (sim.scenarioId === 'chainsaw_poaching') {
    if (sim.currentStep === 5) {
      // Create high-severity alert in DB
      try {
        db.prepare(`
          INSERT OR REPLACE INTO alerts (id, title, category, severity, source_node, detection_method, confidence, lat, lng, timestamp, description, recommended_action, status, incident_id)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `).run(
          'ALT-SIM-CH1',
          'LIVE SIMULATION: Chainsaw Acoustic Signature Detected',
          'Chainsaw-like Sound',
          'high',
          scenario.nodeId,
          'Edge AI Acoustic CNN',
          94.2,
          scenario.targetLat,
          scenario.targetLng,
          now,
          'Acoustic pattern matched two-stroke combustion motor with continuous load harmonics.',
          'Dispatch nearest Forest Patrol Team to verify illegal timber felling.',
          'new',
          'INC-SIM-CH1'
        );

        db.prepare(`
          INSERT OR REPLACE INTO incidents (id, alert_id, title, category, severity, source_node, lat, lng, detection_timestamp, ai_classification, ai_confidence, assigned_team_id, status, evidence_url, problem_identified, investigation_notes, action_taken, resources_used, resolution_summary, verified_by, final_outcome, closed_at, timeline)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `).run(
          'INC-SIM-CH1',
          'ALT-SIM-CH1',
          'EMERGENCY: Suspected Illegal Logging in Core Zone Alpha',
          'Chainsaw-like Sound',
          'high',
          scenario.nodeId,
          scenario.targetLat,
          scenario.targetLng,
          now,
          'Chainsaw-like Sounds',
          94.2,
          null,
          'new',
          '/samples/chainsaw_sound.wav',
          'Unidentified acoustic anomaly recorded.',
          'Awaiting field team dispatch.',
          'None yet.',
          'Pending.',
          'Pending investigation.',
          null,
          null,
          null,
          JSON.stringify([{ step: 'Alert Generated', time: now, note: 'AI acoustic detection' }])
        );
      } catch (e) {
        console.error('Error inserting sim alert/incident:', e.message);
      }
    }

    if (sim.currentStep === 8) {
      // Operator Acknowledges
      db.prepare("UPDATE alerts SET status = 'acknowledged' WHERE id = 'ALT-SIM-CH1'").run();
      db.prepare("UPDATE incidents SET status = 'acknowledged' WHERE id = 'INC-SIM-CH1'").run();
    }

    if (sim.currentStep === 10) {
      // Dispatch team
      db.prepare(`
        UPDATE response_teams
        SET status = 'dispatched', assigned_incident_id = 'INC-SIM-CH1', eta_minutes = 6, last_update = ?
        WHERE id = ?
      `).run(now, scenario.teamId);

      db.prepare(`
        UPDATE incidents
        SET assigned_team_id = ?, status = 'team_dispatched'
        WHERE id = 'INC-SIM-CH1'
      `).run(scenario.teamId);
    }

    if (sim.currentStep === 11) {
      db.prepare(`
        UPDATE response_teams
        SET status = 'en_route', eta_minutes = 4, last_update = ?
        WHERE id = ?
      `).run(now, scenario.teamId);
    }

    // Move team along path
    if (sim.currentStep >= 11 && sim.currentStep <= 13) {
      // Interpolate coordinates from team starting point towards target
      const teamStartLat = 29.5350;
      const teamStartLng = 78.7520;
      const fraction = (sim.currentStep - 10) / 3.0;
      const currentLat = teamStartLat + (scenario.targetLat - teamStartLat) * fraction;
      const currentLng = teamStartLng + (scenario.targetLng - teamStartLng) * fraction;

      db.prepare(`
        UPDATE response_teams
        SET current_lat = ?, current_lng = ?, last_update = ?
        WHERE id = ?
      `).run(currentLat, currentLng, now, scenario.teamId);
    }

    if (sim.currentStep === 13) {
      db.prepare(`
        UPDATE response_teams
        SET status = 'arrived', eta_minutes = 0, last_update = ?
        WHERE id = ?
      `).run(now, scenario.teamId);

      db.prepare(`
        UPDATE incidents
        SET status = 'team_arrived'
        WHERE id = 'INC-SIM-CH1'
      `).run();
    }

    if (sim.currentStep === 15) {
      db.prepare(`
        UPDATE incidents
        SET status = 'problem_identified',
            problem_identified = 'Two illegal loggers intercepted with Stihl 070 chainsaw and felled teak logs.',
            investigation_notes = 'Perimeter cordoned. Handheld thermal camera identified suspect vehicle 200m north.'
        WHERE id = 'INC-SIM-CH1'
      `).run();
    }

    if (sim.currentStep === 16) {
      db.prepare(`
        UPDATE incidents
        SET status = 'action_taken',
            action_taken = 'Suspects apprehended, chainsaw and timber impounded. Perimeter secured.',
            resources_used = 'Safari Cruiser UK-04-P-1180, 6 Rangers, Bodycams, Handcuffs.'
        WHERE id = 'INC-SIM-CH1'
      `).run();
    }

    if (sim.currentStep === 18) {
      db.prepare(`
        UPDATE incidents
        SET status = 'closed',
            final_outcome = 'Suspicious Activity Investigated',
            resolution_summary = 'Illegal logging threat successfully neutralized. Perpetrators remanded to custody.',
            verified_by = 'Ranger Vikram Sen (Chief Conservator)',
            closed_at = ?
        WHERE id = 'INC-SIM-CH1'
      `).run(now);

      db.prepare(`
        UPDATE alerts
        SET status = 'resolved'
        WHERE id = 'ALT-SIM-CH1'
      `).run();
    }

    if (sim.currentStep === 20) {
      db.prepare(`
        UPDATE response_teams
        SET status = 'available', assigned_incident_id = null, eta_minutes = null, current_lat = 29.5350, current_lng = 78.7520, last_update = ?
        WHERE id = ?
      `).run(now, scenario.teamId);
    }
  }

  // Broadcast step to all connected clients
  broadcast('SIMULATION_STEP', {
    scenarioId: sim.scenarioId,
    scenarioName: scenario.name,
    currentStep: sim.currentStep,
    totalSteps: scenario.steps.length,
    stepInfo,
    logs: sim.logs
  });

  if (sim.currentStep >= scenario.steps.length) {
    stopSimulation();
  }
}

function startSimulation(scenarioId = 'chainsaw_poaching', autoPlay = true, intervalMs = 2500) {
  stopSimulation();

  const scenario = SCENARIOS[scenarioId] || SCENARIOS['chainsaw_poaching'];

  activeSimulation = {
    scenarioId: scenario.id,
    currentStep: 0,
    totalSteps: scenario.steps.length,
    autoPlay,
    intervalMs,
    startTime: new Date().toISOString(),
    logs: []
  };

  // Run step 1 immediately
  executeStep(activeSimulation);

  if (autoPlay) {
    simulationInterval = setInterval(() => {
      if (activeSimulation) {
        executeStep(activeSimulation);
      }
    }, intervalMs);
  }

  return getSimulationState();
}

function stopSimulation() {
  if (simulationInterval) {
    clearInterval(simulationInterval);
    simulationInterval = null;
  }
}

function stepForward() {
  if (!activeSimulation) {
    startSimulation('chainsaw_poaching', false);
    return getSimulationState();
  }
  executeStep(activeSimulation);
  return getSimulationState();
}

function resetSimulation() {
  stopSimulation();
  activeSimulation = null;
  // Reset any simulation temporary records or restore teams to available
  try {
    db.prepare("UPDATE response_teams SET status = 'available', assigned_incident_id = null, eta_minutes = null WHERE status != 'available'").run();
  } catch (e) {}

  broadcast('SIMULATION_RESET', { message: 'Simulation reset to baseline' });
  return { status: 'idle', activeSimulation: null };
}

function getSimulationState() {
  if (!activeSimulation) {
    return {
      isActive: false,
      scenarioId: null,
      currentStep: 0,
      totalSteps: 0,
      stepInfo: null,
      logs: []
    };
  }
  const scenario = SCENARIOS[activeSimulation.scenarioId];
  return {
    isActive: true,
    scenarioId: activeSimulation.scenarioId,
    scenarioName: scenario ? scenario.name : '',
    currentStep: activeSimulation.currentStep,
    totalSteps: scenario ? scenario.steps.length : 0,
    stepInfo: activeSimulation.currentStepInfo,
    logs: activeSimulation.logs
  };
}

module.exports = {
  SCENARIOS,
  startSimulation,
  stopSimulation,
  stepForward,
  resetSimulation,
  getSimulationState
};

