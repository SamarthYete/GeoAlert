import { useState } from 'react';
import { useAlerts, useAOIs } from '../hooks/useData';
import { formatTimestamp, getNdviColor } from '../data/mockData';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000';

export default function Alerts({ setActivePage }) {
    const { alerts, dismissAlert } = useAlerts();
    const { aois, updateAOI } = useAOIs();
    const [filter, setFilter] = useState('all');
    const [emailSent, setEmailSent] = useState(new Set());

    const filtered = filter === 'all' ? alerts : alerts.filter(a => a.severity === filter);

    const handleSendEmail = async (alertId, e) => {
        e.stopPropagation();
        
        try {
            const res = await fetch(`${API_BASE}/alerts/${alertId}/email`, { method: 'POST' });
            if (res.ok) {
                setEmailSent(prev => new Set([...prev, alertId]));
                alert('Alert dispatched! Ensure your backend .env string is correctly configured if you do not see it in your Inbox.');
            } else {
                const data = await res.json().catch(() => ({}));
                alert(`Backend Error: ${data.detail || 'Failed to send email. Check SMTP variables in backend/.env'}`);
            }
        } catch (err) {
            console.error(err);
            alert('SMTP Request Failed. Is the backend running?');
        }
    };

    const criticalCount = alerts.filter(a => a.severity === 'critical').length;
    const warningCount = alerts.filter(a => a.severity === 'warning').length;
    const infoCount = alerts.filter(a => a.severity === 'info').length;

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

            {/* Summary Bar */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16 }}>
                {[
                    { label: 'Total Alerts', value: alerts.length, color: 'var(--cyan)', filter: 'all' },
                    { label: 'Critical', value: criticalCount, color: 'var(--red)', filter: 'critical' },
                    { label: 'Warning', value: warningCount, color: 'var(--amber)', filter: 'warning' },
                    { label: 'Info', value: infoCount, color: 'var(--cyan)', filter: 'info' },
                ].map(s => (
                    <div
                        key={s.label}
                        className="stat-card"
                        style={{ cursor: 'pointer', borderColor: filter === s.filter ? s.color + '60' : undefined }}
                        onClick={() => setFilter(s.filter)}
                    >
                        <div className="stat-label">{s.label}</div>
                        <div className="stat-value" style={{ color: s.color, fontSize: '2rem' }}>{s.value}</div>
                        {filter === s.filter && <div style={{ marginTop: 8, height: 2, background: s.color, borderRadius: 1 }} />}
                    </div>
                ))}
            </div>

            {/* Live Status Grid */}
            <div style={{ background: 'rgba(0,0,0,0.2)', padding: 16, borderRadius: 16, border: '1px solid var(--border)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                    <div style={{ fontWeight: 700, fontSize: '0.95rem', color: 'var(--text-primary)' }}>📡 Live Zone Status — Automated Tracking</div>
                    <button className="btn btn-ghost btn-sm" onClick={() => setActivePage('dashboard')}>Monitor Dashboard →</button>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 12 }}>
                    {aois.length === 0 ? (
                        <div style={{ gridColumn: '1/-1', textAlign: 'center', padding: '20px', color: 'var(--text-muted)', fontSize: '0.85rem' }}>No active zones found for monitoring.</div>
                    ) : aois.map(aoi => (
                        <div key={aoi.id} className="card" style={{ padding: 12, borderLeft: `4px solid ${aoi.status === 'critical' ? 'var(--red)' : aoi.status === 'warning' ? 'var(--amber)' : 'var(--green)'}` }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 6 }}>
                                <div style={{ fontWeight: 600, fontSize: '0.85rem' }}>{aoi.name}</div>
                                <span className={`tag tag-sm tag-${aoi.status === 'critical' ? 'red' : aoi.status === 'warning' ? 'amber' : 'green'}`} style={{ fontSize: '0.65rem' }}>{aoi.status}</span>
                            </div>
                            <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                                <div style={{ fontSize: '1.2rem', fontFamily: 'var(--font-mono)', fontWeight: 800, color: getNdviColor(aoi.ndvi) || 'var(--cyan)' }}>{aoi.ndvi}</div>
                                <div style={{ fontSize: '0.8rem', color: aoi.ndviChange < 0 ? 'var(--red)' : 'var(--green)', fontWeight: 600 }}>{aoi.ndviChange > 0 ? '+' : ''}{aoi.ndviChange}% Δ</div>
                                <div 
                                    style={{ marginLeft: 'auto', textAlign: 'right', cursor: 'pointer' }}
                                    onClick={() => {
                                        const newVal = window.prompt(`Update threshold for ${aoi.name}:`, aoi.alert_threshold ?? 15);
                                        if (newVal && !isNaN(parseFloat(newVal))) updateAOI(aoi.id, { alert_threshold: parseFloat(newVal) });
                                    }}
                                >
                                    <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>Threshold</div>
                                    <div style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--amber)' }}>&gt;{aoi.alert_threshold ?? 15}% Δ ⚙️</div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Controls */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <span style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>
                    Showing {filtered.length} of {alerts.length} alerts
                </span>
                <div style={{ marginLeft: 'auto', display: 'flex', gap: 8 }}>
                    {['all', 'critical', 'warning', 'info'].map(f => (
                        <button
                            key={f}
                            id={`filter-${f}`}
                            className={`btn btn-sm ${filter === f ? 'btn-primary' : 'btn-ghost'}`}
                            onClick={() => setFilter(f)}
                            style={{ textTransform: 'capitalize' }}
                        >
                            {f}
                        </button>
                    ))}
                </div>
            </div>

            {/* Alert List */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {filtered.length === 0 && (
                    <div style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--text-muted)' }}>
                        <div style={{ fontSize: '3rem', marginBottom: 12 }}>✅</div>
                        <div style={{ fontWeight: 600, marginBottom: 6 }}>No alerts in this category</div>
                        <div style={{ fontSize: '0.85rem' }}>All zones are within normal parameters</div>
                    </div>
                )}
                {filtered.map(alert => (
                    <div
                        key={alert.id}
                        id={`alert-${alert.id}`}
                        className="card animate-in"
                        style={{
                            padding: '18px 20px',
                            borderColor: alert.severity === 'critical' ? 'rgba(255,69,96,0.3)' : alert.severity === 'warning' ? 'rgba(255,176,32,0.25)' : 'rgba(0,212,255,0.2)',
                            background: alert.severity === 'critical' ? 'rgba(255,69,96,0.05)' : alert.severity === 'warning' ? 'rgba(255,176,32,0.05)' : 'rgba(0,212,255,0.04)',
                        }}
                    >
                        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 16 }}>
                            {/* Severity indicator */}
                            <div style={{
                                width: 44, height: 44,
                                borderRadius: 12,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontSize: '1.4rem',
                                background: alert.severity === 'critical' ? 'var(--red-dim)' : alert.severity === 'warning' ? 'var(--amber-dim)' : 'var(--cyan-dim)',
                                border: `1px solid ${alert.severity === 'critical' ? 'rgba(255,69,96,0.3)' : alert.severity === 'warning' ? 'rgba(255,176,32,0.3)' : 'rgba(0,212,255,0.3)'}`,
                                flexShrink: 0,
                            }}>
                                {alert.severity === 'critical' ? '🔴' : alert.severity === 'warning' ? '⚠️' : 'ℹ️'}
                            </div>

                            <div style={{ flex: 1 }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6, flexWrap: 'wrap' }}>
                                    <span style={{
                                        fontWeight: 700,
                                        fontSize: '1rem',
                                        color: alert.severity === 'critical' ? 'var(--red)' : alert.severity === 'warning' ? 'var(--amber)' : 'var(--cyan)',
                                    }}>
                                        {alert.title}
                                    </span>
                                    <span className={`alert-severity ${alert.severity}`}>{alert.severity}</span>
                                    {(alert.emailSent || emailSent.has(alert.id)) && (
                                        <span className="tag tag-green" style={{ fontSize: '0.68rem' }}>📧 Email Sent</span>
                                    )}
                                </div>

                                <div style={{ fontSize: '0.825rem', color: 'var(--text-secondary)', lineHeight: 1.5, marginBottom: 10 }}>
                                    {alert.description}
                                </div>

                                {/* Metrics Row */}
                                <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap', marginBottom: 10 }}>
                                    <div>
                                        <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>AOI</div>
                                        <div style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--cyan)' }}>{alert.aoiName}</div>
                                    </div>
                                    <div>
                                        <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Change</div>
                                        <div style={{ fontSize: '0.8rem', fontWeight: 600, fontFamily: 'var(--font-mono)', color: 'var(--red)' }}>{alert.change_percent}%</div>
                                    </div>
                                    <div>
                                        <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>NDVI Before</div>
                                        <div style={{ fontSize: '0.8rem', fontFamily: 'var(--font-mono)', color: 'var(--green)' }}>{alert.ndvi_before}</div>
                                    </div>
                                    <div>
                                        <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>NDVI After</div>
                                        <div style={{ fontSize: '0.8rem', fontFamily: 'var(--font-mono)', color: 'var(--red)' }}>{alert.ndvi_after}</div>
                                    </div>
                                    <div>
                                        <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Detected</div>
                                        <div style={{ fontSize: '0.8rem', fontFamily: 'var(--font-mono)', color: 'var(--text-secondary)' }}>{formatTimestamp(alert.timestamp)}</div>
                                    </div>
                                </div>

                                {/* Action Buttons */}
                                <div style={{ display: 'flex', gap: 8 }}>
                                    <button
                                        className="btn btn-ghost btn-sm"
                                        onClick={(e) => handleSendEmail(alert.id, e)}
                                        disabled={alert.emailSent || emailSent.has(alert.id)}
                                    >
                                        {(alert.emailSent || emailSent.has(alert.id)) ? '✓ Email Sent' : '📧 Send Email'}
                                    </button>
                                    <button className="btn btn-ghost btn-sm" onClick={() => setActivePage('analysis')}>
                                        🔬 Analyse
                                    </button>
                                    <button className="btn btn-ghost btn-sm" onClick={() => setActivePage('map')}>
                                        🗺 View on Map
                                    </button>
                                    <button
                                        className="btn btn-danger btn-sm"
                                        style={{ marginLeft: 'auto' }}
                                        onClick={() => dismissAlert(alert.id)}
                                    >
                                        ✕ Dismiss
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
