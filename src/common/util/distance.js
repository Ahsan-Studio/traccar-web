/**
 * Calculate distance between two coordinates using Haversine formula
 * @param {number} lat1 - Latitude of first point
 * @param {number} lon1 - Longitude of first point
 * @param {number} lat2 - Latitude of second point
 * @param {number} lon2 - Longitude of second point
 * @returns {number} Distance in meters
 */
export const calculateDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371000; // Earth's radius in meters
  const φ1 = (lat1 * Math.PI) / 180;
  const φ2 = (lat2 * Math.PI) / 180;
  const Δφ = ((lat2 - lat1) * Math.PI) / 180;
  const Δλ = ((lon2 - lon1) * Math.PI) / 180;

  const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2)
    + Math.cos(φ1) * Math.cos(φ2)
    * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c; // Distance in meters
};

/**
 * Check if a point is inside a polygon (geofence)
 * @param {object} point - {latitude, longitude}
 * @param {array} polygon - Array of {latitude, longitude}
 * @returns {boolean} True if point is inside polygon
 */
export const isPointInPolygon = (point, polygon) => {
  let inside = false;
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const xi = polygon[i].latitude;
    const yi = polygon[i].longitude;
    const xj = polygon[j].latitude;
    const yj = polygon[j].longitude;

    const intersect = ((yi > point.longitude) !== (yj > point.longitude))
      && (point.latitude < (xj - xi) * (point.longitude - yj) / (yj - yi) + xi);
    
    if (intersect) inside = !inside;
  }
  return inside;
};

/**
 * Calculate distance from point to polygon edge
 * @param {object} point - {latitude, longitude}
 * @param {array} polygon - Array of {latitude, longitude}
 * @returns {number} Distance in meters
 */
export const distanceToPolygon = (point, polygon) => {
  let minDistance = Infinity;

  for (let i = 0; i < polygon.length; i++) {
    const vertex = polygon[i];
    const distance = calculateDistance(
      point.latitude,
      point.longitude,
      vertex.latitude,
      vertex.longitude,
    );
    
    if (distance < minDistance) {
      minDistance = distance;
    }
  }

  return minDistance;
};

/**
 * Calculate distance from point to circle geofence
 * @param {object} point - {latitude, longitude}
 * @param {object} circle - {latitude, longitude, radius}
 * @returns {number} Distance in meters (negative if inside)
 */
export const distanceToCircle = (point, circle) => {
  const distance = calculateDistance(
    point.latitude,
    point.longitude,
    circle.latitude,
    circle.longitude,
  );
  
  return distance - circle.radius; // Negative if inside, positive if outside
};

/**
 * Format distance with appropriate unit
 * @param {number} meters - Distance in meters
 * @param {string} unit - Unit preference ('km', 'mi', 'nmi')
 * @returns {string} Formatted distance string
 */
export const formatDistanceValue = (meters, unit = 'km') => {
  if (meters < 0) return '0 m'; // Inside geofence
  
  if (unit === 'mi') {
    const miles = meters / 1609.34;
    if (miles < 0.1) {
      return `${(meters * 3.28084).toFixed(0)} ft`;
    }
    return `${miles.toFixed(2)} mi`;
  }
  
  if (unit === 'nmi') {
    const nauticalMiles = meters / 1852;
    if (nauticalMiles < 0.1) {
      return `${meters.toFixed(0)} m`;
    }
    return `${nauticalMiles.toFixed(2)} nmi`;
  }
  
  // Default: km
  if (meters < 1000) {
    return `${meters.toFixed(0)} m`;
  }
  return `${(meters / 1000).toFixed(2)} km`;
};
