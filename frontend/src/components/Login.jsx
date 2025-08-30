import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/login.css';
import tuercaGif from '../assets/images/tuerca.gif'; // Asegúrate de tener el gif en tu proyecto

const Login = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if(username === "admin" && password === "ferrari123") {
      navigate('/dashboard');
    } else {
      alert('Credenciales incorrectas');
    }
  };

  return (
    <div className="login-container">
      <div className="login-background"></div>
      
      <div className="login-box">
        {/* Contenedor del gif de tuerca (añadido) */}
        <div className="tuerca-gif-container">
          <img src={tuercaGif} alt="Tuerca animada" className="tuerca-gif" />
        </div>

        <div className="logo-container">
          <h1>TALLER MECÁNICO</h1>
          <div className="logo-divider"></div>
          <p>Sistema de Gestión</p>
        </div>
        
        <form onSubmit={handleSubmit}>
          <div className="input-group">
            <label>Usuario</label>
            <input 
              type="text" 
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="admin"
            />
          </div>
          
          <div className="input-group">
            <label>Contraseña</label>
            <input 
              type="password" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
            />
          </div>
          
          <button type="submit" className="login-button">
            INGRESAR
          </button>
        </form>
      </div>
    </div>
  );
};

export default Login;