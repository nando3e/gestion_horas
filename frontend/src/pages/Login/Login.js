import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';
import { 
  Box, 
  Container, 
  Paper, 
  Typography, 
  TextField, 
  Button, 
  Alert, 
  CircularProgress,
  InputAdornment,
  IconButton
} from '@mui/material';
import { FaUserAlt, FaLock, FaEye, FaEyeSlash, FaTools } from 'react-icons/fa';

const Login = () => {
  const [credentials, setCredentials] = useState({
    username: '',
    password: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [needsSetup, setNeedsSetup] = useState(false);
  const [checkingSetup, setCheckingSetup] = useState(true);
  const { login } = useAuth();
  const navigate = useNavigate();

  // Verificar si hay usuarios en la base de datos
  useEffect(() => {
    const checkIfSetupNeeded = async () => {
      try {
        // Intentamos hacer un ping simple al API
        await api.get('/health');
        
        // Ahora verificamos si hay al menos un usuario
        try {
          // Esta petición podría fallar si no hay usuarios, eso es normal
          await api.post('/auth/login/json', {
            username: '_check_setup_',
            password: '_check_setup_'
          });
          // Si llegamos aquí, significa que se procesó la petición (puede que con error)
          setNeedsSetup(false);
        } catch (error) {
          // Si el error es 404 (No encontrado) o similar, es posible que necesitemos setup
          if (error.response?.status === 404 || error.response?.data?.detail?.includes('No existe')) {
            setNeedsSetup(true);
          }
        }
      } catch (error) {
        console.error('Error al verificar la configuración inicial:', error);
        // Si hay un error al conectar con el API, asumimos que no necesita setup
        setNeedsSetup(false);
      } finally {
        setCheckingSetup(false);
      }
    };

    checkIfSetupNeeded();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setCredentials(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      await login(credentials);
      navigate('/dashboard');
    } catch (error) {
      console.error('Error al iniciar sesión:', error);
      setError(error.response?.data?.detail || 'Error al iniciar sesión. Verifica tus credenciales.');
    } finally {
      setLoading(false);
    }
  };

  const toggleShowPassword = () => {
    setShowPassword(!showPassword);
  };

  if (checkingSetup) {
    return (
      <Box className="flex items-center justify-center min-h-screen bg-gradient-to-br from-primary-100 to-blue-50">
        <Paper elevation={3} className="p-8 flex flex-col items-center">
          <Typography variant="h5" className="mb-4">Verificando configuración...</Typography>
          <CircularProgress color="primary" />
        </Paper>
      </Box>
    );
  }

  return (
    <Box className="flex items-center justify-center min-h-screen bg-gradient-to-br from-primary-100 to-blue-50">
      <Container maxWidth="sm" className="py-10">
        <Paper elevation={4} className="p-6 md:p-8 rounded-xl">
          <Box className="text-center mb-6">
            <Typography variant="h4" component="h1" className="font-bold text-primary-700">
              Gestión de Horas
            </Typography>
            <Typography variant="subtitle1" className="text-gray-600 mt-2">
              Inicia sesión para continuar
            </Typography>
          </Box>
          
          {error && (
            <Alert severity="error" className="mb-4">
              {error}
            </Alert>
          )}
          
          {needsSetup ? (
            <Box className="bg-blue-50 p-4 rounded-lg border border-blue-200">
              <Box className="flex items-center gap-2 text-blue-700 mb-2">
                <FaTools size={20} />
                <Typography variant="h6">Configuración inicial</Typography>
              </Box>
              <Typography variant="body1" className="mb-4 text-gray-700">
                Parece que es la primera vez que usas la aplicación.
                Necesitas configurar un usuario administrador para comenzar.
              </Typography>
              <Button
                component={Link}
                to="/setup"
                variant="contained"
                color="primary"
                fullWidth
                className="mt-2 py-2.5"
              >
                Configurar aplicación
              </Button>
            </Box>
          ) : (
            <Box component="form" onSubmit={handleSubmit} className="space-y-4">
              <TextField
                fullWidth
                label="Usuario"
                name="username"
                value={credentials.username}
                onChange={handleChange}
                required
                autoComplete="username"
                disabled={loading}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <FaUserAlt className="text-gray-500" />
                    </InputAdornment>
                  ),
                }}
              />
              
              <TextField
                fullWidth
                label="Contraseña"
                type={showPassword ? 'text' : 'password'}
                name="password"
                value={credentials.password}
                onChange={handleChange}
                required
                autoComplete="current-password"
                disabled={loading}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <FaLock className="text-gray-500" />
                    </InputAdornment>
                  ),
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        aria-label="toggle password visibility"
                        onClick={toggleShowPassword}
                        edge="end"
                      >
                        {showPassword ? <FaEyeSlash /> : <FaEye />}
                      </IconButton>
                    </InputAdornment>
                  )
                }}
              />
              
              <Button
                type="submit"
                fullWidth
                variant="contained"
                color="primary"
                disabled={loading}
                className="py-3 mt-6"
              >
                {loading ? (
                  <Box className="flex items-center gap-2">
                    <CircularProgress size={20} color="inherit" />
                    <span>Iniciando sesión...</span>
                  </Box>
                ) : 'Iniciar Sesión'}
              </Button>
            </Box>
          )}
        </Paper>
        
        <Typography variant="body2" className="text-center mt-6 text-gray-600">
          &copy; {new Date().getFullYear()} - Sistema de Gestión de Horas
        </Typography>
      </Container>
    </Box>
  );
};

export default Login; 