import { useState, Suspense, lazy } from 'react';
import { useAOIs } from '../hooks/useData';
import { useAOIContext } from '../context/AOIContext.jsx';
import './MapExplorer.css'; // Let's add specific styles

const AOIMap = lazy(() => import('../components/AOIMap'));

export default function MapExplorer({ setActivePage }) {
    const { aois } = useAOIs();
    const { setDrawnAOI } = useAOIContext();

    const [drawnShape, setDrawnShape] = useState(null);
    const [startDate, setStartDate] = useState(new Date(Date.now() - 90 * 86400000).toISOString().split('T')[0]);
    const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0]);

    function calcBbox(bounds) {
        if (!bounds) return null;
        const [[s, w], [n, e]] = bounds;
        return [w, s, e, n];
    }

    const handleDrawComplete = (shape) => {
        setDrawnShape(shape);
        setDrawnAOI({
            bounds: shape.bounds,
            bbox: calcBbox(shape.bounds),
            center: shape.center,
            area_km2: shape.area_km2,
            name: 'Custom drawn AOI',
        });
    };

    const handleClearMap = () => {
        setDrawnShape(null);
        setDrawnAOI(null);
        // We'll need to tell AOIMap to clear drawn items somehow or just force re-render
    };

    const handleAnalyseNow = () => {
        if (!drawnShape) return;
        // Optionally pass dates via context or just use them in Analysis component state (currently Analysis expects dates there but passing via context would be better).
        // Let's attach dates to the drawnAOI context
        setDrawnAOI(prev => ({
            ...prev,
            startDate,
            endDate
        }));
        setActivePage('analysis');
    };

    return (
        <div className="map-explorer-container">
            <div className="map-wrapper">
                <Suspense fallback={<div className="spinner-center"><div className="spinner" /></div>}>
                    <AOIMap
                        aois={aois}
                        selectedAoi={null}
                        onSelectAoi={(aoi) => {
                            setDrawnShape({ type: 'saved', area_km2: aoi.area_km2, bounds: aoi.bounds });
                            setDrawnAOI({
                                bounds: aoi.bounds,
                                bbox: aoi.bounds ? [aoi.bounds[0][1], aoi.bounds[0][0], aoi.bounds[1][1], aoi.bounds[1][0]] : null,
                                center: aoi.center,
                                area_km2: aoi.area_km2,
                                name: aoi.name,
                            });
                        }}
                        onDrawComplete={handleDrawComplete}
                    />
                </Suspense>
            </div>

            {drawnShape && (
                <div className="bottom-action-bar animate-up">
                    <div className="status-banner">
                        <span className="checkbox-icon">☑</span> Feature selected! Now choose your date range.
                    </div>

                    <div className="action-inputs">
                        <div className="date-group">
                            <label>Start Date</label>
                            <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} />
                        </div>
                        <div className="date-group">
                            <label>End Date</label>
                            <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} />
                        </div>

                        <div className="action-buttons">
                            <button className="btn-clear" onClick={handleClearMap}>Clear Map</button>
                            <button className="btn-analyze" onClick={handleAnalyseNow}>
                                <div className="analyze-circle"></div>
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
