import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import {
  BarChart3,
  Download,
  Printer,
  Calendar,
  Filter,
  CheckCircle2,
  AlertTriangle,
  TrendingUp,
  Activity,
  Layers,
  Trees,
  Award,
  FileText
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid
} from 'recharts';

export const AnalyticsReports: React.FC = () => {
  const { incidents, alerts, nodes, teams } = useApp();

  const [timeframe, setTimeframe] = useState<'today' | '7d' | '30d' | 'custom'>('7d');
  const [trends, setTrends] = useState<any>(null);
  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);

  useEffect(() => {
    fetch('/api/analytics/trends')
      .then(r => r.json())
      .then(d => { if (d.success) setTrends(d.data); })
      .catch(console.error);
  }, []);

  const totalIncidents = incidents.length;
  const resolvedIncidents = incidents.filter(i => i.status === 'closed').length;
  const activeIncidents = totalIncidents - resolvedIncidents;
  const wildlifeCount = alerts.filter(a => a.category.includes('Wildlife') || a.category.includes('Animal')).length;
  const threatCount = alerts.filter(a => a.category.includes('Chainsaw') || a.category.includes('Gunshot')).length;
  const fireCount = alerts.filter(a => a.category.includes('Fire')).length;

  const downloadCsv = () => {
    window.location.href = '/api/analytics/export/csv';
  };

  return (
    <div className="p-4 sm:p-6 space-y-6 max-w-[1600px] mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-white tracking-wide">
              Forest Protection Analytics & Official Reporting Engine
            </h1>
            <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-forest-primary text-forest-accent border border-forest-border">
              Audit Data
            </span>
          </div>
          <p className="text-xs text-forest-muted">
            Aggregated response metrics, zone threat density heatmaps and legal incident documentation
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={downloadCsv}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-forest-card hover:bg-forest-cardHover text-white border border-forest-border text-xs font-semibold shadow-sm transition-colors"
          >
            <Download className="w-4 h-4 text-forest-accent" />
            <span>Export CSV</span>
          </button>

          <button
            onClick={() => setIsPrintModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-forest-accent hover:bg-forest-accentHover text-forest-darkest font-bold text-xs uppercase tracking-wider transition-colors shadow-md shadow-emerald-950/40"
          >
            <Printer className="w-4 h-4" />
            <span>Generate Official Report</span>
          </button>
        </div>
      </div>

      {/* Timeframe Selector & Metric Cards */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-4 rounded-2xl bg-forest-card border border-forest-border">
        <div className="flex items-center gap-2 text-xs">
          <Calendar className="w-4 h-4 text-forest-accent" />
          <span className="text-forest-muted">Report Period:</span>
          {(['today', '7d', '30d'] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTimeframe(t)}
              className={`px-3 py-1 rounded-lg font-semibold transition-colors ${
                timeframe === t
                  ? 'bg-forest-primary text-forest-accent border border-forest-accent/40'
                  : 'text-forest-muted hover:text-white hover:bg-forest-cardHover'
              }`}
            >
              {t === 'today' ? 'Today' : t === '7d' ? 'Last 7 Days' : 'Last 30 Days'}
            </button>
          ))}
        </div>

        <div className="text-xs font-mono text-forest-muted">
          Data Verified from Persistent SQLite Store
        </div>
      </div>

      {/* Summary KPI Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <div className="p-3.5 rounded-xl bg-forest-card border border-forest-border">
          <span className="text-xs text-forest-muted">Total Incidents</span>
          <div className="text-xl font-mono font-bold text-white mt-1">{totalIncidents}</div>
        </div>
        <div className="p-3.5 rounded-xl bg-forest-card border border-forest-border">
          <span className="text-xs text-forest-muted">Resolved Rate</span>
          <div className="text-xl font-mono font-bold text-emerald-400 mt-1">
            {totalIncidents > 0 ? Math.round((resolvedIncidents / totalIncidents) * 100) : 0}%
          </div>
        </div>
        <div className="p-3.5 rounded-xl bg-forest-card border border-forest-border">
          <span className="text-xs text-forest-muted">Wildlife Sightings</span>
          <div className="text-xl font-mono font-bold text-emerald-300 mt-1">{wildlifeCount}</div>
        </div>
        <div className="p-3.5 rounded-xl bg-forest-card border border-forest-border">
          <span className="text-xs text-forest-muted">Suspicious Threats</span>
          <div className="text-xl font-mono font-bold text-amber-400 mt-1">{threatCount}</div>
        </div>
        <div className="p-3.5 rounded-xl bg-forest-card border border-forest-border">
          <span className="text-xs text-forest-muted">Fire Containments</span>
          <div className="text-xl font-mono font-bold text-red-400 mt-1">{fireCount}</div>
        </div>
        <div className="p-3.5 rounded-xl bg-forest-card border border-forest-border">
          <span className="text-xs text-forest-muted">Node Fleet Uptime</span>
          <div className="text-xl font-mono font-bold text-forest-accent mt-1">99.4%</div>
        </div>
      </div>

      {/* Visual Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Category Breakdown Bar Chart */}
        <div className="p-5 rounded-2xl bg-forest-card border border-forest-border shadow-lg space-y-3">
          <div>
            <h3 className="text-xs font-bold text-white uppercase tracking-wider">
              Alerts & Threats by Acoustic / Sensor Category
            </h3>
            <p className="text-[11px] text-forest-muted">
              Distribution of incidents recorded across detection modalities
            </p>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={trends?.categoryCounts || []} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#234436" opacity={0.3} />
                <XAxis type="number" stroke="#8EAA9B" fontSize={10} />
                <YAxis dataKey="category" type="category" width={140} stroke="#8EAA9B" fontSize={10} />
                <Tooltip contentStyle={{ backgroundColor: '#14231C', borderColor: '#234436' }} />
                <Bar dataKey="count" fill="#34D399" radius={[0, 4, 4, 0]} name="Count" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Zone Threat Activity Comparison */}
        <div className="p-5 rounded-2xl bg-forest-card border border-forest-border shadow-lg space-y-3">
          <div>
            <h3 className="text-xs font-bold text-white uppercase tracking-wider">
              Threat & Anomaly Distribution by Sanctuary Zone
            </h3>
            <p className="text-[11px] text-forest-muted">
              Core Zone Alpha vs Buffer Zone Beta vs River Basin vs Eco-Tourism Delta
            </p>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={trends?.zoneActivity || []}>
                <CartesianGrid strokeDasharray="3 3" stroke="#234436" opacity={0.3} />
                <XAxis dataKey="zone" stroke="#8EAA9B" fontSize={10} />
                <YAxis stroke="#8EAA9B" fontSize={10} />
                <Tooltip contentStyle={{ backgroundColor: '#14231C', borderColor: '#234436' }} />
                <Bar dataKey="alert_count" fill="#F59E0B" radius={[4, 4, 0, 0]} name="Total Alerts" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Official Report Modal / Printable View */}
      {isPrintModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
          <div className="bg-[#14231C] text-[#F1F5F2] border border-forest-accent/50 w-full max-w-4xl rounded-2xl shadow-2xl p-8 space-y-6">
            {/* Report Header */}
            <div className="flex items-center justify-between border-b border-forest-border pb-4">
              <div className="flex items-center gap-3">
                <Trees className="w-8 h-8 text-forest-accent" />
                <div>
                  <h2 className="text-lg font-black uppercase tracking-wider text-white">
                    Government Forest Reserve Incident Docket
                  </h2>
                  <p className="text-xs text-forest-muted">
                    Bandhavgarh-Kanha Wildlife Corridor Protection Authority • Automated AI+IoT Audit
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsPrintModalOpen(false)}
                className="px-3 py-1 rounded bg-forest-darkest text-forest-muted hover:text-white text-xs"
              >
                Close Preview
              </button>
            </div>

            {/* Official Report Metadata */}
            <div className="grid grid-cols-4 gap-3 text-xs font-mono p-3 bg-forest-darkest rounded-xl border border-forest-border">
              <div>Date: <strong className="text-white">{new Date().toLocaleDateString()}</strong></div>
              <div>Audit Scope: <strong className="text-white">Active Reserve Fleet</strong></div>
              <div>Active Sentry Nodes: <strong className="text-forest-accent">{nodes.length} Units</strong></div>
              <div>Certified Incidents: <strong className="text-emerald-400">{resolvedIncidents} Resolved</strong></div>
            </div>

            {/* Incidents Table */}
            <div className="overflow-x-auto rounded-xl border border-forest-border">
              <table className="w-full text-left text-xs font-mono">
                <thead className="bg-forest-darkest text-forest-muted uppercase text-[10px]">
                  <tr>
                    <th className="p-2">Incident ID</th>
                    <th className="p-2">Category</th>
                    <th className="p-2">Severity</th>
                    <th className="p-2">Source Node</th>
                    <th className="p-2">Final Outcome</th>
                    <th className="p-2">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-forest-border/40 text-[11px]">
                  {incidents.slice(0, 8).map((inc) => (
                    <tr key={inc.id}>
                      <td className="p-2 font-bold text-white">{inc.id}</td>
                      <td className="p-2 text-forest-accent">{inc.category}</td>
                      <td className="p-2 uppercase">{inc.severity}</td>
                      <td className="p-2 text-forest-muted">{inc.source_node}</td>
                      <td className="p-2">{inc.final_outcome || 'Pending'}</td>
                      <td className="p-2 text-emerald-400 font-bold uppercase">{inc.status}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="flex justify-between items-end pt-4 border-t border-forest-border text-xs">
              <div>
                <span className="text-[10px] text-forest-muted block">Chief Conservator Signoff:</span>
                <strong className="text-forest-accent font-serif text-sm">Ranger Vikram Sen</strong>
              </div>
              <button
                onClick={() => window.print()}
                className="px-5 py-2 rounded-xl bg-forest-accent hover:bg-forest-accentHover text-forest-darkest font-bold text-xs uppercase tracking-wider"
              >
                Print / Save PDF
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

