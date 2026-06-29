import { useState, useEffect } from 'react';
import { useAOIs, useAlerts } from '../hooks/useData';
import { MOCK_NDVI_SERIES, getNdviColor, formatTimestamp } from '../data/mockData';
import { NDVIChart, MultiNDVIChart } from '../components/Charts';

function StatCard({ icon, label, value, sub, color = 'var(--cyan)', change }) {
    return (
        <div className="stat-card animate-in">
            <div className="stat-icon">{icon}</div>
            <div className="stat-label">{label}</div>
            <div className="stat-value" style={{ color }}>{value}</div>
            {sub && <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: 4 }}>{sub}</div>}
            {change !== undefined && (
                <div className="stat-change" style={{ color: change < 0 ? 'var(--red)' : 'var(--green)' }}>
                    {change < 0 ? '▼' : '▲'} {Math.abs(change)}% vs last month
                </div>
            )}
            <div className="progress-bar" style={{ marginTop: 12 }}>
                <div className="progress-fill" style={{ width: '70%', background: `linear-gradient(90deg, ${color}, ${color}88)` }} />
            </div>
        </div>
    );
}

export default function Dashboard({ setActivePage }) {
    const { aois, loading: aoiLoading, removeAOI, updateAOI } = useAOIs();
    const { alerts } = useAlerts();
    const [selectedAoiId, setSelectedAoiId] = useState(null);

    useEffect(() => {
        if (!selectedAoiId && aois.length > 0) {
            setSelectedAoiId(aois[0].id);
        } else if (aois.length === 0) {
            setSelectedAoiId(null);
        }
    }, [aois, selectedAoiId]);

    const criticalCount = alerts.filter(a => a.severity === 'critical').length;
    const warningCount = alerts.filter(a => a.severity === 'warning').length;
    const avgNdvi = aois.length
        ? (aois.reduce((s, a) => s + (a.ndvi || 0), 0) / aois.length).toFixed(3)
        : '—';

    const ndviData = MOCK_NDVI_SERIES[selectedAoiId] || [];
    const selectedAoi = aois.find(a => a.id === selectedAoiId);

    // Multi-AOI comparison data
    const multiData = aois.slice(0, 3).map(a => ({
        id: a.id,
        name: a.name.split(' ').slice(0, 2).join(' '),
        color: a.color,
        data: MOCK_NDVI_SERIES[a.id] || MOCK_NDVI_SERIES['aoi-001'],
    }));

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>

            {/* Hero Banner */}
            <div style={{
                background: 'rgba(10, 14, 28, 0.45)',
                backdropFilter: 'blur(20px)',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                boxShadow: '0 0 40px rgba(0, 212, 255, 0.05)',
                borderRadius: 'var(--radius-xl)',
                padding: '28px 32px',
                position: 'relative',
                overflow: 'hidden',
            }}>
                <div className="scan-line" />
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 24 }}>
                    <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
                            <span style={{ fontSize: '2rem' }}>🛰</span>
                            <div>
                                <h1 className="display" style={{ fontSize: '1.8rem', fontWeight: 800, background: 'linear-gradient(135deg, var(--cyan), var(--violet))', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
                                    Geo-Alert
                                </h1>
                                <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginTop: 2 }}>
                                    Real-time geospatial intelligence & satellite change detection
                                </p>
                            </div>
                        </div>
                        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginTop: 8 }}>
                            <span className="tag tag-cyan">🌾 Agriculture</span>
                            <span className="tag tag-green">🌳 Deforestation</span>
                            <span className="tag tag-amber">🏜️ Desertification</span>
                            <span className="tag tag-red">🛡️ Defence</span>
                            <span className="tag tag-violet">🌊 Disaster</span>
                        </div>
                    </div>
                    <div style={{ textAlign: 'right', flexShrink: 0 }}>
                        <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', letterSpacing: '0.08em' }}>LAST SYNC</div>
                        <div style={{ fontSize: '1rem', color: 'var(--cyan)', fontFamily: 'var(--font-mono)', fontWeight: 600 }}>
                            2026-03-04 · 11:30 IST
                        </div>
                        <div style={{ marginTop: 10, display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                            <button className="btn btn-primary btn-sm" onClick={() => setActivePage('map')}>
                                🗺 Open Map
                            </button>
                            <button className="btn btn-violet btn-sm" onClick={() => setActivePage('analysis')}>
                                🔬 Analyse
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Stats Row */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16 }}>
                <StatCard icon="🗺" label="Active AOIs" value={aois.length || '—'} sub="Monitored zones" color="var(--cyan)" change={20} />
                <StatCard icon="🔴" label="Critical Alerts" value={criticalCount} sub="Require action" color="var(--red)" change={-5} />
                <StatCard icon="⚠️" label="Warnings" value={warningCount} sub="Under watch" color="var(--amber)" change={10} />
                <StatCard icon="🌿" label="Avg NDVI" value={avgNdvi} sub="Fleet average" color="var(--green)" />
            </div>

            {/* NDVI Chart + Alert Feed */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 380px', gap: 20 }}>

                {/* NDVI Trend Card */}
                <div className="card" style={{ padding: 20 }}>
                    <div className="section-header">
                        <span className="section-title">NDVI Trend Analysis</span>
                        <div style={{ display: 'flex', gap: 8 }}>
                            {aois.map(a => (
                                <button
                                    key={a.id}
                                    className={`btn btn-sm ${selectedAoiId === a.id ? 'btn-primary' : 'btn-ghost'}`}
                                    style={selectedAoiId === a.id ? { background: a.color, color: '#000' } : {}}
                                    onClick={() => setSelectedAoiId(a.id)}
                                    title={a.name}
                                >
                                    {a.name.split(' ').slice(0, 1).join('')}
                                </button>
                            ))}
                        </div>
                    </div>

                    {aois.length === 0 ? (
                        <div style={{ padding: '60px 20px', textAlign: 'center', color: 'var(--text-muted)' }}>
                            <div style={{ fontSize: '2.5rem', marginBottom: 12 }}>📍</div>
                            <div style={{ fontWeight: 600, fontSize: '1.2rem', color: 'var(--text-primary)', marginBottom: 6 }}>No Monitored Zones</div>
                            <div style={{ fontSize: '0.9rem', marginBottom: 16 }}>Save an Area of Interest on the map to start tracking NDVI expansion and alerts.</div>
                            <button className="btn btn-primary" onClick={() => setActivePage('map')}>→ Go to Map Explorer</button>
                        </div>
                    ) : (
                        <>
                            {selectedAoi && (
                                <div style={{ display: 'flex', gap: 12, marginBottom: 14, alignItems: 'center' }}>
                                    <span style={{ fontSize: '1.5rem' }}>{selectedAoi.category === 'agriculture' ? '🌾' : selectedAoi.category === 'forest' ? '🌳' : selectedAoi.category === 'desert' ? '🏜️' : '📍'}</span>
                                    <div>
                                        <div style={{ fontWeight: 600, fontSize: '0.95rem' }}>{selectedAoi.name}</div>
                                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{selectedAoi.area_km2} km² · {selectedAoi.category}</div>
                                    </div>
                                    <div style={{ marginLeft: 'auto', textAlign: 'right' }}>
                                        <div style={{ fontSize: '1.6rem', fontWeight: 700, color: getNdviColor(selectedAoi.ndvi), fontFamily: 'var(--font-mono)' }}>
                                            {selectedAoi.ndvi}
                                        </div>
                                        <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Current NDVI</div>
                                    </div>
                                    <div style={{ textAlign: 'right' }}>
                                        <div style={{ fontSize: '1.1rem', fontWeight: 700, color: selectedAoi.ndviChange < 0 ? 'var(--red)' : 'var(--green)', fontFamily: 'var(--font-mono)' }}>
                                            {selectedAoi.ndviChange > 0 ? '+' : ''}{selectedAoi.ndviChange}
                                        </div>
                                        <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>30-day Δ</div>
                                    </div>
                                </div>
                            )}

                            <NDVIChart data={ndviData} />

                            <div className="ndvi-legend" style={{ marginTop: 12 }}>
                                <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Low</span>
                                <div className="ndvi-bar" />
                                <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>High</span>
                            </div>
                        </>
                    )}
                </div>

                {/* Recent Alerts Feed */}
                <div className="card" style={{ padding: 20, display: 'flex', flexDirection: 'column' }}>
                    <div className="section-header">
                        <span className="section-title">Recent Alerts</span>
                        <button className="btn btn-ghost btn-sm" onClick={() => setActivePage('alerts')}>View All</button>
                    </div>
                    <div style={{ flex: 1, overflow: 'auto' }}>
                        {alerts.slice(0, 4).map(alert => (
                            <div
                                key={alert.id}
                                className={`alert-item ${alert.severity}`}
                                onClick={() => setActivePage('alerts')}
                            >
                                <div className={`alert-dot ${alert.severity}`} />
                                <div style={{ flex: 1, minWidth: 0 }}>
                                    <div className="alert-title" style={{
                                        color: alert.severity === 'critical' ? 'var(--red)' : alert.severity === 'warning' ? 'var(--amber)' : 'var(--cyan)',
                                        overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap'
                                    }}>
                                        {alert.title}
                                    </div>
                                    <div className="alert-desc">{alert.aoiName}</div>
                                    <div className="alert-time">{formatTimestamp(alert.timestamp)}</div>
                                </div>
                                <span className={`alert-severity ${alert.severity}`}>{alert.severity}</span>
                            </div>
                        ))}
                    </div>
                    <button className="btn btn-ghost" style={{ width: '100%', marginTop: 10, justifyContent: 'center' }} onClick={() => setActivePage('alerts')}>
                        View All {alerts.length} Alerts →
                    </button>
                </div>
            </div>

            {/* Multi-AOI NDVI comparison */}
            <div className="card" style={{ padding: 20 }}>
                <div className="section-header">
                    <span className="section-title">Multi-AOI NDVI Comparison</span>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>6-month trend</span>
                </div>
                {aois.length === 0 ? (
                    <div style={{ padding: '40px 20px', textAlign: 'center', color: 'var(--text-muted)' }}>
                        <div style={{ fontSize: '1.5rem', marginBottom: 10 }}>📈</div>
                        <div>Not Enough Data to Compare</div>
                    </div>
                ) : (
                    <MultiNDVIChart datasets={multiData} />
                )}
            </div>

            {/* AOI Status Table */}
            <div className="card" style={{ padding: 20 }}>
                <div className="section-header">
                    <span className="section-title">AOI Status Overview</span>
                    <button className="btn btn-ghost btn-sm" onClick={() => setActivePage('map')}>Manage AOIs →</button>
                </div>
                <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
                        <thead>
                            <tr style={{ borderBottom: '1px solid var(--border)' }}>
                                {['Zone', 'Area (km²)', 'NDVI', 'NDVI Δ', 'Alert Triggers at', 'Status', 'Actions'].map(h => (
                                    <th key={h} style={{ padding: '8px 12px', textAlign: 'left', color: 'var(--text-muted)', fontWeight: 600, fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{h}</th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {aois.length === 0 && (
                                <tr>
                                    <td colSpan="8" style={{ padding: '30px', textAlign: 'center', color: 'var(--text-muted)' }}>
                                        No active zones found
                                    </td>
                                </tr>
                            )}
                            {aois.map(aoi => (
                                <tr
                                    key={aoi.id}
                                    style={{ borderBottom: '1px solid rgba(255,255,255,0.04)', cursor: 'pointer' }}
                                    onClick={() => { setSelectedAoiId(aoi.id); }}
                                >
                                    <td style={{ padding: '10px 12px', fontWeight: 600 }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                            <div style={{ width: 8, height: 8, borderRadius: 2, background: aoi.color }} />
                                            {aoi.name}
                                        </div>
                                    </td>
                                    <td style={{ padding: '10px 12px', fontFamily: 'var(--font-mono)' }}>{aoi.area_km2}</td>
                                    <td style={{ padding: '10px 12px', fontFamily: 'var(--font-mono)', color: getNdviColor(aoi.ndvi), fontWeight: 600 }}>{aoi.ndvi}</td>
                                    <td style={{ padding: '10px 12px', fontFamily: 'var(--font-mono)', color: aoi.ndviChange < 0 ? 'var(--red)' : 'var(--green)', fontWeight: 600 }}>
                                        {aoi.ndviChange > 0 ? '+' : ''}{aoi.ndviChange}
                                    </td>
                                    <td style={{ padding: '10px 12px' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--amber)' }}>
                                            <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 600 }}>&gt;{aoi.alert_threshold ?? 15}% Δ</span>
                                            <button className="btn btn-ghost btn-sm" style={{ padding: '2px 6px' }} onClick={(e) => {
                                                e.stopPropagation();
                                                const newVal = window.prompt("Send email alert when change exceeds %:", aoi.alert_threshold ?? 15);
                                                if (newVal && !isNaN(parseFloat(newVal))) updateAOI(aoi.id, { alert_threshold: parseFloat(newVal) });
                                            }}>⚙️</button>
                                        </div>
                                    </td>
                                    <td style={{ padding: '10px 12px' }}>
                                        <span className={`tag tag-${aoi.status === 'critical' ? 'red' : aoi.status === 'warning' ? 'amber' : 'green'}`} style={{ textTransform: 'capitalize' }}>
                                            {aoi.status}
                                        </span>
                                    </td>
                                    <td style={{ padding: '10px 12px' }}>
                                        <div style={{ display: 'flex', gap: 6 }}>
                                            <button className="btn btn-ghost btn-sm" onClick={(e) => {
                                                e.stopPropagation();
                                                const newName = window.prompt("Rename Zone:", aoi.name);
                                                if (newName && newName.trim()) updateAOI(aoi.id, { name: newName.trim() });
                                            }}>✏️</button>
                                            <button className="btn btn-danger btn-sm" style={{ padding: '4px 8px' }} onClick={(e) => {
                                                e.stopPropagation();
                                                if (window.confirm(`Delete ${aoi.name}?`)) removeAOI(aoi.id);
                                            }}>✕</button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
