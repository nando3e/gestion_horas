import React from 'react';
import { Link } from 'react-router-dom';
import Layout from '../../components/Layout/Layout';
import {
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  CardActionArea,
  Paper
} from '@mui/material';
import {
  FaUser,
  FaBuilding,
  FaTasks,
  FaClock
} from 'react-icons/fa';

const Informes = () => {
  const informes = [
    {
      title: 'Por Trabajador',
      description: 'Informe detallado de horas por trabajador, agrupado por días',
      icon: <FaUser className="text-4xl text-primary-600" />,
      path: '/informes/trabajador',
      available: true
    },
    {
      title: 'Por Obra',
      description: 'Horas totales por partida en el período seleccionado',
      icon: <FaBuilding className="text-4xl text-primary-600" />,
      path: '/informes/obra',
      available: true
    },
    {
      title: 'Por Partida',
      description: 'Desglose detallado de horas por partida',
      icon: <FaTasks className="text-4xl text-gray-400" />,
      path: '/informes/partida',
      available: false
    },
    {
      title: 'Horas Extra',
      description: 'Análisis de horas extra por trabajador y período',
      icon: <FaClock className="text-4xl text-gray-400" />,
      path: '/informes/extras',
      available: false
    }
  ];

  return (
    <Layout>
      <Box className="pb-6">
        <Box className="mb-6">
          <Typography variant="h4" component="h1" className="font-bold text-gray-800">
            Informes
          </Typography>
          <Typography variant="subtitle1" className="text-gray-600 mt-1">
            Selecciona el tipo de informe que deseas generar
          </Typography>
        </Box>

        <Grid container spacing={3}>
          {informes.map((informe) => (
            <Grid item xs={12} sm={6} md={4} key={informe.title}>
              <Card 
                elevation={2} 
                className={`h-full ${!informe.available ? 'opacity-50' : 'hover:shadow-lg transition-shadow'}`}
              >
                {informe.available ? (
                  <CardActionArea 
                    component={Link} 
                    to={informe.path}
                    className="h-full"
                  >
                    <CardContent className="text-center p-6">
                      <Box className="mb-4 flex justify-center">
                        {informe.icon}
                      </Box>
                      <Typography variant="h6" component="h2" className="font-semibold mb-2">
                        {informe.title}
                      </Typography>
                      <Typography variant="body2" className="text-gray-600">
                        {informe.description}
                      </Typography>
                    </CardContent>
                  </CardActionArea>
                ) : (
                  <CardContent className="text-center p-6">
                    <Box className="mb-4 flex justify-center">
                      {informe.icon}
                    </Box>
                    <Typography variant="h6" component="h2" className="font-semibold mb-2 text-gray-400">
                      {informe.title}
                    </Typography>
                    <Typography variant="body2" className="text-gray-400">
                      {informe.description}
                    </Typography>
                    <Paper className="mt-3 p-2 bg-gray-100">
                      <Typography variant="caption" className="text-gray-500">
                        Próximamente disponible
                      </Typography>
                    </Paper>
                  </CardContent>
                )}
              </Card>
            </Grid>
          ))}
        </Grid>
      </Box>
    </Layout>
  );
};

export default Informes; 