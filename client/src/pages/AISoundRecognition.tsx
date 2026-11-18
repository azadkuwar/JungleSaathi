import React, { useState, useRef, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import {
  Mic,
  MicOff,
  Upload,
  Play,
  Pause,
  RotateCcw,
  ShieldAlert,
  Volume2,
  Activity,
  CheckCircle2,
  FileCheck,
  AlertTriangle,
  Radio,
  ExternalLink,
  Info
} from 'lucide-react';

export const AISoundRecognition: React.FC = () => {
  const { nodes, setActiveTab, setSelectedIncidentId, refreshData } = useApp();

  const [selectedNodeId, setSelectedNodeId] = useState('JS-NODE-01');
  const [selectedSample, setSelectedSample] = useState<string>('chainsaw_sound.wav');
  const [isPlaying, setIsPlaying] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [audioUrl, setAudioUrl] = useState<string>('/samples/chainsaw_sound.wav');
  const [classificationResult, setClassificationResult] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [micGranted, setMicGranted] = useState(false);

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const spectrogramCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const animFrameRef = useRef<number | null>(null);

  const samples = [
    { id: 'chainsaw_sound.wav', label: 'Chainsaw Sound', category: 'Chainsaw-like Sounds', risk: 'Critical', desc: 'Two-stroke engine high rpm sawing' },
    { id: 'gunshot_sound.wav', label: 'Gunshot Muzzle Blast', category: 'Gunshot-like Sounds', risk: 'Critical', desc: 'Impulse blast & reverberation decay' },
    { id: 'tiger_roar.wav', label: 'Bengal Tiger Roar', category: 'Tiger/Roaring Sounds', risk: 'Low', desc: 'Guttural territorial growl and resonance' },
    { id: 'elephant_sounds.wav', label: 'Elephant Trumpet', category: 'Elephant Sounds', risk: 'Low', desc: 'Infrasound rumble + brassy call' },
    { id: 'fire_crackling.wav', label: 'Fire Crackling', category: 'Fire Crackling', risk: 'Critical', desc: 'Timber combustion snaps & ember roar' },
    { id: 'human_shouting.wav', label: 'Human Shouting/Distress', category: 'Human Shouting/Distress Calls', risk: 'High', desc: 'Urgent vocal frequency spikes' },
    { id: 'bird_calls.wav', label: 'Canopy Bird Calls', category: 'Bird Calls', risk: 'Normal', desc: 'High-frequency chirps (2-5 kHz)' },
    { id: 'animal_calls.wav', label: 'Deer/Primate Alarm Call', category: 'Animal Calls', risk: 'Normal', desc: 'Bioacoustic chatter & alarm' },
    { id: 'human_speech.wav', label: 'Human Speech', category: 'Human Speech', risk: 'Medium', desc: 'Conversational formants in core zone' },
    { id: 'vehicle_engine.wav', label: 'Vehicle Diesel Engine', category: 'Vehicle Engine Sounds', risk: 'Medium', desc: 'Low-frequency diesel idle rumble' },
    { id: 'unknown_suspicious.wav', label: 'Stealth Intrusion / Unknown', category: 'Unknown/Suspicious Sounds', risk: 'Medium', desc: 'Footsteps on dry brush & metallic clink' }
  ];

  // Perform classification
  const runClassification = async (fileOrSampleName: string, blob?: Blob) => {
    setIsLoading(true);
    try {
      let res;
      if (blob) {
        const formData = new FormData();
        formData.append('audio', blob, 'recorded_audio.wav');
        formData.append('nodeId', selectedNodeId);
        res = await fetch('/api/audio/classify', { method: 'POST', body: formData }).then(r => r.json());
      } else {
        const formData = new FormData();
        formData.append('sampleName', fileOrSampleName);
        formData.append('nodeId', selectedNodeId);
        res = await fetch('/api/audio/classify', { method: 'POST', body: formData }).then(r => r.json());
      }

      if (res.success) {
        setClassificationResult(res.data);
      }
    } catch (err) {
      console.error('Classification error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  // Run initial classification on mount
  useEffect(() => {
    runClassification(selectedSample);
  }, []);

  // Handle sample change
  const handleSampleChange = (sampleFile: string) => {
    setSelectedSample(sampleFile);
    const newUrl = `/samples/${sampleFile}`;
    setAudioUrl(newUrl);
    if (audioRef.current) {
      audioRef.current.pause();
      setIsPlaying(false);
      audioRef.current.src = newUrl;
      audioRef.current.load();
    }
    runClassification(sampleFile);
  };

  // Handle Audio Play/Pause
  const togglePlay = () => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current.play().then(() => setIsPlaying(true)).catch(console.error);
    }
  };

  // Draw Waveform and Spectrogram Visualizers
  useEffect(() => {
    const canvas = canvasRef.current;
    const specCanvas = spectrogramCanvasRef.current;
    if (!canvas || !specCanvas) return;

    const ctx = canvas.getContext('2d');
    const specCtx = specCanvas.getContext('2d');
    if (!ctx || !specCtx) return;

    // Draw static or animated waveform
    const waveform = classificationResult?.waveform || Array.from({ length: 64 }, () => Math.random() * 0.4 + 0.1);
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.strokeStyle = '#34D399';
    ctx.lineWidth = 2;
    ctx.beginPath();

    const sliceWidth = canvas.width / waveform.length;
    let x = 0;
    for (let i = 0; i < waveform.length; i++) {
      const v = isPlaying ? waveform[i] * (0.8 + Math.random() * 0.4) : waveform[i];
      const y = (1 - v) * (canvas.height / 2);
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
      x += sliceWidth;
    }
    ctx.stroke();

    // Draw Mel Spectrogram Heatmap
    const melData = classificationResult?.melSpectrogram;
    if (melData && melData.length > 0) {
      specCtx.clearRect(0, 0, specCanvas.width, specCanvas.height);
      const rows = melData.length;
      const cols = melData[0].length;
      const cellW = specCanvas.width / cols;
      const cellH = specCanvas.height / rows;

      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          const val = melData[r][c];
          // Gradient from dark green -> emerald -> amber -> red
          const redVal = Math.floor(val * 240);
          const greenVal = Math.floor(val > 0.5 ? 200 : val * 400);
          const blueVal = Math.floor(100 * (1 - val));
          specCtx.fillStyle = `rgb(${redVal}, ${greenVal}, ${blueVal})`;
          specCtx.fillRect(c * cellW, (rows - 1 - r) * cellH, cellW + 1, cellH + 1);
        }
      }
    }
  }, [classificationResult, isPlaying]);

  // Handle Browser Microphone Recording
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      setMicGranted(true);
      const recorder = new MediaRecorder(stream);
      mediaRecorderRef.current = recorder;
      audioChunksRef.current = [];

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) audioChunksRef.current.push(e.data);
      };

      recorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/wav' });
        const localUrl = URL.createObjectURL(audioBlob);
        setAudioUrl(localUrl);
        if (audioRef.current) {
          audioRef.current.src = localUrl;
        }
        runClassification('recorded_mic_sample.wav', audioBlob);
      };

      recorder.start();
      setIsRecording(true);
    } catch (err) {
      alert('Microphone access denied or unavailable in this browser.');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
      setIsRecording(false);
    }
  };

  // Create Incident from AI Detection
  const handleCreateIncident = async () => {
    if (!classificationResult) return;
    try {
      const res = await fetch('/api/audio/create-incident-from-detection', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          classification: classificationResult.matchedClass,
          confidence: classificationResult.confidence,
          riskLevel: classificationResult.riskLevel,
          nodeId: selectedNodeId,
          lat: classificationResult.node?.lat || 29.5385,
          lng: classificationResult.node?.lng || 78.7610,
          audioUrl,
          notes: `Acoustic detection via node ${selectedNodeId}. Recommended: ${classificationResult.recommendedAction}`
        })
      }).then(r => r.json());

      if (res.success) {
        refreshData();
        setSelectedIncidentId(res.data.incident.id);
        setActiveTab('dispatch');
      }
    } catch (e) {
      console.error(e);
    }
  };

  const selectedNode = nodes.find(n => n.id === selectedNodeId) || nodes[0];

  return (
    <div className="p-4 sm:p-6 space-y-6 max-w-[1600px] mx-auto">
      {/* Hidden Audio Player */}
      <audio
        ref={audioRef}
        src={audioUrl}
        onEnded={() => setIsPlaying(false)}
        className="hidden"
      />

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-white tracking-wide">
              AI Edge Audio Recognition & Bioacoustic Sentry
            </h1>
            <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-forest-primary text-forest-accent border border-forest-border">
              MobileNet-Edge INT8
            </span>
          </div>
          <p className="text-xs text-forest-muted">
            Continuous forest sound recognition classifying illegal chainsaws, gunshots, predator roars & distress vocalizations
          </p>
        </div>

        {/* Source Node Selector */}
        <div className="flex items-center gap-2 bg-forest-card px-3 py-1.5 rounded-xl border border-forest-border text-xs">
          <Radio className="w-4 h-4 text-forest-accent" />
          <span className="text-forest-muted">Acoustic Sentry Node:</span>
          <select
            value={selectedNodeId}
            onChange={(e) => setSelectedNodeId(e.target.value)}
            className="bg-forest-darkest text-white border border-forest-border rounded-lg px-2 py-1 focus:outline-none focus:border-forest-accent font-semibold"
          >
            {nodes.map(n => (
              <option key={n.id} value={n.id}>
                {n.id} - {n.name} ({n.zone})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Main Two-Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Sample Selector, Mic & Visualizers (7 Cols) */}
        <div className="lg:col-span-7 space-y-5">
          {/* Sample Selector Card */}
          <div className="p-5 rounded-2xl bg-forest-card border border-forest-border space-y-4 shadow-lg">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
                <Volume2 className="w-4 h-4 text-forest-accent" />
                Select Audio Signature to Analyze
              </span>
              <span className="text-[11px] font-mono text-forest-muted">11 Sound Classes</span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {samples.map((s) => {
                const isSelected = selectedSample === s.id;
                return (
                  <button
                    key={s.id}
                    onClick={() => handleSampleChange(s.id)}
                    className={`p-2.5 rounded-xl text-left border transition-all text-xs flex flex-col justify-between ${
                      isSelected
                        ? 'bg-forest-primary border-forest-accent text-white shadow-md shadow-emerald-950/40'
                        : 'bg-forest-darkest/60 border-forest-border text-forest-muted hover:text-white hover:bg-forest-cardHover'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-bold text-[11px] truncate">{s.label}</span>
                      <span className={`w-1.5 h-1.5 rounded-full ${s.risk === 'Critical' ? 'bg-red-400' : s.risk === 'High' ? 'bg-amber-400' : 'bg-emerald-400'}`} />
                    </div>
                    <span className="text-[9px] text-forest-muted/70 truncate">{s.desc}</span>
                  </button>
                );
              })}
            </div>

            {/* Audio Controls Bar */}
            <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-forest-border/60">
              <div className="flex items-center gap-2">
                <button
                  onClick={togglePlay}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl bg-forest-accent hover:bg-forest-accentHover text-forest-darkest font-bold text-xs transition-colors shadow-md shadow-emerald-950/40"
                >
                  {isPlaying ? <Pause className="w-4 h-4 fill-current" /> : <Play className="w-4 h-4 fill-current" />}
                  <span>{isPlaying ? 'Pause Audio' : 'Play Audio'}</span>
                </button>

                {/* Microphone Recording Button */}
                {isRecording ? (
                  <button
                    onClick={stopRecording}
                    className="flex items-center gap-2 px-4 py-2 rounded-xl bg-red-600 hover:bg-red-500 text-white font-bold text-xs animate-pulse transition-colors"
                  >
                    <MicOff className="w-4 h-4" />
                    <span>Stop Recording</span>
                  </button>
                ) : (
                  <button
                    onClick={startRecording}
                    className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-forest-darkest hover:bg-forest-cardHover border border-forest-border text-forest-muted hover:text-white text-xs font-semibold transition-colors"
                  >
                    <Mic className="w-4 h-4 text-forest-accent" />
                    <span>Live Mic Record</span>
                  </button>
                )}
              </div>

              {/* Upload Custom Audio File */}
              <label className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-forest-darkest hover:bg-forest-cardHover border border-forest-border text-forest-muted hover:text-white text-xs font-semibold cursor-pointer transition-colors">
                <Upload className="w-4 h-4 text-forest-accent" />
                <span>Upload WAV / MP3</span>
                <input
                  type="file"
                  accept="audio/*"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      const url = URL.createObjectURL(file);
                      setAudioUrl(url);
                      runClassification(file.name, file);
                    }
                  }}
                  className="hidden"
                />
              </label>
            </div>
          </div>

          {/* Visualizers Card: Waveform + Mel Spectrogram */}
          <div className="p-5 rounded-2xl bg-forest-card border border-forest-border space-y-4 shadow-lg">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
                <Activity className="w-4 h-4 text-forest-accent" />
                Acoustic Waveform & Mel-Frequency Spectrogram
              </span>
              <span className="text-[11px] font-mono text-forest-accent">22.05 kHz • 40 Mel Bands</span>
            </div>

            {/* Waveform Canvas */}
            <div className="rounded-xl bg-forest-darkest p-2 border border-forest-border">
              <canvas
                ref={canvasRef}
                width={600}
                height={90}
                className="w-full h-24 rounded"
              />
            </div>

            {/* Mel Spectrogram Heatmap Canvas */}
            <div>
              <div className="flex justify-between text-[10px] text-forest-muted font-mono mb-1">
                <span>0 Hz (Sub-bass / Infrasound)</span>
                <span>Mel Spectrogram Energy Distribution</span>
                <span>8000 Hz (Canopy / Whistle)</span>
              </div>
              <div className="rounded-xl bg-forest-darkest p-2 border border-forest-border">
                <canvas
                  ref={spectrogramCanvasRef}
                  width={600}
                  height={130}
                  className="w-full h-32 rounded"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: AI Inference Results & Emergency Dispatch Action (5 Cols) */}
        <div className="lg:col-span-5 space-y-5">
          {classificationResult ? (
            <div className="p-5 rounded-2xl bg-forest-card border border-forest-border space-y-5 shadow-lg">
              {/* Classification Hero Banner */}
              <div className={`p-4 rounded-xl border space-y-2 ${
                classificationResult.riskLevel === 'Critical'
                  ? 'bg-red-950/30 border-red-500/50'
                  : classificationResult.riskLevel === 'High'
                  ? 'bg-amber-950/30 border-amber-500/50'
                  : 'bg-forest-primary/50 border-forest-accent/40'
              }`}>
                <div className="flex items-center justify-between">
                  <span className={`px-2.5 py-0.5 rounded-full text-xs font-mono font-bold uppercase tracking-wider ${
                    classificationResult.riskLevel === 'Critical'
                      ? 'bg-red-500 text-white'
                      : classificationResult.riskLevel === 'High'
                      ? 'bg-amber-500 text-black'
                      : 'bg-forest-accent text-forest-darkest'
                  }`}>
                    Risk: {classificationResult.riskLevel}
                  </span>

                  <span className="text-xs font-mono text-forest-muted">
                    {new Date(classificationResult.timestamp).toLocaleTimeString()}
                  </span>
                </div>

                <div className="pt-1">
                  <div className="text-[11px] text-forest-muted uppercase tracking-wider font-semibold">
                    Primary Detection
                  </div>
                  <h3 className="text-xl font-black text-white tracking-wide">
                    {classificationResult.matchedClass}
                  </h3>
                </div>

                <div className="flex items-baseline gap-2 pt-1">
                  <span className="text-3xl font-black font-mono text-forest-accent">
                    {classificationResult.confidence}%
                  </span>
                  <span className="text-xs text-forest-muted font-medium">
                    classification confidence score
                  </span>
                </div>
              </div>

              {/* Recommended Operating Protocol */}
              <div className="p-3.5 rounded-xl bg-forest-darkest border border-forest-border space-y-1.5 text-xs">
                <span className="font-bold text-forest-accent uppercase tracking-wider text-[10px] block">
                  Recommended Forestry Action:
                </span>
                <p className="text-white leading-relaxed">
                  {classificationResult.recommendedAction}
                </p>
              </div>

              {/* Top 3 Probability Breakdown */}
              <div className="space-y-2.5">
                <span className="text-xs font-bold text-forest-muted uppercase tracking-wider block">
                  Top Candidate Model Predictions
                </span>
                <div className="space-y-2 font-mono text-xs">
                  {classificationResult.predictions?.map((p: any, idx: number) => (
                    <div key={idx} className="space-y-1">
                      <div className="flex justify-between">
                        <span className="text-white">{p.label}</span>
                        <span className="text-forest-accent font-bold">{p.confidence}%</span>
                      </div>
                      <div className="w-full h-1.5 bg-forest-darkest rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full ${idx === 0 ? 'bg-forest-accent' : 'bg-forest-muted'}`}
                          style={{ width: `${p.confidence}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Action Button: Create Incident & Dispatch */}
              <button
                onClick={handleCreateIncident}
                className="w-full py-3 rounded-xl bg-gradient-to-r from-red-600 via-orange-600 to-amber-600 hover:from-red-500 hover:to-amber-500 text-white font-extrabold text-xs uppercase tracking-wider transition-all shadow-xl shadow-red-950/60 hover:shadow-red-700/80 active:scale-95 flex items-center justify-center gap-2"
              >
                <ShieldAlert className="w-4 h-4" />
                <span>Create Incident & Dispatch Ranger Team</span>
              </button>

              {/* Honest Model Note */}
              <div className="flex items-start gap-2 p-3 rounded-lg bg-forest-darkest/60 border border-forest-border/40 text-[11px] text-forest-muted leading-relaxed">
                <Info className="w-4 h-4 text-forest-accent flex-shrink-0 mt-0.5" />
                <span>
                  <strong>Ethical AI Disclosure:</strong> Bioacoustic classification yields high probabilistic correlation but does not prove illegal activity with 100% certainty. Detections are logged as suspected anomalies requiring ranger ground verification.
                </span>
              </div>
            </div>
          ) : (
            <div className="p-8 rounded-2xl bg-forest-card border border-forest-border text-center text-forest-muted text-xs">
              Analyzing audio stream...
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

