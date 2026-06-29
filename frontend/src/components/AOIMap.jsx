import { useEffect, useRef } from 'react';
import { getNdviColor, getStatusColor, CATEGORY_ICONS } from '../data/mockData';

// Dynamically import leaflet to avoid SSR issues
let L;
try { L = await import('leaflet'); } catch (e) { }

export default function AOIMap({ aois, selectedAoi, onSelectAoi, onDrawComplete }) {
    const mapRef = useRef(null);
    const mapInstance = useRef(null);
    const layersRef = useRef({});
    const drawControlRef = useRef(null);

    useEffect(() => {
        if (mapInstance.current || !mapRef.current) return;

        import('leaflet').then(leaflet => {
            const Lx = leaflet.default || leaflet;

            // Dark tile layer
            const map = Lx.map(mapRef.current, {
                center: [20.5937, 78.9629],
                zoom: 5,
                zoomControl: true,
                attributionControl: false,
            });

            // Space-based dark satellite style
            Lx.tileLayer(
                'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
                { maxZoom: 18, attribution: 'Esri, Maxar, Earthstar Geographics' },
            ).addTo(map);

            // Add a dark overlay to make it look "space-based UI"
            Lx.tileLayer(
                'https://{s}.basemaps.cartocdn.com/dark_only/{z}/{x}/{y}{r}.png',
                { maxZoom: 19, opacity: 0.4 },
            ).addTo(map);

            // Add Labels layer for States and Localities
            Lx.tileLayer(
                'https://{s}.basemaps.cartocdn.com/dark_only_labels/{z}/{x}/{y}{r}.png',
                { maxZoom: 19, zIndex: 100 },
            ).addTo(map);

            mapInstance.current = map;
            window._akashMap = map;
            window._Lx = Lx;

            // Try loading draw plugin
            import('leaflet-draw').then(() => {
                const drawnItems = new Lx.FeatureGroup();
                map.addLayer(drawnItems);

                const drawControl = new Lx.Control.Draw({
                    position: 'topleft',
                    draw: {
                        polygon: { shapeOptions: { color: '#00d4ff', weight: 2, fillOpacity: 0.15 } },
                        rectangle: { shapeOptions: { color: '#00d4ff', weight: 2, fillOpacity: 0.15 } },
                        circle: false,
                        circlemarker: false,
                        marker: false,
                        polyline: false,
                    },
                    edit: { featureGroup: drawnItems },
                });
                map.addControl(drawControl);
                drawControlRef.current = drawControl;

                map.on(Lx.Draw.Event.CREATED, (e) => {
                    const layer = e.layer;
                    drawnItems.addLayer(layer);
                    const bounds = layer.getBounds ? layer.getBounds() : null;
                    const center = bounds ? bounds.getCenter() : null;
                    if (onDrawComplete) {
                        onDrawComplete({
                            type: e.layerType,
                            bounds: bounds ? [[bounds.getSouth(), bounds.getWest()], [bounds.getNorth(), bounds.getEast()]] : null,
                            center: center ? [center.lat, center.lng] : null,
                            area_km2: calcArea(layer, Lx),
                        });
                    }
                });
            }).catch(() => { });
        });

        return () => {
            if (mapInstance.current) {
                mapInstance.current.remove();
                mapInstance.current = null;
            }
        };
    }, []);

    // Render AOI polygons
    useEffect(() => {
        const map = mapInstance.current;
        if (!map || !aois || !window._Lx) return;
        const Lx = window._Lx;

        // Clear existing layers
        Object.values(layersRef.current).forEach(l => { try { map.removeLayer(l); } catch (e) { } });
        layersRef.current = {};

        aois.forEach(aoi => {
            if (!aoi.bounds) return;
            const color = aoi.color || '#00d4ff';
            const rect = Lx.rectangle(aoi.bounds, {
                color,
                weight: 2,
                fillOpacity: selectedAoi?.id === aoi.id ? 0.25 : 0.1,
                dashArray: aoi.status === 'critical' ? '6, 4' : null,
            }).addTo(map);

            // Icon marker
            const icon = Lx.divIcon({
                html: `<div style="
          background: rgba(3,8,20,0.9);
          border: 2px solid ${color};
          border-radius: 8px;
          padding: 4px 8px;
          font-size: 11px;
          font-family: var(--font-mono, monospace);
          color: ${color};
          white-space: nowrap;
          box-shadow: 0 0 12px ${color}44;
        ">${CATEGORY_ICONS[aoi.category] || '📍'} ${aoi.name.split(' ').slice(0, 2).join(' ')}</div>`,
                className: '',
                iconAnchor: [0, 0],
            });

            const center = aoi.center || [
                (aoi.bounds[0][0] + aoi.bounds[1][0]) / 2,
                (aoi.bounds[0][1] + aoi.bounds[1][1]) / 2,
            ];
            const marker = Lx.marker(center, { icon }).addTo(map);

            const ndviColor = getNdviColor(aoi.ndvi || 0.5);
            marker.bindPopup(`
        <div style="min-width:220px; font-family: sans-serif;">
          <div style="font-weight:700; font-size:14px; margin-bottom:8px; color:${color}">${aoi.name}</div>
          <div style="display:grid; grid-template-columns:1fr 1fr; gap:6px; font-size:12px;">
            <div style="opacity:0.6">Category</div><div style="text-transform:capitalize">${aoi.category}</div>
            <div style="opacity:0.6">Area</div><div>${aoi.area_km2} km²</div>
            <div style="opacity:0.6">NDVI</div><div style="color:${ndviColor}; font-weight:600">${aoi.ndvi}</div>
            <div style="opacity:0.6">Status</div><div style="color:${getStatusColor(aoi.status)}; font-weight:600; text-transform:capitalize">${aoi.status}</div>
            <div style="opacity:0.6">Alerts</div><div style="color:${aoi.alertCount > 0 ? '#ff4560' : '#00ff88'}">${aoi.alertCount}</div>
          </div>
        </div>
      `);

            rect.on('click', () => { onSelectAoi && onSelectAoi(aoi); });
            marker.on('click', () => { onSelectAoi && onSelectAoi(aoi); });

            layersRef.current[aoi.id] = Lx.layerGroup([rect, marker]);
        });
    }, [aois, selectedAoi]);

    // Fly to selected AOI
    useEffect(() => {
        const map = mapInstance.current;
        if (!map || !selectedAoi?.bounds) return;
        const [[s, w], [n, e]] = selectedAoi.bounds;
        map.flyToBounds([[s, w], [n, e]], { padding: [60, 60], duration: 1.2 });
    }, [selectedAoi]);

    return (
        <div
            ref={mapRef}
            style={{ height: '100%', width: '100%', background: '#060e1e' }}
        />
    );
}

function calcArea(layer, Lx) {
    try {
        const bounds = layer.getBounds();
        const ne = bounds.getNorthEast();
        const sw = bounds.getSouthWest();
        const R = 6371;
        const lat1 = sw.lat * Math.PI / 180;
        const lat2 = ne.lat * Math.PI / 180;
        const dlng = (ne.lng - sw.lng) * Math.PI / 180;
        const area = Math.abs((lat2 - lat1) * dlng * R * R);
        return Math.round(area * 10) / 10;
    } catch { return 0; }
}
