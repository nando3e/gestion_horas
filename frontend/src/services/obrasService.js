import api from './api';

const obrasService = {
  // Obtener obras. params admite { estado: 'activa' | 'completada' | 'cancelada' }
  getObras: async (params = {}) => {
    const response = await api.get('/obras', { params });
    return response.data;
  },

  // Obtener solo las obras activas (las que se ofrecen a los trabajadores al fichar)
  getObrasActivas: async () => {
    const response = await api.get('/obras', { params: { estado: 'activa' } });
    return response.data;
  },
  
  // Obtener una obra específica
  getObra: async (id) => {
    const response = await api.get(`/obras/${id}`);
    return response.data;
  },
  
  // Crear una nueva obra
  createObra: async (obraData) => {
    const response = await api.post('/obras', obraData);
    return response.data;
  },
  
  // Actualizar una obra
  updateObra: async (id, obraData) => {
    const response = await api.put(`/obras/${id}`, obraData);
    return response.data;
  },
  
  // Eliminar una obra
  deleteObra: async (id) => {
    return await api.delete(`/obras/${id}`);
  }
};

export default obrasService; 