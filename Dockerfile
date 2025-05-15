# Imagen base para multi-etapa
FROM node:18-alpine AS frontend-builder

# Establecer directorio de trabajo para el frontend
WORKDIR /app/frontend

# Copiar los archivos de configuración del frontend
COPY frontend/package.json frontend/package-lock.json ./

# Instalar dependencias del frontend
RUN npm install

# Copiar el resto de los archivos del frontend
COPY frontend/ ./

# Construir el frontend
RUN npm run build

# Etapa para el backend
FROM python:3.11-slim

# Establecer variables de entorno para Python
ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1

# Crear directorio para la aplicación
WORKDIR /app

# Copiar los archivos estáticos del frontend a una carpeta que el backend pueda servir
COPY --from=frontend-builder /app/frontend/build /app/static

# Instalar dependencias del backend
COPY backend/requirements.txt /app/
RUN pip install --no-cache-dir -r requirements.txt

# Copiar el código del backend
COPY backend/ /app/

# Exponer puerto para el backend
EXPOSE 8000

# Comando para iniciar la aplicación
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"] 