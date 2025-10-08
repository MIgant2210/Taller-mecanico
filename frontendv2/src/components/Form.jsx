import React from 'react';
import { useForm } from '../hooks/useForm';

const Form = ({
  fields = [],
  onSubmit,
  initialData = {},
  submitText = 'Guardar',
  cancelText = 'Cancelar',
  onCancel,
  loading = false
}) => {
  const { formData, handleChange, handleSubmit, errors } = useForm(initialData, onSubmit);

  const renderField = (field) => {
    const commonProps = {
      id: field.name,
      name: field.name,
      value: formData[field.name] || '',
      onChange: (e) => handleChange(field.name, e.target.value), // ← ESTA ES LA LÍNEA CORREGIDA
      className: `w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
        errors[field.name] ? 'border-red-500' : 'border-gray-300'
      }`,
      required: field.required,
      disabled: loading
    };

    switch (field.type) {
      case 'textarea':
        return <textarea {...commonProps} rows={field.rows || 4} />;
      
      case 'select':
        return (
          <select {...commonProps}>
            <option value="">Seleccionar...</option>
            {field.options?.map(option => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        );
      
      case 'number':
        return <input {...commonProps} type="number" step={field.step} min={field.min} />;
      
      case 'date':
        return <input {...commonProps} type="date" />;
      
      case 'datetime':
        return <input {...commonProps} type="datetime-local" />;
      
      case 'checkbox':
        return (
          <input
            {...commonProps}
            type="checkbox"
            checked={formData[field.name] || false}
            onChange={(e) => handleChange(field.name, e.target.checked)}
            className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
          />
        );
      
      default:
        return <input {...commonProps} type={field.type || 'text'} />;
    }
  };

  return (
    <form onSubmit={(e) => handleSubmit(e)} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {fields.map((field) => (
          <div 
            key={field.name} 
            className={field.fullWidth ? 'md:col-span-2' : ''}
          >
            <label 
              htmlFor={field.name} 
              className="block text-sm font-medium text-gray-700 mb-2"
            >
              {field.label}
              {field.required && <span className="text-red-500 ml-1">*</span>}
            </label>
            
            {renderField(field)}
            
            {errors[field.name] && (
              <p className="mt-1 text-sm text-red-600">{errors[field.name]}</p>
            )}
            
            {field.helpText && (
              <p className="mt-1 text-sm text-gray-500">{field.helpText}</p>
            )}
          </div>
        ))}
      </div>

      <div className="flex justify-end space-x-4 pt-4 border-t">
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            disabled={loading}
            className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50"
          >
            {cancelText}
          </button>
        )}
        
        <button
          type="submit"
          disabled={loading}
          className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center"
        >
          {loading && (
            <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
          )}
          {submitText}
        </button>
      </div>
    </form>
  );
};

export default Form;