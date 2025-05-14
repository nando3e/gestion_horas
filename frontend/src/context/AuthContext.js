import React, { createContext, useState, useEffect, useContext } from 'react';
import authService from '../services/authService';

// Crear el contexto
const AuthContext = createContext();

// Proveedor del contexto
export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Cargar usuario al iniciar la aplicación
  useEffect(() => {
    const initAuth = () => {
      try {
        const currentUser = authService.getCurrentUser();
        if (currentUser) {
          setUser(currentUser);
        }
      } catch (error) {
        console.error('Error al inicializar la autenticación:', error);
        authService.logout();
      } finally {
        setLoading(false);
      }
    };

    initAuth();
  }, []);

  // Función para iniciar sesión
  const login = async (credentials) => {
    setError(null);
    try {
      const data = await authService.login(credentials);
      setUser({
        id: data.user_id,
        username: data.username,
        rol: data.rol
      });
      return data;
    } catch (error) {
      setError(error.response?.data?.detail || 'Error al iniciar sesión');
      throw error;
    }
  };

  // Función para cerrar sesión
  const logout = () => {
    authService.logout();
    setUser(null);
  };

  // Verificar si el usuario tiene permisos de admin
  const isAdmin = () => {
    return user && (user.rol === 'admin' || user.rol === 'secretaria');
  };

  // Objeto con los valores que se expondrán en el contexto
  const value = {
    user,
    loading,
    error,
    isAuthenticated: !!user,
    isAdmin,
    login,
    logout
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

// Hook para usar el contexto de autenticación
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth debe usarse dentro de un AuthProvider');
  }
  return context;
};

export default AuthContext; 