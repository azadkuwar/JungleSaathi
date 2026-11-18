const express = require('express');
const router = express.Router();
const {
  SCENARIOS,
  startSimulation,
  stopSimulation,
  stepForward,
  resetSimulation,
  getSimulationState
} = require('../services/simulationEngine');

// GET list of all scenarios
router.get('/scenarios', (req, res) => {
  const scenarioList = Object.values(SCENARIOS).map(s => ({
    id: s.id,
    name: s.name,
    category: s.category,
    nodeId: s.nodeId,
    teamId: s.teamId,
    totalSteps: s.steps.length,
    steps: s.steps
  }));
  res.json({ success: true, data: scenarioList });
});

// GET current simulation state
router.get('/status', (req, res) => {
  res.json({ success: true, data: getSimulationState() });
});

// POST start simulation
router.post('/start', (req, res) => {
  try {
    const { scenarioId = 'chainsaw_poaching', autoPlay = true, intervalMs = 2800 } = req.body;
    const state = startSimulation(scenarioId, autoPlay, intervalMs);
    res.json({ success: true, message: `Started scenario: ${scenarioId}`, data: state });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST step forward manually
router.post('/step', (req, res) => {
  try {
    const state = stepForward();
    res.json({ success: true, data: state });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST stop/pause
router.post('/stop', (req, res) => {
  stopSimulation();
  res.json({ success: true, message: 'Simulation paused', data: getSimulationState() });
});

// POST reset simulation
router.post('/reset', (req, res) => {
  try {
    const state = resetSimulation();
    res.json({ success: true, message: 'Simulation reset to baseline', data: state });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;

