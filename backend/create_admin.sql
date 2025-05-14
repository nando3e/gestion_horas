-- Primero insertar el trabajador si no existe
INSERT INTO trabajadores (chat_id, nombre)
SELECT 'admin_id', 'Administrador'
WHERE NOT EXISTS (SELECT 1 FROM trabajadores WHERE chat_id = 'admin_id');

-- Luego insertar el usuario administrador si no existe
INSERT INTO usuarios (username, password_hash, chat_id, rol, activo)
SELECT 'admin', '$2b$12$EixZaYVK1fsbw1ZfbX3OXePaWxn96p36WQoeG6Lruj3vjPGga31lW', 'admin_id', 'admin', TRUE
WHERE NOT EXISTS (SELECT 1 FROM usuarios WHERE username = 'admin');

-- Nota: La contraseña hash corresponde a 'admin123' 