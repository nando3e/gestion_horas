from passlib.context import CryptContext

pwd_context = CryptContext(schemes=['bcrypt'], deprecated='auto')

# Generar hash para Rius2019
password = 'Rius2019'
hash_generado = pwd_context.hash(password)

print("=" * 60)
print(f"Contraseña: {password}")
print(f"Hash generado: {hash_generado}")
print("=" * 60)
print()
print("SQL para actualizar la BD:")
print(f"UPDATE usuarios SET password_hash = '{hash_generado}' WHERE username = 'Ari001';")
print()
print("Verificación del hash (debe ser True):")
print(f"¿Hash válido? {pwd_context.verify(password, hash_generado)}")
