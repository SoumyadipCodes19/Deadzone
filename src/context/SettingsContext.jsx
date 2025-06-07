import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

const SettingsContext = createContext();

// Default values for settings
const DEFAULT_SETTINGS = {
  theme: 'dark', // Always dark theme
  accentColor: '#3b82f6',
  defaultMapStyle: 'Streets',
  defaultZoom: 13,
  speedThresholds: {
    excellent: 80, // Above 80 Mbps is excellent
    good: 40,      // 40-80 Mbps is good
    poor: 10       // 10-40 Mbps is poor, below 10 is dead zone
  },
  defaultReportFormat: 'json' // Default report format
};

// Settings storage key
const SETTINGS_STORAGE_KEY = 'deadzone_settings';

export const SettingsProvider = ({ children }) => {
  // Initialize settings from localStorage or defaults
  const [settings, setSettings] = useState(() => {
    try {
      const savedSettings = localStorage.getItem(SETTINGS_STORAGE_KEY);
      return savedSettings ? { ...DEFAULT_SETTINGS, ...JSON.parse(savedSettings) } : DEFAULT_SETTINGS;
    } catch (error) {
      console.error('Error loading settings:', error);
      return DEFAULT_SETTINGS;
    }
  });

  // Update settings
  const updateSettings = useCallback((newSettings) => {
    setSettings(newSettings);
    try {
      localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(newSettings));
    } catch (error) {
      console.error('Error saving settings:', error);
    }
  }, []);

  // Apply theme changes
  const applyTheme = useCallback((themeMode) => {
    const isDark = themeMode === 'dark' || 
      (themeMode === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);
    
    document.documentElement.classList.toggle('dark-mode', isDark);
  }, []);

  // Handle system theme changes
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    
    const handleThemeChange = (e) => {
      if (settings.theme === 'system') {
        applyTheme('system');
      }
    };

    mediaQuery.addEventListener('change', handleThemeChange);
    return () => mediaQuery.removeEventListener('change', handleThemeChange);
  }, [settings.theme, applyTheme]);

  // Apply theme and accent color
  useEffect(() => {
    // Apply theme
    applyTheme(settings.theme);
    
    // Apply accent color
    const root = document.documentElement;
    root.style.setProperty('--primary-color', settings.accentColor);
    
    // Calculate and apply derived colors
    const adjustColor = (hex, brightness = 0, alpha = 1) => {
      const color = hex.replace('#', '');
      const r = parseInt(color.substr(0, 2), 16);
      const g = parseInt(color.substr(2, 2), 16);
      const b = parseInt(color.substr(4, 2), 16);
      
      const adjust = (c) => Math.max(0, Math.min(255, c + brightness));
      
      if (alpha === 1) {
        return `#${[adjust(r), adjust(g), adjust(b)]
          .map(c => c.toString(16).padStart(2, '0'))
          .join('')}`;
      }
      
      return `rgba(${adjust(r)}, ${adjust(g)}, ${adjust(b)}, ${alpha})`;
    };

    root.style.setProperty('--primary-hover', adjustColor(settings.accentColor, -20));
    root.style.setProperty('--primary-rgb', `${parseInt(settings.accentColor.substr(1, 2), 16)}, ${parseInt(settings.accentColor.substr(3, 2), 16)}, ${parseInt(settings.accentColor.substr(5, 2), 16)}`);
    root.style.setProperty('--primary-color-alpha', adjustColor(settings.accentColor, 0, 0.1));
    root.style.setProperty('--shadow-glow', `0 0 15px ${adjustColor(settings.accentColor, 0, 0.5)}`);
  }, [settings.theme, settings.accentColor, applyTheme]);

  return (
    <SettingsContext.Provider value={{ 
      settings, 
      updateSettings,
      speedThresholds: settings.speedThresholds // Expose speedThresholds directly for easier access
    }}>
      {children}
    </SettingsContext.Provider>
  );
};

export const useSettings = () => {
  const context = useContext(SettingsContext);
  if (!context) {
    throw new Error('useSettings must be used within a SettingsProvider');
  }
  return context;
};

export default SettingsContext; 