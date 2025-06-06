// Web Worker for background speed testing
let isAutoTesting = false;
let testInterval = 10000; // Default 10 seconds

// Function to test internet speed
async function testInternetSpeed() {
  console.log('[Worker] Starting speed test...');
  const testSizes = [
    25000000,  // 25 MB
    5000000,   // 5 MB
    1000000    // 1 MB
  ];

  for (const size of testSizes) {
    try {
      console.log(`[Worker] Testing with size: ${size} bytes`);
      const startTime = performance.now();
      
      console.log('[Worker] Fetching...');
      const response = await fetch(`http://localhost:3001/speedtest?size=${size}`, {
        method: 'GET',
        cache: 'no-store'
      });
      
      if (!response.ok) {
        console.warn(`[Worker] Failed to fetch test data: ${response.status}`);
        continue;
      }
      
      console.log('[Worker] Reading response...');
      const blob = await response.blob();
      const endTime = performance.now();
      
      console.log(`[Worker] Response size: ${blob.size} bytes`);
      const duration = (endTime - startTime) / 1000; // Convert to seconds
      console.log(`[Worker] Test duration: ${duration} seconds`);
      
      const fileSizeInBits = blob.size * 8;
      const speedMbps = (fileSizeInBits / duration) / (1024 * 1024);
      console.log(`[Worker] Calculated speed: ${speedMbps} Mbps`);
      
      // Validate the result
      if (speedMbps > 0 && speedMbps < 10000) { // Reasonable range check
        console.log(`[Worker] Returning valid speed: ${Math.round(speedMbps * 100) / 100} Mbps`);
        return Math.round(speedMbps * 100) / 100; // Round to 2 decimal places
      }
      
      console.warn(`[Worker] Invalid speed result: ${speedMbps}`);
    } catch (error) {
      console.error(`[Worker] Error during speed test:`, error);
    }
  }
  
  return 0; // Return 0 for failed tests in worker context
}

// Function to get current position
async function getCurrentPosition() {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error('Geolocation is not supported'));
      return;
    }
    
    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy
        });
      },
      (error) => {
        reject(error);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0
      }
    );
  });
}

// Function to run a single test
async function runTest() {
  if (!isAutoTesting) return;

  try {
    console.log('[Worker] Starting new test...');
    const position = await getCurrentPosition();
    console.log('[Worker] Got position:', position);
    
    const speed = await testInternetSpeed();
    console.log('[Worker] Got speed:', speed);
    
    const testResult = {
      latitude: position.latitude,
      longitude: position.longitude,
      speed: speed,
      timestamp: new Date().toISOString(),
      accuracy: position.accuracy,
      isAutoTest: true
    };

    console.log('[Worker] Sending test result:', testResult);
    // Send test result back to main thread
    self.postMessage({
      type: 'testComplete',
      data: testResult
    });

    // Schedule next test if still auto-testing
    if (isAutoTesting) {
      console.log(`[Worker] Scheduling next test in ${testInterval}ms`);
      setTimeout(runTest, testInterval);
    }
  } catch (error) {
    console.error('[Worker] Test failed:', error);
    self.postMessage({
      type: 'error',
      error: error.message
    });
  }
}

// Listen for messages from main thread
self.addEventListener('message', (e) => {
  const { command, data } = e.data;

  switch (command) {
    case 'start':
      if (!isAutoTesting) {
        isAutoTesting = true;
        testInterval = data.interval || 10000;
        runTest();
      }
      break;

    case 'stop':
      isAutoTesting = false;
      break;

    case 'setInterval':
      testInterval = data.interval;
      break;
  }
}); 