import { LatLng } from '../../types/route';

export interface DirectionsRequest {
  origin: LatLng;
  destination: LatLng;
  waypoints?: LatLng[];
  travelMode?: 'WALKING' | 'BICYCLING';
}

export interface DirectionsResult {
  path: LatLng[];
  distance: number; // meters
  duration: number; // seconds
}

/**
 * Decode Google Maps polyline encoding
 * Based on: https://developers.google.com/maps/documentation/utilities/polylinealgorithm
 */
function decodePolyline(encoded: string): LatLng[] {
  const points: LatLng[] = [];
  let index = 0;
  let lat = 0;
  let lng = 0;

  while (index < encoded.length) {
    let b;
    let shift = 0;
    let result = 0;

    do {
      b = encoded.charCodeAt(index++) - 63;
      result |= (b & 0x1f) << shift;
      shift += 5;
    } while (b >= 0x20);

    const dlat = (result & 1) !== 0 ? ~(result >> 1) : result >> 1;
    lat += dlat;

    shift = 0;
    result = 0;

    do {
      b = encoded.charCodeAt(index++) - 63;
      result |= (b & 0x1f) << shift;
      shift += 5;
    } while (b >= 0x20);

    const dlng = (result & 1) !== 0 ? ~(result >> 1) : result >> 1;
    lng += dlng;

    points.push({
      lat: lat / 1e5,
      lng: lng / 1e5,
    });
  }

  return points;
}

/**
 * Get walking directions from Google Directions API
 * Uses the google.maps.DirectionsService which must be loaded via Maps JavaScript API
 */
export async function getDirections(
  request: DirectionsRequest
): Promise<DirectionsResult> {
  return new Promise((resolve, reject) => {
    // Check if Google Maps API is loaded
    if (typeof google === 'undefined' || !google.maps) {
      reject(new Error('Google Maps API not loaded'));
      return;
    }

    const directionsService = new google.maps.DirectionsService();

    const waypoints = request.waypoints?.map(point => ({
      location: new google.maps.LatLng(point.lat, point.lng),
      stopover: false, // Don't require stopping at waypoints
    }));

    const directionsRequest: google.maps.DirectionsRequest = {
      origin: new google.maps.LatLng(request.origin.lat, request.origin.lng),
      destination: new google.maps.LatLng(request.destination.lat, request.destination.lng),
      waypoints: waypoints,
      travelMode: google.maps.TravelMode[request.travelMode || 'WALKING'],
      optimizeWaypoints: false, // Keep waypoints in order to preserve shape
    };

    directionsService.route(directionsRequest, (result, status) => {
      if (status === google.maps.DirectionsStatus.OK && result) {
        try {
          const route = result.routes[0];
          const path: LatLng[] = [];
          let totalDistance = 0;
          let totalDuration = 0;

          // Extract all points from all legs
          for (const leg of route.legs) {
            totalDistance += leg.distance?.value || 0;
            totalDuration += leg.duration?.value || 0;

            for (const step of leg.steps) {
              // Decode the polyline for this step
              const encodedPath = step.polyline?.points;
              if (encodedPath) {
                const stepPoints = decodePolyline(encodedPath);
                path.push(...stepPoints);
              }
            }
          }

          resolve({
            path,
            distance: totalDistance,
            duration: totalDuration,
          });
        } catch (error) {
          reject(new Error(`Failed to parse directions result: ${error}`));
        }
      } else {
        reject(new Error(`Directions request failed: ${status}`));
      }
    });
  });
}

/**
 * Get directions with retry logic for rate limiting
 */
export async function getDirectionsWithRetry(
  request: DirectionsRequest,
  maxRetries: number = 3
): Promise<DirectionsResult> {
  let lastError: Error | null = null;

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await getDirections(request);
    } catch (error) {
      lastError = error as Error;

      // Check if it's a rate limit error
      if (lastError.message.includes('OVER_QUERY_LIMIT')) {
        // Wait with exponential backoff
        const waitTime = Math.pow(2, attempt) * 1000; // 1s, 2s, 4s
        console.warn(`Rate limited, retrying in ${waitTime}ms...`);
        await new Promise(resolve => setTimeout(resolve, waitTime));
        continue;
      }

      // If it's not a rate limit error, throw immediately
      throw lastError;
    }
  }

  throw lastError || new Error('Max retries exceeded');
}

/**
 * Batch directions requests with delay to avoid rate limiting
 * Returns results in the same order as requests
 */
export async function batchDirections(
  requests: DirectionsRequest[],
  delayMs: number = 500
): Promise<DirectionsResult[]> {
  const results: DirectionsResult[] = [];

  for (let i = 0; i < requests.length; i++) {
    try {
      const result = await getDirectionsWithRetry(requests[i]);
      results.push(result);

      // Add delay between requests (except for last one)
      if (i < requests.length - 1) {
        await new Promise(resolve => setTimeout(resolve, delayMs));
      }
    } catch (error) {
      console.error(`Batch request ${i} failed:`, error);
      throw error;
    }
  }

  return results;
}
