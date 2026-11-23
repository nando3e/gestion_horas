from sqlalchemy import Boolean, Column, String, true
from sqlalchemy.dialects.postgresql import CITEXT
from app.db.database import Base

class Trabajador(Base):
    """Modelo para la tabla trabajadores"""
    __tablename__ = "trabajadores"
    
    chat_id = Column(CITEXT, primary_key=True, index=True)
    nombre = Column(CITEXT, nullable=False)
    # False = oculto: no se ofrece en los desplegables, pero conserva sus horas
    activo = Column(Boolean, nullable=False, server_default=true(), default=True)

    @property
    def usuario_desactivado(self) -> bool:
        """True si tiene usuario de login y ninguno está activo."""
        return bool(self.usuario) and not any(u.activo for u in self.usuario)
