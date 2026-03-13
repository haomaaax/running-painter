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
 * Detect if a path is grid-aligned (only horizontal/vertical segments)
 * Returns true if ≥95% of segments are aligned to cardinal directions
 *
 * @param path - Path to analyze
 * @param toleranceDegrees - Tolerance for cardinal direction matching (default 2°)
 * @returns true if path is grid-aligned
 */
export function isPathGridAligned(
  path: LatLng[],
  toleranceDegrees: number = 2
): boolean {
  if (path.length < 2) return false;

  let gridSegments = 0;
  let totalSegments = 0;

  for (let i = 1; i < path.length; i++) {
    const bearing = calculateBearing(path[i - 1], path[i]);

    // Check if bearing is close to 0°, 90°, 180°, or 270° (cardinal directions)
    const isCardinal = [0, 90, 180, 270].some(cardinalBearing => {
      const diff = Math.abs(bearing - cardinalBearing);
      return diff <= toleranceDegrees || diff >= (360 - toleranceDegrees);
    });

    if (isCardinal) gridSegments++;
    totalSegments++;
  }

  const gridRatio = gridSegments / totalSegments;
  return gridRatio >= 0.95;
}

/**
 * Extract only corner points from a grid-aligned path
 * A corner is where the direction changes significantly (≥80° for grid paths)
 *
 * @param path - Grid-aligned path
 * @param minCornerAngle - Minimum angle change to be considered a corner (default 80°)
 * @returns Array of corner points including start and end
 */
export function extractGridCorners(
  path: LatLng[],
  minCornerAngle: number = 85  // INCREASED from 80° to 85° for true right angles
): LatLng[] {
  if (path.length <= 2) {
    return path;
  }

  const corners: LatLng[] = [path[0]]; // Always include start

  for (let i = 1; i < path.length - 1; i++) {
    const bearingIn = calculateBearing(path[i - 1], path[i]);
    const bearingOut = calculateBearing(path[i], path[i + 1]);

    let angleDiff = Math.abs(bearingOut - bearingIn);
    if (angleDiff > 180) angleDiff = 360 - angleDiff;

    // Only include if this is a significant turn (true corner)
    // For 7-segment grid-aligned digits, we want strict 90° turns
    if (angleDiff >= minCornerAngle) {
      corners.push(path[i]);
    }
  }

  corners.push(path[path.length - 1]); // Always include end

  return corners;
}

/**
 * Add intermediate waypoints on long straight sections to guide routing
 * For grid paths, long straight sections need guidance points to prevent detours
 *
 * ADAPTIVE SPACING: Adjusts based on target route distance
 * - Short routes (1-2km): 50m spacing (very tight for accuracy)
 * - Medium routes (2-5km): 80m spacing (moderate)
 * - Long routes (5km+): 150m spacing (original behavior)
 *
 * @param corners - Corner points extracted from grid path
 * @param maxSegmentLength - Maximum length before adding intermediate point (default 150m)
 * @param targetDistance - Target route distance in meters (for adaptive spacing)
 * @returns Enhanced waypoint array with intermediate guidance points
 */
export function addGridGuidancePoints(
  corners: LatLng[],
  maxSegmentLength: number = 150,
  targetDistance?: number
): LatLng[] {
  if (corners.length <= 2) {
    return corners;
  }

  // ADAPTIVE SPACING based on target distance
  let adaptiveSpacing = maxSegmentLength;
  if (targetDistance !== undefined) {
    if (targetDistance < 2000) {
      adaptiveSpacing = 50;  // Very tight for short routes
    } else if (targetDistance < 5000) {
      adaptiveSpacing = 80;  // Moderate for medium routes
    } else {
      adaptiveSpacing = 150; // Original for long routes
    }
  }

  const enhanced: LatLng[] = [corners[0]];

  for (let i = 1; i < corners.length; i++) {
    const prev = corners[i - 1];
    const curr = corners[i];
    const distance = haversineDistance(prev, curr);

    // If segment is long, add intermediate points to guide routing
    if (distance > adaptiveSpacing) {
      const numIntermediate = Math.floor(distance / adaptiveSpacing);

      // Add evenly-spaced intermediate points along this straight section
      for (let j = 1; j <= numIntermediate; j++) {
        const fraction = j / (numIntermediate + 1);
        const intermediate: LatLng = {
          lat: prev.lat + (curr.lat - prev.lat) * fraction,
          lng: prev.lng + (curr.lng - prev.lng) * fraction,
        };
        enhanced.push(intermediate);
      }
    }

    enhanced.push(curr);
  }

  console.log(`   Adaptive guidance (${adaptiveSpacing}m spacing): ${corners.length} corners → ${enhanced.length} waypoints`);

  return enhanced;
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
  minAngleChange: number = 5, // degrees - reduced to catch more corners
  targetDistance?: number // Target distance for adaptive waypoint spacing
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

  // GRID-AWARE WAYPOINT STRATEGY: Detect grid-aligned paths and use corner-only extraction
  const isGridPath = isPathGridAligned(path);

  if (isGridPath) {
    console.log('🔲 Grid-aligned path detected - using corner-only waypoints');
    const corners = extractGridCorners(path, 85); // Stricter threshold for 7-segment digits

    console.log(`   Waypoint reduction: ${path.length} → ${corners.length} corners`);

    // Add intermediate guidance points with adaptive spacing based on target distance
    // Short routes (1-2km): 50m, Medium (2-5km): 80m, Long (5km+): 150m
    const enhancedWaypoints = addGridGuidancePoints(corners, 150, targetDistance);

    // If enhanced waypoints fit within maxPoints, return them directly
    if (enhancedWaypoints.length <= pointLimit) {
      return enhancedWaypoints;
    }

    // If too many waypoints after enhancement, work with corners only
    // and skip guidance points (will add them later if needed)
    if (corners.length <= pointLimit) {
      return corners;
    }

    // If too many corners, prioritize by angle magnitude
    // Score each corner by turn angle
    const cornerScores: { index: number; angle: number; point: LatLng }[] = [];

    for (let i = 1; i < corners.length - 1; i++) {
      const corner = corners[i];
      const prevIdx = path.indexOf(corner) - 1;
      const nextIdx = path.indexOf(corner) + 1;

      if (prevIdx >= 0 && nextIdx < path.length) {
        const bearingIn = calculateBearing(path[prevIdx], corner);
        const bearingOut = calculateBearing(corner, path[nextIdx]);
        let angleDiff = Math.abs(bearingOut - bearingIn);
        if (angleDiff > 180) angleDiff = 360 - angleDiff;

        cornerScores.push({ index: i, angle: angleDiff, point: corner });
      }
    }

    // Sort by angle (most significant turns first)
    cornerScores.sort((a, b) => b.angle - a.angle);

    // Select top corners (preserve start/end)
    const selectedCorners: LatLng[] = [corners[0]]; // Start point
    const availableSlots = pointLimit - 2;

    cornerScores.slice(0, availableSlots).forEach(({ point }) => {
      selectedCorners.push(point);
    });

    selectedCorners.push(corners[corners.length - 1]); // End point

    console.log(`   Top ${selectedCorners.length} corners selected for routing`);

    return selectedCorners;
  }

  // NON-GRID PATH: Use existing corner + uniform sampling strategy
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
