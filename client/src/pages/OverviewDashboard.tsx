import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import {
  Radio,
  Wifi,
  Bell,
  AlertTriangle,
  ShieldAlert,
  Flame,
  Activity,
  CheckCircle2,
  Users,
  Truck,
  Play,
  ArrowUpRight,
  TrendingUp,
  MapPin,
  Clock,
  ExternalLink
} from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid
} from 'recharts';

export const OverviewDashboard: React.FC = () => {
  const {
    nodes,
    gateways,
    alerts,
    incidents,
    teams,
    setActiveTab,
    setSimModalOpen,
    setSelectedIncidentId,
    acknowledgeAlert,
    escalateAlert
  } = useApp();

  const [analytics, setAnalytics] = useState<any>(null);
  const [trends, setTrends] = useState<any>(null);

  useEffect(() => {
    fetch('/api/analytics/overview')
      .then(r => r.json())
      .then(d => { if (d.success) setAnalytics(d.data); })
      .catch(console.error);

    fetch('/api/analytics/trends')
      .then(r => r.json())
      .then(d => { if (d.success) setTrends(d.data); })
      .catch(console.error);
  }, [alerts, incidents, nodes, teams]);

  // Derived KPIs
  const totalNodes = nodes.length || 12;
  const onlineNodes = nodes.filter(n => n.status === 'online').length;
  const offlineNodes = nodes.filter(n => n.status === 'offline').length;
  const warningNodes = nodes.filter(n => n.status !== 'online' && n.status !== 'offline').length;
  
  const activeAlerts = alerts.filter(a => a.status === 'new' || a.status === 'acknowledged');
  const criticalIncidents = incidents.filter(i => i.severity === 'critical' && i.status !== 'closed');
  const wildlifeActivity = alerts.filter(a => a.category.includes('Wildlife') || a.category.includes('Animal')).length;
  const teamsAvailable = teams.filter(t => t.status === 'available').length;
  const teamsDispatched = teams.filter(t => t.status !== 'available').length;
  const resolvedIncidents = incidents.filter(i => i.status === 'closed').length;

  const kpis = [
    { title: 'Total Nodes', value: totalNodes, subtitle: 'ESP32 Sentry Units', icon: Radio, tab: 'nodes', color: 'text-emerald-400', border: 'border-emerald-500/30' },
    { title: 'Online Nodes', value: onlineNodes, subtitle: 'Transmitting via LoRa', icon: CheckCircle2, tab: 'nodes', color: 'text-emerald-400', border: 'border-emerald-500/30' },
    { title: 'Offline Nodes', value: offlineNodes, subtitle: 'Missed Heartbeats', icon: AlertTriangle, tab: 'nodes', color: offlineNodes > 0 ? 'text-red-400' : 'text-forest-muted', border: offlineNodes > 0 ? 'border-red-500/50' : 'border-forest-border' },
    { title: 'Warning Nodes', value: warningNodes, subtitle: 'Batt / Sensor Outliers', icon: AlertTriangle, tab: 'nodes', color: warningNodes > 0 ? 'text-amber-400' : 'text-forest-muted', border: warningNodes > 0 ? 'border-amber-500/50' : 'border-forest-border' },
    { title: 'Active Alerts', value: activeAlerts.length, subtitle: 'Requiring Action', icon: Bell, tab: 'alerts', color: activeAlerts.length > 0 ? 'text-amber-400' : 'text-emerald-400', border: 'border-amber-500/40' },
    { title: 'Critical Threats', value: criticalIncidents.length, subtitle: 'Gunshot / Timber / Fire', icon: ShieldAlert, tab: 'alerts', color: criticalIncidents.length > 0 ? 'text-red-400 animate-pulse' : 'text-forest-muted', border: 'border-red-500/50' },
    { title: 'Wildlife Signals', value: wildlifeActivity, subtitle: 'Bioacoustic Detections', icon: Activity, tab: 'audio', color: 'text-emerald-300', border: 'border-emerald-500/30' },
    { title: 'Teams Available', value: teamsAvailable, subtitle: 'Station Ready', icon: Users, tab: 'dispatch', color: 'text-blue-400', border: 'border-blue-500/30' },
    { title: 'Teams Dispatched', value: teamsDispatched, subtitle: 'In Field / En Route', icon: Truck, tab: 'dispatch', color: teamsDispatched > 0 ? 'text-amber-300' : 'text-forest-muted', border: 'border-amber-500/30' },
    { title: 'Resolved Incidents', value: resolvedIncidents, subtitle: 'Verified & Certified', icon: CheckCircle2, tab: 'resolution', color: 'text-emerald-400', border: 'border-emerald-500/30' },
  ];

  // Pie chart colors
  const NODE_COLORS = ['#34D399', '#EF4444', '#F59E0B', '#F97316', '#64748B'];
  const nodeHealthData = analytics?.nodeHealth || [
    { name: 'Online', value: onlineNodes },
    { name: 'Offline', value: offlineNodes },
    { name: 'Warning', value: 1 },
    { name: 'Low Battery', value: 1 },
    { name: 'Maintenance', value: 1 }
  ];

  return (
    <div className="p-4 sm:p-6 space-y-6 max-w-[1700px] mx-auto">
      {/* Top Banner: Emergency Simulation Call-to-Action */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-forest-card via-forest-primary to-forest-secondary border border-forest-accent/30 p-5 sm:p-6 shadow-2xl flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="space-y-1.5 text-center md:text-left">
          <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-full bg-forest-accent/20 border border-forest-accent/40 text-forest-accent text-xs font-mono font-bold">
            <span className="w-2 h-2 rounded-full bg-forest-accent animate-ping" />
            INTEGRATED HACKATHON DEMONSTRATION
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-white tracking-wide">
            Jungle Saathi Command & Response Dashboard
          </h1>
          <p className="text-xs sm:text-sm text-forest-muted max-w-2xl">
            Live telemetry from 12 ESP32 nodes across 4 sanctuary zones. Edge audio AI, LoRa gateway routing, automated ranger dispatch & verified incident resolution.
          </p>
        </div>

        <button
          onClick={() => setSimModalOpen(true)}
          className="flex-shrink-0 flex items-center gap-2.5 px-6 py-3 rounded-xl bg-gradient-to-r from-red-600 via-orange-600 to-amber-600 hover:from-red-500 hover:to-amber-500 text-white font-extrabold text-sm uppercase tracking-wider shadow-xl shadow-red-950/60 hover:shadow-red-700/80 transition-all border border-red-400/40 active:scale-95 group animate-pulse"
        >
          <Play className="w-4 h-4 fill-current transition-transform group-hover:scale-125" />
          <span>Simulate Forest Emergency</span>
        </button>
      </div>

      {/* 10 KPI Cards Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5">
        {kpis.map((kpi, idx) => {
          const Icon = kpi.icon;
          return (
            <div
              key={idx}
              onClick={() => setActiveTab(kpi.tab)}
              className={`p-4 rounded-xl bg-forest-card hover:bg-forest-cardHover border ${kpi.border} cursor-pointer transition-all duration-200 hover:-translate-y-0.5 shadow-md flex flex-col justify-between group`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-forest-muted font-medium">{kpi.title}</span>
                <Icon className={`w-4 h-4 ${kpi.color} transition-transform group-hover:scale-110`} />
              </div>
              <div className="flex items-baseline justify-between">
                <span className={`text-2xl font-black font-mono ${kpi.color}`}>
                  {kpi.value}
                </span>
                <ArrowUpRight className="w-3.5 h-3.5 text-forest-muted group-hover:text-forest-accent transition-colors" />
              </div>
              <span className="text-[10px] text-forest-muted/70 mt-1 truncate">
                {kpi.subtitle}
              </span>
            </div>
          );
        })}
      </div>

      {/* Critical Alert Panel & Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Active Critical Alerts Table */}
        <div className="lg:col-span-2 rounded-2xl bg-forest-card border border-forest-border p-5 shadow-lg space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-lg bg-red-500/20 text-red-400">
                <ShieldAlert className="w-4 h-4" />
              </div>
              <div>
                <h2 className="text-sm font-bold text-white uppercase tracking-wider">
                  Active Critical & High Priority Alerts
                </h2>
                <p className="text-xs text-forest-muted">
                  Requires immediate ranger verification or field dispatch
                </p>
              </div>
            </div>
            <button
              onClick={() => setActiveTab('alerts')}
              className="text-xs text-forest-accent hover:underline flex items-center gap-1 font-medium"
            >
              <span>View All Alerts</span>
              <ExternalLink className="w-3 h-3" />
            </button>
          </div>

          <div className="space-y-2.5">
            {activeAlerts.slice(0, 3).map((a) => (
              <div
                key={a.id}
                className="p-3.5 rounded-xl bg-forest-darkest/70 border border-forest-border/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:border-forest-accent/40 transition-colors"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase ${
                      a.severity === 'critical' ? 'bg-red-500/20 text-red-300 border border-red-500/30' : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                    }`}>
                      {a.severity}
                    </span>
                    <span className="font-bold text-xs text-white">{a.title}</span>
                  </div>
                  <div className="flex items-center gap-3 text-[11px] text-forest-muted">
                    <span>Node: <strong className="text-white">{a.source_node}</strong></span>
                    <span>•</span>
                    <span>Method: {a.detection_method}</span>
                    {a.confidence && (
                      <>
                        <span>•</span>
                        <span className="text-forest-accent font-mono font-semibold">AI Conf: {a.confidence}%</span>
                      </>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {a.status === 'new' && (
                    <button
                      onClick={() => acknowledgeAlert(a.id)}
                      className="px-3 py-1.5 rounded-lg bg-forest-primary hover:bg-forest-secondary text-forest-accent border border-forest-accent/30 text-xs font-semibold transition-colors"
                    >
                      Acknowledge
                    </button>
                  )}
                  <button
                    onClick={() => escalateAlert(a.id)}
                    className="px-3 py-1.5 rounded-lg bg-amber-600/30 hover:bg-amber-600/50 text-amber-300 border border-amber-500/40 text-xs font-semibold transition-colors"
                  >
                    Escalate & Dispatch
                  </button>
                </div>
              </div>
            ))}

            {activeAlerts.length === 0 && (
              <div className="text-center py-8 text-forest-muted text-xs">
                No active critical alerts. All monitoring zones nominal.
              </div>
            )}
          </div>
        </div>

        {/* Right 1 Col: LoRa Gateway Connectivity & System Architecture Summary */}
        <div className="rounded-2xl bg-forest-card border border-forest-border p-5 shadow-lg flex flex-col justify-between space-y-4">
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Wifi className="w-4 h-4 text-forest-accent" />
                <h3 className="text-xs font-bold text-white uppercase tracking-wider">
                  LoRa Gateway Mesh
                </h3>
              </div>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                2 / 2 Online
              </span>
            </div>

            <div className="space-y-3">
              {gateways.map((gw) => (
                <div key={gw.id} className="p-3 rounded-xl bg-forest-darkest/60 border border-forest-border/60 text-xs space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-white">{gw.name}</span>
                    <span className="text-[10px] font-mono text-forest-accent">{gw.frequency_mhz} MHz</span>
                  </div>
                  <div className="flex items-center justify-between text-[11px] text-forest-muted font-mono">
                    <span>Packets: {gw.packets_received?.toLocaleString()}</span>
                    <span>SNR: {gw.snr_db} dB</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Quick link to Architecture */}
          <div className="p-3 rounded-xl bg-forest-primary/50 border border-forest-accent/30 space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-white">LoRa → Server Architecture</span>
              <button
                onClick={() => setActiveTab('architecture')}
                className="text-forest-accent hover:underline text-[11px] flex items-center gap-1"
              >
                <span>Inspect</span>
                <ArrowUpRight className="w-3 h-3" />
              </button>
            </div>
            <p className="text-[11px] text-forest-muted">
              ESP32 Edge AI nodes transmit compressed acoustic feature packets via LoRa (868.1 MHz) to regional gateways.
            </p>
          </div>
        </div>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Chart A: 24-Hour Forest Activity Chart (Area Chart) */}
        <div className="lg:col-span-2 rounded-2xl bg-forest-card border border-forest-border p-5 shadow-lg space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-xs font-bold text-white uppercase tracking-wider">
                24-Hour Forest Activity & Acoustic Detections
              </h3>
              <p className="text-[11px] text-forest-muted">
                Hourly trends: Wildlife bioacoustics vs Suspicious triggers vs Ambient
              </p>
            </div>
            <div className="flex items-center gap-3 text-[11px] font-mono">
              <span className="flex items-center gap-1.5 text-emerald-400">
                <span className="w-2 h-2 rounded-full bg-emerald-400" /> Wildlife
              </span>
              <span className="flex items-center gap-1.5 text-amber-400">
                <span className="w-2 h-2 rounded-full bg-amber-400" /> Suspicious
              </span>
            </div>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={trends?.hourlyActivity || []}>
                <defs>
                  <linearGradient id="colorWild" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#34D399" stopOpacity={0.4}/>
                    <stop offset="95%" stopColor="#34D399" stopOpacity={0.0}/>
                  </linearGradient>
                  <linearGradient id="colorSusp" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#F59E0B" stopOpacity={0.4}/>
                    <stop offset="95%" stopColor="#F59E0B" stopOpacity={0.0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#234436" opacity={0.5} />
                <XAxis dataKey="hour" stroke="#8EAA9B" fontSize={10} />
                <YAxis stroke="#8EAA9B" fontSize={10} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#14231C', borderColor: '#234436', color: '#F1F5F2', borderRadius: '8px' }}
                />
                <Area type="monotone" dataKey="wildlife" stroke="#34D399" strokeWidth={2} fillOpacity={1} fill="url(#colorWild)" name="Wildlife Signals" />
                <Area type="monotone" dataKey="suspicious" stroke="#F59E0B" strokeWidth={2} fillOpacity={1} fill="url(#colorSusp)" name="Suspicious Signals" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart B: Node Health Breakdown (Donut Pie Chart) */}
        <div className="rounded-2xl bg-forest-card border border-forest-border p-5 shadow-lg space-y-3 flex flex-col justify-between">
          <div>
            <h3 className="text-xs font-bold text-white uppercase tracking-wider">
              IoT Node Fleet Health Status
            </h3>
            <p className="text-[11px] text-forest-muted">
              Live connectivity, battery and sensor threshold states
            </p>
          </div>

          <div className="h-48 w-full flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={nodeHealthData}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={75}
                  paddingAngle={4}
                  dataKey="value"
                >
                  {nodeHealthData.map((entry: any, index: number) => (
                    <Cell key={`cell-${index}`} fill={NODE_COLORS[index % NODE_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{ backgroundColor: '#14231C', borderColor: '#234436', color: '#F1F5F2', borderRadius: '8px' }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="grid grid-cols-2 gap-2 text-xs font-mono">
            {nodeHealthData.map((item: any, idx: number) => (
              <div key={idx} className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: NODE_COLORS[idx % NODE_COLORS.length] }} />
                <span className="text-forest-muted text-[11px] truncate">{item.name}:</span>
                <span className="text-white font-bold ml-auto">{item.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Bottom Row: Emergency Response Performance & Activity Timeline */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Performance Gauges */}
        <div className="rounded-2xl bg-forest-card border border-forest-border p-5 shadow-lg space-y-4">
          <div>
            <h3 className="text-xs font-bold text-white uppercase tracking-wider">
              Emergency Response Performance
            </h3>
            <p className="text-[11px] text-forest-muted">
              Benchmark metrics for ranger dispatch and resolution
            </p>
          </div>

          <div className="space-y-4 pt-2">
            <div>
              <div className="flex justify-between text-xs mb-1 font-mono">
                <span className="text-forest-muted">Average Dispatch Response:</span>
                <span className="text-forest-accent font-bold">14.2 Minutes</span>
              </div>
              <div className="w-full h-2 bg-forest-darkest rounded-full overflow-hidden">
                <div className="h-full bg-forest-accent w-[72%] rounded-full" />
              </div>
            </div>

            <div>
              <div className="flex justify-between text-xs mb-1 font-mono">
                <span className="text-forest-muted">Average Resolution Time:</span>
                <span className="text-forest-accent font-bold">48.5 Minutes</span>
              </div>
              <div className="w-full h-2 bg-forest-darkest rounded-full overflow-hidden">
                <div className="h-full bg-forest-accent w-[84%] rounded-full" />
              </div>
            </div>

            <div>
              <div className="flex justify-between text-xs mb-1 font-mono">
                <span className="text-forest-muted">Resolution Verification Rate:</span>
                <span className="text-forest-accent font-bold">96.8%</span>
              </div>
              <div className="w-full h-2 bg-forest-darkest rounded-full overflow-hidden">
                <div className="h-full bg-emerald-500 w-[96%]" />
              </div>
            </div>
          </div>
        </div>

        {/* Recent Activity Timeline */}
        <div className="lg:col-span-2 rounded-2xl bg-forest-card border border-forest-border p-5 shadow-lg space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-xs font-bold text-white uppercase tracking-wider">
                System Activity & Telemetry Timeline
              </h3>
              <p className="text-[11px] text-forest-muted">
                Timestamped sensor triggers, gateway packet receipts & dispatch movements
              </p>
            </div>
            <Clock className="w-4 h-4 text-forest-accent" />
          </div>

          <div className="space-y-3 max-h-56 overflow-y-auto pr-1">
            {alerts.slice(0, 5).map((alt) => (
              <div key={alt.id} className="flex items-start gap-3 text-xs border-l-2 border-forest-accent/40 pl-3 py-1">
                <div className="font-mono text-[11px] text-forest-muted whitespace-nowrap">
                  {new Date(alt.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </div>
                <div className="flex-1">
                  <div className="font-semibold text-white">
                    {alt.title}
                  </div>
                  <div className="text-[11px] text-forest-muted">
                    Source: {alt.source_node} • Lat: {alt.lat?.toFixed(3)}, Lng: {alt.lng?.toFixed(3)}
                  </div>
                </div>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-forest-secondary text-forest-accent border border-forest-border">
                  {alt.status}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

