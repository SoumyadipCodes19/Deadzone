import React, { useState } from 'react';
import { useCoverage } from '../context/CoverageContext';
import { useSettings } from '../context/SettingsContext';
import Button from '../components/common/Button';
import ConfirmDialog from '../components/common/ConfirmDialog';
import { jsPDF } from 'jspdf/dist/jspdf.es.min.js';
import autoTable from 'jspdf-autotable';
import '../styles/Reports.css';

const ReportPreview = ({ report, onClose }) => {
  if (!report) return null;

  const renderCoverageReport = (data) => (
    <div className="report-preview-content">
      <h3>Coverage Statistics</h3>
      <div className="stats-grid">
        <div className="stat-item">
          <label>Excellent Signal Areas</label>
          <span>{data.statistics.excellentSignal}</span>
        </div>
        <div className="stat-item">
          <label>Good Signal Areas</label>
          <span>{data.statistics.goodSignal}</span>
        </div>
        <div className="stat-item">
          <label>Poor Signal Areas</label>
          <span>{data.statistics.poorSignal}</span>
        </div>
        <div className="stat-item">
          <label>Dead Zones</label>
          <span>{data.statistics.deadZones}</span>
        </div>
      </div>
      <p className="coverage-note">Total Coverage Points: {data.coverage.length}</p>
    </div>
  );

  const renderAnalysisReport = (data) => (
    <div className="report-preview-content">
      <h3>Network Analysis</h3>
      
      <div className="analysis-section">
        <h4>Peak Performance Hours</h4>
        <ul className="hours-list">
          {data.peakHours.map((period, index) => (
            <li key={index}>
              {period.hour}:{String(period.minute).padStart(2, '0')} - Avg Speed: {period.averageSpeed.toFixed(1)} Mbps
              <div className="hour-details">
                <span>Range: {period.minSpeed.toFixed(1)}-{period.maxSpeed.toFixed(1)} Mbps</span>
                <span>Variability: {period.variability.toFixed(1)}</span>
                <span>Consistency: {period.consistencyScore.toFixed(1)}%</span>
              </div>
            </li>
          ))}
          {data.peakHours.length === 0 && (
            <li className="no-data">No peak performance periods identified yet</li>
          )}
        </ul>
      </div>

      <div className="analysis-section">
        <h4>Performance Concerns</h4>
        <ul className="hours-list">
          {data.worstHours.map((period, index) => (
            <li key={index}>
              {period.hour}:{String(period.minute).padStart(2, '0')} - Avg Speed: {period.averageSpeed.toFixed(1)} Mbps
              <div className="hour-details">
                <span>Range: {period.minSpeed.toFixed(1)}-{period.maxSpeed.toFixed(1)} Mbps</span>
                <span>Variability: {period.variability.toFixed(1)}</span>
                <span>Consistency: {period.consistencyScore.toFixed(1)}%</span>
              </div>
            </li>
          ))}
          {data.worstHours.length === 0 && (
            <li className="no-data">No significant performance issues detected</li>
          )}
        </ul>
      </div>

      <div className="analysis-section">
        <h4>Overall Trend</h4>
        <div className="trend-details">
          <p className={`trend trend-${data.overallTrend}`}>
            Network performance is {data.overallTrend}
          </p>
          {data.trendDetails && (
            <div className="trend-metrics">
              <span>Change: {data.trendDetails.percentChange > 0 ? '+' : ''}{data.trendDetails.percentChange}%</span>
              <span>Previous Avg: {data.trendDetails.oldAverage} Mbps</span>
              <span>Current Avg: {data.trendDetails.newAverage} Mbps</span>
            </div>
          )}
        </div>
      </div>

      {data.recommendations.length > 0 && (
        <div className="analysis-section">
          <h4>Recommendations</h4>
          <ul className="recommendations-list">
            {data.recommendations.map((rec, index) => (
              <li key={index} className="recommendation-item">
                {rec}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );

  const renderPerformanceReport = (data) => (
    <div className="report-preview-content">
      <h3>Performance Metrics</h3>
      <div className="metrics-grid">
        <div className="metric-item">
          <label>Average Speed</label>
          <span>{data.metrics.averageSpeed.toFixed(1)} Mbps</span>
        </div>
        <div className="metric-item">
          <label>Maximum Speed</label>
          <span>{data.metrics.maxSpeed.toFixed(1)} Mbps</span>
        </div>
        <div className="metric-item">
          <label>Minimum Speed</label>
          <span>{data.metrics.minSpeed.toFixed(1)} Mbps</span>
        </div>
        <div className="metric-item">
          <label>Network Reliability</label>
          <span>{data.metrics.reliability.toFixed(1)}%</span>
        </div>
        <div className="metric-item">
          <label>Speed Consistency</label>
          <span>{data.metrics.consistency.toFixed(1)}%</span>
        </div>
      </div>
      <div className="performance-section">
        <h4>Time-based Analysis</h4>
        <div className="time-analysis">
          {data.timeBasedAnalysis.map((time, index) => (
            <div key={index} className="time-item">
              <span>{time.hour}:00</span>
              <div className="speed-bar" style={{ width: `${(time.averageSpeed / data.metrics.maxSpeed) * 100}%` }}>
                {time.averageSpeed.toFixed(1)} Mbps
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const renderOptimizationReport = (data) => (
    <div className="report-preview-content">
      <h3>Network Optimization</h3>
      <div className="optimization-stats">
        <div className="stat-item">
          <label>Total Areas</label>
          <span>{data.coverage.total}</span>
        </div>
        <div className="stat-item">
          <label>Problem Areas</label>
          <span>{data.coverage.dead + data.coverage.weak}</span>
        </div>
        <div className="stat-item">
          <label>Network Score</label>
          <span>{data.coverage.improvement.toFixed(1)}%</span>
        </div>
      </div>
      <div className="problem-areas">
        <h4>Priority Areas for Improvement</h4>
        {data.problemAreas.map((area, index) => (
          <div key={index} className="problem-area-item">
            <div className="area-header">
              <span className="area-location">Location: {area.location}</span>
              <span className="area-speed">Current Speed: {area.currentSpeed} Mbps</span>
            </div>
            <div className="area-details">
              <span className="area-size">Affected Tests: {area.size}</span>
              <span className="area-priority">Priority Score: {area.priority.toFixed(2)}</span>
            </div>
          </div>
        ))}
      </div>
      <div className="recommendations">
        <h4>Recommendations</h4>
        {data.recommendations.map((rec, index) => (
          <div key={index} className="recommendation-item">
            <div className="rec-location">Location: {rec.location}</div>
            <div className="rec-action">{rec.recommendation}</div>
            <div className="rec-details">
              Affected Tests: {rec.affectedTests} | Current Speed: {rec.currentSpeed} Mbps
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const renderReportContent = () => {
    switch (report.type) {
      case 'analysis':
        return renderAnalysisReport(report.data);
      case 'performance':
        return renderPerformanceReport(report.data);
      case 'optimization':
        return renderOptimizationReport(report.data);
      default:
        return renderCoverageReport(report.data);
    }
  };

  return (
    <div className="report-preview-overlay">
      <div className="report-preview-modal">
        <div className="preview-header">
          <h2>{report.title}</h2>
          <Button onClick={onClose} variant="secondary">Close</Button>
        </div>
        {renderReportContent()}
      </div>
    </div>
  );
};

const Reports = () => {
  const { reports, generateReport, deleteReport, clearAllReports } = useCoverage();
  const { settings } = useSettings();
  const [selectedFilter, setSelectedFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [selectedReportType, setSelectedReportType] = useState('coverage');
  const [previewReport, setPreviewReport] = useState(null);
  const [showClearConfirm, setShowClearConfirm] = useState(false);

  const filters = [
    { value: 'all', label: 'All Reports' },
    { value: 'coverage', label: 'Coverage Reports' },
    { value: 'analysis', label: 'Analysis Reports' },
    { value: 'optimization', label: 'Optimization Reports' },
    { value: 'performance', label: 'Performance Reports' }
  ];

  const reportTypes = [
    { 
      value: 'coverage', 
      label: 'Coverage Report',
      description: 'Shows network coverage data across locations, signal strength distribution, and maps dead zones.'
    },
    { 
      value: 'analysis', 
      label: 'Analysis Report',
      description: 'Analyzes peak hours, performance trends, and provides network improvement recommendations.'
    },
    { 
      value: 'performance', 
      label: 'Performance Report',
      description: 'Detailed metrics on network speed, reliability, and consistency across time and locations.'
    },
    { 
      value: 'optimization', 
      label: 'Optimization Report',
      description: 'Identifies problem areas and provides targeted recommendations for network improvements.'
    }
  ];

  const filteredReports = reports?.filter(report => {
    const matchesFilter = selectedFilter === 'all' || report.type === selectedFilter;
    const matchesSearch = report.title.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesFilter && matchesSearch;
  }) || [];

  const getStatusClass = (status) => {
    switch (status) {
      case 'completed':
        return 'status-completed';
      case 'in_progress':
        return 'status-in-progress';
      default:
        return 'status-default';
    }
  };

  const handleGenerateReport = async () => {
    setIsGenerating(true);
    try {
      await generateReport(selectedReportType);
    } catch (error) {
      console.error('Error generating report:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDownload = (report) => {
    const format = settings.defaultReportFormat;
    const reportTitle = report.title.replace(/[^a-zA-Z0-9]/g, '_');

    switch (format) {
      case 'csv': {
        let csvContent = '';
        
        // Add report title and timestamp
        csvContent += `${report.title}\n`;
        csvContent += `Generated on: ${new Date(report.date).toLocaleString()}\n\n`;

        if (report.type === 'coverage') {
          // Headers for coverage report
          csvContent += 'Location,Speed (Mbps),Signal Quality,Timestamp\n';
          
          // Data rows for coverage points
          report.data.coverage.forEach(point => {
            const quality = point.speed > report.data.statistics.excellent ? 'Excellent' :
                          point.speed > report.data.statistics.good ? 'Good' :
                          point.speed > report.data.statistics.poor ? 'Poor' : 'Dead Zone';
            
            csvContent += `"${point.lat},${point.lng}",${point.speed.toFixed(2)},"${quality}","${new Date(point.timestamp).toLocaleString()}"\n`;
          });

          // Add statistics
          csvContent += '\nStatistics\n';
          csvContent += `Excellent Signal Areas,${report.data.statistics.excellentSignal}\n`;
          csvContent += `Good Signal Areas,${report.data.statistics.goodSignal}\n`;
          csvContent += `Poor Signal Areas,${report.data.statistics.poorSignal}\n`;
          csvContent += `Dead Zones,${report.data.statistics.deadZones}\n`;
        } else {
          // For other report types, convert the data structure to CSV
          Object.entries(report.data).forEach(([key, value]) => {
            if (typeof value === 'object') {
              csvContent += `\n${key.toUpperCase()}\n`;
              Object.entries(value).forEach(([subKey, subValue]) => {
                csvContent += `${subKey},${subValue}\n`;
              });
            } else {
              csvContent += `${key},${value}\n`;
            }
          });
        }

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `${reportTitle}.csv`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
        break;
      }

      case 'pdf': {
        const doc = new jsPDF();
        
        // Set title
        doc.setFontSize(20);
        doc.text(report.title, 20, 20);
        
        // Add timestamp
        doc.setFontSize(12);
        doc.text(`Generated on: ${new Date(report.date).toLocaleString()}`, 20, 30);

        if (report.type === 'coverage') {
          // Add statistics table
          doc.autoTable({
            startY: 40,
            head: [['Coverage Statistics', 'Count']],
            body: [
              ['Excellent Signal Areas', report.data.statistics.excellentSignal],
              ['Good Signal Areas', report.data.statistics.goodSignal],
              ['Poor Signal Areas', report.data.statistics.poorSignal],
              ['Dead Zones', report.data.statistics.deadZones]
            ],
          });

          // Add coverage points table
          const coverageData = report.data.coverage.map(point => [
            `${point.lat}, ${point.lng}`,
            point.speed.toFixed(2),
            point.speed > report.data.statistics.excellent ? 'Excellent' :
            point.speed > report.data.statistics.good ? 'Good' :
            point.speed > report.data.statistics.poor ? 'Poor' : 'Dead Zone',
            new Date(point.timestamp).toLocaleString()
          ]);

          doc.autoTable({
            startY: doc.previousAutoTable.finalY + 10,
            head: [['Location', 'Speed (Mbps)', 'Signal Quality', 'Timestamp']],
            body: coverageData,
          });
        } else {
          // For other report types
          const tableData = [];
          Object.entries(report.data).forEach(([key, value]) => {
            if (typeof value === 'object') {
              tableData.push([{ content: key.toUpperCase(), colSpan: 2, styles: { fontStyle: 'bold' } }]);
              Object.entries(value).forEach(([subKey, subValue]) => {
                tableData.push([subKey, subValue]);
              });
            } else {
              tableData.push([key, value]);
            }
          });

          doc.autoTable({
            startY: 40,
            head: [['Property', 'Value']],
            body: tableData,
          });
        }

        doc.save(`${reportTitle}.pdf`);
        break;
      }

      default: { // json
        const blob = new Blob([JSON.stringify(report.data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `${reportTitle}.json`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
      }
    }
  };

  const handleViewReport = (report) => {
    setPreviewReport(report);
  };

  return (
    <div className="reports-container">
      <div className="reports-header">
        <h2>Reports</h2>
        <div className="report-controls">
          <div className="report-type-group">
            <label htmlFor="report-type">Report Type</label>
            <div className="report-type-row">
              <select 
                id="report-type"
                className="form-select"
                value={selectedReportType}
                onChange={(e) => setSelectedReportType(e.target.value)}
              >
                {reportTypes.map(type => (
                  <option key={type.value} value={type.value}>
                    {type.label}
                  </option>
                ))}
              </select>
              <Button 
                onClick={handleGenerateReport}
                disabled={isGenerating}
              >
                Generate Report
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="reports-filters">
        <div className="filter-buttons">
          {filters.map(filter => (
            <button
              key={filter.value}
              className={`filter-btn ${selectedFilter === filter.value ? 'active' : ''}`}
              onClick={() => setSelectedFilter(filter.value)}
            >
              {filter.label}
            </button>
          ))}
        </div>
        <div className="search-group">
          <input
            type="text"
            placeholder="Search reports..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="form-input"
          />
        </div>
      </div>

      <div className="reports-content">
        <div className="reports-table">
          <table>
            <thead>
              <tr>
                <th>Report</th>
                <th>Date</th>
                <th>Status</th>
                <th>Size</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredReports.map((report) => (
                <tr key={report.id}>
                  <td className="report-info">
                    <div className="report-title">{report.title}</div>
                    <div className="report-type">{report.type}</div>
                  </td>
                  <td>{new Date(report.date).toLocaleDateString()}</td>
                  <td>
                    <span className={`status-badge ${getStatusClass(report.status)}`}>
                      {report.status.charAt(0).toUpperCase() + report.status.slice(1)}
                    </span>
                  </td>
                  <td>{report.size}</td>
                  <td className="actions">
                    <Button onClick={() => handleViewReport(report)} variant="secondary" className="action-btn">
                      View
                    </Button>
                    <Button onClick={() => handleDownload(report)} variant="secondary" className="action-btn">
                      Download
                    </Button>
                    <Button onClick={() => deleteReport(report.id)} variant="danger" className="action-btn delete">
                      Delete
                    </Button>
                  </td>
                </tr>
              ))}
              {filteredReports.length === 0 && (
                <tr>
                  <td colSpan="5" className="no-data">
                    No reports found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="reports-stats">
          <div className="stat-card">
            <h3>Storage Usage</h3>
            <div className="storage-info">
              <div className="storage-bar">
                <div 
                  className="storage-fill"
                  style={{ width: `${Math.min(75, (filteredReports.length * 5))}%` }}
                ></div>
              </div>
              <div className="storage-text">
                {(filteredReports.length * 1.5).toFixed(2)} MB of 20 MB used
              </div>
            </div>
          </div>

          <div className="stat-card">
            <h3>Report Types</h3>
            <div className="type-stats">
              {filters.slice(1).map(filter => {
                const count = filteredReports.filter(r => r.type === filter.value).length;
                const percentage = filteredReports.length > 0 
                  ? Math.round((count / filteredReports.length) * 100) 
                  : 0;
                return (
                  <div key={filter.value} className="type-stat">
                    <span>{filter.label}</span>
                    <span>{percentage}%</span>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="stat-card">
            <h3>Quick Actions</h3>
            <div className="quick-actions">
              <Button 
                onClick={() => {
                  const allReportsData = filteredReports.map(r => r.data);
                  const dataStr = JSON.stringify(allReportsData);
                  const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
                  const linkElement = document.createElement('a');
                  linkElement.setAttribute('href', dataUri);
                  linkElement.setAttribute('download', 'all-reports.json');
                  linkElement.click();
                }}
                variant="secondary"
                className="action-btn"
              >
                Export All Reports
              </Button>
              <Button 
                onClick={() => setShowClearConfirm(true)}
                variant="danger"
                className="action-btn"
              >
                Clear All Reports
              </Button>
            </div>
          </div>
        </div>
      </div>

      {previewReport && (
        <ReportPreview 
          report={previewReport} 
          onClose={() => setPreviewReport(null)} 
        />
      )}

      <ConfirmDialog
        isOpen={showClearConfirm}
        message="Are you sure you want to delete all reports? This action cannot be undone."
        onConfirm={() => {
          clearAllReports();
          setShowClearConfirm(false);
        }}
        onCancel={() => setShowClearConfirm(false)}
      />
    </div>
  );
};

export default Reports; 