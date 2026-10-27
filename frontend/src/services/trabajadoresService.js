import api from './api';

const trabajadoresService = {
  // Obtener trabajadores. params admite { activo: true | false }
  getTrabajadores: async (params = {}) => {
    const response = await api.get('/trabajadores', { params });
    return response.data;
  },

  // Solo trabajadores activos (sin usuario desactivado): para desplegables de horas e informes
  getTrabajadoresActivos: async () => {
    const response = await api.get('/trabajadores', { params: { activo: true } });
    return response.data;
  },
  
  // Obtener un trabajador específico
  getTrabajador: async (chat_id) => {
    const response = await api.get(`/trabajadores/${chat_id}`);
    return response.data;
  },
  
  // Crear un nuevo trabajador
  createTrabajador: async (trabajadorData) => {
    const response = await api.post('/trabajadores', trabajadorData);
    return response.data;
  },
  
  // Actualizar un trabajador
  updateTrabajador: async (chat_id, trabajadorData) => {
    const response = await api.put(`/trabajadores/${chat_id}`, trabajadorData);
    return response.data;
  },
  
  // Eliminar un trabajador
  deleteTrabajador: async (chat_id) => {
    return await api.delete(`/trabajadores/${chat_id}`);
  }
};

export default trabajadoresService; 