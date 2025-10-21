import { map } from './MapView';

// List of default marker icons to preload
const DEFAULT_MARKER_ICONS = [
  'default-green',
  'default-green-add',
  'default-green-check',
  'default-green-cross',
  'default-green-dot',
  'default-green-exclamation',
  'default-green-minus',
  'default-green-question',
  'default-green-star',
  'default-green-plus',
  'default-green-arrow',
  'default-green-h',
  'default-green-a',
  'default-green-0',
  'default-red',
  'default-blue',
  'default-yellow',
  'default-orange',
  'default-purple',
  'default-pink',
];

// Places marker icons to preload
const PLACES_MARKER_ICONS = [
  'pin-1', 'pin-2', 'pin-3', 'pin-4', 'pin-5',
  'pin-6', 'pin-7', 'pin-8', 'pin-9', 'pin-10',
  'pin-11', 'pin-12', 'pin-13', 'pin-14', 'pin-15',
  'pin-16', 'pin-17', 'pin-18', 'pin-19', 'pin-20',
  'pin-21', 'pin-22', 'pin-23', 'pin-24', 'pin-25',
  'pin-26', 'pin-27', 'pin-28', 'pin-29', 'pin-30',
];

export const preloadMarkerIcons = async () => {
  console.log('[preloadMarkerIcons] Starting to load icons...');
  
  // Load default markers
  const defaultPromises = DEFAULT_MARKER_ICONS.map(async (iconName) => {
    try {
      const response = await fetch(`/img/markers/${iconName}.svg`);
      if (response.ok) {
        const blob = await response.blob();
        const imageUrl = URL.createObjectURL(blob);
        
        return new Promise((resolve, reject) => {
          const img = new Image();
          img.onload = () => {
            if (map.hasImage(iconName)) {
              map.updateImage(iconName, img);
            } else {
              map.addImage(iconName, img, { sdf: false });
            }
            console.log(`[preloadMarkerIcons] Loaded default icon: ${iconName}`);
            URL.revokeObjectURL(imageUrl);
            resolve();
          };
          img.onerror = () => {
            console.warn(`Failed to load marker icon: ${iconName}`);
            URL.revokeObjectURL(imageUrl);
            reject();
          };
          img.src = imageUrl;
        });
      }
    } catch (error) {
      console.warn(`Error loading marker icon ${iconName}:`, error);
    }
  });
  
  // Load places markers
  const placesPromises = PLACES_MARKER_ICONS.map(async (iconName) => {
    try {
      const response = await fetch(`/img/markers/places/${iconName}.svg`);
      if (response.ok) {
        const blob = await response.blob();
        const imageUrl = URL.createObjectURL(blob);
        
        return new Promise((resolve, reject) => {
          const img = new Image();
          img.onload = () => {
            if (map.hasImage(iconName)) {
              map.updateImage(iconName, img);
            } else {
              map.addImage(iconName, img, { sdf: false });
            }
            console.log(`[preloadMarkerIcons] Loaded places icon: ${iconName}`);
            URL.revokeObjectURL(imageUrl);
            resolve();
          };
          img.onerror = () => {
            console.warn(`Failed to load places icon: ${iconName}`);
            URL.revokeObjectURL(imageUrl);
            reject();
          };
          img.src = imageUrl;
        });
      }
    } catch (error) {
      console.warn(`Error loading places icon ${iconName}:`, error);
    }
  });

  await Promise.allSettled([...defaultPromises, ...placesPromises]);
  console.log('[preloadMarkerIcons] Finished loading icons');
};

// Function to dynamically load a marker icon if not already loaded
export const loadMarkerIcon = async (iconName) => {
  if (!iconName || map.hasImage(iconName)) {
    console.log(`[loadMarkerIcon] Icon ${iconName} already loaded or invalid`);
    return;
  }

  console.log(`[loadMarkerIcon] Loading icon: ${iconName}`);

  // Try loading from markers/places folder first, then markers folder
  try {
    let response = await fetch(`/img/markers/places/${iconName}.svg`);
    if (!response.ok) {
      console.log(`[loadMarkerIcon] Not found in places/, trying markers/`);
      // Fallback to markers folder
      response = await fetch(`/img/markers/${iconName}.svg`);
    }
    
    if (response.ok) {
      const blob = await response.blob();
      const imageUrl = URL.createObjectURL(blob);
      
      return new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = () => {
          if (!map.hasImage(iconName)) {
            map.addImage(iconName, img, { sdf: false });
            console.log(`[loadMarkerIcon] Successfully loaded: ${iconName}`);
          }
          URL.revokeObjectURL(imageUrl);
          resolve();
        };
        img.onerror = () => {
          console.warn(`Failed to load marker icon: ${iconName}`);
          URL.revokeObjectURL(imageUrl);
          reject();
        };
        img.src = imageUrl;
      });
    } else {
      console.warn(`[loadMarkerIcon] Icon not found: ${iconName}`);
    }
  } catch (error) {
    console.warn(`Error loading marker icon ${iconName}:`, error);
  }
};
