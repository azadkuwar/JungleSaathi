const express = require('express');
const router = express.Router();
const { db } = require('../db/database');
const { broadcast } = require('../services/socketService');

// GET all gateways
router.get('/', (req, res) => {
  try {
    const gateways = db.prepare('SELECT * FROM gateways ORDER BY id ASC').all();
    
    // Attach connected nodes to each gateway
    const enriched = gateways.map(gw => {
      const connectedNodes = db.prepare('SELECT id, name, zone, status, battery, signal_rssi FROM nodes WHERE gateway_id = ?').all(gw.id);
      return {
        ...gw,
        connected_node_count: connectedNodes.length,
        connected_nodes: connectedNodes
      };
    });

    res.json({ success: true, data: enriched });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET single gateway
router.get('/:id', (req, res) => {
  try {
    const gw = db.prepare('SELECT * FROM gateways WHERE id = ?').get(req.params.id);
    if (!gw) return res.status(404).json({ success: false, error: 'Gateway not found' });

    const connectedNodes = db.prepare('SELECT * FROM nodes WHERE gateway_id = ?').all(gw.id);
    res.json({
      success: true,
      data: {
        ...gw,
        connected_node_count: connectedNodes.length,
        connected_nodes: connectedNodes
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST restart gateway
router.post('/:id/restart', (req, res) => {
  try {
    const now = new Date().toISOString();
    db.prepare(`
      UPDATE gateways
      SET status = 'online', last_communication = ?
      WHERE id = ?
    `).run(now, req.params.id);

    const updated = db.prepare('SELECT * FROM gateways WHERE id = ?').get(req.params.id);
    broadcast('GATEWAY_UPDATED', updated);
    res.json({ success: true, message: `Gateway ${req.params.id} reset and reconnected.`, data: updated });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// PUT update gateway configuration
router.put('/:id', (req, res) => {
  try {
    const { name, zone, frequency_mhz, status } = req.body;
    db.prepare(`
      UPDATE gateways
      SET name = COALESCE(?, name),
          zone = COALESCE(?, zone),
          frequency_mhz = COALESCE(?, frequency_mhz),
          status = COALESCE(?, status)
      WHERE id = ?
    `).run(name, zone, frequency_mhz, status, req.params.id);

    const updated = db.prepare('SELECT * FROM gateways WHERE id = ?').get(req.params.id);
    broadcast('GATEWAY_UPDATED', updated);
    res.json({ success: true, data: updated });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;

