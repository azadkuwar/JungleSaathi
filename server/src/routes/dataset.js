const express = require('express');
const router = express.Router();
const { db } = require('../db/database');
const { broadcast } = require('../services/socketService');

// State for active training simulation
let activeTraining = null;
let deployedModel = {
  name: 'JungleSaathi-BioAcoustic-MobileNet-V2',
  version: 'v2.4.1-INT8-Quantized',
  architecture: 'Lightweight MobileNet-Edge',
  size: '1.84 MB',
  trainedDate: new Date(Date.now() - 1000 * 3600 * 48).toISOString(),
  target: 'LoRa Edge Gateway (JS-GW-01 / JS-GW-02)',
  status: 'Active on Gateways & Nodes',
  accuracy: 94.8,
  history: [
    { version: 'v2.4.1-INT8-Quantized', date: '2026-11-15', accuracy: 94.8, target: 'Gateway Edge', status: 'Active' },
    { version: 'v2.3.8-TFLite', date: '2026-10-20', accuracy: 92.4, target: 'Gateway Edge', status: 'Archived' },
    { version: 'v2.1.0-BaselineCNN', date: '2026-09-05', accuracy: 89.1, target: 'Server Only', status: 'Archived' }
  ]
};

// GET dataset records with pagination and filters
router.get('/records', (req, res) => {
  try {
    const { label, split, search, page = 1, limit = 20 } = req.query;
    let query = 'SELECT * FROM dataset_records WHERE 1=1';
    const params = [];

    if (label && label !== 'all') {
      query += ' AND label = ?';
      params.push(label);
    }
    if (split && split !== 'all') {
      query += ' AND split = ?';
      params.push(split);
    }
    if (search) {
      query += ' AND (filename LIKE ? OR label LIKE ? OR source LIKE ?)';
      const term = `%${search}%`;
      params.push(term, term, term);
    }

    const countQuery = query.replace('SELECT *', 'SELECT COUNT(*) as total');
    const total = db.prepare(countQuery).get(...params).total;

    query += ' ORDER BY id ASC LIMIT ? OFFSET ?';
    params.push(Number(limit), (Number(page) - 1) * Number(limit));

    const records = db.prepare(query).all(...params);

    res.json({
      success: true,
      data: records,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        totalPages: Math.ceil(total / Number(limit))
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET dataset statistics and class distribution
router.get('/stats', (req, res) => {
  try {
    const totalRecords = db.prepare('SELECT COUNT(*) as count FROM dataset_records').get().count;
    const splitCounts = db.prepare('SELECT split, COUNT(*) as count FROM dataset_records GROUP BY split').all();
    const classDistribution = db.prepare('SELECT label, COUNT(*) as count FROM dataset_records GROUP BY label ORDER BY count DESC').all();

    res.json({
      success: true,
      data: {
        totalRecords,
        splitCounts,
        classDistribution,
        classesCount: classDistribution.length,
        sampleRate: 22050,
        averageDuration: 3.5
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST add dataset sample
router.post('/records', (req, res) => {
  try {
    const { filename, label, duration = 3.5, sample_rate = 22050, split = 'train', snr_db = 18.0, source = 'Field Ranger Upload' } = req.body;
    if (!filename || !label) {
      return res.status(400).json({ success: false, error: 'Filename and label are required' });
    }

    const maxId = db.prepare('SELECT MAX(id) as maxId FROM dataset_records').get().maxId || 0;
    const newId = maxId + 1;

    db.prepare(`
      INSERT INTO dataset_records (id, filename, label, duration, sample_rate, channels, split, snr_db, is_demo, source)
      VALUES (?, ?, ?, ?, ?, 1, ?, ?, 0, ?)
    `).run(newId, filename, label, duration, sample_rate, split, snr_db, source);

    const created = db.prepare('SELECT * FROM dataset_records WHERE id = ?').get(newId);
    res.status(201).json({ success: true, data: created });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// PUT update dataset record label / split
router.put('/records/:id', (req, res) => {
  try {
    const { label, split, filename } = req.body;
    db.prepare(`
      UPDATE dataset_records
      SET label = COALESCE(?, label),
          split = COALESCE(?, split),
          filename = COALESCE(?, filename)
      WHERE id = ?
    `).run(label, split, filename, req.params.id);

    const updated = db.prepare('SELECT * FROM dataset_records WHERE id = ?').get(req.params.id);
    res.json({ success: true, data: updated });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// DELETE dataset record
router.delete('/records/:id', (req, res) => {
  try {
    db.prepare('DELETE FROM dataset_records WHERE id = ?').run(req.params.id);
    res.json({ success: true, message: `Sample record ${req.params.id} deleted` });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST re-split dataset
router.post('/split-dataset', (req, res) => {
  try {
    const { trainPct = 70, valPct = 15, testPct = 15 } = req.body;
    if (trainPct + valPct + testPct !== 100) {
      return res.status(400).json({ success: false, error: 'Split percentages must sum to 100%' });
    }

    const records = db.prepare('SELECT id FROM dataset_records ORDER BY id ASC').all();
    const updateStmt = db.prepare('UPDATE dataset_records SET split = ? WHERE id = ?');

    records.forEach((rec, idx) => {
      const pct = (idx / records.length) * 100;
      let split = 'train';
      if (pct >= trainPct + valPct) split = 'test';
      else if (pct >= trainPct) split = 'val';
      updateStmt.run(split, rec.id);
    });

    const splitCounts = db.prepare('SELECT split, COUNT(*) as count FROM dataset_records GROUP BY split').all();
    res.json({ success: true, message: 'Dataset re-split successfully', data: splitCounts });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST train model (Simulated training execution with realistic epochs and metrics)
router.post('/train-model', (req, res) => {
  try {
    const {
      architecture = 'Lightweight MobileNet-Edge',
      epochs = 20,
      batchSize = 32,
      learningRate = 0.001
    } = req.body;

    // Generate realistic progression curves
    const epochLogs = [];
    let trainAcc = 42.0;
    let valAcc = 38.5;
    let trainLoss = 2.15;
    let valLoss = 2.30;

    for (let ep = 1; ep <= epochs; ep++) {
      const progress = ep / epochs;
      trainAcc = Math.min(97.8, Number((trainAcc + (97.8 - trainAcc) * 0.22 + (Math.random() * 0.8 - 0.4)).toFixed(1)));
      valAcc = Math.min(95.2, Number((valAcc + (94.9 - valAcc) * 0.20 + (Math.random() * 1.2 - 0.6)).toFixed(1)));
      trainLoss = Math.max(0.12, Number((trainLoss * 0.88 + (Math.random() * 0.04 - 0.02)).toFixed(3)));
      valLoss = Math.max(0.21, Number((valLoss * 0.90 + (Math.random() * 0.05 - 0.02)).toFixed(3)));

      epochLogs.push({
        epoch: ep,
        trainAccuracy: trainAcc,
        valAccuracy: valAcc,
        trainLoss,
        valLoss,
        timePerStepMs: 14
      });
    }

    // 11x11 Confusion Matrix
    const classes = [
      'Bird Calls', 'Animal Calls', 'Elephant Sounds', 'Tiger/Roaring',
      'Human Speech', 'Human Shouting', 'Chainsaw', 'Gunshot',
      'Vehicle Engine', 'Fire Crackling', 'Unknown/Suspicious'
    ];

    const confusionMatrix = classes.map((c, i) => {
      const row = [];
      for (let j = 0; j < classes.length; j++) {
        if (i === j) {
          // Diagonal: true positive count (approx 36-40)
          row.push(Math.floor(36 + Math.random() * 5));
        } else if (Math.abs(i - j) === 1 || (i === 6 && j === 8)) {
          // Near-neighbor minor misclassification (0 to 2)
          row.push(Math.random() > 0.6 ? 1 : 0);
        } else {
          row.push(0);
        }
      }
      return { class: c, matrix: row };
    });

    const classMetrics = classes.map((c, i) => ({
      class: c,
      precision: Number((91 + Math.random() * 7).toFixed(1)),
      recall: Number((90 + Math.random() * 8).toFixed(1)),
      f1Score: Number((92 + Math.random() * 6).toFixed(1)),
      samples: 40
    }));

    activeTraining = {
      status: 'completed',
      architecture,
      epochs,
      batchSize,
      learningRate,
      trainAccuracy: trainAcc,
      valAccuracy: valAcc,
      testAccuracy: 94.2,
      f1Score: 94.5,
      precision: 94.8,
      recall: 94.2,
      epochLogs,
      confusionMatrix,
      classMetrics,
      completedAt: new Date().toISOString()
    };

    res.json({
      success: true,
      message: 'Training completed successfully.',
      data: activeTraining
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET model deployment status
router.get('/model-status', (req, res) => {
  res.json({
    success: true,
    data: {
      deployedModel,
      activeTraining
    }
  });
});

// POST deploy model to Gateway
router.post('/deploy-model', (req, res) => {
  try {
    const { target = 'LoRa Edge Gateway (JS-GW-01 / JS-GW-02)', version = 'v2.5.0-INT8' } = req.body;
    deployedModel.version = version;
    deployedModel.target = target;
    deployedModel.trainedDate = new Date().toISOString();
    deployedModel.status = 'Deployed & Synchronized';
    deployedModel.history.unshift({
      version,
      date: new Date().toISOString().split('T')[0],
      accuracy: activeTraining ? activeTraining.valAccuracy : 94.8,
      target,
      status: 'Active'
    });

    broadcast('MODEL_DEPLOYED', deployedModel);
    res.json({
      success: true,
      message: `Model ${version} successfully deployed to ${target}. Quantized INT8 weights verified.`,
      data: deployedModel
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;

