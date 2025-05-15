import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Layout from '../../components/Layout/Layout';
import { useAuth } from '../../context/AuthContext';
import horasService from '../../services/horasService';
import obrasService from '../../services/obrasService';
import partidasService from '../../services/partidasService';
import { 
  Box, 
  Typography, 
  Grid, 
  Card, 
  CardContent, 
  Button, 
  Divider, 
  List, 
  ListItem, 
  ListItemIcon, 
  ListItemText, 
  Paper,
  CircularProgress,
  Alert,
  Chip,
  Avatar
} from '@mui/material';
import {
  FaClock,
  FaCalendarAlt,
  FaUserClock,
  FaBuilding,
  FaTasks,
  FaUsers,
  FaUsersCog,
  FaChartBar
} from 'react-icons/fa';
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';
import { Doughnut } from 'react-chartjs-2';

// Registramos los elementos de Chart.js
ChartJS.register(ArcElement, Tooltip, Legend);

// Componente simplificado para perfil de trabajador
const TrabajadorDashboard = ({ user }) => {
  return (
    <Grid container spacing={3}>
      <Grid item xs={12} md={6}>
        {/* Tarjeta para registrar horas */}
        <Card elevation={2} className="h-full">
          <CardContent className="flex flex-col items-center p-6">
            <FaClock className="text-5xl text-primary-600 mb-4" />
            <Typography variant="h5" className="font-bold mb-3 text-center">
              Registrar Horas
            </Typography>
            <Typography variant="body1" className="text-gray-600 mb-4 text-center">
              Registra tus horas de trabajo diarias. Puedes añadir horas regulares y extras.
            </Typography>
            <Button
              component={Link}
              to="/horas/registrar"
              variant="contained"
              color="primary"
              size="large"
              fullWidth
            >
              Ir a Registrar Horas
            </Button>
          </CardContent>
        </Card>
      </Grid>
      
      <Grid item xs={12} md={6}>
        {/* Tarjeta para ver mis horas */}
        <Card elevation={2} className="h-full">
          <CardContent className="flex flex-col items-center p-6">
            <FaCalendarAlt className="text-5xl text-secondary-600 mb-4" />
            <Typography variant="h5" className="font-bold mb-3 text-center">
              Ver Mis Horas
            </Typography>
            <Typography variant="body1" className="text-gray-600 mb-4 text-center">
              Consulta todas tus horas registradas. Puedes filtrar por mes y año.
            </Typography>
            <Button
              component={Link}
              to="/horas"
              variant="contained"
              color="secondary"
              size="large"
              fullWidth
            >
              Ir a Mis Horas
            </Button>
          </CardContent>
        </Card>
      </Grid>
    </Grid>
  );
};

