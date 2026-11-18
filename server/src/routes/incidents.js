const express = require('express');
const router = express.Router();
const { db } = require('../db/database');
const { broadcast } = require('../services/socketService');

// GET all incidents
router.get('/', (req, res) => {
  try {
    const { status, category, severity, limit = 50 } = req.query;
    let query = 'SELECT * FROM incidents WHERE 1=1';
    const params = [];

    if (status && status !== 'all') {
      if (status === 'active') {
        query += " AND status != 'closed'";
      } else if (status === 'resolved') {
        query += " AND status = 'closed'";
      } else {
        query += ' AND status = ?';
        params.push(status);
      }
    }
    if (category && category !== 'all') {
      query += ' AND category = ?';
      params.push(category);
    }
    if (severity && severity !== 'all') {
      query += ' AND severity = ?';
      params.push(severity);
    }

    query += ' ORDER BY detection_timestamp DESC LIMIT ?';
    params.push(Number(limit));

    const incidents = db.prepare(query).all(...params);
    const parsed = incidents.map(inc => {
      let timeline = [];
      try { timeline = JSON.parse(inc.timeline); } catch (e) {}
      return { ...inc, timeline };
    });

    res.json({ success: true, data: parsed });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET single incident
router.get('/:id', (req, res) => {
  try {
    const incident = db.prepare('SELECT * FROM incidents WHERE id = ?').get(req.params.id);
    if (!incident) return res.status(404).json({ success: false, error: 'Incident not found' });

    let timeline = [];
    try { timeline = JSON.parse(incident.timeline); } catch (e) {}

    const node = db.prepare('SELECT * FROM nodes WHERE id = ?').get(incident.source_node);
    let team = null;
    if (incident.assigned_team_id) {
      team = db.prepare('SELECT * FROM response_teams WHERE id = ?').get(incident.assigned_team_id);
    }

    res.json({
      success: true,
      data: {
        ...incident,
        timeline,
        node,
        team
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST create incident manually
router.post('/', (req, res) => {
  try {
    const {
      title, category, severity, source_node,
      lat, lng, ai_classification, ai_confidence,
      problem_identified = 'Manual Operator Incident Report'
    } = req.body;

    const count = db.prepare('SELECT COUNT(*) as c FROM incidents').get().c;
    const id = `INC-2026-${String(count + 1).padStart(3, '0')}`;
    const now = new Date().toISOString();

    const timeline = JSON.stringify([
      { step: 'Incident Created', time: now, note: 'Manually opened by Command Operator' }
    ]);

    db.prepare(`
      INSERT INTO incidents (id, alert_id, title, category, severity, source_node, lat, lng, detection_timestamp, ai_classification, ai_confidence, assigned_team_id, status, evidence_url, problem_identified, investigation_notes, action_taken, resources_used, resolution_summary, verified_by, final_outcome, closed_at, timeline)
      VALUES (?, null, ?, ?, ?, ?, ?, ?, ?, ?, ?, null, 'new', null, ?, 'Pending field review.', 'Pending.', 'VHF / Patrol team.', null, null, null, null, ?)
    `).run(
      id, title, category, severity, source_node,
      lat, lng, now, ai_classification, ai_confidence,
      problem_identified, timeline
    );

    const created = db.prepare('SELECT * FROM incidents WHERE id = ?').get(id);
    broadcast('INCIDENT_CREATED', created);
    res.status(201).json({ success: true, data: created });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// PUT assign team to incident
router.put('/:id/assign-team', (req, res) => {
  try {
    const { team_id } = req.body;
    const incident = db.prepare('SELECT * FROM incidents WHERE id = ?').get(req.params.id);
    if (!incident) return res.status(404).json({ success: false, error: 'Incident not found' });

    const team = db.prepare('SELECT * FROM response_teams WHERE id = ?').get(team_id);
    if (!team) return res.status(404).json({ success: false, error: 'Team not found' });

    const now = new Date().toISOString();
    let timeline = [];
    try { timeline = JSON.parse(incident.timeline); } catch (e) {}
    timeline.push({ step: 'Team Assigned', time: now, note: `Assigned ${team.name} led by ${team.leader}` });

    db.prepare(`
      UPDATE incidents 
      SET assigned_team_id = ?, status = 'team_assigned', timeline = ?
      WHERE id = ?
    `).run(team_id, JSON.stringify(timeline), req.params.id);

    db.prepare(`
      UPDATE response_teams
      SET status = 'assigned', assigned_incident_id = ?, last_update = ?
      WHERE id = ?
    `).run(req.params.id, now, team_id);

    const updatedIncident = db.prepare('SELECT * FROM incidents WHERE id = ?').get(req.params.id);
    broadcast('INCIDENT_UPDATED', updatedIncident);
    broadcast('TEAM_UPDATED', db.prepare('SELECT * FROM response_teams WHERE id = ?').get(team_id));

    res.json({ success: true, data: updatedIncident });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST submit resolution and close incident
router.post('/:id/resolve', (req, res) => {
  try {
    const {
      problem_identified,
      investigation_notes,
      evidence_description,
      action_taken,
      resources_used,
      resolution_summary,
      final_outcome,
      verified_by = 'Ranger Vikram Sen (Chief Conservator)',
      evidence_url
    } = req.body;

    const incident = db.prepare('SELECT * FROM incidents WHERE id = ?').get(req.params.id);
    if (!incident) return res.status(404).json({ success: false, error: 'Incident not found' });

    const now = new Date().toISOString();
    let timeline = [];
    try { timeline = JSON.parse(incident.timeline); } catch (e) {}

    timeline.push({
      step: 'Investigation & Action Completed',
      time: now,
      note: action_taken || 'Field measures completed.'
    });
    timeline.push({
      step: 'Resolution Verified & Closed',
      time: now,
      note: `Verified by ${verified_by}. Outcome: ${final_outcome}`
    });

    db.prepare(`
      UPDATE incidents
      SET status = 'closed',
          problem_identified = COALESCE(?, problem_identified),
          investigation_notes = COALESCE(?, investigation_notes),
          action_taken = COALESCE(?, action_taken),
          resources_used = COALESCE(?, resources_used),
          resolution_summary = COALESCE(?, resolution_summary),
          final_outcome = COALESCE(?, final_outcome),
          verified_by = ?,
          evidence_url = COALESCE(?, evidence_url),
          closed_at = ?,
          timeline = ?
      WHERE id = ?
    `).run(
      problem_identified || null,
      investigation_notes || null,
      action_taken || null,
      resources_used || null,
      resolution_summary || null,
      final_outcome || null,
      verified_by || 'Ranger Vikram Sen (Chief Conservator)',
      evidence_url || null,
      now,
      JSON.stringify(timeline),
      req.params.id
    );

    // Release assigned team if any
    if (incident.assigned_team_id) {
      db.prepare(`
        UPDATE response_teams
        SET status = 'available', assigned_incident_id = null, eta_minutes = null, last_update = ?
        WHERE id = ?
      `).run(now, incident.assigned_team_id);
      broadcast('TEAM_UPDATED', db.prepare('SELECT * FROM response_teams WHERE id = ?').get(incident.assigned_team_id));
    }

    // Resolve associated alert if any
    if (incident.alert_id) {
      db.prepare("UPDATE alerts SET status = 'resolved' WHERE id = ?").run(incident.alert_id);
      broadcast('ALERT_UPDATED', db.prepare('SELECT * FROM alerts WHERE id = ?').get(incident.alert_id));
    }

    const updated = db.prepare('SELECT * FROM incidents WHERE id = ?').get(req.params.id);
    broadcast('INCIDENT_RESOLVED', updated);

    res.json({ success: true, message: 'Incident successfully resolved and certified.', data: updated });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
