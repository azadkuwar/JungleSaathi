import React, { useState, useRef, useEffect } from 'react';
import { Play, Pause, RotateCcw, Volume2, VolumeX, Download, CheckCircle2, XCircle, AlertTriangle, Radio, ShieldCheck, MapPin } from 'lucide-react';

interface AudioEvidencePlayerProps {
  audioUrl: string;
  category?: string;
  confidence?: number | null;
  nodeId?: string;
  timestamp?: string;
  verifiedStatus?: 'unverified' | 'confirmed' | 'false_alarm';
  eventId?: string;
  onVerify?: (status: 'confirmed' | 'false_alarm') => void;
  onViewOnMap?: (nodeId: string) => void;
  compact?: boolean;
}

export const AudioEvidencePlayer: React.FC<AudioEvidencePlayerProps> = ({
  audioUrl,
  category = 'Unusual Sound Event',
  confidence = 0.88,
  nodeId = 'VIRTUAL-NODE-01',
  timestamp,
  verifiedStatus = 'unverified',
  eventId,
  onVerify,
  onViewOnMap,
  compact = false
}) => {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [volume, setVolume] = useState(0.85);
  const [localStatus, setLocalStatus] = useState(verifiedStatus);
  const [isProcessing, setIsProcessing] = useState(false);

  // Sync prop changes
  useEffect(() => {
    setLocalStatus(verifiedStatus);
  }, [verifiedStatus]);

  // Audio setup
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const onLoadedMetadata = () => {
      setDuration(audio.duration || 0);
    };

    const onTimeUpdate = () => {
      setCurrentTime(audio.currentTime);
    };

    const onEnded = () => {
      setIsPlaying(false);
      setCurrentTime(0);
    };

    audio.addEventListener('loadedmetadata', onLoadedMetadata);
    audio.addEventListener('timeupdate', onTimeUpdate);
    audio.addEventListener('ended', onEnded);

    return () => {
      audio.removeEventListener('loadedmetadata', onLoadedMetadata);
      audio.removeEventListener('timeupdate', onTimeUpdate);
      audio.removeEventListener('ended', onEnded);
    };
  }, [audioUrl]);

  // Animated waveform canvas while playing or static wave
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;
    const width = canvas.width;
    const height = canvas.height;
    const barCount = 42;
    const barWidth = width / barCount - 2;

    const render = () => {
      ctx.clearRect(0, 0, width, height);

      // Generate visual bars
      for (let i = 0; i < barCount; i++) {
        const progress = duration > 0 ? currentTime / duration : 0;
        const currentBarRatio = i / barCount;
        const isPast = currentBarRatio <= progress;

        // Base amplitude curve (simulated envelope with frequency peaks)
        const pseudoFreq = Math.sin((i / barCount) * Math.PI) * 0.7 + Math.sin(i * 0.9) * 0.3;
        let barHeightRatio = Math.max(0.12, Math.abs(pseudoFreq));

        if (isPlaying) {
          // Dynamic jitter when playing
          const dynamicJitter = Math.sin(Date.now() / 120 + i * 0.7) * 0.25;
          barHeightRatio = Math.min(1.0, Math.max(0.15, barHeightRatio + dynamicJitter));
        }

        const barH = barHeightRatio * (height - 8);
        const x = i * (barWidth + 2);
        const y = (height - barH) / 2;

        if (isPast) {
          ctx.fillStyle = localStatus === 'confirmed' ? '#EF4444' : '#34D399';
        } else {
          ctx.fillStyle = '#1D5B40';
        }

        ctx.beginPath();
        ctx.roundRect(x, y, barWidth, barH, 2);
        ctx.fill();
      }

      if (isPlaying) {
        animId = requestAnimationFrame(render);
      }
    };

    render();

    return () => {
      if (animId) cancelAnimationFrame(animId);
    };
  }, [isPlaying, currentTime, duration, localStatus]);

  const togglePlay = () => {
    const audio = audioRef.current;
    if (!audio) return;

    if (isPlaying) {
      audio.pause();
      setIsPlaying(false);
    } else {
      audio.play().then(() => {
        setIsPlaying(true);
      }).catch(err => {
        console.warn('Playback error:', err);
        setIsPlaying(false);
      });
    }
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const audio = audioRef.current;
    if (!audio) return;
    const target = parseFloat(e.target.value);
    audio.currentTime = target;
    setCurrentTime(target);
  };

  const handleReplay = () => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.currentTime = 0;
    setCurrentTime(0);
    audio.play().then(() => setIsPlaying(true)).catch(() => {});
  };

  const toggleMute = () => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.muted = !isMuted;
    setIsMuted(!isMuted);
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    setVolume(val);
    if (audioRef.current) {
      audioRef.current.volume = val;
      audioRef.current.muted = val === 0;
      setIsMuted(val === 0);
    }
  };

  const handleVerifyAction = async (status: 'confirmed' | 'false_alarm') => {
    setIsProcessing(true);
    try {
      if (eventId) {
        await fetch('/api/virtual-node/verify-event', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ eventId, verifiedStatus: status })
        });
      }
      setLocalStatus(status);
      if (onVerify) onVerify(status);
    } catch (err) {
      console.error('Failed to verify event:', err);
    } finally {
      setIsProcessing(false);
    }
  };

  const formatTime = (secs: number) => {
    if (isNaN(secs) || secs < 0) return '0:00';
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  const getStatusBadge = () => {
    if (localStatus === 'confirmed') {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-red-950/80 border border-red-500/50 text-red-300">
          <AlertTriangle className="w-3.5 h-3.5 text-red-400" />
          CONFIRMED THREAT (DISPATCHED)
        </span>
      );
    }
    if (localStatus === 'false_alarm') {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-950/80 border border-emerald-500/40 text-emerald-300">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
          VERIFIED FALSE ALARM
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-950/70 border border-amber-500/40 text-amber-300 animate-pulse">
        <Radio className="w-3.5 h-3.5 text-amber-400" />
        AWAITING FOREST OFFICIAL VERIFICATION
      </span>
    );
  };

  return (
    <div className={`rounded-xl border border-emerald-900/60 bg-[#14231C]/95 p-4 shadow-xl text-neutral-100 ${compact ? 'space-y-2.5' : 'space-y-4'}`}>
      {/* Hidden HTML5 audio element */}
      <audio ref={audioRef} src={audioUrl} preload="metadata" />

      {/* Header Info */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-emerald-900/40 pb-3">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
            <Radio className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h4 className="font-semibold text-emerald-100 text-sm tracking-wide">{category}</h4>
              {confidence !== null && confidence !== undefined && (
                <span className="text-[11px] px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-mono font-medium">
                  AI Conf: {(confidence * 100).toFixed(0)}%
                </span>
              )}
            </div>
            <div className="flex items-center gap-3 text-xs text-neutral-400 mt-0.5 font-mono">
              <span>Node: <strong className="text-cyan-300">{nodeId}</strong></span>
              {timestamp && <span>{new Date(timestamp).toLocaleTimeString()}</span>}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {getStatusBadge()}
        </div>
      </div>

      {/* Audio Waveform Canvas */}
      <div className="bg-[#0B1511] rounded-lg p-2.5 border border-emerald-900/40 flex flex-col gap-1.5">
        <div className="flex items-center justify-between text-[11px] text-neutral-400 font-mono px-1">
          <span>{formatTime(currentTime)}</span>
          <span className="text-emerald-400 font-medium">Captured Sentry Audio Evidence</span>
          <span>{duration > 0 ? formatTime(duration) : '0:05'}</span>
        </div>
        
        <canvas
          ref={canvasRef}
          width={360}
          height={48}
          className="w-full h-12 rounded cursor-pointer"
          onClick={togglePlay}
        />

        {/* Scrubber slider */}
        <input
          type="range"
          min={0}
          max={duration || 10}
          step={0.05}
          value={currentTime}
          onChange={handleSeek}
          className="w-full h-1.5 bg-neutral-800 rounded-lg appearance-none cursor-pointer accent-emerald-400"
        />
      </div>

      {/* Playback Controls Bar */}
      <div className="flex items-center justify-between gap-3 pt-1">
        <div className="flex items-center gap-2">
          {/* Play/Pause */}
          <button
            type="button"
            onClick={togglePlay}
            className="w-10 h-10 rounded-full bg-emerald-500 hover:bg-emerald-400 text-neutral-950 flex items-center justify-center shadow-lg transition active:scale-95"
            title={isPlaying ? 'Pause' : 'Play Audio Clip'}
          >
            {isPlaying ? <Pause className="w-5 h-5 fill-neutral-950" /> : <Play className="w-5 h-5 fill-neutral-950 ml-0.5" />}
          </button>

          {/* Replay */}
          <button
            type="button"
            onClick={handleReplay}
            className="w-8 h-8 rounded-lg bg-neutral-800/80 hover:bg-neutral-700 text-neutral-300 flex items-center justify-center transition"
            title="Replay from start"
          >
            <RotateCcw className="w-4 h-4" />
          </button>

          {/* Mute toggle & volume slider */}
          <div className="flex items-center gap-1.5 ml-2 text-neutral-400">
            <button
              type="button"
              onClick={toggleMute}
              className="p-1 hover:text-emerald-400 transition"
              title={isMuted ? 'Unmute' : 'Mute'}
            >
              {isMuted ? <VolumeX className="w-4 h-4 text-red-400" /> : <Volume2 className="w-4 h-4" />}
            </button>
            <input
              type="range"
              min={0}
              max={1}
              step={0.05}
              value={isMuted ? 0 : volume}
              onChange={handleVolumeChange}
              className="w-16 h-1 bg-neutral-800 rounded appearance-none accent-emerald-400"
            />
          </div>
        </div>

        {/* Right action tools: Download & Map */}
        <div className="flex items-center gap-2">
          {onViewOnMap && (
            <button
              type="button"
              onClick={() => onViewOnMap(nodeId)}
              className="px-2.5 py-1.5 rounded-lg bg-neutral-800/80 hover:bg-neutral-700 text-cyan-300 text-xs font-medium flex items-center gap-1.5 border border-cyan-800/30 transition"
              title="Pinpoint location on Live Map"
            >
              <MapPin className="w-3.5 h-3.5" />
              <span>Map</span>
            </button>
          )}

          <a
            href={audioUrl}
            download={`jungle-saathi-evidence-${nodeId}-${Date.now()}.wav`}
            className="px-2.5 py-1.5 rounded-lg bg-neutral-800/80 hover:bg-neutral-700 text-neutral-300 text-xs font-medium flex items-center gap-1.5 border border-neutral-700/40 transition"
            title="Download audio recording"
          >
            <Download className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Save Clip</span>
          </a>
        </div>
      </div>

      {/* Official Verification Action Row */}
      {localStatus === 'unverified' && (
        <div className="border-t border-emerald-900/40 pt-3 flex flex-col sm:flex-row items-center justify-between gap-2.5 bg-emerald-950/30 p-2.5 rounded-lg">
          <div className="text-xs text-neutral-300">
            <span className="font-semibold text-emerald-400">Forest Official Action: </span>
            Listen carefully before taking field action.
          </div>
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button
              type="button"
              disabled={isProcessing}
              onClick={() => handleVerifyAction('confirmed')}
              className="flex-1 sm:flex-none px-3 py-1.5 rounded-lg bg-red-600 hover:bg-red-500 active:bg-red-700 text-white text-xs font-semibold flex items-center justify-center gap-1.5 shadow transition disabled:opacity-50"
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              Confirm Threat
            </button>
            <button
              type="button"
              disabled={isProcessing}
              onClick={() => handleVerifyAction('false_alarm')}
              className="flex-1 sm:flex-none px-3 py-1.5 rounded-lg bg-neutral-800 hover:bg-neutral-700 active:bg-neutral-900 text-neutral-300 text-xs font-semibold flex items-center justify-center gap-1.5 border border-neutral-700 transition disabled:opacity-50"
            >
              <XCircle className="w-3.5 h-3.5" />
              False Alarm
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

