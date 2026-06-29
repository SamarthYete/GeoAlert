import { useState } from 'react';

export default function Settings() {
    const [isUnlocked, setIsUnlocked] = useState(false);
    const [passcode, setPasscode] = useState('');
    const [error, setError] = useState('');

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
                <button className="btn btn-ghost" onClick={() => setIsUnlocked(false)}>🔒 Lock Panel</button>
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
