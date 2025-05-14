import api from './api';

const trabajadoresService = {
  // Obtener todos los trabajadores
  getTrabajadores: async () => {
    const response = await api.get('/trabajadores');
    return response.data;
  },
  
  // Obtener un trabajador específico
  getTrabajador: async (id) => {
    const response = await api.get(`/trabajadores/${id}`);
    return response.data;
  },
  
  // Crear un nuevo trabajador
  createTrabajador: async (trabajadorData) => {
    const response = await api.post('/trabajadores', trabajadorData);
    return response.data;
  },
  
  // Actualizar un trabajador
  updateTrabajador: async (id, trabajadorData) => {
    const response = await api.put(`/trabajadores/${id}`, trabajadorData);
    return response.data;
  },
  
  // Eliminar un trabajador
  deleteTrabajador: async (id) => {
    return await api.delete(`/trabajadores/${id}`);
  }
};

export default trabajadoresService; 