import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Layout from '../../components/Layout/Layout';
import usuariosService from '../../services/usuariosService';
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
  Chip,
  CircularProgress,
  Alert,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Switch,
  FormControlLabel
} from '@mui/material';
import { 
  FaPlus, 
  FaEdit, 
  FaTrash,
  FaKey,
  FaUserPlus,
  FaUserSlash
} from 'react-icons/fa';

const ListaUsuarios = () => {
  const [usuarios, setUsuarios] = useState([]);
  const [trabajadores, setTrabajadores] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Estado para la paginación
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  
  // Estado para diálogos
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [passwordDialogOpen, setPasswordDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  
  // Estado para formulario de nuevo/editar usuario
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    chat_id: '',
    rol: 'trabajador',
    activo: true
  });

  // Estado para formulario de cambio de contraseña
  const [passwordData, setPasswordData] = useState({
    password: '',
    confirmarPassword: ''
  });
  
  // Cargar datos iniciales
  useEffect(() => {
    const cargarDatos = async () => {
      try {
        setLoading(true);
        
        // Cargar usuarios y trabajadores
        const [usuariosData, trabajadoresData] = await Promise.all([
          usuariosService.getUsuarios(),
          trabajadoresService.getTrabajadores()
        ]);
        
        setUsuarios(usuariosData);
        setTrabajadores(trabajadoresData);
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
  
  // Cambios en el formulario
  const handleFormChange = (e) => {
    const { name, value, checked } = e.target;
    setFormData({
      ...formData,
      [name]: name === 'activo' ? checked : value
    });
  };
  
  // Cambios en el formulario de contraseña
  const handlePasswordFormChange = (e) => {
    const { name, value } = e.target;
    setPasswordData({
      ...passwordData,
      [name]: value
    });
  };
  
  // Abrir diálogo para nuevo usuario
  const handleOpenNewDialog = () => {
    setFormData({
      username: '',
      password: '',
      chat_id: '',
      rol: 'trabajador',
      activo: true
    });
    setDialogOpen(true);
    setSelectedUser(null);
  };
  
  // Abrir diálogo para editar usuario
  const handleOpenEditDialog = (usuario) => {
    setFormData({
      username: usuario.username,
      chat_id: usuario.chat_id || '',
      rol: usuario.rol,
      activo: usuario.activo,
      password: '' // No mostramos la contraseña actual
    });
    setSelectedUser(usuario);
    setDialogOpen(true);
  };
  
  // Abrir diálogo para cambiar contraseña
  const handleOpenPasswordDialog = (usuario) => {
    setPasswordData({
      password: '',
      confirmarPassword: ''
    });
    setSelectedUser(usuario);
    setPasswordDialogOpen(true);
  };
  
  // Abrir diálogo de confirmación para eliminar
  const handleOpenDeleteDialog = (usuario) => {
    setSelectedUser(usuario);
    setDeleteDialogOpen(true);
  };
  
  // Cerrar diálogos
  const handleCloseDialog = () => {
    setDialogOpen(false);
    setSelectedUser(null);
  };
  
  const handleClosePasswordDialog = () => {
    setPasswordDialogOpen(false);
  };
  
  const handleCloseDeleteDialog = () => {
    setDeleteDialogOpen(false);
    setSelectedUser(null);
  };
  
  // Guardar usuario (crear o actualizar)
  const handleGuardarUsuario = async () => {
    try {
      // Validaciones básicas
      if (!formData.username) {
        alert('El nombre de usuario es obligatorio');
        return;
      }
      
      if (!selectedUser && !formData.password) {
        alert('La contraseña es obligatoria para nuevos usuarios');
        return;
      }
      
      let result;
      
      if (selectedUser) {
        // Actualizar usuario existente
        const updateData = { ...formData };
        if (!updateData.password) delete updateData.password; // No actualizar la contraseña si está vacía
        
        result = await usuariosService.updateUsuario(selectedUser.id, updateData);
      } else {
        // Crear nuevo usuario
        result = await usuariosService.createUsuario(formData);
      }
      
      // Actualizar la lista de usuarios
      if (selectedUser) {
        setUsuarios(usuarios.map(u => u.id === result.id ? result : u));
      } else {
        setUsuarios([...usuarios, result]);
      }
      
      handleCloseDialog();
      alert(selectedUser ? 'Usuario actualizado con éxito' : 'Usuario creado con éxito');
    } catch (err) {
      console.error('Error al guardar usuario:', err);
      alert(`Error: ${err.response?.data?.detail || 'No se pudo guardar el usuario'}`);
    }
  };
  
  // Cambiar contraseña
  const handleCambiarPassword = async () => {
    try {
      // Validaciones
      if (!passwordData.password) {
        alert('La contraseña es obligatoria');
        return;
      }
      
      if (passwordData.password !== passwordData.confirmarPassword) {
        alert('Las contraseñas no coinciden');
        return;
      }
      
      await usuariosService.cambiarPassword(selectedUser.id, {
        password: passwordData.password
      });
      
      handleClosePasswordDialog();
      alert('Contraseña actualizada con éxito');
    } catch (err) {
      console.error('Error al cambiar contraseña:', err);
      alert(`Error: ${err.response?.data?.detail || 'No se pudo cambiar la contraseña'}`);
    }
  };
  
  // Eliminar usuario
  const handleEliminarUsuario = async () => {
    try {
      await usuariosService.deleteUsuario(selectedUser.id);
      
      // Actualizar la lista de usuarios
      setUsuarios(usuarios.filter(u => u.id !== selectedUser.id));
      
      handleCloseDeleteDialog();
      alert('Usuario eliminado con éxito');
    } catch (err) {
      console.error('Error al eliminar usuario:', err);
      alert(`Error: ${err.response?.data?.detail || 'No se pudo eliminar el usuario'}`);
    }
  };
  
  // Alternar estado activo/inactivo
  const handleToggleActivo = async (usuario) => {
    try {
      const nuevoEstado = !usuario.activo;
      const result = await usuariosService.toggleActivoUsuario(usuario.id, nuevoEstado);
      
      // Actualizar la lista de usuarios
      setUsuarios(usuarios.map(u => u.id === result.id ? result : u));
      
      alert(`Usuario ${nuevoEstado ? 'activado' : 'desactivado'} con éxito`);
    } catch (err) {
      console.error('Error al cambiar estado:', err);
      alert(`Error: ${err.response?.data?.detail || 'No se pudo cambiar el estado del usuario'}`);
    }
  };
  
  // Obtener nombre del trabajador
  const getNombreTrabajador = (chat_id) => {
    if (!chat_id) return 'No asignado';
    const trabajador = trabajadores.find(t => t.chat_id === chat_id);
    return trabajador ? trabajador.nombre : 'Desconocido';
  };

  return (
    <Layout>
      <Box className="pb-6">
        <Box className="flex justify-between items-center mb-6">
          <Typography variant="h4" component="h1" className="font-bold text-gray-800">
            Gestión de Usuarios
          </Typography>
          <Button
            variant="contained"
            color="primary"
            startIcon={<FaPlus />}
            onClick={handleOpenNewDialog}
          >
            Nuevo Usuario
          </Button>
        </Box>

        {error && (
          <Alert severity="error" className="mb-6">
            {error}
          </Alert>
        )}

        {/* Tabla de usuarios */}
        <Paper elevation={3} className="overflow-hidden">
          {loading ? (
            <Box className="flex justify-center items-center p-10">
              <CircularProgress />
            </Box>
          ) : usuarios.length > 0 ? (
            <>
              <TableContainer>
                <Table aria-label="tabla de usuarios">
                  <TableHead className="bg-gray-100">
                    <TableRow>
                      <TableCell className="font-bold">Usuario</TableCell>
                      <TableCell className="font-bold">Trabajador</TableCell>
                      <TableCell className="font-bold">Rol</TableCell>
                      <TableCell className="font-bold">Estado</TableCell>
                      <TableCell className="font-bold">Último Login</TableCell>
                      <TableCell className="font-bold">Acciones</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {usuarios
                      .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                      .map((usuario) => (
                        <TableRow key={usuario.id} hover>
                          <TableCell>{usuario.username}</TableCell>
                          <TableCell>{getNombreTrabajador(usuario.chat_id)}</TableCell>
                          <TableCell>
                            <Chip 
                              label={usuario.rol} 
                              color={usuario.rol === 'admin' ? 'success' : usuario.rol === 'secretaria' ? 'secondary' : 'primary'}
                              size="small"
                            />
                          </TableCell>
                          <TableCell>
                            <Chip 
                              label={usuario.activo ? 'Activo' : 'Inactivo'} 
                              color={usuario.activo ? 'success' : 'error'}
                              size="small"
                            />
                          </TableCell>
                          <TableCell>
                            {usuario.ultimo_login 
                              ? new Date(usuario.ultimo_login).toLocaleString() 
                              : 'Nunca'}
                          </TableCell>
                          <TableCell>
                            <Box className="flex gap-1">
                              <IconButton 
                                onClick={() => handleOpenEditDialog(usuario)}
                                color="primary"
                                size="small"
                                title="Editar usuario"
                              >
                                <FaEdit />
                              </IconButton>
                              <IconButton 
                                onClick={() => handleOpenPasswordDialog(usuario)}
                                color="secondary"
                                size="small"
                                title="Cambiar contraseña"
                              >
                                <FaKey />
                              </IconButton>
                              <IconButton 
                                onClick={() => handleToggleActivo(usuario)}
                                color={usuario.activo ? "error" : "success"}
                                size="small"
                                title={usuario.activo ? "Desactivar usuario" : "Activar usuario"}
                              >
                                {usuario.activo ? <FaUserSlash /> : <FaUserPlus />}
                              </IconButton>
                              <IconButton 
                                onClick={() => handleOpenDeleteDialog(usuario)}
                                color="error"
                                size="small"
                                title="Eliminar usuario"
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
                count={usuarios.length}
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
                No hay usuarios registrados
              </Typography>
              <Button
                variant="contained"
                color="primary"
                startIcon={<FaPlus />}
                onClick={handleOpenNewDialog}
              >
                Crear Primer Usuario
              </Button>
            </Box>
          )}
        </Paper>
      </Box>

      {/* Diálogo para crear/editar usuario */}
      <Dialog 
        open={dialogOpen} 
        onClose={handleCloseDialog}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          {selectedUser ? 'Editar Usuario' : 'Nuevo Usuario'}
        </DialogTitle>
        <DialogContent>
          <Box className="space-y-4 pt-2">
            <TextField
              name="username"
              label="Nombre de Usuario"
              value={formData.username}
              onChange={handleFormChange}
              fullWidth
              required
            />
            
            {!selectedUser && (
              <TextField
                name="password"
                label="Contraseña"
                type="password"
                value={formData.password}
                onChange={handleFormChange}
                fullWidth
                required
              />
            )}
            
            <FormControl fullWidth>
              <InputLabel>Trabajador</InputLabel>
              <Select
                name="chat_id"
                value={formData.chat_id}
                onChange={handleFormChange}
                label="Trabajador"
              >
                <MenuItem value="">Sin asignar</MenuItem>
                {trabajadores.map(trabajador => (
                  <MenuItem key={trabajador.chat_id} value={trabajador.chat_id}>
                    {trabajador.nombre}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            
            <FormControl fullWidth>
              <InputLabel>Rol</InputLabel>
              <Select
                name="rol"
                value={formData.rol}
                onChange={handleFormChange}
                label="Rol"
                required
              >
                <MenuItem value="trabajador">Trabajador</MenuItem>
                <MenuItem value="secretaria">Secretaria</MenuItem>
                <MenuItem value="admin">Administrador</MenuItem>
              </Select>
            </FormControl>
            
            <FormControlLabel
              control={
                <Switch
                  name="activo"
                  checked={formData.activo}
                  onChange={handleFormChange}
                  color="primary"
                />
              }
              label="Usuario Activo"
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog} color="inherit">
            Cancelar
          </Button>
          <Button 
            onClick={handleGuardarUsuario} 
            color="primary" 
            variant="contained"
          >
            Guardar
          </Button>
        </DialogActions>
      </Dialog>

      {/* Diálogo para cambiar contraseña */}
      <Dialog 
        open={passwordDialogOpen} 
        onClose={handleClosePasswordDialog}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle>
          Cambiar Contraseña
        </DialogTitle>
        <DialogContent>
          <DialogContentText className="mb-4">
            Cambiar contraseña para el usuario: {selectedUser?.username}
          </DialogContentText>
          <Box className="space-y-4">
            <TextField
              name="password"
              label="Nueva Contraseña"
              type="password"
              value={passwordData.password}
              onChange={handlePasswordFormChange}
              fullWidth
              required
            />
            <TextField
              name="confirmarPassword"
              label="Confirmar Contraseña"
              type="password"
              value={passwordData.confirmarPassword}
              onChange={handlePasswordFormChange}
              fullWidth
              required
              error={passwordData.password !== passwordData.confirmarPassword}
              helperText={
                passwordData.password !== passwordData.confirmarPassword 
                  ? "Las contraseñas no coinciden" 
                  : ""
              }
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClosePasswordDialog} color="inherit">
            Cancelar
          </Button>
          <Button 
            onClick={handleCambiarPassword} 
            color="primary" 
            variant="contained"
            disabled={!passwordData.password || passwordData.password !== passwordData.confirmarPassword}
          >
            Cambiar Contraseña
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
            ¿Estás seguro de que quieres eliminar al usuario <strong>{selectedUser?.username}</strong>?
            Esta acción no se puede deshacer.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDeleteDialog} color="inherit">
            Cancelar
          </Button>
          <Button 
            onClick={handleEliminarUsuario} 
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

export default ListaUsuarios; 