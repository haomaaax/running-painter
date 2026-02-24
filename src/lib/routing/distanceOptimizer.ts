import { LatLng } from '../../types/route';
import { calculatePathDistance, haversineDistance, calculateDestination } from '../utils/distance';
import { getDirectionsWithRetry } from '../maps/directionsApi';

export interface OptimizeOptions {
  tolerance?: number; // Acceptable distance variance (0.1 = 10%)
  maxLoops?: number; // Maximum number of loops to add
  onProgress?: (progress: number, message: string) => void;
}

/**
 * Adjust route distance to match target
 * Adds loops if too short, optimizes if too long
 */
export async function optimizeDistance(
  route: LatLng[],
  targetDistance: number,
  options: OptimizeOptions = {}
): Promise<LatLng[]> {
  const { tolerance = 0.15, maxLoops = 3, onProgress } = options;

  const currentDistance = calculatePathDistance(route);
  const ratio = currentDistance / targetDistance;

  onProgress?.(0, 'Checking distance...');

  // If within tolerance, return as-is
  if (ratio >= 1 - tolerance && ratio <= 1 + tolerance) {
    onProgress?.(100, 'Distance is within tolerance');
    return route;
  }

  if (ratio < 1 - tolerance) {
    // Too short - add loops
    const deficit = targetDistance - currentDistance;
    onProgress?.(20, `Route is ${Math.round((1 - ratio) * 100)}% too short, adding loops...`);

    return await addLoops(route, deficit, maxLoops, onProgress);
  } else {
    // Too long - try to find shortcuts
    onProgress?.(20, `Route is ${Math.round((ratio - 1) * 100)}% too long`);

    // For now, just return the route as-is
    // Finding shortcuts is complex and may distort the shape too much
    onProgress?.(100, 'Distance optimization complete');
    return route;
  }
}

/**
 * Add small loops to increase distance
 * Distributes loops along the route to minimize shape distortion
 */
async function addLoops(
  route: LatLng[],
  additionalDistance: number,
  maxLoops: number,
  onProgress?: (progress: number, message: string) => void
): Promise<LatLng[]> {
  if (route.length < 10 || maxLoops === 0) {
    return route;
  }

  const loopsToAdd = Math.min(maxLoops, Math.ceil(additionalDistance / 500));
  const distancePerLoop = additionalDistance / loopsToAdd;

  // Find suitable locations for loops (avoid start/end, prefer straighter sections)
  const loopLocations = findLoopLocations(route, loopsToAdd);

  let modifiedRoute = [...route];

  for (let i = 0; i < loopLocations.length; i++) {
    const progress = 20 + ((i / loopLocations.length) * 70);
    onProgress?.(progress, `Adding loop ${i + 1}/${loopLocations.length}...`);

    try {
      const loop = await generateLoop(
        modifiedRoute[loopLocations[i]],
        distancePerLoop
      );

      if (loop.length > 0) {
        // Insert loop at this location
        modifiedRoute = [
          ...modifiedRoute.slice(0, loopLocations[i] + 1),
          ...loop,
          ...modifiedRoute.slice(loopLocations[i] + 1),
        ];

        // Adjust subsequent loop locations
        for (let j = i + 1; j < loopLocations.length; j++) {
          loopLocations[j] += loop.length;
        }
      }
    } catch (error) {
      console.warn(`Failed to generate loop ${i}:`, error);
    }

    // Small delay to avoid rate limiting
    if (i < loopLocations.length - 1) {
      await new Promise(resolve => setTimeout(resolve, 300));
    }
  }

  onProgress?.(100, 'Loops added successfully');

  return modifiedRoute;
}

/**
 * Find good locations for adding loops
 * Prefers middle sections and avoids start/end
 */
function findLoopLocations(route: LatLng[], numLoops: number): number[] {
  const locations: number[] = [];

  // Don't add loops in first or last 20% of route
  const validStart = Math.floor(route.length * 0.2);
  const validEnd = Math.floor(route.length * 0.8);
  const validLength = validEnd - validStart;

  if (validLength < numLoops) {
    // Not enough room, just space them evenly
    const interval = Math.floor(route.length / (numLoops + 1));
    for (let i = 1; i <= numLoops; i++) {
      locations.push(i * interval);
    }
  } else {
    // Distribute evenly in valid range
    const interval = Math.floor(validLength / (numLoops + 1));
    for (let i = 1; i <= numLoops; i++) {
      locations.push(validStart + i * interval);
    }
  }

  return locations;
}

/**
 * Generate a small loop that starts and ends at the same point
 * Creates a rectangular detour of approximately the specified distance
 */
async function generateLoop(
  center: LatLng,
  targetDistance: number
): Promise<LatLng[]> {
  // Create a simple rectangular loop
  // Each side is approximately targetDistance / 4
  const sideLength = targetDistance / 4;

  // Calculate 4 corners of the loop (going clockwise)
  const corner1 = calculateDestination(center, sideLength / 2, 45); // NE
  const corner2 = calculateDestination(center, sideLength / 2, 135); // SE
  const corner3 = calculateDestination(center, sideLength / 2, 225); // SW
  const corner4 = calculateDestination(center, sideLength / 2, 315); // NW

  try {
    // Get walking route through the corners
    const result = await getDirectionsWithRetry({
      origin: center,
      destination: center,
      waypoints: [corner1, corner2, corner3, corner4],
      travelMode: 'WALKING',
    });

    return result.path;
  } catch (error) {
    console.warn('Failed to generate loop with Directions API:', error);

    // Fallback: return simple corners
    return [corner1, corner2, corner3, corner4];
  }
}

/**
 * Calculate how many loops are needed to reach target distance
 */
export function calculateRequiredLoops(
  currentDistance: number,
  targetDistance: number,
  loopDistance: number = 500
): number {
  const deficit = targetDistance - currentDistance;

  if (deficit <= 0) return 0;

  return Math.ceil(deficit / loopDistance);
}

/**
 * Estimate final distance after optimization
 */
export function estimateFinalDistance(
  currentDistance: number,
  targetDistance: number,
  tolerance: number = 0.15
): number {
  const ratio = currentDistance / targetDistance;

  if (ratio >= 1 - tolerance && ratio <= 1 + tolerance) {
    return currentDistance;
  }

  // If too short, estimate with loops
  if (ratio < 1 - tolerance) {
    return targetDistance;
  }

  // If too long, no optimization
  return currentDistance;
}
