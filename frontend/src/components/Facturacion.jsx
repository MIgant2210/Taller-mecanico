import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FaPlus, FaEdit, FaTrash, FaPrint, FaUser, FaCalendarAlt, 
  FaFileInvoiceDollar, FaIdCard, FaCar, FaTools, FaSearch,
  FaTimes, FaMoneyBillWave, FaCheckCircle, FaClock
} from 'react-icons/fa';
import '../styles/facturacion.css';

const Facturacion = ({ currentUser }) => {
  const [facturas, setFacturas] = useState([
    {
      id: 1, cliente: 'Juan Pérez', fecha: '2023-10-10', total: 100,
      estado: 'Pagada', nit: '1234567', empresa: 'MÁS ALTO', DPI: '1234567890123',
      servicio: 'Cambio de aceite', marca: 'Toyota', placa: 'P123ABC'
    },
    {
      id: 2, cliente: 'Ana López', fecha: '2023-10-10', total: 150,
      estado: 'Pendiente', nit: '7654321', empresa: 'MÁS ALTO', DPI: '1098765432109',
      servicio: 'Alineación', marca: 'Honda', placa: 'H456XYZ'
    }
  ]);

  const [showModal, setShowModal] = useState(false);
  const [editingFactura, setEditingFactura] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterEstado, setFilterEstado] = useState('todos');
  const [showConfirm, setShowConfirm] = useState({ show: false, type: '', index: null });

  const esAdmin = currentUser?.rol === 'administrador';

  // Opciones para los selects
  const servicios = ['Cambio de aceite', 'Alineación y balanceo', 'Reparación de frenos', 'Cambio de llantas', 'Revisión general'];
  const marcas = ['Toyota', 'Honda', 'Nissan', 'Hyundai', 'Kia', 'Ford', 'Chevrolet', 'Volkswagen', 'BMW', 'Mercedes-Benz'];

  const filteredFacturas = facturas.filter(f =>
    f.cliente.toLowerCase().includes(searchTerm.toLowerCase()) &&
    (filterEstado === 'todos' || f.estado.toLowerCase() === filterEstado)
  );

  // Validar NIT (7 dígitos)
  const validateNIT = (nit) => {
    const nitRegex = /^\d{7}$/;
    return nitRegex.test(nit);
  };

  // Validar DPI (13 dígitos)
  const validateDPI = (dpi) => {
    const dpiRegex = /^\d{13}$/;
    return dpiRegex.test(dpi);
  };

  // Validar placa (formato: 1 letra + 3 números + 3 letras)
  const validatePlaca = (placa) => {
    const placaRegex = /^[A-Z]{1}\d{3}[A-Z]{3}$/;
    return placaRegex.test(placa.toUpperCase());
  };

  // Validación más permisiva para mientras se escribe
  const validatePlacaPartial = (placa) => {
    // Permite: 
    // - Una letra al inicio
    // - Seguida de hasta 3 números
    // - Seguida de hasta 3 letras
    const placaRegex = /^[A-Z]{0,1}\d{0,3}[A-Z]{0,3}$/i;
    return placaRegex.test(placa);
  };

  // Formatear la placa mientras se escribe (P-123-XYZ)
  const formatPlaca = (value) => {
    // Eliminar cualquier caracter que no sea letra o número
    let cleaned = value.replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
    
    // Aplicar el formato: 1 letra + 3 números + 3 letras
    if (cleaned.length <= 1) {
      return cleaned;
    } else if (cleaned.length <= 4) {
      return `${cleaned.substring(0, 1)}${cleaned.substring(1, 4)}`;
    } else {
      return `${cleaned.substring(0, 1)}${cleaned.substring(1, 4)}${cleaned.substring(4, 7)}`;
    }
  };

  // Manejar cambios en el campo de placa
  const handlePlacaChange = (e) => {
    const value = e.target.value;
    const formattedValue = formatPlaca(value);
    setPlacaValue(formattedValue);
    
    // Validar formato parcial mientras escribe
    const isValidPartial = validatePlacaPartial(value);
    
    // Solo validar formato completo cuando tenga 7 caracteres
    const isValidComplete = value.length === 7 ? validatePlaca(value) : true;
    
    setFieldErrors(prev => ({
      ...prev,
      placa: isValidPartial ? '' : 'Formato inválido',
      placaComplete: value.length === 7 && !isValidComplete ? 'La placa debe tener el formato: 1 letra + 3 números + 3 letras (ej: P075LOK)' : ''
    }));
  };

  // Validar campo en tiempo real
  const validateField = (name, value) => {
    let isValid = true;
    let errorMessage = '';
    
    switch (name) {
      case 'nit':
        isValid = validateNIT(value);
        errorMessage = 'El NIT debe tener exactamente 7 dígitos';
        break;
      case 'dpi':
        isValid = validateDPI(value);
        errorMessage = 'El DPI debe tener exactamente 13 dígitos';
        break;
      case 'placa':
        isValid = validatePlaca(value);
        errorMessage = 'La placa debe tener el formato: 1 letra + 3 números + 3 letras (ej: P075LOK)';
        break;
      default:
        isValid = true;
    }
    
    setFieldErrors(prev => ({
      ...prev,
      [name]: isValid ? '' : errorMessage
    }));
    
    return isValid;
  };

  // Manejar cambios en los inputs con validación en tiempo real
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    
    if (name === 'placa') {
      handlePlacaChange(e);
    } else {
      validateField(name, value);
    }
  };

  // Guardar o editar factura
  const handleSubmit = e => {
    e.preventDefault();
    const f = new FormData(e.target);

    const nit = f.get('nit');
    const dpi = f.get('dpi');
    const placa = f.get('placa');

    if (!validateNIT(nit)) {
      alert('El NIT debe tener exactamente 7 dígitos');
      return;
    }
    
    if (!validateDPI(dpi)) {
      alert('El DPI debe tener exactamente 13 dígitos');
      return;
    }
    
    if (!validatePlaca(placa)) {
      alert('La placa debe tener el formato: 1 letra + 3 números + 3 letras');
      return;
    }

    const nuevaFactura = {
      id: editingFactura ? editingFactura.id : Date.now(),
      cliente: f.get('cliente'),
      fecha: f.get('fecha'),
      total: parseFloat(f.get('total')),
      estado: f.get('estado'),
      nit,
      empresa: f.get('empresa'),
      dpi,
      servicio: f.get('servicio'),
      marca: f.get('marca'),
      placa: placa.toUpperCase()
    };

    if (editingFactura) {
      setFacturas(facturas.map(f => f.id === nuevaFactura.id ? nuevaFactura : f));
      alert('Factura actualizada correctamente');
    } else {
      setFacturas([...facturas, nuevaFactura]);
      alert('Factura guardada correctamente');
    }

    setEditingFactura(null);
    setShowModal(false);
  };

  const handleDelete = id => {
    setShowConfirm({ show: true, type: 'delete', index: id });
  };

  const confirmAction = () => {
    if (showConfirm.type === 'delete') {
      setFacturas(facturas.filter(f => f.id !== showConfirm.index));
      alert('Factura eliminada correctamente');
    } else if (showConfirm.type === 'edit') {
      setEditingFactura(facturas.find(f => f.id === showConfirm.index));
      setShowModal(true);
    }
    setShowConfirm({ show: false, type: '', index: null });
  };

  const cancelAction = () => {
    setShowConfirm({ show: false, type: '', index: null });
  };

  const handleEdit = (id) => {
    setShowConfirm({ show: true, type: 'edit', index: id });
  };

  // Impresión profesional en formato tabla
  const handlePrint = factura => {
    const win = window.open('', '', 'width=800,height=600');
    win.document.write(`
      <html>
        <head>
          <title>Factura #${factura.id}</title>
          <style>
            body { 
              font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; 
              padding: 30px; 
              color: #2c3e50; 
              background-color: #f9f9f9;
            }
            .invoice-container {
              background: white;
              padding: 30px;
              border-radius: 10px;
              box-shadow: 0 0 20px rgba(0,0,0,0.1);
              max-width: 700px;
              margin: 0 auto;
            }
            .header { 
              text-align: center; 
              margin-bottom: 30px;
              border-bottom: 2px solid #3498db;
              padding-bottom: 20px;
            }
            .header h1 { 
              color: #2c3e50; 
              margin: 0;
              font-size: 28px;
            }
            .company-info {
              margin-bottom: 20px;
              text-align: center;
            }
            .details-table { 
              width: 100%; 
              border-collapse: collapse; 
              margin: 20px 0;
              font-size: 14px;
            }
            .details-table th, .details-table td { 
              border: 1px solid #ddd; 
              padding: 12px; 
              text-align: left; 
            }
            .details-table th { 
              background-color: #3498db; 
              color: white; 
              font-weight: 600;
            }
            .details-table tr:nth-child(even) {
              background-color: #f2f2f2;
            }
            .totals { 
              text-align: right; 
              font-weight: bold; 
              font-size: 18px;
              margin-top: 20px;
              border-top: 2px solid #2c3e50;
              padding-top: 10px;
            }
            .footer {
              margin-top: 40px;
              text-align: center;
              font-size: 12px;
              color: #7f8c8d;
            }
            .status-badge {
              display: inline-block;
              padding: 5px 10px;
              border-radius: 20px;
              font-weight: bold;
              font-size: 12px;
            }
            .pagada {
              background-color: #27ae60;
              color: white;
            }
            .pendiente {
              background-color: #e74c3c;
              color: white;
            }
            @media print {
              body { 
                padding: 0;
                background: white;
              }
              .invoice-container {
                box-shadow: none;
                padding: 0;
              }
            }
          </style>
        </head>
        <body>
          <div class="invoice-container">
            <div class="header">
              <h1>FACTURA #${factura.id}</h1>
              <div class="company-info">
                <h2>Taller Mecánico "El Rápido"</h2>
                <p>12 Avenida 3-42 Zona 1, Quetzaltenango</p>
                <p>Teléfono: 7765-4321 | NIT: 1234567</p>
              </div>
            </div>
            
            <table class="details-table">
              <tr>
                <th colspan="2" style="background-color: #2c3e50;">Información del Cliente</th>
              </tr>
              <tr>
                <td width="30%"><strong>Cliente:</strong></td>
                <td>${factura.cliente}</td>
              </tr>
              <tr>
                <td><strong>Empresa:</strong></td>
                <td>${factura.empresa}</td>
              </tr>
              <tr>
                <td><strong>NIT:</strong></td>
                <td>${factura.nit}</td>
              </tr>
              <tr>
                <td><strong>DPI:</strong></td>
                <td>${factura.dpi}</td>
              </tr>
              <tr>
                <td><strong>Fecha:</strong></td>
                <td>${factura.fecha}</td>
              </tr>
              <tr>
                <td><strong>Estado:</strong></td>
                <td><span class="status-badge ${factura.estado.toLowerCase()}">${factura.estado}</span></td>
              </tr>
            </table>

            <table class="details-table">
              <tr>
                <th colspan="2" style="background-color: #2c3e50;">Información del Vehículo</th>
              </tr>
              <tr>
                <td width="30%"><strong>Vehículo:</strong></td>
                <td>${factura.marca}</td>
              </tr>
              <tr>
                <td><strong>Placa:</strong></td>
                <td>${factura.placa}</td>
              </tr>
            </table>

            <table class="details-table">
              <tr>
                <th colspan="2" style="background-color: #2c3e50;">Detalles del Servicio</th>
              </tr>
              <tr>
                <td width="30%"><strong>Servicio:</strong></td>
                <td>${factura.servicio}</td>
              </tr>
              <tr>
                <td><strong>Descripción:</strong></td>
                <td>Servicio completo de ${factura.servicio.toLowerCase()} para vehículo ${factura.marca}</td>
              </tr>
            </table>

            <table class="details-table">
              <tr>
                <th>Descripción</th>
                <th>Monto (Q)</th>
              </tr>
              <tr>
                <td>${factura.servicio}</td>
                <td>Q${factura.total.toFixed(2)}</td>
              </tr>
              <tr>
                <td><strong>Total:</strong></td>
                <td><strong>Q${factura.total.toFixed(2)}</strong></td>
              </tr>
            </table>

            <div class="footer">
              <p>¡Gracias por su preferencia! | Teléfono: 7765-4321 | Email: tallerelrapido@example.com</p>
            </div>
          </div>
        </body>
      </html>
    `);
    win.document.close();
    win.print();
  };

  return (
    <div className="facturacion-module">
      <div className="facturas-header">
        <div className="header-top">
          <h1><FaFileInvoiceDollar /> Facturación</h1>
          <div className="header-actions">
            <div className="search-box">
              <FaSearch className="search-icon" />
              <input
                type="text"
                placeholder="Buscar cliente..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
              />
              {searchTerm && (
                <button className="clear-search" onClick={() => setSearchTerm('')}>
                  <FaTimes />
                </button>
              )}
            </div>
            <div className="filter-container">
              <select
                value={filterEstado}
                onChange={e => setFilterEstado(e.target.value)}
              >
                <option value="todos">Todos los estados</option>
                <option value="pagada">Pagadas</option>
                <option value="pendiente">Pendientes</option>
              </select>
            </div>
            {esAdmin && (
              <button className="btn-add-factura" onClick={() => { setEditingFactura(null); setShowModal(true); }}>
                <FaPlus /> Nueva Factura
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="facturas-list">
        {filteredFacturas.length === 0 ? (
          <div className="empty-state">
            <FaFileInvoiceDollar size={48} />
            <p>No hay facturas disponibles</p>
            {esAdmin && (
              <button className="btn-add-factura" onClick={() => setShowModal(true)}>
                <FaPlus /> Crear primera factura
              </button>
            )}
          </div>
        ) : (
          filteredFacturas.map(f => (
            <motion.div 
              key={f.id} 
              className="factura-card"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
            >
              <div className="factura-info">
                <h3>Factura #{f.id}</h3>
                <p><FaUser /> {f.cliente}</p>
                <p><FaCalendarAlt /> {f.fecha}</p>
                <p><FaMoneyBillWave /> Q{f.total.toFixed(2)}</p>
                <p className={`estado ${f.estado.toLowerCase()}`}>
                  {f.estado === 'Pagada' ? <FaCheckCircle /> : <FaClock />} 
                  {f.estado}
                </p>
                <p><FaIdCard /> NIT: {f.nit}</p>
                <p><FaIdCard /> DPI: {f.dpi}</p>
                <p><FaIdCard /> Empresa: {f.empresa}</p>
                <p><FaCar /> {f.marca} - Placa: {f.placa}</p>
                <p><FaTools /> {f.servicio}</p>
              </div>
              {esAdmin && (
                <div className="factura-actions">
                  <button className="btn-edit" onClick={() => handleEdit(f.id)} title="Editar">
                    <FaEdit />
                  </button>
                  <button className="btn-delete" onClick={() => handleDelete(f.id)} title="Eliminar">
                    <FaTrash />
                  </button>
                  <button className="btn-print" onClick={() => handlePrint(f)} title="Imprimir">
                    <FaPrint />
                  </button>
                </div>
              )}
            </motion.div>
          ))
        )}
      </div>

      <AnimatePresence>
        {showModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="modal-overlay"
            onClick={() => setShowModal(false)}
          >
            <motion.div 
              className="modal-content"
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="modal-header">
                <h3>
                  {editingFactura ? <><FaEdit /> Editar Factura</> : <><FaPlus /> Nueva Factura</>}
                </h3>
                <button className="modal-close" onClick={() => setShowModal(false)}>&times;</button>
              </div>
              <form onSubmit={handleSubmit} className="factura-form">
                <div className="form-row">
                  <div className="form-group">
                    <label>Cliente *</label>
                    <input name="cliente" placeholder="Nombre completo" defaultValue={editingFactura?.cliente || ''} required />
                  </div>
                  <div className="form-group">
                    <label>Fecha *</label>
                    <input type="date" name="fecha" defaultValue={editingFactura?.fecha || ''} required />
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label>NIT (7 dígitos) *</label>
                    <input name="nit" placeholder="1234567" defaultValue={editingFactura?.nit || ''} required maxLength="7" />
                  </div>
                  <div className="form-group">
                    <label>DPI (13 dígitos) *</label>
                    <input name="dpi" placeholder="1234567890123" defaultValue={editingFactura?.dpi || ''} required maxLength="13" />
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label>Empresa *</label>
                    <input name="empresa" placeholder="Nombre de empresa" defaultValue={editingFactura?.empresa || ''} required />
                  </div>
                  <div className="form-group">
                    <label>Marca de vehículo *</label>
                    <select name="marca" defaultValue={editingFactura?.marca || ''} required>
                      <option value="">Seleccionar marca</option>
                      {marcas.map((marca, index) => (
                        <option key={index} value={marca}>{marca}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label>Placa *</label>
                    <input name="placa" placeholder="A123BCD" defaultValue={editingFactura?.placa || ''} required maxLength="7" />
                  </div>
                  <div className="form-group">
                    <label>Servicio *</label>
                    <select name="servicio" defaultValue={editingFactura?.servicio || ''} required>
                      <option value="">Seleccionar servicio</option>
                      {servicios.map((servicio, index) => (
                        <option key={index} value={servicio}>{servicio}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label>Total (Q) *</label>
                    <input type="number" name="total" placeholder="0.00" step="0.01" min="0" defaultValue={editingFactura?.total || ''} required />
                  </div>
                  <div className="form-group">
                    <label>Estado *</label>
                    <select name="estado" defaultValue={editingFactura?.estado || 'Pendiente'} required>
                      <option value="Pagada">Pagada</option>
                      <option value="Pendiente">Pendiente</option>
                    </select>
                  </div>
                </div>

                <div className="form-actions">
                  <button type="button" className="btn-cancel" onClick={() => setShowModal(false)}>Cancelar</button>
                  <button type="submit" className="btn-submit">{editingFactura ? 'Actualizar' : 'Guardar'}</button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showConfirm.show && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="confirm-overlay"
          >
            <div className="confirm-modal">
              <h3>
                {showConfirm.type === 'delete' 
                  ? '¿Está seguro de eliminar esta factura?' 
                  : '¿Está seguro de editar esta factura?'}
              </h3>
              <p>Esta acción {showConfirm.type === 'delete' ? 'no se puede deshacer' : 'modificará los datos de la factura'}.</p>
              <div className="confirm-buttons">
                <button className="btn-cancel" onClick={cancelAction}>Cancelar</button>
                <button className="btn-confirm" onClick={confirmAction}>Confirmar</button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Facturacion;

