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
  const [datosAgrupados, setDatosAgrupados] = useState({});
  const [totalHoras, setTotalHoras] = useState(0);
  const [resumenObras, setResumenObras] = useState({});

  const meses = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
  ];

  useEffect(() => {
    loadTrabajadores();
    loadObras();
  }, []);

  const loadTrabajadores = async () => {
    try {
      const response = await trabajadoresService.getTrabajadores();
      setTrabajadores(Array.isArray(response) ? response : []);
    } catch (error) {
      console.error('Error al cargar trabajadores:', error);
      setError('Error al cargar los trabajadores');
    }
  };

  const loadObras = async () => {
    try {
      const response = await obrasService.getObras();
      setObras(Array.isArray(response) ? response : []);
    } catch (error) {
      console.error('Error al cargar obras:', error);
    }
  };

  const loadHoras = async () => {
    if (!trabajadorSeleccionado) {
      setError('Selecciona un trabajador para generar el informe');
      return;
    }

    setLoading(true);
    setError('');
    
    try {
      const filtros = {
        chat_id: trabajadorSeleccionado
      };
      
      // Aplicar filtros de fecha si hay meses y año seleccionados
      if (mesesSeleccionados.length > 0 && añoSeleccionado) {
        // Para simplificar, tomamos el primer mes seleccionado
        const mes = mesesSeleccionados[0];
        
        const fechaInicio = new Date(añoSeleccionado, mes, 1);
        const fechaFin = new Date(añoSeleccionado, mes + 1, 0);
        
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
    const resumenPorObra = {};
    let total = 0;
    
    horasData.forEach(hora => {
      const fecha = hora.fecha;
      const obraId = hora.id_obra;
      const obraNombre = obtenerNombreObra(obraId);
      const partida = hora.nombre_partida || 'Sin partida';
      const horas = parseFloat(hora.horas_totales) || 0;
      const esExtra = hora.es_extra;
      
      // Agrupar por fecha
      if (!agrupados[fecha]) {
        agrupados[fecha] = [];
      }
      
      agrupados[fecha].push({
        ...hora,
        obra_nombre: obraNombre,
        horas_numericas: horas
      });
      
      // Resumen por obra
      if (!resumenPorObra[obraNombre]) {
        resumenPorObra[obraNombre] = {
          total: 0,
          normales: 0,
          extras: 0,
          registros: 0
        };
      }
      
      resumenPorObra[obraNombre].total += horas;
      resumenPorObra[obraNombre].registros += 1;
      
      if (esExtra) {
        resumenPorObra[obraNombre].extras += horas;
      } else {
        resumenPorObra[obraNombre].normales += horas;
      }
      
      total += horas;
    });
    
    setDatosAgrupados(agrupados);
    setResumenObras(resumenPorObra);
    setTotalHoras(total);
  };

  const generarInforme = () => {
    loadHoras();
  };

  const limpiarFiltros = () => {
    setTrabajadorSeleccionado('');
    setMesesSeleccionados([]);
    setAñoSeleccionado(new Date().getFullYear());
    setHoras([]);
    setDatosAgrupados({});
    setResumenObras({});
    setTotalHoras(0);
    setError('');
  };

  const obtenerNombreTrabajador = () => {
    const trabajador = trabajadores.find(t => t.chat_id === trabajadorSeleccionado);
    return trabajador ? trabajador.nombre : 'Trabajador no encontrado';
  };

  const obtenerNombreObra = (idObra) => {
    const obra = obras.find(o => o.id_obra === idObra);
    return obra ? obra.nombre_obra : `Obra ${idObra}`;
  };

  const formatearFecha = (fecha) => {
    try {
      return format(new Date(fecha), 'dd/MM/yyyy', { locale: es });
    } catch (error) {
      return fecha;
    }
  };

  const formatearHora = (hora) => {
    if (!hora) return '-';
    try {
      if (typeof hora === 'string' && hora.includes(':')) {
        return hora.substring(0, 5);
      }
      return hora;
    } catch (error) {
      return hora;
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
          <Typography color="text.primary">Informe por Trabajador</Typography>
        </Breadcrumbs>

        <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
          <Typography variant="h4" component="h1">
            <FaUser style={{ marginRight: '10px', color: '#1976d2' }} />
            Informe por Trabajador
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
            {/* Selección de trabajador */}
            <FormControl sx={{ minWidth: 200 }}>
              <InputLabel>Trabajador</InputLabel>
              <Select
                value={trabajadorSeleccionado}
                label="Trabajador"
                onChange={(e) => setTrabajadorSeleccionado(e.target.value)}
              >
                <MenuItem value="">Seleccionar trabajador</MenuItem>
                {trabajadores.map((trabajador) => (
                  <MenuItem key={trabajador.chat_id} value={trabajador.chat_id}>
                    {trabajador.nombre}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            {/* Selección de año */}
            <FormControl sx={{ minWidth: 120 }}>
              <InputLabel>Año</InputLabel>
              <Select
                value={añoSeleccionado}
                label="Año"
                onChange={(e) => setAñoSeleccionado(e.target.value)}
              >
                {Array.from({ length: 6 }, (_, i) => new Date().getFullYear() - i).map((año) => (
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
                {meses.map((mes, index) => (
                  <MenuItem key={index} value={index}>
                    {mes}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            {/* Botones */}
            <Button
              variant="contained"
              onClick={generarInforme}
              disabled={!trabajadorSeleccionado || loading}
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

        {/* Resumen por obras */}
        {Object.keys(resumenObras).length > 0 && (
          <Paper sx={{ p: 2, mb: 3 }}>
            <Typography variant="h6" gutterBottom>
              Resumen por Obras
            </Typography>
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell><strong>Obra</strong></TableCell>
                    <TableCell align="right"><strong>Horas Normales</strong></TableCell>
                    <TableCell align="right"><strong>Horas Extras</strong></TableCell>
                    <TableCell align="right"><strong>Total Horas</strong></TableCell>
                    <TableCell align="center"><strong>Registros</strong></TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {Object.entries(resumenObras).map(([obra, datos]) => (
                    <TableRow key={obra}>
                      <TableCell>{obra}</TableCell>
                      <TableCell align="right">
                        <Chip label={`${datos.normales.toFixed(2)}h`} size="small" color="primary" />
                      </TableCell>
                      <TableCell align="right">
                        <Chip label={`${datos.extras.toFixed(2)}h`} size="small" color="warning" />
                      </TableCell>
                      <TableCell align="right">
                        <Chip label={`${datos.total.toFixed(2)}h`} size="small" color="success" />
                      </TableCell>
                      <TableCell align="center">
                        <Chip label={datos.registros} size="small" variant="outlined" />
                      </TableCell>
                    </TableRow>
                  ))}
                  <TableRow sx={{ bgcolor: 'grey.100' }}>
                    <TableCell><strong>TOTAL</strong></TableCell>
                    <TableCell align="right">
                      <Chip 
                        label={`${Object.values(resumenObras).reduce((acc, datos) => acc + datos.normales, 0).toFixed(2)}h`} 
                        size="small" 
                        color="primary" 
                        variant="outlined"
                      />
                    </TableCell>
                    <TableCell align="right">
                      <Chip 
                        label={`${Object.values(resumenObras).reduce((acc, datos) => acc + datos.extras, 0).toFixed(2)}h`} 
                        size="small" 
                        color="warning" 
                        variant="outlined"
                      />
                    </TableCell>
                    <TableCell align="right">
                      <Chip 
                        label={`${totalHoras.toFixed(2)}h`} 
                        size="small" 
                        color="success" 
                        variant="outlined"
                      />
                    </TableCell>
                    <TableCell align="center">
                      <Chip 
                        label={Object.values(resumenObras).reduce((acc, datos) => acc + datos.registros, 0)} 
                        size="small" 
                        variant="outlined"
                      />
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>
        )}

        {/* Detalle por fechas */}
        {Object.keys(datosAgrupados).length > 0 && (
          <Paper sx={{ p: 2 }}>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
              <Typography variant="h6">
                Detalle de: {obtenerNombreTrabajador()}
              </Typography>
              <Button
                size="small"
                onClick={toggleOrdenFecha}
                startIcon={ordenFecha === 'asc' ? <FaSortAmountUp /> : <FaSortAmountDown />}
              >
                Fecha {ordenFecha === 'asc' ? 'Ascendente' : 'Descendente'}
              </Button>
            </Box>

            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell><strong>Fecha</strong></TableCell>
                    <TableCell><strong>Obra</strong></TableCell>
                    <TableCell><strong>Partida</strong></TableCell>
                    <TableCell><strong>Inicio</strong></TableCell>
                    <TableCell><strong>Fin</strong></TableCell>
                    <TableCell align="right"><strong>Horas</strong></TableCell>
                    <TableCell align="center"><strong>Tipo</strong></TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {getFechasOrdenadas().map(fecha => {
                    const horasFecha = datosAgrupados[fecha];
                    
                    return horasFecha.map((hora, index) => (
                      <TableRow key={`${fecha}-${index}`}>
                        {index === 0 && (
                          <TableCell rowSpan={horasFecha.length}>
                            <strong>{formatearFecha(fecha)}</strong>
                          </TableCell>
                        )}
                        <TableCell>{hora.obra_nombre}</TableCell>
                        <TableCell>{hora.nombre_partida || 'Sin partida'}</TableCell>
                        <TableCell>{formatearHora(hora.hora_inicio)}</TableCell>
                        <TableCell>{formatearHora(hora.hora_fin)}</TableCell>
                        <TableCell align="right">
                          <Chip 
                            label={`${hora.horas_numericas.toFixed(2)}h`} 
                            size="small" 
                            color={hora.es_extra ? 'warning' : 'primary'}
                          />
                        </TableCell>
                        <TableCell align="center">
                          <Chip
                            label={hora.es_extra ? 'Extra' : 'Normal'}
                            color={hora.es_extra ? 'warning' : 'primary'}
                            size="small"
                            variant="outlined"
                          />
                        </TableCell>
                      </TableRow>
                    ));
                  })}
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>
        )}

        {horas.length === 0 && !loading && trabajadorSeleccionado && (
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

export default InformeTrabajador;