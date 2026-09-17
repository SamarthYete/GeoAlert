# 🛰️ Geo-Alert

> **Real-time Geospatial Intelligence & Change Detection Dashboard** powered by Sentinel-2 L2A satellite imagery, NDVI vegetation index calculation, and OpenCV computer vision differencing.

[![Live Demo](https://img.shields.io/badge/Live_Demo-Vercel-000000?style=for-the-badge&logo=vercel)](https://geo-alert-ten.vercel.app)
[![React](https://img.shields.io/badge/React-18-61DAFB?style=for-the-badge&logo=react)](https://react.dev)
[![FastAPI](https://img.shields.io/badge/FastAPI-009688?style=for-the-badge&logo=fastapi)](https://fastapi.tiangolo.com)
[![OpenCV](https://img.shields.io/badge/OpenCV-Computer_Vision-5C3EE8?style=for-the-badge&logo=opencv)](https://opencv.org)
[![Python](https://img.shields.io/badge/Python-3.11+-3776AB?style=for-the-badge&logo=python)](https://python.org)

---

## 🌟 Executive Overview

**Geo-Alert** provides interactive, high-resolution satellite monitoring and automated change detection for environmental, agricultural, and strategic applications:

* 🗺️ **Interactive Area of Interest (AOI)**: Draw custom geometric boundaries directly on a Leaflet satellite map.
* 🌿 **NDVI Vegetation Health Analysis**: Calculates Normalized Difference Vegetation Index using Sentinel-2 Band 4 (Red) and Band 8 (NIR).
* 🔍 **OpenCV Change Detection**: Performs pixel-wise image differencing and morphological filtering to highlight structural or land-use changes between time interval $T_1$ and $T_2$.
* 📧 **Automated Alerts**: Triggers instant SMTP email notifications when land cover changes exceed configurable percentage thresholds.
* 📊 **Analytics Dashboard**: Interactive temporal trend charts powered by Recharts.

---

## 🏗️ System Architecture

```
                                  +---------------------------------------+
                                  |         Copernicus Sentinel-2         |
                                  |         (Satellite Imagery Data)      |
                                  +-------------------+-------------------+
                                                      |
                                                      v
                                        +-------------+-------------+
                                        |  Sentinel Hub / CDSE API  |
                                        +-------------+-------------+
                                                      | Band 4 & Band 8 Images
                                                      v
+-----------------------------------+     +-----------+-------------+     +-------------------------------+
|          React 18 Client          |     |   FastAPI Python Backend |     |        SMTP Email Host        |
|  - Leaflet Map (AOI Selection)    | <-> |  - NumPy Band Math      | --> |  - Change Threshold Trigger   |
|  - Recharts (NDVI Metrics)        |     |  - OpenCV Difference    |     |  - Automated Alert Email      |
|  - Vercel Hosted Frontend         |     |  - Alert Threshold Evaluator | +-------------------------------+
+-----------------------------------+     +-------------------------+
```

### Directory Structure
```
GeoAlert/
├── frontend/                     # React 18 SPA (Vite 7)
│   ├── src/
│   │   ├── components/           # MapContainer, AOISelector, AnalyticsChart, AlertConfig
│   │   ├── services/             # api.js (Axios wrapper for FastAPI endpoints)
│   │   └── hooks/                # useSatelliteData.js, useAOI.js
│   ├── index.html
│   └── package.json
└── backend/                      # FastAPI Python Service
    ├── app/
    │   ├── api/                  # Satellite, ChangeDetection, and Alert Routes
    │   ├── core/                 # Config & Sentinel Hub API credentials
    │   ├── services/             # OpenCV Engine, NDVI Calculator, SMTP Notifier
    │   └── models/               # Pydantic Schemas & DTOs
    ├── main.py                   # FastAPI entrypoint & CORS middleware
    └── requirements.txt
```

---

## ⭐ Star Schema (Geospatial Data Warehouse)

```
                            +-----------------------------------+
                            |           Dim_AOI                 |
                            +-----------------------------------+
                            | AOI_Key (PK)                      |
                            | AOI_Name                          |
                            | Geometry_GeoJSON                  |
                            | Area_SqKm                         |
                            | Primary_Land_Use                  |
                            +-----------------+-----------------+
                                              | 1
                                              |
                                              | N
+-----------------------+   +-----------------+-----------------+   +-----------------------+
|  Dim_Calendar         | 1 |    Fact_SatelliteScanEvents       | 1 |  Dim_SatelliteBand    |
+-----------------------+---+-----------------------------------+---+-----------------------+
| Date_Key (PK)         | N | Scan_Event_Key (PK)               | N | Band_Key (PK)         |
| Full_Date             |   | Date_Key (FK)                     |   | Band_Name (B4, B8)    |
| Month / Year          |   | AOI_Key (FK)                      |   | Resolution_Meters     |
| Season                |   | Band_Key (FK)                     |   | Wavelength_Nanometers |
+-----------------------+   | Mean_NDVI (Measure)               |   +-----------------------+
                            | Changed_Area_Pct (Measure)        |
                            | Changed_Pixels_Count (Measure)    |
                            | Alert_Triggered_Flag (Measure)    |
                            +-----------------+-----------------+
                                              | N
                                              |
                                              | 1
                            +-----------------+-----------------+
                            |         Dim_AlertConfig           |
                            +-----------------------------------+
                            | Alert_Config_Key (PK)             |
                            | User_Email                        |
                            | Threshold_Pct                     |
                            | Severity_Level                    |
                            +-----------------------------------+
```

---

## 📑 Data & API Schemas

### 1. Satellite Analysis Request Payload (`POST /api/v1/analyze-aoi`)
```json
{
  "aoi_name": "Agricultural Parcel Alpha",
  "coordinates": [
    [73.8567, 18.5204],
    [73.8600, 18.5204],
    [73.8600, 18.5250],
    [73.8567, 18.5250],
    [73.8567, 18.5204]
  ],
  "date_t1": "2026-01-15",
  "date_t2": "2026-06-20",
  "cloud_cover_threshold": 10.0,
  "alert_email": "user@example.com",
  "threshold_change_pct": 15.0
}
```

### 2. Change Detection Result Response Schema
```json
{
  "status": "success",
  "aoi_id": "aoi_98472",
  "execution_time_ms": 1420,
  "t1_metrics": {
    "date": "2026-01-15",
    "mean_ndvi": 0.68,
    "classification": "Dense Vegetation"
  },
  "t2_metrics": {
    "date": "2026-06-20",
    "mean_ndvi": 0.32,
    "classification": "Sparse Vegetation / Cleared Soil"
  },
  "change_analysis": {
    "ndvi_delta": -0.36,
    "changed_pixels_count": 4820,
    "total_pixels": 25000,
    "changed_area_percentage": 19.28,
    "alert_triggered": true,
    "severity": "HIGH"
  }
}
```

---

## ⚙️ Quick Start

### 1. Frontend Setup (React 18 + Vite)
```bash
cd frontend
npm install
npm run dev
# -> App running at http://localhost:5173
```

### 2. Backend Setup (FastAPI)
```bash
cd backend
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env      # Add Sentinel Hub & SMTP credentials
uvicorn main:app --reload --port 8000
# -> Swagger Docs at http://localhost:8000/docs
```

---

## 📄 License
Distributed under the MIT License. See `LICENSE` for details.
