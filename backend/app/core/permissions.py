from fastapi import Depends, HTTPException, status
from app.models.usuarios import Usuario
from app.core.auth import get_current_active_user

def check_role(allowed_roles: list):
    """Verifica que el rol del usuario esté dentro de los permitidos"""
    async def verify_role(current_user: Usuario = Depends(get_current_active_user)):
        if current_user.rol not in allowed_roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="No tienes permisos para realizar esta acción"
            )
        return current_user
    return verify_role

# Dependencias para verificar roles
get_current_admin_user = check_role(["admin"])
get_current_secretaria_user = check_role(["admin", "secretaria"])
get_current_trabajador_user = check_role(["admin", "secretaria", "trabajador"]) 