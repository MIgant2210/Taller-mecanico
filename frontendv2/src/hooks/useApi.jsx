import { useState, useEffect } from 'react';
import { api } from '../services/api';

export const useApi = (url, options = {}) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const { 
    method = 'GET', 
    body = null, 
    manual = false,
    dependencies = [] 
  } = options;

  const fetchData = async (customUrl = url, customOptions = {}) => {
    setLoading(true);
    setError(null);
    
    try {
      const config = {
        method: customOptions.method || method,
        url: customUrl,
        data: customOptions.body || body
      };

      const response = await api(config);
      setData(response.data);
      return response.data;
    } catch (err) {
      const errorMessage = err.response?.data?.detail || err.message || 'Error en la petición';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const post = async (postUrl, postData) => {
    return fetchData(postUrl, { method: 'POST', body: postData });
  };

  const put = async (putUrl, putData) => {
    return fetchData(putUrl, { method: 'PUT', body: putData });
  };

  const del = async (deleteUrl) => {
    return fetchData(deleteUrl, { method: 'DELETE' });
  };

  useEffect(() => {
    if (!manual && url) {
      fetchData();
    }
  }, [url, manual, ...dependencies]);

  return {
    data,
    loading,
    error,
    refetch: fetchData,
    post,
    put,
    delete: del
  };
};