import api from './api';

const usuariosService = {
  // Obtener todos los usuarios
  getUsuarios: async () => {
    const response = await api.get('/usuarios');
    return response.data;
  },
  
  // Obtener un usuario específico
  getUsuario: async (id) => {
    const response = await api.get(`/usuarios/${id}`);
    return response.data;
  },
  
  // Obtener el perfil del usuario actual
  getUsuarioActual: async () => {
    const response = await api.get('/usuarios/me');
    return response.data;
  },
  
  // Crear un nuevo usuario
  createUsuario: async (usuarioData) => {
    const response = await api.post('/usuarios', usuarioData);
    return response.data;
  },
  
  // Actualizar un usuario existente
  updateUsuario: async (id, usuarioData) => {
    const response = await api.put(`/usuarios/${id}`, usuarioData);
    return response.data;
  },
  
  // Cambiar la contraseña de un usuario
  cambiarPassword: async (id, passwordData) => {
    const response = await api.post(`/usuarios/${id}/reset-password`, null, {
      params: { new_password: passwordData.password }
    });
    return response.data;
  },
  
  // Activar/desactivar un usuario
  toggleActivoUsuario: async (id, activo) => {
    const response = await api.patch(`/usuarios/${id}`, { activo });
    return response.data;
  },
  
  // Eliminar un usuario
  deleteUsuario: async (id) => {
    return await api.delete(`/usuarios/${id}`);
  }
};

export default usuariosService; 