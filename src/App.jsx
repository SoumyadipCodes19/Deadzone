import React, { useState } from 'react';
import Testing from './pages/Testing';
import Dashboard from './pages/Dashboard';
import './styles.css';

const App = () => {
  const [currentPage, setCurrentPage] = useState('testing');

  return (
    <div className="app">
      <nav className="navigation">
        <div className="nav-brand">
          <span className="brand-icon">📡</span>
          <span className="brand-text">DeadZone</span>
        </div>
        <div className="nav-links">
          <button 
            className={currentPage === 'testing' ? 'active' : ''} 
            onClick={() => setCurrentPage('testing')}
          >
            <span className="nav-icon">🛰️</span>
            <span>Testing</span>
          </button>
          <button 
            className={currentPage === 'dashboard' ? 'active' : ''} 
            onClick={() => setCurrentPage('dashboard')}
          >
            <span className="nav-icon">📊</span>
            <span>Dashboard</span>
          </button>
        </div>
      </nav>

      <main className="main-content">
        {currentPage === 'testing' ? <Testing /> : <Dashboard />}
      </main>
    </div>
  );
};

export default App;