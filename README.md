# DeadZone Web App

Track and visualize internet connectivity zones with real-time speed testing and mapping.

## Features

- 🌍 Interactive Map Visualization
  - Multiple map styles (Dark/Streets/Satellite)
  - Custom markers with speed indicators
  - Heatmap visualization
  - Auto-centering on new tests
  - Click markers for detailed information

- 📊 Speed Testing
  - Manual speed testing
  - Automated background testing
  - Configurable test intervals
  - Persistent test history
  - Accurate geolocation tracking

- 📱 User Experience
  - Dark mode interface
  - Responsive design
  - Real-time updates
  - Offline support
  - Background testing

- 📈 Data Management
  - Local storage persistence
  - Export functionality
  - Statistical analysis
  - Coverage visualization
  - Trend tracking

## Getting Started

1. Clone the repository:
   ```bash
   git clone https://github.com/yourusername/deadzone-web.git
   cd deadzone-web
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the development server:
   ```bash
   npm run dev
   ```

## Project Structure

```
src/
├── components/          # Reusable UI components
│   ├── map/            # Map-related components
│   └── common/         # Common UI elements
├── hooks/              # Custom React hooks
├── workers/            # Web Workers for background tasks
├── utils/             # Utility functions
└── pages/             # Main application pages
```

## Components

### MapContainer
The main map component that handles:
- Map initialization
- Layer management
- Marker rendering
- Style switching

### Speed Testing
Handles internet speed testing with:
- Manual testing
- Automated background testing
- Geolocation tracking
- Result persistence

## Hooks

### useMapMarkers
Custom hook for managing map markers:
- Add/remove markers
- Style markers
- Handle marker animations
- Manage marker clustering

### useSpeedTest
Custom hook for speed testing:
- Run manual tests
- Manage auto-testing
- Handle test intervals
- Persist test results

## Web Workers

### speedTestWorker
Handles background speed testing:
- Runs tests in background
- Manages test intervals
- Reports results to main thread
- Handles geolocation

## Contributing

1. Fork the repository
2. Create your feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.