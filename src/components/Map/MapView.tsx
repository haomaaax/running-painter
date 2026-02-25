import { useEffect, useState } from 'react';
import { APIProvider, Map, Marker, useMap } from '@vis.gl/react-google-maps';
import { useRouteStore } from '../../store/routeStore';
import { useGeolocation } from '../../hooks/useGeolocation';
import RoutePreview from './RoutePreview';
import { getGeoBounds } from '../../lib/utils/geometry';

const API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || '';

function MapContent() {
  const map = useMap();
  const userLocation = useRouteStore((state) => state.userLocation);
  const selectedCenter = useRouteStore((state) => state.selectedCenter);
  const setSelectedCenter = useRouteStore((state) => state.setSelectedCenter);
  const setLocationMode = useRouteStore((state) => state.setLocationMode);
  const geoPath = useRouteStore((state) => state.geoPath);
  const snappedRoute = useRouteStore((state) => state.snappedRoute);

  // Add map click handler for location selection
  useEffect(() => {
    if (!map) return;

    const clickListener = map.addListener('click', (e: google.maps.MapMouseEvent) => {
      if (e.latLng) {
        setSelectedCenter({
          lat: e.latLng.lat(),
          lng: e.latLng.lng(),
        });
        setLocationMode('manual');
      }
    });

    return () => {
      google.maps.event.removeListener(clickListener);
    };
  }, [map, setSelectedCenter, setLocationMode]);

  // Auto-zoom to fit route when path changes
  useEffect(() => {
    // Use snapped route if available, otherwise geoPath
    const routeToFit = snappedRoute && snappedRoute.length > 0 ? snappedRoute : geoPath;

    if (!map || !routeToFit || routeToFit.length === 0) {
      return;
    }

    try {
      // Include route center in bounds calculation
      const routeCenter = selectedCenter || userLocation;
      const allPoints = routeCenter ? [routeCenter, ...routeToFit] : routeToFit;
      const bounds = getGeoBounds(allPoints);

      // Create Google Maps LatLngBounds
      const googleBounds = new google.maps.LatLngBounds(
        { lat: bounds.south, lng: bounds.west },
        { lat: bounds.north, lng: bounds.east }
      );

      // Fit map to bounds with padding
      map.fitBounds(googleBounds, {
        top: 50,
        right: 50,
        bottom: 50,
        left: 50,
      });
    } catch (error) {
      console.error('Error fitting bounds:', error);
    }
  }, [map, geoPath, snappedRoute, userLocation, selectedCenter]);

  return (
    <>
      {userLocation && (
        <Marker
          position={userLocation}
          title="Your GPS Location"
          icon={{
            path: google.maps.SymbolPath.CIRCLE,
            scale: 8,
            fillColor: '#4285F4',
            fillOpacity: 0.8,
            strokeColor: '#ffffff',
            strokeWeight: 2,
          }}
        />
      )}
      {selectedCenter && (
        <Marker
          position={selectedCenter}
          title="Route Center (Selected)"
          label={{
            text: '📍',
            fontSize: '24px',
          }}
        />
      )}
      <RoutePreview />
    </>
  );
}

function MapView() {
  const { loading, error } = useGeolocation(true); // GPS enabled by default
  const userLocation = useRouteStore((state) => state.userLocation);
  const selectedCenter = useRouteStore((state) => state.selectedCenter);

  // Default to Taipei if no location available
  const DEFAULT_CENTER = { lat: 25.0330, lng: 121.5654 }; // Taipei, Taiwan
  const [mapCenter] = useState<{ lat: number; lng: number }>(DEFAULT_CENTER);

  // Note: GPS loading/error no longer blocks the map from showing

  if (!API_KEY) {
    return (
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100%',
        padding: '20px',
        textAlign: 'center'
      }}>
        <div>
          <h2>Google Maps API Key Required</h2>
          <p style={{ marginTop: '10px', color: '#666' }}>
            Please create a <code>.env</code> file in the project root with:
          </p>
          <pre style={{
            marginTop: '10px',
            padding: '10px',
            backgroundColor: '#f0f0f0',
            borderRadius: '4px',
            textAlign: 'left'
          }}>
            VITE_GOOGLE_MAPS_API_KEY=your_api_key_here
          </pre>
          <p style={{ marginTop: '10px', fontSize: '0.9em', color: '#666' }}>
            See the project specification for instructions on getting an API key.
          </p>
        </div>
      </div>
    );
  }

  // GPS loading/error no longer blocks map - show map with default center
  // Display GPS status in corner if needed
  const gpsStatus = loading ? '📍 Getting location...' : error ? '⚠️ GPS unavailable - click map to select location' : null;

  return (
    <APIProvider apiKey={API_KEY}>
      <div style={{ position: 'relative', width: '100%', height: '100%' }}>
        {gpsStatus && (
          <div style={{
            position: 'absolute',
            top: '10px',
            left: '50%',
            transform: 'translateX(-50%)',
            zIndex: 1000,
            backgroundColor: 'rgba(255, 255, 255, 0.95)',
            padding: '8px 16px',
            borderRadius: '20px',
            boxShadow: '0 2px 6px rgba(0,0,0,0.2)',
            fontSize: '14px',
            fontWeight: '500',
          }}>
            {gpsStatus}
          </div>
        )}
        <Map
          style={{ width: '100%', height: '100%' }}
          defaultCenter={userLocation || selectedCenter || mapCenter}
          defaultZoom={14}
          gestureHandling="greedy"
          disableDefaultUI={false}
          mapId="running-painter-map"
        >
          <MapContent />
        </Map>
      </div>
    </APIProvider>
  );
}

export default MapView;
