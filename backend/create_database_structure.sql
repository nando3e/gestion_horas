-- Script SQL para crear la estructura completa de la base de datos rius_horas
-- Generado automáticamente desde la base de datos existente

-- =====================================================
-- EXTENSIONES NECESARIAS
-- =====================================================

-- Crear extensión citext para texto insensible a mayúsculas/minúsculas
CREATE EXTENSION IF NOT EXISTS citext;

-- =====================================================
-- SECUENCIAS
-- =====================================================

-- Secuencia para tabla usuarios
CREATE SEQUENCE IF NOT EXISTS usuarios_id_seq
    START WITH 1
    INCREMENT BY 1
    MINVALUE 1
    MAXVALUE 2147483647
    CACHE 1;

-- Secuencia para tabla obras
CREATE SEQUENCE IF NOT EXISTS obras_id_obra_seq
    START WITH 1
    INCREMENT BY 1
    MINVALUE 1
    MAXVALUE 2147483647
    CACHE 1;

-- Secuencia para tabla partidas
CREATE SEQUENCE IF NOT EXISTS partidas_id_partida_seq
    START WITH 1
    INCREMENT BY 1
    MINVALUE 1
    MAXVALUE 2147483647
    CACHE 1;

-- Secuencia para tabla horas
CREATE SEQUENCE IF NOT EXISTS horas_id_movimiento_seq
    START WITH 1
    INCREMENT BY 1
    MINVALUE 1
    MAXVALUE 2147483647
    CACHE 1;

-- Secuencia para tabla notificaciones
CREATE SEQUENCE IF NOT EXISTS notificaciones_id_seq
    START WITH 1
    INCREMENT BY 1
    MINVALUE 1
    MAXVALUE 2147483647
    CACHE 1;

-- =====================================================
-- TABLAS PRINCIPALES
-- =====================================================

-- Tabla: trabajadores
-- Almacena información de los trabajadores
CREATE TABLE IF NOT EXISTS trabajadores (
    chat_id citext NOT NULL PRIMARY KEY,
    nombre citext NOT NULL
);

-- Tabla: usuarios
-- Almacena usuarios del sistema con autenticación
CREATE TABLE IF NOT EXISTS usuarios (
    id integer NOT NULL DEFAULT nextval('usuarios_id_seq'::regclass) PRIMARY KEY,
    username character varying(50) NOT NULL,
    password_hash character varying(255) NOT NULL,
    chat_id citext,
    rol character varying(20) NOT NULL DEFAULT 'trabajador'::character varying,
    ultimo_login timestamp without time zone,
    activo boolean DEFAULT true
);

-- Tabla: obras
-- Almacena información de las obras/proyectos
CREATE TABLE IF NOT EXISTS obras (
    id_obra integer NOT NULL DEFAULT nextval('obras_id_obra_seq'::regclass) PRIMARY KEY,
    nombre_obra citext NOT NULL,
    direccion_obra citext
);

-- Tabla: partidas
-- Almacena las partidas/tareas de cada obra
CREATE TABLE IF NOT EXISTS partidas (
    id_obra integer NOT NULL,
    nombre_partida citext NOT NULL,
    nombre_obra citext NOT NULL,
    acabada boolean NOT NULL DEFAULT false,
    id_partida integer NOT NULL DEFAULT nextval('partidas_id_partida_seq'::regclass) PRIMARY KEY
);

-- Tabla: horas
-- Almacena el registro de horas trabajadas
CREATE TABLE IF NOT EXISTS horas (
    id_movimiento integer NOT NULL DEFAULT nextval('horas_id_movimiento_seq'::regclass) PRIMARY KEY,
    timestamp timestamp with time zone DEFAULT now(),
    chat_id citext,
    nombre_trabajador citext NOT NULL,
    fecha date NOT NULL,
    id_obra integer,
    nombre_partida citext,
    horas_totales numeric(4,2),
    año integer,
    es_extra boolean DEFAULT false,
    tipo_extra citext,
    descripcion_extra text,
    mes citext,
    horario citext,
    id_partida integer,
    hora_inicio time without time zone,
    hora_fin time without time zone,
    es_regularizacion boolean DEFAULT false
);

