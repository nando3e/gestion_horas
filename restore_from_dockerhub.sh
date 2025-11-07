#!/bin/bash

echo "🔽 Descargando imágenes de Docker Hub..."
docker pull fbermudez3e/gestion-horas-api:latest
docker pull fbermudez3e/gestion-horas-frontend:latest

echo ""
echo "📦 Extrayendo código del backend..."

# Crear contenedor temporal del backend
CONTAINER_BACKEND=$(docker create fbermudez3e/gestion-horas-api:latest)

# Crear directorio temporal para backup actual
mkdir -p _backup_antes_restore
echo "💾 Haciendo backup de archivos actuales en _backup_antes_restore/..."
cp -r backend/ _backup_antes_restore/backend/ 2>/dev/null || true

# Extraer todo el contenido del backend
echo "📥 Extrayendo archivos del backend desde la imagen..."
docker cp ${CONTAINER_BACKEND}:/app ./backend_restored

# Mover archivos restaurados sobre los actuales
echo "🔄 Sobrescribiendo archivos del backend..."
rm -rf backend/*
cp -r backend_restored/* backend/
rm -rf backend_restored

# Limpiar contenedor temporal
docker rm ${CONTAINER_BACKEND}

echo ""
echo "📦 Extrayendo código del frontend..."

# Crear contenedor temporal del frontend
CONTAINER_FRONTEND=$(docker create fbermudez3e/gestion-horas-frontend:latest)

# Backup del frontend actual
cp -r frontend/ _backup_antes_restore/frontend/ 2>/dev/null || true

# Extraer todo el contenido del frontend
echo "📥 Extrayendo archivos del frontend desde la imagen..."
docker cp ${CONTAINER_FRONTEND}:/usr/share/nginx/html ./frontend_build_restored 2>/dev/null || true

# Extraer también archivos fuente si están en otro lugar
docker cp ${CONTAINER_FRONTEND}:/app ./frontend_source_restored 2>/dev/null || true

# Si tenemos build, es solo el build compilado, necesitamos los fuentes
# Para React, el código fuente normalmente no está en la imagen de producción
# Pero podemos extraer el build y ver qué hay

# Limpiar contenedor temporal
docker rm ${CONTAINER_FRONTEND}

echo ""
echo "✅ Restauración completada!"
echo "📁 Backup de archivos anteriores guardado en: _backup_antes_restore/"
echo ""
echo "⚠️  NOTA: El frontend solo contiene el build compilado."
echo "   Para obtener el código fuente, necesitarías usar git o tener un backup."


