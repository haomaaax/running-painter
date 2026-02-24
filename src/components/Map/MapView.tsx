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
  const geoPath = useRouteStore((state) => state.geoPath);
  const snappedRoute = useRouteStore((state) => state.snappedRoute);

  // Auto-zoom to fit route when path changes
  useEffect(() => {
    // Use snapped route if available, otherwise geoPath
    const routeToFit = snappedRoute && snappedRoute.length > 0 ? snappedRoute : geoPath;

    if (!map || !routeToFit || routeToFit.length === 0) {
      return;
    }

    try {
      // Include user location in bounds calculation
      const allPoints = userLocation ? [userLocation, ...routeToFit] : routeToFit;
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
  }, [map, geoPath, snappedRoute, userLocation]);

  return (
    <>
      {userLocation && (
        <Marker
          position={userLocation}
          title="Your Location"
        />
      )}
      <RoutePreview />
    </>
  );
}

function MapView() {
  const { loading, error } = useGeolocation();
  const userLocation = useRouteStore((state) => state.userLocation);
  const [mapCenter, setMapCenter] = useState<{ lat: number; lng: number } | null>(null);

  useEffect(() => {
    if (userLocation && !mapCenter) {
      setMapCenter(userLocation);
    }
  }, [userLocation, mapCenter]);

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

  if (loading) {
    return (
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100%'
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{
            marginBottom: '10px',
            fontSize: '2em'
          }}>📍</div>
          <p>Getting your location...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100%',
        padding: '20px'
      }}>
        <div style={{
          textAlign: 'center',
          maxWidth: '400px',
          padding: '20px',
          backgroundColor: '#fff3cd',
          border: '1px solid #ffc107',
          borderRadius: '8px'
        }}>
          <div style={{ fontSize: '2em', marginBottom: '10px' }}>⚠️</div>
          <h3>Location Access Required</h3>
          <p style={{ marginTop: '10px', color: '#666' }}>{error}</p>
          <p style={{ marginTop: '10px', fontSize: '0.9em', color: '#666' }}>
            This app needs your location to generate running routes around your current position.
          </p>
        </div>
      </div>
    );
  }

  if (!mapCenter) {
    return (
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100%'
      }}>
        <p>Waiting for location...</p>
      </div>
    );
  }

  return (
    <APIProvider apiKey={API_KEY}>
      <Map
        style={{ width: '100%', height: '100%' }}
        defaultCenter={mapCenter}
        defaultZoom={14}
        gestureHandling="greedy"
        disableDefaultUI={false}
        mapId="running-painter-map"
      >
        <MapContent />
      </Map>
    </APIProvider>
  );
}

export default MapView;
