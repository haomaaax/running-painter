import { LatLng } from '../../types/route';
import { haversineDistance, calculateBearing } from '../utils/distance';

function buildCumulativeDistances(path: LatLng[]): number[] {
  const distances: number[] = [0];
  let total = 0;

  for (let i = 1; i < path.length; i++) {
    total += haversineDistance(path[i - 1], path[i]);
    distances.push(total);
  }

  return distances;
}

function findClosestDistanceIndex(
  cumulativeDistances: number[],
  targetDistance: number,
  startSearchIndex: number = 1
): number {
  let index = Math.max(1, startSearchIndex);

  while (
    index < cumulativeDistances.length - 1 &&
    cumulativeDistances[index] < targetDistance
  ) {
    index++;
  }

  const prevIndex = index - 1;
  const useCurrent =
    Math.abs(cumulativeDistances[index] - targetDistance) <
    Math.abs(cumulativeDistances[prevIndex] - targetDistance);

  return useCurrent ? index : prevIndex;
}

/**
 * Divide a path into roughly equal segments
 */
export function divideIntoSegments(
  path: LatLng[],
  numSegments: number
): LatLng[][] {
  if (path.length === 0) return [];
  if (numSegments <= 1) return [path];
  if (path.length === 1) return [path];

  const segmentCount = Math.min(numSegments, path.length - 1);
  const cumulativeDistances = buildCumulativeDistances(path);
  const totalDistance = cumulativeDistances[cumulativeDistances.length - 1];

  if (totalDistance === 0) {
    return [path];
  }

  const targetSegmentLength = totalDistance / segmentCount;
  const splitIndices: number[] = [0];
  let searchStart = 1;

  for (let i = 1; i < segmentCount; i++) {
    const targetDistance = targetSegmentLength * i;
    const candidateIndex = findClosestDistanceIndex(
      cumulativeDistances,
      targetDistance,
      searchStart
    );

    const minIndex = splitIndices[splitIndices.length - 1] + 1;
    const remainingSplits = segmentCount - i;
    const maxIndex = path.length - 1 - remainingSplits;
    const splitIndex = Math.max(minIndex, Math.min(candidateIndex, maxIndex));

    splitIndices.push(splitIndex);
    searchStart = splitIndex + 1;
  }

  splitIndices.push(path.length - 1);

  const segments: LatLng[][] = [];
  for (let i = 0; i < splitIndices.length - 1; i++) {
    const start = splitIndices[i];
    const end = splitIndices[i + 1];
    if (end > start) {
      segments.push(path.slice(start, end + 1));
    }
  }

  return segments;
}

/**
 * Extract key waypoints from a path segment
 * Prioritizes significant corners, then fills remaining slots with
 * evenly spaced distance samples to avoid large waypoint gaps.
 */
export function extractKeyPoints(
  path: LatLng[],
  maxPoints: number = 10,
  minAngleChange: number = 5 // degrees - reduced to catch more corners
): LatLng[] {
  if (path.length <= 2) {
    return path;
  }

  const pointLimit = Math.max(2, maxPoints);
  if (path.length <= pointLimit) {
    return path;
  }

  const cumulativeDistances = buildCumulativeDistances(path);
  const totalDistance = cumulativeDistances[cumulativeDistances.length - 1];

  if (totalDistance === 0) {
    return [path[0], path[path.length - 1]];
  }

  // Detect corners with local direction changes and score by turn angle.
  const cornerAngles = new Map<number, number>();
  for (let i = 1; i < path.length - 1; i++) {
    const bearingIn = calculateBearing(path[i - 1], path[i]);
    const bearingOut = calculateBearing(path[i], path[i + 1]);
    let angleDiff = Math.abs(bearingOut - bearingIn);
    if (angleDiff > 180) angleDiff = 360 - angleDiff;

    if (angleDiff >= minAngleChange) {
      cornerAngles.set(i, angleDiff);
    }
  }

  const selectedIndices = new Set<number>([0, path.length - 1]);
  const availableCornerSlots = Math.max(0, pointLimit - 2);
  const topCornerIndices = Array.from(cornerAngles.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, availableCornerSlots)
    .map(([index]) => index);

  topCornerIndices.forEach((index) => selectedIndices.add(index));

  // Fill remaining slots with evenly spaced distance samples to avoid sparse gaps.
  const requiredSamples = pointLimit - selectedIndices.size;
  let searchStart = 1;
  for (let i = 1; i <= requiredSamples; i++) {
    const targetDistance = (totalDistance * i) / (requiredSamples + 1);
    const sampleIndex = findClosestDistanceIndex(
      cumulativeDistances,
      targetDistance,
      searchStart
    );

    if (!selectedIndices.has(sampleIndex)) {
      selectedIndices.add(sampleIndex);
      searchStart = sampleIndex + 1;
    }
  }

  // Backfill deterministically if collisions reduced sample count.
  for (let i = 1; selectedIndices.size < pointLimit && i < path.length - 1; i++) {
    selectedIndices.add(i);
  }

  const sortedIndices = Array.from(selectedIndices).sort((a, b) => a - b);
  return sortedIndices.map((index) => path[index]);
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
