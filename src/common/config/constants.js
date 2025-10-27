/**
 * Global Configuration Constants
 * 
 * This file contains all configurable constants used throughout the application.
 * TODO: These values will be configurable by superadmin in settings.
 */

// ============================================
// EVENTS CONFIGURATION
// ============================================

/**
 * Events history period in days
 * Determines how far back to fetch events from the API
 * Minimum: 30 days (matching legacy system)
 * @type {number}
 */
export const EVENTS_HISTORY_PERIOD = 30;

/**
 * Auto-load events on tab open
 * @type {boolean}
 */
export const EVENTS_AUTO_LOAD = true;

/**
 * Events refresh interval in milliseconds
 * @type {number}
 */
export const EVENTS_REFRESH_INTERVAL = 60000; // 60 seconds


// ============================================
// MAP CONFIGURATION
// ============================================

/**
 * Default map zoom level
 * @type {number}
 */
export const DEFAULT_MAP_ZOOM = 13;

/**
 * Map follow zoom level
 * @type {number}
 */
export const FOLLOW_ZOOM_LEVEL = 15;


// ============================================
// UI CONFIGURATION
// ============================================

/**
 * Device list refresh interval in milliseconds
 * @type {number}
 */
export const DEVICE_REFRESH_INTERVAL = 30000; // 30 seconds

/**
 * Position update interval in milliseconds
 * @type {number}
 */
export const POSITION_UPDATE_INTERVAL = 5000; // 5 seconds


// ============================================
// API CONFIGURATION
// ============================================

/**
 * API request timeout in milliseconds
 * @type {number}
 */
export const API_TIMEOUT = 30000; // 30 seconds

/**
 * Maximum retry attempts for failed API requests
 * @type {number}
 */
export const MAX_RETRY_ATTEMPTS = 3;
