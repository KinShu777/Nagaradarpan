import React, { createContext, useState, useEffect } from 'react';

export const ProjectContext = createContext();

const FALLBACK_CENTER = [28.6139, 77.2090]; // Delhi

// -------------------------------------------------------------------
// DYNAMIC MOCK DATA GENERATION ENGINE
// -------------------------------------------------------------------

const fetchAreaName = async (lat, lng) => {
  try {
    const res = await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json`);
    const data = await res.json();
    if (data && data.address) {
      return data.address.suburb || data.address.neighbourhood || data.address.city || data.address.county || data.address.state || "Local District";
    }
  } catch (err) {
    console.warn("Reverse geocoding unavailable", err);
  }
  return "Civic Zone";
};

const PROJECT_TYPES = ["Roads", "Hospitals", "Bridges", "Schools", "Drainage"];
const AUTHORITIES = ["PWD", "Municipal Corp", "NHAI", "Ministry of Health", "DDA"];
const STATUSES = ["Ongoing", "Ongoing", "Completed", "Delayed"]; // Weighted for realistic distribution

const getRandomInt = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
const getRandomItem = (arr) => arr[Math.floor(Math.random() * arr.length)];
const getRandomDate = (start, end) => new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime())).toISOString().split('T')[0];

const generateProjectName = (category, areaName) => {
  const roadSuffixes = ["Road Upgrade", "Redevelopment Phase 2", "Expressway Expansion", "Resurfacing"];
  const hospSuffixes = ["General Hospital", "Health Center", "Clinic Extension"];
  const bridgeSuffixes = ["Overpass", "Suspension Bridge", "Elevated Walkway"];
  const schoolSuffixes = ["Primary School Renovation", "Smart Classrooms", "Secondary Academy"];
  const drainSuffixes = ["Drainage Fix", "Storm Water Drain", "Sewage Treatment"];

  if (category === "Roads") return `${areaName} ${getRandomItem(roadSuffixes)}`;
  if (category === "Hospitals") return `${areaName} ${getRandomItem(hospSuffixes)}`;
  if (category === "Bridges") return `${areaName} ${getRandomItem(bridgeSuffixes)}`;
  if (category === "Schools") return `${areaName} ${getRandomItem(schoolSuffixes)}`;
  if (category === "Drainage") return `${areaName} ${getRandomItem(drainSuffixes)}`;
  return `${areaName} Infrastructure Work`;
};

// Async Generator wrapping intelligent geocoding strings
export const generateDynamicProjects = async (centerLat, centerLng, radius = 1) => {
  const areaName = await fetchAreaName(centerLat, centerLng);
  // Scale the project count exponentially to the grid coverage area
  const numProjects = getRandomInt(6 * radius, 12 * radius * 1.2);
  const projects = [];

  const spread = radius * 0.02; // Roughly 2km per radius scale

  for (let i = 0; i < numProjects; i++) {
    const category = getRandomItem(PROJECT_TYPES);
    // Generate cluster offsets within the active block radius
    const latOffset = (Math.random() * (spread * 2)) - spread; 
    const lngOffset = (Math.random() * (spread * 2)) - spread; 
    
    projects.push({
      id: `dyn_${Date.now()}_${i}`,
      name: generateProjectName(category, areaName),
      category: category,
      authority: getRandomItem(AUTHORITIES),
      startDate: getRandomDate(new Date(2022, 0, 1), new Date()),
      endDate: getRandomDate(new Date(), new Date(2026, 11, 31)),
      description: `Comprehensive ${category.toLowerCase()} development assigned to improve local infrastructure efficiency across ${areaName}.`,
      status: getRandomItem(STATUSES),
      progress: getRandomInt(20, 100),
      budget: getRandomInt(5, 500),
      blockId: `B-${Math.abs(Math.floor((centerLat + latOffset) * 100))}-${Math.abs(Math.floor((centerLng + lngOffset) * 100))}`,
      lat: centerLat + latOffset,
      lng: centerLng + lngOffset
    });
  }
  return projects;
};

// -------------------------------------------------------------------
// CONTEXT PROVIDER LAYER
// -------------------------------------------------------------------

export const ProjectProvider = ({ children }) => {
  const [userLocation, setUserLocation] = useState(null);
  const [isDefaultLocation, setIsDefaultLocation] = useState(false);
  const [projectsData, setProjectsData] = useState([]);
  const [isLocating, setIsLocating] = useState(true);

  // New states for Advanced Grid and Exploration
  const [gridRadius, setGridRadius] = useState(1);
  const [exploreMode, setExploreMode] = useState(false);
  const [exploreCenter, setExploreCenter] = useState(null);

  // Load custom projects securely from localStorage
  const sanitizeProjects = (projectsArr) => {
    if (!Array.isArray(projectsArr)) return [];
    return projectsArr.map(p => ({
      ...p,
      category: p.category || p.type || 'Roads',
      endDate: p.endDate || p.expectedCompletion || '2024-12-31',
      status: p.status || 'Ongoing',
      name: p.name || 'Unnamed Project'
    }));
  };

  const [customProjects, setCustomProjects] = useState(() => {
    try {
      const stored = localStorage.getItem('projects');
      return stored ? sanitizeProjects(JSON.parse(stored)) : null;
    } catch {
      return null;
    }
  });

  useEffect(() => {
    const handleStorageChange = (e) => {
      if (e.key === 'projects') {
        try {
          const newData = e.newValue ? sanitizeProjects(JSON.parse(e.newValue)) : null;
          setCustomProjects(newData);
        } catch (err) {
          console.error("Storage sync parse error", err);
        }
      }
    };
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  const addCustomProject = (project) => {
    const existing = customProjects || [];
    const updated = [project, ...existing];
    setCustomProjects(updated);
    localStorage.setItem('projects', JSON.stringify(updated));
  };

  const deleteCustomProject = (id) => {
    const existing = customProjects || [];
    const updated = existing.filter(p => p.id !== id);
    setCustomProjects(updated);
    localStorage.setItem('projects', JSON.stringify(updated));
  };

  // Core trigger injecting 1sec realistic latency mapping fresh network fetches
  const fetchAndSetProjects = async (lat, lng, isDefault, radius = 1) => {
    setIsLocating(true);
    await new Promise(resolve => setTimeout(resolve, 800)); // Simulated lag
    const freshProjects = await generateDynamicProjects(lat, lng, radius);
    setProjectsData(freshProjects);
    setIsLocating(false);
  };
  
  // A wrapper for manual location fetch
  const triggerLocationUpdate = async (lat, lng, isDefault) => {
    setUserLocation([lat, lng]);
    setIsDefaultLocation(isDefault);
    setExploreMode(false);
    setExploreCenter(null);
    await fetchAndSetProjects(lat, lng, isDefault, gridRadius);
  };
  
  const handleExplorePin = async (lat, lng) => {
    if (!exploreMode) return;
    setExploreCenter([lat, lng]);
    await fetchAndSetProjects(lat, lng, false, gridRadius);
  };

  const fetchLocation = () => {
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          triggerLocationUpdate(position.coords.latitude, position.coords.longitude, false);
        },
        (error) => {
          console.warn("Location permission denied. Fallback to Delhi.");
          triggerLocationUpdate(FALLBACK_CENTER[0], FALLBACK_CENTER[1], true);
        },
        { timeout: 10000 }
      );
    } else {
      triggerLocationUpdate(FALLBACK_CENTER[0], FALLBACK_CENTER[1], true);
    }
  };
  
  // React to grid size changes automatically
  useEffect(() => {
    if (userLocation) {
      const activeLat = exploreMode && exploreCenter ? exploreCenter[0] : userLocation[0];
      const activeLng = exploreMode && exploreCenter ? exploreCenter[1] : userLocation[1];
      fetchAndSetProjects(activeLat, activeLng, isDefaultLocation, gridRadius);
    }
  }, [gridRadius, exploreMode]);

  // Continuous background tracking hook
  useEffect(() => {
    let watchId;
    let lastLat = null;
    let lastLng = null;

    if ("geolocation" in navigator) {
      watchId = navigator.geolocation.watchPosition(
        async (position) => {
          const lat = position.coords.latitude;
          const lng = position.coords.longitude;
          
          // Regenerate strictly if displacement crosses 0.01 threshold (approx 1.1km)
          if (!lastLat || Math.abs(lat - lastLat) > 0.01 || Math.abs(lng - lastLng) > 0.01) {
            lastLat = lat;
            lastLng = lng;
            await fetchAndSetProjects(lat, lng, false);
          } else {
            // Minor continuous movement > Just update raw coordinate states silently
            setUserLocation([lat, lng]); 
          }
        },
        async (error) => {
          console.warn("Watch tracking denied/unavailable.", error);
          if (!lastLat) { // Only override if we absolutely lack any initialization data
             lastLat = FALLBACK_CENTER[0];
             lastLng = FALLBACK_CENTER[1];
             await fetchAndSetProjects(lastLat, lastLng, true);
          }
        },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
      );
    } else {
      fetchAndSetProjects(FALLBACK_CENTER[0], FALLBACK_CENTER[1], true);
    }

    return () => {
      if (watchId) navigator.geolocation.clearWatch(watchId);
    };
  }, []);

  // Merge so the user always sees their custom deployments overlaid on top of the generic municipal network
  const activeProjectsList = [...(customProjects || []), ...projectsData];

  return (
    <ProjectContext.Provider value={{
      userLocation,
      isDefaultLocation,
      projectsData: activeProjectsList,
      customProjects: customProjects || [],
      addCustomProject,
      deleteCustomProject,
      isLocating,
      fetchLocation,
      gridRadius, setGridRadius,
      exploreMode, setExploreMode,
      exploreCenter, setExploreCenter,
      handleExplorePin
    }}>
      {children}
    </ProjectContext.Provider>
  );
};
