import React, { useState, useEffect, useRef } from 'react';
import { 
  Mic, 
  MicOff, 
  Radio, 
  Wifi, 
  Battery, 
  MapPin, 
  Shield, 
  AlertTriangle, 
  CheckCircle2, 
  Volume2, 
  Play, 
  Square, 
  Upload, 
  Layers, 
  ArrowRight, 
  Info,
  Lock,
  ExternalLink,
  RefreshCw,
  Loader2
} from 'lucide-react';

export const MobileAudioNode: React.FC = () => {
  // Query param parsing for pairing code
  const urlParams = new URLSearchParams(window.location.search);
  const codeFromUrl = urlParams.get('code') || '';

  const [pairingCode, setPairingCode] = useState(codeFromUrl);
  const [deviceName, setDeviceName] = useState(() => {
    const ua = navigator.userAgent;
    if (/android/i.test(ua)) return 'Android Sentry Phone';
    if (/iphone|ipad/i.test(ua)) return 'iPhone Sentry Node';
    return 'Field Smartphone Node';
  });

  const [isPaired, setIsPaired] = useState(false);
  const [nodeId, setNodeId] = useState('VIRTUAL-NODE-01');
  const [isConnecting, setIsConnecting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Security Context
  const isSecure = typeof window !== 'undefined' 
    ? (window.isSecureContext || window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')
    : true;

  // Monitoring & audio state
  const [isMonitoring, setIsMonitoring] = useState(false);
  const [isRequestingMic, setIsRequestingMic] = useState(false);
  const [hasMicPermission, setHasMicPermission] = useState(false);
  const [micLevel, setMicLevel] = useState(0);
  const [batteryLevel, setBatteryLevel] = useState<number | null>(null);
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [locationShared, setLocationShared] = useState(false);
  const [audioChunksSent, setAudioChunksSent] = useState(0);
  const [wsConnected, setWsConnected] = useState(false);
  const [lastDetection, setLastDetection] = useState<{
    category: string;
    confidence: number;
    timestamp: string;
  } | null>(null);

  // References
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const animFrameRef = useRef<number | null>(null);
  const recordingIntervalRef = useRef<any>(null);
  const telemetryIntervalRef = useRef<any>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const windowIndexRef = useRef<number>(0);

  // Auto-pair if code is provided in URL
  useEffect(() => {
    if (codeFromUrl) {
      handlePair(codeFromUrl);
    }
    // Read battery if available
    if ('getBattery' in navigator) {
      (navigator as any).getBattery?.().then((bat: any) => {
        setBatteryLevel(Math.round(bat.level * 100));
        bat.addEventListener('levelchange', () => {
          setBatteryLevel(Math.round(bat.level * 100));
        });
      }).catch(() => {});
    }
  }, [codeFromUrl]);

  // WebSocket Connection Management
  useEffect(() => {
    if (!isPaired) return;

    let socket: WebSocket | null = null;
    let reconnectTimeout: any = null;

    const connectWebSocket = () => {
      try {
        const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
        const wsUrl = `${protocol}//${window.location.host}/ws`;
        socket = new WebSocket(wsUrl);
        wsRef.current = socket;

        socket.onopen = () => {
          setWsConnected(true);
          // Send handshake
          socket?.send(JSON.stringify({
            type: 'VIRTUAL_NODE_STATUS',
            nodeId,
            streamingStatus: isMonitoring ? 'streaming' : 'idle',
            micStatus: hasMicPermission ? 'active' : 'standby',
            batteryLevel: batteryLevel || 85
          }));
        };

        socket.onmessage = (event) => {
          try {
            const msg = JSON.parse(event.data);
            if (msg.type === 'AUDIO_CHUNK_ACK') {
              if (msg.isAnomalous) {
                setLastDetection({
                  category: msg.matchedClass,
                  confidence: msg.confidence || 95,
                  timestamp: new Date().toLocaleTimeString()
                });
              }
            }
          } catch {}
        };

        socket.onclose = () => {
          setWsConnected(false);
          reconnectTimeout = setTimeout(connectWebSocket, 3000);
        };

        socket.onerror = () => {
          setWsConnected(false);
        };
      } catch (err) {
        console.warn('[WS] Error establishing connection:', err);
      }
    };

    connectWebSocket();

    return () => {
      if (reconnectTimeout) clearTimeout(reconnectTimeout);
      if (socket) socket.close();
    };
  }, [isPaired, nodeId]);

  // Clean up on unmount
  useEffect(() => {
    return () => {
      stopMonitoring();
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
      if (recordingIntervalRef.current) clearInterval(recordingIntervalRef.current);
      if (telemetryIntervalRef.current) clearInterval(telemetryIntervalRef.current);
    };
  }, []);

  // Request GPS location
  const handleRequestLocation = () => {
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by your browser.');
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const newCoords = {
          lat: parseFloat(pos.coords.latitude.toFixed(6)),
          lng: parseFloat(pos.coords.longitude.toFixed(6))
        };
        setCoords(newCoords);
        setLocationShared(true);

        // Update server with coordinates via WebSocket or HTTP
        if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
          wsRef.current.send(JSON.stringify({
            type: 'VIRTUAL_NODE_STATUS',
            nodeId,
            lat: newCoords.lat,
            lng: newCoords.lng
          }));
        } else {
          fetch('/api/virtual-node/update-status', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              node_id: nodeId,
              lat: newCoords.lat,
              lng: newCoords.lng
            })
          }).catch(() => {});
        }
      },
      (err) => {
        console.warn('Geolocation denied or failed, using default forest perimeter:', err);
        const defaultCoords = { lat: 29.5340, lng: 78.7660 };
        setCoords(defaultCoords);
        setLocationShared(true);
      },
      { timeout: 8000 }
    );
  };

  // Pair smartphone device
  const handlePair = async (codeToUse?: string) => {
    const code = (codeToUse || pairingCode).trim().toUpperCase();
    if (!code) {
      setErrorMsg('Please enter a 6-character pairing code');
      return;
    }

    setIsConnecting(true);
    setErrorMsg(null);

    try {
      const res = await fetch('/api/virtual-node/pair', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code,
          device_name: deviceName,
          battery_level: batteryLevel || 85,
          lat: coords?.lat || 29.5340,
          lng: coords?.lng || 78.7660
        })
      });

      const resJson = await res.json();
      if (!res.ok) {
        throw new Error(resJson.error || 'Pairing failed. Please check code or generate a new one.');
      }

      const data = resJson.data || resJson;
      setIsPaired(true);
      setNodeId(data.node?.id || data.node_id || 'VIRTUAL-NODE-01');
      handleRequestLocation();
    } catch (err: any) {
      setErrorMsg(err.message || 'Connection error. Ensure laptop and phone are on same network or tunnel.');
    } finally {
      setIsConnecting(false);
    }
  };

  // Robust check for mediaDevices API
  const getMediaDevices = () => {
    if (typeof navigator === 'undefined') return null;
    if (navigator.mediaDevices && typeof navigator.mediaDevices.getUserMedia === 'function') {
      return navigator.mediaDevices;
    }
    return null;
  };

  // Request Microphone and Start Audio Engine
  const startMonitoring = async () => {
    setErrorMsg(null);
    setIsRequestingMic(true);

    // 1. Verify Secure Context & mediaDevices support
    const mediaDevices = getMediaDevices();
    if (!mediaDevices) {
      setIsRequestingMic(false);
      if (!isSecure) {
        setErrorMsg(
          'Microphone blocked: Modern mobile browsers strictly disable microphone access over insecure HTTP. Please open the HTTPS Tunnel link shown on your dashboard (https://...trycloudflare.com).'
        );
      } else {
        setErrorMsg('Microphone API is not supported on this browser or device.');
      }
      return;
    }

    try {
      // 2. Request microphone permission from user
      const stream = await mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: false,
          autoGainControl: true
        }
      });

      mediaStreamRef.current = stream;
      setHasMicPermission(true);

      // 3. Initialize AudioContext and AnalyserNode
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      const audioCtx = new AudioCtx();
      if (audioCtx.state === 'suspended') {
        await audioCtx.resume();
      }
      audioContextRef.current = audioCtx;

      const source = audioCtx.createMediaStreamSource(stream);
      const analyser = audioCtx.createAnalyser();
      analyser.fftSize = 256;
      analyser.smoothingTimeConstant = 0.8;
      source.connect(analyser);
      analyserRef.current = analyser;

      // Update state to monitoring
      setIsMonitoring(true);
      setIsRequestingMic(false);

      // 4. Notify backend of monitoring state
      if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
        wsRef.current.send(JSON.stringify({
          type: 'VIRTUAL_NODE_STATUS',
          nodeId,
          streamingStatus: 'streaming',
          micStatus: 'active',
          batteryLevel: batteryLevel || 85
        }));
      }

      // 5. Start visual VU meter and waveform canvas
      startVUMeterLoop(analyser);

      // 6. Setup continuous audio window capture via WebSocket
      setupWebSocketAudioStreaming(stream);

      // 7. Setup live telemetry ticker (sends VU RMS every 400ms)
      setupTelemetryHeartbeat();

    } catch (err: any) {
      console.error('Microphone error:', err);
      setIsRequestingMic(false);
      setHasMicPermission(false);
      setIsMonitoring(false);

      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        setErrorMsg('Microphone access was denied. Tap the lock/tune icon in your browser address bar and set Microphone to "Allow".');
      } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
        setErrorMsg('No microphone input hardware was detected on this device.');
      } else if (err.name === 'NotReadableError' || err.name === 'TrackStartError') {
        setErrorMsg('Microphone is in use by another application or phone call.');
      } else if (err.name === 'SecurityError') {
        setErrorMsg('Microphone access blocked by browser security. Ensure page is loaded via HTTPS.');
      } else {
        setErrorMsg('Could not access microphone: ' + (err.message || 'Unknown error'));
      }
    }
  };

  // Visual VU Meter and Oscilloscope Animation
  const startVUMeterLoop = (analyser: AnalyserNode) => {
    const dataArray = new Uint8Array(analyser.frequencyBinCount);
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');

    const update = () => {
      if (!analyserRef.current) return;
      analyser.getByteFrequencyData(dataArray);

      // Calculate average RMS volume level (0-100)
      let sum = 0;
      for (let i = 0; i < dataArray.length; i++) {
        sum += dataArray[i];
      }
      const avg = sum / dataArray.length;
      const normalizedLevel = Math.min(100, Math.round((avg / 128) * 100));
      setMicLevel(normalizedLevel);

      // Render oscilloscope bars on phone canvas
      if (canvas && ctx) {
        const width = canvas.width;
        const height = canvas.height;
        ctx.clearRect(0, 0, width, height);

        const barCount = 32;
        const barWidth = width / barCount - 1.5;

        for (let i = 0; i < barCount; i++) {
          const val = dataArray[Math.floor((i / barCount) * dataArray.length)] || 0;
          const barHeight = Math.max(3, (val / 255) * height);
          const x = i * (barWidth + 1.5);
          const y = height - barHeight;

          // Color gradient based on volume
          if (val > 180) {
            ctx.fillStyle = '#EF4444'; // Red peak
          } else if (val > 100) {
            ctx.fillStyle = '#F59E0B'; // Amber moderate
          } else {
            ctx.fillStyle = '#34D399'; // Emerald normal
          }

          ctx.fillRect(x, y, barWidth, barHeight);
        }
      }

      animFrameRef.current = requestAnimationFrame(update);
    };

    update();
  };

  // Setup periodic audio window chunking and WebSocket transmission
  const setupWebSocketAudioStreaming = (stream: MediaStream) => {
    const captureWindow = () => {
      if (!stream.active) return;

      try {
        const mimeType = MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
          ? 'audio/webm;codecs=opus'
          : MediaRecorder.isTypeSupported('audio/webm') 
          ? 'audio/webm' 
          : MediaRecorder.isTypeSupported('audio/mp4') 
          ? 'audio/mp4' 
          : '';

        const recorder = mimeType ? new MediaRecorder(stream, { mimeType }) : new MediaRecorder(stream);
        mediaRecorderRef.current = recorder;
        const recordedBlobs: Blob[] = [];

        recorder.ondataavailable = (e) => {
          if (e.data && e.data.size > 0) {
            recordedBlobs.push(e.data);
          }
        };

        recorder.onstop = () => {
          if (recordedBlobs.length === 0) return;
          const audioBlob = new Blob(recordedBlobs, { type: recorder.mimeType || 'audio/webm' });
          sendAudioChunkOverWebSocket(audioBlob);
        };

        // Capture 3.5 second windows
        recorder.start();
        setTimeout(() => {
          if (recorder.state === 'recording') {
            recorder.stop();
          }
        }, 3500);

      } catch (e) {
        console.warn('MediaRecorder error:', e);
      }
    };

    // Trigger window recording every 4 seconds
    captureWindow();
    recordingIntervalRef.current = setInterval(captureWindow, 4200);
  };

  // Transmit audio chunk to backend via WebSocket transport
  const sendAudioChunkOverWebSocket = (blob: Blob, simulatedCategory?: string) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64Data = reader.result as string;
      const currentIdx = windowIndexRef.current++;

      if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
        wsRef.current.send(JSON.stringify({
          type: 'VIRTUAL_NODE_AUDIO_CHUNK',
          nodeId,
          audioBase64: base64Data,
          mimeType: blob.type || 'audio/webm',
          rmsEnergy: micLevel,
          simulatedCategory,
          windowIndex: currentIdx,
          timestamp: new Date().toISOString()
        }));
        setAudioChunksSent(prev => prev + 1);
      } else {
        // Fallback to HTTP upload if WebSocket is temporarily reconnecting
        uploadAudioBlob(blob, simulatedCategory);
      }
    };
    reader.readAsDataURL(blob);
  };

  // Live telemetry ticker (sends VU volume metrics every 400ms over WebSocket)
  const setupTelemetryHeartbeat = () => {
    telemetryIntervalRef.current = setInterval(() => {
      if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
        wsRef.current.send(JSON.stringify({
          type: 'VIRTUAL_NODE_LIVE_TELEMETRY',
          nodeId,
          rmsEnergy: micLevel,
          micStatus: 'active',
          streamingStatus: 'streaming'
        }));
      }
    }, 400);
  };

  // HTTP fallback chunk upload
  const uploadAudioBlob = async (blob: Blob, forcedCategory?: string) => {
    try {
      const formData = new FormData();
      formData.append('audio', blob, `sentry-${Date.now()}.webm`);
      formData.append('node_id', nodeId);
      formData.append('rms_energy', micLevel.toString());
      if (forcedCategory) {
        formData.append('category', forcedCategory);
      }

      const res = await fetch('/api/virtual-node/upload-audio-stream', {
        method: 'POST',
        body: formData
      });

      if (res.ok) {
        const data = await res.json();
        setAudioChunksSent(prev => prev + 1);
        if (data.classification && data.classification.category !== 'normal_ambient_forest') {
          setLastDetection({
            category: data.classification.category,
            confidence: data.classification.confidence || 0.88,
            timestamp: new Date().toLocaleTimeString()
          });
        }
      }
    } catch (err) {
      console.warn('Audio chunk upload failed:', err);
    }
  };

  // Stop monitoring completely
  const stopMonitoring = () => {
    if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    if (recordingIntervalRef.current) clearInterval(recordingIntervalRef.current);
    if (telemetryIntervalRef.current) clearInterval(telemetryIntervalRef.current);

    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      try {
        mediaRecorderRef.current.stop();
      } catch {}
      mediaRecorderRef.current = null;
    }

    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach(track => {
        track.stop();
      });
      mediaStreamRef.current = null;
    }

    if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
      audioContextRef.current.close().catch(() => {});
      audioContextRef.current = null;
    }

    setIsMonitoring(false);
    setIsRequestingMic(false);
    setMicLevel(0);

    // Clear canvas
    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext('2d');
      if (ctx) ctx.clearRect(0, 0, canvas.width, canvas.height);
    }

    // Notify backend
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({
        type: 'VIRTUAL_NODE_STATUS',
        nodeId,
        streamingStatus: 'idle',
        micStatus: 'standby'
      }));
    } else {
      fetch('/api/virtual-node/update-status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          node_id: nodeId,
          streaming_status: 'idle',
          mic_status: 'standby'
        })
      }).catch(() => {});
    }
  };

  // Disconnect device
  const handleDisconnect = async () => {
    stopMonitoring();
    try {
      await fetch('/api/virtual-node/disconnect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ node_id: nodeId })
      });
    } catch {}
    setIsPaired(false);
    setPairingCode('');
  };

  // Field Scenario Test Button Trigger
  const triggerFieldTestSound = async (category: string) => {
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      const ctx = new AudioCtx();
      const dest = ctx.createMediaStreamDestination();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      if (category.includes('chainsaw')) {
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(140, ctx.currentTime);
      } else if (category.includes('gunshot')) {
        osc.type = 'square';
        osc.frequency.setValueAtTime(800, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.8);
      } else if (category.includes('roar')) {
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(95, ctx.currentTime);
      } else {
        osc.type = 'sine';
        osc.frequency.setValueAtTime(440, ctx.currentTime);
      }

      osc.connect(gain);
      gain.connect(dest);
      osc.start();

      const recorder = new MediaRecorder(dest.stream);
      const chunks: Blob[] = [];

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunks.push(e.data);
      };

      recorder.onstop = () => {
        const blob = new Blob(chunks, { type: 'audio/webm' });
        sendAudioChunkOverWebSocket(blob, category);
        ctx.close();
      };

      recorder.start();
      setTimeout(() => {
        osc.stop();
        recorder.stop();
      }, 1500);

    } catch (e) {
      const emptyBlob = new Blob(['TEST_AUDIO_SAMPLE'], { type: 'text/plain' });
      sendAudioChunkOverWebSocket(emptyBlob, category);
    }
  };

  return (
    <div className="min-h-screen bg-[#0B1511] text-neutral-100 flex flex-col font-sans select-none">
      {/* Mobile Top Header */}
      <header className="bg-[#14231C] border-b border-emerald-900/50 px-4 py-3 flex items-center justify-between sticky top-0 z-30 shadow-lg">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400">
            <Radio className="w-4 h-4 animate-pulse" />
          </div>
          <div>
            <h1 className="text-sm font-bold tracking-wide text-emerald-100">JUNGLE SAATHI</h1>
            <p className="text-[10px] text-emerald-400/80 font-mono flex items-center gap-1.5">
              <span>Smartphone Virtual Node</span>
              {isSecure ? (
                <span className="text-emerald-400 flex items-center gap-0.5 text-[9px] font-bold">
                  <Lock className="w-2.5 h-2.5" /> HTTPS
                </span>
              ) : (
                <span className="text-amber-400 text-[9px] font-bold">
                  HTTP (Insecure)
                </span>
              )}
            </p>
          </div>
        </div>

        {isPaired && (
          <div className="flex items-center gap-2">
            <span className="flex h-2.5 w-2.5 relative">
              <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${isMonitoring ? 'bg-red-400' : 'bg-emerald-400'}`}></span>
              <span className={`relative inline-flex rounded-full h-2.5 w-2.5 ${isMonitoring ? 'bg-red-500' : 'bg-emerald-500'}`}></span>
            </span>
            <span className="text-xs font-mono text-cyan-300 font-semibold">{nodeId}</span>
          </div>
        )}
      </header>

      {/* Main Container */}
      <main className="flex-1 p-4 max-w-md mx-auto w-full space-y-4">
        {/* Security Warning Banner if opened via insecure HTTP */}
        {!isSecure && (
          <div className="p-3.5 rounded-xl bg-amber-950/90 border border-amber-500/60 text-amber-200 text-xs space-y-1.5 shadow-xl">
            <div className="flex items-center gap-2 font-bold text-amber-300">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>Insecure HTTP Connection Detected</span>
            </div>
            <p className="text-[11px] leading-relaxed text-amber-200/90">
              Mobile browsers (Chrome / Safari) strictly block microphone access on insecure local IP links.
              To use your live microphone, open the <strong>HTTPS Tunnel URL</strong> provided on your dashboard.
            </p>
          </div>
        )}

        {/* Error notification banner */}
        {errorMsg && (
          <div className="p-3 rounded-lg bg-red-950/80 border border-red-500/50 text-red-200 text-xs flex items-start gap-2 shadow-lg">
            <AlertTriangle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
            <div className="flex-1 leading-relaxed">{errorMsg}</div>
          </div>
        )}

        {/* SECTION 1: PAIRING INTERFACE (WHEN NOT PAIRED) */}
        {!isPaired ? (
          <div className="bg-[#14231C] rounded-2xl border border-emerald-900/60 p-5 shadow-2xl space-y-5">
            <div className="text-center space-y-1">
              <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center mx-auto text-emerald-400 mb-3 shadow-inner">
                <Radio className="w-7 h-7" />
              </div>
              <h2 className="text-lg font-bold text-emerald-100">Pair Sentry Node</h2>
              <p className="text-xs text-neutral-400">
                Connect this smartphone as a temporary wireless microphone sentry node for Jungle Saathi.
              </p>
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-xs font-medium text-emerald-400/90 block mb-1">
                  6-Character Pairing Code
                </label>
                <input
                  type="text"
                  maxLength={7}
                  placeholder="e.g. JS-7294"
                  value={pairingCode}
                  onChange={(e) => setPairingCode(e.target.value.toUpperCase())}
                  className="w-full bg-[#0B1511] border border-emerald-900/70 rounded-xl px-4 py-3 text-center text-xl font-mono tracking-widest text-emerald-300 focus:outline-none focus:border-emerald-400 transition uppercase"
                />
                <p className="text-[11px] text-neutral-500 mt-1 text-center">
                  Shown on your Jungle Saathi laptop dashboard
                </p>
              </div>

              <div>
                <label className="text-xs font-medium text-neutral-300 block mb-1">
                  Device Identifier Name
                </label>
                <input
                  type="text"
                  value={deviceName}
                  onChange={(e) => setDeviceName(e.target.value)}
                  className="w-full bg-[#0B1511] border border-emerald-900/50 rounded-xl px-3 py-2 text-sm text-neutral-200 focus:outline-none focus:border-emerald-400"
                />
              </div>

              <button
                type="button"
                onClick={() => handlePair()}
                disabled={isConnecting}
                className="w-full py-3.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 active:bg-emerald-600 text-neutral-950 font-bold text-sm tracking-wide flex items-center justify-center gap-2 shadow-lg shadow-emerald-950/50 transition disabled:opacity-50"
              >
                {isConnecting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Connecting to Central Dashboard...</span>
                  </>
                ) : (
                  <>
                    <span>Pair Device Now</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>

            <div className="border-t border-emerald-900/40 pt-3 text-[11px] text-neutral-400 flex items-start gap-2">
              <Info className="w-4 h-4 text-emerald-400/70 shrink-0 mt-0.5" />
              <span>
                Works across local Wi-Fi or securely over the Cloudflare HTTPS Tunnel.
              </span>
            </div>
          </div>
        ) : (
          /* SECTION 2: ACTIVE VIRTUAL NODE CONTROLS (WHEN PAIRED) */
          <div className="space-y-4">
            {/* Status Card */}
            <div className="bg-[#14231C] rounded-2xl border border-emerald-900/60 p-4 shadow-xl space-y-3">
              <div className="flex items-center justify-between border-b border-emerald-900/40 pb-2.5">
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
                  <span className="text-xs font-semibold text-emerald-300 uppercase tracking-wide">
                    Connected to Central Base
                  </span>
                  {wsConnected && (
                    <span className="text-[10px] px-1.5 py-0.2 rounded bg-emerald-950 text-emerald-400 border border-emerald-800 font-mono">
                      WS LIVE
                    </span>
                  )}
                </div>
                <button
                  type="button"
                  onClick={handleDisconnect}
                  className="text-[11px] text-red-400/80 hover:text-red-300 underline font-mono"
                >
                  Disconnect
                </button>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="bg-[#0B1511] p-2.5 rounded-xl border border-emerald-900/40">
                  <span className="text-neutral-400 block text-[10px]">Assigned Node ID</span>
                  <span className="text-cyan-300 font-bold font-mono text-sm">{nodeId}</span>
                </div>
                <div className="bg-[#0B1511] p-2.5 rounded-xl border border-emerald-900/40">
                  <span className="text-neutral-400 block text-[10px]">Device Name</span>
                  <span className="text-neutral-200 font-medium truncate block">{deviceName}</span>
                </div>
                <div className="bg-[#0B1511] p-2.5 rounded-xl border border-emerald-900/40 flex items-center justify-between">
                  <div>
                    <span className="text-neutral-400 block text-[10px]">Battery Status</span>
                    <span className="text-emerald-300 font-semibold">{batteryLevel ? `${batteryLevel}%` : '88% (Good)'}</span>
                  </div>
                  <Battery className="w-4 h-4 text-emerald-400" />
                </div>
                <div className="bg-[#0B1511] p-2.5 rounded-xl border border-emerald-900/40 flex items-center justify-between">
                  <div>
                    <span className="text-neutral-400 block text-[10px]">GPS Coordinates</span>
                    <span className="text-cyan-300 font-mono text-[11px]">
                      {coords ? `${coords.lat.toFixed(4)}, ${coords.lng.toFixed(4)}` : '29.5340, 78.7660'}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={handleRequestLocation}
                    className="p-1 rounded bg-neutral-800 text-cyan-400 hover:bg-neutral-700"
                    title="Refresh GPS"
                  >
                    <MapPin className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>

            {/* Live Audio Visualizer Card */}
            <div className="bg-[#14231C] rounded-2xl border border-emerald-900/60 p-4 shadow-xl space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className={`p-1.5 rounded-lg ${isMonitoring ? 'bg-red-500/20 text-red-400' : 'bg-neutral-800 text-neutral-400'}`}>
                    {isMonitoring ? <Mic className="w-4 h-4 animate-bounce" /> : <MicOff className="w-4 h-4" />}
                  </div>
                  <div>
                    <h3 className="text-xs font-bold text-emerald-100">Live Environmental Sentry</h3>
                    <p className="text-[10px] text-neutral-400">
                      {isMonitoring ? 'Streaming live acoustic data to backend via WebSocket' : 'Microphone monitoring is idle'}
                    </p>
                  </div>
                </div>

                {isMonitoring && (
                  <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-[10px] font-mono font-bold animate-pulse">
                    <Radio className="w-3 h-3" />
                    <span>MICROPHONE ACTIVE</span>
                  </div>
                )}
              </div>

              {/* Oscilloscope Canvas */}
              <div className="bg-[#0B1511] p-2 rounded-xl border border-emerald-900/40">
                <div className="flex items-center justify-between text-[10px] font-mono text-neutral-400 px-1 pb-1">
                  <span>Input Signal Waveform</span>
                  <span className="font-bold text-emerald-400">{isMonitoring ? `${micLevel}% RMS` : '0%'}</span>
                </div>
                <canvas
                  ref={canvasRef}
                  width={320}
                  height={56}
                  className="w-full h-14 rounded"
                />
              </div>

              {/* Start / Stop Big Button with Initialization Feedback */}
              {!isMonitoring ? (
                <button
                  type="button"
                  onClick={startMonitoring}
                  disabled={isRequestingMic}
                  className="w-full py-4 rounded-xl bg-emerald-500 hover:bg-emerald-400 active:bg-emerald-600 text-neutral-950 font-bold text-base flex items-center justify-center gap-2 shadow-lg shadow-emerald-950/60 transition disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {isRequestingMic ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      <span>REQUESTING MICROPHONE PERMISSION...</span>
                    </>
                  ) : (
                    <>
                      <Play className="w-5 h-5 fill-neutral-950" />
                      <span>START MONITORING AUDIO</span>
                    </>
                  )}
                </button>
              ) : (
                <button
                  type="button"
                  onClick={stopMonitoring}
                  className="w-full py-4 rounded-xl bg-red-600 hover:bg-red-500 active:bg-red-700 text-white font-bold text-base flex items-center justify-center gap-2 shadow-lg shadow-red-950/60 transition"
                >
                  <Square className="w-5 h-5 fill-white" />
                  <span>STOP MONITORING</span>
                </button>
              )}

              <div className="flex items-center justify-between text-[11px] text-neutral-400 px-1 pt-1 font-mono">
                <span>Audio Streamed: <strong className="text-emerald-400">{isMonitoring ? audioChunksSent : 0}</strong> windows</span>
                <span>Transport: <strong className="text-cyan-400">WebSocket / WS</strong></span>
              </div>
            </div>

            {/* Last Detection Indicator */}
            {lastDetection && (
              <div className="bg-red-950/70 border border-red-500/50 rounded-2xl p-3.5 text-xs text-red-200 shadow-xl space-y-1">
                <div className="flex items-center justify-between">
                  <span className="font-bold flex items-center gap-1.5 text-red-400">
                    <AlertTriangle className="w-4 h-4" />
                    UNUSUAL SOUND EVENT DETECTED
                  </span>
                  <span className="text-[10px] font-mono text-neutral-400">{lastDetection.timestamp}</span>
                </div>
                <div className="text-sm font-semibold text-white capitalize">{lastDetection.category}</div>
                <div className="text-[11px] text-red-300">
                  AI Confidence: {lastDetection.confidence}% • Streamed to Central Dashboard
                </div>
              </div>
            )}

            {/* Field Acoustic Test Triggers (Explicitly labeled as Synthetic Simulation) */}
            <div className="bg-[#14231C] rounded-2xl border border-emerald-900/60 p-4 shadow-xl space-y-2.5">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold text-emerald-300 flex items-center gap-1.5">
                  <Layers className="w-3.5 h-3.5" />
                  Field Test Sound Triggers
                </h4>
                <span className="text-[10px] text-amber-400/90 font-mono">Synthetic Test Mode</span>
              </div>
              <p className="text-[11px] text-neutral-400 leading-relaxed">
                Benchmark acoustic transient detection without requiring physical chainsaws or guns in the field:
              </p>

              <div className="grid grid-cols-2 gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => triggerFieldTestSound('chainsaw_logging')}
                  className="p-2.5 rounded-xl bg-[#0B1511] hover:bg-red-950/50 border border-red-900/40 hover:border-red-500/50 text-left text-xs font-medium text-neutral-200 transition"
                >
                  <span className="block text-red-400 font-bold">🪚 Chainsaw</span>
                  <span className="text-[10px] text-neutral-400">Illegal logging profile</span>
                </button>

                <button
                  type="button"
                  onClick={() => triggerFieldTestSound('gunshot_poaching')}
                  className="p-2.5 rounded-xl bg-[#0B1511] hover:bg-amber-950/50 border border-amber-900/40 hover:border-amber-500/50 text-left text-xs font-medium text-neutral-200 transition"
                >
                  <span className="block text-amber-400 font-bold">💥 Gunshot</span>
                  <span className="text-[10px] text-neutral-400">Poaching ballistic burst</span>
                </button>

                <button
                  type="button"
                  onClick={() => triggerFieldTestSound('tiger_roar_wildlife')}
                  className="p-2.5 rounded-xl bg-[#0B1511] hover:bg-emerald-950/50 border border-emerald-900/40 hover:border-emerald-500/50 text-left text-xs font-medium text-neutral-200 transition"
                >
                  <span className="block text-emerald-400 font-bold">🐅 Tiger Roar</span>
                  <span className="text-[10px] text-neutral-400">Territorial call</span>
                </button>

                <button
                  type="button"
                  onClick={() => triggerFieldTestSound('human_distress')}
                  className="p-2.5 rounded-xl bg-[#0B1511] hover:bg-cyan-950/50 border border-cyan-900/40 hover:border-cyan-500/50 text-left text-xs font-medium text-neutral-200 transition"
                >
                  <span className="block text-cyan-400 font-bold">🗣️ Human Distress</span>
                  <span className="text-[10px] text-neutral-400">Vocal emergency call</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="text-center p-3 text-[10px] text-neutral-500 font-mono">
        Jungle Saathi Smart Forest Sentry • Edge IoT WebSocket Protocol
      </footer>
    </div>
  );
};
