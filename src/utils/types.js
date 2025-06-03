/**
 * @typedef {Object} SpeedTestLog
 * @property {number} lat - Latitude of the test location
 * @property {number} lon - Longitude of the test location
 * @property {number} speed - Speed in Mbps
 * @property {string} timestamp - ISO string timestamp
 * @property {number} accuracy - Accuracy of the location in meters
 * @property {boolean} isAutoTest - Whether this was an auto test
 */

/**
 * @typedef {Object} Stats
 * @property {number} total - Total number of tests
 * @property {string} avg - Average speed
 * @property {string} min - Minimum speed
 * @property {string} max - Maximum speed
 * @property {number} deadZones - Number of dead zones
 * @property {number} poorZones - Number of poor zones
 * @property {number} goodZones - Number of good zones
 * @property {number} excellentZones - Number of excellent zones
 * @property {string} trend - Speed trend
 * @property {Object} coverage - Coverage percentages
 * @property {string} coverage.dead - Dead zone percentage
 * @property {string} coverage.poor - Poor zone percentage
 * @property {string} coverage.good - Good zone percentage
 * @property {string} coverage.excellent - Excellent zone percentage
 */

/**
 * @typedef {Object} Location
 * @property {number} lat - Latitude
 * @property {number} lon - Longitude
 * @property {number} accuracy - Accuracy in meters
 */

export {}; 