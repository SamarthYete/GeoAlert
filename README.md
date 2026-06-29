# Geo-Alert 🛰

> **Real-time Geospatial Intelligence Dashboard** powered by Sentinel-2, NDVI analysis, and OpenCV change detection.

---

## 🔭 Overview

Geo-Alert empowers users to:
- **Draw custom AOIs** on an interactive Leaflet map
- **Monitor vegetation health** via NDVI (Sentinel-2 Band 4 & 8)
- **Detect land-use changes** using OpenCV temporal image differencing
- **Receive automatic email alerts** when changes exceed configurable thresholds
- **Analyse agriculture, forests, deserts, wetlands & strategic zones**

---

## 🏗 Architecture

```
frontend/          ← React + Vite + Leaflet + Recharts
backend/           ← FastAPI + NumPy + OpenCV + sentinelhub
```

---

## 🚀 Quick Start

### Frontend (React)
```bash
cd frontend
npm install
npm run dev
# → http://localhost:5173
```

### Backend (FastAPI)
```bash
cd backend
pip install -r requirements.txt
cp .env.example .env    # Fill in your API keys
uvicorn main:app --reload --port 8000
# → http://localhost:8000/docs
```

---

## 🛰 Satellite Integration

Geo-Alert uses the **ESA Copernicus Sentinel-2 L2A** dataset:
- **Band B4 (Red)** + **Band B8 (NIR)** → NDVI calculation
- Access via **Sentinel Hub** or **Copernicus Data Space (CDSE)**
- Resolution: **10 metres per pixel**

---

## 🌿 NDVI Formula

```
NDVI = (NIR - RED) / (NIR + RED)
```

| Range | Meaning |
|-------|---------|
| 0.7–1.0 | Dense healthy vegetation |
| 0.5–0.7 | Moderate vegetation |
| 0.3–0.5 | Sparse vegetation |
| 0.1–0.3  | Bare soil / very sparse |
| < 0.1 | Water / desert / built-up |

---

## 🔬 Change Detection Pipeline

1. **Fetch** Sentinel-2 imagery for T1 (before) and T2 (after)
2. **Compute NDVI** for both timestamps
3. **Pixel-wise difference**: `Δ NDVI = NDVI_after - NDVI_before`
4. **Threshold** (default ±0.10): flag changed pixels
5. **OpenCV morphological** cleaning (remove noise)  
6. **Classify severity**: Critical / Warning / Info
7. **Trigger email** if configured threshold exceeded

---

## 📧 Email Alerts

Configure `SMTP_HOST`, `SMTP_USER`, `SMTP_PASS` in `.env` and alerts are sent automatically when critical changes are detected.

---

## 🗺 Use Cases

| Domain | Example |
|--------|---------|
| 🌾 Agriculture | Crop stress, pest infestation detection |
| 🌳 Deforestation | Forest canopy reduction monitoring |
| 🏜️ Desertification | Sand migration, barren land expansion |
| 🌊 Disaster Response | Flood/fire extent mapping |
| 🛡️ Defence Surveillance | Structural change detection in strategic zones |

---

## 📦 Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18, Vite 7, Leaflet.js, Recharts |
| Backend | FastAPI, Python 3.11, NumPy |
| Imagery | Sentinel-2 L2A (ESA Copernicus) |
| Processing | OpenCV, NumPy NDVI kernel |
| Alerts | SMTP email (configurable) |
| Maps | Leaflet + CartoDB Dark tiles |

---

*Geo-Alert — Global Perspective*
