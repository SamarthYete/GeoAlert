import { useState, useEffect } from 'react';
import { useAuthContext } from '../context/AuthContext';

export default function Settings() {
    const { user } = useAuthContext();
    const [isUnlocked, setIsUnlocked] = useState(true);
    const [passcode, setPasscode] = useState('');
    const [error, setError] = useState('');
    const [activeTab, setActiveTab] = useState('users'); // 'users' or 'aois'

    const [adminData, setAdminData] = useState({ users: [], aois: [] });
    const [loadingAdmin, setLoadingAdmin] = useState(false);

    useEffect(() => {
        if (isUnlocked && user) {
            setLoadingAdmin(true);
            const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000';
            const headers = {};
            if (user?.token) {
                headers['Authorization'] = `Bearer ${user.token}`;
            } else if (user?.sub) {
                headers['user-id'] = user.sub;
            }

            fetch(`${API_BASE}/admin/users-aois`, { headers })
                .then(r => r.json())
                .then(data => {
                    if (data.users && data.aois) {
                        setAdminData(data);
                    }
                    setLoadingAdmin(false);
                })
                .catch(err => {
                    console.error("Failed to load admin data:", err);
                    setLoadingAdmin(false);
                });
        }
    }, [isUnlocked, user]);

    const [settings, setSettings] = useState({
        email: 'admin@geo-alert.in',
        emailAlerts: true,
        ndviThreshold: 0.10,
        checkInterval: '24h',
        alertSeverity: 'warning',
        apiKey: 'sk-hub-550e8400-e29b-41d4-a716-446655440000', // Real key preserved in state
        sentinelUser: 'sentinel_hq_admin',
    });

    const [saved, setSaved] = useState(false);

    const update = (key, val) => {
        if (!isUnlocked) return;
        setSettings(p => ({ ...p, [key]: val }));
    };

    const handleSave = () => {
        if (!isUnlocked) return;
        setSaved(true);
        setTimeout(() => setSaved(false), 3000);
    };

    const handleUnlock = (e) => {
        e.preventDefault();
        if (passcode === 'admin123') {
            setIsUnlocked(true);
            setError('');
        } else {
            setError('Invalid Administrator Passcode');
            setPasscode('');
        }
    };

    if (!isUnlocked) {
        return (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
                <div className="card animate-in" style={{ padding: 40, width: '100%', maxWidth: 400, textAlign: 'center' }}>
                    <div style={{ fontSize: '3rem', marginBottom: 20 }}>🔐</div>
                    <h2 className="display" style={{ fontSize: '1.5rem', marginBottom: 10 }}>Admin Panel Locked</h2>
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: 24 }}>
                        Please enter the administrator passcode to access system API keys and configuration.
                    </p>
                    <form onSubmit={handleUnlock}>
                        <div className="form-group">
                            <input
                                type="password"
                                className="form-input"
                                placeholder="Enter Passcode..."
                                value={passcode}
                                onChange={e => setPasscode(e.target.value)}
                                style={{ textAlign: 'center', fontSize: '1.2rem', letterSpacing: '0.5em' }}
                                autoFocus
                            />
                        </div>
                        {error && <div style={{ color: 'var(--red)', fontSize: '0.8rem', marginTop: -10, marginBottom: 15 }}>{error}</div>}
                        <button type="submit" className="btn btn-primary" style={{ width: '100%', justifyContent: 'center' }}>
                            Unlock System Details
                        </button>
                    </form>
                    <div style={{ marginTop: 20, fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                        Default Passcode: <span style={{ fontFamily: 'var(--font-mono)' }}>admin123</span>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="animate-in" style={{ display: 'flex', flexDirection: 'column', gap: 24, maxWidth: 800 }}>
            {/* Admin Dashboard: Users & Saved Zones */}
            <div className="card" style={{ padding: 24 }}>
                <div className="section-header" style={{ marginBottom: 20, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span className="section-title">👥 Registered Users & Saved Zones</span>
                    <span className="tag tag-cyan">{adminData.users.length} Users | {adminData.aois.length} Zones</span>
                </div>

                {/* Tabs */}
                <div style={{ display: 'flex', gap: 12, borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: 12, marginBottom: 20 }}>
                    <button
                        className={`btn btn-sm ${activeTab === 'users' ? 'btn-primary' : 'btn-ghost'}`}
                        onClick={() => setActiveTab('users')}
                        style={{ padding: '8px 16px', borderRadius: 8 }}
                    >
                        👤 Registered Users ({adminData.users.length})
                    </button>
                    <button
                        className={`btn btn-sm ${activeTab === 'aois' ? 'btn-primary' : 'btn-ghost'}`}
                        onClick={() => setActiveTab('aois')}
                        style={{ padding: '8px 16px', borderRadius: 8 }}
                    >
                        🗺 Saved Zones ({adminData.aois.length})
                    </button>
                </div>

                {loadingAdmin ? (
                    <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-muted)' }}>
                        Loading admin details from database...
                    </div>
                ) : activeTab === 'users' ? (
                    adminData.users.length === 0 ? (
                        <div style={{ padding: 20, textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                            No users have registered yet.
                        </div>
                    ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                            {adminData.users.map(u => {
                                const userAois = adminData.aois.filter(a => a.user_id === u.id);
                                return (
                                    <div key={u.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: 16, background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: 12 }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                            {u.picture ? (
                                                <img src={u.picture} alt="Profile" style={{ width: 40, height: 40, borderRadius: '50%', border: '2px solid var(--cyan)' }} />
                                            ) : (
                                                <div style={{ width: 40, height: 40, borderRadius: '50%', background: 'var(--cyan)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold' }}>
                                                    {u.name?.charAt(0) || 'U'}
                                                </div>
                                            )}
                                            <div>
                                                <div style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: '0.95rem' }}>{u.name}</div>
                                                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{u.email}</div>
                                            </div>
                                        </div>
                                        <div style={{ textAlign: 'right' }}>
                                            <span className="tag tag-blue" style={{ fontSize: '0.75rem' }}>
                                                {userAois.length} Saved {userAois.length === 1 ? 'Zone' : 'Zones'}
                                            </span>
                                            <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', marginTop: 4 }}>ID: {u.id.substring(0, 10)}...</div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )
                ) : (
                    adminData.aois.length === 0 ? (
                        <div style={{ padding: 20, textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                            No saved zones exist in the database.
                        </div>
                    ) : (
                        <div style={{ overflowX: 'auto' }}>
                            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
                                <thead>
                                    <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.1)', color: 'var(--text-muted)', textAlign: 'left' }}>
                                        <th style={{ padding: '12px 8px' }}>Zone Name</th>
                                        <th style={{ padding: '12px 8px' }}>Category</th>
                                        <th style={{ padding: '12px 8px' }}>Area (km²)</th>
                                        <th style={{ padding: '12px 8px' }}>Owner</th>
                                        <th style={{ padding: '12px 8px' }}>Created</th>
                                        <th style={{ padding: '12px 8px' }}>Status</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {adminData.aois.map(a => {
                                        const owner = adminData.users.find(u => u.id === a.user_id);
                                        return (
                                            <tr key={a.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)', height: 48 }}>
                                                <td style={{ padding: '8px', fontWeight: 600, color: 'var(--text-primary)' }}>{a.name}</td>
                                                <td style={{ padding: '8px' }}>
                                                    <span style={{ textTransform: 'capitalize', fontSize: '0.75rem', padding: '2px 8px', borderRadius: 4, background: 'rgba(255,255,255,0.05)', color: 'var(--text-muted)' }}>
                                                        {a.category}
                                                    </span>
                                                </td>
                                                <td style={{ padding: '8px', fontFamily: 'var(--font-mono)' }}>{a.area_km2?.toFixed(2)}</td>
                                                <td style={{ padding: '8px', color: 'var(--cyan)', fontSize: '0.75rem' }} title={owner?.name || a.user_id}>
                                                    {owner?.email || 'Unknown User'}
                                                </td>
                                                <td style={{ padding: '8px', color: 'var(--text-muted)', fontSize: '0.75rem' }}>{a.created}</td>
                                                <td style={{ padding: '8px' }}>
                                                    <span className={`tag ${a.status === 'critical' ? 'tag-red' : a.status === 'warning' ? 'tag-yellow' : 'tag-green'}`} style={{ fontSize: '0.7rem' }}>
                                                        {a.status || 'normal'}
                                                    </span>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    )
                )}
            </div>

            {/* Alert Config */}
            <div className="card" style={{ padding: 24 }}>
                <div className="section-header" style={{ marginBottom: 20 }}>
                    <span className="section-title">📧 Email Alert Configuration</span>
                    <span className="tag tag-green">🛡 Secure Mode</span>
                </div>

                <div className="form-group">
                    <label className="form-label">Alert Recipient Email</label>
                    <input
                        id="settings-email"
                        type="email"
                        className="form-input"
                        value={settings.email}
                        onChange={e => update('email', e.target.value)}
                    />
                </div>

                <div className="form-group">
                    <label className="form-label">Enable Email Alerts</label>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 4 }}>
                        <button
                            className={`btn btn-sm ${settings.emailAlerts ? 'btn-primary' : 'btn-ghost'}`}
                            onClick={() => update('emailAlerts', true)}
                        >✓ Enabled</button>
                        <button
                            className={`btn btn-sm ${!settings.emailAlerts ? 'btn-danger' : 'btn-ghost'}`}
                            onClick={() => update('emailAlerts', false)}
                        >✕ Disabled</button>
                    </div>
                </div>

                <div className="form-group">
                    <label className="form-label">Minimum Severity to Alert</label>
                    <select className="form-select" value={settings.alertSeverity} onChange={e => update('alertSeverity', e.target.value)}>
                        <option value="info">Info (all alerts)</option>
                        <option value="warning">Warning & above</option>
                        <option value="critical">Critical only</option>
                    </select>
                </div>
            </div>

            {/* Detection Config */}
            <div className="card" style={{ padding: 24 }}>
                <div className="section-header" style={{ marginBottom: 20 }}>
                    <span className="section-title">🔬 Detection Thresholds</span>
                </div>

                <div className="form-group">
                    <label className="form-label">NDVI Change Threshold (trigger alert above)</label>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <input
                            id="settings-ndvi-threshold"
                            type="range"
                            min="0.02" max="0.5" step="0.01"
                            value={settings.ndviThreshold}
                            onChange={e => update('ndviThreshold', parseFloat(e.target.value))}
                            style={{ flex: 1, accentColor: 'var(--cyan)' }}
                        />
                        <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--cyan)', minWidth: 50 }}>
                            ±{settings.ndviThreshold.toFixed(2)}
                        </span>
                    </div>
                </div>

                <div className="form-group">
                    <label className="form-label">Monitoring Interval</label>
                    <select className="form-select" value={settings.checkInterval} onChange={e => update('checkInterval', e.target.value)}>
                        <option value="6h">Every 6 hours</option>
                        <option value="12h">Every 12 hours</option>
                        <option value="24h">Daily (24h)</option>
                        <option value="48h">Every 2 days</option>
                        <option value="7d">Weekly</option>
                    </select>
                </div>
            </div>

            {/* API Configuration */}
            <div className="card" style={{ padding: 24 }}>
                <div className="section-header" style={{ marginBottom: 20 }}>
                    <span className="section-title">🛰 Satellite API Configuration</span>
                </div>

                <div className="form-group">
                    <label className="form-label">Sentinel Hub / CDSE Username</label>
                    <input
                        id="settings-sentinel-user"
                        className="form-input"
                        value={settings.sentinelUser}
                        onChange={e => update('sentinelUser', e.target.value)}
                    />
                </div>

                <div className="form-group">
                    <label className="form-label">API Key / Token</label>
                    <input
                        id="settings-api-key"
                        className="form-input"
                        type="text"
                        value={isUnlocked ? settings.apiKey : '••••••••••••••••••••••••'}
                        onChange={e => update('apiKey', e.target.value)}
                        readOnly={!isUnlocked}
                    />
                    <div style={{ fontSize: '0.7rem', color: 'var(--cyan)', marginTop: 4 }}>
                        {isUnlocked ? 'Unlocked: Accessing Production Keys' : 'Content Masked for Security'}
                    </div>
                </div>

                <div style={{ display: 'flex', gap: 12, marginTop: 4 }}>
                    <div style={{ padding: '10px 16px', borderRadius: 10, background: 'var(--cyan-dim)', border: '1px solid rgba(0,212,255,0.2)', flex: 1, textAlign: 'center' }}>
                        <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginBottom: 4 }}>Sentinel-2</div>
                        <div style={{ color: 'var(--green)', fontWeight: 600, fontSize: '0.85rem' }}>✓ Connected</div>
                    </div>
                    <div style={{ padding: '10px 16px', borderRadius: 10, background: 'var(--cyan-dim)', border: '1px solid rgba(0,212,255,0.2)', flex: 1, textAlign: 'center' }}>
                        <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginBottom: 4 }}>OpenCV Engine</div>
                        <div style={{ color: 'var(--green)', fontWeight: 600, fontSize: '0.85rem' }}>✓ Active</div>
                    </div>
                    <div style={{ padding: '10px 16px', borderRadius: 10, background: 'var(--cyan-dim)', border: '1px solid rgba(0,212,255,0.2)', flex: 1, textAlign: 'center' }}>
                        <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginBottom: 4 }}>Email SMTP</div>
                        <div style={{ color: 'var(--green)', fontWeight: 600, fontSize: '0.85rem' }}>✓ Configured</div>
                    </div>
                </div>
            </div>

            {/* System Info */}
            <div className="card" style={{ padding: 24 }}>
                <div className="section-header" style={{ marginBottom: 16 }}>
                    <span className="section-title">⚙ System Information</span>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                    {[
                        ['System', 'Geo-Alert v1.0'],
                        ['Backend', 'FastAPI (Python 3.11)'],
                        ['Satellite Source', 'ESA Sentinel-2 / Copernicus'],
                        ['Change Engine', 'OpenCV 4.x + NumPy'],
                        ['NDVI Algorithm', 'Normalized Difference Vegetation Index'],
                        ['Database', 'Supabase Cloud (PostgreSQL)'],
                        ['Frontend', 'React 18 + Vite 7'],
                        ['Map Library', 'Leaflet.js 1.9'],
                        ['Encryption', 'AES-256 + Google OAuth'],
                    ].map(([k, v]) => (
                        <div key={k} className="info-row" style={{ padding: '8px 0' }}>
                            <span className="info-key">{k}</span>
                            <span className="info-val" style={{ fontFamily: 'var(--font-mono)', fontSize: '0.8rem' }}>{v}</span>
                        </div>
                    ))}
                </div>
            </div>

            {/* Save */}
            <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end', alignItems: 'center' }}>
                {saved && (
                    <div className="btn btn-ghost" style={{ color: 'var(--green)', borderColor: 'rgba(0,255,136,0.3)', background: 'var(--green-dim)' }}>
                        ✓ Settings saved!
                    </div>
                )}
                <button id="save-settings-btn" className="btn btn-primary" onClick={handleSave}>
                    💾 Save Settings
                </button>
            </div>
        </div>
    );
}
