const express = require('express');
const router = express.Router();
const { db } = require('../db/database');
const { broadcast } = require('../services/socketService');

// Haversine distance in kilometers
function haversineDistance(lat1, lon1, lat2, lon2) {
  const R = 6371; // Earth's radius in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Number((R * c).toFixed(2));
}

// GET all teams
router.get('/', (req, res) => {
  try {
    const teams = db.prepare('SELECT * FROM response_teams ORDER BY id ASC').all();
    
    // Attach assigned incident details if any
    const enriched = teams.map(t => {
      let incident = null;
      if (t.assigned_incident_id) {
        incident = db.prepare('SELECT id, title, category, severity, lat, lng FROM incidents WHERE id = ?').get(t.assigned_incident_id);
      }
      return { ...t, incident };
    });

    res.json({ success: true, data: enriched });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET single team
router.get('/:id', (req, res) => {
  try {
    const team = db.prepare('SELECT * FROM response_teams WHERE id = ?').get(req.params.id);
    if (!team) return res.status(404).json({ success: false, error: 'Team not found' });

    let incident = null;
    if (team.assigned_incident_id) {
      incident = db.prepare('SELECT * FROM incidents WHERE id = ?').get(team.assigned_incident_id);
    }

    res.json({ success: true, data: { ...team, incident } });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET recommend nearest available team for an incident
router.get('/recommend/:incidentId', (req, res) => {
  try {
    const incident = db.prepare('SELECT * FROM incidents WHERE id = ?').get(req.params.incidentId);
    if (!incident) return res.status(404).json({ success: false, error: 'Incident not found' });

    const teams = db.prepare('SELECT * FROM response_teams').all();
    
    const evaluatedTeams = teams.map(t => {
      const distanceKm = haversineDistance(t.current_lat, t.current_lng, incident.lat, incident.lng);
      // Average off-road forest travel speed: 25 km/h
      const etaMinutes = Math.max(2, Math.round((distanceKm / 25) * 60));
      
      // Determine suitability score based on incident category
      let categoryMatch = false;
      if (incident.category.includes('Fire') && t.name.includes('Fire')) categoryMatch = true;
      if (incident.category.includes('Chainsaw') && (t.name.includes('Patrol') || t.name.includes('Poaching'))) categoryMatch = true;
      if (incident.category.includes('Gunshot') && t.name.includes('Poaching')) categoryMatch = true;
      if (incident.category.includes('Wildlife') && t.name.includes('Wildlife')) categoryMatch = true;
      if (incident.category.includes('Distress') && t.name.includes('Wildlife')) categoryMatch = true;
      if (incident.category.includes('Node') && t.name.includes('Maintenance')) categoryMatch = true;

      return {
        ...t,
        distanceKm,
        etaMinutes,
        isAvailable: t.status === 'available',
        categoryMatch,
        suitabilityScore: (categoryMatch ? 50 : 20) + (t.status === 'available' ? 40 : 0) - (distanceKm * 2)
      };
    });

    evaluatedTeams.sort((a, b) => b.suitabilityScore - a.suitabilityScore);

    res.json({
      success: true,
      data: {
        incident,
        recommendedTeam: evaluatedTeams[0],
        allOptions: evaluatedTeams
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST dispatch team
router.post('/:id/dispatch', (req, res) => {
  try {
    const { incident_id, eta_minutes = 12 } = req.body;
    const team = db.prepare('SELECT * FROM response_teams WHERE id = ?').get(req.params.id);
    if (!team) return res.status(404).json({ success: false, error: 'Team not found' });

    const now = new Date().toISOString();

    db.prepare(`
      UPDATE response_teams
      SET status = 'dispatched', assigned_incident_id = ?, eta_minutes = ?, last_update = ?
      WHERE id = ?
    `).run(incident_id, eta_minutes, now, req.params.id);

    if (incident_id) {
      const incident = db.prepare('SELECT * FROM incidents WHERE id = ?').get(incident_id);
      if (incident) {
        let timeline = [];
        try { timeline = JSON.parse(incident.timeline); } catch (e) {}
        timeline.push({
          step: 'Dispatched to Field',
          time: now,
          note: `${team.name} dispatched. ETA: ${eta_minutes} mins.`
        });

        db.prepare(`
          UPDATE incidents
          SET assigned_team_id = ?, status = 'team_dispatched', timeline = ?
          WHERE id = ?
        `).run(req.params.id, JSON.stringify(timeline), incident_id);
      }
    }

    const updated = db.prepare('SELECT * FROM response_teams WHERE id = ?').get(req.params.id);
    broadcast('TEAM_DISPATCHED', updated);

    res.json({ success: true, message: `Team ${team.name} dispatched successfully.`, data: updated });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST update status
router.post('/:id/status', (req, res) => {
  try {
    const { status, eta_minutes } = req.body;
    const now = new Date().toISOString();

    db.prepare(`
      UPDATE response_teams
      SET status = ?, eta_minutes = COALESCE(?, eta_minutes), last_update = ?
      WHERE id = ?
    `).run(status, eta_minutes, now, req.params.id);

    const updated = db.prepare('SELECT * FROM response_teams WHERE id = ?').get(req.params.id);
    broadcast('TEAM_UPDATED', updated);
    res.json({ success: true, data: updated });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST update location
router.post('/:id/location', (req, res) => {
  try {
    const { lat, lng } = req.body;
    const now = new Date().toISOString();

    db.prepare(`
      UPDATE response_teams
      SET current_lat = ?, current_lng = ?, last_update = ?
      WHERE id = ?
    `).run(lat, lng, now, req.params.id);

    const updated = db.prepare('SELECT * FROM response_teams WHERE id = ?').get(req.params.id);
    broadcast('TEAM_MOVED', updated);
    res.json({ success: true, data: updated });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;

