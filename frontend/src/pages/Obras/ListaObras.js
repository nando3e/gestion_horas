import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Layout from '../../components/Layout/Layout';
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
  Chip
} from '@mui/material';
import { 
  FaPlus, 
  FaEdit, 
  FaTrash,
  FaBuilding,
  FaSearch
} from 'react-icons/fa';

const ListaObras = () => {
  const [obras, setObras] = useState([]);
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
  const [selectedObra, setSelectedObra] = useState(null);
  
  // Estado para formulario
  const [formData, setFormData] = useState({
    nombre_obra: '',
    direccion_obra: ''
  });

  // Cargar datos iniciales
  useEffect(() => {
    const cargarObras = async () => {
      try {
        setLoading(true);
        const data = await obrasService.getObras();
        console.log('Datos recibidos:', data); // Para debugging
        setObras(data);
        setError('');
      } catch (err) {
        console.error('Error al cargar obras:', err);
        setError('No se pudieron cargar las obras. Por favor, inténtalo de nuevo.');
      } finally {
        setLoading(false);
      }
    };

    cargarObras();
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
  
  // Filtrar obras por término de búsqueda
  const filteredObras = obras.filter(obra => 
    (obra.nombre_obra ? obra.nombre_obra.toLowerCase().includes(searchTerm.toLowerCase()) : false) ||
    (obra.direccion_obra ? obra.direccion_obra.toLowerCase().includes(searchTerm.toLowerCase()) : false)
  );
  
  // Cambios en el formulario
  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
  };
  
  // Abrir diálogo para nueva obra
  const handleOpenNewDialog = () => {
    setFormData({
      nombre_obra: '',
      direccion_obra: ''
    });
    setDialogOpen(true);
    setSelectedObra(null);
  };
  
  // Abrir diálogo para editar obra
  const handleOpenEditDialog = (obra) => {
    setFormData({
      nombre_obra: obra.nombre_obra,
      direccion_obra: obra.direccion_obra || ''
    });
    setSelectedObra(obra);
    setDialogOpen(true);
  };
  
  // Abrir diálogo de confirmación para eliminar
  const handleOpenDeleteDialog = (obra) => {
    setSelectedObra(obra);
    setDeleteDialogOpen(true);
  };
  
  // Cerrar diálogos
  const handleCloseDialog = () => {
    setDialogOpen(false);
    setSelectedObra(null);
  };
  
  const handleCloseDeleteDialog = () => {
    setDeleteDialogOpen(false);
    setSelectedObra(null);
  };
  
  // Guardar obra (crear o actualizar)
  const handleGuardarObra = async () => {
    try {
      // Validaciones básicas
      if (!formData.nombre_obra) {
        alert('El nombre de la obra es obligatorio');
        return;
      }
      
      let result;
      
      if (selectedObra) {
        // Actualizar obra existente
        result = await obrasService.updateObra(selectedObra.id_obra, formData);
        
        // Actualizar la lista de obras
        setObras(obras.map(o => o.id_obra === result.id_obra ? result : o));
      } else {
        // Crear nueva obra
        result = await obrasService.createObra(formData);
        
        // Actualizar la lista de obras
        setObras([...obras, result]);
      }
      
      handleCloseDialog();
      alert(selectedObra ? 'Obra actualizada con éxito' : 'Obra creada con éxito');
    } catch (err) {
      console.error('Error al guardar obra:', err);
      alert(`Error: ${err.response?.data?.detail || 'No se pudo guardar la obra'}`);
    }
  };
  
  // Eliminar obra
  const handleEliminarObra = async () => {
    try {
      await obrasService.deleteObra(selectedObra.id_obra);
      
      // Actualizar la lista de obras
      setObras(obras.filter(o => o.id_obra !== selectedObra.id_obra));
      
      handleCloseDeleteDialog();
      alert('Obra eliminada con éxito');
    } catch (err) {
      console.error('Error al eliminar obra:', err);
      alert(`Error: ${err.response?.data?.detail || 'No se pudo eliminar la obra'}`);
    }
  };

  return (
    <Layout>
      <Box className="pb-6">
        <Box className="flex justify-between items-center mb-6">
          <Typography variant="h4" component="h1" className="font-bold text-gray-800">
            Gestión de Obras
          </Typography>
          <Button
            variant="contained"
            color="primary"
            startIcon={<FaPlus />}
            onClick={handleOpenNewDialog}
          >
            Nueva Obra
          </Button>
        </Box>

        {error && (
          <Alert severity="error" className="mb-6">
            {error}
          </Alert>
        )}

        {/* Búsqueda */}
        <Paper elevation={2} className="p-4 mb-6">
          <Box className="flex items-center">
            <FaSearch className="text-gray-400 mr-2" />
            <TextField
              label="Buscar obras"
              variant="outlined"
              fullWidth
              size="small"
              value={searchTerm}
              onChange={handleSearchChange}
              placeholder="Buscar por nombre o descripción..."
            />
          </Box>
        </Paper>

        {/* Tabla de obras */}
        <Paper elevation={3} className="overflow-hidden">
          {loading ? (
            <Box className="flex justify-center items-center p-10">
              <CircularProgress />
            </Box>
          ) : filteredObras.length > 0 ? (
            <>
              <TableContainer>
                <Table aria-label="tabla de obras">
                  <TableHead className="bg-gray-100">
                    <TableRow>
                      <TableCell className="font-bold">Nombre</TableCell>
                      <TableCell className="font-bold">Descripción</TableCell>
                      <TableCell className="font-bold">Estado</TableCell>
                      <TableCell className="font-bold">Acciones</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {filteredObras
                      .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                      .map((obra) => (
                        <TableRow key={obra.id_obra} hover>
                          <TableCell>
                            <Box className="flex items-center">
                              <FaBuilding className="text-primary-600 mr-2" />
                              <span>{obra.nombre_obra}</span>
                            </Box>
                          </TableCell>
                          <TableCell>{obra.direccion_obra || '—'}</TableCell>
                          <TableCell>
                            <Chip 
                              label={obra.estado || 'Activa'} 
                              color={obra.estado === 'completada' ? 'success' : obra.estado === 'cancelada' ? 'error' : 'primary'}
                              size="small"
                            />
                          </TableCell>
                          <TableCell>
                            <Box className="flex gap-1">
                              <Tooltip title="Editar obra">
                                <IconButton 
                                  onClick={() => handleOpenEditDialog(obra)}
                                  color="primary"
                                  size="small"
                                >
                                  <FaEdit />
                                </IconButton>
                              </Tooltip>
                              <Tooltip title="Eliminar obra">
                                <IconButton 
                                  onClick={() => handleOpenDeleteDialog(obra)}
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
                count={filteredObras.length}
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
                  ? 'No se encontraron obras que coincidan con la búsqueda'
                  : 'No hay obras registradas'}
              </Typography>
              {!searchTerm && (
                <Button
                  variant="contained"
                  color="primary"
                  startIcon={<FaPlus />}
                  onClick={handleOpenNewDialog}
                >
                  Crear Primera Obra
                </Button>
              )}
              {searchTerm && (
                <Button
                  variant="outlined"
                  color="primary"
                  onClick={() => setSearchTerm('')}
                >
                  Limpiar Búsqueda
                </Button>
              )}
            </Box>
          )}
        </Paper>
      </Box>

      {/* Diálogo para crear/editar obra */}
      <Dialog 
        open={dialogOpen} 
        onClose={handleCloseDialog}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          {selectedObra ? 'Editar Obra' : 'Nueva Obra'}
        </DialogTitle>
        <DialogContent>
          <Box className="space-y-4 pt-2">
            <TextField
              name="nombre_obra"
              label="Nombre de la Obra"
              value={formData.nombre_obra}
              onChange={handleFormChange}
              fullWidth
              required
            />
            
            <TextField
              name="direccion_obra"
              label="Descripción"
              value={formData.direccion_obra}
              onChange={handleFormChange}
              fullWidth
              multiline
              rows={3}
            />

            <TextField
              name="estado"
              label="Estado"
              select
              value={formData.estado}
              onChange={handleFormChange}
              fullWidth
              SelectProps={{
                native: true,
              }}
            >
              <option value="activa">Activa</option>
              <option value="completada">Completada</option>
              <option value="cancelada">Cancelada</option>
            </TextField>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog} color="inherit">
            Cancelar
          </Button>
          <Button 
            onClick={handleGuardarObra} 
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
            ¿Estás seguro de que quieres eliminar la obra <strong>{selectedObra?.nombre_obra}</strong>?
            Esta acción no se puede deshacer.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDeleteDialog} color="inherit">
            Cancelar
          </Button>
          <Button 
            onClick={handleEliminarObra} 
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

export default ListaObras; 