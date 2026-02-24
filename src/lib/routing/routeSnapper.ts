import { LatLng } from '../../types/route';
import { getDirectionsWithRetry, batchDirections } from '../maps/directionsApi';
import {
  divideIntoSegments,
  extractKeyPoints,
  samplePointsByDistance,
  mergeSegments,
} from './segmentation';
import { calculatePathDistance } from '../utils/distance';

export interface SnapOptions {
  numSegments?: number;
  maxWaypointsPerSegment?: number;
  travelMode?: 'WALKING' | 'BICYCLING';
  onProgress?: (progress: number, message: string) => void;
}

/**
 * Snap an ideal path to real roads using Google Directions API
 *
 * Strategy:
 * 1. Divide path into segments (to handle API waypoint limits)
 * 2. Extract key waypoints from each segment
 * 3. Get walking directions for each segment
 * 4. Merge all segments into final route
 */
export async function snapToRoads(
  idealPath: LatLng[],
  options: SnapOptions = {}
): Promise<LatLng[]> {
  const {
    numSegments = 5,
    maxWaypointsPerSegment = 8,
    travelMode = 'WALKING',
    onProgress,
  } = options;

  if (idealPath.length < 2) {
    throw new Error('Path must have at least 2 points');
  }

  try {
    onProgress?.(10, 'Dividing path into segments...');

    // Step 1: Divide into segments
    const segments = divideIntoSegments(idealPath, numSegments);

    onProgress?.(20, `Processing ${segments.length} segments...`);

    // Step 2: Process each segment
    const snappedSegments: LatLng[][] = [];

    for (let i = 0; i < segments.length; i++) {
      const segment = segments[i];
      const progress = 20 + ((i / segments.length) * 60);

      onProgress?.(
        progress,
        `Snapping segment ${i + 1}/${segments.length} to roads...`
      );

      try {
        const snappedSegment = await snapSegmentToRoads(
          segment,
          maxWaypointsPerSegment,
          travelMode
        );
        snappedSegments.push(snappedSegment);
      } catch (error) {
        console.error(`Failed to snap segment ${i}:`, error);

        // Fallback: use original segment if API fails
        snappedSegments.push(segment);
      }

      // Small delay between segments to avoid rate limiting
      if (i < segments.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 300));
      }
    }

    onProgress?.(85, 'Merging segments...');

    // Step 3: Merge all snapped segments
    const finalRoute = mergeSegments(snappedSegments);

    onProgress?.(95, 'Route snapping complete!');

    return finalRoute;
  } catch (error) {
    console.error('Route snapping failed:', error);
    throw new Error(`Failed to snap route to roads: ${error}`);
  }
}

/**
 * Snap a single segment to roads
 */
async function snapSegmentToRoads(
  segment: LatLng[],
  maxWaypoints: number,
  travelMode: 'WALKING' | 'BICYCLING'
): Promise<LatLng[]> {
  if (segment.length < 2) {
    return segment;
  }

  // Extract key waypoints (limit to maxWaypoints to fit API constraints)
  // Google Directions API allows max 25 waypoints, but we use fewer for better performance
  const keyPoints = extractKeyPoints(segment, maxWaypoints);

  // If we still have too many points, sample uniformly
  const waypoints =
    keyPoints.length > maxWaypoints
      ? samplePointsByDistance(keyPoints, maxWaypoints)
      : keyPoints;

  if (waypoints.length < 2) {
    return segment;
  }

  // Get directions from first to last point, with waypoints in between
  const origin = waypoints[0];
  const destination = waypoints[waypoints.length - 1];
  const intermediateWaypoints = waypoints.slice(1, -1);

  try {
    const result = await getDirectionsWithRetry({
      origin,
      destination,
      waypoints: intermediateWaypoints,
      travelMode,
    });

    return result.path;
  } catch (error) {
    console.error('Segment directions failed:', error);
    // Fallback to original segment
    return segment;
  }
}

/**
 * Simple fallback: just get a route from start to end
 * Useful when full snapping fails
 */
export async function snapSimple(
  start: LatLng,
  end: LatLng,
  travelMode: 'WALKING' | 'BICYCLING' = 'WALKING'
): Promise<LatLng[]> {
  try {
    const result = await getDirectionsWithRetry({
      origin: start,
      destination: end,
      travelMode,
    });

    return result.path;
  } catch (error) {
    console.error('Simple snap failed:', error);
    return [start, end];
  }
}

/**
 * Check if a location is routable (has nearby roads)
 * Returns true if we can get directions from/to this point
 */
export async function isLocationRoutable(
  location: LatLng,
  testDistance: number = 100 // meters
): Promise<boolean> {
  try {
    // Try to get directions to a point 100m north
    const testPoint: LatLng = {
      lat: location.lat + 0.001, // ~111m
      lng: location.lng,
    };

    await getDirectionsWithRetry({
      origin: location,
      destination: testPoint,
      travelMode: 'WALKING',
    });

    return true;
  } catch (error) {
    return false;
  }
}
