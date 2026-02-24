import { Point2D, LatLng } from '../../types/route';
import { getBounds } from '../vectorization/normalizer';
import { calculatePathLength } from '../vectorization/normalizer';
import { metersToLatLngOffset, addOffset } from '../utils/coordinates';

export interface PathToGeoOptions {
  targetDistance?: number; // Target distance in meters
  rotation?: number; // Rotation in degrees
  scale?: number; // Manual scale override
}

/**
 * Convert normalized path (0-1 coordinates) to geographic coordinates
 *
 * Algorithm:
 * 1. Calculate the ideal size based on target distance
 * 2. Convert normalized coordinates to meters
 * 3. Center the path around the user's location
 * 4. Convert meter offsets to lat/lng
 *
 * @param normalizedPath - Path in 0-1 coordinate space
 * @param center - Center point (user's location)
 * @param options - Conversion options
 * @returns Array of geographic coordinates
 */
export function pathToGeo(
  normalizedPath: Point2D[],
  center: LatLng,
  options: PathToGeoOptions = {}
): LatLng[] {
  if (normalizedPath.length === 0) {
    return [];
  }

  const { targetDistance = 10000, rotation = 0, scale } = options;

  // 1. Calculate the path's approximate perimeter in normalized space
  const normalizedLength = calculatePathLength(normalizedPath);

  if (normalizedLength === 0) {
    // Single point or all points are the same
    return [center];
  }

  // 2. Determine scale factor
  // We want the path length to approximately match targetDistance
  // Since normalized path is 0-1, we scale it to meters
  let scaleFactor: number;

  if (scale !== undefined) {
    scaleFactor = scale;
  } else {
    // Calculate scale based on target distance
    // We use a conservative multiplier to account for the fact that
    // the path might not be a perfect line
    scaleFactor = targetDistance / normalizedLength;
  }

  // 3. Get bounds of normalized path
  const bounds = getBounds(normalizedPath);

  // 4. Convert each point
  const geoPath: LatLng[] = normalizedPath.map(point => {
    // Center the point (so path is centered around 0,0)
    let x = point.x - bounds.centerX;
    let y = point.y - bounds.centerY;

    // Apply rotation if specified
    if (rotation !== 0) {
      const rad = (rotation * Math.PI) / 180;
      const cos = Math.cos(rad);
      const sin = Math.sin(rad);
      const rotatedX = x * cos - y * sin;
      const rotatedY = x * sin + y * cos;
      x = rotatedX;
      y = rotatedY;
    }

    // Scale to meters
    const offsetMeters: Point2D = {
      x: x * scaleFactor,
      y: y * scaleFactor,
    };

    // Convert to lat/lng offset
    const offsetDegrees = metersToLatLngOffset(center, offsetMeters);

    // Add to center point
    return addOffset(center, offsetDegrees);
  });

  return geoPath;
}

/**
 * Calculate the scale factor needed to achieve a target distance
 * @param normalizedPath - Path in 0-1 space
 * @param targetDistance - Desired distance in meters
 * @returns Scale factor
 */
export function calculateScaleFactor(
  normalizedPath: Point2D[],
  targetDistance: number
): number {
  const normalizedLength = calculatePathLength(normalizedPath);

  if (normalizedLength === 0) {
    return targetDistance;
  }

  return targetDistance / normalizedLength;
}

/**
 * Get recommended rotation to optimize path orientation
 * (e.g., align with north-south or east-west)
 * @param normalizedPath - Path in 0-1 space
 * @returns Recommended rotation in degrees
 */
export function getRecommendedRotation(normalizedPath: Point2D[]): number {
  if (normalizedPath.length < 2) {
    return 0;
  }

  const bounds = getBounds(normalizedPath);

  // If width > height, rotate 90 degrees to make it vertical
  // This often looks better on maps
  if (bounds.width > bounds.height * 1.5) {
    return 90;
  }

  return 0;
}

/**
 * Calculate the approximate area covered by the path in square meters
 * @param geoPath - Geographic path
 * @param center - Center point
 * @returns Area in square meters
 */
export function calculatePathArea(geoPath: LatLng[], center: LatLng): number {
  if (geoPath.length < 3) {
    return 0;
  }

  // Use the Shoelace formula with meter conversions
  let area = 0;

  for (let i = 0; i < geoPath.length; i++) {
    const j = (i + 1) % geoPath.length;

    // Convert to meters relative to center
    const x1 = (geoPath[i].lng - center.lng) * 111320 * Math.cos((center.lat * Math.PI) / 180);
    const y1 = (geoPath[i].lat - center.lat) * 111320;
    const x2 = (geoPath[j].lng - center.lng) * 111320 * Math.cos((center.lat * Math.PI) / 180);
    const y2 = (geoPath[j].lat - center.lat) * 111320;

    area += x1 * y2 - x2 * y1;
  }

  return Math.abs(area / 2);
}
