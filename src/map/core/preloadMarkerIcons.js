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

export const preloadMarkerIcons = async () => {
  const loadPromises = DEFAULT_MARKER_ICONS.map(async (iconName) => {
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

  await Promise.allSettled(loadPromises);
};

// Function to dynamically load a marker icon if not already loaded
export const loadMarkerIcon = async (iconName) => {
  if (!iconName || map.hasImage(iconName)) {
    return;
  }

  try {
    const response = await fetch(`/img/markers/${iconName}.svg`);
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
    }
  } catch (error) {
    console.warn(`Error loading marker icon ${iconName}:`, error);
  }
};
