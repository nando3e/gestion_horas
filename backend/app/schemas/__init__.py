# Inicialización del paquete schemas

# Importamos todos los schemas en un orden que evite problemas
from .usuarios import *
from .trabajadores import *
from .obras import *
from .partidas import *
from .horas import *

# No es necesario usar update_forward_refs() ya que estamos
# usando Any para evitar las referencias circulares 