const express = require('express');
const router = express.Router();
const { db } = require('../db/database');
const { seedDatabase } = require('../db/seedData');
const { broadcast } = require('../services/socketService');

// GET settings
router.get('/', (req, res) => {
  try {
    const rows = db.prepare('SELECT key, value FROM settings').all();
    const settings = {};
    rows.forEach(r => {
      settings[r.key] = r.value;
    });
    res.json({ success: true, data: settings });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// PUT update settings
router.put('/', (req, res) => {
  try {
    const updates = req.body;
    const updateStmt = db.prepare('INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)');

    for (const [key, val] of Object.entries(updates)) {
      updateStmt.run(key, String(val));
    }

    const rows = db.prepare('SELECT key, value FROM settings').all();
    const settings = {};
    rows.forEach(r => { settings[r.key] = r.value; });

    broadcast('SETTINGS_UPDATED', settings);
    res.json({ success: true, message: 'Settings saved successfully', data: settings });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST reset demo data
router.post('/reset-demo-data', (req, res) => {
  try {
    seedDatabase(true);
    broadcast('DEMO_RESET', { message: 'Database reset to default demonstration state' });
    res.json({ success: true, message: 'Demo data has been reset to default state.' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;

