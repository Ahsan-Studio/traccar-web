import { map } from './MapView';

// Places marker icons to preload (these exist in /img/markers/places/)
const PLACES_MARKER_ICONS = [
  'pin-1', 'pin-2', 'pin-3', 'pin-4', 'pin-5',
  'pin-6', 'pin-7', 'pin-8', 'pin-9', 'pin-10',
  'pin-11', 'pin-12', 'pin-13', 'pin-14', 'pin-15',
  'pin-16', 'pin-17', 'pin-18', 'pin-19', 'pin-20',
  'pin-21', 'pin-22', 'pin-23', 'pin-24', 'pin-25',
  'pin-26', 'pin-27', 'pin-28', 'pin-29', 'pin-30',
];

// Route marker icons to preload
const ROUTE_MARKER_ICONS = [
  'route-start',
  'route-end',
  'route-stop',
  'route-event',
];

export const preloadMarkerIcons = async () => {
  
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

  // Load route markers
  const routePromises = ROUTE_MARKER_ICONS.map(async (iconName) => {
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
            URL.revokeObjectURL(imageUrl);
            resolve();
          };
          img.onerror = () => {
            console.warn(`Failed to load route icon: ${iconName}`);
            URL.revokeObjectURL(imageUrl);
            reject();
          };
          img.src = imageUrl;
        });
      }
    } catch (error) {
      console.warn(`Error loading route icon ${iconName}:`, error);
    }
  });

  await Promise.allSettled([...placesPromises, ...routePromises]);
};

// Function to dynamically load a marker icon if not already loaded
export const loadMarkerIcon = async (iconName) => {
  if (!iconName || map.hasImage(iconName)) {
    return;
  }

  // Try loading from markers/places folder first, then markers folder
  try {
    let response = await fetch(`/img/markers/places/${iconName}.svg`);
    if (!response.ok) {
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
