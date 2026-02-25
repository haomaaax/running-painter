import { LatLng } from '../../types/route';
import { haversineDistance, calculateBearing } from '../utils/distance';

/**
 * Divide a path into roughly equal segments
 */
export function divideIntoSegments(
  path: LatLng[],
  numSegments: number
): LatLng[][] {
  if (path.length === 0) return [];
  if (numSegments <= 1) return [path];

  const segments: LatLng[][] = [];
  const pointsPerSegment = Math.ceil(path.length / numSegments);

  for (let i = 0; i < numSegments; i++) {
    const start = i * pointsPerSegment;
    const end = Math.min((i + 1) * pointsPerSegment + 1, path.length);

    if (start < path.length) {
      segments.push(path.slice(start, end));
    }
  }

  return segments;
}

/**
 * Extract key waypoints from a path segment
 * Selects points based on significant direction changes and distance
 *
 * CRITICAL FOR GPS ART: We must keep ALL turning points (corners)
 * to preserve shape accuracy, even if it exceeds maxPoints.
 * Only apply maxPoints limit to distance-based sampling.
 */
export function extractKeyPoints(
  path: LatLng[],
  maxPoints: number = 10,
  minAngleChange: number = 5 // degrees - reduced to catch more corners
): LatLng[] {
  if (path.length <= maxPoints) {
    return path;
  }

  const keyPoints: LatLng[] = [path[0]]; // Always include start

  let lastDirection: number | null = null;

  for (let i = 1; i < path.length - 1; i++) {
    const prevPoint = keyPoints[keyPoints.length - 1];
    const currPoint = path[i];
    const nextPoint = path[i + 1];

    // Calculate bearing from previous to current
    const bearing = calculateBearing(prevPoint, currPoint);

    // If this is a significant turn, ALWAYS keep it (don't limit corners!)
    if (lastDirection !== null) {
      let angleDiff = Math.abs(bearing - lastDirection);
      if (angleDiff > 180) angleDiff = 360 - angleDiff;

      if (angleDiff >= minAngleChange && keyPoints.length < maxPoints - 1) {
        keyPoints.push(currPoint);
        lastDirection = bearing;
        // Now enforcing maxPoints limit to prevent waypoint explosion
        continue; // Skip distance check for corners
      }
    } else {
      lastDirection = bearing;
    }

    // Also keep points at regular intervals (ONLY if under maxPoints limit)
    const distanceFromLast = haversineDistance(prevPoint, currPoint);
    if (distanceFromLast > 100 && keyPoints.length < maxPoints - 1) {
      // Keep every 100m (reduced from 250m for better density)
      keyPoints.push(currPoint);
      lastDirection = bearing;
    }
  }

  // Always include end
  keyPoints.push(path[path.length - 1]);

  return keyPoints;
}

/**
 * Sample points uniformly along a path by distance
 * Returns approximately numPoints evenly spaced by distance
 */
export function samplePointsByDistance(
  path: LatLng[],
  numPoints: number
): LatLng[] {
  if (path.length <= numPoints) {
    return path;
  }

  // Calculate cumulative distances
  const distances: number[] = [0];
  let totalDistance = 0;

  for (let i = 1; i < path.length; i++) {
    totalDistance += haversineDistance(path[i - 1], path[i]);
    distances.push(totalDistance);
  }

  const interval = totalDistance / (numPoints - 1);
  const sampledPoints: LatLng[] = [path[0]];

  let currentDistance = interval;
  let pathIndex = 1;

  for (let i = 1; i < numPoints - 1; i++) {
    // Find the segment containing currentDistance
    while (pathIndex < path.length && distances[pathIndex] < currentDistance) {
      pathIndex++;
    }

    if (pathIndex >= path.length) break;

    // Take the closest point
    const distToPrev = Math.abs(distances[pathIndex - 1] - currentDistance);
    const distToCurr = Math.abs(distances[pathIndex] - currentDistance);

    sampledPoints.push(distToPrev < distToCurr ? path[pathIndex - 1] : path[pathIndex]);

    currentDistance += interval;
  }

  sampledPoints.push(path[path.length - 1]);

  return sampledPoints;
}

/**
 * Simplify path by removing points that don't significantly change direction
 * Similar to Douglas-Peucker but for geographic coordinates
 */
export function simplifyGeoPath(
  path: LatLng[],
  tolerance: number = 50 // meters
): LatLng[] {
  if (path.length <= 2) return path;

  const result: LatLng[] = [path[0]];
  let lastKept = 0;

  for (let i = 1; i < path.length - 1; i++) {
    const distance = haversineDistance(path[lastKept], path[i]);

    if (distance >= tolerance) {
      result.push(path[i]);
      lastKept = i;
    }
  }

  result.push(path[path.length - 1]);

  return result;
}

/**
 * Check if two paths are approximately the same
 */
export function pathsAreSimilar(
  path1: LatLng[],
  path2: LatLng[],
  threshold: number = 100 // meters
): boolean {
  if (path1.length !== path2.length) return false;

  for (let i = 0; i < path1.length; i++) {
    const distance = haversineDistance(path1[i], path2[i]);
    if (distance > threshold) return false;
  }

  return true;
}

/**
 * Merge multiple path segments into one continuous path
 * Removes duplicate points at segment boundaries
 */
export function mergeSegments(segments: LatLng[][]): LatLng[] {
  if (segments.length === 0) return [];
  if (segments.length === 1) return segments[0];

  const merged: LatLng[] = [...segments[0]];

  for (let i = 1; i < segments.length; i++) {
    const segment = segments[i];

    // Skip the first point of this segment if it's the same as the last point of merged
    const startIndex = merged.length > 0 &&
      haversineDistance(merged[merged.length - 1], segment[0]) < 10
      ? 1
      : 0;

    merged.push(...segment.slice(startIndex));
  }

  return merged;
}
