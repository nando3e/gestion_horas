import React, { useState, useEffect, useCallback, useMemo } from 'react';
import Layout from '../../components/Layout/Layout';
import horasService from '../../services/horasService';
import obrasService from '../../services/obrasService';
import partidasService from '../../services/partidasService';
import trabajadoresService from '../../services/trabajadoresService';
import authService from '../../services/authService';
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  FormControlLabel,
  FormHelperText,
  Grid,
  IconButton,
  InputLabel,
  MenuItem,
  Paper,
  Radio,
  RadioGroup,
  Select,
  Stack,
  Switch,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableFooter,
  TableHead,
  TableRow,
  TextField,
  Tooltip,
  Typography,
  useMediaQuery,
  useTheme
} from '@mui/material';

const HOUR_OPTIONS = Array.from({ length: 24 }, (_, i) => i.toString().padStart(2, '0'));
const MINUTE_OPTIONS = Array.from({ length: 12 }, (_, i) => (i * 5).toString().padStart(2, '0'));

const RegistrarHoras = () => 
{
  // Estados principales
  const [usuario, setUsuario] = useState(null);
  const [trabajadores, setTrabajadores] = useState([]);
  const [obras, setObras] = useState([]);
  const [partidas, setPartidas] = useState([]);
  const [registrosDia, setRegistrosDia] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Estados del formulario
  const [trabajadorSeleccionado, setTrabajadorSeleccionado] = useState('');
  const [obraSeleccionada, setObraSeleccionada] = useState('');
  const [partidaSeleccionada, setPartidaSeleccionada] = useState('');
  const [fecha, setFecha] = useState(() => new Date().toISOString().slice(0, 10));
  const [tramos, setTramos] = useState([
    {
      horaInicio: '08', minutoInicio: '00', horaFin: '17', minutoFin: '00',
      idPartida: '',
      esExtra: false,
      tipoExtra: 'interno',
      descripcionExtra: ''
    }
  ]);
  const [esRegularizacion, setEsRegularizacion] = useState(false);
  const [horasRegularizacion, setHorasRegularizacion] = useState('');
  const [esExtra, setEsExtra] = useState(false);
  const [tipoExtra, setTipoExtra] = useState('interno');
  const [descripcionExtra, setDescripcionExtra] = useState('');

  // Edición/eliminación
  const [editandoId, setEditandoId] = useState(null);
  const [formError, setFormError] = useState(null);
  const [adding, setAdding] = useState(false);
  const [registrosCompletos, setRegistrosCompletos] = useState([]);

  // Estados para edición
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [registroEditando, setRegistroEditando] = useState(null);
  const [horarioEdicion, setHorarioEdicion] = useState('');
  const [horasTotalesEdicion, setHorasTotalesEdicion] = useState('');
  const [editandoPartida, setEditandoPartida] = useState('');
  const [editandoEsExtra, setEditandoEsExtra] = useState(false);
  const [editandoTipoExtra, setEditandoTipoExtra] = useState('interno');
  const [editandoDescripcionExtra, setEditandoDescripcionExtra] = useState('');
  const [editLoading, setEditLoading] = useState(false);

  // Constantes para restringir el selector de fecha
  const hoyDate = new Date();
  const ayerDate = new Date();
  ayerDate.setDate(hoyDate.getDate() - 1);
  const hoyISO = hoyDate.toISOString().split('T')[0];
  const ayerISO = ayerDate.toISOString().split('T')[0];

  // Función auxiliar para convertir hora a minutos para ordenación
  const convertirHoraAMinutos = (horaStr) => {
    if (!horaStr || typeof horaStr !== 'string' || !horaStr.includes(':')) {
      return Number.MAX_SAFE_INTEGER; // Para que registros sin hora_inicio válida queden al final
    }
    const [horas, minutos] = horaStr.split(':').map(Number);
    return horas * 60 + minutos;
  };
  const [editandoTramosHorarios, setEditandoTramosHorarios] = useState([{ horaInicio: '', minutoInicio: '', horaFin: '', minutoFin: '', esExtra: false, tipoExtra: 'interno', descripcionExtra: '' }]);

  const totalHorasRegistradasDia = useMemo(() => {
    return registrosDia.reduce((sum, registro) => {
      const horas = parseFloat(registro.horas_totales);
      return sum + (isNaN(horas) ? 0 : horas);
    }, 0).toFixed(2);
  }, [registrosDia]);
  const [partidasModalEdicion, setPartidasModalEdicion] = useState([]);

  // Theme y media queries para responsive design
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const isTablet = useMediaQuery(theme.breakpoints.between('sm', 'md'));

  // Función para determinar si un registro es editable/eliminable por un trabajador
  const esFechaPermitidaParaAccionTrabajador = (fechaRegistroStr) => {
    if (!fechaRegistroStr) return false; // Si no hay fecha, no se permite

    const hoy = new Date();
    const ayer = new Date();
    ayer.setDate(hoy.getDate() - 1);

    // Normalizar 'hoy' y 'ayer' a medianoche para comparar solo fechas
    hoy.setHours(0, 0, 0, 0);
    ayer.setHours(0, 0, 0, 0);

    // Convertir fechaRegistroStr (ej: "YYYY-MM-DD") a un objeto Date.
    // Es crucial parsearlo correctamente para evitar problemas de zona horaria
    // al comparar con fechas creadas localmente.
    const parts = fechaRegistroStr.split('-'); // Asumiendo formato "YYYY-MM-DD"
    // new Date(year, monthIndex (0-11), day)
    const fechaRegistro = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
    fechaRegistro.setHours(0, 0, 0, 0); // Normalizar también a medianoche

    return fechaRegistro.getTime() === hoy.getTime() || fechaRegistro.getTime() === ayer.getTime();
  };

  // --- Definición de cargarRegistros con useCallback ---
  const cargarRegistros = useCallback(async () => {
    if (!usuario || !fecha) {
      setRegistrosDia([]);
      return;
    }
    try {
      let queryParams = { fecha };
      if (usuario.rol === 'trabajador') {
        queryParams.chat_id = usuario.chat_id; // USAR chat_id
      } else if (usuario.rol === 'admin' || usuario.rol === 'secretaria') {
        if (trabajadorSeleccionado) {
          queryParams.chat_id = trabajadorSeleccionado; // Aquí trabajadorSeleccionado ya es el chat_id del dropdown
        } else {
          // Si es admin/secretaria y no hay trabajador seleccionado, no cargar nada o cargar todos (según lógica de negocio)
          setRegistrosDia([]); 
          return;
        }
      } else {
        setRegistrosDia([]); // Rol desconocido o no manejado
        return;
      }
      
      console.log('[RegistrarHoras - cargarRegistros] Cargando registros con params:', queryParams);
      
      const regs = await horasService.getHoras(queryParams);
      let registrosFecha;

      if (!Array.isArray(regs)) {
        console.error("[RegistrarHoras - cargarRegistros] Error: La respuesta 'regs' de horasService.getHoras no es un array. Valor recibido:", regs);
        registrosFecha = []; // Tratar como array vacío para evitar error en .filter
      } else {
        // Solo mostrar los registros de la fecha seleccionada (en caso de que la API devuelva registros de más días)
        registrosFecha = regs.filter(reg => reg.fecha && reg.fecha.substring(0, 10) === fecha);
      }

      console.log('[RegistrarHoras - DEBUG] Registros ANTES de ordenar:', JSON.parse(JSON.stringify(registrosFecha.map(r => r.hora_inicio))));
      
      // Ordenar registros por hora_inicio antes de establecer el estado
      registrosFecha.sort((a, b) => {
        const minutosA = convertirHoraAMinutos(a.hora_inicio);
        const minutosB = convertirHoraAMinutos(b.hora_inicio);
        console.log(`[RegistrarHoras - DEBUG SORT] Comparando: A='${a.hora_inicio}' (${minutosA}) con B='${b.hora_inicio}' (${minutosB}) => Resultado: ${minutosA - minutosB}`);
        return minutosA - minutosB; // Ascendente
      });
      console.log('[RegistrarHoras - DEBUG] Registros DESPUÉS de ordenar:', JSON.parse(JSON.stringify(registrosFecha.map(r => r.hora_inicio))));
      setRegistrosDia(registrosFecha);
    } catch (err) {
      setError(`Error al cargar registros del día: ${err.message || 'Error desconocido'}`);
      console.error("Error en cargarRegistros: ", err);
      setRegistrosDia([]);
    }
  }, [usuario, trabajadorSeleccionado, fecha, registrosCompletos]); // Dependencias de cargarRegistros

  // Cargar datos iniciales
  const cargarDatosIniciales = useCallback(async () => {
    const user = authService.getCurrentUser();
    setUsuario(user);
    console.log('[RegistrarHoras - cargarDatosIniciales] Usuario actual:', user); // Log de diagnóstico

    if (user && (user.rol === 'admin' || user.rol === 'secretaria')) {
      try {
        const trabajadoresData = await trabajadoresService.getTrabajadores();
        setTrabajadores(trabajadoresData);
      } catch (error) {
        console.error("Error al cargar trabajadores:", error);
        setFormError("Error al cargar la lista de trabajadores.");
      }
    }

    if (user && user.rol === 'trabajador') {
      console.log('[RegistrarHoras - cargarDatosIniciales] Estableciendo trabajadorSeleccionado para rol trabajador con user.chat_id:', user.chat_id);
      
      // Si el usuario es trabajador pero no tiene chat_id, hay que buscarlo en la BD
      if (!user.chat_id) {
        console.log('[RegistrarHoras - cargarDatosIniciales] ⚠️ El usuario trabajador no tiene chat_id en localStorage. Intentando recuperarlo...');
        
        try {
          // Intentamos obtener los datos del usuario actual del backend
          const userInfo = await horasService.getUserInfo(); // Supuesto nuevo endpoint para obtener info del usuario
          if (userInfo && userInfo.chat_id) {
            console.log('[RegistrarHoras - cargarDatosIniciales] ✅ Recuperado chat_id del backend:', userInfo.chat_id);
            setTrabajadorSeleccionado(userInfo.chat_id);
            
            // Actualizar el localStorage con el chat_id
            const updatedUser = { ...user, chat_id: userInfo.chat_id };
            localStorage.setItem('user', JSON.stringify(updatedUser));
            setUsuario(updatedUser);
          } else {
            console.error('[RegistrarHoras - cargarDatosIniciales] ❌ No se pudo recuperar el chat_id del backend');
            setFormError("No se pudo identificar al trabajador. Por favor, recarga la página o contacta con el administrador.");
          }
        } catch (error) {
          console.error('[RegistrarHoras - cargarDatosIniciales] Error al intentar recuperar chat_id:', error);
          setFormError("Error al intentar identificar al trabajador. Por favor, recarga la página.");
        }
      } else {
        // Si el chat_id está presente, simplemente lo usamos
        setTrabajadorSeleccionado(user.chat_id);
      }
    }

    try {
      const obrasData = await obrasService.getObras();
      setObras(obrasData);
    } catch (error) {
      console.error("Error al cargar obras:", error);
      setFormError("Error al cargar la lista de obras.");
    }

    // Registros del día
    let registros;
    if (user && user.rol === 'trabajador') {
      registros = await horasService.getHorasHoy(); // Asumimos que getHorasHoy usa el token y el backend identifica al user
    } else {
      if (trabajadorSeleccionado) {
        registros = await horasService.getHoras({ chat_id: trabajadorSeleccionado }); // trabajadorSeleccionado es el chat_id
      } else {
        registros = [];
      }
    }
    setRegistrosCompletos(registros || []); // Poblar la lista maestra, la ordenación y el filtro por día se hará en cargarRegistros
  }, [trabajadorSeleccionado]);

  useEffect(() => {
    const cargarDatos = async () => {
      setLoading(true);
      try {
        await cargarDatosIniciales();
      } catch (err) {
        setError('Error al cargar datos iniciales');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    cargarDatos();
    // eslint-disable-next-line
  }, []);

  // Cargar partidas cuando cambia la obra seleccionada
  useEffect(() => {
    const cargarPartidas = async () => {
      if (obraSeleccionada) {
        try {
          const partidasData = await partidasService.getPartidasPorObra(obraSeleccionada);
          // Filtrar solo las no acabadas y de la obra seleccionada
          const filteredPartidas = partidasData.filter(p => p.id_obra === parseInt(obraSeleccionada) && !p.acabada);
          setPartidas(filteredPartidas);
          console.log('[RegistrarHoras - useEffect obraSeleccionada] Partidas cargadas para obra ID', obraSeleccionada, ':', filteredPartidas);
        } catch (err) {
          setPartidas([]);
        }
      } else {
        setPartidas([]);
      }
    };
    cargarPartidas();
  }, [obraSeleccionada]);

  // Cargar registros del día cuando cambia el trabajador seleccionado o la fecha
  useEffect(() => {
    // Ahora simplemente llamamos a la función cargarRegistros definida con useCallback
    cargarRegistros();
  }, [cargarRegistros]); // La dependencia es la propia función cargarRegistros

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
      if (registro.id_movimiento === (editandoId || null)) {
        continue;
      }
      
      // Convertir cada horario existente en tramos de minutos
      const tramosExistentes = registro.horario.split(',').map(tramo => {
        const [inicio, fin] = tramo.split('-');
        const [horaInicio, minInicio] = inicio.split(':').map(Number);
        const [horaFin, minFin] = fin.split(':').map(Number);
        
        return {
          inicioMinutos: horaInicio * 60 + minInicio,
          finMinutos: horaFin * 60 + minFin,
          obra: registro.id_obra,
          partida: registro.id_partida
        };
      });
      
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

  // --- Lógica para añadir/editar registro de horas ---
  const handleAddRegistro = async () => {
    setAdding(true);
    setFormError('');
    console.log('[RegistrarHoras - handleAddRegistro] Estado antes de validación - Usuario:', usuario, 'Trabajador Seleccionado:', trabajadorSeleccionado); // <--- NUEVO LOG

    // Validar que la fecha esté seleccionada
    if (!fecha) {
      setFormError('Por favor, selecciona una fecha.');
      setAdding(false);
      return;
    }

    // Validar que trabajadorSeleccionado tenga un valor si el rol es admin/secretaria
    if (usuario && (usuario.rol === 'admin' || usuario.rol === 'secretaria') && !trabajadorSeleccionado) {
      setFormError('Por favor, selecciona un trabajador.');
      setAdding(false);
      return;
    }
    // Validar que trabajadorSeleccionado (que es el user.chat_id para el trabajador) tiene valor
    if (usuario && usuario.rol === 'trabajador' && !trabajadorSeleccionado) {
        setFormError('No se pudo identificar al trabajador. Por favor, recarga la página.');
        setAdding(false);
        return;
    }

    if (!obraSeleccionada || 
        (esRegularizacion 
          ? (!partidaSeleccionada || !horasRegularizacion) 
          : tramos.some(t => !t.horaInicio || !t.minutoInicio || !t.horaFin || !t.minutoFin || !t.idPartida)) 
    ) {
      setFormError('Por favor, completa todos los campos obligatorios: Obra, y para cada tramo: horas y partida. Si es regularización, también la partida global y las horas de regularización.');
      setAdding(false);
      return;
    }

    const totalHorasCalculado = esRegularizacion ? parseFloat(horasRegularizacion) : calcularTotalHoras();
    if (totalHorasCalculado <= 0) {
        setFormError('El total de horas debe ser mayor que cero.');
        setAdding(false);
        return;
    }

    // Construir los datos del registro
    // El backend espera un solo string para horario, ej: "08:00-12:00,13:00-17:00"
    const horarioString = esRegularizacion ? null : tramos.map(t => `${t.horaInicio}:${t.minutoInicio}-${t.horaFin}:${t.minutoFin}`).join(',');

    // Validar solapamientos (Temporalmente comentado - la validación principal estará en el backend)
    /*
    if (!esRegularizacion && tramos.length > 0) {
      // Aquí podríamos añadir una validación de solapamientos ENTRE los tramos que se están añadiendo
      // y/o una validación preliminar con registrosDia.
      // Por ahora, se delega al backend.
    }
    */

    let payload;
    if (esRegularizacion) {
      payload = {
        chat_id: (usuario && usuario.rol === 'trabajador') ? usuario.chat_id : trabajadorSeleccionado,
        nombre_trabajador: '', // El backend lo obtiene
        fecha: fecha,
        id_obra: parseInt(obraSeleccionada),
        id_partida: parseInt(partidaSeleccionada), // Partida global para regularización
        horario: null, // No aplica para regularización individual
        horas_totales: totalHorasCalculado,
        es_extra: false, // Regularizaciones no son extra bajo este modelo
        tipo_extra: null,
        descripcion_extra: null,
        es_regularizacion: true,
      };
    } else {
      // Crear un array de payloads, uno por cada tramo
      payload = tramos.map(tramo => {
        // Calcular horas_totales para este tramo específico
        const inicioDate = new Date(`1970-01-01T${tramo.horaInicio}:${tramo.minutoInicio}:00`);
        const finDate = new Date(`1970-01-01T${tramo.horaFin}:${tramo.minutoFin}:00`);
        let diffMillis = finDate - inicioDate;
        if (diffMillis < 0) { // Si el tramo cruza la medianoche (ej. 22:00 - 02:00), no manejado aquí directamente
          // Considerar cómo manejar esto o si es un caso no permitido. Por ahora, tratar como error o cálculo simple.
          // Para un cálculo simple que no cruce medianoche:
          diffMillis = Math.max(0, diffMillis); 
        }
        const horasTramo = diffMillis / (1000 * 60 * 60);

        return {
          chat_id: (usuario && usuario.rol === 'trabajador') ? usuario.chat_id : trabajadorSeleccionado,
          nombre_trabajador: '', // El backend lo obtiene
          fecha: fecha,
          id_obra: parseInt(obraSeleccionada),
          id_partida: parseInt(tramo.idPartida), // Partida específica del tramo
          hora_inicio: `${tramo.horaInicio}:${tramo.minutoInicio}`,
          hora_fin: `${tramo.horaFin}:${tramo.minutoFin}`,
          // 'horario' (string combinado) ya no se usa para registros por tramo
          horas_totales: horasTramo,
          es_extra: tramo.esExtra,
          tipo_extra: tramo.esExtra ? tramo.tipoExtra : null,
          descripcion_extra: tramo.esExtra ? tramo.descripcionExtra : null,
          es_regularizacion: false, // Los tramos individuales no son regularizaciones
        };
      });
    }

    try {
      if (esRegularizacion) {
        await horasService.createHora(payload); // Endpoint existente para una sola hora/regularización
      } else {
        // Asumimos un nuevo endpoint para crear múltiples horas (tramos) en lote
        // Esto requerirá crear horasService.createHorasLote que envíe el array 'payload'
        await horasService.createHorasLote({ tramos: payload }); 
      }

      // Si todo va bien, limpiar error y resetear formulario:
      setFormError('');
      setObraSeleccionada('');
      // Si es regularización y se usaba partidaSeleccionada globalmente, resetearla.
      if (esRegularizacion) {
          setPartidaSeleccionada(''); 
      }
      setTramos([
        {
          horaInicio: '08', minutoInicio: '00', horaFin: '17', minutoFin: '00',
          idPartida: '',
          esExtra: false,
          tipoExtra: 'interno',
          descripcionExtra: ''
        }
      ]);
      setEsRegularizacion(false);
      setHorasRegularizacion('');
      // Los estados globales de esExtra, tipoExtra, descripcionExtra ya no se resetean aquí.

      // Llamada para refrescar la lista de registros del día
      await cargarRegistros();
      setEditandoId(null); // Limpiar el ID si se estaba editando

    } catch (err) {
      console.error("Error in handleAddRegistro:", err);
      let errorMessage = 'Error al guardar el registro.';
      if (err.response && err.response.data && err.response.data.detail) {
        if (Array.isArray(err.response.data.detail)) {
          errorMessage = err.response.data.detail.map(e => {
            const loc = e.loc && e.loc.length > 1 ? e.loc[1] : (e.loc && e.loc.length > 0 ? e.loc[0] : 'Campo desconocido');
            const msg = e.msg || 'Error desconocido';
            return `${loc}: ${msg}`;
          }).join('; ');
        } else if (typeof err.response.data.detail === 'string') {
          errorMessage = err.response.data.detail;
        }
      }
      setFormError(errorMessage);
    } finally {
      setAdding(false);
    }
  };

  // Editar registro
  const handleEditar = async (registro) => {
    if (!registro || typeof registro.id_obra === 'undefined' || typeof registro.id_partida === 'undefined') {
      console.error("[RegistrarHoras - handleEditar] Error: El registro es inválido o le faltan IDs.", registro);
      setFormError("No se puede editar el registro: datos incompletos.");
      return;
    }

    setEditLoading(true); // Mostrar indicador de carga
    setFormError('');

    try {
      // 1. Cargar las partidas para la obra del registro específico
      console.log(`[RegistrarHoras - handleEditar] Cargando partidas para obra ID: ${registro.id_obra}`);
      const partidasData = await partidasService.getPartidasPorObra(registro.id_obra.toString());
      // Primero, filtramos por la obra del registro actual, luego por las no acabadas
      const obraFiltradaPartidas = partidasData.filter(p => p.id_obra === registro.id_obra);
      const filteredPartidasModal = obraFiltradaPartidas.filter(p => !p.acabada);
      setPartidasModalEdicion(filteredPartidasModal);
      console.log('[RegistrarHoras - handleEditar] Partidas cargadas y filtradas para el modal:', filteredPartidasModal);

      // 2. Establecer el registro que se está editando
      setRegistroEditando(registro);

      // 3. Formatear hora_inicio y hora_fin para los TextField del modal y otros datos del tramo
      const [hInicio, mInicio] = registro.hora_inicio ? registro.hora_inicio.split(':') : ['', ''];
      const [hFin, mFin] = registro.hora_fin ? registro.hora_fin.split(':') : ['', ''];

      setEditandoTramosHorarios([{
        horaInicio: hInicio || '', // CORREGIDO
        minutoInicio: mInicio || '', // CORREGIDO
        horaFin: hFin || '', // CORREGIDO
        minutoFin: mFin || '', // CORREGIDO
        // idPartida aquí es redundante si tenemos un Select de partida general para el modal
        esExtra: !!registro.es_extra,
        tipoExtra: registro.tipo_extra || 'interno',
        descripcionExtra: registro.descripcion_extra || ''
      }]);

      // 4. Establecer la partida actual en el modal
      setEditandoPartida(registro.id_partida ? registro.id_partida.toString() : '');

      // 5. Establecer otros campos de edición (si son globales al modal y no por tramo)
      setEditandoEsExtra(!!registro.es_extra);
      setEditandoTipoExtra(registro.tipo_extra || 'interno');
      setEditandoDescripcionExtra(registro.descripcion_extra || '');

      // 6. Abrir el modal
      setEditModalOpen(true);

    } catch (error) {
      console.error("[RegistrarHoras - handleEditar] Error al cargar partidas o preparar modal:", error);
      setFormError("Error al cargar datos para la edición: " + (error.message || 'Desconocido'));
      setPartidasModalEdicion([]); // Limpiar en caso de error
    } finally {
      setEditLoading(false); // Ocultar indicador de carga
    }
  };

  // Guardar edición
  const handleSaveEdit = async () => {
    setFormError('');
    setEditLoading(true);

    if (!editandoPartida) {
      setFormError('Por favor, selecciona una partida para el registro que estás editando.');
      setEditLoading(false);
      return;
    }
  if (!editandoTramosHorarios || editandoTramosHorarios.length === 0) {
    setFormError('Error: No hay datos del tramo para editar.');
    setEditLoading(false);
    return;
  }
  const tramoEditado = editandoTramosHorarios[0];
  const { horaInicio, minutoInicio, horaFin, minutoFin } = tramoEditado;

  if (!horaInicio || !minutoInicio || !horaFin || !minutoFin) {
    setFormError('Por favor, completa todas las horas y minutos del tramo.');
    setEditLoading(false);
    return;
  }

  const nuevaHoraInicioStr = `${horaInicio}:${minutoInicio}`;
  const nuevaHoraFinStr = `${horaFin}:${minutoFin}`;
  const nuevoHorarioStr = `${nuevaHoraInicioStr}-${nuevaHoraFinStr}`;
  
  // Calcular horas totales del tramo editado
  const totalHoras = calcularHorasEditandoTramo();

    // Validar solapamientos con registros existentes para el mismo día y trabajador
    // Excluir el registro que estamos editando
    const registrosDeMismoDia = registrosDia.filter(r => 
      r.id_movimiento !== registroEditando.id_movimiento
    );
    
    const validacion = validarSolapamientos(nuevoHorarioStr, registrosDeMismoDia);
    if (validacion.solapado) {
      setFormError(validacion.mensaje);
      setEditLoading(false);
      return;
    }
    
    try {
      const updatedRecord = {
        ...registroEditando, // Mantiene campos no editados como fecha, id_trabajador, etc.
        id_partida: parseInt(editandoPartida), // Tomado del Select general del modal
        horario: nuevoHorarioStr,       // String HH:MM-HH:MM
        hora_inicio: nuevaHoraInicioStr, // String HH:MM
        hora_fin: nuevaHoraFinStr,       // String HH:MM
        horas_totales: totalHoras,
        // Los datos de 'extra' se toman de tramoEditado para consistencia con handleEditar
        es_extra: tramoEditado.esExtra,
        tipo_extra: tramoEditado.esExtra ? tramoEditado.tipoExtra : null,
        descripcion_extra: tramoEditado.esExtra ? tramoEditado.descripcionExtra : null
      };
      
      await horasService.updateHora(registroEditando.id_movimiento, updatedRecord);
      
      // Cerrar modal y refrescar registros
      setEditModalOpen(false);
      setRegistroEditando(null);
      await cargarRegistros();
      
    } catch (error) {
      console.error("Error al actualizar el registro:", error);
      setFormError(error.response?.data?.detail || 'Error al actualizar el registro');
    } finally {
      setEditLoading(false);
    }
  };

  // Cancelar edición
  const handleCloseEditModal = () => {
    setEditModalOpen(false);
    setRegistroEditando(null);
    setFormError('');
    setPartidasModalEdicion([]); // Limpiar partidas del modal al cerrar
    setEditandoTramosHorarios([{ horaInicio: '', minutoInicio: '', horaFin: '', minutoFin: '', esExtra: false, tipoExtra: 'interno', descripcionExtra: '' }]); // Resetear tramos
  };

  // Eliminar registro
  const handleEliminar = async (id) => {
    if (!window.confirm('¿Seguro que quieres eliminar este registro?')) return;
    try {
      await horasService.deleteHora(id);
      await cargarRegistros(); // Llamada para refrescar la lista
    } catch (err) {
      alert(err.response?.data?.detail || 'Error al eliminar el registro');
    }
  };

  // --- NUEVO: Funciones para gestionar tramos ---
  const handleTramoChange = (index, field, value) => {
    const nuevosTramos = [...tramos];
    nuevosTramos[index][field] = value;
    // Si se desactiva esExtra para un tramo, limpiar sus campos relacionados
    if (field === 'esExtra' && !value) {
      nuevosTramos[index].tipoExtra = 'interno';
      nuevosTramos[index].descripcionExtra = '';
    }
    setTramos(nuevosTramos);
  };
  const handleAddTramo = () => {
    setTramos([
      ...tramos,
      {
        horaInicio: '', minutoInicio: '', horaFin: '', minutoFin: '',
        idPartida: '',
        esExtra: false,
        tipoExtra: 'interno',
        descripcionExtra: ''
      }
    ]);
  };
  const handleEditandoTramoChange = (field, value) => {
    setEditandoTramosHorarios(prev => {
      const updatedTramo = { ...prev[0], [field]: value };
      // Si esExtra se desmarca, limpiar campos dependientes
      if (field === 'esExtra' && !value) {
        updatedTramo.tipoExtra = 'interno';
        updatedTramo.descripcionExtra = '';
      }
      return [updatedTramo];
    });
  };

  const calcularHorasEditandoTramo = () => {
    if (!editandoTramosHorarios || editandoTramosHorarios.length === 0) return 0;
    const tramo = editandoTramosHorarios[0];
    if (!tramo.horaInicio || !tramo.minutoInicio || !tramo.horaFin || !tramo.minutoFin) return 0;
    const hIni = parseInt(tramo.horaInicio);
    const mIni = parseInt(tramo.minutoInicio);
    const hFin = parseInt(tramo.horaFin);
    const mFin = parseInt(tramo.minutoFin);
    if (isNaN(hIni) || isNaN(mIni) || isNaN(hFin) || isNaN(mFin)) return 0;
    let horas = (hFin + mFin / 60) - (hIni + mIni / 60);
    // if (horas < 0) horas += 24; // Considerar si se permiten tramos que crucen medianoche
    return Math.max(0, horas);
  };

  const handleRemoveTramo = (index) => {
    if (tramos.length === 1) return; // No permitir menos de un tramo
    setTramos(prev => prev.filter((_, i) => i !== index));
  };
  // --- Calcular total de horas de todos los tramos ---
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

  return (
    <Layout>
      <Box className="pb-6">
        <Box className="flex justify-between items-center mb-6">
          <Typography variant="h4" component="h1" className="font-bold text-gray-800">
            Registrar Horas
          </Typography>
        </Box>

        {error && (
          <Alert severity="error" className="mb-6">
            {error}
          </Alert>
        )}

        {loading ? (
          <Box display="flex" justifyContent="center" my={4}>
            <CircularProgress />
          </Box>
        ) : (
          <>
          <form onSubmit={(e) => { e.preventDefault(); handleAddRegistro(); }}>
            <Box display="flex" flexDirection="column" gap={isMobile ? 1.5 : 2}>
              {/* Trabajador (solo admin/secretaria) */}
              {usuario && (usuario.rol === 'admin' || usuario.rol === 'secretaria') && (
                <FormControl fullWidth required>
                  <InputLabel>Trabajador</InputLabel>
                  <Select
                    value={trabajadorSeleccionado}
                    label="Trabajador"
                    onChange={e => setTrabajadorSeleccionado(e.target.value)}
                  >
                    <MenuItem value="">Selecciona un trabajador</MenuItem>
                    {trabajadores.map(t => (
                      <MenuItem key={t.chat_id} value={t.chat_id}>{t.nombre}</MenuItem> // USAR t.chat_id para key y value
                    ))}
                  </Select>
                </FormControl>
              )}
              {/* Fecha */}
              <TextField
                label="Fecha"
                type="date"
                value={fecha}
                onChange={e => setFecha(e.target.value)}
                InputLabelProps={{ shrink: true }}
                InputProps={{
                  inputProps: {
                    max: hoyISO, // No se pueden seleccionar fechas futuras
                    ...(usuario && usuario.rol === 'trabajador' && { min: ayerISO }) // Para trabajadores, no antes de ayer
                  }
                }}
                required
                fullWidth
                sx={{ mb: 2 }}
              />
              {/* Obra */}
              <FormControl fullWidth required>
                <InputLabel>Obra</InputLabel>
                <Select
                  value={obraSeleccionada}
                  label="Obra"
                  onChange={e => setObraSeleccionada(e.target.value)}
                >
                  <MenuItem value="">Selecciona una obra</MenuItem>
                  {obras.map(o => (
                    <MenuItem key={o.id_obra} value={o.id_obra}>{o.nombre_obra}</MenuItem>
                  ))}
                </Select>
              </FormControl>
              {/* Partida (Solo para regularización) */}
              {esRegularizacion && (
                <FormControl fullWidth required>
                  <InputLabel>Partida</InputLabel>
                  <Select
                    value={partidaSeleccionada}
                    label="Partida"
                    onChange={e => setPartidaSeleccionada(e.target.value)}
                    disabled={!obraSeleccionada} // Opcional: deshabilitar si no hay obra
                  >
                    <MenuItem value="">Selecciona una partida</MenuItem>
                    {partidas.map(p => (
                      <MenuItem key={p.id_partida} value={p.id_partida}>{p.nombre_partida}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
              )}

              {/* --- Switch para Es Regularización --- */}
              {usuario && (usuario.rol === 'admin' || usuario.rol === 'secretaria') && (
                <FormControlLabel
                  control={
                    <Switch
                      checked={esRegularizacion}
                      onChange={(e) => {
                        setEsRegularizacion(e.target.checked);
                        if (e.target.checked) {
                          // Opcional: Limpiar tramos si se activa regularización
                          // setTramos([{ horaInicio: '', minutoInicio: '', horaFin: '', minutoFin: '' }]); 
                        } else {
                          // Opcional: Limpiar horas de regularización si se desactiva
                           setHorasRegularizacion(''); 
                        }
                      }}
                      name="esRegularizacion"
                      color="primary"
                    />
                  }
                  label="¿Es Regularización?"
                  sx={{ mb: 2, display: 'block' }} 
                />
              )}

              {/* --- Sección de Tramos Horarios --- */}
              {esRegularizacion ? (
                <TextField
                  label="Horas de regularización"
                  type="number"
                  value={horasRegularizacion}
                  onChange={e => setHorasRegularizacion(e.target.value)}
                  required
                  fullWidth
                  sx={{ mb: 2 }}
                />
              ) : (
                <Box>
                  <Typography variant="subtitle1" gutterBottom>Tramos horarios</Typography>
                  {tramos.map((tramo, idx) => (
                    <Box 
                      key={idx} 
                      display="flex" 
                      flexDirection={isMobile ? "column" : "row"} 
                      gap={1} 
                      alignItems={isMobile ? "stretch" : "center"} 
                      mb={2}
                      sx={theme => ({
                        p: 1.5, // Aumentar un poco el padding para el color de fondo
                        border: '1px solid',
                        borderColor: theme.palette.divider,
                        borderRadius: 1,
                        backgroundColor: theme.palette.grey[100], // Color de fondo para los tramos
                        boxShadow: theme.shadows[1] // Opcional: añadir una ligera sombra
                      })}
                    >
                      {/* Fila superior en móvil - Tramo inicio */}
                      <Box display="flex" gap={1} flex={1}>
                        <FormControl required fullWidth={isMobile} sx={theme => ({ backgroundColor: theme.palette.background.paper })}>
                          <InputLabel>Hora inicio</InputLabel>
                          <Select
                            value={tramo.horaInicio}
                            label="Hora inicio"
                            onChange={e => handleTramoChange(idx, 'horaInicio', e.target.value)}
                          >
                            {HOUR_OPTIONS.map(h => <MenuItem key={h} value={h}>{h}</MenuItem>)}
                          </Select>
                        </FormControl>
                        <FormControl required fullWidth={isMobile} sx={theme => ({ backgroundColor: theme.palette.background.paper })}>
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
                      
                      {/* Fila inferior en móvil - Tramo fin */}
                      <Box display="flex" gap={1} flex={1}>
                        <FormControl required fullWidth={isMobile} sx={theme => ({ backgroundColor: theme.palette.background.paper })}>
                          <InputLabel>Hora fin</InputLabel>
                          <Select
                            value={tramo.horaFin}
                            label="Hora fin"
                            onChange={e => handleTramoChange(idx, 'horaFin', e.target.value)}
                          >
                            {HOUR_OPTIONS.map(h => <MenuItem key={h} value={h}>{h}</MenuItem>)}
                          </Select>
                        </FormControl>
                        <FormControl required fullWidth={isMobile} sx={theme => ({ backgroundColor: theme.palette.background.paper })}>
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
                      
                      {/* Selector de Partida para el Tramo */}
                      <FormControl fullWidth required sx={theme => ({ mt: isMobile ? 2 : 0, mb: isMobile ? 1 : 0, flexBasis: '100%', '@media (min-width: 600px)': { flexBasis: 'auto', minWidth: 220 }, backgroundColor: theme.palette.background.paper } )}>
                        <InputLabel id={`partida-tramo-label-${idx}`}>Partida</InputLabel>
                        <Select
                          labelId={`partida-tramo-label-${idx}`}
                          value={tramo.idPartida}
                          label="Partida del Tramo"
                          onChange={e => handleTramoChange(idx, 'idPartida', e.target.value)}
                        >
                          <MenuItem value=""><em>Selecciona partida</em></MenuItem>
                          {partidas.map(p => (
                            <MenuItem key={p.id_partida} value={p.id_partida}>{p.nombre_partida}</MenuItem>
                          ))}
                        </Select>
                      </FormControl>

                      {/* Controles "Es Extra" para el Tramo */}
                      <Box sx={{ mt: 1, p: 1.5, border: '1px solid', borderColor: 'rgba(0, 0, 0, 0.12)', borderRadius: 1, width: '100%', display: 'flex', flexDirection: 'column', gap: 1 }}>
                        <FormControlLabel
                          control={
                            <Switch
                              checked={tramo.esExtra}
                              onChange={e => handleTramoChange(idx, 'esExtra', e.target.checked)}
                              color="primary"
                              size="small"
                            />
                          }
                          label={<Typography variant="body2">¿Tramo Extra?</Typography>}
                          sx={{ alignSelf: 'flex-start' }}
                        />
                        {tramo.esExtra && (
                          <Box sx={{ pl: 0, display: 'flex', flexDirection: 'column', gap: 1 /* Ajustado para móvil */ }}>
                            <FormControl component="fieldset">
                              <RadioGroup
                                row
                                value={tramo.tipoExtra}
                                onChange={e => handleTramoChange(idx, 'tipoExtra', e.target.value)}
                                sx={{ justifyContent: 'flex-start' }}
                              >
                                <FormControlLabel value="interno" control={<Radio size="small" />} label={<Typography variant="caption">Interno</Typography>} />
                                <FormControlLabel value="externo" control={<Radio size="small" />} label={<Typography variant="caption">Externo</Typography>} />
                              </RadioGroup>
                            </FormControl>
                            <TextField
                              label="Descripción Extra (Tramo)"
                              value={tramo.descripcionExtra}
                              onChange={e => handleTramoChange(idx, 'descripcionExtra', e.target.value)}
                              required={tramo.esExtra} /* Esto es opcional, podrías quitarlo si la descripción no es estrictamente requerida */
                              fullWidth
                              variant="outlined"
                              size="small"
                              multiline
                              rows={1} /* Empezar con 1 fila, se expandirá si es necesario */
                            />
                          </Box>
                        )}
                      </Box>

                      {/* Botón eliminar */}
                      <Button
                        variant="outlined"
                        color="error"
                        size="small"
                        onClick={() => handleRemoveTramo(idx)}
                        disabled={tramos.length === 1}
                        sx={{ alignSelf: 'center', minWidth: 'auto', px: 1, mt: isMobile ? 1 : 0, ml: !isMobile ? 1 : 0 /* Margen a la izquierda en desktop */ }}
                      >
                        X
                      </Button>
                    </Box>
                  ))}
                  <Button variant="outlined" size="small" onClick={handleAddTramo} sx={{ mt: 1 }}>Añadir tramo</Button>
                  <Typography mt={2} fontWeight={600}>Total de horas: {calcularTotalHoras().toFixed(2)}</Typography>
                </Box>
              )}
              {formError && <Alert severity="error">{formError}</Alert>}
              <Box display="flex" gap={2}>
                <Button type="submit" variant="contained" color="primary" disabled={adding}>
                  {adding ? 'Añadiendo...' : 'Añadir registro'}
                </Button>
              </Box>
            </Box>
          </form>
          
          <Paper elevation={3} className="mt-6">
            <Box className="p-4">
              <Typography variant="h6" className="mb-4">
                {fecha ? (() => {
                  // Convertir string de fecha a objeto Date
                  const fechaObj = new Date(fecha);
                  // Días de la semana en español
                  const diasSemana = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
                  // Formatear fecha como dd/mm/aaaa
                  const dia = fechaObj.getDate().toString().padStart(2, '0');
                  const mes = (fechaObj.getMonth() + 1).toString().padStart(2, '0');
                  const año = fechaObj.getFullYear();
                  
                  return `Registros del día ${diasSemana[fechaObj.getDay()]}, ${dia}/${mes}/${año}`;
                })() : 'Registros del día'}
              </Typography>
              
              {registrosDia.length === 0 ? (
                <Alert severity="info" className="mb-4">No hay registros para este día.</Alert>
              ) : (
                <>
                  {/* Vista móvil/tablet: tarjetas */}
                  {(isMobile || isTablet) ? (
                    <Stack spacing={2}>
                      {registrosDia.map(reg => (
                        <Card key={reg.id_movimiento} elevation={1}>
                          <CardContent>
                            <Grid container spacing={1}>
                              <Grid item xs={12}>
                                <Typography variant="subtitle1" fontWeight="bold">
                                  {obras.find(o => o.id_obra === reg.id_obra)?.nombre_obra || reg.id_obra}
                                </Typography>
                                <Typography variant="body2" color="text.secondary" gutterBottom>
                                  {reg.nombre_partida || 'No especificada'}
                                </Typography>
                              </Grid>
                              
                              <Grid item xs={6}>
                                <Typography variant="body2">
                                  <strong>Horario:</strong> {reg.horario || '-'}
                                </Typography>
                              </Grid>
                              <Grid item xs={6}>
                                <Typography variant="body2">
                                  <strong>Horas:</strong> {reg.horas_totales}
                                </Typography>
                              </Grid>
                              
                              {reg.es_extra && (
                                <Grid item xs={12}>
                                  <Chip 
                                    size="small" 
                                    color="warning" 
                                    label={`Extra ${reg.tipo_extra || ''}`} 
                                    sx={{ my: 0.5 }}
                                  />
                                  {reg.descripcion_extra && (
                                    <Typography variant="body2" fontSize="0.8rem">
                                      {reg.descripcion_extra}
                                    </Typography>
                                  )}
                                </Grid>
                              )}
                              
                              <Grid item xs={12} sx={{ mt: 1 }}>
                                { (usuario && usuario.rol !== 'trabajador') || (usuario && usuario.rol === 'trabajador' && esFechaPermitidaParaAccionTrabajador(reg.fecha)) ? (
                                  <Stack direction="row" spacing={1} justifyContent="flex-end">
                                    <Button size="small" variant="outlined" onClick={() => handleEditar(reg)}>
                                      Editar
                                    </Button>
                                    <Button size="small" variant="outlined" color="error" onClick={() => handleEliminar(reg.id_movimiento)}>
                                      Eliminar
                                    </Button>
                                  </Stack>
                                ) : null }
                              </Grid>
                            </Grid>
                          </CardContent>
                        </Card>
                      ))}
                    </Stack>
                  ) : (
                    /* Vista desktop: tabla completa */
                    <TableContainer>
                      <Table>
                        <TableHead>
                          <TableRow>
                            <TableCell>Obra</TableCell>
                            <TableCell>Partida</TableCell>
                            <TableCell>Horario</TableCell>
                            <TableCell>Horas</TableCell>
                            <TableCell>¿Extra?</TableCell>
                            <TableCell>Tipo extra</TableCell>
                            <TableCell>Descripción extra</TableCell>
                            <TableCell>Acciones</TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {registrosDia.map(reg => (
                            <TableRow key={reg.id_movimiento}>
                              <TableCell>{obras.find(o => o.id_obra === reg.id_obra)?.nombre_obra || reg.id_obra}</TableCell>
                              <TableCell>{reg.nombre_partida || 'No especificada'}</TableCell>
                              <TableCell>{reg.horario}</TableCell>
                              <TableCell>{reg.horas_totales}</TableCell>
                              <TableCell>{reg.es_extra ? 'Sí' : 'No'}</TableCell>
                              <TableCell>{reg.tipo_extra || '-'}</TableCell>
                              <TableCell>{reg.descripcion_extra || '-'}</TableCell>
                              <TableCell>
                                { (usuario && usuario.rol !== 'trabajador') || (usuario && usuario.rol === 'trabajador' && esFechaPermitidaParaAccionTrabajador(reg.fecha)) ? (
                                  <>
                                    <Button size="small" variant="outlined" onClick={() => handleEditar(reg)} sx={{ mr: 1 }}>Editar</Button>
                                    <Button size="small" variant="outlined" color="error" onClick={() => handleEliminar(reg.id_movimiento)}>Eliminar</Button>
                                  </>
                                ) : null }
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                        {registrosDia.length > 0 && (
                          <TableFooter style={{ backgroundColor: '#f0f0f0' }}>
                            <TableRow>
                              <TableCell colSpan={3} style={{ textAlign: 'right', fontWeight: 'bold', borderBottom: 'none' }}>
                                <Typography variant="subtitle1" style={{ fontWeight: 'bold' }}>Total Horas del Día:</Typography>
                              </TableCell>
                              <TableCell align="right" style={{ fontWeight: 'bold', borderBottom: 'none' }}>
                                <Typography variant="subtitle1" style={{ fontWeight: 'bold' }}>{totalHorasRegistradasDia}</Typography>
                              </TableCell>
                              {/* Columnas: Obra, Partida, Horario | Horas | ¿Extra?, Tipo extra, Descripción extra, Acciones (8 total) */}
                              {/* ColSpan para ¿Extra? y las siguientes 3 es 4 */}
                              <TableCell colSpan={4} style={{ borderBottom: 'none' }} /> 
                            </TableRow>
                          </TableFooter>
                        )}
                      </Table>
                    </TableContainer>
                  )}
                </>
              )}
            </Box>
          </Paper>
          </>
        )}
      
      {/* Modal de edición */}
      <Dialog 
        open={editModalOpen} 
        onClose={handleCloseEditModal}
        fullWidth
        maxWidth="md"
      >
        <DialogTitle>Editar Registro de Horas</DialogTitle>
        <DialogContent>
          {formError && <Alert severity="error" sx={{ mb: 2 }}>{formError}</Alert>}
          
          <Grid container spacing={2} sx={{ mt: 1 }}>
            {/* Obra (solo lectura) */}
            <Grid item xs={12} md={6}>
              <TextField
                label="Obra"
                value={registroEditando ? (obras.find(o => o.id_obra === registroEditando.id_obra)?.nombre_obra || '') : ''}
                InputProps={{ readOnly: true }}
                fullWidth
              />
            </Grid>
            
            {/* Partida */}
            <Grid item xs={12} md={6}>
              <FormControl fullWidth required>
                <InputLabel>Partida</InputLabel>
                <Select
                  value={editandoPartida}
                  label="Partida"
                  onChange={(e) => setEditandoPartida(e.target.value)}
                  disabled={partidasModalEdicion.length === 0 || editLoading}
                >
                  <MenuItem value="">Selecciona una partida</MenuItem>
                  {partidasModalEdicion.map(p => (
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
              {editandoTramosHorarios && editandoTramosHorarios.length > 0 && (() => {
                const tramo = editandoTramosHorarios[0]; // Get the first (and should be only) tramo
                const idx = 0; // key for the Box, can be static as it's the only one
                return (
                  <Box 
                    key={idx} 
                    display="flex" 
                    flexDirection={isMobile ? "column" : "row"} 
                    gap={1} 
                    alignItems={isMobile ? "stretch" : "center"} 
                    mb={2}
                    sx={{
                      p: 1,
                      border: '1px solid',
                      borderColor: 'divider',
                      borderRadius: 1,
                      backgroundColor: 'background.default' // Static background, or remove if not needed for single item
                    }}
                  >
                    {/* Tramo inicio */}
                    <Box display="flex" gap={1} flex={1}>
                      <FormControl required fullWidth={isMobile}>
                        <InputLabel>Hora inicio</InputLabel>
                        <Select
                          value={tramo.horaInicio}
                          label="Hora inicio"
                          onChange={e => handleEditandoTramoChange('horaInicio', e.target.value)}
                        >
                          {HOUR_OPTIONS.map(h => <MenuItem key={h} value={h}>{h}</MenuItem>)}
                        </Select>
                      </FormControl>
                      <FormControl required fullWidth={isMobile}>
                        <InputLabel>Minuto inicio</InputLabel>
                        <Select
                          value={tramo.minutoInicio}
                          label="Minuto inicio"
                          onChange={e => handleEditandoTramoChange('minutoInicio', e.target.value)}
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
                      <FormControl required fullWidth={isMobile}>
                        <InputLabel>Hora fin</InputLabel>
                        <Select
                          value={tramo.horaFin}
                          label="Hora fin"
                          onChange={e => handleEditandoTramoChange('horaFin', e.target.value)}
                        >
                          {HOUR_OPTIONS.map(h => <MenuItem key={h} value={h}>{h}</MenuItem>)}
                        </Select>
                      </FormControl>
                      <FormControl required fullWidth={isMobile}>
                        <InputLabel>Minuto fin</InputLabel>
                        <Select
                          value={tramo.minutoFin}
                          label="Minuto fin"
                          onChange={e => handleEditandoTramoChange('minutoFin', e.target.value)}
                        >
                          {MINUTE_OPTIONS.map(m => <MenuItem key={m} value={m}>{m}</MenuItem>)}
                        </Select>
                      </FormControl>
                    </Box>
                    
                    {/* Botón eliminar */}
                    {/* Button to remove tramo - not needed in edit mode for a single record */}
                  </Box>
                );
              })()}
              {/* Button to add tramo - not needed in edit mode for a single record */}
              <Typography mt={2} fontWeight={600}>Total de horas: {calcularHorasEditandoTramo().toFixed(2)}</Typography>
            </Grid>
            
            {/* Es extra */}
            <Grid item xs={12}>
              <FormControlLabel
                control={<Switch checked={editandoEsExtra} onChange={(e) => setEditandoEsExtra(e.target.checked)} />}
                label="¿Es extra?"
              />
            </Grid>
            
            {/* Tipo de extra y descripción (solo si es extra) */}
            {editandoEsExtra && (
              <>
                <Grid item xs={12} md={6}>
                  <FormControl component="fieldset">
                    <RadioGroup
                      row
                      value={editandoTipoExtra}
                      onChange={(e) => setEditandoTipoExtra(e.target.value)}
                    >
                      <FormControlLabel value="interno" control={<Radio />} label="Interno" />
                      <FormControlLabel value="externo" control={<Radio />} label="Externo" />
                    </RadioGroup>
                  </FormControl>
                </Grid>
                
                <Grid item xs={12}>
                  <TextField
                    label="Descripción del extra"
                    value={editandoDescripcionExtra}
                    onChange={(e) => setEditandoDescripcionExtra(e.target.value)}
                    fullWidth
                    required={editandoEsExtra}
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
      </Box> {/* Cierre del Box className="pb-6" de la línea 712 */}
    </Layout>
  );
};

export default RegistrarHoras;