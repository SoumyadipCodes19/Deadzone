import React, { useState } from 'react';
import { ChevronDownIcon, ChevronUpIcon, SignalIcon } from '@heroicons/react/24/outline';
import '../styles/Home.css';

const Home = () => {
  const [openSection, setOpenSection] = useState('getting-started');

  const manualSections = [
    {
      id: 'getting-started',
      title: 'Getting Started',
      content: [
        {
          subtitle: 'Welcome to DeadZone',
          text: 'DeadZone is your comprehensive network coverage analysis tool designed to help you identify and analyze network dead zones, signal strengths, and coverage patterns.'
        },
        {
          subtitle: 'System Requirements',
          text: 'To use DeadZone effectively, ensure you have:\n- Modern web browser (Chrome, Firefox, Safari)\n- Location services enabled\n- Network connectivity for real-time analysis'
        }
      ]
    },
    {
      id: 'running-tests',
      title: 'Running Network Tests',
      content: [
        {
          subtitle: 'Starting a New Test',
          text: '1. Navigate to the Testing page\n2. Select your test parameters\n3. Choose the coverage area\n4. Click "Start Test" to begin analysis'
        },
        {
          subtitle: 'Test Types',
          text: '- Signal Strength Test\n- Coverage Area Mapping\n- Dead Zone Detection\n- Network Performance Analysis'
        }
      ]
    },
    {
      id: 'coverage-map',
      title: 'Understanding Coverage Maps',
      content: [
        {
          subtitle: 'Map Navigation',
          text: 'Use the interactive map to:\n- Pan and zoom to specific areas\n- Click on markers for detailed information\n- Toggle different coverage layers'
        },
        {
          subtitle: 'Color Coding',
          text: '- Green: Strong signal (> -70 dBm)\n- Yellow: Medium signal (-70 to -85 dBm)\n- Red: Weak signal (< -85 dBm)\n- Gray: Dead zone (No signal)'
        }
      ]
    },
    {
      id: 'reports',
      title: 'Generating Reports',
      content: [
        {
          subtitle: 'Report Types',
          text: '- Coverage Summary Report\n- Dead Zone Analysis\n- Signal Strength Distribution\n- Historical Comparison'
        },
        {
          subtitle: 'Export Options',
          text: 'Export your reports in multiple formats:\n- PDF Document\n- CSV Data\n- Interactive Web Report\n- Map Visualization'
        }
      ]
    },
    {
      id: 'troubleshooting',
      title: 'Troubleshooting',
      content: [
        {
          subtitle: 'Common Issues',
          text: '1. Location access denied\n2. Test not starting\n3. Map not loading\n4. Report generation errors'
        },
        {
          subtitle: 'Support',
          text: 'For additional support:\n- Check our FAQ section\n- Contact technical support\n- Visit our documentation portal\n- Join our community forum'
        }
      ]
    }
  ];

  return (
    <div className="manual-container">
      <div className="manual-content">
        <div className="manual-header">
          <h1 className="manual-title">
            <SignalIcon className="title-icon" />
            DeadZone User Manual
          </h1>
          <p className="manual-subtitle">
            Everything you need to know about using DeadZone effectively
          </p>
        </div>

        <div className="manual-sections">
          {manualSections.map((section) => (
            <div key={section.id} className="section-container">
              <button
                onClick={() => setOpenSection(openSection === section.id ? '' : section.id)}
                className="section-button"
              >
                <span className="section-title">{section.title}</span>
                <div className={`section-icon ${openSection === section.id ? 'open' : ''}`}>
                  {openSection === section.id ? (
                    <ChevronUpIcon />
                  ) : (
                    <ChevronDownIcon />
                  )}
                </div>
              </button>
              
              {openSection === section.id && (
                <div className="section-content">
                  {section.content.map((item, index) => (
                    <div key={index} className="content-block">
                      <h3 className="content-subtitle">
                        {item.subtitle}
                      </h3>
                      <p className="content-text">
                        {item.text}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>

        <div className="help-section">
          <h2 className="help-title">
            Need More Help?
          </h2>
          <p className="help-text">
            If you need additional assistance or have specific questions, our support team is here to help.
            Visit our support portal or contact us directly for personalized assistance.
          </p>
        </div>
      </div>
    </div>
  );
};

export default Home; 