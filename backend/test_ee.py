import httpx
import asyncio

async def test_ee():
    async with httpx.AsyncClient() as client:
        # Pass a bbox over some region, e.g., a city
        bbox = [77.1000, 28.6000, 77.2000, 28.7000] # Delhi roughly
        start_date = "2023-01-01"
        end_date = "2023-12-31"
        
        try:
            res = await client.post("http://localhost:8000/api/v1/ee/urban", json={
                "bbox": bbox,
                "start_date": start_date,
                "end_date": end_date
            })
            print(res.status_code)
            print(res.json())
        except Exception as e:
            import traceback
            traceback.print_exc()

if __name__ == "__main__":
    asyncio.run(test_ee())
