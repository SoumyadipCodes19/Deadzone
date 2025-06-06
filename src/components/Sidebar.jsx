import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  HomeIcon,
  ChartBarIcon,
  CogIcon,
  BeakerIcon,
  MapIcon,
  DocumentChartBarIcon
} from '@heroicons/react/24/outline';
import '../styles/main.css';

const Sidebar = () => {
  const location = useLocation();

  const navItems = [
    { path: '/', label: 'Home', icon: HomeIcon },
    { path: '/dashboard', label: 'Dashboard', icon: ChartBarIcon },
    { path: '/testing', label: 'Testing', icon: BeakerIcon },
    { path: '/map', label: 'Coverage Map', icon: MapIcon },
    { path: '/reports', label: 'Reports', icon: DocumentChartBarIcon },
    { path: '/settings', label: 'Settings', icon: CogIcon }
  ];

  return (
    <div className="sidebar">
      <div className="sidebar-header">
        <h1>DeadZone</h1>
      </div>
      <div className="sidebar-content">
        <nav className="nav-list">
          {navItems.map(({ path, label, icon: Icon }) => (
            <div key={path} className="nav-item">
              <Link
                to={path}
                className={`nav-link ${location.pathname === path ? 'active' : ''}`}
              >
                <Icon className="nav-icon" />
                <span>{label}</span>
              </Link>
            </div>
          ))}
        </nav>
      </div>
      <div className="sidebar-footer">
        <div className="version">v1.0.0</div>
      </div>
    </div>
  );
};

export default Sidebar; 