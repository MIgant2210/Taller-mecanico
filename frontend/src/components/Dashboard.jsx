import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  FaUsers, 
  FaCar, 
  FaTools, 
  FaFileInvoiceDollar,
  FaBell,
  FaUserCircle,
  FaCalendarAlt,
  FaWrench,
  FaChartLine,
  FaBox,
  FaUserTie,
  FaUserShield,
  FaSignOutAlt
} from 'react-icons/fa';
import { useAuth } from '../context/AuthContext';
import { getFilteredMenu } from '../utils/auth';
import Agenda from './Agenda';
import Users from './Users';
import Facturacion from './Facturacion';
import Empleados from './Empleados';
import '../styles/dashboard.css';

// Importa tu logo
import logo from '../assets/images/logo.jpeg';

const Dashboard = () => {
  const { currentUser, logout } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [activeTab, setActiveTab] = useState('inicio');

  // Datos de ejemplo
  const stats = {
    clientes: 42,
    vehiculos: 18,
    reparaciones: 7,
    ingresos: 'Q12,850'
  };

  const urgentRepairs = [
    { id: 1, vehiculo: 'Ferrari 488', cliente: 'Juan Pérez', prioridad: 'Alta' },
    { id: 2, vehiculo: 'Porsche 911', cliente: 'María Gómez', prioridad: 'Media' }
  ];

  const upcomingAppointments = [
    { id: 1, fecha: '15/03', hora: '10:00 AM', vehiculo: 'Audi R8' },
    { id: 2, fecha: '15/03', hora: '02:30 PM', vehiculo: 'BMW M4' }
  ];

  // Animaciones
  const sidebarVariants = {
    open: { width: 300 },
    closed: { width: 80 }
  };

  const cardVariants = {
    hover: { 
      y: -5, 
      boxShadow: '0 10px 20px rgba(0, 0, 0, 0.1)'
    }
  };

  // Menú completo con todos los módulos
  const fullMenu = [
    { name: 'Inicio', icon: <FaChartLine />, tab: 'inicio', permission: 'dashboard' },
    { name: 'Clientes', icon: <FaUsers />, tab: 'clientes', permission: 'clientes' },
    { name: 'Vehículos', icon: <FaCar />, tab: 'vehiculos', permission: 'vehiculos' },
    { name: 'Agenda', icon: <FaCalendarAlt />, tab: 'agenda', permission: 'agenda' },
    { name: 'Inventario', icon: <FaBox />, tab: 'inventario', permission: 'inventario' },
    { name: 'Servicios', icon: <FaTools />, tab: 'servicios', permission: 'servicios' },
    { name: 'Facturación', icon: <FaFileInvoiceDollar />, tab: 'facturacion', permission: 'facturacion' },
    { name: 'Empleados', icon: <FaUserTie />, tab: 'empleados', permission: 'empleados' },
    { name: 'Usuarios', icon: <FaUserShield />, tab: 'usuarios', permission: 'usuarios' }
  ];

  // Filtrar menú según permisos del usuario actual
  const filteredMenu = getFilteredMenu(currentUser, fullMenu);

  const handleLogout = () => {
    logout();
    window.location.href = '/login';
  };

  // Función para ir a Agenda desde la campanita
  const goToAgenda = () => {
    setActiveTab('agenda');
  };

  // Función para ir a Usuarios desde el ícono de usuario
  const goToUsers = () => {
    setActiveTab('usuarios');
  };

  return (
    <div className="dashboard-container">
      {/* Sidebar Elegante y Formal */}
      <motion.div 
        className="sidebar"
        animate={sidebarOpen ? "open" : "closed"}
        variants={sidebarVariants}
        initial="open"
      >
        {/* Logo con imagen - MEJORADO */}
        <div className="sidebar-logo">
          <div className="logo-container">
            <motion.div 
              className="logo-img"
              style={{
                backgroundImage: `url(${logo})`,
                backgroundSize: 'cover',
                backgroundPosition: 'center'
              }}
              animate={{ scale: sidebarOpen ? 1 : 0.8 }}
              transition={{ duration: 0.2 }}
            />
            <motion.span 
              className="logo-text"
              animate={{ opacity: sidebarOpen ? 1 : 0 }}
              transition={{ duration: 0.2 }}
            >
              Turbo Garage
            </motion.span>
          </div>
        </div>
        
        {/* Botón para abrir/cerrar menú */}
        <div className="sidebar-header">
          <motion.button 
            onClick={() => setSidebarOpen(!sidebarOpen)} 
            className="menu-toggle"
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
          >
            {sidebarOpen ? '‹' : '›'}
          </motion.button>
        </div>
        
        <nav>
          {filteredMenu.map((item) => (
            <motion.div
              key={item.name}
              whileHover={{ backgroundColor: 'rgba(255, 255, 255, 0.08)' }}
              onClick={() => setActiveTab(item.tab)}
            >
              <div className={`nav-item ${activeTab === item.tab ? 'active' : ''}`}>
                <span className="icon">{item.icon}</span>
                <motion.span 
                  className="nav-text"
                  animate={{ opacity: sidebarOpen ? 1 : 0 }}
                  transition={{ duration: 0.2 }}
                >
                  {item.name}
                </motion.span>
              </div>
            </motion.div>
          ))}
        </nav>

        {/* Información del usuario y logout */}
        <div className="sidebar-footer">
          <div className="user-info">
            <div className="user-avatar">
              <FaUserCircle />
            </div>
            <motion.div 
              className="user-details"
              animate={{ opacity: sidebarOpen ? 1 : 0 }}
              transition={{ duration: 0.2 }}
            >
              <span className="user-name">{currentUser?.nombre}</span>
              <span className="user-role">{currentUser?.rol}</span>
            </motion.div>
          </div>
          <motion.button
            whileHover={{ scale: 1.02 }}
            className="logout-btn"
            onClick={handleLogout}
          >
            <motion.span
              animate={{ opacity: sidebarOpen ? 1 : 0 }}
              transition={{ duration: 0.2 }}
            >
              Cerrar Sesión
            </motion.span>
          </motion.button>
        </div>
      </motion.div>

      {/* Contenido Principal */}
      <div className={`main-content ${activeTab === 'agenda' || activeTab === 'usuarios' ? 'agenda-active' : ''}`}>
        
        {/* Header SOLO para pestañas que NO son Agenda ni Usuarios */}
        {activeTab !== 'agenda' && activeTab !== 'usuarios' && (
          <header className="dashboard-header">
            <h1>
              {activeTab === 'inicio' && 'PANEL DE CONTROL'}
              {activeTab === 'clientes' && 'GESTIÓN DE CLIENTES'}
              {activeTab === 'vehiculos' && 'GESTIÓN DE VEHÍCULOS'}
              {activeTab === 'inventario' && 'INVENTARIO'}
              {activeTab === 'servicios' && 'SERVICIOS'}
              {activeTab === 'facturacion' && 'FACTURACIÓN'}
              {activeTab === 'empleados' && 'GESTIÓN DE EMPLEADOS'}
            </h1>
            <div className="header-actions">
              {/* Botón de campanita que va a Agenda */}
              <motion.button 
                className="icon-button"
                onClick={goToAgenda}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                title="Ir a Agenda"
              >
                <FaBell />
                <span className="notification-badge">3</span>
              </motion.button>
              
              {/* Botón de usuario que va a Usuarios */}
              <motion.button 
                className="icon-button"
                onClick={goToUsers}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                title="Ir a Usuarios"
              >
                <FaUserCircle />
              </motion.button>
            </div>
          </header>
        )}

        {/* Contenido por Tabs */}
        {activeTab === 'inicio' && (
          <>
            {/* Tarjeta de Bienvenida */}
            <motion.div 
              className="welcome-card"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
            >
              <h3>Bienvenido, {currentUser?.nombre} 👋</h3>
              <p>Hoy es {new Date().toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' })}</p>
              <p>Rol: <strong>{currentUser?.rol}</strong></p>
              
              <div className="alert">
                <FaWrench /> <span>3 reparaciones urgentes hoy</span>
              </div>
            </motion.div>

            {/* Estadísticas Rápidas */}
            <div className="stats-grid">
              {[
                { title: 'Clientes', value: stats.clientes, icon: <FaUsers />, color: 'red', permission: 'clientes' },
                { title: 'Vehículos', value: stats.vehiculos, icon: <FaCar />, color: 'black', permission: 'vehiculos' },
                { title: 'Reparaciones', value: stats.reparaciones, icon: <FaTools />, color: 'gray', permission: 'servicios' },
                { title: 'Ingresos', value: stats.ingresos, icon: <FaFileInvoiceDollar />, color: 'yellow', permission: 'facturacion' }
              ].map((stat, index) => (
                <motion.div
                  key={stat.title}
                  className={`stat-card ${stat.color}-bg`}
                  variants={cardVariants}
                  whileHover="hover"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 * index + 0.3 }}
                >
                  <h3>{stat.title}</h3>
                  <p>{stat.value}</p>
                  <div className="card-icon">{stat.icon}</div>
                </motion.div>
              ))}
            </div>

            {/* Reparaciones Urgentes */}
            <motion.div 
              className="section-card"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
            >
              <h2>🔧 Reparaciones Urgentes</h2>
              <div className="repairs-list">
                {urgentRepairs.map(repair => (
                  <div key={repair.id} className="repair-item">
                    <div className="repair-info">
                      <strong>{repair.vehiculo}</strong>
                      <span>{repair.cliente}</span>
                    </div>
                    <div className={`priority-badge ${repair.prioridad.toLowerCase()}`}>
                      {repair.prioridad}
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>

            {/* Citas Programadas */}
            <motion.div 
              className="section-card"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.6 }}
            >
              <h2>📅 Próximas Citas</h2>
              <div className="appointments-list">
                {upcomingAppointments.map(app => (
                  <div key={app.id} className="appointment-item">
                    <div className="appointment-time">
                      <FaCalendarAlt />
                      <span>{app.fecha} - {app.hora}</span>
                    </div>
                    <div className="appointment-vehicle">
                      {app.vehiculo}
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          </>
        )}

        {/* Mostrar Agenda cuando esté seleccionada */}
        {activeTab === 'agenda' && <Agenda />}

        {/* Mostrar Usuarios cuando esté seleccionada */}
        {activeTab === 'usuarios' && <Users />}

        {/* Mostrar Facturación cuando esté seleccionada */}
        {activeTab === 'facturacion' && <Facturacion />}

        {/* Mostrar Empleados cuando esté seleccionada */}
        {activeTab === 'empleados' && <Empleados />}

        {/* Otras pestañas pueden ir aquí */}
          {activeTab !== 'inicio' && 
          activeTab !== 'agenda' && 
          activeTab !== 'usuarios' &&
          activeTab !== 'facturacion' &&
          activeTab !== 'empleados' && (
          <motion.div 
            className="welcome-card"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            <h3>Módulo en Desarrollo</h3>
            <p>La sección de {activeTab} está actualmente en desarrollo.</p>
            <p>Disponible para: <strong>{currentUser?.rol}</strong></p>
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;