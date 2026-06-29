import { createContext, useContext, useState } from 'react';

const AOIContext = createContext(null);

export function AOIProvider({ children }) {
    const [drawnAOI, setDrawnAOI] = useState(null);
    // drawnAOI shape:
    // {
    //   bounds: [[south, west], [north, east]],   // leaflet style
    //   bbox:   [west, south, east, north],        // OGC/Sentinel style
    //   center: [lat, lng],
    //   area_km2: number,
    //   name: string (optional),
    // }

    const clearDrawnAOI = () => setDrawnAOI(null);

    return (
        <AOIContext.Provider value={{ drawnAOI, setDrawnAOI, clearDrawnAOI }}>
            {children}
        </AOIContext.Provider>
    );
}

export function useAOIContext() {
    const ctx = useContext(AOIContext);
    if (!ctx) throw new Error('useAOIContext must be inside AOIProvider');
    return ctx;
}
