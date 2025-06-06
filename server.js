import express from 'express';
import cors from 'cors';
import crypto from 'crypto';

const app = express();
const port = 3001;

// Enable CORS for your React app
app.use(cors({
  origin: 'http://localhost:5173', // Your Vite dev server
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type']
}));

// Generate random data of specified size
function generateRandomData(size) {
  return crypto.randomBytes(size);
}

// Basic health check endpoint
app.get('/health', (req, res) => {
  res.send('Server is running');
});

// Endpoint for speed testing
app.get('/speedtest', (req, res) => {
  try {
    const size = parseInt(req.query.size) || 25000000; // Default 25MB
    console.log(`Generating test data of size: ${size} bytes`);
    
    const data = generateRandomData(size);
    console.log(`Generated data of size: ${data.length} bytes`);
    
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
    res.setHeader('Surrogate-Control', 'no-store');
    
    res.send(data);
    console.log('Data sent successfully');
  } catch (error) {
    console.error('Error in speed test endpoint:', error);
    res.status(500).json({ error: error.message });
  }
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Server error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

// Start server
try {
  app.listen(port, () => {
    console.log(`Speed test server running at http://localhost:${port}`);
    console.log('Available endpoints:');
    console.log('- GET /health - Server health check');
    console.log('- GET /speedtest?size=<bytes> - Speed test endpoint');
  });
} catch (error) {
  console.error('Failed to start server:', error);
  process.exit(1);
} 