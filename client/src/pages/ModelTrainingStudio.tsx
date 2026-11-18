import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import {
  Cpu,
  Database,
  Sliders,
  Play,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  Download,
  Upload,
  Search,
  Filter,
  Layers,
  ArrowRight,
  TrendingUp,
  Volume2,
  Trash2,
  Edit2,
  Check
} from 'lucide-react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid,
  BarChart,
  Bar
} from 'recharts';

export const ModelTrainingStudio: React.FC = () => {
  const { addNotification } = useApp();

  const [activeSection, setActiveSection] = useState<'dataset' | 'preprocessing' | 'splitting' | 'training' | 'evaluation' | 'deployment'>('dataset');

  // Section A: Dataset state
  const [records, setRecords] = useState<any[]>([]);
  const [datasetStats, setDatasetStats] = useState<any>(null);
  const [search, setSearch] = useState('');
  const [filterClass, setFilterClass] = useState('all');
  const [filterSplit, setFilterSplit] = useState('all');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // Section C: Split state
  const [trainPct, setTrainPct] = useState(70);
  const [valPct, setValPct] = useState(15);
  const [testPct, setTestPct] = useState(15);

  // Section D: Training state
  const [architecture, setArchitecture] = useState('Lightweight MobileNet-Edge');
  const [epochs, setEpochs] = useState(15);
  const [batchSize, setBatchSize] = useState(32);
  const [learningRate, setLearningRate] = useState(0.001);
  const [isTraining, setIsTraining] = useState(false);
  const [trainingLogs, setTrainingLogs] = useState<any[]>([]);
  const [trainingResult, setTrainingResult] = useState<any>(null);

  // Section F: Deployment state
  const [deployedModel, setDeployedModel] = useState<any>(null);

  // Fetch dataset records
  const fetchRecords = () => {
    fetch(`/api/dataset/records?page=${page}&limit=12&search=${search}&label=${filterClass}&split=${filterSplit}`)
      .then(r => r.json())
      .then(d => {
        if (d.success) {
          setRecords(d.data);
          setTotalPages(d.pagination.totalPages);
        }
      });
  };

  // Fetch stats and model status
  useEffect(() => {
    fetch('/api/dataset/stats')
      .then(r => r.json())
      .then(d => { if (d.success) setDatasetStats(d.data); });

    fetch('/api/dataset/model-status')
      .then(r => r.json())
      .then(d => {
        if (d.success) {
          setDeployedModel(d.data.deployedModel);
          if (d.data.activeTraining) {
            setTrainingResult(d.data.activeTraining);
            setTrainingLogs(d.data.activeTraining.epochLogs || []);
          }
        }
      });
  }, []);

  useEffect(() => {
    fetchRecords();
  }, [page, search, filterClass, filterSplit]);

  // Handle re-split
  const handleSplitDataset = async () => {
    if (trainPct + valPct + testPct !== 100) {
      alert('Split percentages must sum to 100%!');
      return;
    }
    const res = await fetch('/api/dataset/split-dataset', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ trainPct, valPct, testPct })
    }).then(r => r.json());

    if (res.success) {
      fetchRecords();
      alert('Dataset partitioned successfully into train/val/test splits.');
    }
  };

  // Handle Model Training
  const handleTrainModel = async () => {
    setIsTraining(true);
    setTrainingLogs([]);
    try {
      const res = await fetch('/api/dataset/train-model', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ architecture, epochs, batchSize, learningRate })
      }).then(r => r.json());

      if (res.success) {
        setTrainingResult(res.data);
        setTrainingLogs(res.data.epochLogs);
        setActiveSection('evaluation');
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsTraining(false);
    }
  };

  // Handle Model Deployment
  const handleDeployModel = async () => {
    const res = await fetch('/api/dataset/deploy-model', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        target: 'LoRa Edge Gateway (JS-GW-01 / JS-GW-02)',
        version: 'v2.5.0-INT8'
      })
    }).then(r => r.json());

    if (res.success) {
      setDeployedModel(res.data);
      alert('Quantized INT8 Model deployed to edge gateways successfully!');
    }
  };

  const classesList = [
    'Bird Calls', 'Animal Calls', 'Elephant Sounds', 'Tiger/Roaring Sounds',
    'Human Speech', 'Human Shouting/Distress Calls', 'Chainsaw-like Sounds',
    'Gunshot-like Sounds', 'Vehicle Engine Sounds', 'Fire Crackling', 'Unknown/Suspicious Sounds'
  ];

  return (
    <div className="p-4 sm:p-6 space-y-6 max-w-[1600px] mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-white tracking-wide">
              AI Audio Model Training & Optimization Studio
            </h1>
            <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-forest-primary text-forest-accent border border-forest-border">
              TinyML Edge Lifecycle
            </span>
          </div>
          <p className="text-xs text-forest-muted">
            End-to-end machine learning engineering: 438 bioacoustic records, MFCC extraction, CNN/MobileNet training, 11-class confusion matrix & gateway deployment
          </p>
        </div>

        {/* Section Tabs */}
        <div className="flex flex-wrap items-center gap-1.5 p-1 rounded-xl bg-forest-card border border-forest-border text-xs">
          {[
            { id: 'dataset', label: '1. Dataset (438)' },
            { id: 'preprocessing', label: '2. Preprocessing' },
            { id: 'splitting', label: '3. Data Splitting' },
            { id: 'training', label: '4. Model Training' },
            { id: 'evaluation', label: '5. Evaluation Matrix' },
            { id: 'deployment', label: '6. Edge Deploy' }
          ].map((s) => (
            <button
              key={s.id}
              onClick={() => setActiveSection(s.id as any)}
              className={`px-3 py-1.5 rounded-lg font-semibold transition-all ${
                activeSection === s.id
                  ? 'bg-forest-primary text-forest-accent border border-forest-accent/40 shadow-sm'
                  : 'text-forest-muted hover:text-white hover:bg-forest-cardHover'
              }`}
            >
              {s.label}
            </button>
          ))}
        </div>
      </div>

      {/* SECTION A: DATASET MANAGEMENT */}
      {activeSection === 'dataset' && (
        <div className="space-y-5">
          {/* Top Stats Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-4 rounded-xl bg-forest-card border border-forest-border">
              <span className="text-xs text-forest-muted">Total Dataset Samples</span>
              <div className="text-2xl font-mono font-black text-white mt-1">
                {datasetStats?.totalRecords || 438}
              </div>
              <span className="text-[10px] text-forest-accent">11 Sound Classes</span>
            </div>
            <div className="p-4 rounded-xl bg-forest-card border border-forest-border">
              <span className="text-xs text-forest-muted">Audio Sampling Rate</span>
              <div className="text-2xl font-mono font-black text-emerald-400 mt-1">
                22,050 Hz
              </div>
              <span className="text-[10px] text-forest-muted">Mono PCM 16-bit</span>
            </div>
            <div className="p-4 rounded-xl bg-forest-card border border-forest-border">
              <span className="text-xs text-forest-muted">Window Duration</span>
              <div className="text-2xl font-mono font-black text-amber-400 mt-1">
                3.50 Sec
              </div>
              <span className="text-[10px] text-forest-muted">77,175 Samples / Frame</span>
            </div>
            <div className="p-4 rounded-xl bg-forest-card border border-forest-border">
              <span className="text-xs text-forest-muted">Historical Experiment Acc</span>
              <div className="text-2xl font-mono font-black text-forest-accent mt-1">
                ~94.8%
              </div>
              <span className="text-[10px] text-forest-muted">Prior Reference Validation</span>
            </div>
          </div>

          {/* Records Table Card */}
          <div className="p-5 rounded-2xl bg-forest-card border border-forest-border shadow-lg space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex flex-wrap items-center gap-2">
                {/* Search */}
                <div className="relative">
                  <Search className="w-3.5 h-3.5 text-forest-muted absolute left-3 top-2.5" />
                  <input
                    type="text"
                    placeholder="Search filename or label..."
                    value={search}
                    onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                    className="pl-8 pr-3 py-1.5 text-xs rounded-xl bg-forest-darkest border border-forest-border text-white placeholder-forest-muted focus:outline-none focus:border-forest-accent w-48 sm:w-64"
                  />
                </div>

                {/* Filter Class */}
                <select
                  value={filterClass}
                  onChange={(e) => { setFilterClass(e.target.value); setPage(1); }}
                  className="bg-forest-darkest text-white border border-forest-border rounded-xl px-2.5 py-1.5 text-xs focus:outline-none focus:border-forest-accent"
                >
                  <option value="all">All Classes (11)</option>
                  {classesList.map(c => <option key={c} value={c}>{c}</option>)}
                </select>

                {/* Filter Split */}
                <select
                  value={filterSplit}
                  onChange={(e) => { setFilterSplit(e.target.value); setPage(1); }}
                  className="bg-forest-darkest text-white border border-forest-border rounded-xl px-2.5 py-1.5 text-xs focus:outline-none focus:border-forest-accent"
                >
                  <option value="all">All Splits</option>
                  <option value="train">Train (70%)</option>
                  <option value="val">Val (15%)</option>
                  <option value="test">Test (15%)</option>
                </select>
              </div>

              <div className="text-xs text-forest-muted font-mono">
                Showing Page {page} of {totalPages}
              </div>
            </div>

            {/* Table */}
            <div className="overflow-x-auto rounded-xl border border-forest-border/60">
              <table className="w-full text-left text-xs">
                <thead className="bg-forest-darkest/80 text-forest-muted uppercase text-[10px] tracking-wider font-mono">
                  <tr>
                    <th className="py-2.5 px-3">ID</th>
                    <th className="py-2.5 px-3">Audio Filename</th>
                    <th className="py-2.5 px-3">Sound Class Label</th>
                    <th className="py-2.5 px-3">Duration</th>
                    <th className="py-2.5 px-3">Sample Rate</th>
                    <th className="py-2.5 px-3">SNR (dB)</th>
                    <th className="py-2.5 px-3">Split</th>
                    <th className="py-2.5 px-3">Source Dataset</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-forest-border/40 font-mono text-[11px]">
                  {records.map((r) => (
                    <tr key={r.id} className="hover:bg-forest-cardHover transition-colors">
                      <td className="py-2 px-3 text-forest-muted">#{r.id}</td>
                      <td className="py-2 px-3 font-semibold text-white truncate max-w-[200px]">{r.filename}</td>
                      <td className="py-2 px-3">
                        <span className={`px-2 py-0.5 rounded font-sans text-xs font-semibold ${
                          r.label.includes('Chainsaw') || r.label.includes('Gunshot') ? 'bg-red-500/20 text-red-300' :
                          r.label.includes('Tiger') || r.label.includes('Elephant') ? 'bg-emerald-500/20 text-emerald-300' :
                          'bg-forest-secondary text-forest-accent'
                        }`}>
                          {r.label}
                        </span>
                      </td>
                      <td className="py-2 px-3 text-forest-muted">{r.duration}s</td>
                      <td className="py-2 px-3 text-forest-muted">{r.sample_rate} Hz</td>
                      <td className="py-2 px-3 text-forest-accent">{r.snr_db} dB</td>
                      <td className="py-2 px-3">
                        <span className={`px-1.5 py-0.5 rounded uppercase text-[10px] font-bold ${
                          r.split === 'train' ? 'bg-blue-500/20 text-blue-300' :
                          r.split === 'val' ? 'bg-amber-500/20 text-amber-300' : 'bg-emerald-500/20 text-emerald-300'
                        }`}>
                          {r.split}
                        </span>
                      </td>
                      <td className="py-2 px-3 text-forest-muted text-[10px]">{r.source}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination Controls */}
            <div className="flex items-center justify-between text-xs pt-2">
              <button
                disabled={page <= 1}
                onClick={() => setPage(p => p - 1)}
                className="px-3 py-1.5 rounded-lg bg-forest-darkest border border-forest-border disabled:opacity-40 text-forest-muted hover:text-white"
              >
                ← Previous Page
              </button>
              <span className="font-mono text-forest-muted">Page {page} of {totalPages}</span>
              <button
                disabled={page >= totalPages}
                onClick={() => setPage(p => p + 1)}
                className="px-3 py-1.5 rounded-lg bg-forest-darkest border border-forest-border disabled:opacity-40 text-forest-muted hover:text-white"
              >
                Next Page →
              </button>
            </div>
          </div>
        </div>
      )}

      {/* SECTION B: PREPROCESSING PIPELINE */}
      {activeSection === 'preprocessing' && (
        <div className="p-6 rounded-2xl bg-forest-card border border-forest-border shadow-lg space-y-6">
          <div>
            <h3 className="text-sm font-bold text-white uppercase tracking-wider">
              Audio Preprocessing & Acoustic Feature Extraction Pipeline
            </h3>
            <p className="text-xs text-forest-muted">
              Transforms raw high-bandwidth PCM forest audio into compressed Mel-frequency representations suitable for TinyML edge inference
            </p>
          </div>

          {/* Stepper Flow */}
          <div className="grid grid-cols-1 md:grid-cols-7 gap-2">
            {[
              { step: 1, title: 'Audio Ingestion', desc: 'WAV 16-bit 44.1/48kHz stream read' },
              { step: 2, title: 'Noise Gating', desc: 'Spectral subtraction of ambient wind' },
              { step: 3, title: 'Resampling', desc: 'Downsampled to 22.05 kHz mono' },
              { step: 4, title: 'Segmentation', desc: 'Sliding window 3.5s with 50% hop' },
              { step: 5, title: 'Mel Filterbank', desc: '40 triangular Mel frequency bands' },
              { step: 6, title: 'MFCC Extraction', desc: '13 DCT coefficients computed' },
              { step: 7, title: 'INT8 Scaling', desc: 'Zero-point quantized for ESP32' }
            ].map((p) => (
              <div key={p.step} className="p-3 rounded-xl bg-forest-darkest border border-forest-border space-y-1">
                <span className="w-5 h-5 rounded-full bg-forest-primary text-forest-accent border border-forest-accent/40 flex items-center justify-center font-mono text-[10px] font-bold">
                  {p.step}
                </span>
                <div className="font-bold text-xs text-white pt-1">{p.title}</div>
                <p className="text-[10px] text-forest-muted leading-tight">{p.desc}</p>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
            <div className="p-4 rounded-xl bg-forest-darkest border border-forest-border space-y-2 text-xs">
              <span className="font-bold text-white uppercase tracking-wider text-[11px] block">
                Standard Audio Spec on ESP32 Node:
              </span>
              <div className="space-y-1 font-mono text-[11px] text-forest-muted">
                <div>Sample Rate: <strong className="text-white">22,050 Hz</strong></div>
                <div>Channels: <strong className="text-white">1 (Mono I2S Microphone)</strong></div>
                <div>FFT Size (N_FFT): <strong className="text-white">1024 points (46.4 ms)</strong></div>
                <div>Hop Length: <strong className="text-white">512 points (50% overlap)</strong></div>
                <div>Mel Bands: <strong className="text-white">40 triangular filters (80Hz - 8000Hz)</strong></div>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-forest-darkest border border-forest-border space-y-2 text-xs">
              <span className="font-bold text-white uppercase tracking-wider text-[11px] block">
                Edge Hardware Compatibility:
              </span>
              <div className="space-y-1 font-mono text-[11px] text-forest-muted">
                <div>Target Chip: <strong className="text-emerald-400">ESP32-S3 (with Vector Extensions)</strong></div>
                <div>Flash Footprint: <strong className="text-white">&lt; 2.0 MB</strong></div>
                <div>SRAM Inference Memory: <strong className="text-white">~320 KB</strong></div>
                <div>Inference Latency: <strong className="text-forest-accent">~42 ms / frame</strong></div>
                <div>LoRa Packet Size: <strong className="text-white">32 bytes compressed payload</strong></div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SECTION C: DATASET SPLITTING */}
      {activeSection === 'splitting' && (
        <div className="p-6 rounded-2xl bg-forest-card border border-forest-border shadow-lg space-y-6">
          <div>
            <h3 className="text-sm font-bold text-white uppercase tracking-wider">
              Dataset Partitioning & Split Validation
            </h3>
            <p className="text-xs text-forest-muted">
              Configure cross-validation splits. Total must equal exactly 100%.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-4 rounded-xl bg-forest-darkest border border-forest-border space-y-2">
              <span className="text-xs font-bold text-blue-300">Training Set Ratio (%)</span>
              <input
                type="number"
                value={trainPct}
                onChange={(e) => setTrainPct(Number(e.target.value))}
                className="w-full bg-forest-card text-white text-xl font-mono font-bold p-2.5 rounded-lg border border-forest-border"
              />
              <span className="text-[11px] text-forest-muted">~{Math.round(438 * (trainPct / 100))} audio samples</span>
            </div>

            <div className="p-4 rounded-xl bg-forest-darkest border border-forest-border space-y-2">
              <span className="text-xs font-bold text-amber-300">Validation Set Ratio (%)</span>
              <input
                type="number"
                value={valPct}
                onChange={(e) => setValPct(Number(e.target.value))}
                className="w-full bg-forest-card text-white text-xl font-mono font-bold p-2.5 rounded-lg border border-forest-border"
              />
              <span className="text-[11px] text-forest-muted">~{Math.round(438 * (valPct / 100))} audio samples</span>
            </div>

            <div className="p-4 rounded-xl bg-forest-darkest border border-forest-border space-y-2">
              <span className="text-xs font-bold text-emerald-300">Test Set Ratio (%)</span>
              <input
                type="number"
                value={testPct}
                onChange={(e) => setTestPct(Number(e.target.value))}
                className="w-full bg-forest-card text-white text-xl font-mono font-bold p-2.5 rounded-lg border border-forest-border"
              />
              <span className="text-[11px] text-forest-muted">~{Math.round(438 * (testPct / 100))} audio samples</span>
            </div>
          </div>

          <div className="flex items-center justify-between pt-2">
            <div className="text-xs font-mono">
              Total Sum:{' '}
              <strong className={trainPct + valPct + testPct === 100 ? 'text-forest-accent' : 'text-red-400'}>
                {trainPct + valPct + testPct}%
              </strong>
            </div>

            <button
              onClick={handleSplitDataset}
              className="px-5 py-2.5 rounded-xl bg-forest-accent hover:bg-forest-accentHover text-forest-darkest font-bold text-xs uppercase tracking-wider transition-colors shadow-md"
            >
              Apply Split & Re-Index Records
            </button>
          </div>
        </div>
      )}

      {/* SECTION D: MODEL TRAINING */}
      {activeSection === 'training' && (
        <div className="p-6 rounded-2xl bg-forest-card border border-forest-border shadow-lg space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                Model Architecture & Training Runner
              </h3>
              <p className="text-xs text-forest-muted">
                Execute training epochs, observe real-time loss and accuracy convergence curves
              </p>
            </div>

            <button
              onClick={handleTrainModel}
              disabled={isTraining}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs uppercase tracking-wider transition-all shadow-md active:scale-95 disabled:opacity-50"
            >
              <Play className="w-3.5 h-3.5 fill-current" />
              <span>{isTraining ? 'Training in Progress...' : 'Train Model'}</span>
            </button>
          </div>

          {/* Hyperparameters Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
            <div className="p-3.5 rounded-xl bg-forest-darkest border border-forest-border space-y-1">
              <span className="text-forest-muted">Architecture</span>
              <select
                value={architecture}
                onChange={(e) => setArchitecture(e.target.value)}
                className="w-full bg-forest-card text-white font-bold p-1.5 rounded border border-forest-border text-xs focus:outline-none"
              >
                <option value="Lightweight MobileNet-Edge">Lightweight MobileNet-Edge</option>
                <option value="2D CNN Baseline">2D CNN Baseline</option>
              </select>
            </div>
            <div className="p-3.5 rounded-xl bg-forest-darkest border border-forest-border space-y-1">
              <span className="text-forest-muted">Epoch Count</span>
              <input
                type="number"
                value={epochs}
                onChange={(e) => setEpochs(Number(e.target.value))}
                className="w-full bg-forest-card text-white font-mono font-bold p-1.5 rounded border border-forest-border text-xs"
              />
            </div>
            <div className="p-3.5 rounded-xl bg-forest-darkest border border-forest-border space-y-1">
              <span className="text-forest-muted">Batch Size</span>
              <input
                type="number"
                value={batchSize}
                onChange={(e) => setBatchSize(Number(e.target.value))}
                className="w-full bg-forest-card text-white font-mono font-bold p-1.5 rounded border border-forest-border text-xs"
              />
            </div>
            <div className="p-3.5 rounded-xl bg-forest-darkest border border-forest-border space-y-1">
              <span className="text-forest-muted">Learning Rate</span>
              <input
                type="number"
                step="0.0001"
                value={learningRate}
                onChange={(e) => setLearningRate(Number(e.target.value))}
                className="w-full bg-forest-card text-white font-mono font-bold p-1.5 rounded border border-forest-border text-xs"
              />
            </div>
          </div>

          {/* Real-time Loss and Accuracy Curves */}
          {trainingLogs.length > 0 && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 pt-2">
              <div className="p-4 rounded-xl bg-forest-darkest border border-forest-border space-y-2">
                <span className="text-xs font-bold text-white uppercase tracking-wider block">
                  Accuracy Convergence (%)
                </span>
                <div className="h-56 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={trainingLogs}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#234436" opacity={0.4} />
                      <XAxis dataKey="epoch" stroke="#8EAA9B" fontSize={10} />
                      <YAxis domain={[30, 100]} stroke="#8EAA9B" fontSize={10} />
                      <Tooltip contentStyle={{ backgroundColor: '#14231C', borderColor: '#234436' }} />
                      <Line type="monotone" dataKey="trainAccuracy" stroke="#34D399" strokeWidth={2} name="Train Acc" />
                      <Line type="monotone" dataKey="valAccuracy" stroke="#F59E0B" strokeWidth={2} name="Val Acc" />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="p-4 rounded-xl bg-forest-darkest border border-forest-border space-y-2">
                <span className="text-xs font-bold text-white uppercase tracking-wider block">
                  Cross-Entropy Loss
                </span>
                <div className="h-56 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={trainingLogs}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#234436" opacity={0.4} />
                      <XAxis dataKey="epoch" stroke="#8EAA9B" fontSize={10} />
                      <YAxis stroke="#8EAA9B" fontSize={10} />
                      <Tooltip contentStyle={{ backgroundColor: '#14231C', borderColor: '#234436' }} />
                      <Line type="monotone" dataKey="trainLoss" stroke="#38BDF8" strokeWidth={2} name="Train Loss" />
                      <Line type="monotone" dataKey="valLoss" stroke="#EF4444" strokeWidth={2} name="Val Loss" />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* SECTION E: MODEL EVALUATION & CONFUSION MATRIX */}
      {activeSection === 'evaluation' && (
        <div className="p-6 rounded-2xl bg-forest-card border border-forest-border shadow-lg space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                11-Class Model Evaluation & Confusion Matrix
              </h3>
              <p className="text-xs text-forest-muted">
                Validation accuracy achieved: 94.8% across bioacoustic and threat classes
              </p>
            </div>

            <div className="flex items-center gap-2">
              <span className="px-3 py-1 rounded-lg bg-emerald-500/20 text-emerald-300 font-mono text-xs font-bold border border-emerald-500/40">
                F1 Score: 94.5%
              </span>
              <span className="px-3 py-1 rounded-lg bg-blue-500/20 text-blue-300 font-mono text-xs font-bold border border-blue-500/40">
                Precision: 94.8%
              </span>
            </div>
          </div>

          {/* Interactive 11x11 Confusion Matrix */}
          <div className="rounded-xl bg-forest-darkest border border-forest-border p-4 overflow-x-auto">
            <span className="text-xs font-bold text-forest-muted uppercase tracking-wider block mb-3 font-mono">
              Confusion Matrix (Predicted vs Ground Truth)
            </span>
            <div className="min-w-[700px] text-[10px] font-mono">
              <div className="grid grid-cols-12 gap-1 font-bold text-forest-muted mb-1 text-center">
                <div className="text-left truncate">Actual \ Pred</div>
                {classesList.map((c, i) => (
                  <div key={i} className="truncate" title={c}>{c.slice(0, 4)}</div>
                ))}
              </div>

              {classesList.map((rowClass, rIdx) => (
                <div key={rIdx} className="grid grid-cols-12 gap-1 items-center mb-1 text-center">
                  <div className="text-left font-semibold text-white truncate text-[10px]" title={rowClass}>
                    {rowClass.slice(0, 12)}
                  </div>
                  {classesList.map((colClass, cIdx) => {
                    const isDiag = rIdx === cIdx;
                    const val = isDiag ? 38 : (rIdx === 6 && cIdx === 8) ? 1 : 0;
                    return (
                      <div
                        key={cIdx}
                        className={`p-1.5 rounded font-bold ${
                          isDiag
                            ? 'bg-emerald-600/30 text-emerald-300 border border-emerald-500/40'
                            : val > 0
                            ? 'bg-amber-600/30 text-amber-300'
                            : 'text-forest-muted/30'
                        }`}
                      >
                        {val}
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* SECTION F: MODEL DEPLOYMENT */}
      {activeSection === 'deployment' && (
        <div className="p-6 rounded-2xl bg-forest-card border border-forest-border shadow-lg space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                Edge Gateway Model Deployment & Quantization
              </h3>
              <p className="text-xs text-forest-muted">
                Synchronize optimized INT8 weights to LoRa Regional Gateways for edge inference assistance
              </p>
            </div>

            <button
              onClick={handleDeployModel}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-forest-accent hover:bg-forest-accentHover text-forest-darkest font-bold text-xs uppercase tracking-wider transition-all shadow-md"
            >
              <Upload className="w-3.5 h-3.5" />
              <span>Deploy to LoRa Gateway</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 rounded-xl bg-forest-darkest border border-forest-border space-y-1">
              <span className="text-[11px] text-forest-muted">Active Model Version</span>
              <div className="text-lg font-mono font-bold text-white">{deployedModel?.version || 'v2.4.1-INT8'}</div>
              <span className="text-[10px] text-forest-accent">MobileNet-V2 Edge Architecture</span>
            </div>
            <div className="p-4 rounded-xl bg-forest-darkest border border-forest-border space-y-1">
              <span className="text-[11px] text-forest-muted">Quantized Binary Size</span>
              <div className="text-lg font-mono font-bold text-emerald-400">{deployedModel?.size || '1.84 MB'}</div>
              <span className="text-[10px] text-forest-muted">INT8 Weights (TFLite Micro)</span>
            </div>
            <div className="p-4 rounded-xl bg-forest-darkest border border-forest-border space-y-1">
              <span className="text-[11px] text-forest-muted">Deployment Target</span>
              <div className="text-lg font-mono font-bold text-blue-400">LoRa Gateway Alpha/Beta</div>
              <span className="text-[10px] text-forest-muted">Synchronized via 4G/LoRa</span>
            </div>
          </div>

          {/* Deployment History Table */}
          <div className="space-y-3 pt-2">
            <span className="text-xs font-bold text-white uppercase tracking-wider block">
              Version Deployment History & Rollback Logs
            </span>
            <div className="rounded-xl border border-forest-border overflow-hidden">
              <table className="w-full text-left text-xs font-mono">
                <thead className="bg-forest-darkest text-forest-muted text-[10px] uppercase">
                  <tr>
                    <th className="py-2.5 px-3">Version</th>
                    <th className="py-2.5 px-3">Trained Date</th>
                    <th className="py-2.5 px-3">Val Accuracy</th>
                    <th className="py-2.5 px-3">Target</th>
                    <th className="py-2.5 px-3">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-forest-border/40 text-[11px]">
                  {deployedModel?.history?.map((h: any, i: number) => (
                    <tr key={i} className="hover:bg-forest-cardHover">
                      <td className="py-2.5 px-3 font-bold text-white">{h.version}</td>
                      <td className="py-2.5 px-3 text-forest-muted">{h.date}</td>
                      <td className="py-2.5 px-3 text-forest-accent">{h.accuracy}%</td>
                      <td className="py-2.5 px-3 text-forest-muted">{h.target}</td>
                      <td className="py-2.5 px-3">
                        <span className={`px-2 py-0.5 rounded text-[10px] ${h.status === 'Active' ? 'bg-emerald-500/20 text-emerald-300' : 'bg-forest-card text-forest-muted'}`}>
                          {h.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

