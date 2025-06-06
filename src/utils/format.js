/**
 * Format speed value to a readable string
 * @param {number} speed - Speed in Mbps
 * @returns {string} Formatted speed string
 */
export const formatSpeed = (speed) => {
  if (!speed && speed !== 0) return 'N/A';
  return `${speed.toFixed(2)} Mbps`;
};

/**
 * Format coordinates to a readable string
 * @param {Object} location - Location object with lat and lon
 * @returns {string} Formatted coordinates string
 */
export const formatCoordinates = (location) => {
  if (!location) return 'Unknown';
  const { lat, lon } = location;
  return `${lat.toFixed(6)}°, ${lon.toFixed(6)}°`;
};

/**
 * Format date and time to a readable string
 * @param {string|Date} timestamp - Date string or Date object
 * @returns {string} Formatted date and time string
 */
export const formatDateTime = (timestamp) => {
  if (!timestamp) return 'Unknown';
  const date = new Date(timestamp);
  return date.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: 'numeric',
    hour12: true
  });
}; 