export const testInternetSpeed = async () => {
  console.log('Starting speed test...');
  const testSizes = [
    25000000,  // 25 MB
    5000000,   // 5 MB
    1000000    // 1 MB
  ];

  for (const size of testSizes) {
    try {
      console.log(`Testing with size: ${size} bytes`);
      const startTime = performance.now();
      
      console.log('Fetching...');
      const response = await fetch(`http://localhost:3001/speedtest?size=${size}`, {
        method: 'GET',
        cache: 'no-store'
      });
      
      if (!response.ok) {
        console.warn(`Failed to fetch test data: ${response.status}`);
        continue;
      }
      
      console.log('Reading response...');
      const blob = await response.blob();
      const endTime = performance.now();
      
      console.log(`Response size: ${blob.size} bytes`);
      const duration = (endTime - startTime) / 1000; // Convert to seconds
      console.log(`Test duration: ${duration} seconds`);
      
      const fileSizeInBits = blob.size * 8;
      const speedMbps = (fileSizeInBits / duration) / (1024 * 1024);
      console.log(`Calculated speed: ${speedMbps} Mbps`);
      
      // Validate the result
      if (speedMbps > 0 && speedMbps < 10000) { // Reasonable range check
        console.log(`Returning valid speed: ${Math.round(speedMbps * 100) / 100} Mbps`);
        return Math.round(speedMbps * 100) / 100; // Round to 2 decimal places
      }
      
      console.warn(`Invalid speed result: ${speedMbps}`);
    } catch (error) {
      console.error(`Error during speed test:`, error);
    }
  }
  
  throw new Error('All speed test attempts failed');
};

export const getLocation = () =>
  new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error('Geolocation is not supported by this browser.'));
      return;
    }
    
    navigator.geolocation.getCurrentPosition(
      pos => resolve({ 
        lat: pos.coords.latitude, 
        lon: pos.coords.longitude,
        accuracy: pos.coords.accuracy 
      }),
      err => {
        console.error('Geolocation error:', err);
        reject(err);
      },
      { 
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 300000
      }
    );
  }); 