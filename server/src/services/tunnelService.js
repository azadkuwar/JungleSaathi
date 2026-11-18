const { spawn } = require('node:child_process');
const path = require('node:path');
const fs = require('node:fs');

let tunnelProcess = null;
let currentTunnelUrl = null;
let tunnelStatus = 'stopped'; // 'stopped' | 'starting' | 'running' | 'error'
let tunnelError = null;

const cloudflaredPath = path.join(__dirname, '..', '..', 'bin', 'cloudflared.exe');

/**
 * Starts a Cloudflare Quick Tunnel to expose the local server over HTTPS.
 * @param {number} port Local port (default 5000)
 * @returns {Promise<string>} The public HTTPS URL
 */
function startTunnel(port = 5000) {
  return new Promise((resolve, reject) => {
    if (tunnelProcess && currentTunnelUrl) {
      return resolve(currentTunnelUrl);
    }

    if (!fs.existsSync(cloudflaredPath)) {
      tunnelStatus = 'error';
      tunnelError = 'cloudflared.exe binary not found in server/bin';
      return reject(new Error(tunnelError));
    }

    tunnelStatus = 'starting';
    tunnelError = null;
    console.log(`[Tunnel] Launching Cloudflare Tunnel on http://localhost:${port}...`);

    try {
      tunnelProcess = spawn(
        cloudflaredPath,
        ['tunnel', '--url', `http://localhost:${port}`, '--no-autoupdate'],
        { windowsHide: true }
      );

      let resolved = false;

      const handleOutput = (data) => {
        const text = data.toString();
        // Look for trycloudflare.com URL in output
        const match = text.match(/https:\/\/[a-zA-Z0-9-]+\.trycloudflare\.com/);
        if (match && !resolved) {
          resolved = true;
          currentTunnelUrl = match[0];
          tunnelStatus = 'running';
          console.log(`[Tunnel] ✅ Public HTTPS Tunnel established: ${currentTunnelUrl}`);
          resolve(currentTunnelUrl);
        }
      };

      tunnelProcess.stdout.on('data', handleOutput);
      tunnelProcess.stderr.on('data', handleOutput);

      tunnelProcess.on('error', (err) => {
        console.error('[Tunnel] Process error:', err.message);
        tunnelStatus = 'error';
        tunnelError = err.message;
        if (!resolved) {
          resolved = true;
          reject(err);
        }
      });

      tunnelProcess.on('exit', (code, signal) => {
        console.log(`[Tunnel] Process exited (code: ${code}, signal: ${signal})`);
        tunnelProcess = null;
        currentTunnelUrl = null;
        tunnelStatus = 'stopped';
      });

      // Timeout after 20 seconds
      setTimeout(() => {
        if (!resolved) {
          resolved = true;
          if (currentTunnelUrl) {
            resolve(currentTunnelUrl);
          } else {
            tunnelStatus = 'error';
            tunnelError = 'Timed out waiting for Cloudflare Tunnel URL';
            reject(new Error(tunnelError));
          }
        }
      }, 20000);

    } catch (err) {
      tunnelStatus = 'error';
      tunnelError = err.message;
      reject(err);
    }
  });
}

/**
 * Stops the running tunnel process.
 */
function stopTunnel() {
  if (tunnelProcess) {
    console.log('[Tunnel] Stopping tunnel process...');
    try {
      tunnelProcess.kill('SIGTERM');
    } catch {
      try {
        tunnelProcess.kill('SIGKILL');
      } catch {}
    }
    tunnelProcess = null;
    currentTunnelUrl = null;
    tunnelStatus = 'stopped';
    return true;
  }
  return false;
}

/**
 * Manually set or override the HTTPS URL (e.g. Custom ngrok or Cloudflare domain)
 */
function setCustomUrl(url) {
  if (!url) {
    currentTunnelUrl = null;
    tunnelStatus = 'stopped';
    return null;
  }
  // Ensure it starts with https://
  let cleanUrl = url.trim();
  if (!cleanUrl.startsWith('http://') && !cleanUrl.startsWith('https://')) {
    cleanUrl = `https://${cleanUrl}`;
  }
  currentTunnelUrl = cleanUrl;
  tunnelStatus = 'running';
  return currentTunnelUrl;
}

/**
 * Get current tunnel status and URL
 */
function getStatus() {
  return {
    status: tunnelStatus,
    url: currentTunnelUrl,
    error: tunnelError,
    hasBinary: fs.existsSync(cloudflaredPath)
  };
}

// Clean up child process on parent exit
process.on('exit', () => stopTunnel());
process.on('SIGINT', () => {
  stopTunnel();
  process.exit();
});
process.on('SIGTERM', () => {
  stopTunnel();
  process.exit();
});

module.exports = {
  startTunnel,
  stopTunnel,
  setCustomUrl,
  getStatus,
  getTunnelUrl: () => currentTunnelUrl
};

