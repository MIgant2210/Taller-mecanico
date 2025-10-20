import React from 'react';
import { AuthProvider } from './hooks/useAuth';
import AppRouter from './AppRouter';
import './App.css';

function App() {
  return (
    <AuthProvider>
      <div className="App">
        <AppRouter />
      </div>
    </AuthProvider>
  );
}

export default App;