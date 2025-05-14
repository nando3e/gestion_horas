import React, { useState, useEffect } from 'react';
import Layout from '../../components/Layout/Layout';
import trabajadoresService from '../../services/trabajadoresService';
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
  Tooltip
} from '@mui/material';
import { 
  FaPlus, 
  FaEdit, 
  FaTrash, 
  FaUser,
  FaSearch,
  FaFilter
} from 'react-icons/fa';

const ListaTrabajadores = () => {
  const [trabajadores, setTrabajadores] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Estado para la paginación
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  
  // Estado para la búsqueda
  const [searchTerm, setSearchTerm] = useState('');
  
  // Estado para diálogos
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedTrabajador, setSelectedTrabajador] = useState(null);
  
  // Estado para formulario
  const [formData, setFormData] = useState({
    nombre: '',
    apellidos: '',
    dni: '',
    telefono: '',
    email: ''
  });

  // Cargar datos iniciales
  useEffect(() => {
    const cargarDatos = async () => {
      try {
        setLoading(true);
        const data = await trabajadoresService.getTrabajadores();
        setTrabajadores(data);
        setError('');
      } catch (err) {
        console.error('Error al cargar trabajadores:', err);
        setError('No se pudieron cargar los trabajadores. Por favor, inténtalo de nuevo.');
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
  
  // Limpiar filtros
  const handleLimpiarFiltros = () => {
    setSearchTerm('');
    setPage(0);
  };
  
  // Filtrar trabajadores según criterios
  const filteredTrabajadores = trabajadores.filter(trabajador => {
    // Filtro por texto de búsqueda en nombre, apellidos, DNI o email
    return (
      (trabajador.nombre ? trabajador.nombre.toLowerCase().includes(searchTerm.toLowerCase()) : false) ||
      (trabajador.apellidos ? trabajador.apellidos.toLowerCase().includes(searchTerm.toLowerCase()) : false) ||
      (trabajador.dni ? trabajador.dni.toLowerCase().includes(searchTerm.toLowerCase()) : false) ||
      (trabajador.email ? trabajador.email.toLowerCase().includes(searchTerm.toLowerCase()) : false)
    );
  });
  
  // Cambios en el formulario
  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
  };
  
  // Abrir diálogo para nuevo trabajador
  const handleOpenNewDialog = () => {
    setFormData({
      nombre: '',
      apellidos: '',
      dni: '',
      telefono: '',
      email: ''
    });
    setDialogOpen(true);
    setSelectedTrabajador(null);
  };
  
  // Abrir diálogo para editar trabajador
  const handleOpenEditDialog = (trabajador) => {
    setFormData({
      nombre: trabajador.nombre || '',
      apellidos: trabajador.apellidos || '',
      dni: trabajador.dni || '',
      telefono: trabajador.telefono || '',
      email: trabajador.email || ''
    });
    setSelectedTrabajador(trabajador);
    setDialogOpen(true);
  };
  
  // Abrir diálogo de confirmación para eliminar
  const handleOpenDeleteDialog = (trabajador) => {
    setSelectedTrabajador(trabajador);
    setDeleteDialogOpen(true);
  };
  
  // Cerrar diálogos
  const handleCloseDialog = () => {
    setDialogOpen(false);
    setSelectedTrabajador(null);
  };
  
  const handleCloseDeleteDialog = () => {
    setDeleteDialogOpen(false);
    setSelectedTrabajador(null);
  };
  
  // Guardar trabajador (crear o actualizar)
  const handleGuardarTrabajador = async () => {
    try {
      // Validaciones básicas
      if (!formData.nombre || !formData.apellidos || !formData.dni) {
        alert('Los campos Nombre, Apellidos y DNI son obligatorios');
        return;
      }
      
      let result;
      
      if (selectedTrabajador) {
        // Actualizar trabajador existente
        result = await trabajadoresService.updateTrabajador(selectedTrabajador.id, formData);
        
        // Actualizar la lista de trabajadores
        setTrabajadores(trabajadores.map(t => t.id === result.id ? result : t));
      } else {
        // Crear nuevo trabajador
        result = await trabajadoresService.createTrabajador(formData);
        
        // Actualizar la lista de trabajadores
        setTrabajadores([...trabajadores, result]);
      }
      
      handleCloseDialog();
      alert(selectedTrabajador ? 'Trabajador actualizado con éxito' : 'Trabajador creado con éxito');
    } catch (err) {
      console.error('Error al guardar trabajador:', err);
      alert(`Error: ${err.response?.data?.detail || 'No se pudo guardar el trabajador'}`);
    }
  };
  
  // Eliminar trabajador
  const handleEliminarTrabajador = async () => {
    try {
      await trabajadoresService.deleteTrabajador(selectedTrabajador.id);
      
      // Actualizar la lista de trabajadores
      setTrabajadores(trabajadores.filter(t => t.id !== selectedTrabajador.id));
      
      handleCloseDeleteDialog();
      alert('Trabajador eliminado con éxito');
    } catch (err) {
      console.error('Error al eliminar trabajador:', err);
      alert(`Error: ${err.response?.data?.detail || 'No se pudo eliminar el trabajador'}`);
    }
  };

  return (
    <Layout>
      <Box className="pb-6">
        <Box className="flex justify-between items-center mb-6">
          <Typography variant="h4" component="h1" className="font-bold text-gray-800">
            Gestión de Trabajadores
          </Typography>
          <Button
            variant="contained"
            color="primary"
            startIcon={<FaPlus />}
            onClick={handleOpenNewDialog}
          >
            Nuevo Trabajador
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
                  label="Buscar trabajadores"
                  variant="outlined"
                  fullWidth
                  size="small"
                  value={searchTerm}
                  onChange={handleSearchChange}
                  placeholder="Buscar por nombre, apellidos, DNI o email..."
                />
              </Box>
            </Box>
            
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
        </Paper>

        {/* Tabla de trabajadores */}
        <Paper elevation={3} className="overflow-hidden">
          {loading ? (
            <Box className="flex justify-center items-center p-10">
              <CircularProgress />
            </Box>
          ) : filteredTrabajadores.length > 0 ? (
            <>
              <TableContainer>
                <Table aria-label="tabla de trabajadores">
                  <TableHead className="bg-gray-100">
                    <TableRow>
                      <TableCell className="font-bold">Nombre</TableCell>
                      <TableCell className="font-bold">Apellidos</TableCell>
                      <TableCell className="font-bold">DNI</TableCell>
                      <TableCell className="font-bold">Teléfono</TableCell>
                      <TableCell className="font-bold">Email</TableCell>
                      <TableCell className="font-bold">Acciones</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {filteredTrabajadores
                      .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                      .map((trabajador) => (
                        <TableRow key={trabajador.id} hover>
                          <TableCell>
                            <Box className="flex items-center">
                              <FaUser className="text-primary-600 mr-2" />
                              <span>{trabajador.nombre}</span>
                            </Box>
                          </TableCell>
                          <TableCell>{trabajador.apellidos}</TableCell>
                          <TableCell>{trabajador.dni}</TableCell>
                          <TableCell>{trabajador.telefono || '—'}</TableCell>
                          <TableCell>{trabajador.email || '—'}</TableCell>
                          <TableCell>
                            <Box className="flex gap-1">
                              <Tooltip title="Editar trabajador">
                                <IconButton 
                                  onClick={() => handleOpenEditDialog(trabajador)}
                                  color="primary"
                                  size="small"
                                >
                                  <FaEdit />
                                </IconButton>
                              </Tooltip>
                              <Tooltip title="Eliminar trabajador">
                                <IconButton 
                                  onClick={() => handleOpenDeleteDialog(trabajador)}
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
                rowsPerPageOptions={[5, 10, 25]}
                component="div"
                count={filteredTrabajadores.length}
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
                {searchTerm
                  ? 'No se encontraron trabajadores que coincidan con la búsqueda'
                  : 'No hay trabajadores registrados'}
              </Typography>
              {searchTerm ? (
                <Button
                  variant="outlined"
                  color="primary"
                  onClick={handleLimpiarFiltros}
                >
                  Limpiar Filtros
                </Button>
              ) : (
                <Button
                  variant="contained"
                  color="primary"
                  startIcon={<FaPlus />}
                  onClick={handleOpenNewDialog}
                >
                  Crear Primer Trabajador
                </Button>
              )}
            </Box>
          )}
        </Paper>
      </Box>

      {/* Diálogo para crear/editar trabajador */}
      <Dialog 
        open={dialogOpen} 
        onClose={handleCloseDialog}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          {selectedTrabajador ? 'Editar Trabajador' : 'Nuevo Trabajador'}
        </DialogTitle>
        <DialogContent>
          <Box className="space-y-4 pt-2">
            <TextField
              name="nombre"
              label="Nombre"
              value={formData.nombre}
              onChange={handleFormChange}
              fullWidth
              required
            />
            
            <TextField
              name="apellidos"
              label="Apellidos"
              value={formData.apellidos}
              onChange={handleFormChange}
              fullWidth
              required
            />
            
            <TextField
              name="dni"
              label="DNI"
              value={formData.dni}
              onChange={handleFormChange}
              fullWidth
              required
            />
            
            <TextField
              name="telefono"
              label="Teléfono"
              value={formData.telefono}
              onChange={handleFormChange}
              fullWidth
            />
            
            <TextField
              name="email"
              label="Email"
              value={formData.email}
              onChange={handleFormChange}
              fullWidth
              type="email"
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog} color="inherit">
            Cancelar
          </Button>
          <Button 
            onClick={handleGuardarTrabajador} 
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
            ¿Estás seguro de que quieres eliminar al trabajador <strong>{selectedTrabajador?.nombre} {selectedTrabajador?.apellidos}</strong>?
            Esta acción no se puede deshacer.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDeleteDialog} color="inherit">
            Cancelar
          </Button>
          <Button 
            onClick={handleEliminarTrabajador} 
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

export default ListaTrabajadores; 