from passlib.context import CryptContext

pwd_context = CryptContext(schemes=['bcrypt'], deprecated='auto')

# Hash almacenado en la BD
stored_hash = '$2b$12$JM96aPrdjdNegSqm/ITMh.j1/PoDk6EgjJ36teE/cvfaMd03YyZaW'

# Contraseñas a probar
passwords_to_test = ['Rius2019', 'admin123', 'Ari001', 'rius2019', 'RIUS2019']

print("🔍 Verificando contraseñas contra el hash almacenado:")
print(f"Hash: {stored_hash}")
print()

for password in passwords_to_test:
    is_valid = pwd_context.verify(password, stored_hash)
    status = "✅ VÁLIDA" if is_valid else "❌ INVÁLIDA"
    print(f"Contraseña '{password}': {status}")

print()
print("🔧 Generando nuevo hash para 'admin123':")
new_hash = pwd_context.hash('admin123')
print(f"Nuevo hash: {new_hash}")
