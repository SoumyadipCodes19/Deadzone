import React, { useContext } from 'react';
import SettingsContext from '../context/SettingsContext';
import '../styles/Settings.css';

const Settings = () => {
  const { settings, updateSettings } = useContext(SettingsContext);

  const handleThemeChange = (e) => {
    updateSettings({ ...settings, theme: e.target.value });
  };

  const handleAccentColorChange = (e) => {
    updateSettings({ ...settings, accentColor: e.target.value });
  };

  const handleMapStyleChange = (e) => {
    updateSettings({ ...settings, defaultMapStyle: e.target.value });
  };

  const handleZoomLevelChange = (e) => {
    updateSettings({ ...settings, defaultZoom: parseInt(e.target.value) });
  };

  const handleSpeedThresholdChange = (type, value) => {
    const newValue = parseInt(value);
    if (isNaN(newValue)) return;

    updateSettings({
      ...settings,
      speedThresholds: {
        ...settings.speedThresholds,
        [type]: newValue
      }
    });
  };

  return (
    <div className="settings-page">
      <div className="settings-header">
        <div>
          <h1>Settings</h1>
          <div className="settings-description">
            Customize your DeadZone experience
          </div>
        </div>
      </div>

      <div className="settings-grid">
        <div className="settings-card">
          <h2>🎨 Theme Customization</h2>
          <div className="settings-section">
            <h3>Theme Mode</h3>
            <p>Choose your preferred color theme</p>
            <div className="form-group">
              <select 
                className="form-select"
                value={settings.theme}
                onChange={handleThemeChange}
              >
                <option value="system">System Default</option>
                <option value="light">Light</option>
                <option value="dark">Dark</option>
              </select>
            </div>
          </div>

          <div className="settings-section">
            <h3>Accent Color</h3>
            <p>Select a custom accent color</p>
            <div className="form-group">
              <div className="color-picker">
                <div 
                  className="color-preview"
                  style={{ backgroundColor: settings.accentColor }}
                ></div>
                <input
                  type="color"
                  className="color-input"
                  value={settings.accentColor}
                  onChange={handleAccentColorChange}
                />
              </div>
            </div>
          </div>
        </div>

        <div className="settings-card">
          <h2>🗺️ Map Preferences</h2>
          <div className="settings-section">
            <h3>Default Map Style</h3>
            <p>Choose the default map appearance</p>
            <div className="form-group">
              <select 
                className="form-select"
                value={settings.defaultMapStyle}
                onChange={handleMapStyleChange}
              >
                <option value="Streets">Streets</option>
                <option value="Satellite">Satellite</option>
                <option value="Hybrid">Hybrid</option>
              </select>
            </div>
          </div>

          <div className="settings-section">
            <h3>Default Zoom Level ({settings.defaultZoom})</h3>
            <p>Set the initial map zoom level</p>
            <div className="form-group">
              <div className="range-group">
                <div className="range-header">
                  <div className="range-value">{settings.defaultZoom}</div>
                </div>
                <input
                  type="range"
                  className="range-input"
                  min="1"
                  max="20"
                  value={settings.defaultZoom}
                  onChange={handleZoomLevelChange}
                />
              </div>
            </div>
          </div>
        </div>

        <div className="settings-card">
          <h2>📊 Speed Thresholds</h2>
          <div className="settings-section">
            <h3>Zone Classification</h3>
            <p>Configure speed thresholds for different zones (in Mbps)</p>
            <div className="threshold-inputs">
              <div className="threshold-input">
                <label>Excellent (Above)</label>
                <input
                  type="number"
                  className="form-input"
                  min="0"
                  max="1000"
                  value={settings.speedThresholds.excellent}
                  onChange={(e) => handleSpeedThresholdChange('excellent', e.target.value)}
                />
                <div className="threshold-badge excellent">🟢</div>
              </div>
              <div className="threshold-input">
                <label>Good (Above)</label>
                <input
                  type="number"
                  className="form-input"
                  min="0"
                  max="1000"
                  value={settings.speedThresholds.good}
                  onChange={(e) => handleSpeedThresholdChange('good', e.target.value)}
                />
                <div className="threshold-badge good">🟡</div>
              </div>
              <div className="threshold-input">
                <label>Poor (Above)</label>
                <input
                  type="number"
                  className="form-input"
                  min="0"
                  max="1000"
                  value={settings.speedThresholds.poor}
                  onChange={(e) => handleSpeedThresholdChange('poor', e.target.value)}
                />
                <div className="threshold-badge poor">🟠</div>
              </div>
              <div className="threshold-input">
                <label>Dead Zone (Below Poor)</label>
                <div className="threshold-value">
                  {settings.speedThresholds.poor} Mbps and below
                </div>
                <div className="threshold-badge dead">⚫</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Settings; 