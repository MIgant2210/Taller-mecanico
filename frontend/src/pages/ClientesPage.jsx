import React from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/module.css';

const ClientesPage = () => {
  const navigate = useNavigate();
  const [clientes, setClientes] = React.useState([]);

  // Conexión al backend (FastAPI)
  React.useEffect(() => {
    const fetchClientes = async () => {
      try {
        const response = await fetch('http://localhost:8000/api/clientes');
        const data = await response.json();
        setClientes(data);
      } catch (error) {
        console.error('Error fetching clientes:', error);
      }
    };

    fetchClientes();
  }, []);

  return (
    <div className="module-container">
      <h1>Gestión de Clientes</h1>
      
      <div className="module-actions">
        <button 
          onClick={() => navigate('/dashboard')}
          className="back-button"
        >
          Volver al Dashboard
        </button>
        <button className="add-button">
          + Nuevo Cliente
        </button>
      </div>

      <div className="module-content">
        {clientes.map(cliente => (
          <div key={cliente.id} className="card">
            <h3>{cliente.nombre}</h3>
            <p>Teléfono: {cliente.telefono}</p>
            <p>Vehículos: {cliente.vehiculos.length}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ClientesPage;