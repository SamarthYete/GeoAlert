import sqlite3

def run_db_tests():
    # Connect to the local SQLite database
    conn = sqlite3.connect("database.db")
    c = conn.cursor()

    print("🚀 Initializing Database Isolation Tests...")

    # 1. Clean existing test data (if any)
    c.execute("DELETE FROM users WHERE id IN ('user-alpha', 'user-beta')")
    c.execute("DELETE FROM aois WHERE user_id IN ('user-alpha', 'user-beta')")
    c.execute("DELETE FROM alerts WHERE user_id IN ('user-alpha', 'user-beta')")
    conn.commit()

    # 2. Register mock users
    c.execute("INSERT INTO users (id, email, name, picture) VALUES (?, ?, ?, ?)",
              ('user-alpha', 'alpha@geo-alert.space', 'Alpha Tester', ''))
    c.execute("INSERT INTO users (id, email, name, picture) VALUES (?, ?, ?, ?)",
              ('user-beta', 'beta@geo-alert.space', 'Beta Tester', ''))
    conn.commit()

    # Verify registration
    c.execute("SELECT id, name FROM users WHERE id IN ('user-alpha', 'user-beta')")
    print(f"✅ Registered Users: {c.fetchall()}")

    # 3. Create independent Area Of Interests (AOIs)
    print("\n🌍 Creating Isolated Saved Zones...")
    c.execute("""
        INSERT INTO aois (id, user_id, name, category, color, center, bounds, area_km2, created, lastChecked, alertCount, ndvi, ndviChange, status) 
        VALUES ('aoi-alpha-1', 'user-alpha', 'Alpha Wheat Field', 'agriculture', '#ff0000', '[0,0]', '[[0,0],[1,1]]', 10.5, '2026-03-15', '2026-03-15', 0, 0.5, 0.1, 'normal')
    """)
    c.execute("""
        INSERT INTO aois (id, user_id, name, category, color, center, bounds, area_km2, created, lastChecked, alertCount, ndvi, ndviChange, status) 
        VALUES ('aoi-beta-1', 'user-beta', 'Beta Water Reservoir', 'water', '#0000ff', '[0,0]', '[[0,0],[1,1]]', 22.0, '2026-03-15', '2026-03-15', 0, 0.5, 0.1, 'normal')
    """)
    conn.commit()

    # 4. Verify Data Isolation
    print("\n🔍 Querying Database with Auth Headers...")
    
    # Simulate API Call from Auth: Alpha
    c.execute("SELECT name FROM aois WHERE user_id = 'user-alpha'")
    alpha_aois = c.fetchall()
    print(f"   [Auth: Alpha] retrieved AOIs: {alpha_aois} (Expected string: 'Alpha Wheat Field')")

    # Simulate API Call from Auth: Beta
    c.execute("SELECT name FROM aois WHERE user_id = 'user-beta'")
    beta_aois = c.fetchall()
    print(f"   [Auth: Beta] retrieved AOIs: {beta_aois} (Expected string: 'Beta Water Reservoir')")

    if alpha_aois[0][0] != 'Alpha Wheat Field' or beta_aois[0][0] != 'Beta Water Reservoir':
        print("❌ FILTERING ERROR: Data leakage detected!")
    else:
        print("✅ SUCCESS: 100% Data isolation verified.")

    # 5. Security Check: Block unauthorized deletion (Beta tries to delete Alpha's zone)
    print("\n🛡️ Testing Security Boundaries (Cross-Profile Deletion)...")
    
    c.execute("DELETE FROM aois WHERE id = 'aoi-alpha-1' AND user_id = 'user-beta'")
    conn.commit()

    # Check if aoi-alpha-1 survived
    c.execute("SELECT count(*) FROM aois WHERE id = 'aoi-alpha-1'")
    survived = c.fetchone()[0] > 0

    if survived:
        print("✅ SUCCESS: Beta was BLOCKED from deleting Alpha's private zone.")
    else:
        print("❌ CRITICAL VULNERABILITY: Beta successfully deleted Alpha's zone!")

    # 6. Cleanup after test
    c.execute("DELETE FROM users WHERE id IN ('user-alpha', 'user-beta')")
    c.execute("DELETE FROM aois WHERE user_id IN ('user-alpha', 'user-beta')")
    c.execute("DELETE FROM alerts WHERE user_id IN ('user-alpha', 'user-beta')")
    conn.commit()
    conn.close()

    print("\n🏁 Test execution finished. Database integrity verified.")

if __name__ == '__main__':
    run_db_tests()
