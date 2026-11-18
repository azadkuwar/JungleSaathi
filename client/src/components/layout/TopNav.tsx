import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { Logo } from './Logo';
import {
  Bell,
  Wifi,
  ShieldAlert,
  Play,
  CheckCircle2,
  Clock,
  User,
  Trees,
  Volume2
} from 'lucide-react';

export const TopNav: React.FC = () => {
  const {
    settings,
    alerts,
    setSimModalOpen,
    notifications,
    dismissNotification,
    setActiveTab,
    playChime
  } = useApp();

  const [currentTime, setCurrentTime] = useState(new Date());
  const [showNotifications, setShowNotifications] = useState(false);

  // Live ticking clock
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const activeAlertCount = alerts.filter(a => a.status === 'new' || a.status === 'acknowledged').length;
  const criticalCount = alerts.filter(a => a.severity === 'critical' && a.status !== 'resolved').length;

  return (
    <header className="h-16 bg-forest-card/90 backdrop-blur-md border-b border-forest-border px-4 lg:px-6 flex items-center justify-between sticky top-0 z-40 shadow-lg">
      {/* Left: Logo & Forest Sanctuary Details */}
      <div className="flex items-center gap-4 lg:gap-6">
        <Logo />

        <div className="hidden xl:flex items-center gap-2 pl-4 border-l border-forest-border text-xs">
          <Trees className="w-4 h-4 text-forest-accent" />
          <div className="flex flex-col">
            <span className="font-semibold text-white">
              {settings.forest_name || 'Bandhavgarh-Kanha Wildlife Corridor'}
            </span>
            <span className="text-[10px] text-forest-muted">
              Monitoring 4 Zones • 12 Active Sentry Nodes
            </span>
          </div>
        </div>
      </div>

      {/* Center: Prominent Simulation Button & Live System Status */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => setSimModalOpen(true)}
          className="flex items-center gap-2 px-3.5 py-1.5 rounded-lg bg-gradient-to-r from-red-600 via-orange-600 to-amber-600 hover:from-red-500 hover:to-amber-500 text-white font-bold text-xs uppercase tracking-wider shadow-lg shadow-red-950/40 hover:shadow-red-700/50 transition-all border border-red-400/40 active:scale-95 animate-pulse"
        >
          <Play className="w-3.5 h-3.5 fill-current" />
          <span>Simulate Forest Emergency</span>
        </button>

        {/* LoRa Mesh Connectivity Status */}
        <div className="hidden md:flex items-center gap-2 px-2.5 py-1 rounded-md bg-forest-primary/70 border border-forest-border text-xs">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-forest-accent opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-forest-accent"></span>
          </span>
          <Wifi className="w-3.5 h-3.5 text-forest-accent" />
          <span className="text-forest-muted text-[11px]">LoRa Mesh: <span className="text-white font-semibold">868.1 MHz</span></span>
        </div>

        {/* Demo Mode Badge */}
        <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-forest-secondary/40 border border-forest-accent/30 text-forest-accent text-[11px] font-mono">
          <span className="w-1.5 h-1.5 rounded-full bg-forest-accent"></span>
          <span className="font-bold">DEMO MODE</span>
        </div>
      </div>

      {/* Right: Notification Centre, Live Clock & User Profile */}
      <div className="flex items-center gap-3">
        {/* Sound Test / Chime button */}
        <button
          onClick={playChime}
          title="Test Alert Chime"
          className="p-2 rounded-lg text-forest-muted hover:text-white hover:bg-forest-cardHover transition-colors border border-transparent hover:border-forest-border"
        >
          <Volume2 className="w-4 h-4" />
        </button>

        {/* Notification Bell */}
        <div className="relative">
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            className="relative p-2 rounded-lg text-forest-muted hover:text-white hover:bg-forest-cardHover transition-colors border border-transparent hover:border-forest-border"
          >
            <Bell className="w-4 h-4" />
            {activeAlertCount > 0 && (
              <span className={`absolute top-1 right-1 flex items-center justify-center w-4 h-4 text-[10px] font-bold rounded-full text-white ${criticalCount > 0 ? 'bg-red-500 animate-bounce' : 'bg-amber-500'}`}>
                {activeAlertCount}
              </span>
            )}
          </button>

          {/* Notifications Dropdown Popover */}
          {showNotifications && (
            <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-forest-card border border-forest-border rounded-xl shadow-2xl z-50 overflow-hidden">
              <div className="p-3 bg-forest-primary/50 border-b border-forest-border flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <ShieldAlert className="w-4 h-4 text-forest-accent" />
                  <span className="font-bold text-xs text-white uppercase tracking-wider">
                    Alerts & System Events
                  </span>
                </div>
                <span className="text-[11px] font-mono text-forest-muted">
                  {activeAlertCount} Active
                </span>
              </div>

              <div className="max-h-80 overflow-y-auto divide-y divide-forest-border/40">
                {notifications.length === 0 ? (
                  <div className="p-6 text-center text-xs text-forest-muted">
                    No new notifications. All forest sectors tranquil.
                  </div>
                ) : (
                  notifications.map(n => (
                    <div
                      key={n.id}
                      className={`p-3 text-xs transition-colors hover:bg-forest-cardHover flex items-start gap-2.5 ${
                        n.type === 'critical' ? 'bg-red-950/20' : n.type === 'warning' ? 'bg-amber-950/20' : ''
                      }`}
                    >
                      <div className="mt-0.5">
                        {n.type === 'critical' ? (
                          <ShieldAlert className="w-4 h-4 text-red-400" />
                        ) : n.type === 'warning' ? (
                          <ShieldAlert className="w-4 h-4 text-amber-400" />
                        ) : (
                          <CheckCircle2 className="w-4 h-4 text-forest-accent" />
                        )}
                      </div>
                      <div className="flex-1">
                        <div className="font-semibold text-white">{n.title}</div>
                        <div className="text-forest-muted text-[11px] mt-0.5">{n.message}</div>
                        <div className="text-[10px] text-forest-muted/60 mt-1 font-mono">{n.timestamp}</div>
                      </div>
                      <button
                        onClick={() => dismissNotification(n.id)}
                        className="text-forest-muted hover:text-white text-xs px-1"
                      >
                        ×
                      </button>
                    </div>
                  ))
                )}
              </div>

              <div className="p-2 bg-forest-darkest/70 border-t border-forest-border text-center">
                <button
                  onClick={() => {
                    setShowNotifications(false);
                    setActiveTab('alerts');
                  }}
                  className="text-xs text-forest-accent hover:underline font-medium"
                >
                  View All Alerts & Incidents →
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Live Date & Time */}
        <div className="hidden lg:flex items-center gap-2 pl-3 border-l border-forest-border text-xs text-forest-muted">
          <Clock className="w-3.5 h-3.5 text-forest-accent" />
          <div className="flex flex-col font-mono text-[11px]">
            <span className="text-white font-medium">
              {currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
            </span>
            <span className="text-[10px] text-forest-muted">
              {currentTime.toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })}
            </span>
          </div>
        </div>

        {/* Ranger Profile */}
        <div className="flex items-center gap-2 pl-2 border-l border-forest-border">
          <div className="w-8 h-8 rounded-full bg-forest-secondary border border-forest-accent/40 flex items-center justify-center text-forest-accent">
            <User className="w-4 h-4" />
          </div>
          <div className="hidden 2xl:flex flex-col text-left">
            <span className="text-xs font-semibold text-white leading-tight">
              Ranger Vikram Sen
            </span>
            <span className="text-[10px] text-forest-accent">
              Chief Conservator
            </span>
          </div>
        </div>
      </div>
    </header>
  );
};

