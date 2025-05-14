import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

// Componente para proteger rutas que requieren autenticación
const ProtectedRoute = ({ adminOnly = false }) => {
  const { isAuthenticated, isAdmin, loading } = useAuth();

  // Mientras se carga, mostrar un indicador de carga
  if (loading) {
    return <div className="loading">Cargando...</div>;
  }

  // Si no está autenticado, redirigir al login
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // Si la ruta requiere ser admin y el usuario no lo es, redirigir al dashboard
  if (adminOnly && !isAdmin()) {
    return <Navigate to="/dashboard" replace />;
  }

  // Si pasa todas las verificaciones, mostrar el contenido de la ruta
  return <Outlet />;
};

export default ProtectedRoute; 