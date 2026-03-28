import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, ZoomControl, useMap, useMapEvents } from 'react-leaflet';
import { Link } from 'react-router-dom';
import MapGrid from './MapGrid';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

function MapController({ center, zoom }) {
  const map = useMap();
  const isInitial = React.useRef(true);
  
  React.useEffect(() => {
    if (center && map && isInitial.current) {
      map.flyTo(center, zoom, { duration: 1.2 });
      isInitial.current = false;
    }
  }, [center, zoom, map]);

  return null;
}

function MapEventsHandler({ onMapClick }) {
  useMapEvents({
    click(e) {
      if (onMapClick) onMapClick(e.latlng.lat, e.latlng.lng);
    }
  });
  return null;
}

const getCustomIcon = (category, isActive = false) => {
  const typeClass = category.toLowerCase();
  const activeClass = isActive ? 'marker-active' : '';
  
  return L.divIcon({
    className: `custom-html-icon ${activeClass}`,
    html: `<div class="marker-pin marker-${typeClass}"></div>`,
    iconSize: isActive ? [32, 32] : [24, 24],
    iconAnchor: isActive ? [16, 16] : [12, 12],
    popupAnchor: [0, -15]
  });
};

const CivicMap = ({ projects, userLocation, activeCenter, activeProject, onProjectClick, exploreMode, exploreCenter, onExplorePin, gridRadius }) => {
  const [mount, setMount] = useState(false);
  useEffect(() => setMount(true), []);

  if (!mount || !userLocation || !activeCenter) return null;

  const centerToUse = activeProject ? [activeProject.lat, activeProject.lng] : userLocation;
  const zoomLevel = activeProject ? 15 : 13;

  return (
    <div className="map-view">
      <MapContainer 
        center={userLocation} 
        zoom={13} 
        minZoom={12}
        maxZoom={18}
        zoomControl={false}
        style={{ height: '100%', width: '100%', zIndex: 1 }}
      >
        <ZoomControl position="bottomright" />
        
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
        />

        <MapGrid activeCenter={activeCenter} gridRadius={gridRadius} />
        <MapEventsHandler onMapClick={onExplorePin} />

        <MapController center={centerToUse} zoom={zoomLevel} />

        {exploreMode && exploreCenter && (
          <Marker 
            position={exploreCenter} 
            icon={L.divIcon({
              className: 'explore-pin-icon',
              html: `<div class="marker-pin marker-explore">
                       <div class="pulse-explore"></div>
                     </div>`,
              iconSize: [28, 28],
              iconAnchor: [14, 14]
            })}
          >
            <Popup><strong>Explore Here</strong></Popup>
          </Marker>
        )}

        <Marker 
          position={userLocation} 
          icon={L.divIcon({
            className: 'user-location-icon',
            html: `<div class="user-position-wrapper">
                     <div class="user-position-pulse"></div>
                     <div class="user-position-arrow">
                       <svg viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
                         <path d="M12 2L22 20L12 17L2 20L12 2Z" />
                       </svg>
                     </div>
                   </div>`,
            iconSize: [36, 36],
            iconAnchor: [18, 18]
          })}
        >
          <Popup><strong>You are here</strong></Popup>
        </Marker>

        {projects.map(project => (
          <Marker 
            key={project.id} 
            position={[project.lat, project.lng]}
            icon={getCustomIcon(project.category, activeProject?.id === project.id)}
            eventHandlers={{ 
              click: () => onProjectClick && onProjectClick(project) 
            }}
          >
            <Popup className="custom-popup">
              <div className="popup-content">
                <span className={`popup-badge badge-${project.category.toLowerCase()}`}>
                  {project.category}
                </span>
                <h3>{project.name}</h3>
                <p className="short-desc">{project.description}</p>
                <div className={`status-badge status-${project.status.toLowerCase()}`}>
                  {project.status}
                </div>
                <Link to={`/project/${project.id}`} className="view-details-btn">
                  View Details
                </Link>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
};

export default CivicMap;
