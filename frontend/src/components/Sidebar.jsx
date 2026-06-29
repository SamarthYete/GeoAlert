import { useAuthContext } from '../context/AuthContext';
import { useAlerts } from '../hooks/useData';

export default function Sidebar({ activePage, setActivePage }) {
    const { user, logout } = useAuthContext();
    const { alerts } = useAlerts();
    
    // Calculate unread or critical alerts
    const alertCount = alerts.filter(a => a.severity === 'critical' || a.severity === 'warning').length;

    const navItems = [
        { id: 'dashboard', icon: '⬡', label: 'Mission Control' },
        { id: 'map', icon: '🗺', label: 'Map Explorer' },
        { id: 'analysis', icon: '🔬', label: 'Analysis' },
        { id: 'alerts', icon: '🔔', label: 'Alerts', badge: alertCount },
    ];

    return (
        <aside className="sidebar">
            {/* Logo */}
            <div className="sidebar-logo">
                <div className="logo-icon">🛰</div>
                <div>
                    <div className="logo-text">Geo-Alert</div>
                    <div className="logo-sub">Geospatial Intelligence</div>
                </div>
            </div>

            {/* Nav */}
            <nav className="sidebar-nav">
                <div className="nav-label">Navigation</div>
                {navItems.map(item => (
                    <button
                        key={item.id}
                        id={`nav-${item.id}`}
                        className={`nav-item${activePage === item.id ? ' active' : ''}`}
                        onClick={() => setActivePage(item.id)}
                        style={{ width: '100%', textAlign: 'left' }}
                    >
                        <span className="nav-icon">{item.icon}</span>
                        <span>{item.label}</span>
                        {item.badge > 0 && (
                            <span className="nav-badge">{item.badge}</span>
                        )}
                    </button>
                ))}

                {user?.email === 'admin@geo-alert.space' && (
                    <>
                        <div className="nav-label" style={{ marginTop: 8 }}>System Control</div>
                        <button
                            className={`nav-item${activePage === 'settings' ? ' active' : ''}`}
                            onClick={() => setActivePage('settings')}
                            style={{ width: '100%', textAlign: 'left' }}
                        >
                            <span className="nav-icon">⚙️ 🔒</span>
                            <span>Admin Console</span>
                        </button>
                    </>
                )}
            </nav>

            {/* Footer status / User profile */}
            {user && (
                <div className="sidebar-footer" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        {user.picture ? (
                            <img src={user.picture} alt="Profile" style={{ width: 36, height: 36, borderRadius: '50%', border: '2px solid var(--border-bright)' }} />
                        ) : (
                            <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'var(--cyan)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold' }}>
                                {user.name?.charAt(0) || 'U'}
                            </div>
                        )}
                        <div style={{ overflow: 'hidden' }}>
                            <div style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-primary)', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>
                                {user.name}
                            </div>
                            <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>
                                {user.email}
                            </div>
                        </div>
                    </div>
                    <button onClick={logout} className="btn btn-ghost btn-sm" style={{ width: '100%', justifyContent: 'center', fontSize: '0.75rem', border: '1px solid rgba(255,69,96,0.2)', color: 'var(--red)' }}>
                        Sign Out
                    </button>
                </div>
            )}
        </aside>
    );
}
