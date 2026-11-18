const express = require('express');
const router = express.Router();
const { db } = require('../db/database');
const { broadcast } = require('../services/socketService');

// GET all RFID logs
router.get('/', (req, res) => {
  try {
    const { status, checkpoint, limit = 50 } = req.query;
    let query = 'SELECT * FROM rfid_vehicles WHERE 1=1';
    const params = [];

    if (status && status !== 'all') {
      query += ' AND status = ?';
      params.push(status);
    }
    if (checkpoint && checkpoint !== 'all') {
      query += ' AND checkpoint = ?';
      params.push(checkpoint);
    }

    query += ' ORDER BY entry_time DESC LIMIT ?';
    params.push(Number(limit));

    const records = db.prepare(query).all(...params);
    res.json({ success: true, data: records });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST simulate RFID scan at checkpoint
router.post('/scan', (req, res) => {
  try {
    const { tag_id, checkpoint = 'North Gate Checkpoint' } = req.body;
    if (!tag_id) return res.status(400).json({ success: false, error: 'Tag ID is required' });

    const now = new Date().toISOString();
    const existing = db.prepare('SELECT * FROM rfid_vehicles WHERE tag_id = ? ORDER BY id DESC LIMIT 1').get(tag_id);

    if (!existing || tag_id.includes('UNAUTH') || tag_id.includes('UNKNOWN')) {
      // Unknown RFID tag scanned! Generate immediate unauthorized-entry warning
      const count = db.prepare('SELECT COUNT(*) as c FROM alerts').get().c;
      const alertId = `ALT-2026-${String(count + 1).padStart(3, '0')}`;

      // Insert unauthorized vehicle record
      db.prepare(`
        INSERT INTO rfid_vehicles (tag_id, vehicle_reg, vehicle_type, checkpoint, entry_time, exit_time, status, personnel, purpose)
        VALUES (?, 'UNREGISTERED', 'Unverified Vehicle', ?, ?, null, 'unauthorized_breach', 'Unknown Driver', 'Unauthorized Checkpoint Breach Detected')
      `).run(tag_id, checkpoint, now);

      // Create alert
      db.prepare(`
        INSERT INTO alerts (id, title, category, severity, source_node, detection_method, confidence, lat, lng, timestamp, description, recommended_action, status, incident_id)
        VALUES (?, ?, 'Human Intrusion', 'high', 'JS-NODE-04', 'RFID Gate Scanner', 99.5, 29.5220, 78.7480, ?, ?, ?, 'new', null)
      `).run(
        alertId,
        `SECURITY ALERT: Unauthorized Vehicle Scan (${tag_id})`,
        now,
        `Unregistered RFID tag ${tag_id} attempted entry at ${checkpoint}. Automatic gate barrier held down.`,
        'Dispatch Forest Patrol to checkpoint to verify credentials and vehicle registration.'
      );

      const alert = db.prepare('SELECT * FROM alerts WHERE id = ?').get(alertId);
      broadcast('ALERT_CREATED', alert);

      return res.status(200).json({
        success: true,
        authorized: false,
        warning: 'UNAUTHORIZED VEHICLE DETECTED: Security intrusion alert triggered!',
        alertId,
        tag_id,
        checkpoint,
        timestamp: now
      });
    }

    // Authorized tag
    let action = 'Entry Logged';
    if (!existing.exit_time) {
      // Record exit if already inside
      db.prepare('UPDATE rfid_vehicles SET exit_time = ? WHERE id = ?').run(now, existing.id);
      action = 'Exit Logged';
    } else {
      // Create new entry
      db.prepare(`
        INSERT INTO rfid_vehicles (tag_id, vehicle_reg, vehicle_type, checkpoint, entry_time, exit_time, status, personnel, purpose)
        VALUES (?, ?, ?, ?, ?, null, 'authorized', ?, ?)
      `).run(existing.tag_id, existing.vehicle_reg, existing.vehicle_type, checkpoint, now, existing.personnel, existing.purpose);
      action = 'Entry Logged';
    }

    const updatedRecords = db.prepare('SELECT * FROM rfid_vehicles ORDER BY id DESC LIMIT 1').get();
    broadcast('RFID_SCANNED', updatedRecords);

    res.json({
      success: true,
      authorized: true,
      action,
      data: updatedRecords
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST register new vehicle
router.post('/register-vehicle', (req, res) => {
  try {
    const {
      tag_id, vehicle_reg, vehicle_type,
      checkpoint = 'North Gate Checkpoint',
      personnel, purpose
    } = req.body;

    if (!tag_id || !vehicle_reg || !personnel) {
      return res.status(400).json({ success: false, error: 'Tag ID, Vehicle Reg, and Personnel are required' });
    }

    const now = new Date().toISOString();
    db.prepare(`
      INSERT INTO rfid_vehicles (tag_id, vehicle_reg, vehicle_type, checkpoint, entry_time, exit_time, status, personnel, purpose)
      VALUES (?, ?, ?, ?, ?, null, 'authorized', ?, ?)
    `).run(tag_id, vehicle_reg, vehicle_type || 'Forest Dept Vehicle', checkpoint, now, personnel, purpose || 'Authorized Forest Movement');

    const created = db.prepare('SELECT * FROM rfid_vehicles ORDER BY id DESC LIMIT 1').get();
    res.status(201).json({ success: true, data: created });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;

