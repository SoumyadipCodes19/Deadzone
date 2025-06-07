# DeadZone Web - Network Coverage Mapping Application

## Overview
DeadZone Web is a modern web application designed to map and analyze network coverage dead zones. It helps users identify areas with poor network connectivity and provides detailed analysis of network performance across different geographical locations.

## 🌟 Features
- Interactive network coverage mapping
- Real-time speed testing functionality
- Detailed network performance analytics
- Data visualization using Recharts
- Map integration with Leaflet
- PDF report generation
- Responsive design for all devices
- Date-based data filtering and analysis

## 🛠️ Tech Stack
### Frontend
- React.js
- Vite (Build tool)
- Tailwind CSS (Styling)
- React Router (Navigation)
- Leaflet/OpenLayers (Mapping)
- Recharts (Data visualization)
- jsPDF (PDF generation)
- Heroicons (Icons)

### Backend
- Node.js
- Express.js
- CORS support
- Crypto (for speed test data generation)

## 📋 Prerequisites
- Node.js (v14 or higher)
- npm (v6 or higher)

## 🚀 Getting Started

### Local Development Setup

1. Clone the repository
```bash
git clone https://github.com/yourusername/deadzone-web.git
cd deadzone-web
```

2. Install dependencies
```bash
npm install
```

3. Start the development server
```bash
npm run dev
```
This will concurrently run:
- Backend server on http://localhost:3001
- Frontend development server on http://localhost:5173

### Production Build

1. Create a production build
```bash
npm run build
```

2. Preview the production build
```bash
npm run serve
```

## 🌐 Deployment
The application is deployed on Vercel. The production version can be accessed at:
https://deadzone-soumyadipcodes19s-projects.vercel.app/

### Analytics
The application is integrated with Vercel Analytics to track:
- Page views
- Visitor counts
- Bounce rates
- Geographic distribution
- Device information
- Browser statistics
- Custom events (Pro feature)

### Environment Variables
Make sure to set up the following environment variables in your Vercel deployment:
- `VITE_API_URL`: Your backend API URL
- Add any other environment variables your application needs

## 📝 API Endpoints

### Speed Test
- `GET /speedtest?size=<bytes>`: Performs network speed test
  - Query parameter: size (default: 25MB)
  - Returns: Random data of specified size for testing

### Health Check
- `GET /health`: Server health check endpoint
  - Returns: Server status message

## 🔧 Configuration
- Frontend configuration can be modified in `vite.config.js`
- Tailwind CSS configuration in `tailwind.config.js`
- Backend server configuration in `server.js`

## 🤝 Contributing
Contributions are welcome! Please feel free to submit a Pull Request.

## 📄 License
This project is licensed under the MIT License - see the LICENSE file for details.

## 🐛 Known Issues
- List any known issues or limitations here
- Add workarounds if available

## 📞 Support
For support, please open an issue in the GitHub repository or contact the maintainers.
