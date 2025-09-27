import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  FaPlus, FaEdit, FaTrash, FaUser, 
  FaSearch, FaFilter, FaKey, FaEye, FaEyeSlash 
} from 'react-icons/fa';
import userGif from '../assets/images/user.gif';
import '../styles/users.css';

const Users = () => {
  const [users, setUsers] = useState([]);
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRole, setFilterRole] = useState('todos');

  // 🔄 Abrir modal
  const openModal = (user = null) => {
    setEditingUser(user);
    setShowModal(true);
  };

  // 🔄 Cargar usuarios y roles de la API real
  useEffect(() => {
    const fetchData = async () => {
      try {
        const resUsers = await fetch("http://localhost:8000/api/v1/usuarios");
        const usersData = await resUsers.json();

        const resRoles = await fetch("http://localhost:8000/api/v1/roles");
        const rolesData = await resRoles.json();

        // Normalizar roles para usar en el select
        const rolesFormatted = rolesData.map(r => ({
        value: r.id_rol,
        label: r.nombre_rol,
        }));


        setUsers(usersData);
        setRoles(rolesFormatted);
      } catch (error) {
        console.error("Error al cargar datos:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  // 📝 Crear o editar usuario
  async function handleSubmit(e) {
    e.preventDefault();
    const formData = new FormData(e.target);
    const userData = {
      username: formData.get('username'),
      password: formData.get('password'),
      id_rol: parseInt(formData.get('id_rol')),
      id_empleado: formData.get('id_empleado') ? parseInt(formData.get('id_empleado')) : null
    };

    try {
      if (editingUser) {
        // PUT actualizar
        const res = await fetch(`http://localhost:8000/api/v1/usuarios/${editingUser.id_usuario}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(userData)
        });
        const updated = await res.json();
        setUsers(users.map(u => u.id_usuario === updated.id_usuario ? updated : u));
      } else {
        // POST crear
        const res = await fetch("http://localhost:8000/api/v1/usuarios", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(userData)
        });
        const newUser = await res.json();
        setUsers([...users, newUser]);
      }
    } catch (error) {
      console.error('Error al guardar usuario:', error);
    }

    setShowModal(false);
    setEditingUser(null);
  }

  // 🗑️ Eliminar usuario
  const deleteUser = async (id_usuario) => {
    if (window.confirm('¿Eliminar usuario?')) {
      try {
        await fetch(`http://localhost:8000/api/v1/usuarios/${id_usuario}`, {
          method: "DELETE"
        });
        setUsers(users.filter(u => u.id_usuario !== id_usuario));
      } catch (error) {
        console.error("Error eliminando usuario:", error);
      }
    }
  };

  // 🔄 Activar/desactivar usuario
  const toggleUserStatus = async (user) => {
    const updated = { 
      ...user, 
      activo: !user.activo,
      password: user.password || "temp123" // ⚠️ tu API pide password en PUT
    };
    try {
      const res = await fetch(`http://localhost:8000/api/v1/usuarios/${user.id_usuario}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updated)
      });
      const data = await res.json();
      setUsers(users.map(u => u.id_usuario === user.id_usuario ? data : u));
    } catch (error) {
      console.error("Error al cambiar estado:", error);
    }
  };

  // 🔍 Filtrar usuarios
  const filteredUsers = users.filter(user => {
    const matchesSearch = user.username.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = filterRole === 'todos' || user.id_rol === Number(filterRole);
    return matchesSearch && matchesRole;
  });

  if (loading) {
    return (
      <div className="users-module">
        <div className="loading-state">
          <FaUser size={48} />
          <p>Cargando usuarios...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="users-module">
      <div className="users-header">
        <div className="header-top">
          <img src={userGif} alt="User" className="user-gif" />
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
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="btn-add-user"
          onClick={() => openModal()}
        >
          <FaPlus /> NUEVO USUARIO
        </motion.button>

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
                  key={user.id_usuario}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className={`user-card ${user.activo ? 'activo' : 'inactivo'}`}
                >
                  <div className="user-info">
                    <h3>{user.username}</h3>
                    <p>Rol: {roles.find(r => r.value === user.id_rol)?.label || "Sin rol"}</p>
                    <p>Creado: {user.fecha_creacion || "N/A"}</p>
                  </div>

                  <div className="user-actions">
                    <motion.button
                      whileHover={{ scale: 1.1 }}
                      className="btn-status"
                      onClick={() => toggleUserStatus(user)}
                      title={user.activo ? 'Desactivar' : 'Activar'}
                    >
                      {user.activo ? <FaEye /> : <FaEyeSlash />}
                    </motion.button>

                    <motion.button
                      whileHover={{ scale: 1.1 }}
                      className="btn-edit"
                      onClick={() => openModal(user)}
                      title="Editar"
                    >
                      <FaEdit />
                    </motion.button>

                    <motion.button
                      whileHover={{ scale: 1.1 }}
                      className="btn-delete"
                      onClick={() => deleteUser(user.id_usuario)}
                      title="Eliminar"
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

      {/* Modal */}
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
                    <label>Username *</label>
                    <input
                      type="text"
                      name="username"
                      defaultValue={editingUser?.username}
                      required
                      placeholder="Ej: jperez"
                    />
                  </div>

                  <div className="form-group">
                    <label>Password *</label>
                    <input
                      type="password"
                      name="password"
                      placeholder="••••••"
                      required={!editingUser} // obligatorio solo al crear
                    />
                  </div>

                  <div className="form-group">
                    <label>Rol *</label>
                    <select 
                      name="id_rol" 
                      defaultValue={editingUser?.id_rol || ''}
                      required
                    >
                      <option value="">Seleccione un rol</option>
                      {roles.map(role => (
                        <option key={role.value} value={role.value}>
                          {role.label}
                        </option>
                      ))}
                    </select>
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

