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

const ListaHoras = () => {
  const [horas, setHoras] = useState([]);
  const [obras, setObras] = useState([]);
  const [partidas, setPartidas] = useState([]);
  const [trabajadores, setTrabajadores] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [totalHoras, setTotalHoras] = useState(0);
  const [userInfo, setUserInfo] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  
  // Estados para filtros
  const [filtros, setFiltros] = useState({
    fecha_inicio: '',
    fecha_fin: '',
    id_obra: '',
    id_partida: '',
    chat_id: '',
    es_extra: '',
    busqueda: ''
  });
  
  // Estados para el modal de eliminación
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [horaToDelete, setHoraToDelete] = useState(null);
  
  // Estados para filtros avanzados
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [filtroTiempo, setFiltroTiempo] = useState('mes_actual'); // 'mes_actual', 'personalizado', 'todo'

  useEffect(() => {
    const initializeData = async () => {
      try {
        // Obtener información del usuario
        const userResponse = await horasService.getUserInfo();
        setUserInfo(userResponse);
        setIsAdmin(userResponse.rol === 'admin');
        
        // Si no es admin, filtrar por su chat_id
        if (userResponse.rol !== 'admin') {
          setFiltros(prev => ({ ...prev, chat_id: userResponse.chat_id }));
        }
        
        // Cargar datos iniciales
        await Promise.all([
          loadObras(),
          loadTrabajadores()
        ]);
        
        // Establecer filtro de fecha por defecto (mes actual)
        const now = new Date();
        const inicioMes = startOfMonth(now);
        const finMes = endOfMonth(now);
        
        const filtrosIniciales = {
          fecha_inicio: format(inicioMes, 'yyyy-MM-dd'),
          fecha_fin: format(finMes, 'yyyy-MM-dd'),
          chat_id: userResponse.rol !== 'admin' ? userResponse.chat_id : ''
        };
        
        setFiltros(prev => ({ ...prev, ...filtrosIniciales }));
        
        // Cargar horas con filtros iniciales
        await loadHoras(filtrosIniciales);
        
      } catch (error) {
        console.error('Error al inicializar:', error);
        setError('Error al cargar los datos iniciales');
      } finally {
        setLoading(false);
      }
    };

    initializeData();
  }, []);

  const loadHoras = async (filtrosActuales = filtros) => {
    try {
      setLoading(true);
      
      // Limpiar filtros vacíos
      const filtrosLimpios = Object.entries(filtrosActuales).reduce((acc, [key, value]) => {
        if (value !== '' && value !== null && value !== undefined) {
          acc[key] = value;
        }
        return acc;
      }, {});
      
      const response = await horasService.getHoras({
        ...filtrosLimpios,
        page: page + 1,
        limit: rowsPerPage
      });
      
      if (response && Array.isArray(response.horas)) {
        setHoras(response.horas);
        setTotalHoras(response.total || response.horas.length);
      } else if (Array.isArray(response)) {
        setHoras(response);
        setTotalHoras(response.length);
      } else {
        setHoras([]);
        setTotalHoras(0);
      }
    } catch (error) {
      console.error('Error al cargar horas:', error);
      setError('Error al cargar las horas');
      setHoras([]);
      setTotalHoras(0);
    } finally {
      setLoading(false);
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

  const loadPartidas = async (idObra) => {
    if (!idObra) {
      setPartidas([]);
      return;
    }
    
    try {
      const response = await partidasService.getPartidasPorObra(idObra);
      setPartidas(Array.isArray(response) ? response : []);
    } catch (error) {
      console.error('Error al cargar partidas:', error);
      setPartidas([]);
    }
  };

  const loadTrabajadores = async () => {
    try {
      const response = await trabajadoresService.getTrabajadores();
      setTrabajadores(Array.isArray(response) ? response : []);
    } catch (error) {
      console.error('Error al cargar trabajadores:', error);
    }
  };

  const handleFiltroChange = (campo, valor) => {
    const nuevosFiltros = { ...filtros, [campo]: valor };
    
    // Si cambia la obra, limpiar partida y cargar nuevas partidas
    if (campo === 'id_obra') {
      nuevosFiltros.id_partida = '';
      loadPartidas(valor);
    }
    
    setFiltros(nuevosFiltros);
  };

  const handleFiltroTiempoChange = (nuevoFiltro) => {
    setFiltroTiempo(nuevoFiltro);
    
    const now = new Date();
    let nuevosFiltros = { ...filtros };
    
    switch (nuevoFiltro) {
      case 'mes_actual':
        const inicioMes = startOfMonth(now);
        const finMes = endOfMonth(now);
        nuevosFiltros.fecha_inicio = format(inicioMes, 'yyyy-MM-dd');
        nuevosFiltros.fecha_fin = format(finMes, 'yyyy-MM-dd');
        break;
      case 'todo':
        nuevosFiltros.fecha_inicio = '';
        nuevosFiltros.fecha_fin = '';
        break;
      case 'personalizado':
        // Mantener las fechas actuales
        break;
    }
    
    setFiltros(nuevosFiltros);
  };

  const aplicarFiltros = () => {
    setPage(0); // Resetear a la primera página
    loadHoras();
  };

  const limpiarFiltros = () => {
    const filtrosLimpios = {
      fecha_inicio: '',
      fecha_fin: '',
      id_obra: '',
      id_partida: '',
      chat_id: isAdmin ? '' : userInfo?.chat_id || '',
      es_extra: '',
      busqueda: ''
    };
    
    setFiltros(filtrosLimpios);
    setFiltroTiempo('todo');
    setPartidas([]);
    setPage(0);
  };

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handleDeleteClick = (hora) => {
    setHoraToDelete(hora);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!horaToDelete) return;
    
    try {
      await horasService.deleteHora(horaToDelete.id_movimiento);
      setDeleteDialogOpen(false);
      setHoraToDelete(null);
      loadHoras(); // Recargar la lista
    } catch (error) {
      console.error('Error al eliminar hora:', error);
      setError('Error al eliminar el registro de horas');
    }
  };

  const handleDeleteCancel = () => {
    setDeleteDialogOpen(false);
    setHoraToDelete(null);
  };

  // Efecto para recargar cuando cambian page o rowsPerPage
  useEffect(() => {
    if (userInfo) {
      loadHoras();
    }
  }, [page, rowsPerPage]);

  const formatearFecha = (fecha) => {
    if (!fecha) return '-';
    try {
      return format(new Date(fecha), 'dd/MM/yyyy', { locale: es });
    } catch (error) {
      return fecha;
    }
  };

  const formatearHora = (hora) => {
    if (!hora) return '-';
    try {
      // Si es una cadena de tiempo (HH:MM:SS), extraer solo HH:MM
      if (typeof hora === 'string' && hora.includes(':')) {
        return hora.substring(0, 5);
      }
      return hora;
    } catch (error) {
      return hora;
    }
  };

  const obtenerNombreObra = (idObra) => {
    const obra = obras.find(o => o.id_obra === idObra);
    return obra ? obra.nombre_obra : `Obra ${idObra}`;
  };

  const obtenerNombreTrabajador = (chatId) => {
    const trabajador = trabajadores.find(t => t.chat_id === chatId);
    return trabajador ? trabajador.nombre : chatId;
  };

  if (loading && horas.length === 0) {
    return (
      <Layout>
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
          <CircularProgress />
        </Box>
      </Layout>
    );
  }

  return (
    <Layout>
      <Box sx={{ p: 3 }}>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
          <Typography variant="h4" component="h1">
            <FaCalendarAlt style={{ marginRight: '10px', color: '#1976d2' }} />
            Lista de Horas
          </Typography>
          <Button
            component={Link}
            to="/horas/registrar"
            variant="contained"
            startIcon={<FaPlus />}
            sx={{ bgcolor: '#4caf50', '&:hover': { bgcolor: '#45a049' } }}
          >
            Registrar Horas
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
          
          {/* Filtro de tiempo rápido */}
          <Box mb={2}>
            <FormControl component="fieldset">
              <RadioGroup
                row
                value={filtroTiempo}
                onChange={(e) => handleFiltroTiempoChange(e.target.value)}
              >
                <FormControlLabel value="mes_actual" control={<Radio />} label="Mes actual" />
                <FormControlLabel value="personalizado" control={<Radio />} label="Fechas personalizadas" />
                <FormControlLabel value="todo" control={<Radio />} label="Todas las fechas" />
              </RadioGroup>
            </FormControl>
          </Box>

          <Grid container spacing={2} alignItems="center">
            {/* Fechas */}
            {filtroTiempo === 'personalizado' && (
              <>
                <Grid item xs={12} sm={6} md={2}>
                  <TextField
                    fullWidth
                    type="date"
                    label="Fecha inicio"
                    value={filtros.fecha_inicio}
                    onChange={(e) => handleFiltroChange('fecha_inicio', e.target.value)}
                    InputLabelProps={{ shrink: true }}
                    size="small"
                  />
                </Grid>
                <Grid item xs={12} sm={6} md={2}>
                  <TextField
                    fullWidth
                    type="date"
                    label="Fecha fin"
                    value={filtros.fecha_fin}
                    onChange={(e) => handleFiltroChange('fecha_fin', e.target.value)}
                    InputLabelProps={{ shrink: true }}
                    size="small"
                  />
                </Grid>
              </>
            )}

            {/* Búsqueda */}
            <Grid item xs={12} sm={6} md={3}>
              <TextField
                fullWidth
                placeholder="Buscar..."
                value={filtros.busqueda}
                onChange={(e) => handleFiltroChange('busqueda', e.target.value)}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <FaSearch />
                    </InputAdornment>
                  ),
                }}
                size="small"
              />
            </Grid>

            {/* Obra */}
            <Grid item xs={12} sm={6} md={2}>
              <FormControl fullWidth size="small">
                <InputLabel>Obra</InputLabel>
                <Select
                  value={filtros.id_obra}
                  label="Obra"
                  onChange={(e) => handleFiltroChange('id_obra', e.target.value)}
                >
                  <MenuItem value="">Todas</MenuItem>
                  {obras.map((obra) => (
                    <MenuItem key={obra.id_obra} value={obra.id_obra}>
                      {obra.nombre_obra}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            {/* Partida */}
            <Grid item xs={12} sm={6} md={2}>
              <FormControl fullWidth size="small">
                <InputLabel>Partida</InputLabel>
                <Select
                  value={filtros.id_partida}
                  label="Partida"
                  onChange={(e) => handleFiltroChange('id_partida', e.target.value)}
                  disabled={!filtros.id_obra}
                >
                  <MenuItem value="">Todas</MenuItem>
                  {partidas.map((partida) => (
                    <MenuItem key={partida.id_partida} value={partida.id_partida}>
                      {partida.nombre_partida}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            {/* Trabajador (solo para admin) */}
            {isAdmin && (
              <Grid item xs={12} sm={6} md={2}>
                <FormControl fullWidth size="small">
                  <InputLabel>Trabajador</InputLabel>
                  <Select
                    value={filtros.chat_id}
                    label="Trabajador"
                    onChange={(e) => handleFiltroChange('chat_id', e.target.value)}
                  >
                    <MenuItem value="">Todos</MenuItem>
                    {trabajadores.map((trabajador) => (
                      <MenuItem key={trabajador.chat_id} value={trabajador.chat_id}>
                        {trabajador.nombre}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
            )}
          </Grid>

          {/* Filtros avanzados */}
          <Box mt={2}>
            <FormControlLabel
              control={
                <Switch
                  checked={showAdvancedFilters}
                  onChange={(e) => setShowAdvancedFilters(e.target.checked)}
                />
              }
              label="Filtros avanzados"
            />
          </Box>

          {showAdvancedFilters && (
            <Grid container spacing={2} sx={{ mt: 1 }}>
              <Grid item xs={12} sm={6} md={3}>
                <FormControl fullWidth size="small">
                  <InputLabel>Tipo de horas</InputLabel>
                  <Select
                    value={filtros.es_extra}
                    label="Tipo de horas"
                    onChange={(e) => handleFiltroChange('es_extra', e.target.value)}
                  >
                    <MenuItem value="">Todas</MenuItem>
                    <MenuItem value="false">Normales</MenuItem>
                    <MenuItem value="true">Extras</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
            </Grid>
          )}

          {/* Botones */}
          <Box mt={2} display="flex" gap={1}>
            <Button
              variant="contained"
              onClick={aplicarFiltros}
              startIcon={<FaSearch />}
            >
              Aplicar Filtros
            </Button>
            <Button
              variant="outlined"
              onClick={limpiarFiltros}
            >
              Limpiar
            </Button>
          </Box>
        </Paper>

        {/* Tabla */}
        <Paper>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Fecha</TableCell>
                  <TableCell>Trabajador</TableCell>
                  <TableCell>Obra</TableCell>
                  <TableCell>Partida</TableCell>
                  <TableCell>Inicio</TableCell>
                  <TableCell>Fin</TableCell>
                  <TableCell>Horas</TableCell>
                  <TableCell>Tipo</TableCell>
                  <TableCell>Acciones</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={9} align="center">
                      <CircularProgress size={24} />
                    </TableCell>
                  </TableRow>
                ) : horas.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={9} align="center">
                      No se encontraron registros
                    </TableCell>
                  </TableRow>
                ) : (
                  horas.map((hora) => (
                    <TableRow key={hora.id_movimiento}>
                      <TableCell>{formatearFecha(hora.fecha)}</TableCell>
                      <TableCell>{obtenerNombreTrabajador(hora.chat_id)}</TableCell>
                      <TableCell>{obtenerNombreObra(hora.id_obra)}</TableCell>
                      <TableCell>{hora.nombre_partida || '-'}</TableCell>
                      <TableCell>{formatearHora(hora.hora_inicio)}</TableCell>
                      <TableCell>{formatearHora(hora.hora_fin)}</TableCell>
                      <TableCell>{hora.horas_totales || '-'}</TableCell>
                      <TableCell>
                        <Chip
                          label={hora.es_extra ? 'Extra' : 'Normal'}
                          color={hora.es_extra ? 'warning' : 'primary'}
                          size="small"
                        />
                      </TableCell>
                      <TableCell>
                        <Box display="flex" gap={1}>
                          <IconButton
                            size="small"
                            color="primary"
                            title="Ver detalles"
                          >
                            <FaEye />
                          </IconButton>
                          <IconButton
                            size="small"
                            color="secondary"
                            title="Editar"
                          >
                            <FaEdit />
                          </IconButton>
                          <IconButton
                            size="small"
                            color="error"
                            title="Eliminar"
                            onClick={() => handleDeleteClick(hora)}
                          >
                            <FaTrash />
                          </IconButton>
                        </Box>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>
          
          <TablePagination
            rowsPerPageOptions={[5, 10, 25, 50]}
            component="div"
            count={totalHoras}
            rowsPerPage={rowsPerPage}
            page={page}
            onPageChange={handleChangePage}
            onRowsPerPageChange={handleChangeRowsPerPage}
            labelRowsPerPage="Filas por página:"
            labelDisplayedRows={({ from, to, count }) => `${from}-${to} de ${count}`}
          />
        </Paper>

        {/* Dialog de confirmación de eliminación */}
        <Dialog
          open={deleteDialogOpen}
          onClose={handleDeleteCancel}
        >
          <DialogTitle>Confirmar eliminación</DialogTitle>
          <DialogContent>
            <Typography>
              ¿Estás seguro de que quieres eliminar este registro de horas?
              {horaToDelete && (
                <Box mt={1}>
                  <strong>Fecha:</strong> {formatearFecha(horaToDelete.fecha)}<br/>
                  <strong>Trabajador:</strong> {obtenerNombreTrabajador(horaToDelete.chat_id)}<br/>
                  <strong>Horas:</strong> {horaToDelete.horas_totales}
                </Box>
              )}
            </Typography>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleDeleteCancel}>Cancelar</Button>
            <Button onClick={handleDeleteConfirm} color="error" variant="contained">
              Eliminar
            </Button>
          </DialogActions>
        </Dialog>
      </Box>
    </Layout>
  );
};

export default ListaHoras;