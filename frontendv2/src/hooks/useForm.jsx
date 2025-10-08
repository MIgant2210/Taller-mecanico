import { useState } from 'react';

export const useForm = (initialData = {}, onSubmit) => {
  const [formData, setFormData] = useState(initialData);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  const handleChange = (name, value) => {
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));

    // Limpiar error del campo cuando se modifica
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const handleSubmit = async (e) => {
    if (e) e.preventDefault();
    
    setLoading(true);
    setErrors({});

    try {
      await onSubmit(formData);
    } catch (error) {
      console.error('Error en formulario:', error);
      
      // Manejar errores de validación del backend
      if (error.response?.data?.detail) {
        setErrors({ submit: error.response.data.detail });
      } else {
        setErrors({ submit: 'Error al procesar el formulario' });
      }
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData(initialData);
    setErrors({});
  };

  const updateFormData = (newData) => {
    setFormData(newData);
  };

  const setFieldError = (field, message) => {
    setErrors(prev => ({
      ...prev,
      [field]: message
    }));
  };

  return {
    formData,
    errors,
    loading,
    handleChange,
    handleSubmit,
    resetForm,
    updateFormData,
    setFieldError
  };
};