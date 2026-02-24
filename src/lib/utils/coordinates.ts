import { Point2D, LatLng } from '../../types/route';
import { metersPerDegreeLat, metersPerDegreeLng } from './distance';

/**
 * Convert offset in meters to lat/lng offset
 * @param center - Center point
 * @param offsetMeters - Offset in meters {x: east-west, y: north-south}
 * @returns Offset in degrees
 */
export function metersToLatLngOffset(
  center: LatLng,
  offsetMeters: Point2D
): Point2D {
  const latOffset = offsetMeters.y / metersPerDegreeLat();
  const lngOffset = offsetMeters.x / metersPerDegreeLng(center.lat);

  return {
    x: lngOffset,
    y: latOffset,
  };
}

/**
 * Convert lat/lng offset to meters
 * @param center - Center point
 * @param offsetDegrees - Offset in degrees
 * @returns Offset in meters {x: east-west, y: north-south}
 */
export function latLngOffsetToMeters(
  center: LatLng,
  offsetDegrees: Point2D
): Point2D {
  const metersY = offsetDegrees.y * metersPerDegreeLat();
  const metersX = offsetDegrees.x * metersPerDegreeLng(center.lat);

  return {
    x: metersX,
    y: metersY,
  };
}

/**
 * Add offset to a lat/lng point
 */
export function addOffset(point: LatLng, offset: Point2D): LatLng {
  return {
    lat: point.lat + offset.y,
    lng: point.lng + offset.x,
  };
}

/**
 * Clamp latitude to valid range (-90 to 90)
 */
export function clampLatitude(lat: number): number {
  return Math.max(-90, Math.min(90, lat));
}

/**
 * Normalize longitude to -180 to 180 range
 */
export function normalizeLongitude(lng: number): number {
  while (lng > 180) lng -= 360;
  while (lng < -180) lng += 360;
  return lng;
}

/**
 * Validate if a lat/lng point is valid
 */
export function isValidLatLng(point: LatLng): boolean {
  return (
    !isNaN(point.lat) &&
    !isNaN(point.lng) &&
    point.lat >= -90 &&
    point.lat <= 90 &&
    point.lng >= -180 &&
    point.lng <= 180
  );
}
