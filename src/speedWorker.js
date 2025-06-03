// Web Worker for background speed testing
self.onmessage = async (e) => {
  const { interval } = e.data;
  
  const testSpeed = async () => {
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

  const runTest = async () => {
    const speed = await testSpeed();
    self.postMessage({ type: 'speedResult', speed });
  };

  // Run initial test
  await runTest();

  // Set up interval for continuous testing
  setInterval(runTest, interval * 60 * 1000);
};