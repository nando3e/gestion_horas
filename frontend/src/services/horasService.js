import api from './api';

const horasService = {
  // Obtener horas con filtros
  getHoras: async (filtros = {}) => {
    // Convertir filtros a query string
    const queryString = Object.keys(filtros)
      .map(key => `${key}=${filtros[key]}`)
      .join('&');
    
    const response = await api.get(`/horas${queryString ? `?${queryString}` : ''}`);
    return response.data;
  },
  
  // Obtener información del usuario actual, incluyendo chat_id
  getUserInfo: async () => {
    const response = await api.get('/auth/me');
    return response.data;
  },
  
  // Obtener horas del día de hoy para el usuario autenticado
  getHorasHoy: async () => {
    const today = new Date().toISOString().split('T')[0];
    const response = await api.get(`/horas?fecha=${today}`);
    return response.data;
  },
  
  // Obtener horas de un mes específico
  getHorasMes: async (año, mes) => {
    const response = await api.get('/horas/mes/', {
      params: { año, mes }
    });
    return response.data;
  },
  
  // Obtener resumen mensual
  getResumenMensual: async (año, mes) => {
    const response = await api.get('/horas/resumen-mensual/', {
      params: { año, mes }
    });
    return response.data;
  },
  
  // Obtener una hora específica
  getHora: async (id) => {
    const response = await api.get(`/horas/${id}/`);
    return response.data;
  },
  
  // Crear un nuevo registro de horas
  createHora: async (horaData) => {
    const response = await api.post('/horas/', horaData);
    return response.data;
  },
  
  // Actualizar un registro de horas
  updateHora: async (id, horaData) => {
    const response = await api.put(`/horas/${id}/`, horaData);
    return response.data;
  },
  
  // Eliminar un registro de horas
  deleteHora: async (id) => {
    return await api.delete(`/horas/${id}/`);
  }
};

export default horasService; 