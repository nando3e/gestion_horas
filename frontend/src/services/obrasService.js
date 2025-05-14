import api from './api';

const obrasService = {
  // Obtener todas las obras
  getObras: async () => {
    const response = await api.get('/obras');
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