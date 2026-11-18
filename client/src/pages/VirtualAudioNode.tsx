import React, { useState, useEffect, useRef } from 'react';
import QRCode from 'qrcode';
import { 
  Smartphone, 
  Radio, 
  Wifi, 
  Battery, 
  Mic, 
  MicOff, 
  QrCode, 
  Copy, 
  ExternalLink, 
  RefreshCw, 
  CheckCircle2, 
  AlertTriangle, 
  Play, 
  Square, 
  Upload, 
  MapPin, 
  Volume2, 
  ShieldAlert, 
  Sliders, 
  FileAudio,
  Activity,
  Layers,
  Info,
  Lock,
  Globe,
  Loader2
} from 'lucide-react';
import { VirtualPairingSession, VirtualAudioEvent } from '../types';
import { AudioEvidencePlayer } from '../components/audio/AudioEvidencePlayer';

interface VirtualAudioNodeProps {
  onNavigateToMap?: (nodeId?: string) => void;
  onNavigateToIncidents?: () => void;
}

export const VirtualAudioNode: React.FC<VirtualAudioNodeProps> = ({ 
  onNavigateToMap, 
  onNavigateToIncidents 
}) => {
  const [pairingSession, setPairingSession] = useState<VirtualPairingSession | null>(null);
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState<string>('');
  const [serverInfo, setServerInfo] = useState<{ localIp: string; port: number; mobileUrl: string } | null>(null);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  // HTTPS Tunnel State
  const [tunnelUrl, setTunnelUrl] = useState<string | null>(null);
  const [tunnelLoading, setTunnelLoading] = useState(false);
  const [customUrlInput, setCustomUrlInput] = useState('');
  const [showCustomInput, setShowCustomInput] = useState(false);

  // Audio telemetry & events
  const [audioEvents, setAudioEvents] = useState<VirtualAudioEvent[]>([]);
  const [liveRms, setLiveRms] = useState<number>(0);
  const [streamedWindowsCount, setStreamedWindowsCount] = useState<number>(0);
  const [liveActivityNote, setLiveActivityNote] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadCategory, setUploadCategory] = useState('chainsaw_logging');

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const wsRef = useRef<WebSocket | null>(null);

  // Fetch virtual node info and active pairing session
  const fetchVirtualNodeInfo = async () => {
    try {
      const res = await fetch('/api/virtual-node/info');
      if (res.ok) {
        const resJson = await res.json();
        const info = resJson.data || resJson;

        setServerInfo({
          localIp: info.localIp,
          port: info.port,
          mobileUrl: info.pairingUrlTemplate || info.mobileUrl
        });

        if (info.tunnelUrl) {
          setTunnelUrl(info.tunnelUrl);
        }

        const sess = info.activeSession || info.session;
        if (sess) {
          setPairingSession(sess);
          const targetUrl = info.tunnelUrl
            ? `${info.tunnelUrl}/mobile-node?code=${sess.code}`
            : (sess.pairing_url || sess.pairingUrl || `http://${info.localIp}:${info.port}/mobile-node?code=${sess.code}`);
          generateQRCode(targetUrl);
        } else {
          handleGeneratePairing();
        }
      }
    } catch (err) {
      console.error('Failed to load virtual node info:', err);
    }
  };

  // Fetch audio events
  const fetchAudioEvents = async () => {
    try {
      const res = await fetch('/api/virtual-node/events');
      if (res.ok) {
        const resJson = await res.json();
        const events = Array.isArray(resJson) ? resJson : (resJson.data || []);
        setAudioEvents(events);
      }
    } catch (err) {
      console.error('Failed to fetch virtual audio events:', err);
    }
  };

  // Generate QR Code image
  const generateQRCode = async (text: string) => {
    try {
      const url = await QRCode.toDataURL(text, {
        width: 260,
        margin: 2,
        color: {
          dark: '#0B1511',
          light: '#34D399'
        }
      });
      setQrCodeDataUrl(url);
    } catch (err) {
      console.error('QR code generation failed:', err);
    }
  };

  // Generate a new pairing session
  const handleGeneratePairing = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/virtual-node/generate-pairing', { method: 'POST' });
      if (res.ok) {
        const resJson = await res.json();
        const session = resJson.data || resJson;
        setPairingSession(session);
        if (session.tunnelUrl) {
          setTunnelUrl(session.tunnelUrl);
        }
        const mobileTarget = session.pairingUrl || session.pairing_url || `${window.location.origin}/mobile-node?code=${session.code}`;
        generateQRCode(mobileTarget);
      }
    } catch (err) {
      console.error('Failed to generate pairing session:', err);
    } finally {
      setLoading(false);
    }
  };

  // Start Cloudflare HTTPS Tunnel
  const handleStartTunnel = async () => {
    setTunnelLoading(true);
    try {
      const res = await fetch('/api/virtual-node/tunnel/start', { method: 'POST' });
      const data = await res.json();
      if (res.ok && data.url) {
        setTunnelUrl(data.url);
        // Refresh pairing with the new HTTPS URL
        if (pairingSession?.code) {
          const httpsTarget = `${data.url}/mobile-node?code=${pairingSession.code}`;
          generateQRCode(httpsTarget);
        } else {
          handleGeneratePairing();
        }
      } else {
        alert(data.error || 'Could not launch Cloudflare Tunnel');
      }
    } catch (err: any) {
      alert('Tunnel error: ' + err.message);
    } finally {
      setTunnelLoading(false);
    }
  };

  // Stop Cloudflare HTTPS Tunnel
  const handleStopTunnel = async () => {
    setTunnelLoading(true);
    try {
      await fetch('/api/virtual-node/tunnel/stop', { method: 'POST' });
      setTunnelUrl(null);
      fetchVirtualNodeInfo();
    } catch (err: any) {
      console.error('Error stopping tunnel:', err);
    } finally {
      setTunnelLoading(false);
    }
  };

  // Set Custom HTTPS URL
  const handleSaveCustomUrl = async () => {
    if (!customUrlInput.trim()) return;
    setTunnelLoading(true);
    try {
      const res = await fetch('/api/virtual-node/tunnel/set-url', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: customUrlInput.trim() })
      });
      const data = await res.json();
      if (res.ok && data.url) {
        setTunnelUrl(data.url);
        setShowCustomInput(false);
        if (pairingSession?.code) {
          generateQRCode(`${data.url}/mobile-node?code=${pairingSession.code}`);
        }
      }
    } catch (err: any) {
      alert('Custom URL error: ' + err.message);
    } finally {
      setTunnelLoading(false);
    }
  };

  // WebSocket Live Activity Listener
  useEffect(() => {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.host}/ws`;
    const socket = new WebSocket(wsUrl);
    wsRef.current = socket;

    socket.onmessage = (event) => {
      try {
        const msg = JSON.parse(event.data);
        if (msg.type === 'VIRTUAL_NODE_AUDIO_ACTIVITY') {
          const payload = msg.payload || msg;
          if (payload.rmsEnergy !== undefined) {
            setLiveRms(Math.round(payload.rmsEnergy));
          }
          if (payload.windowIndex !== undefined) {
            setStreamedWindowsCount(payload.windowIndex + 1);
          }
          if (payload.matchedClass) {
            setLiveActivityNote(`${payload.matchedClass} (${payload.confidence || 95}%)`);
          }
        } else if (msg.type === 'TUNNEL_STATUS') {
          const payload = msg.payload || msg;
          if (payload.url) {
            setTunnelUrl(payload.url);
          } else if (payload.status === 'stopped') {
            setTunnelUrl(null);
          }
        } else if (msg.type === 'ALERT_CREATED' || msg.type === 'VIRTUAL_NODE_AUDIO_DETECTED') {
          fetchAudioEvents();
        } else if (msg.type === 'NODE_UPDATED' || msg.type === 'VIRTUAL_NODE_STATUS') {
          fetchVirtualNodeInfo();
        }
      } catch {}
    };

    return () => {
      socket.close();
    };
  }, []);

  // Polling for live status and events every 4s
  useEffect(() => {
    fetchVirtualNodeInfo();
    fetchAudioEvents();

    const interval = setInterval(() => {
      fetchVirtualNodeInfo();
      fetchAudioEvents();
    }, 4000);

    return () => clearInterval(interval);
  }, []);

  const copyPairingCode = () => {
    if (pairingSession?.code) {
      navigator.clipboard.writeText(pairingSession.code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const copyPairingUrl = () => {
    const targetUrl = activeMobileUrl;
    navigator.clipboard.writeText(targetUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Disconnect virtual node
  const handleDisconnect = async () => {
    if (!pairingSession) return;
    try {
      await fetch('/api/virtual-node/disconnect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ node_id: pairingSession.node_id || 'VIRTUAL-NODE-01' })
      });
      fetchVirtualNodeInfo();
    } catch (err) {
      console.error('Failed to disconnect device:', err);
    }
  };

  // Toggle monitoring state remotely
  const handleToggleMonitoring = async (start: boolean) => {
    if (!pairingSession) return;
    try {
      await fetch('/api/virtual-node/update-status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          node_id: pairingSession.node_id,
          streaming_status: start ? 'streaming' : 'idle',
          mic_status: start ? 'active' : 'standby'
        })
      });
      fetchVirtualNodeInfo();
    } catch (err) {
      console.error('Failed to update monitoring status:', err);
    }
  };

  // Handle local audio file upload for classification
  const handleAudioFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append('audio', file);
      formData.append('node_id', pairingSession?.node_id || 'VIRTUAL-NODE-01');
      formData.append('category', uploadCategory);

      const res = await fetch('/api/virtual-node/upload-audio-stream', {
        method: 'POST',
        body: formData
      });

      if (res.ok) {
        await fetchAudioEvents();
      }
    } catch (err) {
      console.error('Failed to upload audio file:', err);
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  // Trigger test sound simulation from dashboard
  const handleSimulateSound = async (category: string) => {
    try {
      const emptyBlob = new Blob(['TEST_AUDIO_SAMPLE'], { type: 'audio/webm' });
      const formData = new FormData();
      formData.append('audio', emptyBlob, `test-${category}-${Date.now()}.webm`);
      formData.append('node_id', pairingSession?.node_id || 'VIRTUAL-NODE-01');
      formData.append('category', category);

      const res = await fetch('/api/virtual-node/upload-audio-stream', {
        method: 'POST',
        body: formData
      });

      if (res.ok) {
        await fetchAudioEvents();
      }
    } catch (err) {
      console.error('Failed to simulate sound:', err);
    }
  };

  const isPaired = pairingSession?.status === 'paired';
  const isStreaming = pairingSession?.streaming_status === 'streaming';
  
  // Active mobile pairing target (prefers HTTPS tunnel for microphone security)
  const activeMobileUrl = tunnelUrl
    ? `${tunnelUrl}/mobile-node?code=${pairingSession?.code || ''}`
    : serverInfo
    ? `http://${serverInfo.localIp}:${serverInfo.port}/mobile-node?code=${pairingSession?.code || ''}`
    : `/mobile-node?code=${pairingSession?.code || ''}`;

  return (
    <div className="space-y-6">
      {/* Top Banner / Hero Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gradient-to-r from-[#14231C] via-[#123B2A] to-[#14231C] p-6 rounded-2xl border border-emerald-900/60 shadow-xl">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400">
              <Smartphone className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
                Smartphone as Virtual IoT Audio Node
                <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 font-mono">
                  PROTOTYPE SENTRY
                </span>
              </h2>
              <p className="text-sm text-neutral-300">
                Turn any smartphone into an active wireless acoustic sentry node (<strong className="text-cyan-300 font-mono">VIRTUAL-NODE-01</strong>) for real-time forest audio capture and AI threat classification.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={fetchVirtualNodeInfo}
            className="px-3.5 py-2 rounded-xl bg-neutral-800/80 hover:bg-neutral-700 text-neutral-300 text-xs font-semibold flex items-center gap-2 border border-neutral-700/50 transition"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Refresh State</span>
          </button>

          <a
            href={activeMobileUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-neutral-950 font-bold text-xs flex items-center gap-2 shadow-lg shadow-emerald-950/50 transition"
          >
            <ExternalLink className="w-4 h-4" />
            <span>Open Phone Terminal</span>
          </a>
        </div>
      </div>

      {/* SECURE HTTPS TUNNEL MANAGEMENT CARD */}
      <div className={`p-4 sm:p-5 rounded-2xl border transition-all shadow-xl ${
        tunnelUrl 
          ? 'bg-gradient-to-r from-emerald-950/80 via-[#14231C] to-emerald-950/80 border-emerald-500/50' 
          : 'bg-[#14231C] border-amber-900/60'
      }`}>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                tunnelUrl ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40' : 'bg-amber-500/20 text-amber-400 border border-amber-500/40'
              }`}>
                <Lock className="w-4 h-4" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-bold text-white">Smartphone HTTPS Security Gateway</h3>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase ${
                    tunnelUrl ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40' : 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                  }`}>
                    {tunnelUrl ? '🔒 HTTPS Tunnel Active' : '⚠️ Local HTTP Only'}
                  </span>
                </div>
                <p className="text-xs text-neutral-400">
                  {tunnelUrl 
                    ? 'Mobile browsers require HTTPS to grant microphone access. Your Cloudflare Tunnel is active with full SSL.'
                    : 'Mobile browsers block microphone access over insecure HTTP. Launch the HTTPS Tunnel so your phone microphone works.'}
                </p>
              </div>
            </div>

            {tunnelUrl && (
              <div className="flex items-center gap-2 pt-1 font-mono text-xs text-cyan-300">
                <Globe className="w-3.5 h-3.5 text-emerald-400" />
                <span className="font-semibold text-white">Active Tunnel URL: </span>
                <span className="underline select-all">{tunnelUrl}</span>
              </div>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {!tunnelUrl ? (
              <button
                type="button"
                onClick={handleStartTunnel}
                disabled={tunnelLoading}
                className="px-4 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-neutral-950 font-bold text-xs flex items-center gap-2 shadow-lg shadow-emerald-950/60 transition disabled:opacity-50"
              >
                {tunnelLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Establishing Cloudflare HTTPS Tunnel...</span>
                  </>
                ) : (
                  <>
                    <Lock className="w-4 h-4" />
                    <span>Launch Cloudflare HTTPS Tunnel</span>
                  </>
                )}
              </button>
            ) : (
              <button
                type="button"
                onClick={handleStopTunnel}
                disabled={tunnelLoading}
                className="px-3.5 py-2 rounded-xl bg-neutral-800 hover:bg-red-950 text-neutral-300 hover:text-red-300 font-semibold text-xs border border-neutral-700 hover:border-red-500/40 transition disabled:opacity-50"
              >
                <span>Stop Tunnel</span>
              </button>
            )}

            <button
              type="button"
              onClick={() => setShowCustomInput(!showCustomInput)}
              className="px-3 py-2 rounded-xl bg-neutral-800/80 hover:bg-neutral-700 text-neutral-300 text-xs font-semibold border border-neutral-700 transition"
            >
              <span>{showCustomInput ? 'Hide' : 'Custom URL'}</span>
            </button>
          </div>
        </div>

        {/* Custom URL Expandable Input */}
        {showCustomInput && (
          <div className="mt-3 pt-3 border-t border-emerald-900/40 flex items-center gap-2">
            <input
              type="text"
              placeholder="e.g. https://my-custom-tunnel.ngrok-free.app"
              value={customUrlInput}
              onChange={(e) => setCustomUrlInput(e.target.value)}
              className="flex-1 bg-[#0B1511] border border-emerald-900/70 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-400 font-mono"
            />
            <button
              type="button"
              onClick={handleSaveCustomUrl}
              disabled={tunnelLoading || !customUrlInput.trim()}
              className="px-3.5 py-2 rounded-xl bg-emerald-500 text-neutral-950 text-xs font-bold transition disabled:opacity-50"
            >
              Apply Custom HTTPS URL
            </button>
          </div>
        )}
      </div>

      {/* Main Grid: Pairing & Status */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: QR Code & Pairing Hub (5 cols) */}
        <div className="lg:col-span-5 bg-[#14231C] rounded-2xl border border-emerald-900/60 p-6 shadow-xl flex flex-col justify-between space-y-6">
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b border-emerald-900/40 pb-3">
              <h3 className="font-bold text-emerald-100 flex items-center gap-2 text-sm">
                <QrCode className="w-4 h-4 text-emerald-400" />
                Wireless Smartphone Pairing Hub
              </h3>
              <span className={`text-[11px] font-mono px-2 py-0.5 rounded-full font-bold uppercase ${
                isPaired ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40' : 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
              }`}>
                {isPaired ? 'Device Connected' : 'Waiting for Smartphone'}
              </span>
            </div>

            <p className="text-xs text-neutral-400 leading-relaxed">
              Scan this QR code with your mobile camera. {tunnelUrl ? 'Generates an encrypted HTTPS link so your mobile browser permits full microphone access.' : 'For live phone microphone access, make sure HTTPS Tunnel is active above.'}
            </p>

            {/* QR Code Canvas Display */}
            <div className="flex flex-col items-center justify-center p-4 bg-[#0B1511] rounded-2xl border border-emerald-900/50 space-y-3">
              {qrCodeDataUrl ? (
                <div className="p-3 bg-emerald-950/60 rounded-xl border border-emerald-500/30 shadow-inner">
                  <img src={qrCodeDataUrl} alt="Pairing QR Code" className="w-48 h-48 rounded-lg shadow-lg" />
                </div>
              ) : (
                <div className="w-48 h-48 flex items-center justify-center text-neutral-500 text-xs font-mono">
                  Generating QR Code...
                </div>
              )}

              {/* Security indicator tag on QR */}
              <div className="flex items-center gap-1.5 text-[11px] font-mono">
                {tunnelUrl ? (
                  <span className="text-emerald-400 font-bold flex items-center gap-1">
                    <Lock className="w-3.5 h-3.5" />
                    <span>HTTPS Secured (Phone Mic Ready)</span>
                  </span>
                ) : (
                  <span className="text-amber-400 font-medium flex items-center gap-1">
                    <AlertTriangle className="w-3.5 h-3.5" />
                    <span>Local HTTP (Click Launch Tunnel above for Phone Mic)</span>
                  </span>
                )}
              </div>

              {/* Pairing Code Box */}
              <div className="w-full flex items-center justify-between bg-[#14231C] px-3.5 py-2.5 rounded-xl border border-emerald-900/60">
                <div>
                  <span className="text-[10px] text-neutral-400 block font-mono">Pairing Security Code:</span>
                  <span className="text-lg font-mono font-bold text-emerald-300 tracking-widest">
                    {pairingSession?.code || 'JS-....'}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={copyPairingCode}
                    className="p-2 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-200 transition"
                    title="Copy pairing code"
                  >
                    {copied ? <CheckCircle2 className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                  </button>
                  <button
                    type="button"
                    onClick={handleGeneratePairing}
                    disabled={loading}
                    className="p-2 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-200 transition disabled:opacity-50"
                    title="Generate fresh code"
                  >
                    <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                  </button>
                </div>
              </div>
            </div>

            {/* Network Direct Link */}
            <div className="bg-[#0B1511] p-3 rounded-xl border border-emerald-900/40 text-xs space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-[10px] text-neutral-500 uppercase tracking-wider block font-mono">Sentry Mobile Pairing Link:</span>
                <button
                  type="button"
                  onClick={copyPairingUrl}
                  className="text-[10px] text-emerald-400 hover:underline flex items-center gap-1 font-mono"
                >
                  <Copy className="w-3 h-3" />
                  <span>Copy URL</span>
                </button>
              </div>
              <div className="flex items-center justify-between gap-2 text-cyan-300 font-mono text-[11px] break-all">
                <span>{activeMobileUrl}</span>
                <a
                  href={activeMobileUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="shrink-0 p-1.5 rounded bg-cyan-950/60 text-cyan-400 hover:text-cyan-200"
                  title="Open test phone view"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>
            </div>
          </div>

          <div className="border-t border-emerald-900/40 pt-4 flex items-center justify-between text-xs text-neutral-400">
            <span>Session expires in: <strong className="text-neutral-200">20 mins</strong></span>
            {isPaired && (
              <button
                type="button"
                onClick={handleDisconnect}
                className="text-red-400 hover:text-red-300 font-semibold underline"
              >
                Disconnect Phone
              </button>
            )}
          </div>
        </div>

        {/* Right Column: Device Telemetry & Live Audio Node Status (7 cols) */}
        <div className="lg:col-span-7 space-y-6">
          {/* Telemetry Status Card */}
          <div className="bg-[#14231C] rounded-2xl border border-emerald-900/60 p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b border-emerald-900/40 pb-3">
              <div className="flex items-center gap-2">
                <Radio className={`w-4 h-4 ${isPaired ? 'text-emerald-400 animate-pulse' : 'text-neutral-500'}`} />
                <h3 className="font-bold text-white text-sm">Virtual Sentry Telemetry (<span className="text-cyan-300 font-mono">VIRTUAL-NODE-01</span>)</h3>
              </div>
              <div className="flex items-center gap-2">
                {onNavigateToMap && (
                  <button
                    type="button"
                    onClick={() => onNavigateToMap('VIRTUAL-NODE-01')}
                    className="px-2.5 py-1 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-cyan-300 text-xs font-semibold flex items-center gap-1.5 border border-cyan-800/40"
                  >
                    <MapPin className="w-3.5 h-3.5" />
                    <span>View on Live Map</span>
                  </button>
                )}
              </div>
            </div>

            {/* Grid of indicators */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="bg-[#0B1511] p-3 rounded-xl border border-emerald-900/40">
                <span className="text-[10px] text-neutral-400 block font-mono uppercase">Device Status</span>
                <span className={`text-xs font-bold capitalize mt-1 block ${
                  isPaired ? 'text-emerald-400' : 'text-amber-400'
                }`}>
                  {isPaired ? 'Active & Paired' : 'Standby / Unpaired'}
                </span>
                <span className="text-[10px] text-neutral-500 block truncate mt-0.5">
                  {pairingSession?.device_name || 'No phone connected'}
                </span>
              </div>

              <div className="bg-[#0B1511] p-3 rounded-xl border border-emerald-900/40">
                <span className="text-[10px] text-neutral-400 block font-mono uppercase">Microphone Sentry</span>
                <div className="flex items-center gap-1.5 mt-1">
                  {isStreaming ? (
                    <>
                      <Mic className="w-3.5 h-3.5 text-red-400 animate-pulse" />
                      <span className="text-xs font-bold text-red-300">Live Listening</span>
                    </>
                  ) : (
                    <>
                      <MicOff className="w-3.5 h-3.5 text-neutral-400" />
                      <span className="text-xs font-bold text-neutral-400">Idle / Muted</span>
                    </>
                  )}
                </div>
                <span className="text-[10px] text-neutral-500 block mt-0.5">WebSocket Streaming</span>
              </div>

              <div className="bg-[#0B1511] p-3 rounded-xl border border-emerald-900/40">
                <span className="text-[10px] text-neutral-400 block font-mono uppercase">Battery Level</span>
                <div className="flex items-center gap-1.5 mt-1">
                  <Battery className="w-4 h-4 text-emerald-400" />
                  <span className="text-xs font-bold text-emerald-300">
                    {pairingSession?.battery_level ? `${pairingSession.battery_level}%` : '88%'}
                  </span>
                </div>
                <span className="text-[10px] text-neutral-500 block mt-0.5">Battery Healthy</span>
              </div>

              <div className="bg-[#0B1511] p-3 rounded-xl border border-emerald-900/40">
                <span className="text-[10px] text-neutral-400 block font-mono uppercase">GPS Location</span>
                <span className="text-xs font-mono font-bold text-cyan-300 mt-1 block truncate">
                  {pairingSession?.lat && pairingSession?.lng 
                    ? `${pairingSession.lat.toFixed(4)}, ${pairingSession.lng.toFixed(4)}`
                    : '29.5340, 78.7660'}
                </span>
                <span className="text-[10px] text-neutral-500 block mt-0.5">Forest Sentry Perimeter</span>
              </div>
            </div>

            {/* LIVE WEBSOCKET AUDIO ACTIVITY MONITOR */}
            <div className="p-4 rounded-xl bg-[#0B1511] border border-emerald-900/50 space-y-2.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Activity className={`w-4 h-4 ${isStreaming ? 'text-emerald-400 animate-pulse' : 'text-neutral-500'}`} />
                  <span className="text-xs font-bold text-emerald-200">Live Phone Acoustic Stream</span>
                </div>
                <div className="flex items-center gap-3 text-xs font-mono">
                  <span className="text-neutral-400">Windows: <strong className="text-emerald-400">{streamedWindowsCount}</strong></span>
                  <span className="text-cyan-300 font-bold">{liveRms}% RMS</span>
                </div>
              </div>

              {/* Dynamic VU Meter Bar */}
              <div className="w-full bg-neutral-900 h-2.5 rounded-full overflow-hidden border border-emerald-950">
                <div 
                  className={`h-full transition-all duration-150 ${
                    liveRms > 70 ? 'bg-red-500' : liveRms > 40 ? 'bg-amber-400' : 'bg-emerald-400'
                  }`}
                  style={{ width: `${isStreaming ? Math.min(100, liveRms * 1.2) : 0}%` }}
                />
              </div>

              {liveActivityNote && (
                <div className="text-[11px] font-mono text-emerald-300 flex items-center justify-between pt-0.5">
                  <span>Last Classified Acoustic Transient:</span>
                  <span className="font-bold text-white bg-emerald-950 px-2 py-0.5 rounded border border-emerald-800">
                    {liveActivityNote}
                  </span>
                </div>
              )}
            </div>

            {/* Remote Command Control Bar */}
            <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleToggleMonitoring(true)}
                  disabled={!isPaired || isStreaming}
                  className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-neutral-950 font-bold text-xs flex items-center gap-2 shadow transition disabled:opacity-40"
                >
                  <Play className="w-3.5 h-3.5 fill-neutral-950" />
                  <span>Start Monitoring</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleToggleMonitoring(false)}
                  disabled={!isPaired || !isStreaming}
                  className="px-4 py-2 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-200 font-semibold text-xs flex items-center gap-2 border border-neutral-700 transition disabled:opacity-40"
                >
                  <Square className="w-3.5 h-3.5" />
                  <span>Pause Stream</span>
                </button>
              </div>

              <div className="text-xs text-neutral-400 font-mono flex items-center gap-2">
                <span className={`w-2 h-2 rounded-full ${isStreaming ? 'bg-red-500 animate-ping' : 'bg-neutral-600'}`} />
                <span>Stream Status: <strong className={isStreaming ? 'text-red-400' : 'text-neutral-400'}>{isStreaming ? 'STREAMING AUDIO (WS)' : 'IDLE'}</strong></span>
              </div>
            </div>
          </div>

          {/* AI Edge Sound Classifier Diagnostic */}
          <div className="bg-[#14231C] rounded-2xl border border-emerald-900/60 p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b border-emerald-900/40 pb-3">
              <h3 className="font-bold text-emerald-100 flex items-center gap-2 text-sm">
                <Activity className="w-4 h-4 text-emerald-400" />
                Edge AI Acoustic Classifier Status
              </h3>
              <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                ACTIVE AI CLASSIFIER
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              <div className="bg-[#0B1511] p-3.5 rounded-xl border border-emerald-900/40 space-y-2">
                <span className="font-semibold text-emerald-300 block">Supported Audio Threat Classes:</span>
                <ul className="space-y-1.5 text-neutral-300">
                  <li className="flex items-center justify-between">
                    <span>🪚 Chainsaw / Illegal Logging</span>
                    <span className="text-[10px] text-red-400 font-mono font-bold">CRITICAL</span>
                  </li>
                  <li className="flex items-center justify-between">
                    <span>💥 Gunshot / Poaching Activity</span>
                    <span className="text-[10px] text-red-400 font-mono font-bold">CRITICAL</span>
                  </li>
                  <li className="flex items-center justify-between">
                    <span>🐅 Wildlife Distress / Carnivore Calls</span>
                    <span className="text-[10px] text-amber-400 font-mono font-bold">HIGH</span>
                  </li>
                  <li className="flex items-center justify-between">
                    <span>🗣️ Human Vocal Distress / Intruder</span>
                    <span className="text-[10px] text-cyan-400 font-mono font-bold">MEDIUM</span>
                  </li>
                </ul>
              </div>

              <div className="bg-[#0B1511] p-3.5 rounded-xl border border-emerald-900/40 space-y-2">
                <span className="font-semibold text-emerald-300 block">Classifier Integrity & Transparency:</span>
                <p className="text-neutral-400 leading-relaxed text-[11px]">
                  Jungle Saathi processes incoming audio windows over real-time WebSockets, computes audio characteristics, and saves audio evidence clips for ranger verification.
                </p>
                <div className="flex items-center gap-1.5 text-[11px] text-emerald-400 pt-1 font-mono">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  <span>Real Audio Chunk Persistence: Active</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* SECTION: AUDIO TESTING & SIMULATION HUB */}
      <div className="bg-[#14231C] rounded-2xl border border-emerald-900/60 p-6 shadow-xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-emerald-900/40 pb-3">
          <div>
            <h3 className="font-bold text-white text-base flex items-center gap-2">
              <FileAudio className="w-5 h-5 text-emerald-400" />
              Audio Testing & Verification Suite
            </h3>
            <p className="text-xs text-neutral-400">
              Upload custom audio files or simulate field acoustic events to test classifier inference and emergency dispatch response.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleAudioFileUpload}
              accept="audio/*,.wav,.mp3,.webm,.ogg"
              className="hidden"
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploading}
              className="px-3.5 py-2 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-200 text-xs font-semibold flex items-center gap-2 border border-neutral-700 transition"
            >
              <Upload className="w-3.5 h-3.5" />
              <span>{isUploading ? 'Analyzing Audio...' : 'Upload Audio File'}</span>
            </button>
          </div>
        </div>

        {/* Quick test buttons */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-1">
          <button
            type="button"
            onClick={() => handleSimulateSound('chainsaw_logging')}
            className="p-3 rounded-xl bg-[#0B1511] hover:bg-red-950/40 border border-red-900/40 hover:border-red-500/50 text-left transition space-y-1"
          >
            <span className="text-red-400 font-bold text-xs block">🪚 Test Chainsaw</span>
            <span className="text-[10px] text-neutral-400 block">Illegal logging acoustic profile</span>
          </button>

          <button
            type="button"
            onClick={() => handleSimulateSound('gunshot_poaching')}
            className="p-3 rounded-xl bg-[#0B1511] hover:bg-amber-950/40 border border-amber-900/40 hover:border-amber-500/50 text-left transition space-y-1"
          >
            <span className="text-amber-400 font-bold text-xs block">💥 Test Gunshot</span>
            <span className="text-[10px] text-neutral-400 block">High-impulse acoustic shock</span>
          </button>

          <button
            type="button"
            onClick={() => handleSimulateSound('tiger_roar_wildlife')}
            className="p-3 rounded-xl bg-[#0B1511] hover:bg-emerald-950/40 border border-emerald-900/40 hover:border-emerald-500/50 text-left transition space-y-1"
          >
            <span className="text-emerald-400 font-bold text-xs block">🐅 Test Tiger Roar</span>
            <span className="text-[10px] text-neutral-400 block">Apex carnivore territorial call</span>
          </button>

          <button
            type="button"
            onClick={() => handleSimulateSound('human_distress')}
            className="p-3 rounded-xl bg-[#0B1511] hover:bg-cyan-950/40 border border-cyan-900/40 hover:border-cyan-500/50 text-left transition space-y-1"
          >
            <span className="text-cyan-400 font-bold text-xs block">🗣️ Test Distress Call</span>
            <span className="text-[10px] text-neutral-400 block">Vocal emergency distress</span>
          </button>
        </div>
      </div>

      {/* SECTION: CAPTURED AUDIO EVIDENCE & CLASSIFICATION LOG */}
      <div className="bg-[#14231C] rounded-2xl border border-emerald-900/60 p-6 shadow-xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-emerald-900/40 pb-3">
          <div>
            <h3 className="font-bold text-white text-base flex items-center gap-2">
              <ShieldAlert className="w-5 h-5 text-emerald-400" />
              Captured Audio Evidence & Incident Verification
            </h3>
            <p className="text-xs text-neutral-400">
              Forest officials can listen to real recorded acoustic evidence before confirming incidents or dispatching rapid response squads.
            </p>
          </div>

          <div className="text-xs text-neutral-400 font-mono">
            Total Captured Recordings: <strong className="text-emerald-400">{audioEvents.length}</strong>
          </div>
        </div>

        {audioEvents.length === 0 ? (
          <div className="text-center py-10 bg-[#0B1511] rounded-xl border border-dashed border-emerald-900/50 p-6 space-y-2">
            <FileAudio className="w-10 h-10 text-emerald-500/40 mx-auto" />
            <h4 className="text-sm font-semibold text-neutral-300">No Audio Evidence Recorded Yet</h4>
            <p className="text-xs text-neutral-500 max-w-md mx-auto">
              Connect your smartphone or click one of the test triggers above to stream environmental audio and record evidence clips.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {audioEvents.map((evt) => (
              <AudioEvidencePlayer
                key={evt.id}
                eventId={evt.id}
                audioUrl={evt.audio_url}
                category={evt.category}
                confidence={evt.confidence}
                nodeId={evt.node_id}
                timestamp={evt.timestamp}
                verifiedStatus={evt.verified_status}
                onVerify={() => {
                  fetchAudioEvents();
                }}
                onViewOnMap={() => {
                  if (onNavigateToMap) onNavigateToMap(evt.node_id);
                }}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
