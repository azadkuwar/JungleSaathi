const express = require('express');
const cors = require('cors');
const http = require('node:http');
const path = require('node:path');
const fs = require('node:fs');

const { db, initSchema } = require('./db/database');
const { seedDatabase } = require('./db/seedData');
const { initSocketServer, broadcast } = require('./services/socketService');

// Ensure database and sample files exist
initSchema();
seedDatabase(false);

const app = express();
const server = http.createServer(app);

// Initialize WebSocket server
initSocketServer(server);

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static demonstration assets
app.use('/samples', express.static(path.join(__dirname, '..', 'public', 'samples')));
app.use('/uploads', express.static(path.join(__dirname, '..', 'public', 'uploads')));

// Mount API routes
app.use('/api/nodes', require('./routes/nodes'));
app.use('/api/gateways', require('./routes/gateways'));
app.use('/api/alerts', require('./routes/alerts'));
app.use('/api/incidents', require('./routes/incidents'));
app.use('/api/teams', require('./routes/teams'));
app.use('/api/rfid', require('./routes/rfid'));
app.use('/api/audio', require('./routes/audio'));
app.use('/api/dataset', require('./routes/dataset'));
app.use('/api/analytics', require('./routes/analytics'));
app.use('/api/simulations', require('./routes/simulations'));
app.use('/api/settings', require('./routes/settings'));
app.use('/api/virtual-node', require('./routes/virtualNode'));

// Serve built client frontend if available
const clientDistPath = path.join(__dirname, '..', '..', 'client', 'dist');
if (fs.existsSync(clientDistPath)) {
  app.use(express.static(clientDistPath));
  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api') || req.path.startsWith('/samples') || req.path.startsWith('/uploads')) {
      return next();
    }
    res.sendFile(path.join(clientDistPath, 'index.html'));
  });
}

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ONLINE',
    system: 'Jungle Saathi Command Platform',
    version: '2.4.1',
    timestamp: new Date().toISOString(),
    database: 'SQLite persistent',
    activeConnections: true
  });
});

// Live Background IoT Sensor Telemetry Simulator
// Slightly varies temperature, humidity, and updates heartbeats so charts stay lively
setInterval(() => {
  try {
    const nodes = db.prepare("SELECT id, status, temperature, humidity, smoke_ppm, battery, signal_rssi FROM nodes WHERE status != 'offline'").all();
    const now = new Date().toISOString();

    for (const node of nodes) {
      // Small sensor jitter
      const tempJitter = Number(((Math.random() - 0.5) * 0.4).toFixed(1));
      const humJitter = Number(((Math.random() - 0.5) * 0.8).toFixed(1));
      const newTemp = Math.max(18, Math.min(44, Number((node.temperature + tempJitter).toFixed(1))));
      const newHum = Math.max(30, Math.min(95, Number((node.humidity + humJitter).toFixed(1))));

      db.prepare(`
        UPDATE nodes
        SET temperature = ?, humidity = ?, last_heartbeat = ?
        WHERE id = ?
      `).run(newTemp, newHum, now, node.id);
    }

    // Broadcast subtle telemetry heartbeat to UI
    broadcast('TELEMETRY_PULSE', { timestamp: now });
  } catch (err) {
    // console.error('Telemetry simulation error:', err.message);
  }
}, 12000);

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`=======================================================`);
  console.log(`🌿 JUNGLE SAATHI BACKEND SERVICE RUNNING ON PORT ${PORT}`);
  console.log(`📡 WebSocket endpoint: ws://localhost:${PORT}/ws`);
  console.log(`💾 SQLite persistent database: jungle_saathi.db`);
  console.log(`🔊 Demo audio samples: http://localhost:${PORT}/samples/`);
  console.log(`=======================================================`);

  // Auto-launch Cloudflare HTTPS Tunnel for Smartphone Microphone Access
  const tunnelService = require('./services/tunnelService');
  tunnelService.startTunnel(PORT).then(url => {
    console.log(`🔒 SECURE HTTPS MOBILE PAIRING URL: ${url}/mobile-node`);
  }).catch(err => {
    console.log(`[Tunnel] Notice: ${err.message}. Can start on-demand from dashboard.`);
  });
});
