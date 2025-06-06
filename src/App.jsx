import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import Home from './pages/Home';
import Testing from './pages/Testing';
import Dashboard from './pages/Dashboard';
import Settings from './pages/Settings';
import CoverageMap from './pages/CoverageMap';
import Reports from './pages/Reports';
import { TestProvider } from './context/TestContext';
import { SettingsProvider } from './context/SettingsContext';
import { CoverageProvider } from './context/CoverageContext';
import './styles/main.css';

const App = () => {
  return (
    <SettingsProvider>
      <TestProvider>
        <CoverageProvider>
          <Router>
            <Layout>
              <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/testing" element={<Testing />} />
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/map" element={<CoverageMap />} />
                <Route path="/reports" element={<Reports />} />
                <Route path="/settings" element={<Settings />} />
              </Routes>
            </Layout>
          </Router>
        </CoverageProvider>
      </TestProvider>
    </SettingsProvider>
  );
};

export default App;