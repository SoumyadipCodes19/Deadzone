export const testInternetSpeed = async () => {
  try {
    const testFile = "https://speed.cloudflare.com/__down?bytes=10000000";
    const startTime = performance.now();
    
    const response = await fetch(testFile, {
      method: 'GET',
      cache: 'no-cache'
    });
    
    if (!response.ok) {
      throw new Error('Network response was not ok');
    }
    
    await response.blob();
    const endTime = performance.now();
    
    const duration = (endTime - startTime) / 1000;
    const fileSizeInBits = 10 * 1024 * 1024 * 8;
    const speedMbps = (fileSizeInBits / duration) / (1024 * 1024);
    
    return Math.max(0.1, Number(speedMbps.toFixed(2)));
  } catch (error) {
    console.error('Speed test failed:', error);
    return 0.1;
  }
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