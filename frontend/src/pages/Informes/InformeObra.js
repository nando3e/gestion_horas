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
  
  // Datos agrupados
  const [datosAgrupados, setDatosAgrupados] = useState({});
  const [totalHoras, setTotalHoras] = useState(0);
  const [ordenFecha, setOrdenFecha] = useState('desc'); // 'asc' o 'desc'

  const meses = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
  ];

  useEffect(() => {
    loadObras();
    
    // Establecer año y mes actual por defecto
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth();
    
    setAñosSeleccionados([currentYear]);
    setMesesSeleccionados([currentMonth]);
    
    // Generar años disponibles (desde 2020 hasta año actual + 1)
    const years = [];
    for (let year = 2020; year <= currentYear + 1; year++) {
      years.push(year);
    }
    setAñosDisponibles(years);
    
    // Todos los meses disponibles
    setMesesDisponibles(Array.from({ length: 12 }, (_, i) => i));
  }, []);

  const loadObras = async () => {
    try {
      const response = await obrasService.getObras();
      setObras(Array.isArray(response) ? response : []);
    } catch (error) {
      console.error('Error al cargar obras:', error);
      setError('Error al cargar las obras');
    }
  };

  const loadHoras = async () => {
    if (!obraSeleccionada) {
      setError('Selecciona una obra para generar el informe');
      return;
    }

    setLoading(true);
    setError('');
    
    try {
      const filtros = {
        id_obra: obraSeleccionada
      };
      
      // Si hay años y meses seleccionados, aplicar filtros de fecha
      if (añosSeleccionados.length > 0 && mesesSeleccionados.length > 0) {
        // Para simplificar, tomamos el primer año y mes seleccionado
        // En una implementación más compleja, podríamos manejar múltiples rangos
        const año = añosSeleccionados[0];
        const mes = mesesSeleccionados[0];
        
        const fechaInicio = new Date(año, mes, 1);
        const fechaFin = new Date(año, mes + 1, 0);
        
        filtros.fecha_inicio = format(fechaInicio, 'yyyy-MM-dd');
        filtros.fecha_fin = format(fechaFin, 'yyyy-MM-dd');
      }
      
      const response = await horasService.getHoras(filtros);
      const horasData = Array.isArray(response) ? response : (response.horas || []);
      
      setHoras(horasData);
      procesarDatos(horasData);
      
    } catch (error) {
      console.error('Error al cargar horas:', error);
      setError('Error al cargar los datos del informe');
    } finally {
      setLoading(false);
    }
  };

  const procesarDatos = (horasData) => {
    const agrupados = {};
    let total = 0;
    
    horasData.forEach(hora => {
      const fecha = hora.fecha;
      const trabajador = hora.nombre_trabajador || hora.chat_id;
      const partida = hora.nombre_partida || 'Sin partida';
      const horas = parseFloat(hora.horas_totales) || 0;
      
      if (!agrupados[fecha]) {
        agrupados[fecha] = {};
      }
      
      if (!agrupados[fecha][trabajador]) {
        agrupados[fecha][trabajador] = {};
      }
      
      if (!agrupados[fecha][trabajador][partida]) {
        agrupados[fecha][trabajador][partida] = {
          horas: 0,
          registros: []
        };
      }
      
      agrupados[fecha][trabajador][partida].horas += horas;
      agrupados[fecha][trabajador][partida].registros.push(hora);
      total += horas;
    });
    
    setDatosAgrupados(agrupados);
    setTotalHoras(total);
  };

  const generarInforme = () => {
    loadHoras();
  };

  const limpiarFiltros = () => {
    setObraSeleccionada('');
    setAñosSeleccionados([]);
    setMesesSeleccionados([]);
    setHoras([]);
    setDatosAgrupados({});
    setTotalHoras(0);
    setError('');
  };

  const obtenerNombreObra = () => {
    const obra = obras.find(o => o.id_obra === parseInt(obraSeleccionada));
    return obra ? obra.nombre_obra : 'Obra no encontrada';
  };

  const formatearFecha = (fecha) => {
    try {
      return format(new Date(fecha), 'dd/MM/yyyy', { locale: es });
    } catch (error) {
      return fecha;
    }
  };

  const getFechasOrdenadas = () => {
    const fechas = Object.keys(datosAgrupados);
    return fechas.sort((a, b) => {
      const fechaA = new Date(a);
      const fechaB = new Date(b);
      return ordenFecha === 'asc' ? fechaA - fechaB : fechaB - fechaA;
    });
  };

  const toggleOrdenFecha = () => {
    setOrdenFecha(ordenFecha === 'asc' ? 'desc' : 'asc');
  };

  return (
    <Layout>
      <Box sx={{ p: 3 }}>
        {/* Breadcrumbs */}
        <Breadcrumbs sx={{ mb: 2 }}>
          <Link to="/informes" style={{ textDecoration: 'none', color: '#1976d2' }}>
            Informes
          </Link>
          <Typography color="text.primary">Informe por Obra</Typography>
        </Breadcrumbs>

        <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
          <Typography variant="h4" component="h1">
            <FaBuilding style={{ marginRight: '10px', color: '#1976d2' }} />
            Informe por Obra
          </Typography>
          <Button
            component={Link}
            to="/informes"
            variant="outlined"
            startIcon={<FaArrowLeft />}
          >
            Volver a Informes
          </Button>
        </Box>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        {/* Filtros */}
        <Paper sx={{ p: 2, mb: 3 }}>
          <Typography variant="h6" gutterBottom>
            Filtros
          </Typography>
          
          <Box display="flex" flexWrap="wrap" gap={2} alignItems="center">
            {/* Selección de obra */}
            <FormControl sx={{ minWidth: 200 }}>
              <InputLabel>Obra</InputLabel>
              <Select
                value={obraSeleccionada}
                label="Obra"
                onChange={(e) => setObraSeleccionada(e.target.value)}
              >
                <MenuItem value="">Seleccionar obra</MenuItem>
                {obras.map((obra) => (
                  <MenuItem key={obra.id_obra} value={obra.id_obra}>
                    {obra.nombre_obra}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            {/* Selección de año */}
            <FormControl sx={{ minWidth: 120 }}>
              <InputLabel>Año</InputLabel>
              <Select
                value={añosSeleccionados[0] || ''}
                label="Año"
                onChange={(e) => setAñosSeleccionados([e.target.value])}
              >
                <MenuItem value="">Todos</MenuItem>
                {añosDisponibles.map((año) => (
                  <MenuItem key={año} value={año}>
                    {año}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            {/* Selección de mes */}
            <FormControl sx={{ minWidth: 150 }}>
              <InputLabel>Mes</InputLabel>
              <Select
                value={mesesSeleccionados[0] !== undefined ? mesesSeleccionados[0] : ''}
                label="Mes"
                onChange={(e) => setMesesSeleccionados([e.target.value])}
              >
                <MenuItem value="">Todos</MenuItem>
                {mesesDisponibles.map((mes) => (
                  <MenuItem key={mes} value={mes}>
                    {meses[mes]}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            {/* Incluir acabadas */}
            <FormControlLabel
              control={
                <Switch
                  checked={incluirAcabadas}
                  onChange={(e) => setIncluirAcabadas(e.target.checked)}
                />
              }
              label="Incluir acabadas"
            />

            {/* Botones */}
            <Button
              variant="contained"
              onClick={generarInforme}
              disabled={!obraSeleccionada || loading}
              startIcon={loading ? <CircularProgress size={20} /> : <FaCalendarAlt />}
            >
              {loading ? 'Generando...' : 'Generar Informe'}
            </Button>
            
            <Button
              variant="outlined"
              onClick={limpiarFiltros}
            >
              Limpiar
            </Button>
          </Box>
        </Paper>

        {/* Resultados */}
        {Object.keys(datosAgrupados).length > 0 && (
          <Paper sx={{ p: 2 }}>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
              <Typography variant="h6">
                Informe de: {obtenerNombreObra()}
              </Typography>
              <Box display="flex" alignItems="center" gap={2}>
                <Chip 
                  label={`Total: ${totalHoras.toFixed(2)} horas`} 
                  color="primary" 
                  variant="outlined"
                />
                <Button
                  size="small"
                  onClick={toggleOrdenFecha}
                  startIcon={ordenFecha === 'asc' ? <FaSortAmountUp /> : <FaSortAmountDown />}
                >
                  Fecha {ordenFecha === 'asc' ? 'Ascendente' : 'Descendente'}
                </Button>
              </Box>
            </Box>

            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell><strong>Fecha</strong></TableCell>
                    <TableCell><strong>Trabajador</strong></TableCell>
                    <TableCell><strong>Partida</strong></TableCell>
                    <TableCell align="right"><strong>Horas</strong></TableCell>
                    <TableCell align="center"><strong>Registros</strong></TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {getFechasOrdenadas().map(fecha => {
                    const trabajadoresFecha = datosAgrupados[fecha];
                    const trabajadoresKeys = Object.keys(trabajadoresFecha);
                    
                    return trabajadoresKeys.map((trabajador, trabajadorIndex) => {
                      const partidasTrabajador = trabajadoresFecha[trabajador];
                      const partidasKeys = Object.keys(partidasTrabajador);
                      
                      return partidasKeys.map((partida, partidaIndex) => {
                        const datos = partidasTrabajador[partida];
                        const esFirstRow = trabajadorIndex === 0 && partidaIndex === 0;
                        
                        return (
                          <TableRow key={`${fecha}-${trabajador}-${partida}`}>
                            {esFirstRow && (
                              <TableCell rowSpan={trabajadoresKeys.reduce((acc, t) => acc + Object.keys(trabajadoresFecha[t]).length, 0)}>
                                {formatearFecha(fecha)}
                              </TableCell>
                            )}
                            {partidaIndex === 0 && (
                              <TableCell rowSpan={partidasKeys.length}>
                                {trabajador}
                              </TableCell>
                            )}
                            <TableCell>{partida}</TableCell>
                            <TableCell align="right">
                              <Chip 
                                label={`${datos.horas.toFixed(2)}h`} 
                                size="small" 
                                color="primary"
                              />
                            </TableCell>
                            <TableCell align="center">
                              <Chip 
                                label={datos.registros.length} 
                                size="small" 
                                variant="outlined"
                              />
                            </TableCell>
                          </TableRow>
                        );
                      });
                    });
                  })}
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>
        )}

        {horas.length === 0 && !loading && obraSeleccionada && (
          <Paper sx={{ p: 3, textAlign: 'center' }}>
            <Typography variant="h6" color="text.secondary">
              No se encontraron registros para los filtros seleccionados
            </Typography>
          </Paper>
        )}
      </Box>
    </Layout>
  );
};

export default InformeObra;