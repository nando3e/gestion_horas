import requests
import json

# URL del endpoint (ajusta según tu configuración)
base_url = "http://localhost:8000"  # Cambia por la URL de tu API
login_url = f"{base_url}/api/v1/auth/login/json"

# Credenciales a probar
credentials_to_test = [
    {"username": "Ari001", "password": "Rius2019"},
    {"username": "Ari001", "password": "admin123"},
    {"username": "admin", "password": "admin123"},
    {"username": "admin", "password": "Rius2019"},
]

print("🔍 Probando login con diferentes credenciales:")
print(f"Endpoint: {login_url}")
print()

for i, creds in enumerate(credentials_to_test, 1):
    print(f"Intento {i}: {creds['username']} / {creds['password']}")
    
    try:
        response = requests.post(login_url, json=creds, timeout=10)
        
        print(f"  Status: {response.status_code}")
        
        if response.status_code == 200:
            user_data = response.json()
            print(f"  ✅ LOGIN EXITOSO!")
            print(f"  Username: {user_data.get('username')}")
            print(f"  Rol: {user_data.get('rol')}")
            print(f"  Chat ID: {user_data.get('chat_id')}")
        else:
            print(f"  ❌ Error: {response.text}")
            
    except requests.exceptions.RequestException as e:
        print(f"  ❌ Error de conexión: {e}")
    
    print()

# También probar el health check
print("🔍 Probando health check:")
try:
    health_response = requests.get(f"{base_url}/api/v1/health", timeout=5)
    print(f"Health check: {health_response.status_code} - {health_response.text}")
except Exception as e:
    print(f"Error en health check: {e}")
