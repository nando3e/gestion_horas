from datetime import datetime, timedelta
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session

from app.db.database import get_db
from app.core.auth import verify_password, create_access_token, get_password_hash, get_current_active_user
from app.models.usuarios import Usuario
from app.schemas.usuarios import Token, LoginCredentials, UsuarioCreate, Usuario as UsuarioSchema
from app.core.environment import ACCESS_TOKEN_EXPIRE_MINUTES

router = APIRouter()

@router.post("/login", response_model=Token)
async def login_access_token(
    form_data: OAuth2PasswordRequestForm = Depends(),
    db: Session = Depends(get_db)
):
    """
    Obtener token de acceso JWT mediante OAuth2 con nombre de usuario y contraseña
    """
    # Buscar el usuario en la base de datos
    user = db.query(Usuario).filter(Usuario.username == form_data.username).first()
    
    # Verificar que el usuario existe y la contraseña es correcta
    if not user or not verify_password(form_data.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Nombre de usuario o contraseña incorrectos",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    # Verificar que el usuario está activo
    if not user.activo:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Usuario inactivo"
        )
    
    # Actualizar el último login
    user.ultimo_login = datetime.now()
    db.commit()
    
    # Generar token de acceso
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    
    token_data = {
        "sub": user.username,
        "id": user.id,
        "rol": user.rol
    }
    
    access_token = create_access_token(
        data=token_data, expires_delta=access_token_expires
    )
    
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user_id": user.id,
        "username": user.username,
        "rol": user.rol,
        "chat_id": user.chat_id
    }

@router.post("/login/json", response_model=Token)
async def login_json(
    credentials: LoginCredentials,
    db: Session = Depends(get_db)
):
    """
    Obtener token de acceso JWT mediante JSON con nombre de usuario y contraseña
    """
    # Usar el mismo formato de forma_data para reutilizar la lógica
    form_data = OAuth2PasswordRequestForm(
        username=credentials.username,
        password=credentials.password,
        scope=""
    )
    
    return await login_access_token(form_data, db)

@router.get("/me", response_model=UsuarioSchema)
async def get_current_user(
    current_user: Usuario = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """
    Obtener información del usuario autenticado actualmente
    """
    # Obtener el usuario completo de la base de datos para asegurar los datos más actualizados
    db_user = db.query(Usuario).filter(Usuario.id == current_user.id).first()
    if not db_user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Usuario no encontrado"
        )
    return db_user

@router.post("/register", response_model=UsuarioSchema)
async def register_user(
    user_data: UsuarioCreate,
    db: Session = Depends(get_db)
):
    """
    Registrar un nuevo usuario (solo para desarrollo, en producción debería estar protegido)
    """
    # Verificar si el usuario ya existe
    existing_user = db.query(Usuario).filter(Usuario.username == user_data.username).first()
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="El nombre de usuario ya está en uso"
        )
    
    # Crear nuevo usuario
    hashed_password = get_password_hash(user_data.password)
    
    new_user = Usuario(
        username=user_data.username,
        password_hash=hashed_password,
        chat_id=user_data.chat_id,
        rol=user_data.rol
    )
    
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    
    return new_user 