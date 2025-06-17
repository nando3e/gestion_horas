import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './utils/ProtectedRoute';

// Páginas
import Login from './pages/Login/Login';
import Dashboard from './pages/Dashboard/Dashboard';
import InitialSetup from './pages/InitialSetup/InitialSetup';
import ListaHoras from './pages/Horas/ListaHoras';
import RegistrarHoras from './pages/Horas/RegistrarHoras';
import ListaUsuarios from './pages/Usuarios/ListaUsuarios';
import ListaObras from './pages/Obras/ListaObras';
import ListaPartidas from './pages/Partidas/ListaPartidas';
import ListaTrabajadores from './pages/Trabajadores/ListaTrabajadores';
import Informes from './pages/Informes/Informes';
import InformeTrabajador from './pages/Informes/InformeTrabajador';
import InformeObra from './pages/Informes/InformeObra';

// Estilos
import './App.css';

// Material UI Theme
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';

// Crear un tema personalizado que coincida con los colores de Tailwind
const theme = createTheme({
  palette: {
    primary: {
      light: '#64b5f6',
      main: '#2196f3',
      dark: '#1976d2',
      contrastText: '#fff',
    },
    secondary: {
      light: '#7986cb',
      main: '#3f51b5',
      dark: '#303f9f',
      contrastText: '#fff',
    },
    warning: {
      light: '#ffb74d',
      main: '#ff9800',
      dark: '#f57c00',
      contrastText: 'rgba(0, 0, 0, 0.87)',
    },
    background: {
      default: '#f8fafc',
    },
  },
  typography: {
    fontFamily: [
      '-apple-system',
      'BlinkMacSystemFont',
      '"Segoe UI"',
      'Roboto',
      '"Helvetica Neue"',
      'Arial',
      'sans-serif',
    ].join(','),
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          borderRadius: '0.375rem',
          fontWeight: 500,
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          borderRadius: '0.5rem',
        },
      },
    },
  },
});

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <AuthProvider>
        <Router>
          <Routes>
            {/* Rutas públicas */}
            <Route path="/login" element={<Login />} />
            <Route path="/setup" element={<InitialSetup />} />
            <Route path="/" element={<Navigate to="/dashboard" replace />} />

            {/* Rutas protegidas */}
            <Route element={<ProtectedRoute />}>
              <Route path="/dashboard" element={<Dashboard />} />
              
              {/* Rutas para horas */}
              <Route path="/horas" element={<ListaHoras />} />
              <Route path="/horas/registrar" element={<RegistrarHoras />} />
              <Route path="/horas/:id" element={<div>Detalles de Hora (Implementar)</div>} />
              <Route path="/horas/:id/editar" element={<div>Editar Hora (Implementar)</div>} />
              
              {/* Rutas solo para admin/secretaria */}
              <Route element={<ProtectedRoute adminOnly={true} />}>
                <Route path="/obras" element={<ListaObras />} />
                <Route path="/obras/nueva" element={<div>Nueva Obra (Implementar)</div>} />
                <Route path="/obras/:id" element={<div>Detalles de Obra (Implementar)</div>} />
                <Route path="/obras/:id/editar" element={<div>Editar Obra (Implementar)</div>} />
                
                <Route path="/partidas" element={<ListaPartidas />} />
                <Route path="/partidas/nueva" element={<div>Nueva Partida (Implementar)</div>} />
                <Route path="/partidas/:id" element={<div>Detalles de Partida (Implementar)</div>} />
                <Route path="/partidas/:id/editar" element={<div>Editar Partida (Implementar)</div>} />
                
                <Route path="/trabajadores" element={<ListaTrabajadores />} />
                <Route path="/trabajadores/nuevo" element={<div>Nuevo Trabajador (Implementar)</div>} />
                <Route path="/trabajadores/:id" element={<div>Detalles de Trabajador (Implementar)</div>} />
                <Route path="/trabajadores/:id/editar" element={<div>Editar Trabajador (Implementar)</div>} />
                
                <Route path="/usuarios" element={<ListaUsuarios />} />
                <Route path="/usuarios/nuevo" element={<div>Nuevo Usuario (Implementar)</div>} />
                <Route path="/usuarios/:id" element={<div>Detalles de Usuario (Implementar)</div>} />
                <Route path="/usuarios/:id/editar" element={<div>Editar Usuario (Implementar)</div>} />
                
                <Route path="/informes" element={<Informes />} />
                <Route path="/informes/trabajador" element={<InformeTrabajador />} />
                <Route path="/informes/obra" element={<InformeObra />} />
              </Route>
            </Route>

            {/* Ruta para cualquier otra URL */}
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </Router>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App; 