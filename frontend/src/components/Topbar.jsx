import { useState } from 'react';
import { useAuthContext } from '../context/AuthContext';

export default function Topbar({ title, activePage }) {
    const { user, logout } = useAuthContext();
    const [time] = useState(() => new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }));

    return (
        <header className="topbar">
            <div className="breadcrumb">
                <span style={{ color: 'var(--cyan)', opacity: 0.7 }}>Geo-Alert</span>
                <span className="sep">/</span>
                <span>{title}</span>
            </div>

            <div className="topbar-actions">
                {/* Live indicator */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '5px 12px', borderRadius: 8, background: 'rgba(0,255,136,0.08)', border: '1px solid rgba(0,255,136,0.2)' }}>
                    <div className="status-dot" />
                    <span style={{ fontSize: '0.75rem', color: 'var(--green)', fontWeight: 600 }}>LIVE</span>
                </div>

                {/* Satellite status */}
                <div style={{ padding: '5px 12px', borderRadius: 8, background: 'var(--cyan-dim)', border: '1px solid rgba(0,212,255,0.2)', fontSize: '0.75rem', color: 'var(--cyan)', fontWeight: 500 }}>
                    🛰 Sentinel-2 · ESA
                </div>

                {/* Time */}
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.8rem', color: 'var(--text-muted)', padding: '5px 12px', borderRadius: 8, background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border)' }}>
                    {time} IST
                </div>

                {/* Profile/Logout */}
                {user && (
                    <button onClick={logout} className="btn-logout" style={{ background: 'transparent', border: '1px solid var(--border)', color: 'var(--text-muted)', padding: '5px 12px', borderRadius: '8px', cursor: 'pointer', fontSize: '0.8rem' }}>
                        {user.name} (Logout)
                    </button>
                )}
            </div>
        </header>
    );
}
