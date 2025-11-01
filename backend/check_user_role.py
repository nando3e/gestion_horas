import requests
import json
from dotenv import load_dotenv
import os

load_dotenv('../.env')
username = os.getenv('ADMIN_USERNAME', 'Ari001')
password = os.getenv('ADMIN_PASSWORD', 'Rius2019')

login_response = requests.post('http://localhost:8000/api/v1/auth/login/json', 
                              json={'username': username, 'password': password})

if login_response.status_code == 200:
    user_data = login_response.json()
    print('🔍 Información del usuario:')
    print(f'   Username: {user_data["username"]}')
    print(f'   Rol: {user_data["rol"]}')
    print(f'   Chat ID: {user_data["chat_id"]}')
    print(f'   User ID: {user_data["user_id"]}')
else:
    print(f'❌ Error: {login_response.status_code} - {login_response.text}')