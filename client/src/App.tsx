import React, { useState } from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { TopNav } from './components/layout/TopNav';
import { Sidebar } from './components/layout/Sidebar';
import { EmergencySimulationModal } from './components/simulation/EmergencySimulationModal';

// 13 Application Pages + Virtual Audio Node
import { OverviewDashboard } from './pages/OverviewDashboard';
import { LiveForestMap } from './pages/LiveForestMap';
import { AISoundRecognition } from './pages/AISoundRecognition';
import { VirtualAudioNode } from './pages/VirtualAudioNode';
import { MobileAudioNode } from './pages/MobileAudioNode';
import { ModelTrainingStudio } from './pages/ModelTrainingStudio';
import { SensorNodes } from './pages/SensorNodes';
import { LoRaGateways } from './pages/LoRaGateways';
import { AlertsIncidents } from './pages/AlertsIncidents';
import { TeamDispatch } from './pages/TeamDispatch';
import { IncidentResolution } from './pages/IncidentResolution';
import { RFIDVehicleMonitoring } from './pages/RFIDVehicleMonitoring';
import { AnalyticsReports } from './pages/AnalyticsReports';
import { SystemArchitecture } from './pages/SystemArchitecture';
import { SystemSettings } from './pages/SystemSettings';

const AppLayout: React.FC = () => {
  const { activeTab, setActiveTab } = useApp();
  const [collapsed, setCollapsed] = useState(false);

  const renderActiveTab = () => {
    switch (activeTab) {
      case 'overview':
        return <OverviewDashboard />;
      case 'map':
        return <LiveForestMap />;
      case 'audio':
        return <AISoundRecognition />;
      case 'virtual-node':
        return (
          <div className="p-6">
            <VirtualAudioNode 
              onNavigateToMap={(nodeId) => {
                setActiveTab('map');
              }} 
              onNavigateToIncidents={() => {
                setActiveTab('resolution');
              }} 
            />
          </div>
        );
      case 'training':
        return <ModelTrainingStudio />;
      case 'nodes':
        return <SensorNodes />;
      case 'gateways':
        return <LoRaGateways />;
      case 'alerts':
        return <AlertsIncidents />;
      case 'dispatch':
        return <TeamDispatch />;
      case 'resolution':
        return <IncidentResolution />;
      case 'rfid':
        return <RFIDVehicleMonitoring />;
      case 'analytics':
        return <AnalyticsReports />;
      case 'architecture':
        return <SystemArchitecture />;
      case 'settings':
        return <SystemSettings />;
      default:
        return <OverviewDashboard />;
    }
  };

  return (
    <div className="min-h-screen bg-forest-darkest text-forest-text flex flex-col font-sans select-none antialiased">
      {/* Top Navigation */}
      <TopNav />

      {/* Body: Sidebar + Main Content View */}
      <div className="flex-1 flex overflow-hidden">
        <Sidebar collapsed={collapsed} setCollapsed={setCollapsed} />
        
        <main className="flex-1 overflow-y-auto bg-forest-darkest relative">
          {renderActiveTab()}
        </main>
      </div>

      {/* Global Interactive Simulation Runner Modal */}
      <EmergencySimulationModal />
    </div>
  );
};

export function App() {
  // If user opens mobile node URL on their phone, show mobile node interface
  const isMobileNode = window.location.pathname.includes('/mobile-node') || 
    (window.location.search.includes('code=') && !window.location.pathname.includes('/api'));

  if (isMobileNode) {
    return <MobileAudioNode />;
  }

  return (
    <AppProvider>
      <AppLayout />
    </AppProvider>
  );
}

export default App;
