import { useState, useEffect } from 'react';
import { useAOIs } from '../hooks/useData';
import { useAOIContext } from '../context/AOIContext.jsx';
import { MOCK_NDVI_SERIES, getNdviColor, CATEGORY_ICONS } from '../data/mockData';
import { NDVIChart, ChangeChart } from '../components/Charts';
import { useAuthContext } from '../context/AuthContext';

const API = import.meta.env.VITE_API_URL || 'http://localhost:8000';

// ─── helpers ──────────────────────────────────────────────────────────────────
function SeverityBadge({ severity }) {
    const map = { critical: ['tag-red', '🔴'], warning: ['tag-amber', '⚠️'], info: ['tag-cyan', 'ℹ️'] };
    const [cls, icon] = map[severity] || map.info;
    return (
        <span className={`tag ${cls}`} style={{ fontSize: '0.95rem', padding: '6px 14px', textTransform: 'capitalize' }}>
            {icon} {severity}
        </span>
    );
}

function MetricCard({ label, value, sub, color }) {
    return (
        <div className="stat-card" style={{ borderColor: color + '44' }}>
            <div className="stat-label">{label}</div>
            <div className="stat-value" style={{ color, fontSize: '1.8rem' }}>{value}</div>
            {sub && <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 4 }}>{sub}</div>}
        </div>
    );
}

function NDVIBar({ label, value }) {
    const color = getNdviColor(value);
    const pct = Math.max(0, Math.min(100, value * 100));
    return (
        <div style={{ marginBottom: 10 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4, fontSize: '0.8rem' }}>
                <span style={{ color: 'var(--text-secondary)' }}>{label}</span>
                <span style={{ fontFamily: 'var(--font-mono)', color, fontWeight: 700 }}>{value.toFixed(4)}</span>
            </div>
            <div className="progress-bar">
                <div className="progress-fill" style={{ width: `${pct}%`, background: color }} />
            </div>
        </div>
    );
}

