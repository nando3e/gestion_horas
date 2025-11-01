import api from './api';

const horasService = {
  // Obtener horas con filtros
  getHoras: async (filtros = {}) => {
    try {
      // Crear un objeto URLSearchParams para construir correctamente la query
      const params = new URLSearchParams();
      
      // Añadir cada filtro al objeto de params
      Object.entries(filtros).forEach(([key, value]) => {
        if (value !== null && value !== undefined && value !== '') {
          params.append(key, value);
        }
      });
      
      // Convertir a string de consulta
      const queryString = params.toString();
      
      // Realizar la petición con el query string
      const response = await api.get(`/horas${queryString ? `?${queryString}` : ''}`);
      return response.data;
    } catch (error) {
      console.error('Error al obtener horas:', error);
      throw error;
    }
  },
  
  // Obtener información del usuario actual, incluyendo chat_id
  getUserInfo: async () => {
    const response = await api.get('/auth/me');
    return response.data;
  },
  
  // Obtener horas del día de hoy para el usuario autenticado
  getHorasHoy: async () => {
    const hoy = new Date();
    const today = `${hoy.getFullYear()}-${(hoy.getMonth() + 1).toString().padStart(2, '0')}-${hoy.getDate().toString().padStart(2, '0')}`;
    const response = await api.get(`/horas?fecha=${today}`);
    return response.data;
  },
  
  // Obtener horas de un mes específico
  getHorasMes: async (año, mes) => {
    // Calcular fechas de inicio y fin del mes (evitando problemas de zona horaria)
    const inicioMes = new Date(año, mes, 1);
    const primerDia = `${inicioMes.getFullYear()}-${(inicioMes.getMonth() + 1).toString().padStart(2, '0')}-${inicioMes.getDate().toString().padStart(2, '0')}`;
    
    const finMes = new Date(año, mes + 1, 0);
    const ultimoDia = `${finMes.getFullYear()}-${(finMes.getMonth() + 1).toString().padStart(2, '0')}-${finMes.getDate().toString().padStart(2, '0')}`;
    
    const params = new URLSearchParams();
    params.append('fecha_inicio', primerDia);
    params.append('fecha_fin', ultimoDia);
    
    const response = await api.get(`/horas?${params.toString()}`);
    return response.data;
  },
  
  // Obtener resumen mensual
  getResumenMensual: async (año, mes) => {
    const params = new URLSearchParams();
    params.append('año', año);
    params.append('mes', mes);
    
    const response = await api.get(`/horas/resumen-mensual?${params.toString()}`);
    return response.data;
  },
  
  // Obtener una hora específica
  getHora: async (id) => {
    const response = await api.get(`/horas/${id}`);
    return response.data;
  },
  
  // Crear un nuevo registro de horas
  createHora: async (horaData) => {
    const response = await api.post('/horas', horaData);
    return response.data;
  },

  // Crear múltiples registros de horas (tramos) en lote
  createHorasLote: async (horasDataArray) => {
    const response = await api.post('/horas/lote', horasDataArray);
    return response.data;
  },
  
  // Actualizar un registro de horas
  updateHora: async (id, horaData) => {
    const response = await api.put(`/horas/${id}`, horaData);
    return response.data;
  },
  
  // Eliminar un registro de horas
  deleteHora: async (id) => {
    return await api.delete(`/horas/${id}`);
  }
};

export default horasService; 