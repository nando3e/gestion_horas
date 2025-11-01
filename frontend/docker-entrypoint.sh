#!/bin/sh

# Establecer valores por defecto si no están definidos
export API_SERVICE_NAME=${API_SERVICE_NAME:-api}
export API_PORT=${API_PORT:-8000}

echo "Configurando nginx con API_SERVICE_NAME=${API_SERVICE_NAME} y API_PORT=${API_PORT}"

# Intentar procesar el template de nginx con variables de entorno
if [ -f /etc/nginx/templates/nginx.conf.template ]; then
  envsubst '${API_SERVICE_NAME} ${API_PORT}' < /etc/nginx/templates/nginx.conf.template > /etc/nginx/conf.d/default.conf
  echo "✅ Configuración creada desde template"
else
  # Si no existe el template, usar el backup
  if [ -f /etc/nginx/conf.d/nginx.conf.backup ]; then
    cp /etc/nginx/conf.d/nginx.conf.backup /etc/nginx/conf.d/default.conf
    echo "✅ Configuración creada desde backup"
  else
    echo "❌ ERROR: No se encontró ni template ni backup de configuración"
    exit 1
  fi
fi

# Verificar que el archivo se creó correctamente
if [ ! -f /etc/nginx/conf.d/default.conf ]; then
  echo "❌ ERROR: No se pudo crear el archivo de configuración de nginx"
  exit 1
fi

# Verificar la sintaxis de nginx antes de iniciar
nginx -t
if [ $? -ne 0 ]; then
  echo "❌ ERROR: La configuración de nginx tiene errores de sintaxis"
  exit 1
fi

echo "✅ Configuración de nginx válida, iniciando servidor..."

# Iniciar nginx
exec nginx -g 'daemon off;'