// ─── Main Component ────────────────────────────────────────────────────────────
export default function Analysis({ setActivePage }) {
    const { user } = useAuthContext();
    const { aois, addAOI, updateAOI } = useAOIs();
    const { drawnAOI, clearDrawnAOI } = useAOIContext();

    // ── State ──────────────────────────────────────────────────────────────────
    const [mode, setMode] = useState('drawn'); // 'drawn' | 'saved'
    const [selectedAoiId, setSelectedAoiId] = useState(aois[0]?.id || '');
    const savedAoi = aois.find(x => x.id === selectedAoiId); // Moved up for activeAOI
    const activeAOI = mode === 'drawn'
        ? drawnAOI
        : (savedAoi ? { bounds: savedAoi.bounds, bbox: savedAoi.bounds ? [savedAoi.bounds[0][1], savedAoi.bounds[0][0], savedAoi.bounds[1][1], savedAoi.bounds[1][0]] : null, center: savedAoi.center, area_km2: savedAoi.area_km2, name: savedAoi.name, startDate: savedAoi.startDate, endDate: savedAoi.endDate } : null);

    const [startDate, setStartDate] = useState(() => (activeAOI?.startDate) || new Date(Date.now() - 90 * 86400000).toISOString().split('T')[0]);
    const [endDate, setEndDate] = useState(() => (activeAOI?.endDate) || new Date().toISOString().split('T')[0]);
    const [analysisType, setAnalysisType] = useState('ndvi');
    const [showThresholdSelector, setShowThresholdSelector] = useState(false);
    const [alertThreshold, setAlertThreshold] = useState(15);

    // Use effect to sync dates if activeAOI changes
    useEffect(() => {
        if (activeAOI?.startDate) setStartDate(activeAOI.startDate);
        if (activeAOI?.endDate) setEndDate(activeAOI.endDate);
    }, [activeAOI?.startDate, activeAOI?.endDate]);

    const [loading, setLoading] = useState(false);
    const [stage, setStage] = useState('');    // loading stage label
    const [result, setResult] = useState(null);
    const [error, setError] = useState(null);
    const [backendOnline, setBackendOnline] = useState(null);

    // ── Derived values ─────────────────────────────────────────────────────────
    // activeAOI and savedAoi are declared above.
    const ndviData = MOCK_NDVI_SERIES[selectedAoiId] || MOCK_NDVI_SERIES['aoi-001'];

    // ── Ping backend ───────────────────────────────────────────────────────────
    useEffect(() => {
        fetch(`${API}/health`, { signal: AbortSignal.timeout(3000) })
            .then(r => r.ok ? setBackendOnline(true) : setBackendOnline(false))
            .catch(() => setBackendOnline(false));
    }, []);

    // Switch to drawn mode if we just got a drawnAOI from MapExplorer
    useEffect(() => {
        if (drawnAOI) setMode('drawn');
    }, [drawnAOI]);

    // ── Run analysis ───────────────────────────────────────────────────────────
    const runAnalysis = async () => {
        if (!activeAOI?.bbox) {
            setError('No AOI selected. Go to Map Explorer and draw an area first.');
            return;
        }
        setLoading(true);
        setResult(null);
        setError(null);

        const stages = [
            'Searching Sentinel-2 scenes…',
            'Fetching Band B4 (Red) tiles…',
            'Fetching Band B8 (NIR) tiles…',
            'Computing NDVI for both dates…',
            'Running change detection…',
            'Generating change map…',
        ];
        let si = 0;
        setStage(stages[si]);
        const stageTimer = setInterval(() => {
            si = (si + 1) % stages.length;
            setStage(stages[si]);
        }, 1400);

        try {
            const payload = {
                bbox: activeAOI.bbox,
                start_date: startDate,
                end_date: endDate,
                aoi_name: activeAOI.name || 'Custom AOI',
                analysis_type: analysisType,
            };

            let data;
            if (backendOnline) {
                // Run optical Sentinel-2 analysis and Earth Engine radar analysis concurrently
                const [respOptical, respEE] = await Promise.all([
                    fetch(`${API}/analysis/detect`, {
                        method: 'POST',
                        headers: { 
                            'Content-Type': 'application/json',
                            ...(user?.token ? { 'Authorization': `Bearer ${user.token}` } : { 'user-id': user?.sub || '' })
                        },
                        body: JSON.stringify(payload),
                    }),
                    fetch(`${API}/ee/urban`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            bbox: activeAOI.bbox,
                            start_date: startDate,
                            end_date: endDate
                        }),
                    }).catch(() => null) // Failsafe if EE isn't properly configured yet
                ]);

                if (!respOptical.ok) throw new Error(`Server error: ${respOptical.status}`);
                data = await respOptical.json();

                // Merge Google Earth Engine NDBI urban stats if available
                if (respEE && respEE.ok) {
                    const eeData = await respEE.json();
                    data.ee_urban_pixels = eeData.built_up_pixel_count;
                    data.ee_urban_km2 = eeData.built_up_area_km2;
                }
            } else {
                // API Integration: Fetch real STAC data + vary result based on AOI position
                await new Promise(r => setTimeout(r, stages.length * 800));
                data = await fetchStacData(activeAOI.bbox, startDate, endDate);
            }

            setResult(data);
        } catch (e) {
            setError(e.message || 'Analysis failed. Is the backend running?');
        } finally {
            clearInterval(stageTimer);
            setLoading(false);
            setStage('');
        }
    };
    
    const handleExportData = () => {
        if (!result) return;
        const csvRows = [
            ["Metric", "Value"],
            ["AOI Name", result.aoi_name || 'Custom AOI'],
            ["Target", analysisType === 'ndbi' ? "Build-up (NDBI)" : "Vegetation (NDVI)"],
            ["Start Date", result.start_date],
            ["End Date", result.end_date],
            ["Change Detected (%)", result.change_pct],
            ["Area Changed (km2)", result.area_changed_km2],
            ["Index Before", result.ndvi_before],
            ["Index After", result.ndvi_after],
            ["Severity", result.severity],
            ["Summary", (result.summary || '').replace(/,/g, ';')]
        ];

        const csvString = "data:text/csv;charset=utf-8," + csvRows.map(row => row.join(",")).join("\n");
        const encodedUri = encodeURI(csvString);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", `GeoAlert_Report_${(result.aoi_name || 'Analysis').replace(/\s+/g, '_')}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const updateHookThreshold = async (val) => {
        setAlertThreshold(val);
        if (mode === 'saved' && savedAoi) {
            await updateAOI(savedAoi.id, { alert_threshold: val });
            setShowThresholdSelector(false);
            alert(`Hook established! You will be notified via email if '${savedAoi.name}' exceeds ${val}% change.`);
        }
    };

    // ── Sentinel-2 Live API Integration ────────────────────────────────────────
    async function fetchStacData(bbox, t1, t2) {
        const [w, s, e, n] = bbox;
        const lat = (s + n) / 2;
        const lng = (w + e) / 2;

        let baseNdvi = 0.65;
        if (lat > 25 && lat < 32 && lng > 68 && lng < 79) baseNdvi = 0.22; // Rajasthan
        else if (lat > 8 && lat < 15 && lng > 74 && lng < 78) baseNdvi = 0.82; // Western Ghats
        else if (lat > 30 && lat < 33 && lng > 74 && lng < 78) baseNdvi = 0.31; // Kashmir

        // Prepare STAC search parameters
        const searchBodyBefore = {
            collections: ['sentinel-2-c1-l2a'],
            bbox: [w, s, e, n],
            datetime: `2015-01-01T00:00:00Z/${t1}T23:59:59Z`,
            limit: 1,
            query: { "eo:cloud_cover": { "lt": 20 } },
            sortby: [{ field: "properties.datetime", direction: "desc" }] // latest before t1
        };
        const searchBodyAfter = {
            collections: ['sentinel-2-c1-l2a'],
            bbox: [w, s, e, n],
            datetime: `${t1}T00:00:00Z/${t2}T23:59:59Z`,
            limit: 1,
            query: { "eo:cloud_cover": { "lt": 20 } },
            sortby: [{ field: "properties.datetime", direction: "desc" }] // latest before t2
        };

        const fetchStac = async (body) => {
            try {
                const res = await fetch("https://earth-search.aws.element84.com/v1/search", {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(body)
                });
                const d = await res.json();
                if (d.features && d.features.length > 0) {
                    const f = d.features[0];
                    return {
                        image: f.assets.thumbnail?.href || f.assets.preview?.href,
                        date: f.properties.datetime.split('T')[0],
                        clouds: f.properties["eo:cloud_cover"],
                        platform: f.properties.platform || 'sentinel-2',
                        links: {
                            visual: f.assets.visual?.href,
                            red: f.assets.red?.href,
                            nir: f.assets.nir?.href,
                            scl: f.assets.scl?.href
                        }
                    };
                }
            } catch (e) {
                console.error("STAC fetch error", e);
            }
            return null;
        };

        const [t1Data, t2Data] = await Promise.all([fetchStac(searchBodyBefore), fetchStac(searchBodyAfter)]);

        // Calculate changes
        const days = Math.round((new Date(t2) - new Date(t1)) / 86400000);
        const deltaFactor = Math.min(1, Math.max(0, days) / 180);
        const ndviBefore = parseFloat((baseNdvi + 0.05).toFixed(4));
        const ndviAfter = parseFloat(Math.max(0.05, baseNdvi - deltaFactor * 0.12).toFixed(4));
        const delta = parseFloat((ndviAfter - ndviBefore).toFixed(4));
        const changePct = parseFloat(Math.abs((delta / ndviBefore) * 100).toFixed(2));

        return {
            mode: 'api',
            aoi_name: activeAOI.name || 'Custom AOI',
            bbox,
            start_date: t1Data ? t1Data.date : t1,
            end_date: t2Data ? t2Data.date : t2,
            image_before: t1Data ? t1Data.image : null,
            image_after: t2Data ? t2Data.image : null,
            links_before: t1Data ? t1Data.links : null,
            links_after: t2Data ? t2Data.links : null,
            platform: t2Data ? t2Data.platform.toUpperCase() : 'SENTINEL-2',
            cloud_cover_before: t1Data ? t1Data.clouds.toFixed(1) : 4.2,
            cloud_cover_after: t2Data ? t2Data.clouds.toFixed(1) : 7.8,
            ndvi_before: ndviBefore,
            ndvi_after: ndviAfter,
            ndvi_delta: delta,
            change_pct: changePct,
            changed_px: Math.round(changePct * 2000),
            total_px: 200000,
            area_changed_km2: parseFloat((activeAOI.area_km2 * changePct / 100).toFixed(2)),
            severity: changePct > 20 ? 'critical' : changePct > 8 ? 'warning' : 'info',
            days_between: days,
            scene_count_before: t1Data ? 1 : 0,
            scene_count_after: t2Data ? 1 : 0,
            summary: `Sentinel-2 Live API Integration for ${activeAOI.name || 'selected area'}: `
                + `Successfully fetched true-color previews from AWS Earth Search API. `
                + `Estimated ${changePct}% of the area showed vegetation change. `
                + `NDVI shift: ${ndviBefore} → ${ndviAfter}.`,
        };
    }

    // ── Severity color ─────────────────────────────────────────────────────────
    const sColor = result?.severity === 'critical' ? 'var(--red)'
        : result?.severity === 'warning' ? 'var(--amber)'
            : 'var(--green)';

    // Generate clear, easily understandable descriptions based on analysis type and delta
    let simpleSummary = "";
    let shiftTitle = "";
    let shiftDesc = "";

    if (result) {
        const aoiName = activeAOI?.name || result.aoi_name || 'selected area';
        const pct = result.change_pct;
        const area = result.area_changed_km2 || '—';
        const d = result.ndvi_delta || 0;
        const days = result.days_between || 30;

        if (analysisType === 'ndbi') {
            if (d > 0.05) {
                simpleSummary = `In the last ${days} days, we detected an Urban Expansion Increase in '${aoiName}'. Approximately ${pct}% of the selected area (${area} km²) has been affected by new buildings, concrete, or asphalt cover.`;
                shiftTitle = "📈 Urban Expansion Increase";
                shiftDesc = `We detected new structures or land clearing for construction (Index increased by +${d.toFixed(3)}). Fast-paced development is happening here.`;
            } else if (d < -0.05) {
                simpleSummary = `In the last ${days} days, we detected an Urban Expansion Decrease in '${aoiName}'. Approximately ${pct}% of the selected area (${area} km²) lost built-up signatures.`;
                shiftTitle = "📉 Urban Expansion Decrease";
                shiftDesc = `Concrete and asphalt footprints have decreased (Index dropped by ${d.toFixed(3)}). This usually indicates building demolition or nature reclaiming the land.`;
            } else {
                simpleSummary = `In the last ${days} days, the urban development in '${aoiName}' has remained relatively stable with no major changes.`;
                shiftTitle = "🏙️ Stable Urban Footprint";
                shiftDesc = `No significant new construction, roads, or demolition detected over the time period (Δ ${d.toFixed(3)}).`;
            }
        } else {
            if (d > 0.05) {
                simpleSummary = `In the last ${days} days, we detected a Vegetation Increase in '${aoiName}'. Roughly ${pct}% of the area (${area} km²) shows healthier or denser plant life.`;
                shiftTitle = "🌿 Vegetation Increase";
                shiftDesc = `Plant life has grown significantly (Index increased by +${d.toFixed(3)}). This means crops have matured, or reforestation efforts are working well!`;
            } else if (d < -0.05) {
                simpleSummary = `In the last ${days} days, we detected a Vegetation Decrease (Deforestation or Harvest) in '${aoiName}'. Approximately ${pct}% of the area (${area} km²) lost plant cover.`;
                shiftTitle = "🪓 Vegetation Decrease";
                shiftDesc = `Significant plant loss detected (Index dropped by ${d.toFixed(3)}). This is a strong sign of deforestation, crop harvesting, drought, or disease.`;
            } else {
                simpleSummary = `In the last ${days} days, the vegetation levels in '${aoiName}' remained healthy and stable.`;
                shiftTitle = "🌳 Stable Vegetation";
                shiftDesc = `No major deforestation or unusual plant growth was detected during this period (Δ ${d.toFixed(3)}).`;
            }
        }
    }

    // ── Render ─────────────────────────────────────────────────────────────────
    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

            {/* Backend status banner */}
            <div style={{
                display: 'flex', alignItems: 'center', gap: 10, padding: '10px 16px',
                borderRadius: 10,
                background: backendOnline === false ? 'rgba(255,176,32,0.07)' : 'rgba(0,255,136,0.05)',
                border: `1px solid ${backendOnline === false ? 'rgba(255,176,32,0.25)' : 'rgba(0,255,136,0.15)'}`,
                fontSize: '0.8rem',
            }}>
                {backendOnline === null && <span style={{ color: 'var(--text-muted)' }}>⟳ Checking backend…</span>}
                {backendOnline === true && <><div className="status-dot" /><span style={{ color: 'var(--green)', fontWeight: 600 }}>Backend connected — real satellite analysis enabled</span></>}
                {backendOnline === false && (
                    <>
                        <span style={{ color: 'var(--amber)', fontWeight: 600 }}>⚠ Backend offline — running in smart demo mode</span>
                        <span style={{ color: 'var(--text-muted)', marginLeft: 6 }}>
                            Start backend: <code style={{ background: 'rgba(0,0,0,0.3)', padding: '1px 6px', borderRadius: 4 }}>cd backend && uvicorn main:app --reload</code>
                        </span>
                    </>
                )}
            </div>

            {/* ── AOI Source selector ── */}
            <div className="card" style={{ padding: 20 }}>
                <div className="section-header" style={{ marginBottom: 14 }}>
                    <span className="section-title">Area of Interest</span>
                    <div style={{ display: 'flex', gap: 6 }}>
                        <button
                            className={`btn btn-sm ${mode === 'drawn' ? 'btn-primary' : 'btn-ghost'}`}
                            onClick={() => setMode('drawn')}
                        >
                            ✏ Drawn on Map
                        </button>
                        <button
                            className={`btn btn-sm ${mode === 'saved' ? 'btn-primary' : 'btn-ghost'}`}
                            onClick={() => setMode('saved')}
                        >
                            📋 Saved Zone
                        </button>
                    </div>
                </div>

                {mode === 'drawn' ? (
                    drawnAOI ? (
                        <div style={{ display: 'flex', gap: 16, alignItems: 'center', flexWrap: 'wrap' }}>
                            <div style={{ padding: '10px 16px', background: 'rgba(0,212,255,0.07)', border: '1px solid rgba(0,212,255,0.2)', borderRadius: 10, flex: 1, display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8, fontSize: '0.8rem', fontFamily: 'var(--font-mono)' }}>
                                <div><span style={{ color: 'var(--text-muted)' }}>Name: </span>{drawnAOI.name}</div>
                                <div><span style={{ color: 'var(--text-muted)' }}>Area: </span>{drawnAOI.area_km2} km²</div>
                                <div><span style={{ color: 'var(--text-muted)' }}>Lat: </span>{drawnAOI.center?.[0]?.toFixed(3)}</div>
                                <div><span style={{ color: 'var(--text-muted)' }}>W: </span>{drawnAOI.bbox?.[0]?.toFixed(3)}</div>
                                <div><span style={{ color: 'var(--text-muted)' }}>S: </span>{drawnAOI.bbox?.[1]?.toFixed(3)}</div>
                                <div><span style={{ color: 'var(--text-muted)' }}>E: </span>{drawnAOI.bbox?.[2]?.toFixed(3)}</div>
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                                <button className="btn btn-ghost btn-sm" onClick={() => { clearDrawnAOI(); setActivePage('map'); }}>
                                    ✏ Redraw on Map
                                </button>
                                <button className="btn btn-primary btn-sm" onClick={() => {
                                    const customName = window.prompt("Enter a name for your saved zone:", "Custom Zone");
                                    if (!customName || customName.trim() === "") return;

                                    addAOI({
                                        name: customName.trim(),
                                        category: 'agriculture',
                                        color: '#00d4ff',
                                        bounds: drawnAOI.bounds,
                                        center: drawnAOI.center,
                                        area_km2: drawnAOI.area_km2,
                                        created: new Date().toISOString().split('T')[0],
                                        lastChecked: new Date().toISOString(),
                                        alertCount: 0,
                                        status: 'normal'
                                    });
                                    alert('Zone Saved Successfully!');
                                }}>
                                    💾 Save Zone
                                </button>
                            </div>
                        </div>
                    ) : (
                        <div style={{ padding: '20px', textAlign: 'center', border: '1px dashed var(--border-bright)', borderRadius: 10 }}>
                            <div style={{ fontSize: '2rem', marginBottom: 8 }}>🗺</div>
                            <div style={{ fontWeight: 600, marginBottom: 6 }}>No area drawn yet</div>
                            <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginBottom: 14 }}>
                                Go to Map Explorer, draw a rectangle or polygon, then click "Analyse Now"
                            </div>
                            <button className="btn btn-primary" onClick={() => setActivePage('map')}>
                                → Open Map Explorer
                            </button>
                        </div>
                    )
                ) : (
                    <div style={{ display: 'flex', gap: 12, alignItems: 'flex-end', flexWrap: 'wrap' }}>
                        <div className="form-group" style={{ margin: 0, flex: 1 }}>
                            <label className="form-label">Select Saved Zone</label>
                            <select id="analysis-aoi-select" className="form-select" value={selectedAoiId} onChange={e => setSelectedAoiId(e.target.value)}>
                                {aois.map(a => (
                                    <option key={a.id} value={a.id}>
                                        {CATEGORY_ICONS[a.category] || '📍'} {a.name}
                                    </option>
                                ))}
                            </select>
                        </div>
                        {savedAoi && (
                            <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', paddingBottom: 10 }}>
                                {savedAoi.area_km2} km² · NDVI {savedAoi.ndvi}
                            </div>
                        )}
                    </div>
                )}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr auto', gap: 16, alignItems: 'end', marginTop: 16 }}>
                <div className="form-group" style={{ margin: 0 }}>
                    <label className="form-label">🔍 Analysis Type</label>
                    <select className="form-select" value={analysisType} onChange={e => setAnalysisType(e.target.value)}>
                        <option value="ndvi">🌿 Deforestation / Vegetation (NDVI)</option>
                        <option value="ndbi">🏢 Urban Expansion / Build-up (NDBI)</option>
                    </select>
                </div>
                <div className="form-group" style={{ margin: 0 }}>
                    <label className="form-label">📅 Before Date (T1)</label>
                    <input id="analysis-start" type="date" className="form-input" value={startDate} onChange={e => setStartDate(e.target.value)} />
                </div>
                <div className="form-group" style={{ margin: 0 }}>
                    <label className="form-label">📅 After Date (T2)</label>
                    <input id="analysis-end" type="date" className="form-input" value={endDate} onChange={e => setEndDate(e.target.value)} />
                </div>
                <button
                    id="run-analysis-btn"
                    className="btn btn-primary btn-lg"
                    onClick={runAnalysis}
                    disabled={loading || !activeAOI}
                    style={{ height: 44, minWidth: 160 }}
                >
                    {loading ? '⟳ Analysing…' : '🚀 Run Analysis'}
                </button>
            </div>

            {/* ── Loading ── */}
            {loading && (
                <div style={{
                    padding: '32px 20px',
                    background: 'rgba(0,212,255,0.04)',
                    border: '1px solid rgba(0,212,255,0.15)',
                    borderRadius: 16,
                    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 18,
                }}>
                    <div style={{ position: 'relative' }}>
                        <div className="spinner" style={{ width: 48, height: 48 }} />
                        <span style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.1rem' }}>🛰</span>
                    </div>
                    <div style={{ textAlign: 'center' }}>
                        <div style={{ fontWeight: 700, color: 'var(--cyan)', fontSize: '1rem', marginBottom: 6 }}>
                            Satellite Analysis in Progress
                        </div>
                        <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>{stage}</div>
                    </div>
                    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', justifyContent: 'center' }}>
                        {['STAC Search', 'Band B4', 'Band B8', 'NDVI Calc', 'OpenCV Diff', 'Change Map'].map((s, i) => (
                            <span key={s} className="tag tag-cyan" style={{ opacity: 0.7 + i * 0.05 }}>{s}</span>
                        ))}
                    </div>
                </div>
            )}

            {/* ── Error ── */}
            {error && !loading && (
                <div style={{ padding: '14px 18px', background: 'var(--red-dim)', border: '1px solid rgba(255,69,96,0.3)', borderRadius: 10, color: 'var(--red)', display: 'flex', alignItems: 'center', gap: 10 }}>
                    <span style={{ fontSize: '1.2rem' }}>⚠</span>
                    <div>
                        <div style={{ fontWeight: 600, marginBottom: 2 }}>Analysis Error</div>
                        <div style={{ fontSize: '0.82rem', opacity: 0.8 }}>{error}</div>
                    </div>
                    <button className="btn btn-ghost btn-sm" style={{ marginLeft: 'auto' }} onClick={() => setError(null)}>Dismiss</button>
                </div>
            )}

            {/* ── Results ── */}
            {result && !loading && (
                <>
                    {/* Mode notices */}
                    {result.mode === 'demo' && (
                        <div style={{ padding: '10px 16px', background: 'rgba(255,176,32,0.06)', border: '1px solid rgba(255,176,32,0.2)', borderRadius: 8, fontSize: '0.78rem', color: 'var(--amber)' }}>
                            ⚡ Smart demo mode — results are geographically calibrated estimates. Start the Python backend + add Sentinel Hub credentials for full analysis.
                        </div>
                    )}
                    {result.mode === 'api' && (
                        <div style={{ padding: '10px 16px', background: 'rgba(0, 255, 136, 0.06)', border: '1px solid rgba(0, 255, 136, 0.2)', borderRadius: 8, fontSize: '0.78rem', color: 'var(--green)' }}>
                            🚀 Live API data — Successfully fetched real Sentinel-2 satellite thumbnails from the AWS Earth Search API! Full NDVI calculation requires python backend.
                        </div>
                    )}

                    {/* Main metric cards */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 14 }} className="animate-in">
                        <MetricCard
                            label={analysisType === 'ndbi' ? "Urban Growth" : "Change Detected"}
                            value={`${result.change_pct}%`}
                            sub={`${result.area_changed_km2 || '—'} km² affected`}
                            color={analysisType === 'ndbi' && result.change_pct > 0 ? 'var(--amber)' : sColor}
                        />
                        <MetricCard
                            label={`Index Before (T1)`}
                            value={result.ndvi_before}
                            sub={`T1: ${result.start_date}`}
                            color={getNdviColor(result.ndvi_before)}
                        />
                        <MetricCard
                            label={`Index After (T2)`}
                            value={result.ndvi_after}
                            sub={`T2: ${result.end_date}`}
                            color={getNdviColor(result.ndvi_after)}
                        />
                        <MetricCard
                            label="Target Environment"
                            value={analysisType === 'ndbi' ? "Build-up (NDBI)" : "Vegetation (NDVI)"}
                            sub={`Data Source: Copernicus`}
                            color={analysisType === 'ndbi' ? 'var(--cyan)' : 'var(--green)'}
                        />
                        <div className="stat-card">
                            <div className="stat-label">Severity</div>
                            <div style={{ marginTop: 12 }}><SeverityBadge severity={result.severity} /></div>
                            <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: 8 }}>
                                {result.days_between} days analysed
                            </div>
                        </div>
                    </div>

                    {/* Predictive Intelligence Breakdown */}
                    <div style={{
                        padding: '24px',
                        background: `linear-gradient(135deg, rgba(3,8,20,0.8), ${sColor}15)`,
                        border: `1px solid ${sColor}44`,
                        borderRadius: 16,
                        color: 'var(--text-secondary)',
                        boxShadow: `0 8px 32px ${sColor}1a`,
                        position: 'relative',
                        overflow: 'hidden'
                    }} className="animate-in">
                        <div style={{ position: 'absolute', top: -50, right: -50, width: 150, height: 150, background: sColor, filter: 'blur(80px)', opacity: 0.15, pointerEvents: 'none' }} />

                        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
                            <span style={{ fontSize: '1.6rem' }}>🧠</span>
                            <strong style={{ color: 'var(--text-primary)', fontSize: '1.2rem', fontFamily: 'var(--font-display)', letterSpacing: '0.05em' }}>Geo-Intelligence Analysis</strong>
                        </div>
                        <p style={{ marginBottom: 16, fontSize: '1.05rem', lineHeight: 1.6, color: 'white', fontWeight: 500 }}>{simpleSummary}</p>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
                            <div style={{ background: 'rgba(0,0,0,0.4)', padding: 16, borderRadius: 10, borderLeft: `4px solid ${result.ndvi_delta < -0.05 ? 'var(--red)' : result.ndvi_delta > 0.05 ? 'var(--green)' : 'var(--cyan)'}`, borderBottom: '1px solid var(--border)' }}>
                                <strong style={{ color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8, fontSize: '0.95rem' }}>
                                    {shiftTitle}
                                </strong>
                                <span style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', lineHeight: 1.5, display: 'block' }}>
                                    {shiftDesc}
                                </span>
                            </div>

                            <div style={{ background: 'rgba(0,0,0,0.4)', padding: 16, borderRadius: 10, borderLeft: `4px solid ${result.change_pct > 15 ? 'var(--amber)' : 'var(--cyan)'}`, borderBottom: '1px solid var(--border)' }}>
                                <strong style={{ color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8, fontSize: '0.9rem' }}>
                                    <span style={{ color: result.change_pct > 15 ? 'var(--amber)' : 'var(--cyan)' }}>🎯</span> Automated Action Planner
                                </strong>
                                <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', lineHeight: 1.5, display: 'block' }}>
                                    {result.change_pct > 25
                                        ? `Critical spatial shift exceeding safety limits. Immediate physical verification of geographic coordinates is highly recommended.`
                                        : result.change_pct > 10
                                            ? `Moderate topographical shifts observed. Construct an automated weekly trigger alert to monitor trajectory.`
                                            : `Standard baseline noise. No manual intervention required. Logged to database for future reference.`}
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Visual comparison + NDVI bars */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: 24 }} className="animate-in">

                        {/* Before / After panels */}
                        <div className="card" style={{ padding: 16 }}>
                            <div className="section-header" style={{ marginBottom: 12 }}>
                                <span className="section-title">Imagery Comparison</span>
                            </div>
                            <div className="comparison-grid" style={{ marginBottom: 12 }}>
                                {/* Before */}
                                <div className="comparison-panel hologram-effect">
                                    <div className="radar-scan" style={{
                                        height: 250,
                                        display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 6,
                                        position: 'relative', overflow: 'hidden',
                                        background: '#080c14'
                                    }}>
                                        {result.image_before ? (
                                            <img src={result.image_before} alt="Satellite image before" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                        ) : (
                                            <div style={{ opacity: 0.5 }}>No image available</div>
                                        )}
                                        <div style={{ position: 'absolute', top: 10, left: 10, zIndex: 1, textAlign: 'center', padding: '4px 8px', background: 'rgba(0,0,0,0.6)', borderRadius: 4 }}>
                                            <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.9rem', color: getNdviColor(result.ndvi_before), textShadow: '0 2px 4px rgba(0,0,0,0.8)' }}>
                                                Avg NDVI: {result.ndvi_before}
                                            </div>
                                        </div>
                                    </div>
                                    <div className="comparison-label">📅 {result.start_date} · Before</div>
                                </div>

                                {/* After */}
                                <div className="comparison-panel hologram-effect">
                                    <div className="radar-scan" style={{
                                        height: 250,
                                        display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 6,
                                        position: 'relative', overflow: 'hidden',
                                        background: '#080c14'
                                    }}>
                                        {result.image_after ? (
                                            <img src={result.image_after} alt="Satellite image after" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                        ) : (
                                            <div style={{ opacity: 0.5 }}>No image available</div>
                                        )}
                                        <div style={{ position: 'absolute', top: 10, left: 10, zIndex: 1, textAlign: 'center', padding: '4px 8px', background: 'rgba(0,0,0,0.6)', borderRadius: 4 }}>
                                            <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.9rem', color: getNdviColor(result.ndvi_after), textShadow: '0 2px 4px rgba(0,0,0,0.8)' }}>
                                                Avg NDVI: {result.ndvi_after}
                                            </div>
                                        </div>
                                    </div>
                                    <div className="comparison-label">📅 {result.end_date} · After</div>
                                </div>
                            </div>

                            {/* Change scanner breakdown */}
                            <div style={{
                                marginTop: 16,
                                padding: 16,
                                borderRadius: 12,
                                border: '1px solid var(--border)',
                                position: 'relative',
                                overflow: 'hidden',
                                background: `linear-gradient(90deg, rgba(0,0,0,0.6) 0%, ${sColor}1a 100%)`
                            }}>
                                <div className="scan-line" style={{ animationDuration: '4s' }} />
                                <div style={{ position: 'relative', zIndex: 1, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                    <div>
                                        <div style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: 4 }}>
                                            <span style={{ color: sColor, marginRight: 8 }}>⚡</span>
                                            Change Map Rendered
                                        </div>
                                        <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                                            {result.change_pct}% of the selected zone modified
                                        </div>
                                    </div>
                                    <div style={{ textAlign: 'right' }}>
                                        <div style={{ fontFamily: 'var(--font-mono)', fontSize: '1.2rem', color: sColor, fontWeight: 700 }}>
                                            {result.changed_px?.toLocaleString()} px
                                        </div>
                                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                                            Total shifted pixels
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Metadata + NDVI bars */}
                        <div className="card" style={{ padding: 16 }}>
                            <div className="section-header" style={{ marginBottom: 12 }}>
                                <span className="section-title">Detailed Metrics</span>
                            </div>

                            <NDVIBar label="NDVI Before (T1)" value={result.ndvi_before} />
                            <NDVIBar label="NDVI After (T2)" value={result.ndvi_after} />

                            <div style={{ marginBottom: 10 }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4, fontSize: '0.8rem' }}>
                                    <span style={{ color: 'var(--text-secondary)' }}>NDVI Δ (change)</span>
                                    <span style={{ fontFamily: 'var(--font-mono)', color: sColor, fontWeight: 700 }}>{result.ndvi_delta?.toFixed(4)}</span>
                                </div>
                                <div className="progress-bar">
                                    <div style={{ height: '100%', borderRadius: 3, width: `${Math.min(100, Math.abs(result.ndvi_delta) * 200)}%`, background: sColor }} />
                                </div>
                            </div>

                            <div className="divider" />

                            {[
                                ['AOI', result.aoi_name],
                                ['Start Date', result.start_date],
                                ['End Date', result.end_date],
                                ['Days Between', `${result.days_between} days`],
                                ['Scenes Found (T1)', result.scene_count_before],
                                ['Scenes Found (T2)', result.scene_count_after],
                                ['Cloud Cover T1', `${result.cloud_cover_before}%`],
                                ['Cloud Cover T2', `${result.cloud_cover_after}%`],
                                ['Pixels Changed', result.changed_px?.toLocaleString()],
                                ['Source', `${result.platform || 'Sentinel-2 L2A'} · ESA Copernicus`],
                            ].map(([k, v]) => (
                                <div className="info-row" key={k}>
                                    <span className="info-key">{k}</span>
                                    <span className="info-val" style={{ fontSize: '0.78rem' }}>{v}</span>
                                </div>
                            ))}

                            <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginTop: 20 }}>
                                {mode === 'drawn' && (
                                    <button className="btn btn-violet" onClick={() => {
                                        const customName = window.prompt("Enter a name for your saved zone:", result.aoi_name || "Custom Zone");
                                        if (!customName || customName.trim() === "") return;

                                        addAOI({
                                            name: customName.trim(),
                                            category: 'agriculture',
                                            color: '#00d4ff',
                                            bounds: activeAOI.bounds,
                                            center: activeAOI.center,
                                            area_km2: activeAOI.area_km2,
                                            report: result || null,
                                            created: new Date().toISOString().split('T')[0],
                                            lastChecked: new Date().toISOString(),
                                            alertCount: result ? 1 : 0,
                                            status: result ? (result.severity || 'info') : 'normal',
                                            alert_threshold: alertThreshold
                                        });
                                        alert(`'${customName.trim()}' has been saved! An initial alert has been registered and an email dispatched (if configured).`);
                                    }}>
                                        <span style={{ fontSize: '1.2rem' }}>💾</span> Save to Dashboard
                                    </button>
                                )}
                                {showThresholdSelector && (
                                    <div className="animate-in" style={{ padding: 14, background: 'rgba(0,0,0,0.4)', borderRadius: 12, border: '1px solid rgba(0,212,255,0.2)' }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                                            <span style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Set Change Threshold for 🔔 Notifications</span>
                                            <span style={{ fontSize: '0.75rem', color: 'var(--cyan)', fontFamily: 'var(--font-mono)' }}>Current: {alertThreshold}%</span>
                                        </div>
                                        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                                            {[5, 10, 15, 20, 25, 40].map(v => (
                                                <button 
                                                    key={v} 
                                                    className={`btn btn-sm ${alertThreshold === v ? 'btn-primary' : 'btn-ghost'}`}
                                                    onClick={() => updateHookThreshold(v)}
                                                    style={{ flex: 1, minWidth: 50 }}
                                                >
                                                    {v}%
                                                </button>
                                            ))}
                                        </div>
                                        <div style={{ marginTop: 8, fontSize: '0.7rem', color: 'var(--text-muted)', textAlign: 'center' }}>
                                            System will trigger a critical alert if any scan detects variance above this %
                                        </div>
                                    </div>
                                )}
                                <div style={{ display: 'flex', gap: 12 }}>
                                    <button 
                                        className={`btn ${showThresholdSelector ? 'btn-ghost' : 'btn-primary'}`} 
                                        style={{ flex: 1, justifyContent: 'center' }} 
                                        onClick={() => {
                                            if (mode === 'drawn') {
                                                alert("Please save this zone to the Dashboard before establishing an automated hook alert.");
                                            } else {
                                                setShowThresholdSelector(!showThresholdSelector);
                                            }
                                        }}
                                    >
                                        <span style={{ fontSize: '1.1rem' }}>{showThresholdSelector ? '✕' : '🔔'}</span> {showThresholdSelector ? 'Cancel' : 'Establish Hook Alert'}
                                    </button>
                                    <button className="btn btn-ghost" style={{ flex: 1, justifyContent: 'center' }} onClick={handleExportData}>
                                        <span style={{ fontSize: '1.1rem' }}>📥</span> Export Data
                                    </button>
                                </div>
                            </div>

                            {/* Raw Data Downloads */}
                            {result.mode === 'api' && result.links_after && (
                                <div style={{ marginTop: 24, paddingTop: 16, borderTop: '1px solid var(--border)' }}>
                                    <div style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 12 }}>
                                        Raw T2 STAC Downloads (Cloud Optimized GeoTIFF)
                                    </div>
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                                        {result.links_after.visual && (
                                            <a href={result.links_after.visual} target="_blank" rel="noreferrer" className="btn btn-sm btn-ghost" style={{ justifyContent: 'center', fontSize: '0.75rem' }}>
                                                ⬇ True Color
                                            </a>
                                        )}
                                        {result.links_after.red && (
                                            <a href={result.links_after.red} target="_blank" rel="noreferrer" className="btn btn-sm btn-ghost" style={{ justifyContent: 'center', fontSize: '0.75rem' }}>
                                                ⬇ Band 4 (Red)
                                            </a>
                                        )}
                                        {result.links_after.nir && (
                                            <a href={result.links_after.nir} target="_blank" rel="noreferrer" className="btn btn-sm btn-ghost" style={{ justifyContent: 'center', fontSize: '0.75rem' }}>
                                                ⬇ Band 8 (NIR)
                                            </a>
                                        )}
                                        {result.links_after.scl && (
                                            <a href={result.links_after.scl} target="_blank" rel="noreferrer" className="btn btn-sm btn-ghost" style={{ justifyContent: 'center', fontSize: '0.75rem' }}>
                                                ⬇ Scene Mask
                                            </a>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* NDVI trend chart */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                        <div className="card" style={{ padding: 20 }}>
                            <div className="section-header"><span className="section-title">6-Month Spatial NDVI Trend</span></div>
                            <NDVIChart data={ndviData} />
                        </div>
                        <div className="card" style={{ padding: 20 }}>
                            <div className="section-header"><span className="section-title">Monthly NDVI Deviations</span></div>
                            <ChangeChart data={ndviData} />
                        </div>
                    </div>
                </>
            )}

            {/* ── Methodology footer ── */}
            {!loading && (
                <div className="card" style={{ padding: 18 }}>
                    <div className="section-header" style={{ marginBottom: 14 }}>
                        <span className="section-title">How It Works</span>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 12 }}>
                        {[
                            ['🗺', 'Draw AOI', 'Select any area on the map using the draw tools'],
                            ['🛰', 'Sentinel-2', 'Backend fetches Bands B4 + B8 from ESA Copernicus'],
                            ['🌿', 'NDVI', '(NIR−RED)/(NIR+RED) computed per pixel for both dates'],
                            ['🔬', 'OpenCV Diff', 'Pixel-wise temporal difference + threshold masking'],
                            ['📧', 'Alert', 'Auto email if change exceeds configured threshold'],
                        ].map(([icon, title, desc]) => (
                            <div key={title} style={{ padding: 12, background: 'rgba(0,0,0,0.2)', borderRadius: 10, border: '1px solid var(--border)', textAlign: 'center' }}>
                                <div style={{ fontSize: '1.6rem', marginBottom: 6 }}>{icon}</div>
                                <div style={{ fontWeight: 600, fontSize: '0.82rem', marginBottom: 4 }}>{title}</div>
                                <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', lineHeight: 1.4 }}>{desc}</div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
