// Mock data for demo mode (no backend required)
export const MOCK_AOIS = [
    {
        id: 'aoi-001',
        name: 'Punjab Agricultural Zone',
        color: '#00d4ff',
        category: 'agriculture',
        center: [30.7333, 76.7794],
        bounds: [[30.68, 76.72], [30.78, 76.84]],
        area_km2: 124.5,
        created: '2025-12-10',
        lastChecked: '2026-03-04T08:30:00',
        alertCount: 2,
        ndvi: 0.72,
        ndviChange: -0.08,
        status: 'warning',
    },
    {
        id: 'aoi-002',
        name: 'Western Ghats Forest Cover',
        color: '#00ff88',
        category: 'forest',
        center: [15.3173, 75.7139],
        bounds: [[15.27, 75.67], [15.37, 75.75]],
        area_km2: 342.0,
        created: '2025-11-05',
        lastChecked: '2026-03-04T07:00:00',
        alertCount: 1,
        ndvi: 0.85,
        ndviChange: -0.02,
        status: 'normal',
    },
    {
        id: 'aoi-003',
        name: 'Rajasthan Desertification Boundary',
        color: '#ffb020',
        category: 'desert',
        center: [27.0238, 74.2179],
        bounds: [[26.97, 74.16], [27.07, 74.28]],
        area_km2: 89.3,
        created: '2026-01-18',
        lastChecked: '2026-03-04T10:15:00',
        alertCount: 3,
        ndvi: 0.18,
        ndviChange: +0.03,
        status: 'critical',
    },
    {
        id: 'aoi-004',
        name: 'Sundarbans Mangrove Delta',
        color: '#7c3aed',
        category: 'wetland',
        center: [21.9497, 89.1833],
        bounds: [[21.9, 89.12], [22.0, 89.24]],
        area_km2: 218.7,
        created: '2025-10-25',
        lastChecked: '2026-03-04T06:45:00',
        alertCount: 0,
        ndvi: 0.78,
        ndviChange: +0.01,
        status: 'normal',
    },
    {
        id: 'aoi-005',
        name: 'Strategic Border Zone Alpha',
        color: '#ff4560',
        category: 'defence',
        center: [34.073, 74.797],
        bounds: [[34.02, 74.74], [34.12, 74.86]],
        area_km2: 56.2,
        created: '2026-02-01',
        lastChecked: '2026-03-04T11:30:00',
        alertCount: 5,
        ndvi: 0.31,
        ndviChange: -0.15,
        status: 'critical',
    },
];

export const MOCK_ALERTS = [
    {
        id: 'alrt-001',
        aoiId: 'aoi-005',
        aoiName: 'Strategic Border Zone Alpha',
        type: 'structural_change',
        severity: 'critical',
        title: 'Unexplained Structural Change Detected',
        description: 'Significant land alteration detected — 12.4 sq km affected. Possible construction or earthmoving activity.',
        change_percent: 31.2,
        ndvi_before: 0.46,
        ndvi_after: 0.31,
        timestamp: '2026-03-04T11:32:00Z',
        emailSent: true,
    },
    {
        id: 'alrt-002',
        aoiId: 'aoi-003',
        aoiName: 'Rajasthan Desertification Boundary',
        type: 'desertification',
        severity: 'critical',
        title: 'Rapid Desertification Spreading',
        description: 'Sand dune migration rate accelerating. 8.1 sq km new barren land detected over 30-day period.',
        change_percent: 9.1,
        ndvi_before: 0.21,
        ndvi_after: 0.18,
        timestamp: '2026-03-04T09:15:00Z',
        emailSent: true,
    },
    {
        id: 'alrt-003',
        aoiId: 'aoi-001',
        aoiName: 'Punjab Agricultural Zone',
        type: 'crop_stress',
        severity: 'warning',
        title: 'Crop Stress — Possible Pest Infestation',
        description: 'NDVI dropped 0.08 points in 14-day window. Patchy decline pattern consistent with localized pest or water stress.',
        change_percent: 11.1,
        ndvi_before: 0.80,
        ndvi_after: 0.72,
        timestamp: '2026-03-04T08:30:00Z',
        emailSent: false,
    },
    {
        id: 'alrt-004',
        aoiId: 'aoi-001',
        aoiName: 'Punjab Agricultural Zone',
        type: 'irrigation_loss',
        severity: 'warning',
        title: 'Irrigation Anomaly Detected',
        description: 'Reduced water body reflection in the southern sector — possible irrigation channel disruption.',
        change_percent: 6.3,
        ndvi_before: 0.75,
        ndvi_after: 0.72,
        timestamp: '2026-03-03T15:00:00Z',
        emailSent: true,
    },
    {
        id: 'alrt-005',
        aoiId: 'aoi-002',
        aoiName: 'Western Ghats Forest Cover',
        type: 'logging',
        severity: 'info',
        title: 'Minor Canopy Reduction Noted',
        description: 'Sub-threshold canopy thinning detected. 0.8 sq km affected — within seasonal variation range.',
        change_percent: 0.23,
        ndvi_before: 0.87,
        ndvi_after: 0.85,
        timestamp: '2026-03-03T07:00:00Z',
        emailSent: false,
    },
];

