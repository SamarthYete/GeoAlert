import {
    LineChart, Line, AreaChart, Area, BarChart, Bar,
    XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine,
} from 'recharts';

const customTooltip = ({ active, payload, label }) => {
    if (!active || !payload?.length) return null;
    return (
        <div style={{
            background: 'rgba(6,14,30,0.95)',
            border: '1px solid var(--border-bright)',
            borderRadius: 8,
            padding: '8px 12px',
            fontSize: 12,
            fontFamily: 'var(--font-mono)',
        }}>
            <div style={{ color: 'var(--text-muted)', marginBottom: 4 }}>{label}</div>
            {payload.map(p => (
                <div key={p.dataKey} style={{ color: p.color }}>
                    {p.name}: <strong>{typeof p.value === 'number' ? p.value.toFixed(3) : p.value}</strong>
                </div>
            ))}
        </div>
    );
};

export function NDVIChart({ data }) {
    return (
        <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={data} margin={{ top: 10, right: 10, bottom: 0, left: -20 }}>
                <defs>
                    <linearGradient id="ndviGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#00ff88" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#00ff88" stopOpacity={0.02} />
                    </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="date" tick={{ fill: 'var(--text-muted)', fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis domain={[0, 1]} tick={{ fill: 'var(--text-muted)', fontSize: 11 }} axisLine={false} tickLine={false} />
                <Tooltip content={customTooltip} />
                <ReferenceLine y={0.5} stroke="rgba(255,176,32,0.3)" strokeDasharray="4 4" />
                <Area
                    type="monotone" dataKey="ndvi" name="NDVI"
                    stroke="#00ff88" strokeWidth={2}
                    fill="url(#ndviGrad)"
                    dot={{ fill: '#00ff88', r: 4, strokeWidth: 0 }}
                    activeDot={{ r: 6, fill: '#00ff88' }}
                />
            </AreaChart>
        </ResponsiveContainer>
    );
}

export function ChangeChart({ data }) {
    return (
        <ResponsiveContainer width="100%" height={180}>
            <BarChart data={data} margin={{ top: 10, right: 10, bottom: 0, left: -20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="date" tick={{ fill: 'var(--text-muted)', fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: 'var(--text-muted)', fontSize: 11 }} axisLine={false} tickLine={false} />
                <Tooltip content={customTooltip} />
                <ReferenceLine y={0} stroke="rgba(255,255,255,0.15)" />
                <Bar
                    dataKey="change" name="NDVI Δ"
                    fill="#00d4ff"
                    radius={[3, 3, 0, 0]}
                    // Color by value
                    label={false}
                />
            </BarChart>
        </ResponsiveContainer>
    );
}

export function MultiNDVIChart({ datasets }) {
    // datasets: [{id, name, color, data: [{date, ndvi}]}]
    const merged = {};
    datasets.forEach(ds => {
        ds.data.forEach(pt => {
            if (!merged[pt.date]) merged[pt.date] = { date: pt.date };
            merged[pt.date][ds.id] = pt.ndvi;
        });
    });
    const chartData = Object.values(merged);

    return (
        <ResponsiveContainer width="100%" height={200}>
            <LineChart data={chartData} margin={{ top: 10, right: 10, bottom: 0, left: -20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="date" tick={{ fill: 'var(--text-muted)', fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis domain={[0, 1]} tick={{ fill: 'var(--text-muted)', fontSize: 11 }} axisLine={false} tickLine={false} />
                <Tooltip content={customTooltip} />
                {datasets.map(ds => (
                    <Line
                        key={ds.id}
                        type="monotone"
                        dataKey={ds.id}
                        name={ds.name}
                        stroke={ds.color}
                        strokeWidth={2}
                        dot={{ fill: ds.color, r: 3 }}
                    />
                ))}
            </LineChart>
        </ResponsiveContainer>
    );
}
