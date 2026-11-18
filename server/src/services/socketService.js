const { WebSocketServer } = require('ws');
const path = require('node:path');
const fs = require('node:fs');
const { db } = require('../db/database');
const { classifyAudio, CLASS_PROFILES } = require('./soundClassifier');

let wss = null;

function initSocketServer(server) {
  wss = new WebSocketServer({ server, path: '/ws' });

  wss.on('connection', (ws, req) => {
    // Send immediate welcome handshake
    ws.send(JSON.stringify({
      type: 'CONNECTED',
      timestamp: new Date().toISOString(),
      message: 'Connected to Jungle Saathi Real-Time Telemetry & Alert Stream'
    }));

    ws.on('message', async (message) => {
      try {
        let data;
        if (typeof message === 'string') {
          data = JSON.parse(message);
        } else if (Buffer.isBuffer(message)) {
          // Check if it's text or binary
          try {
            data = JSON.parse(message.toString('utf8'));
          } catch {
            data = { type: 'BINARY_CHUNK', buffer: message };
          }
        }

        if (!data || !data.type) return;

        // 1. Heartbeat Ping
        if (data.type === 'PING') {
          ws.send(JSON.stringify({ type: 'PONG', timestamp: new Date().toISOString() }));
          return;
        }

        // 2. Real-time Live Audio Telemetry (Volume RMS & VU meter from phone)
        if (data.type === 'VIRTUAL_NODE_LIVE_TELEMETRY') {
          const { nodeId = 'VIRTUAL-NODE-01', rmsEnergy = 0, micStatus = 'active', streamingStatus = 'streaming' } = data;
          broadcast('VIRTUAL_NODE_AUDIO_ACTIVITY', {
            nodeId,
            rmsEnergy: Number(rmsEnergy),
            micStatus,
            streamingStatus,
            timestamp: new Date().toISOString()
          });
          return;
        }

        // 3. Status updates (start/stop monitoring, battery, gps)
        if (data.type === 'VIRTUAL_NODE_STATUS') {
          const { nodeId = 'VIRTUAL-NODE-01', streamingStatus, micStatus, batteryLevel, lat, lng } = data;
          const now = new Date().toISOString();

          try {
            db.prepare(`
              UPDATE nodes 
              SET mic_status = COALESCE(?, mic_status),
                  battery = COALESCE(?, battery),
                  lat = COALESCE(?, lat),
                  lng = COALESCE(?, lng),
                  last_heartbeat = ?
              WHERE id = ?
            `).run(micStatus || null, batteryLevel || null, lat || null, lng || null, now, nodeId);

            db.prepare(`
              UPDATE virtual_pairing_sessions
              SET streaming_status = COALESCE(?, streaming_status),
                  mic_status = COALESCE(?, mic_status),
                  battery_level = COALESCE(?, battery_level),
                  lat = COALESCE(?, lat),
                  lng = COALESCE(?, lng)
              WHERE node_id = ? AND status = 'paired'
            `).run(streamingStatus || null, micStatus || null, batteryLevel || null, lat || null, lng || null, nodeId);

            const updatedNode = db.prepare('SELECT * FROM nodes WHERE id = ?').get(nodeId);
            broadcast('NODE_UPDATED', updatedNode);
            broadcast('VIRTUAL_NODE_STATUS', {
              nodeId,
              streamingStatus,
              micStatus,
              batteryLevel,
              lat,
              lng,
              timestamp: now
            });
          } catch (e) {
            console.error('[Socket] Status update error:', e.message);
          }
          return;
        }

        // 4. Streamed Audio Chunk from Smartphone Microphone
        if (data.type === 'VIRTUAL_NODE_AUDIO_CHUNK') {
          const {
            nodeId = 'VIRTUAL-NODE-01',
            audioBase64,
            mimeType = 'audio/webm',
            rmsEnergy = 0.5,
            simulatedCategory,
            windowIndex = 0,
            timestamp = new Date().toISOString()
          } = data;

          let audioBuffer = null;
          let filename = `virt-audio-${Date.now()}-${windowIndex}.webm`;
          let audioUrl = '';

          if (audioBase64) {
            try {
              // Strip data URI prefix if present
              const base64Data = audioBase64.replace(/^data:audio\/\w+;base64,/, '');
              audioBuffer = Buffer.from(base64Data, 'base64');

              const uploadDir = path.join(__dirname, '..', '..', 'public', 'uploads');
              fs.mkdirSync(uploadDir, { recursive: true });

              const filePath = path.join(uploadDir, filename);
              fs.writeFileSync(filePath, audioBuffer);
              audioUrl = `/uploads/${filename}`;
            } catch (err) {
              console.error('[Socket] Failed to write audio chunk:', err.message);
            }
          }

          // Run Sound Classification Model
          const classification = classifyAudio({
            filename,
            buffer: audioBuffer,
            sampleName: simulatedCategory || filename
          });

          const matchedClass = classification.matchedClass;
          const confidence = classification.confidence;
          const riskLevel = classification.riskLevel;
          const isAnomalous = ['Critical', 'High', 'Medium'].includes(riskLevel) && !matchedClass.includes('Bird');

          // Update node telemetry
          const now = new Date().toISOString();
          db.prepare(`
            UPDATE nodes 
            SET mic_status = 'active', status = 'online', last_heartbeat = ?
            WHERE id = ?
          `).run(now, nodeId);

          let alertId = null;
          let incidentId = null;
          const eventId = `VAE-${Date.now()}`;

          // If anomalous threat detected, generate Alert and Incident
          if (isAnomalous) {
            const node = db.prepare('SELECT * FROM nodes WHERE id = ?').get(nodeId) || { lat: 29.5340, lng: 78.7660 };
            const alertCount = db.prepare('SELECT COUNT(*) as c FROM alerts').get().c;
            const incCount = db.prepare('SELECT COUNT(*) as c FROM incidents').get().c;
            alertId = `ALT-VIRT-${String(alertCount + 1).padStart(3, '0')}`;
            incidentId = `INC-VIRT-${String(incCount + 1).padStart(3, '0')}`;
            const severity = riskLevel === 'Critical' ? 'critical' : riskLevel === 'High' ? 'high' : 'medium';

            db.prepare(`
              INSERT INTO alerts (id, title, category, severity, source_node, detection_method, confidence, lat, lng, timestamp, description, recommended_action, status, incident_id)
              VALUES (?, ?, ?, ?, ?, 'Smartphone Virtual Node (WebSocket Stream)', ?, ?, ?, ?, ?, ?, 'new', ?)
            `).run(
              alertId,
              `SMARTPHONE AUDIO DETECTED: ${matchedClass}`,
              matchedClass,
              severity,
              nodeId,
              confidence,
              node.lat,
              node.lng,
              now,
              `Live microphone streaming from virtual node ${nodeId} captured acoustic event matching "${matchedClass}" (${confidence}% confidence). Ground verification advised.`,
              CLASS_PROFILES[matchedClass]?.recommendation || 'Listen to captured audio evidence and mobilize ranger patrol.',
              incidentId
            );

            const timeline = JSON.stringify([
              { step: 'Acoustic Audio Stream Capture', time: now, note: `Real-time audio chunk streamed from smartphone ${nodeId} over WebSocket.` },
              { step: 'Edge AI Classification', time: now, note: `Identified ${matchedClass} with ${confidence}% confidence (${riskLevel} risk).` },
              { step: 'Evidence Clip Stored', time: now, note: `Audio evidence saved for forest official verification: ${audioUrl}` }
            ]);

            db.prepare(`
              INSERT INTO incidents (id, alert_id, title, category, severity, source_node, lat, lng, detection_timestamp, ai_classification, ai_confidence, status, evidence_url, problem_identified, timeline)
              VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'new', ?, ?, ?)
            `).run(
              incidentId,
              alertId,
              `VIRTUAL NODE: Suspected ${matchedClass}`,
              matchedClass,
              severity,
              nodeId,
              node.lat,
              node.lng,
              now,
              matchedClass,
              confidence,
              audioUrl,
              `Unusual acoustic event logged via smartphone sentry node. Confidence: ${confidence}%.`,
              timeline
            );

            const createdAlert = db.prepare('SELECT * FROM alerts WHERE id = ?').get(alertId);
            const createdInc = db.prepare('SELECT * FROM incidents WHERE id = ?').get(incidentId);
            broadcast('ALERT_CREATED', createdAlert);
            broadcast('INCIDENT_CREATED', createdInc);
          }

          // Insert into virtual audio events table
          db.prepare(`
            INSERT INTO virtual_audio_events (id, node_id, audio_url, category, confidence, risk_level, timestamp, rms_energy, alert_id, incident_id, verified_status)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending')
          `).run(
            eventId,
            nodeId,
            audioUrl || '/samples/chainsaw_sound.wav',
            matchedClass,
            confidence,
            riskLevel,
            now,
            Number(rmsEnergy),
            alertId,
            incidentId
          );

          const savedEvent = db.prepare('SELECT * FROM virtual_audio_events WHERE id = ?').get(eventId);

          // Broadcast activity to all dashboard clients
          broadcast('VIRTUAL_NODE_AUDIO_ACTIVITY', {
            nodeId,
            windowIndex,
            rmsEnergy: Number(rmsEnergy),
            matchedClass,
            confidence,
            riskLevel,
            isAnomalous,
            audioUrl,
            timestamp: now
          });

          if (isAnomalous) {
            broadcast('VIRTUAL_NODE_AUDIO_DETECTED', {
              event: savedEvent,
              classification,
              alertId,
              incidentId
            });
          }

          // Acknowledge back to the phone
          ws.send(JSON.stringify({
            type: 'AUDIO_CHUNK_ACK',
            windowIndex,
            nodeId,
            matchedClass,
            isAnomalous,
            confidence,
            timestamp: now
          }));
        }

      } catch (err) {
        console.error('[Socket] Message handling error:', err.message);
      }
    });

    ws.on('close', () => {
      // client disconnected
    });
  });

  return wss;
}

function broadcast(eventType, payload) {
  if (!wss) return;
  const message = JSON.stringify({
    type: eventType,
    payload,
    timestamp: new Date().toISOString()
  });

  wss.clients.forEach((client) => {
    if (client.readyState === 1) { // OPEN
      client.send(message);
    }
  });
}

module.exports = {
  initSocketServer,
  broadcast
};
