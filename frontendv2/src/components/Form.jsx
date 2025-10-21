// Form.jsx
import React, { useState, useEffect, useRef } from 'react';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { useForm } from '../hooks/useForm';
import { Save, X, Loader2, AlertCircle, Calendar, Hash, Type, Mail, Phone, MapPin, FileText, User, Percent, Eye, Check, ChevronDown } from 'lucide-react';
import './DatePicker.css';

const Form = ({
  fields = [],
  onSubmit,
  initialData = {},
  submitText = 'Guardar',
  cancelText = 'Cancelar',
  onCancel,
  loading = false,
  cotizacionMode = false,
  onItemAdd,
  items = [],
  calculatedTotals = {}
}) => {
  const { formData, handleChange, handleSubmit, errors, setFieldError } = useForm(initialData, onSubmit);
  const [clients, setClients] = useState([]);
  const [servicios, setServicios] = useState([]);
  const [repuestos, setRepuestos] = useState([]);
  const [showItemsPanel, setShowItemsPanel] = useState(false);
  const [fieldValidations, setFieldValidations] = useState({});
  const [openDropdowns, setOpenDropdowns] = useState({});
  const [formStatus, setFormStatus] = useState(null); // { type: 'success'|'error', message }

  useEffect(() => {
    if (cotizacionMode) {
      // Cargar datos para cotizaciones
    }
  }, [cotizacionMode]);

  // Validación en tiempo real
  const validateField = (field, value) => {
    if (!value && field.required) {
      return `${field.label} es requerido`;
    }

    if (!value) return null;

    switch (field.type) {
      case 'email':
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
          return 'Ingrese un email válido';
        }
        break;
      case 'phone':
      case 'tel':
        if (!/^\d{8,}$/.test(value.replace(/[\s-]/g, ''))) {
          return 'Ingrese un teléfono válido (mínimo 8 dígitos)';
        }
        break;
      case 'number':
      case 'percent':
        const numValue = parseFloat(value);
        if (isNaN(numValue)) {
          return 'Ingrese un número válido';
        }
        if (field.min !== undefined && numValue < field.min) {
          return `El valor mínimo es ${field.min}`;
        }
        if (field.max !== undefined && numValue > field.max) {
          return `El valor máximo es ${field.max}`;
        }
        break;
      case 'text':
        // Validar que no contenga solo números si es un campo de texto
        if (field.name.toLowerCase().includes('nombre') || field.name.toLowerCase().includes('cliente')) {
          if (/^\d+$/.test(value)) {
            return 'Este campo no puede contener solo números';
          }
          if (value.length < 2) {
            return 'Debe tener al menos 2 caracteres';
          }
        }
        break;
    }

    return null;
  };

  const handleFieldChange = (name, value) => {
    // Validación de entrada según tipo de campo
    const field = fields.find(f => f.name === name);
    
    if (field) {
      // Prevenir entrada de letras en campos numéricos
      if ((field.type === 'number' || field.type === 'percent') && value !== '') {
        if (!/^-?\d*\.?\d*$/.test(value)) {
          return; // No actualizar si no es un número válido
        }
      }

      // Prevenir números al inicio en campos de texto/nombre
      if (field.type === 'text' && (field.name.toLowerCase().includes('nombre') || field.name.toLowerCase().includes('cliente'))) {
        if (/^\d/.test(value)) {
          return; // No permitir que empiece con número
        }
        // Permitir solo letras, espacios y algunos caracteres especiales
        value = value.replace(/[^a-záéíóúñüA-ZÁÉÍÓÚÑÜ\s\-\']/g, '');
      }

      // Validación de teléfono - solo números
      if (field.type === 'phone' || field.type === 'tel') {
        value = value.replace(/[^\d\s\-]/g, '');
      }
    }

    handleChange(name, value);
    
    if (field) {
      const error = validateField(field, value);
      setFieldValidations(prev => ({ ...prev, [name]: error }));
    }
  };

  const getFieldIcon = (field) => {
    const iconClass = "w-5 h-5 text-gray-400";
    
    switch (field.type) {
      case 'email': return <Mail className={iconClass} />;
      case 'tel':
      case 'phone': return <Phone className={iconClass} />;
      case 'number': return <Hash className={iconClass} />;
      case 'date':
      case 'datetime': return <Calendar className={iconClass} />;
      case 'textarea': return <FileText className={iconClass} />;
      case 'percent': return <Percent className={iconClass} />;
      case 'client': return <User className={iconClass} />;
      default:
        if (field.name.includes('direccion') || field.name.includes('address')) {
          return <MapPin className={iconClass} />;
        }
        if (field.name.includes('observacion') || field.name.includes('note')) {
          return <FileText className={iconClass} />;
        }
        return <Type className={iconClass} />;
    }
  };

  const renderDateField = (field) => {
    const hasError = errors[field.name] || fieldValidations[field.name];
    let value = formData[field.name];
    let selectedDate = null;
    
    if (value) {
      try {
        selectedDate = new Date(value);
        if (isNaN(selectedDate.getTime())) {
          selectedDate = null;
        }
      } catch (e) {
        selectedDate = null;
      }
    }
    
    return (
      <div className="relative date-picker-container">
        <div className="absolute left-3 top-1/2 transform -translate-y-1/2 pointer-events-none z-10">
          {getFieldIcon(field)}
        </div>
        <DatePicker
          id={field.name}
          name={field.name}
          selected={selectedDate}
          onChange={date => {
            const dateValue = date ? date.toISOString().slice(0, 10) : '';
            handleFieldChange(field.name, dateValue);
          }}
          dateFormat="dd/MM/yyyy"
          className={`w-full px-4 py-3 pl-11 pr-10 border rounded-xl transition-all duration-200 
            focus:outline-none focus:ring-2 focus:border-transparent 
            disabled:bg-gray-100 disabled:cursor-not-allowed bg-white cursor-pointer
            ${hasError 
              ? 'border-red-300 bg-red-50 focus:ring-red-500' 
              : 'border-gray-300 hover:border-blue-400 focus:ring-blue-500'
            }`}
          placeholderText={field.placeholder || `Seleccionar ${field.label.toLowerCase()}`}
          disabled={loading}
          required={field.required}
          autoComplete="off"
          showMonthDropdown={false}
          showYearDropdown={false}
          isClearable
          showPopperArrow={false}
          popperClassName="modern-datepicker-popper"
          renderCustomHeader={({
            date,
            changeYear,
            changeMonth,
            decreaseMonth,
            increaseMonth,
            prevMonthButtonDisabled,
            nextMonthButtonDisabled,
          }) => {
            const months = [
              "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
              "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"
            ];
            const years = Array.from(
              { length: 100 },
              (_, i) => new Date().getFullYear() - 50 + i
            );

            return (
              <div className="custom-header">
                <button
                  type="button"
                  onClick={decreaseMonth}
                  disabled={prevMonthButtonDisabled}
                  className="nav-button"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                </button>

                <div className="header-selects">
                  <select
                    value={months[date.getMonth()]}
                    onChange={({ target: { value } }) =>
                      changeMonth(months.indexOf(value))
                    }
                    className="month-select"
                  >
                    {months.map((option) => (
                      <option key={option} value={option}>
                        {option}
                      </option>
                    ))}
                  </select>

                  <select
                    value={date.getFullYear()}
                    onChange={({ target: { value } }) => changeYear(value)}
                    className="year-select"
                  >
                    {years.map((option) => (
                      <option key={option} value={option}>
                        {option}
                      </option>
                    ))}
                  </select>
                </div>

                <button
                  type="button"
                  onClick={increaseMonth}
                  disabled={nextMonthButtonDisabled}
                  className="nav-button"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              </div>
            );
          }}
          popperModifiers={[
            {
              name: "offset",
              options: {
                offset: [0, 8]
              }
            },
            {
              name: 'flip',
              options: {
                fallbackPlacements: ['top-start', 'top-end', 'bottom-start', 'bottom-end']
              }
            },
            {
              name: "preventOverflow",
              options: {
                rootBoundary: 'viewport',
                tether: false,
                altAxis: true
              }
            }
          ]}
          popperPlacement="top-start"
          calendarClassName="modern-calendar"
          minDate={field.minDate ? new Date(field.minDate) : undefined}
          maxDate={field.maxDate ? new Date(field.maxDate) : undefined}
          onKeyDown={(e) => {
            // Prevenir escritura en el campo
            if (e.key !== 'Tab' && e.key !== 'Enter' && e.key !== 'Escape') {
              e.preventDefault();
            }
          }}
        />
        <div className="absolute right-3 top-1/2 transform -translate-y-1/2 pointer-events-none">
          <Calendar className="w-5 h-5 text-blue-500" />
        </div>
      </div>
    );
  };

  const renderField = (field) => {
    const hasError = errors[field.name] || fieldValidations[field.name];
    const showIcon = !['checkbox', 'select'].includes(field.type);
    
    const inputClasses = `
      w-full px-4 py-3 border rounded-xl transition-all duration-200
      focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent
      disabled:bg-gray-100 disabled:cursor-not-allowed
      ${showIcon ? 'pl-11' : ''}
      ${hasError 
        ? 'border-red-300 bg-red-50 focus:ring-red-500' 
        : 'border-gray-300 bg-white hover:border-gray-400'
      }
    `;

    const commonProps = {
      id: field.name,
      name: field.name,
      value: formData[field.name] || '',
      onChange: (e) => handleFieldChange(field.name, e.target.value),
      className: inputClasses,
      required: field.required,
      disabled: loading,
      placeholder: field.placeholder || `Ingrese ${field.label.toLowerCase()}`,
      onBlur: () => {
        const error = validateField(field, formData[field.name]);
        setFieldValidations(prev => ({ ...prev, [field.name]: error }));
      }
    };

    if (field.type === 'date' || field.type === 'datetime') {
      return renderDateField(field);
    }

    switch (field.type) {
      case 'textarea':
        return (
          <div className="relative">
            {showIcon && (
              <div className="absolute left-3 top-3 pointer-events-none">
                {getFieldIcon(field)}
              </div>
            )}
            <textarea 
              {...commonProps} 
              rows={field.rows || 3}
              className={`${inputClasses} resize-none`}
              maxLength={field.maxLength}
            />
            {field.maxLength && (
              <div className="text-xs text-gray-500 mt-1 text-right">
                {(formData[field.name] || '').length} / {field.maxLength}
              </div>
            )}
          </div>
        );
      
      case 'select':
        const SelectComponent = () => {
          const dropdownRef = useRef(null);
          const isOpen = openDropdowns[field.name] || false;
          
          useEffect(() => {
            const handleClickOutside = (event) => {
              if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setOpenDropdowns(prev => ({ ...prev, [field.name]: false }));
              }
            };
            
            if (isOpen) {
              document.addEventListener('mousedown', handleClickOutside);
            }
            
            return () => document.removeEventListener('mousedown', handleClickOutside);
          }, [isOpen]);

          const selectedOption = field.options?.find(opt => opt.value === formData[field.name]);
          const searchTerm = formData[`${field.name}_search`] || '';
          
          const filteredOptions = field.options?.filter(opt => 
            opt.label.toLowerCase().includes(searchTerm.toLowerCase())
          ) || [];

          return (
            <div className="relative" ref={dropdownRef}>
              <div className="relative">
                {showIcon && (
                  <div className="absolute left-3 top-1/2 transform -translate-y-1/2 pointer-events-none z-10">
                    {getFieldIcon(field)}
                  </div>
                )}
                <input
                  type="text"
                  value={searchTerm || (selectedOption ? selectedOption.label : '')}
                  onChange={(e) => {
                    handleFieldChange(`${field.name}_search`, e.target.value);
                    setOpenDropdowns(prev => ({ ...prev, [field.name]: true }));
                    if (!e.target.value) {
                      handleFieldChange(field.name, '');
                    }
                  }}
                  onFocus={() => setOpenDropdowns(prev => ({ ...prev, [field.name]: true }))}
                  className={`${inputClasses} pr-10`}
                  placeholder={field.placeholder || `Buscar ${field.label.toLowerCase()}...`}
                  autoComplete="off"
                  disabled={loading}
                />
                <button
                  type="button"
                  onMouseDown={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                  }}
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setOpenDropdowns(prev => ({ ...prev, [field.name]: !prev[field.name] }));
                  }}
                  className="absolute right-2 top-1/2 transform -translate-y-1/2 p-1.5 hover:bg-gray-100 rounded transition-colors"
                  disabled={loading}
                  tabIndex={-1}
                >
                  <ChevronDown className={`w-4 h-4 text-gray-500 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
                </button>
              </div>

              {isOpen && (
                <div className="modern-dropdown">
                  {filteredOptions.length > 0 ? (
                    filteredOptions.map(option => (
                      <div
                        key={option.value}
                        className={`dropdown-option ${formData[field.name] === option.value ? 'selected' : ''}`}
                        onMouseDown={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                        }}
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          handleFieldChange(field.name, option.value);
                          handleFieldChange(`${field.name}_search`, option.label);
                          setOpenDropdowns(prev => ({ ...prev, [field.name]: false }));
                        }}
                      >
                        {formData[field.name] === option.value && (
                          <div className="option-check">
                            <Check className="w-4 h-4" />
                          </div>
                        )}
                        <span>{option.label}</span>
                      </div>
                    ))
                  ) : (
                    <div className="dropdown-empty">
                      No se encontraron resultados
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        };

        return <SelectComponent />;
      
      case 'number':
      case 'percent':
        return (
          <div className="relative">
            {showIcon && (
              <div className="absolute left-3 top-1/2 transform -translate-y-1/2 pointer-events-none">
                {getFieldIcon(field)}
              </div>
            )}
            <input 
              {...commonProps} 
              type="text"
              inputMode="decimal"
              step={field.step || 'any'} 
              min={field.min}
              max={field.max}
              onWheel={(e) => e.target.blur()}
            />
          </div>
        );
      
      case 'checkbox':
        return (
          <div className="flex items-center">
            <input
              id={field.name}
              name={field.name}
              type="checkbox"
              checked={formData[field.name] || false}
              onChange={(e) => handleFieldChange(field.name, e.target.checked)}
              disabled={loading}
              className="w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500 focus:ring-2 transition-all cursor-pointer disabled:cursor-not-allowed"
            />
            <label htmlFor={field.name} className="ml-3 text-sm text-gray-700 cursor-pointer">
              {field.checkboxLabel || field.label}
            </label>
          </div>
        );
      
      default:
        return (
          <div className="relative">
            {showIcon && (
              <div className="absolute left-3 top-1/2 transform -translate-y-1/2 pointer-events-none">
                {getFieldIcon(field)}
              </div>
            )}
            <input 
              {...commonProps} 
              type={field.type || 'text'}
              maxLength={field.maxLength}
              pattern={field.pattern}
            />
          </div>
        );
    }
  };

  const renderItemsPanel = () => {
    if (!cotizacionMode || !showItemsPanel) return null;

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 animate-fadeIn">
        <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl mx-4 max-h-[90vh] overflow-hidden">
          <div className="p-6 border-b border-gray-200">
            <div className="flex justify-between items-center">
              <h3 className="text-xl font-bold text-gray-800">Agregar Items a la Cotización</h3>
              <button
                onClick={() => setShowItemsPanel(false)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
          </div>
          
          <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <h4 className="font-semibold text-lg text-gray-800 border-b pb-2">Servicios</h4>
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {servicios.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                      <FileText className="w-12 h-12 mx-auto mb-2 opacity-50" />
                      <p>No hay servicios disponibles</p>
                    </div>
                  ) : (
                    servicios.map(servicio => (
                      <button
                        key={servicio.id_servicio}
                        onClick={() => onItemAdd?.(servicio, 'servicio')}
                        className="w-full text-left p-4 border border-gray-200 rounded-lg hover:border-blue-300 hover:bg-blue-50 transition-all duration-200"
                      >
                        <div className="font-medium text-gray-800">{servicio.nombre_servicio}</div>
                        <div className="text-sm text-gray-600 mt-1">Q{servicio.precio_base}</div>
                      </button>
                    ))
                  )}
                </div>
              </div>

              <div className="space-y-4">
                <h4 className="font-semibold text-lg text-gray-800 border-b pb-2">Repuestos</h4>
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {repuestos.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                      <FileText className="w-12 h-12 mx-auto mb-2 opacity-50" />
                      <p>No hay repuestos disponibles</p>
                    </div>
                  ) : (
                    repuestos.map(repuesto => (
                      <button
                        key={repuesto.id_repuesto}
                        onClick={() => onItemAdd?.(repuesto, 'repuesto')}
                        className="w-full text-left p-4 border border-gray-200 rounded-lg hover:border-green-300 hover:bg-green-50 transition-all duration-200"
                      >
                        <div className="font-medium text-gray-800">{repuesto.nombre_repuesto}</div>
                        <div className="text-sm text-gray-600 mt-1">Q{repuesto.precio_venta}</div>
                        <div className="text-xs text-gray-500 mt-1">Stock: {repuesto.stock_actual}</div>
                      </button>
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderCotizacionSummary = () => {
    if (!cotizacionMode || !items.length) return null;

    return (
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-6 mb-6">
        <h3 className="font-bold text-lg text-gray-800 mb-4 flex items-center gap-2">
          <Eye className="w-5 h-5" />
          Resumen de la Cotización
        </h3>
        
        <div className="mb-4">
          <h4 className="font-semibold text-gray-700 mb-2">Items seleccionados:</h4>
          <div className="space-y-2 max-h-32 overflow-y-auto">
            {items.map((item, index) => (
              <div key={index} className="flex justify-between items-center bg-white px-3 py-2 rounded-lg border">
                <div className="flex-1">
                  <span className="font-medium text-gray-800">{item.descripcion}</span>
                  <span className="text-sm text-gray-600 ml-2">({item.tipo_item})</span>
                </div>
                <div className="text-sm text-gray-700">
                  Q{(item.precio_unitario * item.cantidad).toFixed(2)}
                </div>
              </div>
            ))}
          </div>
        </div>

        {calculatedTotals && (
          <div className="border-t pt-4 space-y-2">
            <div className="flex justify-between text-sm">
              <span>Subtotal:</span>
              <span className="font-medium">Q{calculatedTotals.subtotal?.toFixed(2)}</span>
            </div>
            {calculatedTotals.impuestoMonto > 0 && (
              <div className="flex justify-between text-sm">
                <span>Impuestos ({formData.impuestos || 0}%):</span>
                <span className="font-medium">Q{calculatedTotals.impuestoMonto?.toFixed(2)}</span>
              </div>
            )}
            {calculatedTotals.descuentoMonto > 0 && (
              <div className="flex justify-between text-sm">
                <span>Descuento ({formData.descuentos || 0}%):</span>
                <span className="font-medium text-red-600">-Q{calculatedTotals.descuentoMonto?.toFixed(2)}</span>
              </div>
            )}
            <div className="flex justify-between text-lg font-bold border-t pt-2">
              <span>Total:</span>
              <span className="text-blue-700">Q{calculatedTotals.total?.toFixed(2)}</span>
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <>
      <form onSubmit={(e) => {
        // Before submit, enforce selects only accept values from options
        let valid = true;
        fields.forEach(f => {
          if (f.type === 'select' && f.options) {
            const val = formData[f.name];
            if (val && !f.options.some(o => o.value === val)) {
              setFieldError(f.name, 'Seleccione una opción válida');
              setFieldValidations(prev => ({ ...prev, [f.name]: 'Seleccione una opción válida' }));
              valid = false;
            }
            if (f.required && !val) {
              setFieldError(f.name, `${f.label} es requerido`);
              setFieldValidations(prev => ({ ...prev, [f.name]: `${f.label} es requerido` }));
              valid = false;
            }
          }
          if (f.required && (formData[f.name] === undefined || formData[f.name] === '')) {
            setFieldError(f.name, `${f.label} es requerido`);
            setFieldValidations(prev => ({ ...prev, [f.name]: `${f.label} es requerido` }));
            valid = false;
          }
        });

        if (!valid) {
          e.preventDefault();
          setFormStatus({ type: 'error', message: 'Por favor corrige los errores del formulario' });
          window.scrollTo({ top: 0, behavior: 'smooth' });
          return;
        }

        handleSubmit(e);
      }} className="flex flex-col h-full" noValidate>
        <div className="flex-1 overflow-y-auto pr-2 -mr-2">
          {/* Alerts */}
          {formStatus && (
            <div className={`mb-4 p-4 rounded-lg border ${formStatus.type === 'success' ? 'bg-emerald-50 border-emerald-200 text-emerald-800' : 'bg-red-50 border-red-200 text-red-700'} shadow-sm animate-fadeIn`}>
              <div className="flex items-start gap-3">
                <div className="mt-0.5">
                  {formStatus.type === 'success' ? (
                    <svg className="w-6 h-6 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7"/></svg>
                  ) : (
                    <AlertCircle className="w-6 h-6 text-red-600" />
                  )}
                </div>
                <div>
                  <p className="font-semibold">{formStatus.type === 'success' ? 'Éxito' : 'Error'}</p>
                  <p className="text-sm">{formStatus.message}</p>
                </div>
                <div className="ml-auto">
                  <button type="button" onClick={() => setFormStatus(null)} className="text-gray-400 hover:text-gray-600">✕</button>
                </div>
              </div>
            </div>
          )}
          {cotizacionMode && (
            <div className="mb-6">
              <button
                type="button"
                onClick={() => setShowItemsPanel(true)}
                className="w-full py-4 border-2 border-dashed border-blue-300 rounded-xl bg-blue-50 hover:bg-blue-100 hover:border-blue-400 transition-all duration-200 flex items-center justify-center gap-3 text-blue-700 font-semibold"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                Agregar Servicios o Repuestos
              </button>
            </div>
          )}

          {renderCotizacionSummary()}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pb-4">
            {fields.map((field) => (
              <div 
                key={field.name} 
                className={`${field.fullWidth ? 'md:col-span-2' : ''} space-y-2`}
              >
                {field.type !== 'checkbox' && (
                  <label 
                    htmlFor={field.name} 
                    className="block text-sm font-semibold text-gray-700"
                  >
                    {field.label}
                    {field.required && <span className="text-red-500 ml-1">*</span>}
                  </label>
                )}
                
                {renderField(field)}
                
                {(errors[field.name] || fieldValidations[field.name]) && (
                  <div className="flex items-start gap-2 text-red-600 bg-red-50 px-3 py-2 rounded-lg border border-red-200 animate-slideIn">
                    <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                    <p className="text-sm">{errors[field.name] || fieldValidations[field.name]}</p>
                  </div>
                )}
                
                {field.helpText && !errors[field.name] && !fieldValidations[field.name] && (
                  <p className="text-sm text-gray-500 flex items-start gap-2">
                    <span className="text-blue-500">ℹ️</span>
                    {field.helpText}
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>

        <div className="sticky bottom-0 bg-white pt-4 mt-4 border-t-2 border-gray-200">
          <div className="flex flex-col-reverse sm:flex-row justify-end gap-3">
            {onCancel && (
              <button
                type="button"
                onClick={onCancel}
                disabled={loading}
                className="flex items-center justify-center gap-2 px-6 py-3 border-2 border-red-300 rounded-xl text-red-600 font-semibold hover:bg-red-50 hover:border-red-400 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <X className="w-5 h-5" />
                {cancelText}
              </button>
            )}
            
            <button
              type="submit"
              disabled={loading}
              className="flex items-center justify-center gap-2 px-8 py-3 bg-gradient-to-r from-emerald-600 to-emerald-700 text-white rounded-xl font-semibold hover:from-emerald-700 hover:to-emerald-800 hover:shadow-lg hover:scale-105 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Procesando...
                </>
              ) : (
                <>
                  <Save className="w-5 h-5" />
                  {submitText}
                </>
              )}
            </button>
          </div>
        </div>
      </form>

      {renderItemsPanel()}
    </>
  );
};

export default Form;