export const LAT_STEP = 0.009; // roughly 1km
export const LNG_STEP = 0.01;

export const getBlockIndices = (lat, lng) => {
  return [Math.floor(lat / LAT_STEP), Math.floor(lng / LNG_STEP)];
};

export const getBlockBounds = (lat, lng) => {
  const [latIdx, lngIdx] = getBlockIndices(lat, lng);
  const minLat = latIdx * LAT_STEP;
  const maxLat = (latIdx + 1) * LAT_STEP;
  const minLng = lngIdx * LNG_STEP;
  const maxLng = (lngIdx + 1) * LNG_STEP;
  return [[minLat, minLng], [maxLat, maxLng]];
};

export const getBlockCenter = (lat, lng) => {
  const [[minLat, minLng], [maxLat, maxLng]] = getBlockBounds(lat, lng);
  return [(minLat + maxLat) / 2, (minLng + maxLng) / 2];
};

export const getBlockId = (lat, lng) => {
  const [latIdx, lngIdx] = getBlockIndices(lat, lng);
  return `B-${Math.abs(latIdx)}-${Math.abs(lngIdx)}`;
};

export const getActiveGridBounds = (centerLat, centerLng) => {
  const [cLatIdx, cLngIdx] = getBlockIndices(centerLat, centerLng);
  
  const minLat = (cLatIdx - 1) * LAT_STEP;
  const maxLat = (cLatIdx + 2) * LAT_STEP; 
  const minLng = (cLngIdx - 1) * LNG_STEP;
  const maxLng = (cLngIdx + 2) * LNG_STEP;

  return { minLat, maxLat, minLng, maxLng };
};

export const isProjectInActiveGrid = (lat, lng, centerLat, centerLng, radius = 1) => {
  const [pLatIdx, pLngIdx] = getBlockIndices(lat, lng);
  const [cLatIdx, cLngIdx] = getBlockIndices(centerLat, centerLng);

  return Math.abs(pLatIdx - cLatIdx) <= radius && Math.abs(pLngIdx - cLngIdx) <= radius;
};

export const generateVisibleGridRectangles = (centerLat, centerLng, radius = 1) => {
  const [cLatIdx, cLngIdx] = getBlockIndices(centerLat, centerLng);
  const rectangles = [];
  
  // Grid array to cover the viewport seamlessly
  // For larger radius, we might need a larger grid, but -7 to 7 covers 15x15 which is enough for radius=3 (7x7) + padding
  for (let latOffset = -7; latOffset <= 7; latOffset++) {
    for (let lngOffset = -7; lngOffset <= 7; lngOffset++) {
      const latGridIdx = cLatIdx + latOffset;
      const lngGridIdx = cLngIdx + lngOffset;
      
      const minLat = latGridIdx * LAT_STEP;
      const maxLat = (latGridIdx + 1) * LAT_STEP;
      const minLng = lngGridIdx * LNG_STEP;
      const maxLng = (lngGridIdx + 1) * LNG_STEP;
      
      rectangles.push({
        id: `grid-${latGridIdx}-${lngGridIdx}`,
        bounds: [[minLat, minLng], [maxLat, maxLng]],
        isActive: Math.abs(latOffset) <= radius && Math.abs(lngOffset) <= radius 
      });
    }
  }
  return rectangles;
};
