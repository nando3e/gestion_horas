import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';
import './InitialSetup.css';

const InitialSetup = () => {
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    confirmPassword: '',
    chat_id: 'admin_id',
    nombre: 'Administrador'
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    // Validar contraseñas
    if (formData.password !== formData.confirmPassword) {
      setError('Las contraseñas no coinciden');
      setLoading(false);
      return;
    }

    try {
      // Intentar crear un trabajador primero
      await api.post('/trabajadores', {
        chat_id: formData.chat_id,
        nombre: formData.nombre
      });

      // Luego crear el usuario admin
      await api.post('/auth/register', {
        username: formData.username,
        password: formData.password,
        chat_id: formData.chat_id,
        rol: 'admin'
      });

      setSuccess(true);
      setTimeout(() => {
        navigate('/login');
      }, 3000);
    } catch (error) {
      console.error('Error al configurar la aplicación:', error);
      setError(error.response?.data?.detail || 'Error al configurar la aplicación. Inténtalo de nuevo.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="setup-container">
      <div className="setup-card">
        <h2>Configuración Inicial</h2>
        <p className="setup-info">
          Bienvenido a la aplicación de Gestión de Horas. 
          Para comenzar, necesitas crear un usuario administrador.
        </p>

        {error && <div className="error-message">{error}</div>}
        
        {success ? (
          <div className="success-message">
            <h3>Configuración completada</h3>
            <p>Usuario administrador creado correctamente.</p>
            <p>Serás redirigido a la página de inicio de sesión...</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label htmlFor="username">Nombre de usuario</label>
              <input
                type="text"
                id="username"
                name="username"
                value={formData.username}
                onChange={handleChange}
                required
                disabled={loading}
              />
            </div>
            
            <div className="form-group">
              <label htmlFor="password">Contraseña</label>
              <input
                type="password"
                id="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                required
                disabled={loading}
              />
            </div>
            
            <div className="form-group">
              <label htmlFor="confirmPassword">Confirmar contraseña</label>
              <input
                type="password"
                id="confirmPassword"
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleChange}
                required
                disabled={loading}
              />
            </div>
            
            <div className="form-group">
              <label htmlFor="nombre">Nombre del administrador</label>
              <input
                type="text"
                id="nombre"
                name="nombre"
                value={formData.nombre}
                onChange={handleChange}
                required
                disabled={loading}
              />
            </div>
            
            <button type="submit" className="setup-button" disabled={loading}>
              {loading ? 'Configurando...' : 'Configurar aplicación'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
};

export default InitialSetup; 