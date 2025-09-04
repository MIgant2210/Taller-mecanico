import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  FaPlus, 
  FaTrash, 
  FaEdit, 
  FaBell, 
  FaTools, 
  FaCalendarCheck,
  FaClock,
  FaCar,
  FaUser,
  FaSearch,
  FaFilter,
  FaChevronLeft,
  FaChevronRight,
  FaTimes,
  FaCalendarDay,
  FaExclamationCircle
} from 'react-icons/fa';
import calendarGif from '../assets/images/calendar.gif';
import '../styles/agenda.css';

const Agenda = () => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(null);
  const [showCalendar, setShowCalendar] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState('');
  const [citas, setCitas] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('todos');

  // Datos de ejemplo
  const citasEjemplo = [
    { 
      id: 1, 
      fecha: new Date().toISOString().split('T')[0], 
      titulo: 'Cambio de aceite Ferrari 488', 
      tipo: 'reparacion', 
      hora: '10:00', 
      prioridad: 'alta',
      cliente: 'Juan Pérez',
      vehiculo: 'Ferrari 488',
      descripcion: 'Cambio de aceite sintético y filtro de aceite'
    },
    { 
      id: 2, 
      fecha: new Date().toISOString().split('T')[0], 
      titulo: 'Revisión general Porsche 911', 
      tipo: 'cita', 
      hora: '14:00', 
      prioridad: 'media',
      cliente: 'María García',
      vehiculo: 'Porsche 911',
      descripcion: 'Revisión completa de 100 puntos'
    }
  ];

  const notificaciones = [
    {
      id: 1,
      tipo: 'recordatorio',
      mensaje: 'Cita de mantenimiento programada para hoy a las 10:00 AM',
      hora: '08:30',
      leida: false
    },
    {
      id: 2,
      tipo: 'alerta',
      mensaje: 'Repuesto especial para BMW M4 llegó al inventario',
      hora: '09:15',
      leida: false
    },
    {
      id: 3,
      tipo: 'recordatorio',
      mensaje: 'Recordatorio: Llamar al cliente Carlos López para confirmar cita',
      hora: '11:00',
      leida: true
    }
  ];

  const getDaysInMonth = (date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDay = firstDay.getDay();
    
    return { daysInMonth, startingDay, year, month };
  };

  const navigateMonth = (direction) => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + direction, 1));
  };

  const handleDayClick = (day) => {
    const clickedDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
    setSelectedDate(clickedDate);
    setShowCalendar(false);
  };

  const openModal = (type) => {
    setModalType(type);
    setShowModal(true);
  };

  const handleSubmitCita = (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const nueva = {
      id: Date.now(),
      titulo: formData.get('titulo'),
      tipo: modalType,
      hora: formData.get('hora'),
      prioridad: formData.get('prioridad'),
      cliente: formData.get('cliente'),
      vehiculo: formData.get('vehiculo'),
      descripcion: formData.get('descripcion'),
      recordatorio: formData.get('recordatorio') === 'on',
      fecha: selectedDate ? selectedDate.toISOString().split('T')[0] : new Date().toISOString().split('T')[0]
    };
    setCitas([...citas, nueva]);
    setShowModal(false);
  };

  const deleteCita = (id) => {
    setCitas(citas.filter(cita => cita.id !== id));
  };

  const { daysInMonth, startingDay, year, month } = getDaysInMonth(currentDate);
  const monthNames = ["ENERO", "FEBRERO", "MARZO", "ABRIL", "MAYO", "JUNIO", "JULIO", "AGOSTO", "SEPTIEMBRE", "OCTUBRE", "NOVIEMBRE", "DICIEMBRE"];
  const dayNames = ["DOM", "LUN", "MAR", "MIÉ", "JUE", "VIE", "SÁB"];

  const getCitasDelDia = (fecha) => {
    const fechaStr = typeof fecha === 'string' ? fecha : fecha.toISOString().split('T')[0];
    const todasCitas = [...citasEjemplo, ...citas];
    
    let filtered = todasCitas.filter(cita => cita.fecha === fechaStr);
    
    if (searchTerm) {
      filtered = filtered.filter(cita =>
        cita.titulo.toLowerCase().includes(searchTerm.toLowerCase()) ||
        cita.cliente.toLowerCase().includes(searchTerm.toLowerCase()) ||
        cita.vehiculo.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    if (filterType !== 'todos') {
      filtered = filtered.filter(cita => cita.tipo === filterType);
    }
    
    return filtered.sort((a, b) => a.hora.localeCompare(b.hora));
  };

  const getEventCount = (day) => {
    const fechaStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    return getCitasDelDia(fechaStr).length;
  };

  const notificacionesNoLeidas = notificaciones.filter(n => !n.leida).length;

  return (
    <div className="agenda-moderna-blanca">
      {/* GIF decorativo */}
      <img src={calendarGif} alt="Calendar" className="calendar-gif" />

      {/* Header */}
      <div className="agenda-header">
        <div className="header-top">
          <h1>AGENDA DEL TALLER</h1>
          <div className="header-actions">
            <div className="search-box">
              <FaSearch className="search-icon" />
              <input
                type="text"
                placeholder="Buscar citas, clientes..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="filter-container">
              <FaFilter className="filter-icon" />
              <select 
                value={filterType} 
                onChange={(e) => setFilterType(e.target.value)}
                className="filter-select"
              >
                <option value="todos">Todos</option>
                <option value="cita">Citas</option>
                <option value="reparacion">Reparaciones</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      <div className="agenda-content">
        {/* Sección de Notificaciones */}
        <div className="notificaciones-section">
          <div className="section-header">
            <h2><FaBell /> NOTIFICACIONES DEL DÍA</h2>
            <span className="badge">{notificacionesNoLeidas} sin leer</span>
          </div>
          <div className="notificaciones-list">
            {notificaciones.map(notif => (
              <div key={notif.id} className={`notificacion-item ${notif.leida ? 'leida' : 'no-leida'}`}>
                <div className="notificacion-icon">
                  {notif.tipo === 'alerta' ? <FaExclamationCircle /> : <FaBell />}
                </div>
                <div className="notificacion-content">
                  <p>{notif.mensaje}</p>
                  <span className="notificacion-hora">{notif.hora}</span>
                </div>
              </div>
            ))}
          </div>

          {/* Botón para abrir calendario */}
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="btn-calendar-toggle"
            onClick={() => setShowCalendar(!showCalendar)}
          >
            <FaCalendarDay />
            {showCalendar ? 'OCULTAR CALENDARIO' : 'VER CALENDARIO'}
          </motion.button>
        </div>

        {/* Calendario Desplegable */}
        <AnimatePresence>
          {showCalendar && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="calendar-section"
            >
              <div className="calendar-header-modern">
                <motion.button 
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={() => navigateMonth(-1)}
                  className="nav-button"
                >
                  <FaChevronLeft />
                </motion.button>
                
                <h2 className="month-title">
                  {monthNames[month]} <span className="year">{year}</span>
                </h2>
                
                <motion.button 
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={() => navigateMonth(1)}
                  className="nav-button"
                >
                  <FaChevronRight />
                </motion.button>
              </div>

              <div className="calendar-grid-modern">
                {dayNames.map(day => (
                  <div key={day} className="day-header-modern">
                    {day}
                  </div>
                ))}

                {Array.from({ length: startingDay }, (_, i) => (
                  <div key={`empty-${i}`} className="calendar-day-modern empty"></div>
                ))}

                {Array.from({ length: daysInMonth }, (_, i) => {
                  const day = i + 1;
                  const eventCount = getEventCount(day);
                  const isToday = new Date().getDate() === day && 
                                 new Date().getMonth() === month && 
                                 new Date().getFullYear() === year;

                  return (
                    <motion.div
                      key={day}
                      className={`calendar-day-modern ${isToday ? 'today' : ''} ${eventCount > 0 ? 'has-events' : ''}`}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => handleDayClick(day)}
                    >
                      <span className="day-number">{day}</span>
                      {eventCount > 0 && (
                        <motion.span 
                          className="event-badge"
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                        >
                          {eventCount}
                        </motion.span>
                      )}
                    </motion.div>
                  );
                })}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Detalles del Día Seleccionado */}
        {selectedDate && (
          <motion.div 
            className="detalles-dia-section"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <div className="section-header">
              <h2>
                <FaCalendarCheck />
                CITAS DEL {selectedDate.toLocaleDateString('es-ES', { day: 'numeric' })} DE {monthNames[selectedDate.getMonth()]}
              </h2>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="btn-add-event"
                onClick={() => openModal('cita')}
              >
                <FaPlus /> NUEVA CITA
              </motion.button>
            </div>

            <div className="citas-list-modern">
              <AnimatePresence>
                {getCitasDelDia(selectedDate).length === 0 ? (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="empty-state"
                  >
                    <FaCalendarCheck size={48} />
                    <p>No hay citas programadas para este día</p>
                  </motion.div>
                ) : (
                  getCitasDelDia(selectedDate).map(cita => (
                    <motion.div
                      key={cita.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -20 }}
                      className={`cita-card ${cita.tipo} ${cita.prioridad}`}
                    >
                      <div className="cita-time">
                        <FaClock /> {cita.hora}
                      </div>
                      <div className="cita-content">
                        <h4>{cita.titulo}</h4>
                        <div className="cita-details">
                          <span><FaUser /> {cita.cliente}</span>
                          <span><FaCar /> {cita.vehiculo}</span>
                        </div>
                        {cita.descripcion && (
                          <p className="cita-desc">{cita.descripcion}</p>
                        )}
                      </div>
                      <div className="cita-actions">
                        <motion.button whileHover={{ scale: 1.1 }} className="btn-edit">
                          <FaEdit />
                        </motion.button>
                        <motion.button 
                          whileHover={{ scale: 1.1 }} 
                          className="btn-delete"
                          onClick={() => deleteCita(cita.id)}
                        >
                          <FaTrash />
                        </motion.button>
                      </div>
                    </motion.div>
                  ))
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        )}
      </div>

      {/* Modal para Agregar Citas */}
      <AnimatePresence>
        {showModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="modal-overlay-modern"
            onClick={() => setShowModal(false)}
          >
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              className="modal-content-modern"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="modal-header">
                <h3>
                  {modalType === 'cita' ? '📅 NUEVA CITA' : '🛠️ NUEVA REPARACIÓN'}
                </h3>
                <button onClick={() => setShowModal(false)} className="modal-close">
                  <FaTimes />
                </button>
              </div>

              <form onSubmit={handleSubmitCita} className="modal-form">
                <div className="form-grid">
                  <div className="form-group">
                    <label>Título *</label>
                    <input type="text" name="titulo" required placeholder="Ej: Cambio de aceite" />
                  </div>
                  
                  <div className="form-group">
                    <label>Hora *</label>
                    <input type="time" name="hora" required defaultValue="09:00" />
                  </div>

                  <div className="form-group">
                    <label>Cliente *</label>
                    <input type="text" name="cliente" required placeholder="Nombre del cliente" />
                  </div>

                  <div className="form-group">
                    <label>Vehículo *</label>
                    <input type="text" name="vehiculo" required placeholder="Modelo del vehículo" />
                  </div>

                  <div className="form-group">
                    <label>Prioridad</label>
                    <select name="prioridad" defaultValue="media">
                      <option value="media">Media</option>
                      <option value="alta">Alta</option>
                    </select>
                  </div>

                  <div className="form-group full-width">
                    <label>Descripción</label>
                    <textarea name="descripcion" rows="3" placeholder="Detalles adicionales..."></textarea>
                  </div>

                  <div className="form-group full-width">
                    <label className="checkbox-label">
                      <input type="checkbox" name="recordatorio" />
                      <span className="checkmark"></span>
                      Enviar recordatorio 1 hora antes
                    </label>
                  </div>
                </div>

                <div className="modal-actions">
                  <motion.button
                    type="button"
                    whileHover={{ scale: 1.05 }}
                    onClick={() => setShowModal(false)}
                    className="btn-secondary"
                  >
                    Cancelar
                  </motion.button>
                  <motion.button
                    type="submit"
                    whileHover={{ scale: 1.05 }}
                    className="btn-primary"
                  >
                    <FaPlus /> Crear Cita
                  </motion.button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Agenda;