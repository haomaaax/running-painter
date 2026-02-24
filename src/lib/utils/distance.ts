import { LatLng } from '../../types/route';

/**
 * Earth's radius in meters
 */
const EARTH_RADIUS_METERS = 6371000;

/**
 * Calculate distance between two lat/lng points using Haversine formula
 * Returns distance in meters
 */
export function haversineDistance(point1: LatLng, point2: LatLng): number {
  const lat1Rad = toRadians(point1.lat);
  const lat2Rad = toRadians(point2.lat);
  const deltaLat = toRadians(point2.lat - point1.lat);
  const deltaLng = toRadians(point2.lng - point1.lng);

  const a =
    Math.sin(deltaLat / 2) * Math.sin(deltaLat / 2) +
    Math.cos(lat1Rad) *
      Math.cos(lat2Rad) *
      Math.sin(deltaLng / 2) *
      Math.sin(deltaLng / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return EARTH_RADIUS_METERS * c;
}

/**
 * Calculate total distance of a path (sum of segment distances)
 * Returns distance in meters
 */
export function calculatePathDistance(points: LatLng[]): number {
  if (points.length < 2) return 0;

  let totalDistance = 0;

  for (let i = 1; i < points.length; i++) {
    totalDistance += haversineDistance(points[i - 1], points[i]);
  }

  return totalDistance;
}

/**
 * Convert degrees to radians
 */
export function toRadians(degrees: number): number {
  return degrees * (Math.PI / 180);
}

/**
 * Convert radians to degrees
 */
export function toDegrees(radians: number): number {
  return radians * (180 / Math.PI);
}

/**
 * Calculate bearing (direction) from point1 to point2
 * Returns bearing in degrees (0-360, where 0 is North)
 */
export function calculateBearing(point1: LatLng, point2: LatLng): number {
  const lat1Rad = toRadians(point1.lat);
  const lat2Rad = toRadians(point2.lat);
  const deltaLng = toRadians(point2.lng - point1.lng);

  const y = Math.sin(deltaLng) * Math.cos(lat2Rad);
  const x =
    Math.cos(lat1Rad) * Math.sin(lat2Rad) -
    Math.sin(lat1Rad) * Math.cos(lat2Rad) * Math.cos(deltaLng);

  const bearingRad = Math.atan2(y, x);
  const bearingDeg = toDegrees(bearingRad);

  return (bearingDeg + 360) % 360;
}

/**
 * Calculate destination point given start point, distance, and bearing
 * @param start - Starting point
 * @param distance - Distance in meters
 * @param bearing - Bearing in degrees (0-360)
 * @returns Destination point
 */
export function calculateDestination(
  start: LatLng,
  distance: number,
  bearing: number
): LatLng {
  const bearingRad = toRadians(bearing);
  const lat1Rad = toRadians(start.lat);
  const lng1Rad = toRadians(start.lng);

  const angularDistance = distance / EARTH_RADIUS_METERS;

  const lat2Rad = Math.asin(
    Math.sin(lat1Rad) * Math.cos(angularDistance) +
      Math.cos(lat1Rad) * Math.sin(angularDistance) * Math.cos(bearingRad)
  );

  const lng2Rad =
    lng1Rad +
    Math.atan2(
      Math.sin(bearingRad) * Math.sin(angularDistance) * Math.cos(lat1Rad),
      Math.cos(angularDistance) - Math.sin(lat1Rad) * Math.sin(lat2Rad)
    );

  return {
    lat: toDegrees(lat2Rad),
    lng: toDegrees(lng2Rad),
  };
}

/**
 * Format distance for display
 * Returns string like "1.5 km" or "450 m"
 */
export function formatDistance(meters: number): string {
  if (meters >= 1000) {
    return `${(meters / 1000).toFixed(1)} km`;
  }
  return `${Math.round(meters)} m`;
}

/**
 * Calculate meters per degree latitude (approximately constant)
 * At equator: ~111,320 meters per degree
 */
export function metersPerDegreeLat(): number {
  return 111320;
}

/**
 * Calculate meters per degree longitude at given latitude
 * Varies by latitude: smaller at poles, larger at equator
 */
export function metersPerDegreeLng(latitude: number): number {
  return 111320 * Math.cos(toRadians(latitude));
}
