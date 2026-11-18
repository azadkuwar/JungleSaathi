const express = require('express');
const router = express.Router();
const { db } = require('../db/database');
const { broadcast } = require('../services/socketService');

// GET all alerts with optional query filters
router.get('/', (req, res) => {
  try {
    const { status, severity, category, limit = 50 } = req.query;
    let query = 'SELECT * FROM alerts WHERE 1=1';
    const params = [];

    if (status && status !== 'all') {
      query += ' AND status = ?';
      params.push(status);
    }
    if (severity && severity !== 'all') {
      query += ' AND severity = ?';
      params.push(severity);
    }
    if (category && category !== 'all') {
      query += ' AND category = ?';
      params.push(category);
    }

    query += ' ORDER BY timestamp DESC LIMIT ?';
    params.push(Number(limit));

    const alerts = db.prepare(query).all(...params);
    res.json({ success: true, data: alerts });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET single alert
router.get('/:id', (req, res) => {
  try {
    const alert = db.prepare('SELECT * FROM alerts WHERE id = ?').get(req.params.id);
    if (!alert) return res.status(404).json({ success: false, error: 'Alert not found' });

    const node = db.prepare('SELECT * FROM nodes WHERE id = ?').get(alert.source_node);
    let incident = null;
    if (alert.incident_id) {
      incident = db.prepare('SELECT * FROM incidents WHERE id = ?').get(alert.incident_id);
    }

    res.json({ success: true, data: { ...alert, node, incident } });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST create alert
router.post('/', (req, res) => {
  try {
    const {
      title, category, severity, source_node,
      detection_method = 'Manual Ranger Entry',
      confidence = 90.0, lat, lng,
      description, recommended_action
    } = req.body;

    const count = db.prepare('SELECT COUNT(*) as c FROM alerts').get().c;
    const id = `ALT-2026-${String(count + 1).padStart(3, '0')}`;
    const now = new Date().toISOString();

    db.prepare(`
      INSERT INTO alerts (id, title, category, severity, source_node, detection_method, confidence, lat, lng, timestamp, description, recommended_action, status, incident_id)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'new', null)
    `).run(
      id, title, category, severity, source_node,
      detection_method, confidence, lat, lng,
      now, description, recommended_action
    );

    const created = db.prepare('SELECT * FROM alerts WHERE id = ?').get(id);
    broadcast('ALERT_CREATED', created);
    res.status(201).json({ success: true, data: created });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// PUT acknowledge alert
router.put('/:id/acknowledge', (req, res) => {
  try {
    db.prepare("UPDATE alerts SET status = 'acknowledged' WHERE id = ?").run(req.params.id);
    const updated = db.prepare('SELECT * FROM alerts WHERE id = ?').get(req.params.id);
    broadcast('ALERT_UPDATED', updated);
    res.json({ success: true, data: updated });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// PUT escalate alert to Incident
router.put('/:id/escalate', (req, res) => {
  try {
    const alert = db.prepare('SELECT * FROM alerts WHERE id = ?').get(req.params.id);
    if (!alert) return res.status(404).json({ success: false, error: 'Alert not found' });

    let incidentId = alert.incident_id;
    const now = new Date().toISOString();

    if (!incidentId) {
      const incCount = db.prepare('SELECT COUNT(*) as c FROM incidents').get().c;
      incidentId = `INC-2026-${String(incCount + 1).padStart(3, '0')}`;

      const timeline = JSON.stringify([
        { step: 'Alert Escalated', time: now, note: `Escalated from Alert ${alert.id} by Command Operator` }
      ]);

      db.prepare(`
        INSERT INTO incidents (id, alert_id, title, category, severity, source_node, lat, lng, detection_timestamp, ai_classification, ai_confidence, assigned_team_id, status, evidence_url, problem_identified, investigation_notes, action_taken, resources_used, resolution_summary, verified_by, final_outcome, closed_at, timeline)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, null, 'investigation_started', null, ?, 'Field inspection in progress.', 'Awaiting team assignment.', 'VHF, GPS, Patrol unit.', null, null, null, null, ?)
      `).run(
        incidentId, alert.id, `Escalated Incident: ${alert.title}`, alert.category,
        alert.severity, alert.source_node, alert.lat, alert.lng,
        alert.timestamp, alert.category, alert.confidence,
        alert.description, timeline
      );

      db.prepare('UPDATE alerts SET incident_id = ?, status = ? WHERE id = ?').run(incidentId, 'under_investigation', alert.id);
    }

    const updatedAlert = db.prepare('SELECT * FROM alerts WHERE id = ?').get(alert.id);
    const createdIncident = db.prepare('SELECT * FROM incidents WHERE id = ?').get(incidentId);

    broadcast('ALERT_UPDATED', updatedAlert);
    broadcast('INCIDENT_CREATED', createdIncident);

    res.json({ success: true, data: { alert: updatedAlert, incident: createdIncident } });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// PUT mark false alarm
router.put('/:id/false-alarm', (req, res) => {
  try {
    db.prepare("UPDATE alerts SET status = 'false_alarm' WHERE id = ?").run(req.params.id);
    const updated = db.prepare('SELECT * FROM alerts WHERE id = ?').get(req.params.id);
    broadcast('ALERT_UPDATED', updated);
    res.json({ success: true, data: updated });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// PUT resolve alert
router.put('/:id/resolve', (req, res) => {
  try {
    db.prepare("UPDATE alerts SET status = 'resolved' WHERE id = ?").run(req.params.id);
    const updated = db.prepare('SELECT * FROM alerts WHERE id = ?').get(req.params.id);
    broadcast('ALERT_UPDATED', updated);
    res.json({ success: true, data: updated });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;

