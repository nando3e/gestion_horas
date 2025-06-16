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
COPY package.json package-lock.json ./

# Instalar dependencias
RUN npm ci

# Copiar el resto de los archivos de la aplicación
COPY . .

# Construir la aplicación React.
# REACT_APP_API_URL_PROD estará disponible aquí gracias al ENV anterior.
RUN npm run build

# Etapa de producción - usando nginx para servir contenido estático
FROM nginx:alpine

# Copiar los archivos construidos desde la etapa de 'build' a la carpeta de Nginx
COPY --from=build /app/build /usr/share/nginx/html

# Eliminar la configuración por defecto de Nginx
RUN rm /etc/nginx/conf.d/default.conf

# Copiar tu archivo de configuración personalizado de Nginx.
# Este archivo 'nginx.conf' debe existir en el mismo directorio que este Dockerfile.
COPY nginx.conf /etc/nginx/conf.d/

# Exponer el puerto 80 (Nginx escucha en este puerto por defecto)
EXPOSE 80

# El comando CMD para iniciar Nginx está implícito en la imagen base de nginx:alpine
# y se ejecutará automáticamente.