import { useState } from 'react';
import Dashboard from './pages/Dashboard';
import MapExplorer from './pages/MapExplorer';
import Analysis from './pages/Analysis';
import Alerts from './pages/Alerts';
import Settings from './pages/Settings';
import Landing from './pages/Landing';
import Sidebar from './components/Sidebar';
import Topbar from './components/Topbar';
import { SpaceBackground } from './components/SpaceBackground';
import { useAuthContext } from './context/AuthContext';

const PAGES = {
  dashboard: Dashboard,
  map: MapExplorer,
  analysis: Analysis,
  alerts: Alerts,
  settings: Settings,
};

export default function App() {
  const { user } = useAuthContext();
  const [activePage, setActivePage] = useState('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(false);

  if (!user) {
    return <Landing />;
  }

  const PageComponent = PAGES[activePage] || Dashboard;

  const pageTitles = {
    dashboard: 'Mission Control',
    map: 'Map Explorer & AOI Selection',
    analysis: 'Change Detection Analysis',
    alerts: 'Alert Center',
    settings: 'System Configuration',
  };

  const handlePageChange = (page) => {
    setActivePage(page);
    setSidebarOpen(false); // Auto-close sidebar on mobile after navigation
  };

  return (
    <SpaceBackground>
      <div className={`app-layout ${sidebarOpen ? 'sidebar-open' : ''}`}>
        {/* Mobile Hamburger Button */}
        <button 
          className="mobile-hamburger" 
          onClick={() => setSidebarOpen(!sidebarOpen)}
          aria-label="Toggle navigation menu"
        >
          <span className={`hamburger-icon ${sidebarOpen ? 'open' : ''}`}>
            <span></span>
            <span></span>
            <span></span>
          </span>
        </button>

        {/* Overlay for mobile when sidebar is open */}
        {sidebarOpen && (
          <div 
            className="mobile-overlay" 
            onClick={() => setSidebarOpen(false)} 
          />
        )}

        <Sidebar activePage={activePage} setActivePage={handlePageChange} />

        <div className="main-content">
          <Topbar title={pageTitles[activePage]} activePage={activePage} />
          <div className="page-content">
            <PageComponent setActivePage={handlePageChange} />
          </div>
        </div>
      </div>
    </SpaceBackground>
  );
}
