import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Layout from '../../components/Layout/Layout';
import horasService from '../../services/horasService';
import trabajadoresService from '../../services/trabajadoresService';
import obrasService from '../../services/obrasService';
import {
  Box,
  Typography,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Button,
  CircularProgress,
  Alert,
  Chip,
  Breadcrumbs
} from '@mui/material';
import {
  FaArrowLeft,
  FaCalendarAlt,
  FaUser,
  FaSortAmountDown,
  FaSortAmountUp
} from 'react-icons/fa';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

const InformeTrabajador = () => {
  const [trabajadores, setTrabajadores] = useState([]);
  const [obras, setObras] = useState([]);
  const [horas, setHoras] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  // Filtros
  const [trabajadorSeleccionado, setTrabajadorSeleccionado] = useState('');
  const [mesesSeleccionados, setMesesSeleccionados] = useState([new Date().getMonth()]);
  const [añoSeleccionado, setAñoSeleccionado] = useState(new Date().getFullYear());
  const [ordenFecha, setOrdenFecha] = useState('desc'); // 'asc' o 'desc'

  // Datos agrupados
  const [datosAgrupados, setDatosAgrupados] = useState([]);

  useEffect(() => {
    cargarDatosIniciales();
  }, []);

  useEffect(() => {
    if (trabajadorSeleccionado && mesesSeleccionados.length > 0) {
      cargarHoras();
    }
  }, [trabajadorSeleccionado, mesesSeleccionados, añoSeleccionado]);

  useEffect(() => {
    // Reordenar cuando cambie el orden
    if (horas.length > 0) {
      agruparHorasPorDia(horas);
    }
  }, [ordenFecha]);

  const cargarDatosIniciales = async () => {
    try {
      const [trabajadoresData, obrasData] = await Promise.all([
        trabajadoresService.getTrabajadores(),
        obrasService.getObras()
      ]);
      setTrabajadores(trabajadoresData);
      setObras(obrasData);
    } catch (error) {
      console.error('Error al cargar datos iniciales:', error);
      setError('Error al cargar los datos iniciales');
    }
  };

  const cargarHoras = async () => {
    try {
      setLoading(true);
      setError('');
      
      // Obtener todas las horas de los meses seleccionados
      const todasLasHoras = [];
      
      for (const mes of mesesSeleccionados) {
        const fechaInicio = new Date(añoSeleccionado, mes, 1).toISOString().split('T')[0];
        const fechaFin = new Date(añoSeleccionado, mes + 1, 0).toISOString().split('T')[0];
        
        const horasDelMes = await horasService.getHoras({
          chat_id: trabajadorSeleccionado,
          fecha_inicio: fechaInicio,
          fecha_fin: fechaFin
        });
        
        todasLasHoras.push(...horasDelMes);
      }
      
      setHoras(todasLasHoras);
      agruparHorasPorDia(todasLasHoras);
      
    } catch (error) {
      console.error('Error al cargar horas:', error);
      setError('Error al cargar las horas del trabajador');
    } finally {
      setLoading(false);
    }
  };

  const agruparHorasPorDia = (horasData) => {
    // Agrupar por fecha
    const agrupado = horasData.reduce((acc, hora) => {
      const fecha = hora.fecha;
      if (!acc[fecha]) {
        acc[fecha] = [];
      }
      acc[fecha].push(hora);
      return acc;
    }, {});

    // Convertir a array y ordenar por fecha según preferencia
    const resultado = Object.entries(agrupado)
      .map(([fecha, registros]) => ({
        fecha,
        registros: registros.sort((a, b) => {
          // Ordenar por hora de inicio
          const horaA = a.hora_inicio || '00:00';
          const horaB = b.hora_inicio || '00:00';
          return horaA.localeCompare(horaB);
        }),
        totalHoras: registros.reduce((sum, reg) => sum + parseFloat(reg.horas_totales || 0), 0)
      }))
      .sort((a, b) => {
        const fechaA = new Date(a.fecha);
        const fechaB = new Date(b.fecha);
        return ordenFecha === 'desc' ? fechaB - fechaA : fechaA - fechaB;
      });

    setDatosAgrupados(resultado);
  };

  const formatearFecha = (fechaStr) => {
    try {
      const fecha = new Date(fechaStr);
      return format(fecha, 'EEEE, dd MMMM yyyy', { locale: es });
    } catch (error) {
      return fechaStr;
    }
  };

  const formatearHorario = (horaInicio, horaFin) => {
    if (!horaInicio) return '-';
    const inicio = horaInicio.substring(0, 5);
    const fin = horaFin ? horaFin.substring(0, 5) : '';
    return fin ? `${inicio}-${fin}` : inicio;
  };

  const obtenerNombreObra = (idObra) => {
    const obra = obras.find(o => o.id_obra === idObra);
    return obra ? obra.nombre_obra : 'N/A';
  };

  const calcularTotalGeneral = () => {
    return datosAgrupados.reduce((total, dia) => total + dia.totalHoras, 0);
  };

  const eliminarMes = (mesAEliminar) => {
    const nuevosMeses = mesesSeleccionados.filter(mes => mes !== mesAEliminar);
    setMesesSeleccionados(nuevosMeses);
  };

  // Generar opciones de meses
  const meses = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
  ];

  // Generar años (desde 2020 hasta año actual + 1)
  const añoActual = new Date().getFullYear();
  const años = Array.from({ length: añoActual - 2020 + 2 }, (_, i) => 2020 + i);

  return (
    <Layout>
      <Box className="pb-6">
        {/* Breadcrumbs */}
        <Breadcrumbs className="mb-4">
          <Link to="/informes" className="text-primary-600 hover:text-primary-800">
            Informes
          </Link>
          <Typography color="text.primary">Por Trabajador</Typography>
        </Breadcrumbs>

        {/* Header */}
        <Box className="flex justify-between items-center mb-6">
          <Box>
            <Typography variant="h4" component="h1" className="font-bold text-gray-800">
              Informe por Trabajador
            </Typography>
            <Typography variant="subtitle1" className="text-gray-600 mt-1">
              Detalle de horas trabajadas agrupado por días
            </Typography>
          </Box>
          <Button
            component={Link}
            to="/informes"
            variant="outlined"
            startIcon={<FaArrowLeft />}
          >
            Volver
          </Button>
        </Box>

        {/* Filtros */}
        <Paper elevation={2} className="p-4 mb-6">
          <Box className="flex flex-col md:flex-row gap-4">
            <FormControl size="small" sx={{ minWidth: 250 }} required>
              <InputLabel>Trabajador</InputLabel>
              <Select
                value={trabajadorSeleccionado}
                label="Trabajador"
                onChange={(e) => setTrabajadorSeleccionado(e.target.value)}
              >
                <MenuItem value="">Selecciona un trabajador</MenuItem>
                {trabajadores.map((trabajador) => (
                  <MenuItem key={trabajador.chat_id} value={trabajador.chat_id}>
                    {trabajador.nombre}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <FormControl size="small" sx={{ minWidth: 120 }}>
              <InputLabel>Año</InputLabel>
              <Select
                value={añoSeleccionado}
                label="Año"
                onChange={(e) => setAñoSeleccionado(e.target.value)}
              >
                {años.map((año) => (
                  <MenuItem key={año} value={año}>
                    {año}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <FormControl size="small" sx={{ minWidth: 200 }}>
              <InputLabel>Meses</InputLabel>
              <Select
                multiple
                value={mesesSeleccionados}
                label="Meses"
                onChange={(e) => setMesesSeleccionados(e.target.value)}
                renderValue={(selected) => (
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                    {selected.map((value) => (
                      <Chip 
                        key={value} 
                        label={meses[value]} 
                        size="small"
                        onDelete={() => eliminarMes(value)}
                        onMouseDown={(event) => {
                          event.stopPropagation();
                        }}
                      />
                    ))}
                  </Box>
                )}
              >
                {meses.map((mes, index) => (
                  <MenuItem key={index} value={index}>
                    {mes}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            {datosAgrupados.length > 0 && (
              <Button
                variant="outlined"
                startIcon={ordenFecha === 'desc' ? <FaSortAmountDown /> : <FaSortAmountUp />}
                onClick={() => setOrdenFecha(ordenFecha === 'desc' ? 'asc' : 'desc')}
                title={`Ordenar fechas ${ordenFecha === 'desc' ? 'ascendente' : 'descendente'}`}
              >
                {ordenFecha === 'desc' ? 'Más reciente' : 'Más antiguo'}
              </Button>
            )}
          </Box>
        </Paper>

        {/* Resumen */}
        {datosAgrupados.length > 0 && (
          <Paper elevation={2} className="p-4 mb-6 bg-primary-50">
            <Box className="flex items-center justify-between">
              <Box className="flex items-center gap-4">
                <FaUser className="text-primary-600 text-xl" />
                <Typography variant="h6" className="font-semibold">
                  {trabajadores.find(t => t.chat_id === trabajadorSeleccionado)?.nombre || 'Trabajador'}
                </Typography>
              </Box>
              <Box className="text-right">
                <Typography variant="h5" className="font-bold text-primary-700">
                  {calcularTotalGeneral().toFixed(2)}h
                </Typography>
                <Typography variant="body2" className="text-gray-600">
                  Total período
                </Typography>
              </Box>
            </Box>
          </Paper>
        )}

        {/* Error */}
        {error && (
          <Alert severity="error" className="mb-6">
            {error}
          </Alert>
        )}

        {/* Tabla de resultados */}
        <Paper elevation={3} className="overflow-hidden">
          {loading ? (
            <Box className="flex justify-center items-center p-10">
              <CircularProgress />
            </Box>
          ) : !trabajadorSeleccionado ? (
            <Box className="p-10 text-center">
              <FaUser className="text-6xl text-gray-300 mb-4 mx-auto" />
              <Typography variant="h6" className="text-gray-500 mb-2">
                Selecciona un trabajador
              </Typography>
              <Typography variant="body2" className="text-gray-400">
                Elige un trabajador y los meses para generar el informe
              </Typography>
            </Box>
          ) : datosAgrupados.length > 0 ? (
            <TableContainer>
              <Table>
                <TableHead className="bg-gray-100">
                  <TableRow>
                    <TableCell className="font-bold">Fecha</TableCell>
                    <TableCell className="font-bold">Obra</TableCell>
                    <TableCell className="font-bold">Partida</TableCell>
                    <TableCell className="font-bold">Horario</TableCell>
                    <TableCell className="font-bold">Horas</TableCell>
                    <TableCell className="font-bold">Total Día</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {datosAgrupados.map((dia) => (
                    dia.registros.map((registro, index) => (
                      <TableRow key={`${dia.fecha}-${registro.id_movimiento}`} hover>
                        {/* Fecha - solo en la primera fila del día */}
                        {index === 0 && (
                          <TableCell 
                            rowSpan={dia.registros.length}
                            className="bg-gray-50 font-medium border-r-2 border-gray-200"
                          >
                            <Box>
                              <Typography variant="body2" className="font-semibold capitalize">
                                {formatearFecha(dia.fecha)}
                              </Typography>
                            </Box>
                          </TableCell>
                        )}
                        
                        {/* Obra */}
                        <TableCell>{obtenerNombreObra(registro.id_obra)}</TableCell>
                        
                        {/* Partida */}
                        <TableCell>{registro.nombre_partida || 'N/A'}</TableCell>
                        
                        {/* Horario */}
                        <TableCell>{formatearHorario(registro.hora_inicio, registro.hora_fin)}</TableCell>
                        
                        {/* Horas individuales */}
                        <TableCell>
                          <Box className="flex items-center gap-2">
                            {parseFloat(registro.horas_totales || 0).toFixed(2)}h
                            {registro.es_extra && (
                              <Chip 
                                label={registro.tipo_extra === 'interno' ? 'Int' : 'Ext'}
                                color="warning"
                                size="small"
                              />
                            )}
                          </Box>
                        </TableCell>
                        
                        {/* Total del día - solo en la primera fila del día */}
                        {index === 0 && (
                          <TableCell 
                            rowSpan={dia.registros.length}
                            className="bg-primary-50 font-bold text-primary-700 border-l-2 border-primary-200"
                          >
                            {dia.totalHoras.toFixed(2)}h
                          </TableCell>
                        )}
                      </TableRow>
                    ))
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          ) : (
            <Box className="p-10 text-center">
              <FaCalendarAlt className="text-6xl text-gray-300 mb-4 mx-auto" />
              <Typography variant="h6" className="text-gray-500 mb-2">
                No hay registros
              </Typography>
              <Typography variant="body2" className="text-gray-400">
                No se encontraron horas registradas para el período seleccionado
              </Typography>
            </Box>
          )}
        </Paper>
      </Box>
    </Layout>
  );
};

export default InformeTrabajador; 