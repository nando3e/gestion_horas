@echo off
SETLOCAL EnableDelayedExpansion

REM Configuración por defecto
SET TAG=latest
SET DOCKER_USERNAME=
SET BUILD_ONLY=false

REM Obtener usuario de Docker si está disponible
FOR /F "tokens=2 delims=:" %%a IN ('docker info ^| findstr Username') DO (
    SET DOCKER_USERNAME=%%a
    SET DOCKER_USERNAME=!DOCKER_USERNAME: =!
)

REM Procesar argumentos
:PROCESS_ARGS
IF "%~1"=="" GOTO CONTINUE
IF "%~1"=="-h" (
    GOTO HELP
) ELSE IF "%~1"=="--help" (
    GOTO HELP
) ELSE IF "%~1"=="-u" (
    SET DOCKER_USERNAME=%~2
    SHIFT
) ELSE IF "%~1"=="--username" (
    SET DOCKER_USERNAME=%~2
    SHIFT
) ELSE IF "%~1"=="-t" (
    SET TAG=%~2
    SHIFT
) ELSE IF "%~1"=="--tag" (
    SET TAG=%~2
    SHIFT
) ELSE IF "%~1"=="-b" (
    SET BUILD_ONLY=true
) ELSE IF "%~1"=="--build-only" (
    SET BUILD_ONLY=true
) ELSE (
    ECHO Opción desconocida: %~1
    EXIT /B 1
)
SHIFT
GOTO PROCESS_ARGS

:HELP
ECHO Uso: %0 [OPCIONES]
ECHO Construye y publica imágenes Docker para la aplicación de Gestión de Horas.
ECHO.
ECHO Opciones:
ECHO   -u, --username USERNAME    Nombre de usuario de Docker Hub
ECHO   -t, --tag TAG              Etiqueta para las imágenes (por defecto: latest)
ECHO   -b, --build-only           Solo construir, no publicar
ECHO   -h, --help                 Mostrar esta ayuda
EXIT /B 0

:CONTINUE
REM Verificar si se proporcionó nombre de usuario
IF "%DOCKER_USERNAME%"=="" (
    ECHO ERROR: No se pudo determinar el nombre de usuario de Docker Hub.
    ECHO Por favor, proporciona un nombre de usuario con -u o --username.
    EXIT /B 1
)

ECHO 🔧 Construyendo imágenes con etiqueta: %TAG%
ECHO 👤 Usuario de Docker Hub: %DOCKER_USERNAME%

REM Exportar variables para docker-compose
SET "DOCKER_USERNAME=%DOCKER_USERNAME%"
SET "TAG=%TAG%"

REM Construir las imágenes
ECHO 🏗️ Construyendo imágenes...
docker-compose -f docker-compose.build.yml build

REM Si solo queremos construir, terminamos aquí
IF "%BUILD_ONLY%"=="true" (
    ECHO ✅ Imágenes construidas correctamente:
    ECHO    - %DOCKER_USERNAME%/gestion-horas-api:%TAG%
    ECHO    - %DOCKER_USERNAME%/gestion-horas-frontend:%TAG%
    EXIT /B 0
)

REM Iniciar sesión en Docker Hub si es necesario
ECHO 🔑 Iniciando sesión en Docker Hub...
docker login

REM Publicar las imágenes
ECHO 🚀 Publicando imágenes en Docker Hub...
docker push %DOCKER_USERNAME%/gestion-horas-api:%TAG%
docker push %DOCKER_USERNAME%/gestion-horas-frontend:%TAG%

ECHO ✅ Proceso completado. Imágenes publicadas:
ECHO    - %DOCKER_USERNAME%/gestion-horas-api:%TAG%
ECHO    - %DOCKER_USERNAME%/gestion-horas-frontend:%TAG%

ENDLOCAL 