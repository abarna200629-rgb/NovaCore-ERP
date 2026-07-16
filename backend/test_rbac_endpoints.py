import requests
import mysql.connector

base_url = "http://localhost:8080"

def get_db_connection():
    return mysql.connector.connect(
        host="localhost",
        user="root",
        password="kannaki",
        database="erp_db"
    )

def execute_query(query, params=(), fetchone=False):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute(query, params)
    res = None
    if fetchone:
        res = cursor.fetchone()
    conn.commit()
    cursor.close()
    conn.close()
    return res

def test_user_flow(username, password):
    print(f"\n--- Testing flow for user: {username} ---")
    
    # 1. Login
    r_login = requests.post(f"{base_url}/api/auth/login", json={"username": username, "password": password})
    if r_login.status_code != 200:
        print("Login Request Failed:", r_login.status_code, r_login.text)
        return
    
    # 2. Get OTP from DB
    otp = execute_query("SELECT otp FROM users WHERE username = %s", (username,), fetchone=True)[0]
    print("Retrieved OTP from DB:", otp)
    
    # 3. Verify OTP
    r_verify = requests.post(f"{base_url}/api/auth/verify-otp", json={"username": username, "otp": str(otp)})
    if r_verify.status_code != 200:
        print("OTP Verification Failed:", r_verify.status_code, r_verify.text)
        return
    
    token = r_verify.json().get("token")
    role = r_verify.json().get("role")
    print(f"Login Successful! Token length: {len(token)}, Role: {role}")
    
    # 4. Check protected endpoints that a normal employee can access on their dashboard
    headers = {"Authorization": f"Bearer {token}"}
    
    endpoints = [
        "/api/hr/leaves",
        "/api/employees",
        "/api/notifications",
        "/api/dashboard"
      ]
      
    for ep in endpoints:
        r_ep = requests.get(f"{base_url}{ep}", headers=headers)
        print(f"GET {ep} -> Status: {r_ep.status_code}")
        if r_ep.status_code == 403:
            print("Access Denied (403 Forbidden)")
        elif r_ep.status_code == 200:
            print("Success (200 OK)")
        else:
            print(f"Response: {r_ep.text[:100]}")

# Test with employee_user
test_user_flow("employee_user", "admin123")
