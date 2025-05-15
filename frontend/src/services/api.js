import axios from 'axios';

// Centralizar la lógica de la URL base de la API
const ENV = process.env.ENVIRONMENT;
const API_URL =
  ENV === 'local'
    ? process.env.REACT_APP_API_URL_LOCAL || 'http://localhost:8000/api/v1'
    : process.env.REACT_APP_API_URL_PROD || '/api/v1';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor para agregar el token a todas las peticiones
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);



//////////
// Interceptor para manejar respuestas y errores
api.interceptors.response.use(
  (response) => {
    // Si la respuesta es exitosa, simplemente la retornamos
    return response;
  },
  (error) => {
    // Verificamos si el error tiene una respuesta y un estado
    if (error.response && error.response.status === 401) {
      const originalRequestUrl = error.config.url || ''; // URL de la petición original
      const isOnLoginPage = window.location.pathname === '/login'; // ¿Estamos ya en /login?
      const isLoginAttempt = originalRequestUrl.includes('/auth/login'); // ¿Fue un intento de login?

      // Solo limpiar localStorage y redirigir a /login si:
      // 1. El error 401 NO vino de un intento de login.
      // 2. Y NO estamos ya en la página de /login.
      if (!isLoginAttempt && !isOnLoginPage) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        
        // NOTA: Para una mejor experiencia de usuario en Single Page Applications,
        // es preferible usar el sistema de enrutamiento de React (ej. useNavigate de React Router)
        // en lugar de window.location.href, ya que esto último causa una recarga completa de la página.
        // Por ejemplo, si usas React Router y tienes acceso al 'navigate':
        // navigate('/login');
        // Por ahora, mantendremos window.location.href según el código original,
        // pero tenlo en cuenta para futuras mejoras.
        window.location.href = '/login';
      } else if (isLoginAttempt) {
        // Si fue un intento de login que resultó en 401,
        // solo limpiamos el localStorage (por si acaso, aunque no debería haber nada si el login falló)
        // y permitimos que la promesa sea rechazada.
        // El componente de Login debería capturar este error y mostrar un mensaje al usuario.
        localStorage.removeItem('token');
        localStorage.removeItem('user');
      }
      // Si ya estamos en /login y ocurre otro 401 (que no sea de un intento de login),
      // no hacemos nada aquí para evitar bucles, solo propagamos el error.
    }
    // Es crucial propagar el error para que pueda ser manejado por
    // el código que hizo la llamada original (ej. un .catch() en el servicio o componente).
    return Promise.reject(error);
  }
);

//////////

export default api; 