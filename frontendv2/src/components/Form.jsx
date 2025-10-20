import React, { useState, useEffect } from 'react';
import { useForm } from '../hooks/useForm';
import { Save, X, Loader2, AlertCircle, Calendar, Hash, Type, Mail, Phone, MapPin, FileText, User, Percent, Eye } from 'lucide-react';

const Form = ({
  fields = [],
  onSubmit,
  initialData = {},
  submitText = 'Guardar',
  cancelText = 'Cancelar',
  onCancel,
  loading = false,
  // Nuevas props específicas para cotizaciones
  cotizacionMode = false,
  onItemAdd,
  items = [],
  calculatedTotals = {}
}) => {
  const { formData, handleChange, handleSubmit, errors } = useForm(initialData, onSubmit);
  const [clients, setClients] = useState([]);
  const [servicios, setServicios] = useState([]);
  const [repuestos, setRepuestos] = useState([]);
  const [showItemsPanel, setShowItemsPanel] = useState(false);

  // Cargar datos para cotizaciones
  useEffect(() => {
    if (cotizacionMode) {
      // Aquí irían las llamadas a tus servicios
      // getClients().then(setClients);
      // getServicios().then(setServicios);
      // getRepuestos().then(setRepuestos);
    }
  }, [cotizacionMode]);

  // Función para obtener el icono según el tipo de campo
  const getFieldIcon = (field) => {
    const iconClass = "w-5 h-5 text-gray-400";
    
    switch (field.type) {
      case 'email':
        return <Mail className={iconClass} />;
      case 'tel':
      case 'phone':
        return <Phone className={iconClass} />;
      case 'number':
        return <Hash className={iconClass} />;
      case 'date':
      case 'datetime':
        return <Calendar className={iconClass} />;
      case 'textarea':
        return <FileText className={iconClass} />;
      case 'percent':
        return <Percent className={iconClass} />;
      case 'client':
        return <User className={iconClass} />;
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

  // Calendario mejorado con CSS nativo
  const renderDateField = (field) => {
    const hasError = errors[field.name];
    
    return (
      <div className="relative">
        <div className="absolute left-3 top-1/2 transform -translate-y-1/2 pointer-events-none">
          {getFieldIcon(field)}
        </div>
        <input
          id={field.name}
          name={field.name}
          type={field.type}
          value={formData[field.name] || ''}
          onChange={(e) => handleChange(field.name, e.target.value)}
          required={field.required}
          disabled={loading}
          className={`
            w-full px-4 py-3 pl-11 border rounded-xl transition-all duration-200
            focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent
            disabled:bg-gray-100 disabled:cursor-not-allowed
            bg-white cursor-pointer
            ${hasError 
              ? 'border-red-300 bg-red-50 focus:ring-red-500' 
              : 'border-gray-300 hover:border-gray-400'
            }
            /* Estilos mejorados para el calendario */
            appearance-none
            [&::-webkit-calendar-picker-indicator]:bg-gradient-to-r [&::-webkit-calendar-picker-indicator]:from-blue-500 [&::-webkit-calendar-picker-indicator]:to-blue-600
            [&::-webkit-calendar-picker-indicator]:rounded-lg [&::-webkit-calendar-picker-indicator]:p-1
            [&::-webkit-calendar-picker-indicator]:cursor-pointer [&::-webkit-calendar-picker-indicator]:hover:from-blue-600 [&::-webkit-calendar-picker-indicator]:hover:to-blue-700
            [&::-webkit-datetime-edit]:text-gray-700 [&::-webkit-datetime-edit-fields-wrapper]:p-1
            [&::-webkit-datetime-edit-text]:text-blue-600 [&::-webkit-datetime-edit-text]:font-semibold
          `}
          placeholder={field.placeholder || `Seleccionar ${field.label.toLowerCase()}`}
        />
      </div>
    );
  };

  const renderField = (field) => {
    const hasError = errors[field.name];
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
      onChange: (e) => handleChange(field.name, e.target.value),
      className: inputClasses,
      required: field.required,
      disabled: loading,
      placeholder: field.placeholder || `Ingrese ${field.label.toLowerCase()}`
    };

    // Campo de fecha mejorado
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
            />
          </div>
        );
      
      case 'select':
        return (
          <div className="relative">
            {showIcon && (
              <div className="absolute left-3 top-1/2 transform -translate-y-1/2 pointer-events-none">
                {getFieldIcon(field)}
              </div>
            )}
            <select {...commonProps} className={`${inputClasses} appearance-none`}>
              <option value="">Seleccionar...</option>
              {field.options?.map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            <div className="absolute inset-y-0 right-0 flex items-center px-3 pointer-events-none">
              <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </div>
          </div>
        );
      
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
              type="number" 
              step={field.step} 
              min={field.min}
              max={field.max}
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
              onChange={(e) => handleChange(field.name, e.target.checked)}
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
            <input {...commonProps} type={field.type || 'text'} />
          </div>
        );
    }
  };

  // Panel de items para cotizaciones
  const renderItemsPanel = () => {
    if (!cotizacionMode || !showItemsPanel) return null;

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
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
          
          <div className="p-6 overflow-y-auto">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Servicios */}
              <div className="space-y-4">
                <h4 className="font-semibold text-lg text-gray-800 border-b pb-2">Servicios</h4>
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {servicios.map(servicio => (
                    <button
                      key={servicio.id_servicio}
                      onClick={() => onItemAdd?.(servicio, 'servicio')}
                      className="w-full text-left p-4 border border-gray-200 rounded-lg hover:border-blue-300 hover:bg-blue-50 transition-all duration-200"
                    >
                      <div className="font-medium text-gray-800">{servicio.nombre_servicio}</div>
                      <div className="text-sm text-gray-600 mt-1">Q{servicio.precio_base}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Repuestos */}
              <div className="space-y-4">
                <h4 className="font-semibold text-lg text-gray-800 border-b pb-2">Repuestos</h4>
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {repuestos.map(repuesto => (
                    <button
                      key={repuesto.id_repuesto}
                      onClick={() => onItemAdd?.(repuesto, 'repuesto')}
                      className="w-full text-left p-4 border border-gray-200 rounded-lg hover:border-green-300 hover:bg-green-50 transition-all duration-200"
                    >
                      <div className="font-medium text-gray-800">{repuesto.nombre_repuesto}</div>
                      <div className="text-sm text-gray-600 mt-1">Q{repuesto.precio_venta}</div>
                      <div className="text-xs text-gray-500 mt-1">Stock: {repuesto.stock_actual}</div>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // Resumen de cotización
  const renderCotizacionSummary = () => {
    if (!cotizacionMode || !items.length) return null;

    return (
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-6 mb-6">
        <h3 className="font-bold text-lg text-gray-800 mb-4 flex items-center gap-2">
          <Eye className="w-5 h-5" />
          Resumen de la Cotización
        </h3>
        
        {/* Items agregados */}
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

        {/* Totales */}
        {calculatedTotals && (
          <div className="border-t pt-4 space-y-2">
            <div className="flex justify-between text-sm">
              <span>Subtotal:</span>
              <span className="font-medium">Q{calculatedTotals.subtotal?.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span>Impuestos ({formData.impuestos || 0}%):</span>
              <span className="font-medium">Q{calculatedTotals.impuestoMonto?.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span>Descuento ({formData.descuentos || 0}%):</span>
              <span className="font-medium text-red-600">-Q{calculatedTotals.descuentoMonto?.toFixed(2)}</span>
            </div>
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
      <form onSubmit={(e) => handleSubmit(e)} className="flex flex-col h-full">
        {/* Contenedor con scroll para los campos */}
        <div className="flex-1 overflow-y-auto pr-2 -mr-2">
          {/* Botón para agregar items en modo cotización */}
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

          {/* Resumen de cotización */}
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
                
                {errors[field.name] && (
                  <div className="flex items-start gap-2 text-red-600 bg-red-50 px-3 py-2 rounded-lg border border-red-200">
                    <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                    <p className="text-sm">{errors[field.name]}</p>
                  </div>
                )}
                
                {field.helpText && !errors[field.name] && (
                  <p className="text-sm text-gray-500 flex items-start gap-2">
                    <span className="text-blue-500">ℹ️</span>
                    {field.helpText}
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Botones sticky al fondo */}
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

      {/* Panel de items para cotizaciones */}
      {renderItemsPanel()}
    </>
  );
};

export default Form;