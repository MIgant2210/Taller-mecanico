import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  FaPlus, 
  FaEdit, 
  FaTrash, 
  FaUser, 
  FaUserShield, 
  FaUserCog,
  FaSearch,
  FaFilter,
  FaKey,
  FaEye,
  FaEyeSlash
} from 'react-icons/fa';
import userGif from '../assets/images/user.gif';
import '../styles/users.css';

const Users = () => {
  const [showModal, setShowModal] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRole, setFilterRole] = useState('todos');

  // Datos de ejemplo
  const [users, setUsers] = useState([
    {
      id: 1,
      nombre: 'Juan Pérez',
      email: 'juan@taller.com',
      telefono: '1234-5678',
      rol: 'administrador',
      activo: true,
      permisos: ['dashboard', 'clientes', 'vehiculos', 'agenda', 'inventario', 'facturacion']
    },
    {
      id: 2,
      nombre: 'María García',
      email: 'maria@taller.com',
      telefono: '8765-4321',
      rol: 'mecanico',
      activo: true,
      permisos: ['dashboard', 'vehiculos', 'agenda']
    },
    {
      id: 3,
      nombre: 'Carlos López',
      email: 'carlos@taller.com',
      telefono: '5555-5555',
      rol: 'recepcion',
      activo: false,
      permisos: ['dashboard', 'clientes', 'agenda', 'facturacion']
    }
  ]);

  const roles = [
    { value: 'administrador', label: 'Administrador', icon: <FaUserShield /> },
    { value: 'mecanico', label: 'Mecánico', icon: <FaUserCog /> },
    { value: 'recepcion', label: 'Recepción', icon: <FaUser /> }
  ];

  const modulos = [
    { value: 'dashboard', label: 'Dashboard' },
    { value: 'clientes', label: 'Clientes' },
    { value: 'vehiculos', label: 'Vehículos' },
    { value: 'agenda', label: 'Agenda' },
    { value: 'inventario', label: 'Inventario' },
    { value: 'facturacion', label: 'Facturación' },
    { value: 'servicios', label: 'Servicios' },
    { value: 'empleados', label: 'Empleados' }
  ];

  const openModal = (user = null) => {
    setEditingUser(user);
    setShowModal(true);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    
    const userData = {
      nombre: formData.get('nombre'),
      email: formData.get('email'),
      telefono: formData.get('telefono'),
      rol: formData.get('rol'),
      activo: formData.get('activo') === 'on',
      permisos: Array.from(formData.getAll('permisos'))
    };

    if (editingUser) {
      // Editar usuario existente
      setUsers(users.map(user => 
        user.id === editingUser.id 
          ? { ...user, ...userData, id: user.id }
          : user
      ));
    } else {
      // Crear nuevo usuario
      const newUser = {
        ...userData,
        id: Date.now(),
        fechaCreacion: new Date().toISOString()
      };
      setUsers([...users, newUser]);
    }

    setShowModal(false);
    setEditingUser(null);
  };

  const deleteUser = (id) => {
    if (window.confirm('¿Estás seguro de que quieres eliminar este usuario?')) {
      setUsers(users.filter(user => user.id !== id));
    }
  };

  const toggleUserStatus = (id) => {
    setUsers(users.map(user =>
      user.id === id ? { ...user, activo: !user.activo } : user
    ));
  };

  const filteredUsers = users.filter(user => {
    const matchesSearch = user.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = filterRole === 'todos' || user.rol === filterRole;
    return matchesSearch && matchesRole;
  });

  const getRolIcon = (rol) => {
    const role = roles.find(r => r.value === rol);
    return role ? role.icon : <FaUser />;
  };

  const getRolLabel = (rol) => {
    const role = roles.find(r => r.value === rol);
    return role ? role.label : rol;
  };

  return (
    <div className="users-module">
      {/* Header */}
      <div className="users-header">
        <img src={userGif} alt="User" className="user-gif" />
        <div className="header-top">
          <h1>GESTIÓN DE USUARIOS</h1>
          <div className="header-actions">
            <div className="search-box">
              <FaSearch className="search-icon" />
              <input
                type="text"
                placeholder="Buscar usuarios..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="filter-container">
              <FaFilter className="filter-icon" />
              <select 
                value={filterRole} 
                onChange={(e) => setFilterRole(e.target.value)}
                className="filter-select"
              >
                <option value="todos">Todos los roles</option>
                {roles.map(role => (
                  <option key={role.value} value={role.value}>
                    {role.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </div>

      <div className="users-content">
        {/* Botón de agregar usuario */}
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="btn-add-user"
          onClick={() => openModal()}
        >
          <FaPlus /> NUEVO USUARIO
        </motion.button>

        {/* Lista de usuarios */}
        <div className="users-list">
          <AnimatePresence>
            {filteredUsers.length === 0 ? (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="empty-state"
              >
                <FaUser size={48} />
                <p>No hay usuarios registrados</p>
              </motion.div>
            ) : (
              filteredUsers.map(user => (
                <motion.div
                  key={user.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className={`user-card ${user.activo ? 'activo' : 'inactivo'}`}
                >
                  <div className="user-avatar">
                    {getRolIcon(user.rol)}
                  </div>

                  <div className="user-info">
                    <h3>{user.nombre}</h3>
                    <p className="user-email">{user.email}</p>
                    <p className="user-phone">{user.telefono}</p>
                    <div className="user-rol">
                      <span className={`rol-badge ${user.rol}`}>
                        {getRolLabel(user.rol)}
                      </span>
                    </div>
                    <div className="user-permisos">
                      <span className="permisos-count">
                        {user.permisos.length} módulos permitidos
                      </span>
                    </div>
                  </div>

                  <div className="user-actions">
                    <motion.button
                      whileHover={{ scale: 1.1 }}
                      className="btn-status"
                      onClick={() => toggleUserStatus(user.id)}
                      title={user.activo ? 'Desactivar usuario' : 'Activar usuario'}
                    >
                      {user.activo ? <FaEye /> : <FaEyeSlash />}
                    </motion.button>

                    <motion.button
                      whileHover={{ scale: 1.1 }}
                      className="btn-edit"
                      onClick={() => openModal(user)}
                      title="Editar usuario"
                    >
                      <FaEdit />
                    </motion.button>

                    <motion.button
                      whileHover={{ scale: 1.1 }}
                      className="btn-delete"
                      onClick={() => deleteUser(user.id)}
                      title="Eliminar usuario"
                    >
                      <FaTrash />
                    </motion.button>
                  </div>
                </motion.div>
              ))
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Modal para agregar/editar usuario */}
      <AnimatePresence>
        {showModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="modal-overlay"
            onClick={() => {
              setShowModal(false);
              setEditingUser(null);
            }}
          >
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              className="modal-content"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="modal-header">
                <h3>
                  <FaKey />
                  {editingUser ? 'EDITAR USUARIO' : 'NUEVO USUARIO'}
                </h3>
                <button 
                  className="modal-close"
                  onClick={() => {
                    setShowModal(false);
                    setEditingUser(null);
                  }}
                >
                  ×
                </button>
              </div>

              <form onSubmit={handleSubmit} className="modal-form">
                <div className="form-grid">
                  <div className="form-group">
                    <label>Nombre completo *</label>
                    <input
                      type="text"
                      name="nombre"
                      defaultValue={editingUser?.nombre}
                      required
                      placeholder="Ej: Juan Pérez"
                    />
                  </div>

                  <div className="form-group">
                    <label>Email *</label>
                    <input
                      type="email"
                      name="email"
                      defaultValue={editingUser?.email}
                      required
                      placeholder="usuario@taller.com"
                    />
                  </div>

                  <div className="form-group">
                    <label>Teléfono</label>
                    <input
                      type="tel"
                      name="telefono"
                      defaultValue={editingUser?.telefono}
                      placeholder="1234-5678"
                    />
                  </div>

                  <div className="form-group">
                    <label>Rol *</label>
                    <select 
                      name="rol" 
                      defaultValue={editingUser?.rol || 'mecanico'}
                      required
                    >
                      {roles.map(role => (
                        <option key={role.value} value={role.value}>
                          {role.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="form-group full-width">
                    <label>Permisos de módulos *</label>
                    <div className="permisos-grid">
                      {modulos.map(modulo => (
                        <label key={modulo.value} className="checkbox-label">
                          <input
                            type="checkbox"
                            name="permisos"
                            value={modulo.value}
                            defaultChecked={editingUser?.permisos?.includes(modulo.value)}
                          />
                          <span className="checkmark"></span>
                          {modulo.label}
                        </label>
                      ))}
                    </div>
                  </div>

                  <div className="form-group">
                    <label className="checkbox-label">
                      <input
                        type="checkbox"
                        name="activo"
                        defaultChecked={editingUser?.activo ?? true}
                      />
                      <span className="checkmark"></span>
                      Usuario activo
                    </label>
                  </div>
                </div>

                <div className="modal-actions">
                  <motion.button
                    type="button"
                    whileHover={{ scale: 1.05 }}
                    onClick={() => {
                      setShowModal(false);
                      setEditingUser(null);
                    }}
                    className="btn-secondary"
                  >
                    Cancelar
                  </motion.button>
                  <motion.button
                    type="submit"
                    whileHover={{ scale: 1.05 }}
                    className="btn-primary"
                  >
                    <FaPlus /> {editingUser ? 'Actualizar' : 'Crear'} Usuario
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

export default Users;