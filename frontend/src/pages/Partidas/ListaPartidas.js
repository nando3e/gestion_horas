import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Layout from '../../components/Layout/Layout';
import partidasService from '../../services/partidasService';
import obrasService from '../../services/obrasService';
import horasService from '../../services/horasService';
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
  CircularProgress,
  Alert,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  TextField,
  Tooltip,
  Chip,
  Switch,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormControlLabel
} from '@mui/material';
import { 
  FaPlus, 
  FaEdit, 
  FaTrash,
  FaTasks,
  FaBuilding,
  FaSearch,
  FaCheck,
  FaFilter
} from 'react-icons/fa';

const ListaPartidas = () => {
  const [partidas, setPartidas] = useState([]);
  const [obras, setObras] = useState([]);
  const [horas, setHoras] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Estado para la paginación
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  
  // Estado para la búsqueda y filtros
  const [searchTerm, setSearchTerm] = useState('');
  const [filtroObra, setFiltroObra] = useState('');
  const [filtroAcabada, setFiltroAcabada] = useState('');
  
  // Estado para diálogos
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedPartida, setSelectedPartida] = useState(null);
  
  // Estado para formulario
  const [formData, setFormData] = useState({
    nombre: '',
    descripcion: '',
    id_obra: '',
    acabada: false
  });

  // Cargar datos iniciales
  useEffect(() => {
    const cargarDatos = async () => {
      try {
        setLoading(true);
        
        // Cargar obras y partidas simultáneamente
        const [partidasData, obrasData] = await Promise.all([
          partidasService.getPartidas(),
          obrasService.getObras()
        ]);
        
        setPartidas(partidasData);
        setObras(obrasData);
        setError('');
      } catch (err) {
        console.error('Error al cargar datos:', err);
        setError('No se pudieron cargar los datos. Por favor, inténtalo de nuevo.');
      } finally {
        setLoading(false);
      }
    };

    cargarDatos();
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
  
  // Manejar cambio en el término de búsqueda
  const handleSearchChange = (event) => {
    setSearchTerm(event.target.value);
    setPage(0); // Resetear a la primera página
  };
  
  // Manejar cambio en el filtro de obra
  const handleFiltroObraChange = (event) => {
    setFiltroObra(event.target.value);
    setPage(0);
  };
  
  // Manejar cambio en el filtro de acabada
  const handleFiltroAcabadaChange = (event) => {
    setFiltroAcabada(event.target.value);
    setPage(0);
  };
  
  // Limpiar todos los filtros
  const handleLimpiarFiltros = () => {
    setSearchTerm('');
    setFiltroObra('');
    setFiltroAcabada('');
    setPage(0);
  };
  
  // Obtener nombre de la obra
  const getNombreObra = (idObra) => {
    const obra = obras.find(o => o.id_obra === idObra);
    return obra ? obra.nombre_obra : 'Obra no encontrada';
  };
  
  // Filtrar partidas según criterios
  const filteredPartidas = partidas.filter(partida => {
    // Filtro por texto de búsqueda en nombre o descripción
    const matchesSearch = 
      (partida.nombre_partida ? partida.nombre_partida.toLowerCase().includes(searchTerm.toLowerCase()) : false) ||
      (partida.descripcion ? partida.descripcion.toLowerCase().includes(searchTerm.toLowerCase()) : false);
    
    // Filtro por obra
    const matchesObra = filtroObra ? partida.id_obra === parseInt(filtroObra) : true;
    
    // Filtro por estado de acabada
    const matchesAcabada = filtroAcabada === '' ? true : 
                            filtroAcabada === 'true' ? partida.acabada === true : 
                            partida.acabada === false;
    
    return matchesSearch && matchesObra && matchesAcabada;
  }).sort((a, b) => {
    // Ordenar por nombre de obra
    const obraA = obras.find(o => o.id_obra === a.id_obra)?.nombre_obra || '';
    const obraB = obras.find(o => o.id_obra === b.id_obra)?.nombre_obra || '';
    return obraA.localeCompare(obraB);
  });
  
  // Cambios en el formulario
  const handleFormChange = (e) => {
    const { name, value, checked, type } = e.target;
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? checked : value
    });
  };
  
  // Abrir diálogo para nueva partida
  const handleOpenNewDialog = () => {
    setFormData({
      nombre: '',
      descripcion: '',
      id_obra: '',
      acabada: false
    });
    setDialogOpen(true);
    setSelectedPartida(null);
  };
  
  // Abrir diálogo para editar partida
  const handleOpenEditDialog = (partida) => {
    setFormData({
      nombre: partida.nombre_partida,
      descripcion: partida.descripcion || '',
      id_obra: partida.id_obra.toString(),
      acabada: partida.acabada || false
    });
    setSelectedPartida(partida);
    setDialogOpen(true);
  };
  
  // Abrir diálogo de confirmación para eliminar
  const handleOpenDeleteDialog = (partida) => {
    setSelectedPartida(partida);
    setDeleteDialogOpen(true);
  };
  
  // Cerrar diálogos
  const handleCloseDialog = () => {
    setDialogOpen(false);
    setSelectedPartida(null);
  };
  
  const handleCloseDeleteDialog = () => {
    setDeleteDialogOpen(false);
    setSelectedPartida(null);
  };
  
  // Guardar partida (crear o actualizar)
  const handleGuardarPartida = async () => {
    try {
      // Validaciones básicas
      if (!formData.nombre) {
        alert('El nombre de la partida es obligatorio');
        return;
      }
      
      if (!formData.id_obra) {
        alert('Debe seleccionar una obra');
        return;
      }
      
      // Preparar datos para enviar al servidor
      const partidaData = {
        nombre_partida: formData.nombre,
        descripcion: formData.descripcion,
        id_obra: parseInt(formData.id_obra),
        acabada: formData.acabada
      };
      
      let result;
      
      if (selectedPartida) {
        // Actualizar partida existente
        result = await partidasService.updatePartida(selectedPartida.id_partida, partidaData);
        
        // Actualizar la lista de partidas
        setPartidas(partidas.map(p => p.id_partida === result.id_partida ? result : p));
      } else {
        // Crear nueva partida
        result = await partidasService.createPartida(partidaData);
        
        // Actualizar la lista de partidas
        setPartidas([...partidas, result]);
      }
      
      handleCloseDialog();
      alert(selectedPartida ? 'Partida actualizada con éxito' : 'Partida creada con éxito');
    } catch (err) {
      console.error('Error al guardar partida:', err);
      alert(`Error: ${err.response?.data?.detail || 'No se pudo guardar la partida'}`);
    }
  };
  
  // Eliminar partida
  const handleEliminarPartida = async () => {
    try {
      await partidasService.deletePartida(selectedPartida.id_partida);
      
      // Actualizar la lista de partidas
      setPartidas(partidas.filter(p => p.id_partida !== selectedPartida.id_partida));
      
      handleCloseDeleteDialog();
      alert('Partida eliminada con éxito');
    } catch (err) {
      console.error('Error al eliminar partida:', err);
      alert(`Error: ${err.response?.data?.detail || 'No se pudo eliminar la partida'}`);
    }
  };
  
  // Cambiar estado "acabada" de una partida
  const handleToggleAcabada = async (partida) => {
    try {
      const nuevoEstado = !partida.acabada;
      
      // Llamar a la API para actualizar
      const result = await partidasService.updatePartida(partida.id_partida, {
        acabada: nuevoEstado
      });
      
      // Actualizar localmente
      setPartidas(partidas.map(p => p.id_partida === partida.id_partida ? result : p));
    } catch (err) {
      console.error('Error al cambiar estado de partida:', err);
      alert(`Error: ${err.response?.data?.detail || 'No se pudo actualizar el estado de la partida'}`);
    }
  };

  return (
    <Layout>
      <Box className="pb-6">
        <Box className="flex justify-between items-center mb-6">
          <Typography variant="h4" component="h1" className="font-bold text-gray-800">
            Gestión de Partidas
          </Typography>
          <Button
            variant="contained"
            color="primary"
            startIcon={<FaPlus />}
            onClick={handleOpenNewDialog}
            disabled={obras.length === 0}
          >
            Nueva Partida
          </Button>
        </Box>

        {error && (
          <Alert severity="error" className="mb-6">
            {error}
          </Alert>
        )}
        
        {obras.length === 0 && !loading && !error && (
          <Alert severity="warning" className="mb-6">
            No hay obras registradas. Debe crear al menos una obra antes de poder añadir partidas.
          </Alert>
        )}

        {/* Filtros */}
        <Paper elevation={2} className="p-4 mb-6">
          <Box className="flex flex-col md:flex-row gap-4">
            <Box className="flex-1">
              <Box className="flex items-center">
                <FaSearch className="text-gray-400 mr-2" />
                <TextField
                  label="Buscar partidas"
                  variant="outlined"
                  fullWidth
                  size="small"
                  value={searchTerm}
                  onChange={handleSearchChange}
                  placeholder="Buscar por nombre o descripción..."
                />
              </Box>
            </Box>
            
            <Box className="flex gap-4">
              <FormControl size="small" sx={{ minWidth: 200 }}>
                <InputLabel>Filtrar por Obra</InputLabel>
                <Select
                  value={filtroObra}
                  onChange={handleFiltroObraChange}
                  label="Filtrar por Obra"
                >
                  <MenuItem value="">Todas las obras</MenuItem>
                  {obras.map((obra) => (
                    <MenuItem key={obra.id_obra} value={obra.id_obra.toString()}>
                      {obra.nombre_obra}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
              
              <FormControl size="small" sx={{ minWidth: 150 }}>
                <InputLabel>Estado</InputLabel>
                <Select
                  value={filtroAcabada}
                  onChange={handleFiltroAcabadaChange}
                  label="Estado"
                >
                  <MenuItem value="">Todos</MenuItem>
                  <MenuItem value="true">Acabadas</MenuItem>
                  <MenuItem value="false">Pendientes</MenuItem>
                </Select>
              </FormControl>
              
              <Button
                variant="outlined"
                color="primary"
                startIcon={<FaFilter />}
                onClick={handleLimpiarFiltros}
                sx={{ height: 40 }}
              >
                Limpiar
              </Button>
            </Box>
          </Box>
        </Paper>

        {/* Tabla de partidas */}
        <Paper elevation={3} className="overflow-hidden">
          {loading ? (
            <Box className="flex justify-center items-center p-10">
              <CircularProgress />
            </Box>
          ) : filteredPartidas.length > 0 ? (
            <>
              <TableContainer>
                <Table aria-label="tabla de partidas">
                  <TableHead className="bg-gray-100">
                    <TableRow>
                      <TableCell className="font-bold">Obra</TableCell>
                      <TableCell className="font-bold">Nombre</TableCell>
                      <TableCell className="font-bold">Descripción</TableCell>
                      <TableCell className="font-bold">Estado</TableCell>
                      <TableCell className="font-bold">Acciones</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {filteredPartidas
                      .slice(page * rowsPerPage, rowsPerPage === -1 ? filteredPartidas.length : page * rowsPerPage + rowsPerPage)
                      .map((partida) => (
                        <TableRow key={partida.id_partida} hover>
                          <TableCell>
                            <Box className="flex items-center">
                              <FaBuilding className="text-secondary-600 mr-2 text-sm" />
                              <span>{getNombreObra(partida.id_obra)}</span>
                            </Box>
                          </TableCell>
                          <TableCell>
                            <Box className="flex items-center">
                              <FaTasks className="text-primary-600 mr-2" />
                              <span>{partida.nombre_partida}</span>
                            </Box>
                          </TableCell>
                          <TableCell>{partida.descripcion || '—'}</TableCell>
                          <TableCell>
                            <FormControlLabel
                              control={
                                <Switch
                                  checked={partida.acabada || false}
                                  onChange={() => handleToggleAcabada(partida)}
                                  color="success"
                                />
                              }
                              label={
                                <Chip 
                                  label={partida.acabada ? "Acabada" : "Pendiente"} 
                                  color={partida.acabada ? "success" : "default"}
                                  size="small"
                                  icon={partida.acabada ? <FaCheck size={12} /> : null}
                                />
                              }
                            />
                          </TableCell>
                          <TableCell>
                            <Box className="flex gap-1">
                              <Tooltip title="Editar partida">
                                <IconButton 
                                  onClick={() => handleOpenEditDialog(partida)}
                                  color="primary"
                                  size="small"
                                >
                                  <FaEdit />
                                </IconButton>
                              </Tooltip>
                              <Tooltip title="Eliminar partida">
                                <IconButton 
                                  onClick={() => handleOpenDeleteDialog(partida)}
                                  color="error"
                                  size="small"
                                >
                                  <FaTrash />
                                </IconButton>
                              </Tooltip>
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
                count={filteredPartidas.length}
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
                {(searchTerm || filtroObra || filtroAcabada)
                  ? 'No se encontraron partidas que coincidan con los filtros'
                  : 'No hay partidas registradas'}
              </Typography>
              {(searchTerm || filtroObra || filtroAcabada) ? (
                <Button
                  variant="outlined"
                  color="primary"
                  onClick={handleLimpiarFiltros}
                >
                  Limpiar Filtros
                </Button>
              ) : obras.length > 0 ? (
                <Button
                  variant="contained"
                  color="primary"
                  startIcon={<FaPlus />}
                  onClick={handleOpenNewDialog}
                >
                  Crear Primera Partida
                </Button>
              ) : (
                <Button
                  variant="contained"
                  color="primary"
                  component={Link}
                  to="/obras"
                >
                  Ir a Gestión de Obras
                </Button>
              )}
            </Box>
          )}
        </Paper>
      </Box>

      {/* Diálogo para crear/editar partida */}
      <Dialog 
        open={dialogOpen} 
        onClose={handleCloseDialog}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          {selectedPartida ? 'Editar Partida' : 'Nueva Partida'}
        </DialogTitle>
        <DialogContent>
          <Box className="space-y-4 pt-2">
            <TextField
              name="nombre"
              label="Nombre de la Partida"
              value={formData.nombre}
              onChange={handleFormChange}
              fullWidth
              required
            />
            
            <FormControl fullWidth required>
              <InputLabel>Obra</InputLabel>
              <Select
                name="id_obra"
                value={formData.id_obra}
                onChange={handleFormChange}
                label="Obra"
              >
                {obras.map((obra) => (
                  <MenuItem key={obra.id_obra} value={obra.id_obra.toString()}>
                    {obra.nombre_obra}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            
            <TextField
              name="descripcion"
              label="Descripción"
              value={formData.descripcion}
              onChange={handleFormChange}
              fullWidth
              multiline
              rows={3}
            />
            
            <FormControlLabel
              control={
                <Switch
                  name="acabada"
                  checked={formData.acabada}
                  onChange={handleFormChange}
                  color="success"
                />
              }
              label={formData.acabada ? "Acabada" : "Pendiente"}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog} color="inherit">
            Cancelar
          </Button>
          <Button 
            onClick={handleGuardarPartida} 
            color="primary" 
            variant="contained"
          >
            Guardar
          </Button>
        </DialogActions>
      </Dialog>

      {/* Diálogo de confirmación para eliminar */}
      <Dialog
        open={deleteDialogOpen}
        onClose={handleCloseDeleteDialog}
      >
        <DialogTitle>
          Confirmar Eliminación
        </DialogTitle>
        <DialogContent>
          <DialogContentText>
            ¿Estás seguro de que quieres eliminar la partida <strong>{selectedPartida?.nombre_partida}</strong>?
            Esta acción no se puede deshacer.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDeleteDialog} color="inherit">
            Cancelar
          </Button>
          <Button 
            onClick={handleEliminarPartida} 
            color="error" 
            variant="contained"
          >
            Eliminar
          </Button>
        </DialogActions>
      </Dialog>
    </Layout>
  );
};

export default ListaPartidas; 