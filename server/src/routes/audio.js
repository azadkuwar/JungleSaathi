const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('node:path');
const fs = require('node:fs');
const { classifyAudio, CLASS_PROFILES } = require('../services/soundClassifier');
const { db } = require('../db/database');
const { broadcast } = require('../services/socketService');

// Multer storage for uploaded audio files
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, '..', '..', 'public', 'uploads');
    fs.makedirs ? fs.makedirs(uploadDir) : fs.mkdirSync(uploadDir, { recursive: true });
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'audio-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB
});

// GET list of demonstration audio samples
router.get('/samples', (req, res) => {
  const samples = [
    { id: 'bird', name: 'Bird Calls', file: 'bird_calls.wav', risk: 'Normal', category: 'Bird Calls', desc: 'High frequency canopy whistling chirps' },
    { id: 'chainsaw', name: 'Chainsaw Sound', file: 'chainsaw_sound.wav', risk: 'Critical', category: 'Chainsaw-like Sounds', desc: 'Two-stroke high rpm motor cutting noise' },
    { id: 'gunshot', name: 'Gunshot Muzzle Blast', file: 'gunshot_sound.wav', risk: 'Critical', category: 'Gunshot-like Sounds', desc: 'Sharp acoustic impulse and reverberation' },
    { id: 'tiger', name: 'Bengal Tiger Roar', file: 'tiger_roar.wav', risk: 'Low', category: 'Tiger/Roaring Sounds', desc: 'Low guttural territorial roar and growl' },
    { id: 'elephant', name: 'Elephant Sounds', file: 'elephant_sounds.wav', risk: 'Low', category: 'Elephant Sounds', desc: 'Brassy resonant trumpet & infrasound rumble' },
    { id: 'speech', name: 'Human Speech', file: 'human_speech.wav', risk: 'Medium', category: 'Human Speech', desc: 'Conversational formant patterns in restricted zone' },
    { id: 'shout', name: 'Human Shouting/Distress', file: 'human_shouting.wav', risk: 'High', category: 'Human Shouting/Distress Calls', desc: 'Urgent vocal distress and call for help' },
    { id: 'vehicle', name: 'Vehicle Engine', file: 'vehicle_engine.wav', risk: 'Medium', category: 'Vehicle Engine Sounds', desc: 'Low-frequency diesel engine rumble' },
    { id: 'fire', name: 'Fire Crackling', file: 'fire_crackling.wav', risk: 'Critical', category: 'Fire Crackling', desc: 'Combustion snap transients & flame hiss' },
    { id: 'animal', name: 'Animal Calls', file: 'animal_calls.wav', risk: 'Normal', category: 'Animal Calls', desc: 'Mid-range alarm calls and chatter' },
    { id: 'unknown', name: 'Unknown/Suspicious', file: 'unknown_suspicious.wav', risk: 'Medium', category: 'Unknown/Suspicious Sounds', desc: 'Stealth footsteps and metallic clinks' }
  ];

  res.json({
    success: true,
    data: samples.map(s => ({
      ...s,
      url: `/samples/${s.file}`
    }))
  });
});

// POST classify audio file or sample
router.post('/classify', upload.single('audio'), (req, res) => {
  try {
    const sampleName = req.body.sampleName;
    const nodeId = req.body.nodeId || 'JS-NODE-01';

    let filename = '';
    let buffer = null;

    if (req.file) {
      filename = req.file.originalname;
      buffer = fs.readFileSync(req.file.path);
    } else if (sampleName) {
      filename = sampleName;
    } else {
      filename = 'chainsaw_sound.wav';
    }

    const result = classifyAudio({ filename, buffer, sampleName });

    // Lookup node coordinates
    const node = db.prepare('SELECT id, name, zone, lat, lng FROM nodes WHERE id = ?').get(nodeId) || {
      id: nodeId,
      name: 'Sal Forest Deep Sentry',
      zone: 'Core Zone Alpha',
      lat: 29.5385,
      lng: 78.7610
    };

    res.json({
      success: true,
      data: {
        ...result,
        node,
        audioUrl: req.file ? `/uploads/${req.file.filename}` : `/samples/${sampleName || 'chainsaw_sound.wav'}`
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST create incident from AI detection
router.post('/create-incident-from-detection', (req, res) => {
  try {
    const {
      classification, confidence, riskLevel,
      nodeId, lat, lng, audioUrl, notes
    } = req.body;

    const count = db.prepare('SELECT COUNT(*) as c FROM incidents').get().c;
    const alertCount = db.prepare('SELECT COUNT(*) as c FROM alerts').get().c;
    const incidentId = `INC-2026-${String(count + 1).padStart(3, '0')}`;
    const alertId = `ALT-2026-${String(alertCount + 1).padStart(3, '0')}`;
    const now = new Date().toISOString();

    const sevMap = {
      'Critical': 'critical',
      'High': 'high',
      'Medium': 'medium',
      'Low': 'low',
      'Normal': 'low'
    };
    const severity = sevMap[riskLevel] || 'medium';

    // 1. Create alert
    db.prepare(`
      INSERT INTO alerts (id, title, category, severity, source_node, detection_method, confidence, lat, lng, timestamp, description, recommended_action, status, incident_id)
      VALUES (?, ?, ?, ?, ?, 'Edge AI Sound Recognition', ?, ?, ?, ?, ?, ?, 'under_investigation', ?)
    `).run(
      alertId,
      `AI Detection: ${classification} (${confidence}%)`,
      classification,
      severity,
      nodeId,
      confidence,
      lat,
      lng,
      now,
      `Acoustic classification identified ${classification} with ${confidence}% confidence score at node ${nodeId}.`,
      CLASS_PROFILES[classification]?.recommendation || 'Dispatch nearest forestry unit.',
      incidentId
    );

    // 2. Create incident
    const timeline = JSON.stringify([
      { step: 'Acoustic AI Detection', time: now, note: `Model identified ${classification} with ${confidence}% confidence.` },
      { step: 'Incident Created', time: now, note: `Created from AI Sound Recognition module.` }
    ]);

    db.prepare(`
      INSERT INTO incidents (id, alert_id, title, category, severity, source_node, lat, lng, detection_timestamp, ai_classification, ai_confidence, assigned_team_id, status, evidence_url, problem_identified, investigation_notes, action_taken, resources_used, resolution_summary, verified_by, final_outcome, closed_at, timeline)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, null, 'investigation_started', ?, ?, ?, 'Pending field team assignment.', 'Awaiting patrol dispatch.', null, null, null, null, ?)
    `).run(
      incidentId,
      alertId,
      `AI Verified: ${classification} at ${nodeId}`,
      classification,
      severity,
      nodeId,
      lat,
      lng,
      now,
      classification,
      confidence,
      audioUrl || null,
      `Suspected ${classification} requiring ground confirmation.`,
      notes || 'Acoustic waveform and Mel spectrogram recorded.',
      timeline
    );

    const createdAlert = db.prepare('SELECT * FROM alerts WHERE id = ?').get(alertId);
    const createdIncident = db.prepare('SELECT * FROM incidents WHERE id = ?').get(incidentId);

    broadcast('ALERT_CREATED', createdAlert);
    broadcast('INCIDENT_CREATED', createdIncident);

    res.status(201).json({
      success: true,
      message: 'Emergency Incident created from AI Detection.',
      data: { alert: createdAlert, incident: createdIncident }
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;

