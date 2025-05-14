import api from './api';

const partidasService = {
  // Obtener todas las partidas
  getPartidas: async (params = {}) => {
    const response = await api.get('/partidas/', { params });
    return response.data;
  },
  
  // Obtener partidas por obra
  getPartidasPorObra: async (idObra) => {
    const response = await api.get('/partidas/', {
      params: { id_obra: idObra }
    });
    return response.data;
  },
  
  // Obtener una partida específica
  getPartida: async (id) => {
    const response = await api.get(`/partidas/${id}/`);
    return response.data;
  },
  
  // Crear una nueva partida
  createPartida: async (partidaData) => {
    const response = await api.post('/partidas/', partidaData);
    return response.data;
  },
  
  // Actualizar una partida
  updatePartida: async (id, partidaData) => {
    const response = await api.put(`/partidas/${id}/`, partidaData);
    return response.data;
  },
  
  // Eliminar una partida
  deletePartida: async (id) => {
    return await api.delete(`/partidas/${id}/`);
  }
};

export default partidasService; 