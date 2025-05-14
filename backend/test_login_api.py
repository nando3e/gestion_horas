import requests
import os
import pathlib
from dotenv import load_dotenv
import json
import time

# Cargar variables de entorno desde .env
base_dir = pathlib.Path(__file__).parent.parent
dotenv_paths = [
    base_dir / '.env',
    pathlib.Path('.env'),
    pathlib.Path('../.env'),
]

for dotenv_path in dotenv_paths:
    if dotenv_path.exists():
        print(f"Cargando variables de entorno desde: {dotenv_path}")
        load_dotenv(dotenv_path=dotenv_path)
        break

# Obtener información del admin
ADMIN_USERNAME = os.getenv("ADMIN_USERNAME", "admin")
ADMIN_PASSWORD = os.getenv("ADMIN_PASSWORD", "admin123")

# URLs de la API a probar
api_urls = [
    "http://localhost:8000/api/v1",
    "http://127.0.0.1:8000/api/v1", 
    "http://gestion_horas-api-1:8000/api/v1"
]

for API_URL in api_urls:
    print(f"\n{'='*50}")
    print(f"Probando con URL: {API_URL}")
    print(f"{'='*50}")
    
    print(f"Intentando autenticar con:")
    print(f"- URL: {API_URL}/auth/login/json")
    print(f"- Username: {ADMIN_USERNAME}")
    print(f"- Password: {ADMIN_PASSWORD}")

    # Datos para la autenticación
    login_data = {
        "username": ADMIN_USERNAME,
        "password": ADMIN_PASSWORD
    }

    try:
        # Prueba de la conexión al endpoint de salud
        print("\n1. Probando endpoint /health...")
        try:
            health_response = requests.get(f"{API_URL}/health", timeout=5)
            print(f"Código de estado: {health_response.status_code}")
            if health_response.status_code == 200:
                print("✅ Conexión exitosa al endpoint de salud")
                try:
                    data = health_response.json()
                    print(f"Datos recibidos: {json.dumps(data, indent=2)}")
                except Exception as e:
                    print(f"Error al decodificar la respuesta: {e}")
            else:
                print("❌ Conexión fallida al endpoint de salud")
                print(f"Respuesta: {health_response.text}")
                # Si no podemos conectar al health endpoint, pasamos a la siguiente URL
                continue
        except Exception as e:
            print(f"❌ Error al hacer la solicitud: {e}")
            # Si hay error, probamos la siguiente URL
            continue
        
        # Intentar autenticación con JSON
        print("\n2. Probando endpoint /auth/login/json...")
        response = requests.post(
            f"{API_URL}/auth/login/json",
            json=login_data,
            headers={"Content-Type": "application/json"},
            timeout=5
        )
        
        print(f"Código de estado: {response.status_code}")
        if response.status_code == 200:
            print("✅ Autenticación exitosa usando /auth/login/json")
            try:
                data = response.json()
                print(f"Datos recibidos: {json.dumps(data, indent=2)}")
                print(f"Token: {data.get('access_token', 'No token')[:20]}...")
                # Validación explícita de chat_id
                assert 'chat_id' in data, 'FALTA chat_id en la respuesta del login!'
                print(f"chat_id recibido: {data['chat_id']}")
                # Si tenemos éxito, no es necesario probar más URLs
                break
            except Exception as e:
                print(f"Error al decodificar la respuesta: {e}")
        else:
            print("❌ Autenticación fallida usando /auth/login/json")
            try:
                print(f"Respuesta: {response.text}")
            except:
                print("No se pudo mostrar la respuesta")
        
        # Probar también el endpoint para formulario
        print("\n3. Probando endpoint /auth/login (form)...")
        form_response = requests.post(
            f"{API_URL}/auth/login",
            data={
                "username": ADMIN_USERNAME,
                "password": ADMIN_PASSWORD
            },
            timeout=5
        )
        
        print(f"Código de estado: {form_response.status_code}")
        if form_response.status_code == 200:
            print("✅ Autenticación exitosa usando /auth/login (form)")
            try:
                data = form_response.json()
                print(f"Datos recibidos: {json.dumps(data, indent=2)}")
                # Si tenemos éxito, no es necesario probar más URLs
                break
            except Exception as e:
                print(f"Error al decodificar la respuesta: {e}")
        else:
            print("❌ Autenticación fallida usando /auth/login (form)")
            try:
                print(f"Respuesta: {form_response.text}")
            except:
                print("No se pudo mostrar la respuesta")
            
    except Exception as e:
        print(f"❌ Error al hacer la solicitud: {e}")
    
    # Pequeña pausa antes de probar la siguiente URL
    time.sleep(1) 