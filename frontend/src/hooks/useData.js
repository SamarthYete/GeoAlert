import { useState, useEffect, useCallback } from 'react';
import { MOCK_AOIS, MOCK_ALERTS } from '../data/mockData';
import { useAuthContext } from '../context/AuthContext';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000';

function useMock() { return false; }

// Build secure headers: prefer JWT token, fallback to user-id for demo login
function authHeaders(user, json = false) {
    const h = {};
    if (json) h['Content-Type'] = 'application/json';
    if (user?.token) {
        h['Authorization'] = `Bearer ${user.token}`;
    } else if (user?.sub) {
        h['user-id'] = user.sub;
    }
    return h;
}

export function useAOIs() {
    const { user } = useAuthContext();
    const [aois, setAois] = useState([]);
    const [loading, setLoading] = useState(true);

    const loadData = useCallback(() => {
        if (!user) {
            setAois([]); 
            setLoading(false);
            return;
        }
        setLoading(true);
        fetch(`${API_BASE}/aois`, { headers: authHeaders(user) })
            .then(r => r.json())
            .then(d => { 
                const isAdmin = user.sub === '1' || user.email === 'admin@geo-alert.space';
                setAois(isAdmin ? [...MOCK_AOIS, ...d] : d); 
                setLoading(false); 
            })
            .catch(() => { 
                setAois(user.sub === '1' || user.email === 'admin@geo-alert.space' ? MOCK_AOIS : []); 
                setLoading(false); 
            });
    }, [user]);

    useEffect(() => {
        loadData();
    }, [loadData]);

    const addAOI = async (aoi) => {
        if (!user) {
            return;
        }
        try {
            const r = await fetch(`${API_BASE}/aois`, {
                method: 'POST',
                headers: authHeaders(user, true),
                body: JSON.stringify(aoi)
            });
            const newAoi = await r.json();
            setAois(prev => [...prev, newAoi]);
        } catch (e) {
            console.error("Failed to add AOI", e);
        }
    };
    
    const removeAOI = async (id) => {
        setAois(prev => prev.filter(a => a.id !== id));
        if (user && !useMock()) {
            await fetch(`${API_BASE}/aois/${id}`, {
                method: 'DELETE',
                headers: authHeaders(user)
            }).catch(e => console.error(e));
        }
    };
    const updateAOI = async (id, updates) => {
        setAois(prev => prev.map(a => a.id === id ? { ...a, ...updates } : a));
        if (user && !useMock()) {
            await fetch(`${API_BASE}/aois/${id}`, {
                method: 'PUT',
                headers: authHeaders(user, true),
                body: JSON.stringify(updates)
            }).catch(e => console.error(e));
        }
    };

    return { aois, loading, addAOI, removeAOI, updateAOI, refreshAOIs: loadData };
}

export function useAlerts() {
    const { user } = useAuthContext();
    const [alerts, setAlerts] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!user) {
            setAlerts([]); 
            setLoading(false);
            return;
        }
        fetch(`${API_BASE}/alerts`, { headers: authHeaders(user) })
            .then(r => r.json())
            .then(d => { 
                const isAdmin = user.sub === '1' || user.email === 'admin@geo-alert.space';
                setAlerts(isAdmin ? [...MOCK_ALERTS, ...d] : d); 
                setLoading(false); 
            })
            .catch(() => { 
                setAlerts(user.sub === '1' || user.email === 'admin@geo-alert.space' ? MOCK_ALERTS : []); 
                setLoading(false); 
            });
    }, [user]);

    const dismissAlert = async (id) => {
        setAlerts(prev => prev.filter(a => a.id !== id));
        if (user && !useMock()) {
            fetch(`${API_BASE}/alerts/${id}`, {
                method: 'DELETE',
                headers: authHeaders(user)
            }).catch(e => console.error("Failed to dismiss alert in backend", e));
        }
    };

    return { alerts, loading, dismissAlert };
}

export function useChangeDetection() {
    const [result, setResult] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const runDetection = async (aoiId, startDate, endDate) => {
        setLoading(true);
        setError(null);
        try {
            await new Promise(r => setTimeout(r, 2500));
            // Mock result
            const ndviBefore = (Math.random() * 0.3 + 0.5).toFixed(3);
            const ndviAfter = (ndviBefore - Math.random() * 0.15).toFixed(3);
            const changePct = (((ndviBefore - ndviAfter) / ndviBefore) * 100).toFixed(1);
            setResult({
                aoi_id: aoiId,
                start_date: startDate,
                end_date: endDate,
                ndvi_before: parseFloat(ndviBefore),
                ndvi_after: parseFloat(ndviAfter),
                change_pct: parseFloat(changePct),
                changed_px: Math.floor(Math.random() * 50000 + 5000),
                total_px: 200000,
                severity: changePct > 20 ? 'critical' : changePct > 10 ? 'warning' : 'info',
                summary: `Change detection completed for ${aoiId}. ${changePct}% area affected.`,
            });
        } catch (e) {
            setError('Analysis failed. Please retry.');
        } finally {
            setLoading(false);
        }
    };

    return { result, loading, error, runDetection };
}
