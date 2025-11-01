# Etapa de construcción
FROM node:18-alpine as build

# Argumentos que se pueden pasar durante el build (ej. desde docker-compose)
ARG REACT_APP_API_URL_PROD
ARG ENVIRONMENT
ARG REACT_APP_API_URL_LOCAL

# Establecer las variables de entorno DENTRO de esta etapa de build
# para que estén disponibles durante 'npm run build'
ENV REACT_APP_API_URL_PROD=${REACT_APP_API_URL_PROD}
ENV ENVIRONMENT=${ENVIRONMENT}
ENV REACT_APP_API_URL_LOCAL=${REACT_APP_API_URL_LOCAL}

WORKDIR /app

# Copiar solo package.json y package-lock.json primero para aprovechar el caché de Docker
COPY frontend/package.json frontend/package-lock.json ./

# Instalar dependencias
RUN npm ci

# Copiar el resto de los archivos de la aplicación
COPY frontend/ .

# Construir la aplicación React.
# REACT_APP_API_URL_PROD estará disponible aquí gracias al ENV anterior.
RUN npm run build

# Etapa de producción - usando nginx para servir contenido estático
FROM nginx:alpine

# Instalar envsubst (viene con gettext)
RUN apk add --no-cache gettext

# Copiar los archivos construidos desde la etapa de 'build' a la carpeta de Nginx
COPY --from=build /app/build /usr/share/nginx/html

# Crear directorio para templates de nginx
RUN mkdir -p /etc/nginx/templates

# Copiar el template de configuración de Nginx
COPY frontend/nginx.conf.template /etc/nginx/templates/

# Copiar el script de entrada
COPY frontend/docker-entrypoint.sh /docker-entrypoint.sh
RUN chmod +x /docker-entrypoint.sh

# Variables de entorno por defecto (pueden ser sobrescritas)
ENV API_SERVICE_NAME=api
ENV API_PORT=8000

# Exponer el puerto 80 (Nginx escucha en este puerto por defecto)
EXPOSE 80

# Usar nuestro script de entrada personalizado
CMD ["/docker-entrypoint.sh"]