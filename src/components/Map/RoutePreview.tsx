import { useEffect, useRef } from 'react';
import { useMap } from '@vis.gl/react-google-maps';
import { useRouteStore } from '../../store/routeStore';
import { pathToGeo } from '../../lib/routing/pathToGeo';
import { calculatePathDistance, formatDistance } from '../../lib/utils/distance';

export default function RoutePreview() {
  const map = useMap();
  const idealPath = useRouteStore((state) => state.idealPath);
  const userLocation = useRouteStore((state) => state.userLocation);
  const targetDistance = useRouteStore((state) => state.targetDistance);
  const setGeoPath = useRouteStore((state) => state.setGeoPath);
  const geoPath = useRouteStore((state) => state.geoPath);
  const snappedRoute = useRouteStore((state) => state.snappedRoute);

  const polylinesRef = useRef<google.maps.Polyline[]>([]);
  const markersRef = useRef<google.maps.Marker[]>([]);

  // Convert ideal path to geo coordinates
  useEffect(() => {
    if (!idealPath || !userLocation) {
      setGeoPath(null);
      return;
    }

    try {
      // Convert normalized path to geographic coordinates
      const geoPath = pathToGeo(idealPath, userLocation, {
        targetDistance,
      });

      setGeoPath(geoPath);

      // Calculate actual distance for debugging
      const actualDistance = calculatePathDistance(geoPath);
      console.log('Ideal path generated:', {
        points: geoPath.length,
        targetDistance: formatDistance(targetDistance),
        actualDistance: formatDistance(actualDistance),
        ratio: (actualDistance / targetDistance).toFixed(2),
      });
    } catch (error) {
      console.error('Error converting path to geo:', error);
      setGeoPath(null);
    }
  }, [idealPath, userLocation, targetDistance, setGeoPath]);

  // Render polylines and markers on the map
  useEffect(() => {
    if (!map || !geoPath || geoPath.length === 0) {
      return;
    }

    // Clean up previous polylines and markers
    polylinesRef.current.forEach((polyline) => polyline.setMap(null));
    markersRef.current.forEach((marker) => marker.setMap(null));
    polylinesRef.current = [];
    markersRef.current = [];

    const hasSnappedRoute = snappedRoute && snappedRoute.length > 0;
    const displayPath = hasSnappedRoute ? snappedRoute : geoPath;

    // Ideal path - dashed blue line (only show if no snapped route yet)
    if (!hasSnappedRoute) {
      const idealPolyline = new google.maps.Polyline({
        path: geoPath,
        strokeColor: '#2563eb',
        strokeOpacity: 0.8,
        strokeWeight: 3,
        icons: [
          {
            icon: {
              path: 'M 0,-1 0,1',
              strokeOpacity: 1,
              scale: 3,
            },
            offset: '0',
            repeat: '20px',
          },
        ],
        map,
      });
      polylinesRef.current.push(idealPolyline);
    }

    // Snapped route - solid green line
    if (hasSnappedRoute) {
      const snappedPolyline = new google.maps.Polyline({
        path: snappedRoute,
        strokeColor: '#10b981',
        strokeOpacity: 0.9,
        strokeWeight: 4,
        map,
      });
      polylinesRef.current.push(snappedPolyline);
    }

    // Start marker - green circle
    if (displayPath.length > 0) {
      const startMarker = new google.maps.Marker({
        position: displayPath[0],
        icon: {
          path: google.maps.SymbolPath.CIRCLE,
          scale: 6,
          fillColor: '#10b981',
          fillOpacity: 1,
          strokeColor: '#ffffff',
          strokeWeight: 2,
        },
        map,
      });
      markersRef.current.push(startMarker);
    }

    // End marker - red circle
    if (displayPath.length > 1) {
      const endMarker = new google.maps.Marker({
        position: displayPath[displayPath.length - 1],
        icon: {
          path: google.maps.SymbolPath.CIRCLE,
          scale: 6,
          fillColor: '#ef4444',
          fillOpacity: 1,
          strokeColor: '#ffffff',
          strokeWeight: 2,
        },
        map,
      });
      markersRef.current.push(endMarker);
    }

    // Cleanup function
    return () => {
      polylinesRef.current.forEach((polyline) => polyline.setMap(null));
      markersRef.current.forEach((marker) => marker.setMap(null));
      polylinesRef.current = [];
      markersRef.current = [];
    };
  }, [map, geoPath, snappedRoute]);

  return null;
}
