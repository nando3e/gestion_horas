import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Layout from '../../components/Layout/Layout';
import horasService from '../../services/horasService';
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
  Breadcrumbs,
  Switch,
  FormControlLabel
} from '@mui/material';
import {
  FaArrowLeft,
  FaCalendarAlt,
  FaBuilding,
  FaSortAmountDown,
  FaSortAmountUp
} from 'react-icons/fa';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

const InformeObra = () => {
  const [obras, setObras] = useState([]);
  const [horas, setHoras] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  // Filtros
  const [obraSeleccionada, setObraSeleccionada] = useState('');
  const [añosDisponibles, setAñosDisponibles] = useState([]);
  const [mesesDisponibles, setMesesDisponibles] = useState([]);
  const [añosSeleccionados, setAñosSeleccionados] = useState([]);
  const [mesesSeleccionados, setMesesSeleccionados] = useState([]);
  const [incluirAcabadas, setIncluirAcabadas] = useState(true);
  const [ordenHoras, setOrdenHoras] = useState('desc'); // 'asc' o 'desc'

  // Datos agrupados
  const [datosAgrupados, setDatosAgrupados] = useState([]);

  useEffect(() => {
    cargarObras();
  }, []);

  useEffect(() => {
    if (obraSeleccionada) {
      cargarPeriodosDisponibles();
    }
  }, [obraSeleccionada]);

  useEffect(() => {
    if (obraSeleccionada && añosSeleccionados.length > 0 && mesesSeleccionados.length > 0) {
      cargarHoras();
    }
  }, [obraSeleccionada, añosSeleccionados, mesesSeleccionados, incluirAcabadas]);

  useEffect(() => {
    // Reordenar cuando cambie el orden
    if (horas.length > 0) {
      agruparHorasPorPartida(horas);
    }
  }, [ordenHoras]);

  const cargarObras = async () => {
    try {
      const obrasData = await obrasService.getObras();
      setObras(obrasData);
    } catch (error) {
      console.error('Error al cargar obras:', error);
      setError('Error al cargar las obras');
    }
  };

  const cargarPeriodosDisponibles = async () => {
    try {
      // Por ahora simulamos la lógica hasta que tengamos el endpoint
      // TODO: Crear endpoint /horas/periodos-disponibles/{id_obra}
      
      // Simulación: obtener todas las horas de la obra para extraer períodos
      const todasLasHoras = await horasService.getHoras({ id_obra: obraSeleccionada });
      
      // Extraer años y meses únicos
      const fechasUnicas = [...new Set(todasLasHoras.map(h => h.fecha))];
      const añosUnicos = [...new Set(fechasUnicas.map(fecha => new Date(fecha).getFullYear()))].sort();
      const mesesUnicos = [...new Set(fechasUnicas.map(fecha => new Date(fecha).getMonth()))].sort();
      
      setAñosDisponibles(añosUnicos);
      setMesesDisponibles(mesesUnicos);
      
      // Auto-seleccionar el año actual si está disponible
      const añoActual = new Date().getFullYear();
      if (añosUnicos.includes(añoActual)) {
        setAñosSeleccionados([añoActual]);
      } else if (añosUnicos.length > 0) {
        setAñosSeleccionados([añosUnicos[añosUnicos.length - 1]]); // Último año disponible
      }
      
      // Auto-seleccionar el mes actual si está disponible
      const mesActual = new Date().getMonth();
      if (mesesUnicos.includes(mesActual)) {
        setMesesSeleccionados([mesActual]);
      } else if (mesesUnicos.length > 0) {
        setMesesSeleccionados([mesesUnicos[mesesUnicos.length - 1]]); // Último mes disponible
      }
      
    } catch (error) {
      console.error('Error al cargar períodos disponibles:', error);
      setError('Error al cargar los períodos disponibles');
    }
  };

  const cargarHoras = async () => {
    try {
      setLoading(true);
      setError('');
      
      // Obtener todas las horas de los períodos seleccionados
      const todasLasHoras = [];
      
      for (const año of añosSeleccionados) {
        for (const mes of mesesSeleccionados) {
          const fechaInicio = new Date(año, mes, 1).toISOString().split('T')[0];
          const fechaFin = new Date(año, mes + 1, 0).toISOString().split('T')[0];
          
          const horasDelPeriodo = await horasService.getHoras({
            id_obra: obraSeleccionada,
            fecha_inicio: fechaInicio,
            fecha_fin: fechaFin
          });
          
          todasLasHoras.push(...horasDelPeriodo);
        }
      }
      
      setHoras(todasLasHoras);
      agruparHorasPorPartida(todasLasHoras);
      
    } catch (error) {
      console.error('Error al cargar horas:', error);
      setError('Error al cargar las horas de la obra');
    } finally {
      setLoading(false);
    }
  };

  const agruparHorasPorPartida = (horasData) => {
    // Filtrar por estado de partidas si es necesario
    let horasFiltradas = horasData;
    if (!incluirAcabadas) {
      // TODO: Filtrar por estado de partida cuando tengamos esa información
      // horasFiltradas = horasData.filter(h => h.estado_partida !== 'acabada');
    }

    // Agrupar por partida
    const agrupado = horasFiltradas.reduce((acc, hora) => {
      const partidaKey = hora.id_partida || 'sin_partida';
      const partidaNombre = hora.nombre_partida || 'Sin partida';
      
      if (!acc[partidaKey]) {
        acc[partidaKey] = {
          id_partida: partidaKey,
          nombre_partida: partidaNombre,
          horas_totales: 0,
          registros: []
        };
      }
      
      acc[partidaKey].horas_totales += parseFloat(hora.horas_totales || 0);
      acc[partidaKey].registros.push(hora);
      
      return acc;
    }, {});

    // Convertir a array y ordenar por horas
    const resultado = Object.values(agrupado)
      .sort((a, b) => {
        return ordenHoras === 'desc' ? b.horas_totales - a.horas_totales : a.horas_totales - b.horas_totales;
      });

    setDatosAgrupados(resultado);
  };

  const calcularTotalGeneral = () => {
    return datosAgrupados.reduce((total, partida) => total + partida.horas_totales, 0);
  };

  // Funciones de selección masiva
  const seleccionarTodosLosAños = () => {
    setAñosSeleccionados([...añosDisponibles]);
  };

  const deseleccionarTodosLosAños = () => {
    setAñosSeleccionados([]);
  };

  const seleccionarTodosLosMeses = () => {
    setMesesSeleccionados([...mesesDisponibles]);
  };

  const deseleccionarTodosLosMeses = () => {
    setMesesSeleccionados([]);
  };

  const eliminarAño = (añoAEliminar) => {
    const nuevosAños = añosSeleccionados.filter(año => año !== añoAEliminar);
    setAñosSeleccionados(nuevosAños);
  };

  const eliminarMes = (mesAEliminar) => {
    const nuevosMeses = mesesSeleccionados.filter(mes => mes !== mesAEliminar);
    setMesesSeleccionados(nuevosMeses);
  };

  // Nombres de meses
  const meses = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
  ];

  const obtenerNombreObra = () => {
    const obra = obras.find(o => o.id_obra === parseInt(obraSeleccionada));
    return obra ? obra.nombre_obra : 'Obra';
  };

  return (
    <Layout>
      <Box className="pb-6">
        {/* Breadcrumbs */}
        <Breadcrumbs className="mb-4">
          <Link to="/informes" className="text-primary-600 hover:text-primary-800">
            Informes
          </Link>
          <Typography color="text.primary">Por Obra</Typography>
        </Breadcrumbs>

        {/* Header */}
        <Box className="flex justify-between items-center mb-6">
          <Box>
            <Typography variant="h4" component="h1" className="font-bold text-gray-800">
              Informe por Obra
            </Typography>
            <Typography variant="subtitle1" className="text-gray-600 mt-1">
              Horas totales por partida en el período seleccionado
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
          <Box className="flex flex-col gap-4">
            {/* Primera fila: Obra */}
            <FormControl size="small" sx={{ minWidth: 300 }} required>
              <InputLabel>Obra</InputLabel>
              <Select
                value={obraSeleccionada}
                label="Obra"
                onChange={(e) => setObraSeleccionada(e.target.value)}
              >
                <MenuItem value="">Selecciona una obra</MenuItem>
                {obras.map((obra) => (
                  <MenuItem key={obra.id_obra} value={obra.id_obra}>
                    {obra.nombre_obra}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            {/* Segunda fila: Años con selección masiva */}
            {añosDisponibles.length > 0 && (
              <Box>
                <Typography variant="subtitle2" className="mb-3 font-semibold text-gray-700">
                  Años:
                </Typography>
                <Box className="flex flex-wrap gap-2 mb-3">
                  {añosSeleccionados.map((año) => (
                    <Chip 
                      key={año} 
                      label={año} 
                      size="small"
                      variant="outlined"
                      onDelete={() => eliminarAño(año)}
                      sx={{ backgroundColor: '#f3f4f6', color: '#374151' }}
                    />
                  ))}
                </Box>
                <Box className="flex gap-2 items-center">
                  <FormControl size="small" sx={{ minWidth: 180 }}>
                    <InputLabel>Seleccionar años</InputLabel>
                    <Select
                      multiple
                      value={añosSeleccionados}
                      label="Seleccionar años"
                      onChange={(e) => setAñosSeleccionados(e.target.value)}
                    >
                      {añosDisponibles.map((año) => (
                        <MenuItem key={año} value={año}>
                          {año}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                  <Button 
                    size="small"
                    variant="outlined"
                    onClick={seleccionarTodosLosAños}
                  >
                    Todos
                  </Button>
                  <Button 
                    size="small"
                    variant="outlined"
                    onClick={deseleccionarTodosLosAños}
                  >
                    Ninguno
                  </Button>
                </Box>
              </Box>
            )}

            {/* Tercera fila: Meses con selección masiva */}
            {mesesDisponibles.length > 0 && (
              <Box>
                <Typography variant="subtitle2" className="mb-3 font-semibold text-gray-700">
                  Meses:
                </Typography>
                <Box className="flex flex-wrap gap-2 mb-3">
                  {mesesSeleccionados.map((mes) => (
                    <Chip 
                      key={mes} 
                      label={meses[mes]} 
                      size="small"
                      variant="outlined"
                      onDelete={() => eliminarMes(mes)}
                      sx={{ backgroundColor: '#f3f4f6', color: '#374151' }}
                    />
                  ))}
                </Box>
                <Box className="flex gap-2 items-center">
                  <FormControl size="small" sx={{ minWidth: 180 }}>
                    <InputLabel>Seleccionar meses</InputLabel>
                    <Select
                      multiple
                      value={mesesSeleccionados}
                      label="Seleccionar meses"
                      onChange={(e) => setMesesSeleccionados(e.target.value)}
                    >
                      {mesesDisponibles.map((mes) => (
                        <MenuItem key={mes} value={mes}>
                          {meses[mes]}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                  <Button 
                    size="small"
                    variant="outlined"
                    onClick={seleccionarTodosLosMeses}
                  >
                    Todos
                  </Button>
                  <Button 
                    size="small"
                    variant="outlined"
                    onClick={deseleccionarTodosLosMeses}
                  >
                    Ninguno
                  </Button>
                </Box>
              </Box>
            )}

            {/* Cuarta fila: Controles adicionales */}
            <Box className="flex gap-4 items-center">
              <FormControlLabel
                control={
                  <Switch
                    checked={incluirAcabadas}
                    onChange={(e) => setIncluirAcabadas(e.target.checked)}
                  />
                }
                label="Incluir partidas acabadas"
              />

              {datosAgrupados.length > 0 && (
                <Button
                  variant="outlined"
                  startIcon={ordenHoras === 'desc' ? <FaSortAmountDown /> : <FaSortAmountUp />}
                  onClick={() => setOrdenHoras(ordenHoras === 'desc' ? 'asc' : 'desc')}
                  title={`Ordenar por horas ${ordenHoras === 'desc' ? 'ascendente' : 'descendente'}`}
                >
                  Horas
                </Button>
              )}
            </Box>
          </Box>
        </Paper>

        {/* Resumen */}
        {datosAgrupados.length > 0 && (
          <Paper elevation={2} className="p-4 mb-6 bg-primary-50">
            <Box className="flex items-center justify-between">
              <Box className="flex items-center gap-4">
                <FaBuilding className="text-primary-600 text-xl" />
                <Typography variant="h6" className="font-semibold">
                  {obtenerNombreObra()}
                </Typography>
              </Box>
              <Box className="text-right">
                <Typography variant="h5" className="font-bold text-primary-700">
                  {calcularTotalGeneral().toFixed(2)}
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
          ) : !obraSeleccionada ? (
            <Box className="p-10 text-center">
              <FaBuilding className="text-6xl text-gray-300 mb-4 mx-auto" />
              <Typography variant="h6" className="text-gray-500 mb-2">
                Selecciona una obra
              </Typography>
              <Typography variant="body2" className="text-gray-400">
                Elige una obra para generar el informe de horas por partida
              </Typography>
            </Box>
          ) : datosAgrupados.length > 0 ? (
            <TableContainer>
              <Table>
                <TableHead className="bg-gray-100">
                  <TableRow>
                    <TableCell className="font-bold">Partida</TableCell>
                    <TableCell className="font-bold text-right">Horas Totales</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {datosAgrupados.map((partida) => (
                    <TableRow key={partida.id_partida} hover>
                      <TableCell className="font-medium">
                        {partida.nombre_partida}
                      </TableCell>
                      <TableCell className="text-right font-semibold">
                        {partida.horas_totales.toFixed(2)}
                      </TableCell>
                    </TableRow>
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

export default InformeObra; 