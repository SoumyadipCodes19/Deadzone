export async function testDownloadSpeed() {
  const imageAddr = "https://via.placeholder.com/1000x1000.png";
  const startTime = new Date().getTime();
  const response = await fetch(imageAddr, { cache: "no-cache" });
  await response.blob();
  const endTime = new Date().getTime();
  const duration = (endTime - startTime) / 1000; // in seconds
  const bitsLoaded = 1000 * 1000 * 8; // 1MB image
  const speedMbps = (bitsLoaded / duration) / (1024 * 1024);
  return speedMbps;
}
