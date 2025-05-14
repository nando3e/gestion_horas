import api from './api';

const authService = {
  // Iniciar sesión
  login: async (credentials) => {
    const response = await api.post('/auth/login/json', credentials);
    
    if (response.data.access_token) {
      // Guardar información de usuario y token en localStorage
      localStorage.setItem('token', response.data.access_token);
      localStorage.setItem('user', JSON.stringify({
        id: response.data.user_id,
        username: response.data.username,
        rol: response.data.rol,
        chat_id: response.data.chat_id
      }));
    }
    
    return response.data;
  },
  
  // Cerrar sesión
  logout: () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  },
  
  // Registrar usuario (solo para desarrollo)
  register: async (userData) => {
    return await api.post('/auth/register', userData);
  },
  
  // Obtener usuario actual
  getCurrentUser: () => {
    const user = localStorage.getItem('user');
    return user ? JSON.parse(user) : null;
  },
  
  // Verificar si el usuario está autenticado
  isAuthenticated: () => {
    return !!localStorage.getItem('token');
  },
  
  // Verificar si el usuario es admin o secretaria
  isAdmin: () => {
    const user = authService.getCurrentUser();
    return user && (user.rol === 'admin' || user.rol === 'secretaria');
  },
  
  // Verificar si el usuario es trabajador
  isTrabajador: () => {
    const user = authService.getCurrentUser();
    return user && user.rol === 'trabajador';
  }
};

export default authService; 