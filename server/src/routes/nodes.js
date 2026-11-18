const express = require('express');
const router = express.Router();
const { db } = require('../db/database');
const { broadcast } = require('../services/socketService');

// GET all nodes
router.get('/', (req, res) => {
  try {
    const nodes = db.prepare('SELECT * FROM nodes ORDER BY id ASC').all();
    res.json({ success: true, data: nodes });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET single node with telemetry history
router.get('/:id', (req, res) => {
  try {
    const node = db.prepare('SELECT * FROM nodes WHERE id = ?').get(req.params.id);
    if (!node) {
      return res.status(404).json({ success: false, error: 'Node not found' });
    }

    const history = db.prepare(`
      SELECT * FROM sensor_telemetry_history 
      WHERE node_id = ? 
      ORDER BY timestamp ASC 
      LIMIT 25
    `).all(req.params.id);

    const alerts = db.prepare(`
      SELECT * FROM alerts 
      WHERE source_node = ? 
      ORDER BY timestamp DESC 
      LIMIT 5
    `).all(req.params.id);

    res.json({ success: true, data: { ...node, history, alerts } });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST create node
router.post('/', (req, res) => {
  try {
    const {
      id, name, zone, lat, lng,
      battery = 100, signal_rssi = -70,
      gateway_id = 'JS-GW-01'
    } = req.body;

    if (!id || !name || !zone || lat === undefined || lng === undefined) {
      return res.status(400).json({ success: false, error: 'Missing required node parameters' });
    }

    const now = new Date().toISOString();
    db.prepare(`
      INSERT INTO nodes (id, name, zone, lat, lng, status, battery, signal_rssi, temperature, humidity, smoke_ppm, pir_motion, mic_status, gateway_id, last_heartbeat, firmware_version)
      VALUES (?, ?, ?, ?, ?, 'online', ?, ?, 24.0, 65.0, 12.0, 'Clear', 'active', ?, ?, 'v2.4.1-EdgeAI')
    `).run(id, name, zone, lat, lng, battery, signal_rssi, gateway_id, now);

    const newNode = db.prepare('SELECT * FROM nodes WHERE id = ?').get(id);
    broadcast('NODE_CREATED', newNode);
    res.status(201).json({ success: true, data: newNode });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// PUT update node
router.put('/:id', (req, res) => {
  try {
    const { name, zone, lat, lng, status, battery, signal_rssi, gateway_id } = req.body;
    const existing = db.prepare('SELECT * FROM nodes WHERE id = ?').get(req.params.id);
    if (!existing) {
      return res.status(404).json({ success: false, error: 'Node not found' });
    }

    db.prepare(`
      UPDATE nodes
      SET name = COALESCE(?, name),
          zone = COALESCE(?, zone),
          lat = COALESCE(?, lat),
          lng = COALESCE(?, lng),
          status = COALESCE(?, status),
          battery = COALESCE(?, battery),
          signal_rssi = COALESCE(?, signal_rssi),
          gateway_id = COALESCE(?, gateway_id)
      WHERE id = ?
    `).run(
      name || null,
      zone || null,
      lat !== undefined ? lat : null,
      lng !== undefined ? lng : null,
      status || null,
      battery !== undefined ? battery : null,
      signal_rssi !== undefined ? signal_rssi : null,
      gateway_id || null,
      req.params.id
    );

    const updated = db.prepare('SELECT * FROM nodes WHERE id = ?').get(req.params.id);
    broadcast('NODE_UPDATED', updated);
    res.json({ success: true, data: updated });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST restart node simulation
router.post('/:id/restart', (req, res) => {
  try {
    const now = new Date().toISOString();
    db.prepare(`
      UPDATE nodes 
      SET status = 'online', last_heartbeat = ?, pir_motion = 'Clear'
      WHERE id = ?
    `).run(now, req.params.id);

    const updated = db.prepare('SELECT * FROM nodes WHERE id = ?').get(req.params.id);
    broadcast('NODE_UPDATED', updated);
    res.json({ success: true, message: `Node ${req.params.id} rebooted and telemetry re-initialized.`, data: updated });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST maintenance toggle
router.post('/:id/maintenance', (req, res) => {
  try {
    const node = db.prepare('SELECT * FROM nodes WHERE id = ?').get(req.params.id);
    if (!node) return res.status(404).json({ success: false, error: 'Node not found' });

    const newStatus = node.status === 'maintenance' ? 'online' : 'maintenance';
    db.prepare('UPDATE nodes SET status = ? WHERE id = ?').run(newStatus, req.params.id);

    const updated = db.prepare('SELECT * FROM nodes WHERE id = ?').get(req.params.id);
    broadcast('NODE_UPDATED', updated);
    res.json({ success: true, data: updated });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// DELETE remove node
router.delete('/:id', (req, res) => {
  try {
    db.prepare('DELETE FROM nodes WHERE id = ?').run(req.params.id);
    broadcast('NODE_DELETED', { id: req.params.id });
    res.json({ success: true, message: `Node ${req.params.id} deleted` });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