export const MOCK_NDVI_SERIES = {
    'aoi-001': [
        { date: 'Oct', ndvi: 0.74, change: 0 },
        { date: 'Nov', ndvi: 0.78, change: 0.04 },
        { date: 'Dec', ndvi: 0.82, change: 0.04 },
        { date: 'Jan', ndvi: 0.80, change: -0.02 },
        { date: 'Feb', ndvi: 0.76, change: -0.04 },
        { date: 'Mar', ndvi: 0.72, change: -0.04 },
    ],
    'aoi-002': [
        { date: 'Oct', ndvi: 0.88, change: 0 },
        { date: 'Nov', ndvi: 0.87, change: -0.01 },
        { date: 'Dec', ndvi: 0.86, change: -0.01 },
        { date: 'Jan', ndvi: 0.87, change: 0.01 },
        { date: 'Feb', ndvi: 0.86, change: -0.01 },
        { date: 'Mar', ndvi: 0.85, change: -0.01 },
    ],
    'aoi-003': [
        { date: 'Oct', ndvi: 0.22, change: 0 },
        { date: 'Nov', ndvi: 0.21, change: -0.01 },
        { date: 'Dec', ndvi: 0.20, change: -0.01 },
        { date: 'Jan', ndvi: 0.19, change: -0.01 },
        { date: 'Feb', ndvi: 0.18, change: -0.01 },
        { date: 'Mar', ndvi: 0.18, change: 0 },
    ],
    'aoi-004': [
        { date: 'Oct', ndvi: 0.77, change: 0 },
        { date: 'Nov', ndvi: 0.78, change: 0.01 },
        { date: 'Dec', ndvi: 0.79, change: 0.01 },
        { date: 'Jan', ndvi: 0.78, change: -0.01 },
        { date: 'Feb', ndvi: 0.78, change: 0 },
        { date: 'Mar', ndvi: 0.78, change: 0 },
    ],
    'aoi-005': [
        { date: 'Oct', ndvi: 0.46, change: 0 },
        { date: 'Nov', ndvi: 0.44, change: -0.02 },
        { date: 'Dec', ndvi: 0.41, change: -0.03 },
        { date: 'Jan', ndvi: 0.38, change: -0.03 },
        { date: 'Feb', ndvi: 0.34, change: -0.04 },
        { date: 'Mar', ndvi: 0.31, change: -0.03 },
    ],
};

export const MOCK_COMPARISON = {
    'aoi-001': {
        before_date: '2026-01-15',
        after_date: '2026-03-01',
        before_img: 'https://placehold.co/400x200/0a3311/00ff88?text=Jan+15+NDVI+0.80',
        after_img: 'https://placehold.co/400x200/331100/ff4560?text=Mar+01+NDVI+0.72',
        change_map: 'https://placehold.co/400x200/001133/00d4ff?text=Change+Map+-11%25',
        changed_px: 18540,
        total_px: 164000,
        change_pct: 11.3,
        summary: 'Significant vegetation stress detected across southern and central sectors.',
    },
};

export function formatTimestamp(ts) {
    const d = new Date(ts);
    return d.toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' });
}

export function getNdviColor(ndvi) {
    if (ndvi >= 0.7) return '#00ff88';
    if (ndvi >= 0.5) return '#a6d96a';
    if (ndvi >= 0.3) return '#fee090';
    if (ndvi >= 0.15) return '#f46d43';
    return '#d73027';
}

export function getStatusColor(status) {
    if (status === 'critical') return 'var(--red)';
    if (status === 'warning') return 'var(--amber)';
    return 'var(--green)';
}

export const CATEGORY_ICONS = {
    agriculture: '🌾',
    forest: '🌳',
    desert: '🏜️',
    wetland: '💧',
    defence: '🛡️',
    urban: '🏙️',
    default: '📍',
};
