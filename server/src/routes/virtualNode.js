const express = require('express');
const router = express.Router();
const os = require('node:os');
const path = require('node:path');
const fs = require('node:fs');
const multer = require('multer');
const { db } = require('../db/database');
const { broadcast } = require('../services/socketService');
const { classifyAudio, CLASS_PROFILES } = require('../services/soundClassifier');
const tunnelService = require('../services/tunnelService');

// Multer storage for smartphone audio clips
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, '..', '..', 'public', 'uploads');
    fs.mkdirSync(uploadDir, { recursive: true });
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname) || '.webm';
    const unique = Date.now() + '-' + Math.round(Math.random() * 1E6);
    cb(null, `virt-audio-${unique}${ext}`);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 15 * 1024 * 1024 } // 15MB
});

// Helper to determine Local Network IPv4 Address
function getLocalIpAddress() {
  const ifaces = os.networkInterfaces();
  for (const name in ifaces) {
    for (const net of ifaces[name]) {
      if (net.family === 'IPv4' && !net.internal) {
        return net.address;
      }
    }
  }
  return 'localhost';
}

// GET virtual node info & local pairing address
router.get('/info', (req, res) => {
  try {
    const localIp = getLocalIpAddress();
    const port = process.env.PORT || 5000;
    const tunnel = tunnelService.getStatus();
    const tunnelUrl = tunnelService.getTunnelUrl();

    // Get active pairing session if any
    const session = db.prepare(`
      SELECT * FROM virtual_pairing_sessions 
      WHERE status IN ('pending', 'paired', 'monitoring')
      ORDER BY created_at DESC LIMIT 1
    `).get();

    const node = db.prepare('SELECT * FROM nodes WHERE id = ?').get('VIRTUAL-NODE-01');

    const pairingBaseUrl = tunnelUrl || `http://${localIp}:${port}`;
    const activePairingUrl = session ? `${pairingBaseUrl}/mobile-node?code=${session.code}` : null;

    res.json({
      success: true,
      data: {
        localIp,
        port,
        tunnel,
        tunnelUrl,
        isHttps: !!tunnelUrl,
        pairingUrlTemplate: `${pairingBaseUrl}/mobile-node`,
        activePairingUrl,
        activeSession: session || null,
        virtualNode: node || null
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Tunnel Management Routes
router.post('/tunnel/start', async (req, res) => {
  try {
    const port = process.env.PORT || 5000;
    const url = await tunnelService.startTunnel(port);
    broadcast('TUNNEL_STATUS', { status: 'running', url });
    res.json({ success: true, url, message: 'Cloudflare HTTPS Tunnel active' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.post('/tunnel/stop', (req, res) => {
  try {
    tunnelService.stopTunnel();
    broadcast('TUNNEL_STATUS', { status: 'stopped', url: null });
    res.json({ success: true, message: 'Tunnel stopped' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.post('/tunnel/set-url', (req, res) => {
  try {
    const { url } = req.body;
    const newUrl = tunnelService.setCustomUrl(url);
    broadcast('TUNNEL_STATUS', { status: newUrl ? 'running' : 'stopped', url: newUrl });
    res.json({ success: true, url: newUrl });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.get('/tunnel/status', (req, res) => {
  res.json({ success: true, data: tunnelService.getStatus() });
});

// POST generate new pairing code
router.post('/generate-pairing', (req, res) => {
  try {
    const localIp = getLocalIpAddress();
    const port = process.env.PORT || 5000;
    const tunnelUrl = tunnelService.getTunnelUrl();

    // 6-digit alphanumeric code: e.g. JS-7294
    const randNum = Math.floor(1000 + Math.random() * 9000);
    const code = `JS-${randNum}`;
    const id = `SESSION-${Date.now()}`;
    const now = new Date();
    const expiresAt = new Date(now.getTime() + 20 * 60 * 1000); // 20 mins expiry

    // Invalidate prior pending sessions
    db.prepare("UPDATE virtual_pairing_sessions SET status = 'expired' WHERE status = 'pending'").run();

    db.prepare(`
      INSERT INTO virtual_pairing_sessions (id, code, node_id, device_name, status, created_at, expires_at, ip_address, battery_level, mic_status, streaming_status, lat, lng)
      VALUES (?, ?, 'VIRTUAL-NODE-01', null, 'pending', ?, ?, ?, null, 'pending', 'idle', 29.5340, 78.7660)
    `).run(id, code, now.toISOString(), expiresAt.toISOString(), localIp);

    // Prefer secure HTTPS tunnel URL when available
    const baseUrl = tunnelUrl || `http://${localIp}:${port}`;
    const pairingUrl = `${baseUrl}/mobile-node?code=${code}`;
    const localPairingUrl = `http://localhost:${port}/mobile-node?code=${code}`;

    res.json({
      success: true,
      data: {
        sessionId: id,
        code,
        nodeId: 'VIRTUAL-NODE-01',
        pairingUrl,
        localPairingUrl,
        isHttps: !!tunnelUrl,
        tunnelUrl: tunnelUrl || null,
        expiresAt: expiresAt.toISOString()
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST verify pairing code
router.post('/verify-code', (req, res) => {
  try {
    const { code } = req.body;
    if (!code) return res.status(400).json({ success: false, error: 'Pairing code is required' });

    const session = db.prepare(`
      SELECT * FROM virtual_pairing_sessions 
      WHERE code = ? AND status IN ('pending', 'paired', 'monitoring')
      ORDER BY created_at DESC LIMIT 1
    `).get(code.trim().toUpperCase());

    if (!session) {
      return res.status(404).json({ success: false, error: 'Invalid or expired pairing code' });
    }

    if (new Date(session.expires_at) < new Date()) {
      return res.status(410).json({ success: false, error: 'Pairing code has expired. Please generate a new one on the dashboard.' });
    }

    res.json({
      success: true,
      data: session
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST complete smartphone pairing
router.post('/pair', (req, res) => {
  try {
    const { code, deviceName = 'Smartphone Android / iOS', batteryLevel = 88, lat = 29.5340, lng = 78.7660 } = req.body;
    
    const session = db.prepare(`
      SELECT * FROM virtual_pairing_sessions 
      WHERE code = ? AND status IN ('pending', 'paired', 'monitoring')
      ORDER BY created_at DESC LIMIT 1
    `).get(code?.trim().toUpperCase());

    if (!session) {
      return res.status(404).json({ success: false, error: 'Valid pairing session not found' });
    }

    const now = new Date().toISOString();

    // Update session
    db.prepare(`
      UPDATE virtual_pairing_sessions 
      SET device_name = ?, status = 'paired', battery_level = ?, mic_status = 'granted', streaming_status = 'ready', lat = ?, lng = ?
      WHERE id = ?
    `).run(deviceName, batteryLevel, lat, lng, session.id);

    // Register/update VIRTUAL-NODE-01 in nodes table
    db.prepare(`
      INSERT OR REPLACE INTO nodes (id, name, zone, lat, lng, status, battery, signal_rssi, temperature, humidity, smoke_ppm, pir_motion, mic_status, gateway_id, last_heartbeat, firmware_version, node_type)
      VALUES ('VIRTUAL-NODE-01', ?, 'Core Zone Alpha (Field Patrol)', ?, ?, 'online', ?, -58, 27.2, 58.4, 10.5, 'Clear', 'active', 'JS-GW-01', ?, 'v1.0-VirtualNode', 'virtual_smartphone')
    `).run(deviceName, lat, lng, batteryLevel, now);

    const updatedNode = db.prepare('SELECT * FROM nodes WHERE id = ?').get('VIRTUAL-NODE-01');
    const updatedSession = db.prepare('SELECT * FROM virtual_pairing_sessions WHERE id = ?').get(session.id);

    broadcast('VIRTUAL_NODE_PAIRED', { node: updatedNode, session: updatedSession });
    broadcast('NODE_UPDATED', updatedNode);

    res.json({
      success: true,
      message: `Device "${deviceName}" paired successfully as VIRTUAL-NODE-01`,
      data: {
        node: updatedNode,
        session: updatedSession
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST stream audio chunk from smartphone
router.post('/upload-audio-stream', upload.single('audio'), (req, res) => {
  try {
    const nodeId = req.body.node_id || req.body.nodeId || 'VIRTUAL-NODE-01';
    const simulatedCategory = req.body.category || req.body.simulatedCategory;
    const rmsEnergy = Number(req.body.rms_energy || req.body.rmsEnergy || 0.42);
    const lat = req.body.lat;
    const lng = req.body.lng;

    let audioUrl = '';
    let buffer = null;
    let filename = '';

    if (req.file) {
      audioUrl = `/uploads/${req.file.filename}`;
      filename = req.file.filename;
      buffer = fs.readFileSync(req.file.path);
    } else {
      audioUrl = `/samples/chainsaw_sound.wav`;
      filename = 'chainsaw_sound.wav';
    }

    // Run classification on incoming smartphone audio
    const result = classifyAudio({
      filename: simulatedCategory ? simulatedCategory.toLowerCase() : filename,
      buffer,
      sampleName: simulatedCategory || filename
    });

    const category = result.matchedClass;
    const confidence = result.confidence;
    const riskLevel = result.riskLevel;
    const now = new Date().toISOString();
    const eventId = `VAE-${Date.now()}`;

    // Get current node coordinates
    const node = db.prepare('SELECT * FROM nodes WHERE id = ?').get(nodeId) || {
      lat: 29.5340,
      lng: 78.7660
    };
    const eventLat = Number(lat) || node.lat;
    const eventLng = Number(lng) || node.lng;

    let alertId = null;
    let incidentId = null;

    // Trigger alert if suspicious/critical
    const isAnomalous = ['Critical', 'High', 'Medium'].includes(riskLevel) && !category.includes('Bird');

    if (isAnomalous) {
      const alertCount = db.prepare('SELECT COUNT(*) as c FROM alerts').get().c;
      const incCount = db.prepare('SELECT COUNT(*) as c FROM incidents').get().c;
      alertId = `ALT-VIRT-${String(alertCount + 1).padStart(3, '0')}`;
      incidentId = `INC-VIRT-${String(incCount + 1).padStart(3, '0')}`;

      const severity = riskLevel === 'Critical' ? 'critical' : riskLevel === 'High' ? 'high' : 'medium';

      // Insert Alert
      db.prepare(`
        INSERT INTO alerts (id, title, category, severity, source_node, detection_method, confidence, lat, lng, timestamp, description, recommended_action, status, incident_id)
        VALUES (?, ?, ?, ?, ?, 'Smartphone Virtual Node AI Classifier', ?, ?, ?, ?, ?, ?, 'new', ?)
      `).run(
        alertId,
        `SMARTPHONE AUDIO DETECTED: ${category}`,
        category,
        severity,
        nodeId,
        confidence,
        eventLat,
        eventLng,
        now,
        `Live smartphone microphone node ${nodeId} captured acoustic transient matching "${category}" (${confidence}% confidence). Ground verification advised.`,
        CLASS_PROFILES[category]?.recommendation || 'Listen to captured audio evidence and mobilize ranger patrol.',
        incidentId
      );

      // Insert Incident with evidence audio URL
      const timeline = JSON.stringify([
        { step: 'Acoustic Signal Captured', time: now, note: `Transmitted by smartphone virtual node ${nodeId}` },
        { step: 'Edge Classification', time: now, note: `MobileNet-Edge matched ${category} (${confidence}%)` }
      ]);

      db.prepare(`
        INSERT INTO incidents (id, alert_id, title, category, severity, source_node, lat, lng, detection_timestamp, ai_classification, ai_confidence, assigned_team_id, status, evidence_url, problem_identified, investigation_notes, action_taken, resources_used, resolution_summary, verified_by, final_outcome, closed_at, timeline)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, null, 'new', ?, ?, 'Awaiting forest official audio verification.', 'None yet.', 'Pending dispatch.', null, null, null, null, ?)
      `).run(
        incidentId,
        alertId,
        `VIRTUAL NODE: Suspected ${category}`,
        category,
        severity,
        nodeId,
        eventLat,
        eventLng,
        now,
        category,
        confidence,
        audioUrl,
        `Unusual acoustic event logged via smartphone node. Confidence: ${confidence}%.`,
        timeline
      );
    }

    // Insert into virtual audio events
    db.prepare(`
      INSERT INTO virtual_audio_events (id, node_id, audio_url, category, confidence, risk_level, timestamp, rms_energy, alert_id, incident_id, verified_status)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending')
    `).run(eventId, nodeId, audioUrl, category, confidence, riskLevel, now, Number(rmsEnergy), alertId, incidentId);

    const savedEvent = db.prepare('SELECT * FROM virtual_audio_events WHERE id = ?').get(eventId);

    if (alertId) {
      const createdAlert = db.prepare('SELECT * FROM alerts WHERE id = ?').get(alertId);
      const createdInc = db.prepare('SELECT * FROM incidents WHERE id = ?').get(incidentId);
      broadcast('ALERT_CREATED', createdAlert);
      broadcast('INCIDENT_CREATED', createdInc);
    }

    broadcast('VIRTUAL_NODE_AUDIO_DETECTED', {
      event: savedEvent,
      classification: result,
      alertId,
      incidentId
    });

    res.json({
      success: true,
      message: 'Audio analyzed successfully',
      data: {
        event: savedEvent,
        classification: result,
        alertId,
        incidentId
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST update smartphone virtual node status & telemetry
router.post('/update-status', (req, res) => {
  try {
    const nodeId = req.body.node_id || req.body.nodeId || 'VIRTUAL-NODE-01';
    const batteryLevel = req.body.battery_level !== undefined ? req.body.battery_level : req.body.batteryLevel;
    const micStatus = req.body.mic_status || req.body.micStatus || 'active';
    const streamingStatus = req.body.streaming_status || req.body.streamingStatus || 'monitoring';
    const { lat, lng } = req.body;

    const now = new Date().toISOString();

    db.prepare(`
      UPDATE nodes
      SET battery = COALESCE(?, battery),
          mic_status = COALESCE(?, mic_status),
          lat = COALESCE(?, lat),
          lng = COALESCE(?, lng),
          last_heartbeat = ?
      WHERE id = ?
    `).run(batteryLevel !== undefined ? batteryLevel : null, micStatus, lat || null, lng || null, now, nodeId);

    // Update active session
    db.prepare(`
      UPDATE virtual_pairing_sessions
      SET battery_level = COALESCE(?, battery_level),
          mic_status = COALESCE(?, mic_status),
          streaming_status = COALESCE(?, streaming_status),
          lat = COALESCE(?, lat),
          lng = COALESCE(?, lng)
      WHERE node_id = ? AND status IN ('paired', 'monitoring')
    `).run(batteryLevel !== undefined ? batteryLevel : null, micStatus, streamingStatus, lat || null, lng || null, nodeId);

    const updated = db.prepare('SELECT * FROM nodes WHERE id = ?').get(nodeId);
    broadcast('NODE_UPDATED', updated);
    broadcast('VIRTUAL_NODE_STATUS', {
      nodeId,
      batteryLevel,
      micStatus,
      streamingStatus,
      lat,
      lng,
      lastHeartbeat: now
    });

    res.json({ success: true, data: updated });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST disconnect smartphone virtual node
router.post('/disconnect', (req, res) => {
  try {
    const now = new Date().toISOString();
    db.prepare(`
      UPDATE virtual_pairing_sessions
      SET status = 'disconnected', streaming_status = 'idle'
      WHERE node_id = 'VIRTUAL-NODE-01' AND status IN ('paired', 'monitoring')
    `).run();

    db.prepare(`
      UPDATE nodes
      SET status = 'offline', mic_status = 'standby', last_heartbeat = ?
      WHERE id = 'VIRTUAL-NODE-01'
    `).run(now);

    const updated = db.prepare('SELECT * FROM nodes WHERE id = ?').get('VIRTUAL-NODE-01');
    broadcast('NODE_UPDATED', updated);
    broadcast('VIRTUAL_NODE_DISCONNECTED', { nodeId: 'VIRTUAL-NODE-01', timestamp: now });

    res.json({ success: true, message: 'Smartphone node disconnected successfully' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET list of virtual audio events
router.get('/events', (req, res) => {
  try {
    const events = db.prepare(`
      SELECT * FROM virtual_audio_events 
      ORDER BY timestamp DESC LIMIT 30
    `).all();
    res.json({ success: true, data: events });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST verify virtual audio event (Confirm vs False Alarm)
router.post('/verify-event', (req, res) => {
  try {
    const { eventId, verifiedStatus, action, reason = '' } = req.body;
    const act = verifiedStatus || action; // accept both 'confirm'/'confirmed' or 'false_alarm'
    if (!eventId || !act) return res.status(400).json({ success: false, error: 'Event ID and action/verifiedStatus are required' });

    const event = db.prepare('SELECT * FROM virtual_audio_events WHERE id = ?').get(eventId);
    if (!event) return res.status(404).json({ success: false, error: 'Event not found' });

    const isConfirmed = act === 'confirm' || act === 'confirmed';
    const newStatus = isConfirmed ? 'confirmed' : 'false_alarm';
    db.prepare('UPDATE virtual_audio_events SET verified_status = ? WHERE id = ?').run(newStatus, eventId);

    if (!isConfirmed) {
      if (event.alert_id) {
        db.prepare("UPDATE alerts SET status = 'false_alarm' WHERE id = ?").run(event.alert_id);
        broadcast('ALERT_UPDATED', db.prepare('SELECT * FROM alerts WHERE id = ?').get(event.alert_id));
      }
      if (event.incident_id) {
        db.prepare(`
          UPDATE incidents 
          SET status = 'closed', final_outcome = 'False Alarm', resolution_summary = ?
          WHERE id = ?
        `).run(`Forest official verified audio evidence and marked as False Alarm: ${reason || 'Ambient background noise'}`, event.incident_id);
        broadcast('INCIDENT_RESOLVED', db.prepare('SELECT * FROM incidents WHERE id = ?').get(event.incident_id));
      }
    } else {
      if (event.alert_id) {
        db.prepare("UPDATE alerts SET status = 'under_investigation' WHERE id = ?").run(event.alert_id);
        broadcast('ALERT_UPDATED', db.prepare('SELECT * FROM alerts WHERE id = ?').get(event.alert_id));
      }
      if (event.incident_id) {
        db.prepare("UPDATE incidents SET status = 'investigation_started' WHERE id = ?").run(event.incident_id);
        broadcast('INCIDENT_UPDATED', db.prepare('SELECT * FROM incidents WHERE id = ?').get(event.incident_id));
      }
    }

    const updatedEvent = db.prepare('SELECT * FROM virtual_audio_events WHERE id = ?').get(eventId);
    res.json({
      success: true,
      message: `Audio event marked as ${newStatus}`,
      data: updatedEvent
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