const Dashboard = () => {
  const { user } = useAuth();
  const [horasHoy, setHorasHoy] = useState([]);
  const [horasStats, setHorasStats] = useState({ total: 0, extras: 0 });
  const [obras, setObras] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        // Cargar horas del día actual
        const horasData = await horasService.getHorasHoy();
        setHorasHoy(horasData);

        // Calcular estadísticas de horas (ejemplo)
        const totalHours = horasData.reduce((acc, hora) => acc + parseFloat(hora.horas_totales || 0), 0);
        const extrasHours = horasData.filter(h => h.es_extra).reduce(
          (acc, hora) => acc + parseFloat(hora.horas_totales || 0), 
          0
        );
        setHorasStats({ 
          total: totalHours, 
          extras: extrasHours,
          regular: totalHours - extrasHours
        });

        // Cargar lista de obras (solo para admin/secretaria)
        if (user.rol === 'admin' || user.rol === 'secretaria') {
          const obrasData = await obrasService.getObras();
          setObras(obrasData);
        }
      } catch (error) {
        console.error('Error al cargar datos del dashboard:', error);
        setError('Error al cargar los datos. Por favor, inténtalo de nuevo.');
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, [user.rol]);

  // Datos para el gráfico de donut
  const chartData = {
    labels: ['Horas Regulares', 'Horas Extra'],
    datasets: [
      {
        data: [horasStats.regular || 0, horasStats.extras || 0],
        backgroundColor: ['#1976d2', '#ff9800'],
        borderColor: ['#1565c0', '#fb8c00'],
        borderWidth: 1,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom',
      },
    },
  };

  // Formatear fecha para mostrar
  const formatDate = (dateString) => {
    const options = { year: 'numeric', month: 'long', day: 'numeric' };
    return new Date(dateString).toLocaleDateString('es-ES', options);
  };

  if (loading) {
    return (
      <Layout>
        <Box className="flex items-center justify-center h-full py-20">
          <CircularProgress color="primary" />
        </Box>
      </Layout>
    );
  }

  return (
    <Layout>
      <Box className="pb-6">
        <Box className="mb-6">
          <Typography variant="h4" component="h1" className="font-bold text-gray-800">
            Dashboard
          </Typography>
          <Typography variant="subtitle1" className="text-gray-600 mt-1">
            Bienvenido, {user.username} ({user.rol})
          </Typography>
        </Box>

        {error && (
          <Alert severity="error" className="mb-6">
            {error}
          </Alert>
        )}

        {/* Dashboard simplificado para trabajadores */}
        {user.rol === 'trabajador' ? (
          <TrabajadorDashboard user={user} />
        ) : (
          <Grid container spacing={3}>
            {/* Tarjeta de resumen */}
            <Grid item xs={12} md={6} lg={4}>
              <Card elevation={2} className="h-full">
                <CardContent>
                  <Box className="flex items-center mb-4">
                    <FaCalendarAlt className="text-primary-600 text-2xl mr-2" />
                    <Typography variant="h6" className="font-semibold">
                      Resumen del día
                    </Typography>
                  </Box>
                  
                  <Box className="grid grid-cols-2 gap-4 mb-4">
                    <Paper className="p-4 bg-primary-50 rounded-lg flex flex-col items-center">
                      <Typography variant="subtitle2" className="text-primary-700 mb-1">
                        Horas Totales
                      </Typography>
                      <Typography variant="h4" className="font-bold text-primary-800">
                        {horasStats.total.toFixed(1)}
                      </Typography>
                    </Paper>
                    
                    <Paper className="p-4 bg-orange-50 rounded-lg flex flex-col items-center">
                      <Typography variant="subtitle2" className="text-orange-700 mb-1">
                        Horas Extra
                      </Typography>
                      <Typography variant="h4" className="font-bold text-orange-800">
                        {horasStats.extras.toFixed(1)}
                      </Typography>
                    </Paper>
                  </Box>
                  
                  <Box className="h-48 mb-4">
                    <Doughnut data={chartData} options={chartOptions} />
                  </Box>
                  
                  <Box className="flex justify-center mt-2">
                    <Button 
                      component={Link} 
                      to="/horas/registrar" 
                      variant="contained" 
                      color="primary"
                      startIcon={<FaClock />}
                      className="mr-2"
                    >
                      Registrar Horas
                    </Button>
                    <Button 
                      component={Link} 
                      to="/horas" 
                      variant="outlined" 
                      color="primary"
                    >
                      Ver Mis Horas
                    </Button>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
            
            {/* Tarjeta de registros de hoy */}
            <Grid item xs={12} md={6} lg={8}>
              <Card elevation={2} className="h-full">
                <CardContent>
                  <Box className="flex items-center justify-between mb-4">
                    <Box className="flex items-center">
                      <FaUserClock className="text-primary-600 text-2xl mr-2" />
                      <Typography variant="h6" className="font-semibold">
                        Registros de Hoy
                      </Typography>
                    </Box>
                    <Chip 
                      label={formatDate(new Date())} 
                      color="primary" 
                      variant="outlined" 
                      size="small"
                    />
                  </Box>
                  
                  <Divider className="mb-3" />
                  
                  {horasHoy.length > 0 ? (
                    <List className="divide-y">
                      {horasHoy.map((hora) => (
                        <ListItem key={hora.id_movimiento} className="py-3">
                          <Box className="w-full">
                            <Box className="flex justify-between items-center mb-1">
                              <Box className="flex items-center">
                                <Avatar className="bg-primary-100 text-primary-700 w-8 h-8 mr-2">
                                  {hora.nombre_trabajador.charAt(0).toUpperCase()}
                                </Avatar>
                                <Typography variant="subtitle1" className="font-medium">
                                  {hora.nombre_trabajador}
                                </Typography>
                              </Box>
                              <Chip 
                                label={`${hora.horas_totales} h`} 
                                color={hora.es_extra ? "warning" : "primary"}
                                size="small"
                              />
                            </Box>
                            
                            <Box className="grid grid-cols-2 gap-2 text-gray-600 text-sm ml-10">
                              <Box className="flex items-center">
                                <FaBuilding className="mr-1 text-gray-500" size={12} />
                                <Typography variant="body2">
                                  {hora.nombre_obra || 'Sin obra asignada'}
                                </Typography>
                              </Box>
                              <Box className="flex items-center">
                                <FaTasks className="mr-1 text-gray-500" size={12} />
                                <Typography variant="body2">
                                  {hora.nombre_partida || 'Sin partida asignada'}
                                </Typography>
                              </Box>
                            </Box>
                            
                            {hora.es_extra && (
                              <Box className="ml-10 mt-1">
                                <Chip 
                                  label={hora.tipo_extra || 'Extra'} 
                                  size="small" 
                                  className="text-xs" 
                                  color="warning"
                                  variant="outlined"
                                />
                                {hora.descripcion_extra && (
                                  <Typography variant="caption" className="block mt-1 ml-1 text-gray-500">
                                    {hora.descripcion_extra}
                                  </Typography>
                                )}
                              </Box>
                            )}
                          </Box>
                        </ListItem>
                      ))}
                    </List>
                  ) : (
                    <Box className="py-10 text-center text-gray-500">
                      <Typography variant="body1">
                        No hay registros de horas para hoy.
                      </Typography>
                      <Button
                        component={Link}
                        to="/horas/registrar"
                        variant="outlined"
                        color="primary"
                        className="mt-4"
                      >
                        Registrar Horas
                      </Button>
                    </Box>
                  )}
                </CardContent>
              </Card>
            </Grid>
            
            {/* Tarjeta de administración (solo para admin/secretaria) */}
            {(user.rol === 'admin' || user.rol === 'secretaria') && (
              <Grid item xs={12}>
                <Card elevation={2}>
                  <CardContent>
                    <Box className="flex items-center mb-4">
                      <FaUsersCog className="text-primary-600 text-2xl mr-2" />
                      <Typography variant="h6" className="font-semibold">
                        Administración
                      </Typography>
                    </Box>
                    
                    <Divider className="mb-4" />
                    
                    <Grid container spacing={2}>
                      <Grid item xs={12} sm={6} md={4} lg={2}>
                        <Paper 
                          className="p-4 text-center hover:shadow-md transition-shadow cursor-pointer h-full"
                          component={Link}
                          to="/obras"
                        >
                          <FaBuilding className="text-3xl mx-auto mb-2 text-blue-600" />
                          <Typography variant="subtitle1" className="font-medium">
                            Obras
                          </Typography>
                          <Chip 
                            label={obras.length} 
                            size="small" 
                            color="primary" 
                            className="mt-2"
                          />
                        </Paper>
                      </Grid>
                      
                      <Grid item xs={12} sm={6} md={4} lg={2}>
                        <Paper 
                          className="p-4 text-center hover:shadow-md transition-shadow cursor-pointer h-full"
                          component={Link}
                          to="/partidas"
                        >
                          <FaTasks className="text-3xl mx-auto mb-2 text-green-600" />
                          <Typography variant="subtitle1" className="font-medium">
                            Partidas
                          </Typography>
                        </Paper>
                      </Grid>
                      
                      <Grid item xs={12} sm={6} md={4} lg={2}>
                        <Paper 
                          className="p-4 text-center hover:shadow-md transition-shadow cursor-pointer h-full"
                          component={Link}
                          to="/trabajadores"
                        >
                          <FaUsers className="text-3xl mx-auto mb-2 text-amber-600" />
                          <Typography variant="subtitle1" className="font-medium">
                            Trabajadores
                          </Typography>
                        </Paper>
                      </Grid>
                      
                      <Grid item xs={12} sm={6} md={4} lg={2}>
                        <Paper 
                          className="p-4 text-center hover:shadow-md transition-shadow cursor-pointer h-full"
                          component={Link}
                          to="/usuarios"
                        >
                          <FaUsersCog className="text-3xl mx-auto mb-2 text-purple-600" />
                          <Typography variant="subtitle1" className="font-medium">
                            Usuarios
                          </Typography>
                        </Paper>
                      </Grid>
                      
                      <Grid item xs={12} sm={6} md={4} lg={2}>
                        <Paper 
                          className="p-4 text-center hover:shadow-md transition-shadow cursor-pointer h-full"
                          component={Link}
                          to="/informes"
                        >
                          <FaChartBar className="text-3xl mx-auto mb-2 text-red-600" />
                          <Typography variant="subtitle1" className="font-medium">
                            Informes
                          </Typography>
                        </Paper>
                      </Grid>
                    </Grid>
                  </CardContent>
                </Card>
              </Grid>
            )}
          </Grid>
        )}
      </Box>
    </Layout>
  );
};

export default Dashboard; 