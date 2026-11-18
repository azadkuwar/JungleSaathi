import React from 'react';
import { useApp } from '../../context/AppContext';
import {
  LayoutDashboard,
  MapPin,
  Mic,
  Smartphone,
  Cpu,
  Radio,
  Wifi,
  Bell,
  Truck,
  CheckCircle2,
  FileCheck,
  BarChart3,
  Layers,
  Settings,
  Shield,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';

interface SidebarProps {
  collapsed: boolean;
  setCollapsed: (collapsed: boolean) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ collapsed, setCollapsed }) => {
  const { activeTab, setActiveTab, alerts, teams, nodes } = useApp();

  const activeAlertsCount = alerts.filter(a => a.status === 'new' || a.status === 'acknowledged').length;
  const activeTeamsCount = teams.filter(t => t.status !== 'available').length;
  const warningNodesCount = nodes.filter(n => n.status !== 'online').length;

  const navItems = [
    { id: 'overview', label: 'Overview Dashboard', icon: LayoutDashboard, badge: null },
    { id: 'map', label: 'Live Forest Map', icon: MapPin, badge: null },
    { id: 'audio', label: 'AI Sound Recognition', icon: Mic, badge: 'Live AI' },
    { id: 'virtual-node', label: 'Virtual Audio Node', icon: Smartphone, badge: 'Phone Mic', badgeColor: 'bg-emerald-500/20 text-emerald-300' },
    { id: 'training', label: 'Model Training Studio', icon: Cpu, badge: null },
    { id: 'nodes', label: 'Sensor Monitoring Nodes', icon: Radio, badge: warningNodesCount > 0 ? `${warningNodesCount} Alert` : null, badgeColor: 'bg-amber-500/20 text-amber-300' },
    { id: 'gateways', label: 'LoRa Gateway Mgmt', icon: Wifi, badge: null },
    { id: 'alerts', label: 'Alerts & Incidents', icon: Bell, badge: activeAlertsCount > 0 ? activeAlertsCount : null, badgeColor: 'bg-red-500 text-white' },
    { id: 'dispatch', label: 'Emergency Team Dispatch', icon: Truck, badge: activeTeamsCount > 0 ? `${activeTeamsCount} Field` : null, badgeColor: 'bg-blue-500/30 text-blue-300' },
    { id: 'resolution', label: 'Incident Resolution', icon: FileCheck, badge: null },
    { id: 'rfid', label: 'RFID Vehicle Monitoring', icon: Shield, badge: null },
    { id: 'analytics', label: 'Analytics & Reports', icon: BarChart3, badge: null },
    { id: 'architecture', label: 'System Architecture', icon: Layers, badge: '6 Layers' },
    { id: 'settings', label: 'System Settings', icon: Settings, badge: null }
  ];

  return (
    <aside
      className={`bg-forest-card border-r border-forest-border flex flex-col justify-between transition-all duration-300 z-30 select-none ${
        collapsed ? 'w-16' : 'w-64'
      }`}
    >
      {/* Navigation List */}
      <div className="flex-1 py-3 px-2 overflow-y-auto space-y-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;

          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              title={collapsed ? item.label : undefined}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-medium transition-all group relative ${
                isActive
                  ? 'bg-forest-primary text-forest-accent border border-forest-accent/30 shadow-md shadow-emerald-950/40'
                  : 'text-forest-muted hover:text-white hover:bg-forest-cardHover'
              }`}
            >
              {/* Active Indicator Line */}
              {isActive && (
                <span className="absolute left-0 top-1.5 bottom-1.5 w-1 bg-forest-accent rounded-r-full" />
              )}

              <Icon
                className={`w-4 h-4 flex-shrink-0 transition-transform duration-200 group-hover:scale-110 ${
                  isActive ? 'text-forest-accent' : 'text-forest-muted group-hover:text-white'
                }`}
              />

              {!collapsed && (
                <div className="flex-1 flex items-center justify-between text-left truncate">
                  <span className="truncate">{item.label}</span>
                  {item.badge && (
                    <span
                      className={`text-[10px] px-1.5 py-0.5 rounded font-mono font-bold tracking-tight ml-2 ${
                        item.badgeColor || 'bg-forest-secondary text-forest-accent border border-forest-border'
                      }`}
                    >
                      {item.badge}
                    </span>
                  )}
                </div>
              )}
            </button>
          );
        })}
      </div>

      {/* Footer / Collapse Toggle */}
      <div className="p-2 border-t border-forest-border/60 bg-forest-darkest/40 flex items-center justify-between">
        {!collapsed && (
          <div className="flex flex-col pl-2 text-[10px] text-forest-muted/70 font-mono">
            <span>Jungle Saathi v2.4</span>
            <span className="text-forest-accent">Core Engine Active</span>
          </div>
        )}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="p-2 rounded-lg text-forest-muted hover:text-white hover:bg-forest-cardHover transition-colors ml-auto"
          title={collapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
        >
          {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </button>
      </div>
    </aside>
  );
};

