#!/bin/sh

# Procesar el template de nginx con variables de entorno
envsubst '${API_SERVICE_NAME} ${API_PORT}' < /etc/nginx/templates/nginx.conf.template > /etc/nginx/conf.d/default.conf

# Iniciar nginx
exec nginx -g 'daemon off;'
