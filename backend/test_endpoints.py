import requests
import json
from dotenv import load_dotenv
import os

# Cargar variables de entorno
load_dotenv('../.env')

# Obtener credenciales
username = os.getenv('ADMIN_USERNAME', 'Ari001')
password = os.getenv('ADMIN_PASSWORD', 'Rius2019')

print('🔐 Haciendo login...')
# Login
login_response = requests.post('http://localhost:8000/api/v1/auth/login/json', 
                              json={'username': username, 'password': password})

if login_response.status_code == 200:
    token = login_response.json()['access_token']
    headers = {'Authorization': f'Bearer {token}'}
    
    print('✅ Login exitoso')
    print('🧪 Probando endpoints...')
    
    # Probar trabajadores
    print('📋 /api/v1/trabajadores')
    resp = requests.get('http://localhost:8000/api/v1/trabajadores', headers=headers)
    print(f'   Status: {resp.status_code}')
    if resp.status_code != 200:
        print(f'   Error: {resp.text}')
    else:
        print(f'   ✅ Datos: {len(resp.json())} trabajadores')
    
    # Probar usuarios
    print('👤 /api/v1/usuarios')
    resp = requests.get('http://localhost:8000/api/v1/usuarios', headers=headers)
    print(f'   Status: {resp.status_code}')
    if resp.status_code != 200:
        print(f'   Error: {resp.text}')
    else:
        print(f'   ✅ Datos: {len(resp.json())} usuarios')
        
    # Probar obras (que funciona)
    print('🏗️ /api/v1/obras')
    resp = requests.get('http://localhost:8000/api/v1/obras', headers=headers)
    print(f'   Status: {resp.status_code}')
    if resp.status_code != 200:
        print(f'   Error: {resp.text}')
    else:
        print(f'   ✅ Datos: {len(resp.json())} obras')
        
else:
    print(f'❌ Error en login: {login_response.status_code} - {login_response.text}') 