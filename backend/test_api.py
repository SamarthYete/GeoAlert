"""Quick test script to debug the analysis endpoint."""
import httpx
import json

url = "http://localhost:8000/analysis/detect"
body = {
    "bbox": [76.72, 30.68, 76.84, 30.78],
    "start_date": "2025-12-01",
    "end_date": "2026-03-01",
    "aoi_name": "Punjab Test",
}

r = httpx.post(url, json=body, timeout=120)
print(f"Status: {r.status_code}")
data = r.json()
print(json.dumps(data, indent=2))
