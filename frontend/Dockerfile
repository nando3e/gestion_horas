# Etapa de construcción
FROM node:18-alpine as build

WORKDIR /app

# Instalar dependencias
COPY package.json ./
RUN npm install

# Copiar el resto de los archivos y construir
COPY . .
RUN npm run build

# Etapa de producción - usando un servidor web más ligero
FROM node:18-alpine

WORKDIR /app

# Instalar serve para servir contenido estático
RUN npm install -g serve

# Copiar archivos de construcción
COPY --from=build /app/build .

# Exponer puerto 
EXPOSE 80

# Comando para iniciar serve
CMD ["serve", "-s", ".", "-l", "80"] 