#!/bin/bash

# Configuración por defecto
TAG="latest"
DOCKER_USERNAME=$(docker info | grep Username | cut -d: -f2 | tr -d '[:space:]')

# Mostrar ayuda si se solicita
if [ "$1" == "-h" ] || [ "$1" == "--help" ]; then
    echo "Uso: $0 [OPCIONES]"
    echo "Construye y publica imágenes Docker para la aplicación de Gestión de Horas."
    echo ""
    echo "Opciones:"
    echo "  -u, --username USERNAME    Nombre de usuario de Docker Hub (por defecto: usuario actual)"
    echo "  -t, --tag TAG              Etiqueta para las imágenes (por defecto: latest)"
    echo "  -b, --build-only           Solo construir, no publicar"
    echo "  -h, --help                 Mostrar esta ayuda"
    exit 0
fi

# Procesar argumentos
BUILD_ONLY=false
while [[ $# -gt 0 ]]; do
    case $1 in
        -u|--username)
            DOCKER_USERNAME="$2"
            shift 2
            ;;
        -t|--tag)
            TAG="$2"
            shift 2
            ;;
        -b|--build-only)
            BUILD_ONLY=true
            shift
            ;;
        *)
            echo "Opción desconocida: $1"
            exit 1
            ;;
    esac
done

# Verificar si se proporcionó nombre de usuario
if [ -z "$DOCKER_USERNAME" ]; then
    echo "ERROR: No se pudo determinar el nombre de usuario de Docker Hub."
    echo "Por favor, proporciona un nombre de usuario con -u o --username."
    exit 1
fi

echo "🔧 Construyendo imágenes con etiqueta: $TAG"
echo "👤 Usuario de Docker Hub: $DOCKER_USERNAME"

# Exportar variables para docker-compose
export DOCKER_USERNAME
export TAG

# Construir las imágenes
echo "🏗️ Construyendo imágenes..."
docker-compose -f docker-compose.build.yml build

# Si solo queremos construir, terminamos aquí
if [ "$BUILD_ONLY" = true ]; then
    echo "✅ Imágenes construidas correctamente:"
    echo "   - $DOCKER_USERNAME/gestion-horas-api:$TAG"
    echo "   - $DOCKER_USERNAME/gestion-horas-frontend:$TAG"
    exit 0
fi

# Iniciar sesión en Docker Hub si es necesario
echo "🔑 Iniciando sesión en Docker Hub..."
docker login

# Publicar las imágenes
echo "🚀 Publicando imágenes en Docker Hub..."
docker push $DOCKER_USERNAME/gestion-horas-api:$TAG
docker push $DOCKER_USERNAME/gestion-horas-frontend:$TAG

echo "✅ Proceso completado. Imágenes publicadas:"
echo "   - $DOCKER_USERNAME/gestion-horas-api:$TAG"
echo "   - $DOCKER_USERNAME/gestion-horas-frontend:$TAG" 