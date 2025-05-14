import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { 
  AppBar, 
  Box, 
  Toolbar, 
  Typography, 
  Drawer, 
  List, 
  ListItem, 
  ListItemIcon, 
  ListItemText, 
  ListItemButton,
  Divider, 
  IconButton, 
  Button, 
  Container,
  Avatar, 
  Menu, 
  MenuItem,
  Tooltip
} from '@mui/material';
import { 
  FaHome, 
  FaClock, 
  FaBuilding, 
  FaTasks, 
  FaUsers, 
  FaUsersCog, 
  FaChartBar, 
  FaBars, 
  FaSignOutAlt,
  FaUser
} from 'react-icons/fa';

const drawerWidth = 240;

const Layout = ({ children }) => {
  const { user, logout, isAdmin } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [anchorElUser, setAnchorElUser] = useState(null);

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const handleOpenUserMenu = (event) => {
    setAnchorElUser(event.currentTarget);
  };

  const handleCloseUserMenu = () => {
    setAnchorElUser(null);
  };

  const handleLogout = () => {
    handleCloseUserMenu();
    logout();
    navigate('/login');
  };

  const navItems = [
    { 
      name: 'Dashboard', 
      path: '/dashboard', 
      icon: <FaHome className="text-xl" /> 
    },
    { 
      name: 'Mis Horas', 
      path: '/horas', 
      icon: <FaClock className="text-xl" /> 
    }
  ];

  const adminItems = [
    { 
      name: 'Obras', 
      path: '/obras', 
      icon: <FaBuilding className="text-xl" /> 
    },
    { 
      name: 'Partidas', 
      path: '/partidas', 
      icon: <FaTasks className="text-xl" /> 
    },
    { 
      name: 'Trabajadores', 
      path: '/trabajadores', 
      icon: <FaUsers className="text-xl" /> 
    },
    { 
      name: 'Usuarios App', 
      path: '/usuarios', 
      icon: <FaUsersCog className="text-xl" /> 
    },
    { 
      name: 'Informes', 
      path: '/informes', 
      icon: <FaChartBar className="text-xl" /> 
    }
  ];

  const drawer = (
    <div>
      <Toolbar className="flex items-center justify-center py-4">
        <Typography variant="h6" component="div" className="font-bold">
          Gestión de Horas
        </Typography>
      </Toolbar>
      <Divider />
      <List>
        {navItems.map((item) => (
          <ListItem key={item.name} disablePadding>
            <ListItemButton
              component={Link}
              to={item.path}
              className={`${location.pathname === item.path ? 'bg-primary-50 text-primary-700' : ''}`}
            >
              <ListItemIcon className="min-w-[40px] text-inherit">
                {item.icon}
              </ListItemIcon>
              <ListItemText primary={item.name} />
            </ListItemButton>
          </ListItem>
        ))}
      </List>
      {isAdmin() && (
        <>
          <Divider />
          <Box className="px-4 py-2">
            <Typography variant="subtitle2" className="text-gray-500 font-medium">
              Administración
            </Typography>
          </Box>
          <List>
            {adminItems.map((item) => (
              <ListItem key={item.name} disablePadding>
                <ListItemButton
                  component={Link}
                  to={item.path}
                  className={`${location.pathname === item.path ? 'bg-primary-50 text-primary-700' : ''}`}
                >
                  <ListItemIcon className="min-w-[40px] text-inherit">
                    {item.icon}
                  </ListItemIcon>
                  <ListItemText primary={item.name} />
                </ListItemButton>
              </ListItem>
            ))}
          </List>
        </>
      )}
    </div>
  );

  return (
    <Box className="flex min-h-screen bg-gray-50">
      <AppBar 
        position="fixed" 
        className="z-[1201]"
        sx={{ 
          width: { sm: `calc(100% - ${drawerWidth}px)` }, 
          ml: { sm: `${drawerWidth}px` },
          bgcolor: 'white', 
          color: 'text.primary',
          boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
        }}
      >
        <Toolbar>
          <IconButton
            color="inherit"
            aria-label="open drawer"
            edge="start"
            onClick={handleDrawerToggle}
            sx={{ mr: 2, display: { sm: 'none' } }}
          >
            <FaBars />
          </IconButton>
          <Typography
            variant="h6"
            component="div"
            sx={{ flexGrow: 1, display: { xs: 'none', sm: 'block' } }}
          >
            {location.pathname === '/dashboard' ? 'Dashboard' : 
             location.pathname === '/horas' ? 'Mis Horas' : 
             location.pathname === '/obras' ? 'Obras' : 
             location.pathname === '/partidas' ? 'Partidas' : 
             location.pathname === '/trabajadores' ? 'Trabajadores' : 
             location.pathname === '/usuarios' ? 'Usuarios App' : 
             location.pathname === '/informes' ? 'Informes' : 'Gestión de Horas'}
          </Typography>
          
          {user && (
            <Box sx={{ flexGrow: 0 }}>
              <Tooltip title="Abrir opciones">
                <IconButton onClick={handleOpenUserMenu}>
                  <Avatar className="bg-primary-600">
                    {user.username.charAt(0).toUpperCase()}
                  </Avatar>
                </IconButton>
              </Tooltip>
              <Menu
                sx={{ mt: '45px' }}
                id="menu-appbar"
                anchorEl={anchorElUser}
                anchorOrigin={{
                  vertical: 'top',
                  horizontal: 'right',
                }}
                keepMounted
                transformOrigin={{
                  vertical: 'top',
                  horizontal: 'right',
                }}
                open={Boolean(anchorElUser)}
                onClose={handleCloseUserMenu}
              >
                <MenuItem className="px-4 py-2">
                  <Typography variant="subtitle1" className="font-medium">{user.username}</Typography>
                </MenuItem>
                <MenuItem className="px-4 py-1">
                  <Typography variant="caption" className="text-gray-500">Rol: {user.rol}</Typography>
                </MenuItem>
                <Divider />
                <MenuItem onClick={handleLogout} className="text-red-600 flex gap-2 items-center">
                  <FaSignOutAlt /> Cerrar Sesión
                </MenuItem>
              </Menu>
            </Box>
          )}
        </Toolbar>
      </AppBar>
      
      <Box
        component="nav"
        sx={{ width: { sm: drawerWidth }, flexShrink: { sm: 0 } }}
      >
        <Drawer
          variant="temporary"
          open={mobileOpen}
          onClose={handleDrawerToggle}
          ModalProps={{
            keepMounted: true,
          }}
          sx={{
            display: { xs: 'block', sm: 'none' },
            '& .MuiDrawer-paper': { boxSizing: 'border-box', width: drawerWidth },
          }}
        >
          {drawer}
        </Drawer>
        <Drawer
          variant="permanent"
          sx={{
            display: { xs: 'none', sm: 'block' },
            '& .MuiDrawer-paper': { boxSizing: 'border-box', width: drawerWidth },
          }}
          open
        >
          {drawer}
        </Drawer>
      </Box>
      
      <Box
        component="main"
        sx={{ 
          flexGrow: 1, 
          p: 3, 
          width: { sm: `calc(100% - ${drawerWidth}px)` },
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column'
        }}
      >
        <Toolbar />
        <Container maxWidth="xl" className="flex-grow py-4">
          {children}
        </Container>
        <Box component="footer" className="py-4 text-center text-gray-500 text-sm">
          <Typography variant="body2">
            &copy; {new Date().getFullYear()} - Gestión de Horas
          </Typography>
        </Box>
      </Box>
    </Box>
  );
};

export default Layout; 