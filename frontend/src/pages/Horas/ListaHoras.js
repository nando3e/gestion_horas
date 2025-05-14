import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Layout from '../../components/Layout/Layout';
import horasService from '../../services/horasService';
import obrasService from '../../services/obrasService';
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
  MenuItem
} from '@mui/material';
import { 
  FaPlus, 
  FaSearch, 
  FaEdit, 
  FaEye, 
  FaTrash,
  FaCalendarAlt
} from 'react-icons/fa';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

const ListaHoras = () => {
  const [usuario, setUsuario] = useState(null);
  const [obras, setObras] = useState([]);
  const [horas, setHoras] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Estado para la paginación
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  
  // Estado para filtros
  const [filtros, setFiltros] = useState({
    busqueda: '',
    fechaInicio: '',
    fechaFin: '',
    esExtra: ''
  });

  useEffect(() => {
    const cargarHoras = async () => {
      try {
        setLoading(true);
        // Cargar usuario actual
        const user = authService.getCurrentUser();
        setUsuario(user);
        // Cargar obras
        const obrasData = await obrasService.getObras();
        setObras(obrasData);
        const data = await horasService.getHoras();
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
  };

  // Aplicar filtros
  const aplicarFiltros = () => {
    // Aquí implementaríamos la lógica para filtrar
    // Por ahora es un placeholder
    console.log('Aplicando filtros:', filtros);
  };

  // Restablecer filtros
  const restablecerFiltros = () => {
    setFiltros({
      busqueda: '',
      fechaInicio: '',
      fechaFin: '',
      esExtra: ''
    });
  };

  // Confirmar eliminación
  const confirmarEliminar = (id) => {
    // Aquí iría la lógica para mostrar un diálogo de confirmación
    // Por ahora simplemente mostramos un alert
    if (window.confirm('¿Estás seguro de que quieres eliminar este registro?')) {
      eliminarHora(id);
    }
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

  return (
    <Layout>
      <Box className="pb-6">
        <Box className="flex justify-between items-center mb-6">
          <Typography variant="h4" component="h1" className="font-bold text-gray-800">
            Mis Horas
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

        {error && (
          <Alert severity="error" className="mb-6">
            {error}
          </Alert>
        )}

        {/* Filtros */}
        <Paper elevation={2} className="p-4 mb-6">
          <Typography variant="h6" className="mb-4">Filtros</Typography>
          <Box className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <TextField
              name="busqueda"
              label="Buscar"
              value={filtros.busqueda}
              onChange={handleFiltroChange}
              fullWidth
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <FaSearch />
                  </InputAdornment>
                ),
              }}
            />
            <TextField
              name="fechaInicio"
              label="Fecha inicio"
              type="date"
              value={filtros.fechaInicio}
              onChange={handleFiltroChange}
              fullWidth
              InputLabelProps={{ shrink: true }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <FaCalendarAlt />
                  </InputAdornment>
                ),
              }}
            />
            <TextField
              name="fechaFin"
              label="Fecha fin"
              type="date"
              value={filtros.fechaFin}
              onChange={handleFiltroChange}
              fullWidth
              InputLabelProps={{ shrink: true }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <FaCalendarAlt />
                  </InputAdornment>
                ),
              }}
            />
            <FormControl fullWidth>
              <InputLabel>Tipo</InputLabel>
              <Select
                name="esExtra"
                value={filtros.esExtra}
                onChange={handleFiltroChange}
                label="Tipo"
              >
                <MenuItem value="">Todos</MenuItem>
                <MenuItem value="true">Horas Extra</MenuItem>
                <MenuItem value="false">Horas Regulares</MenuItem>
              </Select>
            </FormControl>
          </Box>
          <Box className="flex justify-end mt-4 gap-2">
            <Button
              variant="outlined"
              onClick={restablecerFiltros}
              className="mr-2"
            >
              Restablecer
            </Button>
            <Button
              variant="contained"
              onClick={aplicarFiltros}
            >
              Aplicar Filtros
            </Button>
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
                      <TableCell className="font-bold">Tipo</TableCell>
                      <TableCell className="font-bold">Acciones</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {horas
                      .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
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
                            <Chip 
                              label={hora.es_extra ? "Extra" : "Regular"}
                              color={hora.es_extra ? "warning" : "primary"}
                              size="small"
                            />
                          </TableCell>
                          <TableCell>
                            <Box className="flex gap-1">
                              <IconButton 
                                component={Link} 
                                to={`/horas/${hora.id_movimiento}`}
                                color="primary"
                                size="small"
                              >
                                <FaEye />
                              </IconButton>
                              <IconButton 
                                component={Link} 
                                to={`/horas/${hora.id_movimiento}/editar`}
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
                rowsPerPageOptions={[5, 10, 25]}
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
                No se encontraron registros de horas
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
      </Box>
    </Layout>
  );
};

export default ListaHoras; 