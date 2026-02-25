import { Point2D, LatLng } from '../../types/route';
import { pathToGeo } from './pathToGeo';
import { snapToRoads } from './routeSnapper';
import { optimizeDistance } from './distanceOptimizer';
import { calculatePathDistance, formatDistance } from '../utils/distance';

export interface RouteGenerationOptions {
  targetDistance: number; // meters
  numSegments?: number;
  maxWaypointsPerSegment?: number;
  optimizeDistance?: boolean;
  distanceTolerance?: number;
  gridMode?: boolean;      // Enable grid-aware path generation
  blockSize?: number;      // City block size for grid mode
  onProgress?: (progress: number, step: string) => void;
}

export interface GeneratedRoute {
  idealPath: Point2D[];
  geoPath: LatLng[];
  snappedRoute: LatLng[];
  distance: number;
  targetDistance: number;
  accuracy: number; // percentage (100 = perfect match)
}

/**
 * Main route generation orchestrator
 *
 * Pipeline:
 * 1. Normalized path (0-1) → Geographic path (lat/lng)
 * 2. Geographic path → Road-snapped route
 * 3. Road-snapped route → Distance-optimized route
 */
export async function generateRoute(
  normalizedPath: Point2D[],
  routeCenter: LatLng,
  options: RouteGenerationOptions
): Promise<GeneratedRoute> {
  const {
    targetDistance,
    numSegments = 5,
    maxWaypointsPerSegment = 8,
    optimizeDistance: shouldOptimize = true,
    distanceTolerance = 0.15,
    gridMode = false,
    blockSize = 100,
    onProgress,
  } = options;

  try {
    // Step 1: Convert to geographic coordinates (5%)
    onProgress?.(5, 'Converting to geographic coordinates...');

    const geoPath = pathToGeo(normalizedPath, routeCenter, {
      targetDistance,
      useGridMode: gridMode,
      blockSize,
    });

    console.log('Geographic path generated:', {
      points: geoPath.length,
      targetDistance: formatDistance(targetDistance),
    });

    // Step 2: Snap to roads (5-80%)
    onProgress?.(10, 'Snapping to real roads...');

    const snappedRoute = await snapToRoads(geoPath, {
      numSegments,
      maxWaypointsPerSegment,
      travelMode: 'BICYCLING',
      onProgress: (snapProgress, message) => {
        // Map snap progress to 10-80% range
        const overallProgress = 10 + (snapProgress / 100) * 70;
        onProgress?.(overallProgress, message);
      },
    });

    console.log('Route snapped to roads:', {
      points: snappedRoute.length,
      distance: formatDistance(calculatePathDistance(snappedRoute)),
    });

    // Step 3: Optimize distance (80-95%)
    onProgress?.(85, 'Optimizing distance...');

    let finalRoute = snappedRoute;

    if (shouldOptimize) {
      try {
        finalRoute = await optimizeDistance(snappedRoute, targetDistance, {
          tolerance: distanceTolerance,
          maxLoops: 3,
          onProgress: (optProgress, message) => {
            // Map opt progress to 85-95% range
            const overallProgress = 85 + (optProgress / 100) * 10;
            onProgress?.(overallProgress, message);
          },
        });
      } catch (error) {
        console.warn('Distance optimization failed:', error);
        // Continue with unoptimized route
      }
    }

    // Step 4: Calculate final metrics (95-100%)
    onProgress?.(98, 'Calculating route metrics...');

    const finalDistance = calculatePathDistance(finalRoute);
    const accuracy = targetDistance > 0 ? (finalDistance / targetDistance) * 100 : 100;

    onProgress?.(100, 'Route generation complete!');

    console.log('Route generation complete:', {
      idealPathPoints: normalizedPath.length,
      geoPathPoints: geoPath.length,
      snappedRoutePoints: snappedRoute.length,
      finalRoutePoints: finalRoute.length,
      targetDistance: formatDistance(targetDistance),
      finalDistance: formatDistance(finalDistance),
      accuracy: `${accuracy.toFixed(1)}%`,
    });

    return {
      idealPath: normalizedPath,
      geoPath,
      snappedRoute: finalRoute,
      distance: finalDistance,
      targetDistance,
      accuracy,
    };
  } catch (error) {
    console.error('Route generation failed:', error);
    throw new Error(`Failed to generate route: ${error}`);
  }
}

/**
 * Validate inputs before generating route
 */
export function validateRouteInputs(
  normalizedPath: Point2D[] | null,
  routeCenter: LatLng | null,
  targetDistance: number
): { valid: boolean; error?: string } {
  if (!normalizedPath || normalizedPath.length === 0) {
    return { valid: false, error: 'No path data. Please enter text or select a shape.' };
  }

  if (normalizedPath.length < 2) {
    return { valid: false, error: 'Path must have at least 2 points.' };
  }

  if (!routeCenter) {
    return { valid: false, error: 'Location not available. Please select a location on the map or enable GPS.' };
  }

  if (targetDistance < 500) {
    return { valid: false, error: 'Target distance must be at least 500 meters (0.5 km).' };
  }

  if (targetDistance > 100000) {
    return { valid: false, error: 'Target distance must be less than 100 km.' };
  }

  return { valid: true };
}

/**
 * Estimate route generation time based on complexity
 */
export function estimateGenerationTime(
  pathPoints: number,
  targetDistance: number
): number {
  // Base time: 5 seconds
  // + 1 second per 10 points
  // + 2 seconds per 10km
  const baseTime = 5000;
  const pointTime = (pathPoints / 10) * 1000;
  const distanceTime = (targetDistance / 10000) * 2000;

  return baseTime + pointTime + distanceTime;
}
