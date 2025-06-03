// Web Worker for background speed testing
let isAutoTesting = false;
let testInterval = 10000; // Default 10 seconds

// Function to test internet speed
async function testInternetSpeed() {
  try {
    const startTime = performance.now();
    const response = await fetch('https://www.google.com/favicon.ico', { cache: 'no-store' });
    if (!response.ok) throw new Error('Network response was not ok');
    const endTime = performance.now();
    const duration = endTime - startTime;
    const speed = (response.headers.get('content-length') * 8) / (duration / 1000) / 1024 / 1024;
    return Math.min(Math.round(speed * 100) / 100, 1000); // Cap at 1000 Mbps
  } catch (error) {
    return 0; // Return 0 for failed tests
  }
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
    const position = await getCurrentPosition();
    const speed = await testInternetSpeed();
    
    const testResult = {
      latitude: position.latitude,
      longitude: position.longitude,
      speed: speed,
      timestamp: new Date().toISOString(),
      accuracy: position.accuracy,
      isAutoTest: true
    };

    // Send test result back to main thread
    self.postMessage({
      type: 'testComplete',
      data: testResult
    });

    // Schedule next test if still auto-testing
    if (isAutoTesting) {
      setTimeout(runTest, testInterval);
    }
  } catch (error) {
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