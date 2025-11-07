# Script PowerShell para Windows

Write-Host "🔽 Descargando imágenes de Docker Hub..." -ForegroundColor Cyan
docker pull fbermudez3e/gestion-horas-api:latest
docker pull fbermudez3e/gestion-horas-frontend:latest

Write-Host ""
Write-Host "📦 Extrayendo código del backend..." -ForegroundColor Cyan

# Crear contenedor temporal del backend
$containerBackend = docker create fbermudez3e/gestion-horas-api:latest

# Crear directorio temporal para backup actual
New-Item -ItemType Directory -Force -Path "_backup_antes_restore" | Out-Null
Write-Host "💾 Haciendo backup de archivos actuales en _backup_antes_restore/..." -ForegroundColor Yellow
Copy-Item -Path "backend" -Destination "_backup_antes_restore\backend" -Recurse -Force -ErrorAction SilentlyContinue

# Extraer todo el contenido del backend
Write-Host "📥 Extrayendo archivos del backend desde la imagen..." -ForegroundColor Cyan
docker cp "${containerBackend}:/app" ./backend_restored

# Mover archivos restaurados sobre los actuales
Write-Host "🔄 Sobrescribiendo archivos del backend..." -ForegroundColor Cyan
Remove-Item -Path "backend\*" -Recurse -Force -ErrorAction SilentlyContinue
Copy-Item -Path "backend_restored\*" -Destination "backend\" -Recurse -Force
Remove-Item -Path "backend_restored" -Recurse -Force

# Limpiar contenedor temporal
docker rm $containerBackend

Write-Host ""
Write-Host "📦 Extrayendo código del frontend..." -ForegroundColor Cyan

# Crear contenedor temporal del frontend
$containerFrontend = docker create fbermudez3e/gestion-horas-frontend:latest

# Backup del frontend actual
Copy-Item -Path "frontend" -Destination "_backup_antes_restore\frontend" -Recurse -Force -ErrorAction SilentlyContinue

# Extraer contenido del frontend (build compilado)
Write-Host "📥 Extrayendo archivos del frontend desde la imagen..." -ForegroundColor Cyan
docker cp "${containerFrontend}:/usr/share/nginx/html" ./frontend_build_restored 2>$null
docker cp "${containerFrontend}:/app" ./frontend_source_restored 2>$null

# Limpiar contenedor temporal
docker rm $containerFrontend

Write-Host ""
Write-Host "✅ Restauración completada!" -ForegroundColor Green
Write-Host "📁 Backup de archivos anteriores guardado en: _backup_antes_restore/" -ForegroundColor Yellow
Write-Host ""
Write-Host "⚠️  NOTA: El frontend solo contiene el build compilado." -ForegroundColor Red
Write-Host "   Para obtener el código fuente, necesitarías usar git o tener un backup." -ForegroundColor Red


