import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Layout from '../../components/Layout/Layout';
import horasService from '../../services/horasService';
import obrasService from '../../services/obrasService';
import partidasService from '../../services/partidasService';
import trabajadoresService from '../../services/trabajadoresService';
import authService from '../../services/authService';
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
  TablePagination,
  Button,
  Chip,
  CircularProgress,
  Alert,
  IconButton,
  TextField,
  InputAdornment,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Grid,
  Switch,
  FormControlLabel,
  Radio,
  RadioGroup
} from '@mui/material';
import { 
  FaPlus, 
  FaSearch, 
  FaEdit, 
  FaEye, 
  FaTrash,
  FaCalendarAlt
} from 'react-icons/fa';
import { format, startOfMonth, endOfMonth } from 'date-fns';
import { es } from 'date-fns/locale';

// Constantes para opciones de horas y minutos
const HOUR_OPTIONS = Array.from({ length: 24 }, (_, i) => i.toString().padStart(2, '0'));
const MINUTE_OPTIONS = Array.from({ length: 12 }, (_, i) => (i * 5).toString().padStart(2, '0'));

const ListaHoras = () => {
  const [usuario, setUsuario] = useState(null);
  const [obras, setObras] = useState([]);
  const [horas, setHoras] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Estado para la paginación
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  
  // Obtener año y mes actual
  const fechaActual = new Date();
  const mesActual = fechaActual.getMonth(); // 0-11
  const añoActual = fechaActual.getFullYear();
  
  // Estado para filtros
  const [filtros, setFiltros] = useState({
    año: new Date().getFullYear(),
    mes: new Date().getMonth(),
    busqueda: '',
    id_obra: '',
    id_partida: '',
    chat_id: ''
  });

  // Estado para el modal de edición
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState(null);
  const [partidas, setPartidas] = useState([]);
  const [trabajadores, setTrabajadores] = useState([]);
  const [partidaSeleccionada, setPartidaSeleccionada] = useState('');
  const [obraSeleccionada, setObraSeleccionada] = useState('');
  const [nombreObra, setNombreObra] = useState('');
  const [tramos, setTramos] = useState([
    { horaInicio: '08', minutoInicio: '00', horaFin: '17', minutoFin: '00' }
  ]);
  const [horasTotalesInput, setHorasTotalesInput] = useState('');
  const [esExtra, setEsExtra] = useState(false);
  const [tipoExtra, setTipoExtra] = useState('interno');
  const [descripcionExtra, setDescripcionExtra] = useState('');
  const [modalError, setModalError] = useState('');
  const [editLoading, setEditLoading] = useState(false);

  useEffect(() => {
    const cargarHoras = async () => {
      try {
        setLoading(true);
        const user = authService.getCurrentUser();
        setUsuario(user);
        // Cargar obras
        const obrasData = await obrasService.getObras();
        setObras(obrasData);
        
        // Obtener fechas inicio y fin del mes seleccionado
        const fechaInicio = startOfMonth(new Date(filtros.año, filtros.mes, 1)).toISOString().split('T')[0];
        const fechaFin = endOfMonth(new Date(filtros.año, filtros.mes, 1)).toISOString().split('T')[0];
        
        // Pasar parámetros de fechas al servicio
        const params = {
          fecha_inicio: fechaInicio,
          fecha_fin: fechaFin
        };
        
        // Si es trabajador, filtrar por su chat_id
        if (user && user.rol === 'trabajador' && user.chat_id) {
          params.chat_id = user.chat_id;
        } else if (user && (user.rol === 'admin' || user.rol === 'secretaria')) {
          // Para admin y secretaria, aplicar filtros adicionales si están definidos
          if (filtros.id_obra) {
            params.id_obra = filtros.id_obra;
          }
          if (filtros.id_partida) {
            params.id_partida = filtros.id_partida;
          }
          if (filtros.chat_id) {
            params.chat_id = filtros.chat_id;
          }
        }
        
        const data = await horasService.getHoras(params);
        setHoras(data);
        setError('');
      } catch (err) {
        console.error('Error al cargar horas:', err);
        setError('No se pudieron cargar las horas. Por favor, inténtalo de nuevo.');
      } finally {
        setLoading(false);
      }
    };

    cargarHoras();
  }, [filtros.mes, filtros.año, filtros.id_obra, filtros.id_partida, filtros.chat_id]); // Recargar cuando cambien los filtros

  // Cargar datos iniciales
  useEffect(() => {
    const cargarDatosIniciales = async () => {
      try {
        const user = authService.getCurrentUser();
        
        // Si es admin o secretaria, cargar trabajadores
        if (user && (user.rol === 'admin' || user.rol === 'secretaria')) {
          const trabajadoresData = await trabajadoresService.getTrabajadores();
          setTrabajadores(trabajadoresData);
        }
      } catch (error) {
        console.error('Error al cargar datos iniciales:', error);
      }
    };
    
    cargarDatosIniciales();
  }, []);

  // Manejar cambio de página
  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  // Manejar cambio de filas por página
  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  // Manejar cambios en filtros
  const handleFiltroChange = (e) => {
    const { name, value } = e.target;
    setFiltros({
      ...filtros,
      [name]: value
    });
    
    // Si cambia la obra, cargar las partidas correspondientes
    if (name === 'id_obra' && value) {
      cargarPartidasPorObra(value);
    } else if (name === 'id_obra' && !value) {
      // Si se deselecciona la obra, limpiar las partidas
      setPartidas([]);
      setFiltros(prev => ({
        ...prev,
        id_partida: ''
      }));
    }
  };

  // Cargar partidas por obra
  const cargarPartidasPorObra = async (idObra) => {
    try {
      const partidasData = await partidasService.getPartidasPorObra(idObra);
      setPartidas(partidasData);
    } catch (error) {
      console.error('Error al cargar partidas:', error);
    }
  };

  // Confirmar eliminación
  const confirmarEliminar = (id) => {
    // Aquí iría la lógica para mostrar un diálogo de confirmación
    // Por ahora simplemente mostramos un alert
    if (window.confirm('¿Estás seguro de que quieres eliminar este registro?')) {
      eliminarHora(id);
    }
  };

  // Abrir el modal de edición
  const handleOpenEditModal = async (hora) => {
    setEditingRecord(hora);
    setPartidaSeleccionada(hora.id_partida ? hora.id_partida.toString() : '');
    setObraSeleccionada(hora.id_obra ? hora.id_obra.toString() : '');
    setNombreObra(obras.find(o => o.id_obra === hora.id_obra)?.nombre_obra || '');
    
    // Convertir el string de horario a tramos
    const horarios = hora.horario ? hora.horario.split(',') : [];
    if (horarios.length > 0 && horarios[0]) {
      const newTramos = horarios.map(horario => {
        const [ini, fin] = horario.split('-');
        const [hIni, mIni] = ini.split(':');
        const [hFin, mFin] = fin.split(':');
        return { horaInicio: hIni, minutoInicio: mIni, horaFin: hFin, minutoFin: mFin };
      });
      setTramos(newTramos);
    } else {
      // Valor por defecto si no hay horario
      setTramos([{ horaInicio: '08', minutoInicio: '00', horaFin: '17', minutoFin: '00' }]);
    }
    
    setHorasTotalesInput(hora.horas_totales ? hora.horas_totales.toString() : '0');
    setEsExtra(hora.es_extra || false);
    setTipoExtra(hora.tipo_extra || 'interno');
    setDescripcionExtra(hora.descripcion_extra || '');
    
    try {
      // Cargar partidas para la obra seleccionada
      if (hora.id_obra) {
        const partidasData = await partidasService.getPartidasPorObra(hora.id_obra);
        setPartidas(partidasData.filter(p => p.id_obra === hora.id_obra));
      } else {
        setPartidas([]);
      }
    } catch (error) {
      console.error("Error al cargar partidas:", error);
      setModalError("No se pudieron cargar las partidas disponibles.");
      setPartidas([]);
    }
    
    setEditModalOpen(true);
  };

  // Cerrar el modal de edición
  const handleCloseEditModal = () => {
    setEditModalOpen(false);
    setEditingRecord(null);
    setModalError('');
    setEditLoading(false);
  };

  // Guardar cambios en el registro
  const handleSaveEdit = async () => {
    setModalError('');
    setEditLoading(true);
    
    if (!partidaSeleccionada) {
      setModalError('Por favor, selecciona una partida.');
      setEditLoading(false);
      return;
    }
    
    // Construir string de horario a partir de los tramos
    const horarioString = tramos.map(t => 
      `${t.horaInicio}:${t.minutoInicio}-${t.horaFin}:${t.minutoFin}`
    ).join(',');
    
    // Calcular horas totales (similar a RegistrarHoras)
    const totalHoras = calcularTotalHoras();
    
    // Validar solapamientos con registros existentes para el mismo día
    // Obtener todos los registros del mismo día (y mismo trabajador)
    const registrosMismoDia = horas.filter(h => {
      // Filtrar por mismo día
      const horaFecha = h.fecha ? h.fecha.substring(0, 10) : '';
      const editingFecha = editingRecord.fecha ? editingRecord.fecha.substring(0, 10) : '';
      const mismoTrabajador = h.chat_id === editingRecord.chat_id;
      
      return horaFecha === editingFecha && mismoTrabajador && h.id_movimiento !== editingRecord.id_movimiento;
    });
    
    const validacion = validarSolapamientos(horarioString, registrosMismoDia);
    if (validacion.solapado) {
      setModalError(validacion.mensaje);
      setEditLoading(false);
      return;
    }
    
    try {
      const updatedRecord = {
        ...editingRecord,
        id_partida: parseInt(partidaSeleccionada),
        id_obra: parseInt(obraSeleccionada),
        horario: horarioString,
        horas_totales: totalHoras,
        es_extra: esExtra,
        tipo_extra: esExtra ? tipoExtra : null,
        descripcion_extra: esExtra ? descripcionExtra : null
      };
      
      await horasService.updateHora(editingRecord.id_movimiento, updatedRecord);
      
      // Actualizar la lista de horas
      setHoras(prevHoras => 
        prevHoras.map(hora => 
          hora.id_movimiento === editingRecord.id_movimiento ? updatedRecord : hora
        )
      );
      
      handleCloseEditModal();
      // Si quieres mostrar algún mensaje de éxito
      alert('Registro actualizado correctamente');
    } catch (error) {
      console.error("Error al actualizar el registro:", error);
      setModalError(error.response?.data?.detail || 'Error al actualizar el registro');
    } finally {
      setEditLoading(false);
    }
  };

  // Funciones para gestionar tramos (similares a RegistrarHoras)
  const handleTramoChange = (index, field, value) => {
    setTramos(prev => prev.map((tramo, i) => i === index ? { ...tramo, [field]: value } : tramo));
  };
  
  const handleAddTramo = () => {
    setTramos(prev => [...prev, { horaInicio: '08', minutoInicio: '00', horaFin: '17', minutoFin: '00' }]);
  };
  
  const handleRemoveTramo = (index) => {
    if (tramos.length === 1) return; // No permitir menos de un tramo
    setTramos(prev => prev.filter((_, i) => i !== index));
  };
  
  // Calcular total de horas de todos los tramos
  const calcularTotalHoras = () => {
    let total = 0;
    for (const tramo of tramos) {
      const hIni = parseInt(tramo.horaInicio);
      const mIni = parseInt(tramo.minutoInicio);
      const hFin = parseInt(tramo.horaFin);
      const mFin = parseInt(tramo.minutoFin);
      let horas = (hFin + mFin / 60) - (hIni + mIni / 60);
      if (horas < 0) horas += 24;
      total += horas;
    }
    return total;
  };

  // Calcular el total de horas del mes para la vista
  const calcularTotalHorasMes = () => {
    return horas.reduce((total, hora) => total + parseFloat(hora.horas_totales), 0).toFixed(2);
  };

  // Función para validar tramos solapados
  const validarSolapamientos = (horarioNuevo, registrosExistentes) => {
    // Convertir el nuevo horario en un array de objetos con hora inicio y fin en minutos
    const nuevosTramos = horarioNuevo.split(',').map(tramo => {
      const [inicio, fin] = tramo.split('-');
      const [horaInicio, minInicio] = inicio.split(':').map(Number);
      const [horaFin, minFin] = fin.split(':').map(Number);
      
      return {
        inicioMinutos: horaInicio * 60 + minInicio,
        finMinutos: horaFin * 60 + minFin
      };
    });
    
    // Comprobar solapamiento con cada registro existente
    for (const registro of registrosExistentes) {
      // Si el registro es el que estamos editando, lo saltamos
      if (editingRecord && registro.id_movimiento === editingRecord.id_movimiento) {
        continue;
      }
      
      // Convertir cada horario existente en tramos de minutos
      const tramosExistentes = registro.horario ? registro.horario.split(',').map(tramo => {
        const [inicio, fin] = tramo.split('-');
        const [horaInicio, minInicio] = inicio.split(':').map(Number);
        const [horaFin, minFin] = fin.split(':').map(Number);
        
        return {
          inicioMinutos: horaInicio * 60 + minInicio,
          finMinutos: horaFin * 60 + minFin,
          obra: registro.id_obra,
          partida: registro.id_partida
        };
      }) : [];
      
      // Comprobar si hay solapamiento entre tramos
      for (const tramoNuevo of nuevosTramos) {
        for (const tramoExistente of tramosExistentes) {
          // Hay solapamiento si el inicio del nuevo es menor que el fin del existente Y
          // el fin del nuevo es mayor que el inicio del existente
          if (tramoNuevo.inicioMinutos < tramoExistente.finMinutos && 
              tramoNuevo.finMinutos > tramoExistente.inicioMinutos) {
            return {
              solapado: true,
              mensaje: `El horario se solapa con otro registro existente (${registro.horario}) en la obra "${obras.find(o => o.id_obra === registro.id_obra)?.nombre_obra || 'Desconocida'}"`
            };
          }
        }
      }
    }
    
    return { solapado: false };
  };

  // Eliminar hora
  const eliminarHora = async (id) => {
    try {
      await horasService.deleteHora(id);
      // Actualizar la lista después de eliminar
      setHoras(horas.filter(hora => hora.id_movimiento !== id));
      alert('Registro eliminado con éxito');
    } catch (err) {
      console.error('Error al eliminar hora:', err);
      alert('Error al eliminar el registro');
    }
  };

  // Formatear fecha
  const formatearFecha = (fechaStr) => {
    try {
      const fecha = new Date(fechaStr);
      return format(fecha, 'dd MMM yyyy', { locale: es });
    } catch (error) {
      return fechaStr || 'Fecha no disponible';
    }
  };

  // Generar array de meses
  const meses = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
  ];
  
  // Generar array de años (desde 2020 hasta el año actual)
  const años = Array.from(
    { length: añoActual - 2020 + 1 },
    (_, i) => añoActual - i
  );

  return (
    <Layout>
      <Box className="pb-6">
        <Box className="flex justify-between items-center mb-6">
          <Typography variant="h4" component="h1" className="font-bold text-gray-800">
            Mis Horas
          </Typography>
          {!loading && horas.length > 0 && (
            <Paper elevation={2} sx={{ p: 2, display: 'inline-flex', alignItems: 'center' }}>
              <Typography variant="h6" color="primary">
                Total Horas {meses[filtros.mes]}: <strong>{calcularTotalHorasMes()}</strong>
              </Typography>
            </Paper>
          )}
          <Button
            component={Link}
            to="/horas/registrar"
            variant="contained"
            color="primary"
            startIcon={<FaPlus />}
          >
            Registrar Horas
          </Button>
        </Box>

        {error && (
          <Alert severity="error" className="mb-6">
            {error}
          </Alert>
        )}

        {/* Filtros */}
        <Paper elevation={2} className="p-4 mb-6">
          <Box className="flex flex-col md:flex-row gap-4">
            <Box className="flex-1">
              <Box className="flex items-center">
                <FaSearch className="text-gray-400 mr-2" />
                <TextField
                  label="Buscar"
                  variant="outlined"
                  fullWidth
                  size="small"
                  name="busqueda"
                  value={filtros.busqueda}
                  onChange={handleFiltroChange}
                  placeholder="Buscar..."
                />
              </Box>
            </Box>
            
            <Box className="flex gap-4">
              <FormControl size="small" sx={{ minWidth: 120 }}>
                <InputLabel>Mes</InputLabel>
                <Select
                  name="mes"
                  value={filtros.mes}
                  onChange={handleFiltroChange}
                  label="Mes"
                >
                  {meses.map((mes, index) => (
                    <MenuItem key={index} value={index}>
                      {mes}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
              
              <FormControl size="small" sx={{ minWidth: 100 }}>
                <InputLabel>Año</InputLabel>
                <Select
                  name="año"
                  value={filtros.año}
                  onChange={handleFiltroChange}
                  label="Año"
                >
                  {años.map((año) => (
                    <MenuItem key={año} value={año}>
                      {año}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
              
              {/* Filtros adicionales para admin y secretaria */}
              {usuario && (usuario.rol === 'admin' || usuario.rol === 'secretaria') && (
                <>
                  <FormControl size="small" sx={{ minWidth: 200 }}>
                    <InputLabel>Obra</InputLabel>
                    <Select
                      name="id_obra"
                      value={filtros.id_obra}
                      onChange={handleFiltroChange}
                      label="Obra"
                    >
                      <MenuItem value="">Todas las obras</MenuItem>
                      {obras.map((obra) => (
                        <MenuItem key={obra.id_obra} value={obra.id_obra.toString()}>
                          {obra.nombre_obra}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                  
                  <FormControl size="small" sx={{ minWidth: 200 }} disabled={!filtros.id_obra}>
                    <InputLabel>Partida</InputLabel>
                    <Select
                      name="id_partida"
                      value={filtros.id_partida}
                      onChange={handleFiltroChange}
                      label="Partida"
                    >
                      <MenuItem value="">Todas las partidas</MenuItem>
                      {partidas.map((partida) => (
                        <MenuItem key={partida.id_partida} value={partida.id_partida.toString()}>
                          {partida.nombre_partida}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                  
                  <FormControl size="small" sx={{ minWidth: 200 }}>
                    <InputLabel>Trabajador</InputLabel>
                    <Select
                      name="chat_id"
                      value={filtros.chat_id}
                      onChange={handleFiltroChange}
                      label="Trabajador"
                    >
                      <MenuItem value="">Todos los trabajadores</MenuItem>
                      {trabajadores.map((trabajador) => (
                        <MenuItem key={trabajador.chat_id} value={trabajador.chat_id.toString()}>
                          {trabajador.nombre}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </>
              )}
            </Box>
          </Box>
        </Paper>

        {/* Tabla de horas */}
        <Paper elevation={3} className="overflow-hidden">
          {loading ? (
            <Box className="flex justify-center items-center p-10">
              <CircularProgress />
            </Box>
          ) : horas.length > 0 ? (
            <>
              <TableContainer>
                <Table aria-label="tabla de horas">
                  <TableHead className="bg-gray-100">
                    <TableRow>
                      <TableCell className="font-bold">Fecha</TableCell>
                      {usuario && (usuario.rol === 'admin' || usuario.rol === 'secretaria') && (
                        <TableCell className="font-bold">Trabajador</TableCell>
                      )}
                      <TableCell className="font-bold">Obra</TableCell>
                      <TableCell className="font-bold">Partida</TableCell>
                      <TableCell className="font-bold">Horas</TableCell>
                      <TableCell className="font-bold">Extra</TableCell>
                      <TableCell className="font-bold">Acciones</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {horas
                      .filter(hora => {
                        if (!filtros.busqueda) return true;
                        const busquedaMinuscula = filtros.busqueda.toLowerCase();
                        const nombreObra = obras.find(o => o.id_obra === hora.id_obra)?.nombre_obra || '';
                        const nombrePartida = hora.nombre_partida || '';
                        const nombreTrabajador = hora.nombre_trabajador || '';
                        return nombreObra.toLowerCase().includes(busquedaMinuscula) || 
                               nombrePartida.toLowerCase().includes(busquedaMinuscula) ||
                               nombreTrabajador.toLowerCase().includes(busquedaMinuscula);
                      })
                      .slice(page * rowsPerPage, rowsPerPage === -1 ? horas.length : page * rowsPerPage + rowsPerPage)
                      .map((hora) => (
                        <TableRow key={hora.id_movimiento} hover>
                          <TableCell>{formatearFecha(hora.fecha)}</TableCell>
                          {usuario && (usuario.rol === 'admin' || usuario.rol === 'secretaria') && (
                            <TableCell>{hora.nombre_trabajador || hora.chat_id || 'N/A'}</TableCell>
                          )}
                          <TableCell>{obras.find(o => o.id_obra === hora.id_obra)?.nombre_obra || 'N/A'}</TableCell>
                          <TableCell>{hora.nombre_partida || 'N/A'}</TableCell>
                          <TableCell>{hora.horas_totales}</TableCell>
                          <TableCell>
                            {hora.es_extra ? (
                              <Chip 
                                label={hora.tipo_extra === 'interno' ? 'Int' : 'Ext'}
                                color="warning"
                                size="small"
                              />
                            ) : (
                              '-'
                            )}
                          </TableCell>
                          <TableCell>
                            <Box className="flex gap-1">
                              <IconButton 
                                onClick={() => handleOpenEditModal(hora)}
                                color="secondary"
                                size="small"
                              >
                                <FaEdit />
                              </IconButton>
                              <IconButton 
                                onClick={() => confirmarEliminar(hora.id_movimiento)}
                                color="error"
                                size="small"
                              >
                                <FaTrash />
                              </IconButton>
                            </Box>
                          </TableCell>
                        </TableRow>
                      ))}
                  </TableBody>
                </Table>
              </TableContainer>
              <TablePagination
                rowsPerPageOptions={[5, 10, 25, { label: 'Todas', value: -1 }]}
                component="div"
                count={horas.length}
                rowsPerPage={rowsPerPage}
                page={page}
                onPageChange={handleChangePage}
                onRowsPerPageChange={handleChangeRowsPerPage}
                labelRowsPerPage="Filas por página"
              />
            </>
          ) : (
            <Box className="p-10 text-center">
              <Typography variant="h6" className="text-gray-500 mb-4">
                No se encontraron registros de horas para {meses[filtros.mes]} {filtros.año}
              </Typography>
              <Button
                component={Link}
                to="/horas/registrar"
                variant="contained"
                color="primary"
                startIcon={<FaPlus />}
              >
                Registrar Horas
              </Button>
            </Box>
          )}
        </Paper>
        
        {/* Modal de edición */}
        <Dialog 
          open={editModalOpen} 
          onClose={handleCloseEditModal}
          fullWidth
          maxWidth="md"
        >
          <DialogTitle>Editar Registro de Horas</DialogTitle>
          <DialogContent>
            {modalError && <Alert severity="error" sx={{ mb: 2 }}>{modalError}</Alert>}
            
            <Grid container spacing={2} sx={{ mt: 1 }}>
              {/* Obra (solo lectura) */}
              <Grid item xs={12} md={6}>
                <TextField
                  label="Obra"
                  value={nombreObra}
                  InputProps={{ readOnly: true }}
                  fullWidth
                />
              </Grid>
              
              {/* Partida */}
              <Grid item xs={12} md={6}>
                <FormControl fullWidth required>
                  <InputLabel>Partida</InputLabel>
                  <Select
                    value={partidaSeleccionada}
                    label="Partida"
                    onChange={(e) => setPartidaSeleccionada(e.target.value)}
                  >
                    <MenuItem value="">Selecciona una partida</MenuItem>
                    {partidas.map(p => (
                      <MenuItem key={p.id_partida} value={p.id_partida.toString()}>
                        {p.nombre_partida}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              
              {/* Tramos horarios */}
              <Grid item xs={12}>
                <Typography variant="subtitle1" gutterBottom>Tramos horarios</Typography>
                {tramos.map((tramo, idx) => (
                  <Box 
                    key={idx} 
                    display="flex" 
                    flexDirection="row" 
                    gap={1} 
                    alignItems="center" 
                    mb={2}
                    sx={{
                      p: 1,
                      border: '1px solid',
                      borderColor: 'divider',
                      borderRadius: 1,
                      backgroundColor: idx % 2 === 0 ? 'background.default' : 'background.paper'
                    }}
                  >
                    {/* Tramo inicio */}
                    <Box display="flex" gap={1} flex={1}>
                      <FormControl required>
                        <InputLabel>Hora inicio</InputLabel>
                        <Select
                          value={tramo.horaInicio}
                          label="Hora inicio"
                          onChange={e => handleTramoChange(idx, 'horaInicio', e.target.value)}
                        >
                          {HOUR_OPTIONS.map(h => <MenuItem key={h} value={h}>{h}</MenuItem>)}
                        </Select>
                      </FormControl>
                      <FormControl required>
                        <InputLabel>Minuto inicio</InputLabel>
                        <Select
                          value={tramo.minutoInicio}
                          label="Minuto inicio"
                          onChange={e => handleTramoChange(idx, 'minutoInicio', e.target.value)}
                        >
                          {MINUTE_OPTIONS.map(m => <MenuItem key={m} value={m}>{m}</MenuItem>)}
                        </Select>
                      </FormControl>
                    </Box>
                    
                    {/* Separador */}
                    <Box display="flex" alignItems="center" justifyContent="center" py={1}>
                      <Typography>-</Typography>
                    </Box>
                    
                    {/* Tramo fin */}
                    <Box display="flex" gap={1} flex={1}>
                      <FormControl required>
                        <InputLabel>Hora fin</InputLabel>
                        <Select
                          value={tramo.horaFin}
                          label="Hora fin"
                          onChange={e => handleTramoChange(idx, 'horaFin', e.target.value)}
                        >
                          {HOUR_OPTIONS.map(h => <MenuItem key={h} value={h}>{h}</MenuItem>)}
                        </Select>
                      </FormControl>
                      <FormControl required>
                        <InputLabel>Minuto fin</InputLabel>
                        <Select
                          value={tramo.minutoFin}
                          label="Minuto fin"
                          onChange={e => handleTramoChange(idx, 'minutoFin', e.target.value)}
                        >
                          {MINUTE_OPTIONS.map(m => <MenuItem key={m} value={m}>{m}</MenuItem>)}
                        </Select>
                      </FormControl>
                    </Box>
                    
                    {/* Botón eliminar */}
                    <Button
                      variant="outlined"
                      color="error"
                      size="small"
                      onClick={() => handleRemoveTramo(idx)}
                      disabled={tramos.length === 1}
                      sx={{ minWidth: 0, px: 1 }}
                    >
                      X
                    </Button>
                  </Box>
                ))}
                <Button variant="outlined" size="small" onClick={handleAddTramo} sx={{ mt: 1 }}>Añadir tramo</Button>
                <Typography mt={2} fontWeight={600}>Total de horas: {calcularTotalHoras().toFixed(2)}</Typography>
              </Grid>
              
              {/* Es extra */}
              <Grid item xs={12}>
                <FormControlLabel
                  control={<Switch checked={esExtra} onChange={(e) => setEsExtra(e.target.checked)} />}
                  label="¿Es extra?"
                />
              </Grid>
              
              {/* Tipo de extra y descripción (solo si es extra) */}
              {esExtra && (
                <>
                  <Grid item xs={12} md={6}>
                    <FormControl component="fieldset">
                      <RadioGroup
                        row
                        value={tipoExtra}
                        onChange={(e) => setTipoExtra(e.target.value)}
                      >
                        <FormControlLabel value="interno" control={<Radio />} label="Interno" />
                        <FormControlLabel value="externo" control={<Radio />} label="Externo" />
                      </RadioGroup>
                    </FormControl>
                  </Grid>
                  
                  <Grid item xs={12}>
                    <TextField
                      label="Descripción del extra"
                      value={descripcionExtra}
                      onChange={(e) => setDescripcionExtra(e.target.value)}
                      fullWidth
                      required={esExtra}
                    />
                  </Grid>
                </>
              )}
            </Grid>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleCloseEditModal}>Cancelar</Button>
            <Button 
              onClick={handleSaveEdit}
              variant="contained" 
              color="primary"
              disabled={editLoading}
            >
              {editLoading ? 'Guardando...' : 'Guardar Cambios'}
            </Button>
          </DialogActions>
        </Dialog>
      </Box>
    </Layout>
  );
};

export default ListaHoras; 