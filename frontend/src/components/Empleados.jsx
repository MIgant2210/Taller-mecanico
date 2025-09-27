import React, { useState } from 'react';
import {
  FaPlus, FaEdit, FaTrash, FaUser, FaPhone, FaEnvelope,
  FaMapMarkerAlt, FaBriefcase, FaCalendarAlt, FaMoneyBillWave,
  FaSearch, FaTimes, FaIdCard, FaUserCheck, FaUserTimes, FaAddressCard
} from 'react-icons/fa';
import '../styles/empleados.css';

const Empleados = ({ currentUser = { rol: 'administrador' } }) => {
  // Estados para los datos
  const [empleados, setEmpleados] = useState([
    {
      id_empleado: 1,
      nombres: 'Juan',
      apellidos: 'Pérez',
      dpi: '1234567890123',
      nit: '123456K',
      telefono: '5555-1234',
      email: 'juan.perez@empresa.com',
      direccion: '12 Calle 3-42 Zona 1, Quetzaltenango',
      id_puesto: 1,
      puesto: 'Mecánico',
      departamento: 'Taller',
      fecha_ingreso: '2023-01-15',
      salario: 3500.00,
      activo: true
    },
    {
      id_empleado: 2,
      nombres: 'María',
      apellidos: 'López',
      dpi: '9876543210987',
      nit: '7654321',
      telefono: '5555-5678',
      email: 'maria.lopez@empresa.com',
      direccion: '8 Avenida 2-35 Zona 3, Quetzaltenango',
      id_puesto: 2,
      puesto: 'Recepcionista',
      departamento: 'Atención al Cliente',
      fecha_ingreso: '2023-03-20',
      salario: 2800.00,
      activo: true
    }
  ]);

  const [showModal, setShowModal] = useState(false);
  const [editingEmpleado, setEditingEmpleado] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterActivo, setFilterActivo] = useState('todos');

  // Opciones para los selects
  const puestos = [
    { id: 1, nombre: 'Mecánico', departamento: 'Taller' },
    { id: 2, nombre: 'Recepcionista', departamento: 'Atención al Cliente' },
    { id: 3, nombre: 'Gerente', departamento: 'Administración' },
    { id: 4, nombre: 'Asistente', departamento: 'Administración' },
    { id: 5, nombre: 'Limpieza', departamento: 'Mantenimiento' }
  ];

  // Verificación de administrador
  const esAdmin = currentUser?.rol === 'administrador';

  // Filtrar empleados
  const filteredEmpleados = empleados.filter(emp =>
    `${emp.nombres} ${emp.apellidos}`.toLowerCase().includes(searchTerm.toLowerCase()) &&
    (filterActivo === 'todos' || 
     (filterActivo === 'activos' && emp.activo) || 
     (filterActivo === 'inactivos' && !emp.activo))
  );

  // Validar DPI (13 dígitos)
  const validateDPI = (dpi) => {
    const dpiRegex = /^\d{13}$/;
    return dpiRegex.test(dpi);
  };

  // Validar NIT (7 caracteres: 6 dígitos + 1 dígito o letra)
  const validateNIT = (nit) => {
    const nitRegex = /^\d{6}[\dA-Za-z]{1}$/;
    return nitRegex.test(nit);
  };

  // Guardar o editar empleado
  const handleSubmit = (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    
    const dpi = formData.get('dpi');
    const nit = formData.get('nit');

    if (!validateDPI(dpi)) {
      alert('El DPI debe tener exactamente 13 dígitos');
      return;
    }

    if (!validateNIT(nit)) {
      alert('El NIT debe tener 7 caracteres (6 dígitos + 1 dígito o letra)');
      return;
    }

    const puestoSeleccionado = puestos.find(p => p.id === parseInt(formData.get('id_puesto')));

    const nuevoEmpleado = {
      id_empleado: editingEmpleado ? editingEmpleado.id_empleado : Date.now(),
      nombres: formData.get('nombres'),
      apellidos: formData.get('apellidos'),
      dpi: dpi,
      nit: nit,
      telefono: formData.get('telefono'),
      email: formData.get('email'),
      direccion: formData.get('direccion'),
      id_puesto: parseInt(formData.get('id_puesto')),
      puesto: puestoSeleccionado.nombre,
      departamento: puestoSeleccionado.departamento,
      fecha_ingreso: formData.get('fecha_ingreso'),
      salario: parseFloat(formData.get('salario')),
      activo: editingEmpleado ? formData.get('activo') === 'true' : true
    };

    if (editingEmpleado) {
      if (window.confirm('¿Está seguro de editar este empleado?')) {
        setEmpleados(empleados.map(emp => emp.id_empleado === nuevoEmpleado.id_empleado ? nuevoEmpleado : emp));
        alert('Empleado actualizado correctamente');
      }
    } else {
      setEmpleados([...empleados, nuevoEmpleado]);
      alert('Empleado guardado correctamente');
    }

    setEditingEmpleado(null);
    setShowModal(false);
  };

  // Eliminar empleado
  const handleDelete = (id) => {
    if (window.confirm('¿Está seguro de eliminar este empleado?')) {
      setEmpleados(empleados.filter(emp => emp.id_empleado !== id));
      alert('Empleado eliminado correctamente');
    }
  };

  // Cambiar estado activo/inactivo
  const toggleActivo = (id) => {
    setEmpleados(empleados.map(emp => 
      emp.id_empleado === id ? { ...emp, activo: !emp.activo } : emp
    ));
  };

  return (
    <div className="empleados-module">
      <div className="empleados-header">
        <div className="header-top">
          <h1><FaUser /> Gestión de Empleados</h1>
          <div className="header-actions">
            <div className="search-box">
              <FaSearch className="search-icon" />
              <input
                type="text"
                placeholder="Buscar empleado..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              {searchTerm && (
                <button 
                  type="button" 
                  className="clear-search" 
                  onClick={() => setSearchTerm('')}
                >
                  <FaTimes />
                </button>
              )}
            </div>
            <div className="filter-container">
              <select
                value={filterActivo}
                onChange={(e) => setFilterActivo(e.target.value)}
              >
                <option value="todos">Todos</option>
                <option value="activos">Activos</option>
                <option value="inactivos">Inactivos</option>
              </select>
            </div>
            {esAdmin && (
              <button 
                className="btn-add-empleado" 
                onClick={() => { setEditingEmpleado(null); setShowModal(true); }}
              >
                <FaPlus /> Nuevo Empleado
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="empleados-list">
        {filteredEmpleados.length === 0 ? (
          <div className="empty-state">
            <FaUser size={48} />
            <p>No hay empleados registrados</p>
            {esAdmin && (
              <button 
                className="btn-add-empleado" 
                onClick={() => setShowModal(true)}
              >
                <FaPlus /> Agregar primer empleado
              </button>
            )}
          </div>
        ) : (
          filteredEmpleados.map(emp => (
            <div key={emp.id_empleado} className="empleado-card">
              <div className="empleado-info">
                <div className="empleado-header">
                  <h3>{emp.nombres} {emp.apellidos}</h3>
                  <span className={`estado ${emp.activo ? 'activo' : 'inactivo'}`}>
                    {emp.activo ? <FaUserCheck /> : <FaUserTimes />}
                    {emp.activo ? 'Activo' : 'Inactivo'}
                  </span>
                </div>
                
                <p><FaIdCard /> DPI: {emp.dpi}</p>
                <p><FaAddressCard /> NIT: {emp.nit}</p>
                <p><FaBriefcase /> {emp.puesto} - {emp.departamento}</p>
                <p><FaCalendarAlt /> Ingreso: {emp.fecha_ingreso}</p>
                <p><FaMoneyBillWave /> Salario: Q{emp.salario.toFixed(2)}</p>
                
                {emp.telefono && <p><FaPhone /> {emp.telefono}</p>}
                {emp.email && <p><FaEnvelope /> {emp.email}</p>}
                {emp.direccion && <p><FaMapMarkerAlt /> {emp.direccion}</p>}
              </div>
              
              {esAdmin && (
                <div className="empleado-actions">
                  <button 
                    className="btn-edit" 
                    onClick={() => { setEditingEmpleado(emp); setShowModal(true); }} 
                    title="Editar"
                  >
                    <FaEdit />
                  </button>
                  <button 
                    className="btn-delete" 
                    onClick={() => handleDelete(emp.id_empleado)} 
                    title="Eliminar"
                  >
                    <FaTrash />
                  </button>
                  <button 
                    className={emp.activo ? 'btn-inactive' : 'btn-active'} 
                    onClick={() => toggleActivo(emp.id_empleado)}
                    title={emp.activo ? 'Desactivar' : 'Activar'}
                  >
                    {emp.activo ? <FaUserTimes /> : <FaUserCheck />}
                  </button>
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>
                {editingEmpleado ? <><FaEdit /> Editar Empleado</> : <><FaPlus /> Nuevo Empleado</>}
              </h3>
              <button 
                type="button"
                className="modal-close" 
                onClick={() => setShowModal(false)}
              >
                &times;
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="empleado-form">
              <div className="form-row">
                <div className="form-group">
                  <label>Nombres *</label>
                  <input 
                    name="nombres" 
                    placeholder="Nombres" 
                    defaultValue={editingEmpleado?.nombres || ''} 
                    required 
                  />
                </div>
                <div className="form-group">
                  <label>Apellidos *</label>
                  <input 
                    name="apellidos" 
                    placeholder="Apellidos" 
                    defaultValue={editingEmpleado?.apellidos || ''} 
                    required 
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>DPI (13 dígitos) *</label>
                  <input 
                    name="dpi" 
                    placeholder="1234567890123" 
                    defaultValue={editingEmpleado?.dpi || ''} 
                    maxLength="13"
                    required 
                  />
                </div>
                <div className="form-group">
                  <label>NIT (7 caracteres) *</label>
                  <input 
                    name="nit" 
                    placeholder="123456K" 
                    defaultValue={editingEmpleado?.nit || ''} 
                    maxLength="7"
                    required 
                  />
                  <div className="input-hint">6 dígitos + 1 dígito o letra</div>
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Teléfono</label>
                  <input 
                    name="telefono" 
                    placeholder="5555-1234" 
                    defaultValue={editingEmpleado?.telefono || ''} 
                  />
                </div>
                <div className="form-group">
                  <label>Email</label>
                  <input 
                    name="email" 
                    type="email"
                    placeholder="empleado@empresa.com" 
                    defaultValue={editingEmpleado?.email || ''} 
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Dirección</label>
                  <input 
                    name="direccion" 
                    placeholder="Dirección completa" 
                    defaultValue={editingEmpleado?.direccion || ''} 
                  />
                </div>
                <div className="form-group">
                  <label>Puesto *</label>
                  <select 
                    name="id_puesto" 
                    defaultValue={editingEmpleado?.id_puesto || ''} 
                    required
                  >
                    <option value="">Seleccionar puesto</option>
                    {puestos.map(puesto => (
                      <option key={puesto.id} value={puesto.id}>
                        {puesto.nombre} ({puesto.departamento})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Fecha de Ingreso *</label>
                  <input 
                    type="date" 
                    name="fecha_ingreso" 
                    defaultValue={editingEmpleado?.fecha_ingreso || ''} 
                    required 
                  />
                </div>
                <div className="form-group">
                  <label>Salario (Q) *</label>
                  <input 
                    type="number" 
                    name="salario" 
                    placeholder="0.00" 
                    step="0.01" 
                    min="0" 
                    defaultValue={editingEmpleado?.salario || ''} 
                    required 
                  />
                </div>
              </div>

              {editingEmpleado && (
                <div className="form-row">
                  <div className="form-group">
                    <label>Estado</label>
                    <select 
                      name="activo" 
                      defaultValue={editingEmpleado?.activo ? 'true' : 'false'} 
                    >
                      <option value="true">Activo</option>
                      <option value="false">Inactivo</option>
                    </select>
                  </div>
                </div>
              )}

              <div className="form-actions">
                <button type="button" className="btn-cancel" onClick={() => setShowModal(false)}>
                  Cancelar
                </button>
                <button type="submit" className="btn-submit">
                  {editingEmpleado ? 'Actualizar' : 'Guardar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Empleados;