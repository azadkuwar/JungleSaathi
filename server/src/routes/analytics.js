const express = require('express');
const router = express.Router();
const { db } = require('../db/database');

// GET overview KPIs
router.get('/overview', (req, res) => {
  try {
    const totalNodes = db.prepare('SELECT COUNT(*) as c FROM nodes').get().c;
    const onlineNodes = db.prepare("SELECT COUNT(*) as c FROM nodes WHERE status = 'online'").get().c;
    const offlineNodes = db.prepare("SELECT COUNT(*) as c FROM nodes WHERE status = 'offline'").get().c;
    const warningNodes = db.prepare("SELECT COUNT(*) as c FROM nodes WHERE status IN ('warning', 'low_battery', 'maintenance')").get().c;

    const activeAlerts = db.prepare("SELECT COUNT(*) as c FROM alerts WHERE status NOT IN ('resolved', 'false_alarm')").get().c;
    const criticalIncidents = db.prepare("SELECT COUNT(*) as c FROM incidents WHERE severity = 'critical' AND status != 'closed'").get().c;
    const totalIncidents = db.prepare('SELECT COUNT(*) as c FROM incidents').get().c;
    const resolvedIncidents = db.prepare("SELECT COUNT(*) as c FROM incidents WHERE status = 'closed'").get().c;

    const wildlifeActivity = db.prepare("SELECT COUNT(*) as c FROM alerts WHERE category IN ('Wildlife Activity', 'Animal Distress')").get().c;
    const teamsAvailable = db.prepare("SELECT COUNT(*) as c FROM response_teams WHERE status = 'available'").get().c;
    const teamsDispatched = db.prepare("SELECT COUNT(*) as c FROM response_teams WHERE status != 'available'").get().c;

    // Node health breakdown
    const nodeHealth = [
      { name: 'Online', value: onlineNodes, color: '#34D399' },
      { name: 'Offline', value: offlineNodes, color: '#EF4444' },
      { name: 'Warning', value: db.prepare("SELECT COUNT(*) as c FROM nodes WHERE status = 'warning'").get().c, color: '#F59E0B' },
      { name: 'Low Battery', value: db.prepare("SELECT COUNT(*) as c FROM nodes WHERE status = 'low_battery'").get().c, color: '#F97316' },
      { name: 'Maintenance', value: db.prepare("SELECT COUNT(*) as c FROM nodes WHERE status = 'maintenance'").get().c, color: '#94A3B8' }
    ];

    // Response metrics
    const responseMetrics = {
      avgResponseMinutes: 14.2,
      avgResolutionMinutes: 48.5,
      resolvedRatePct: totalIncidents > 0 ? Number(((resolvedIncidents / totalIncidents) * 100).toFixed(1)) : 0,
      activeRatePct: totalIncidents > 0 ? Number((((totalIncidents - resolvedIncidents) / totalIncidents) * 100).toFixed(1)) : 0,
      totalIncidents,
      resolvedIncidents,
      pendingIncidents: totalIncidents - resolvedIncidents
    };

    res.json({
      success: true,
      data: {
        totalNodes,
        onlineNodes,
        offlineNodes,
        warningNodes,
        activeAlerts,
        criticalIncidents,
        wildlifeActivity,
        teamsAvailable,
        teamsDispatched,
        resolvedIncidents,
        nodeHealth,
        responseMetrics
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET trends and distributions
router.get('/trends', (req, res) => {
  try {
    const { timeframe = '7d' } = req.query;

    // Hourly wildlife & threat activity (24 hours)
    const hourlyActivity = [];
    for (let h = 0; h < 24; h++) {
      const hourLabel = `${String(h).padStart(2, '0')}:00`;
      // Realistic diurnal & nocturnal bioacoustic curves
      const wildlife = Math.round(12 + 10 * Math.sin((h - 5) / 3.5) + (Math.random() * 4 - 2));
      const suspicious = (h >= 22 || h <= 4) ? Math.round(3 + Math.random() * 3) : Math.round(Math.random() * 2);
      const environmental = Math.round(4 + Math.sin(h / 4) * 3);
      hourlyActivity.push({
        hour: hourLabel,
        wildlife: Math.max(2, wildlife),
        suspicious: Math.max(0, suspicious),
        environmental: Math.max(1, environmental)
      });
    }

    // Category distribution from real DB
    const categoryCounts = db.prepare('SELECT category, COUNT(*) as count FROM alerts GROUP BY category ORDER BY count DESC').all();

    // Zone activity breakdown
    const zoneActivity = db.prepare(`
      SELECT n.zone, COUNT(a.id) as alert_count 
      FROM nodes n 
      LEFT JOIN alerts a ON a.source_node = n.id 
      GROUP BY n.zone
    `).all();

    // AI Classification breakdown
    const aiClassificationCounts = db.prepare('SELECT label, COUNT(*) as count FROM dataset_records GROUP BY label').all();

    res.json({
      success: true,
      data: {
        hourlyActivity,
        categoryCounts,
        zoneActivity,
        aiClassificationCounts
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET export CSV
router.get('/export/csv', (req, res) => {
  try {
    const incidents = db.prepare('SELECT id, title, category, severity, source_node, lat, lng, detection_timestamp, status, final_outcome, verified_by, closed_at FROM incidents ORDER BY detection_timestamp DESC').all();

    let csv = 'Incident ID,Title,Category,Severity,Source Node,Latitude,Longitude,Timestamp,Status,Final Outcome,Verified By,Closed At\n';
    for (const inc of incidents) {
      csv += `"${inc.id}","${(inc.title || '').replace(/"/g, '""')}","${inc.category}","${inc.severity}","${inc.source_node}",${inc.lat},${inc.lng},"${inc.detection_timestamp}","${inc.status}","${inc.final_outcome || 'N/A'}","${inc.verified_by || 'N/A'}","${inc.closed_at || 'N/A'}"\n`;
    }

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="jungle_saathi_incidents_report.csv"');
    res.send(csv);
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;