-- Tabla: notificaciones
-- Almacena las notificaciones del sistema
CREATE TABLE IF NOT EXISTS notificaciones (
    id integer NOT NULL DEFAULT nextval('notificaciones_id_seq'::regclass) PRIMARY KEY,
    tipo character varying(50) NOT NULL,
    mensaje text NOT NULL,
    leida boolean DEFAULT false,
    fecha timestamp without time zone DEFAULT now(),
    id_usuario integer
);

-- =====================================================
-- CLAVES FORÁNEAS (FOREIGN KEYS)
-- =====================================================

-- FK: usuarios.chat_id -> trabajadores.chat_id
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'usuarios_chat_id_fkey') THEN
        ALTER TABLE usuarios ADD CONSTRAINT usuarios_chat_id_fkey 
        FOREIGN KEY (chat_id) REFERENCES trabajadores(chat_id);
    END IF;
END $$;

-- FK: partidas.id_obra -> obras.id_obra
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'partidas_id_obra_fkey') THEN
        ALTER TABLE partidas ADD CONSTRAINT partidas_id_obra_fkey 
        FOREIGN KEY (id_obra) REFERENCES obras(id_obra);
    END IF;
END $$;

-- FK: horas.chat_id -> trabajadores.chat_id
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'horas_chat_id_fkey') THEN
        ALTER TABLE horas ADD CONSTRAINT horas_chat_id_fkey 
        FOREIGN KEY (chat_id) REFERENCES trabajadores(chat_id);
    END IF;
END $$;

-- FK: horas.id_obra -> obras.id_obra
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'horas_id_obra_fkey') THEN
        ALTER TABLE horas ADD CONSTRAINT horas_id_obra_fkey 
        FOREIGN KEY (id_obra) REFERENCES obras(id_obra);
    END IF;
END $$;

-- FK: horas.id_partida -> partidas.id_partida
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'fk_horas_partida') THEN
        ALTER TABLE horas ADD CONSTRAINT fk_horas_partida 
        FOREIGN KEY (id_partida) REFERENCES partidas(id_partida);
    END IF;
END $$;

-- FK: notificaciones.id_usuario -> usuarios.id
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'notificaciones_id_usuario_fkey') THEN
        ALTER TABLE notificaciones ADD CONSTRAINT notificaciones_id_usuario_fkey 
        FOREIGN KEY (id_usuario) REFERENCES usuarios(id);
    END IF;
END $$;

-- =====================================================
-- ÍNDICES ADICIONALES (OPCIONALES)
-- =====================================================

-- Índice para mejorar búsquedas por username
CREATE INDEX IF NOT EXISTS idx_usuarios_username ON usuarios(username);

-- Índice para mejorar búsquedas por fecha en horas
CREATE INDEX IF NOT EXISTS idx_horas_fecha ON horas(fecha);

-- Índice para mejorar búsquedas por trabajador en horas
CREATE INDEX IF NOT EXISTS idx_horas_chat_id ON horas(chat_id);

-- Índice para mejorar búsquedas por obra en horas
CREATE INDEX IF NOT EXISTS idx_horas_id_obra ON horas(id_obra);

-- =====================================================
-- DATOS INICIALES
-- =====================================================

-- NOTA: El administrador se crea automáticamente al arrancar la aplicación
-- usando las variables de entorno o valores por defecto definidos en main.py:
-- - ADMIN_USERNAME (default: 'admin')
-- - ADMIN_PASSWORD (default: 'admin123') 
-- - ADMIN_CHAT_ID (default: 'admin_id')
-- - ADMIN_NOMBRE (default: 'Administrador')

-- =====================================================
-- COMENTARIOS FINALES
-- =====================================================

-- Script completado exitosamente
-- Todas las tablas, relaciones e índices han sido creados
-- 
-- IMPORTANTE: 
-- - El administrador se creará automáticamente al arrancar la aplicación
-- - Configura las variables de entorno antes del primer arranque si quieres
--   credenciales personalizadas, de lo contrario usará los valores por defecto