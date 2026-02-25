import { useEffect, useState } from 'react';
import { LatLng } from '../types/route';
import { useRouteStore } from '../store/routeStore';

export function useGeolocation(enabled: boolean = true) {
  const [loading, setLoading] = useState(enabled);
  const [error, setError] = useState<string | null>(null);
  const setUserLocation = useRouteStore((state) => state.setUserLocation);

  useEffect(() => {
    // If GPS is disabled, don't request it
    if (!enabled) {
      setLoading(false);
      return;
    }

    if (!navigator.geolocation) {
      setError('Geolocation is not supported by your browser');
      setLoading(false);
      return;
    }

    const successHandler = (position: GeolocationPosition) => {
      const location: LatLng = {
        lat: position.coords.latitude,
        lng: position.coords.longitude,
      };
      setUserLocation(location);
      setLoading(false);
      setError(null);
    };

    const errorHandler = (error: GeolocationPositionError) => {
      let errorMessage = 'Unable to get your location';

      switch (error.code) {
        case error.PERMISSION_DENIED:
          errorMessage = 'Location permission denied. Please enable location access to use this app.';
          break;
        case error.POSITION_UNAVAILABLE:
          errorMessage = 'Location information is unavailable.';
          break;
        case error.TIMEOUT:
          errorMessage = 'Location request timed out.';
          break;
      }

      setError(errorMessage);
      setLoading(false);
    };

    // Get initial position
    navigator.geolocation.getCurrentPosition(successHandler, errorHandler, {
      enableHighAccuracy: true,
      timeout: 10000,
      maximumAge: 0,
    });

    // Watch position for updates
    const watchId = navigator.geolocation.watchPosition(
      successHandler,
      errorHandler,
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 30000,
      }
    );

    return () => {
      navigator.geolocation.clearWatch(watchId);
    };
  }, [enabled, setUserLocation]);

  return { loading, error };
}
