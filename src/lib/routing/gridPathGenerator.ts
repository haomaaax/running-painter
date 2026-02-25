import { Point2D, LatLng } from '../../types/route';
import { calculateBearing, haversineDistance } from '../utils/distance';

/**
 * Grid-Aware Path Generator
 *
 * Converts smooth paths to Manhattan-style paths (only horizontal/vertical moves)
 * Perfect for GPS art in grid-like cities (like Taipei, NYC, etc.)
 *
 * Algorithm:
 * 1. Detect grid orientation from selected area
 * 2. Convert smooth curves to step-wise path (like graph paper)
 * 3. Snap to actual city blocks
 */

export interface GridPathOptions {
  blockSize?: number;        // meters, typical city block size (default 100m)
  gridAngle?: number;        // degrees, grid rotation (default 0 = N/S, E/W)
  snapToBlocks?: boolean;    // snap to block boundaries (default true)
}

/**
 * Convert a smooth path to grid-aligned (Manhattan distance) path
 *
 * This is the key to GPS art on grid streets!
 * Instead of smooth curves, we get rectangular "strokes" like the successful example.
 */
export function convertToGridPath(
  normalizedPath: Point2D[],
  options: GridPathOptions = {}
): Point2D[] {
  if (normalizedPath.length < 2) {
    return normalizedPath;
  }

  const {
    blockSize = 100,
    gridAngle = 0,
    snapToBlocks = true,
  } = options;

  const gridPath: Point2D[] = [];

  // Start point
  let current = normalizedPath[0];
  gridPath.push(current);

  // Convert each segment to Manhattan path (horizontal + vertical only)
  for (let i = 1; i < normalizedPath.length; i++) {
    const target = normalizedPath[i];

    // Calculate deltas
    const dx = target.x - current.x;
    const dy = target.y - current.y;

    // Strategy: Move horizontal first, then vertical (creates "L" shapes)
    // This mimics how runners draw on grid streets

    if (Math.abs(dx) > 0.001) {
      // Horizontal move
      const midPoint: Point2D = {
        x: target.x,
        y: current.y,
      };
      gridPath.push(midPoint);
      current = midPoint;
    }

    if (Math.abs(dy) > 0.001) {
      // Vertical move
      gridPath.push(target);
      current = target;
    }
  }

  return gridPath;
}

/**
 * Detect grid orientation from area
 *
 * Analyzes the predominant street directions to determine grid angle
 * Returns angle in degrees (0 = North-South grid)
 */
export function detectGridOrientation(
  samplePoints: LatLng[]
): number {
  if (samplePoints.length < 2) {
    return 0; // Default to N/S, E/W grid
  }

  // Sample bearings between consecutive points
  const bearings: number[] = [];

  for (let i = 1; i < samplePoints.length; i++) {
    const bearing = calculateBearing(samplePoints[i - 1], samplePoints[i]);
    bearings.push(bearing);
  }

  // Round bearings to nearest 45 degrees
  const roundedBearings = bearings.map(b => Math.round(b / 45) * 45);

  // Find most common bearing (primary grid direction)
  const bearingCounts = new Map<number, number>();
  roundedBearings.forEach(b => {
    bearingCounts.set(b, (bearingCounts.get(b) || 0) + 1);
  });

  let maxCount = 0;
  let primaryBearing = 0;

  bearingCounts.forEach((count, bearing) => {
    if (count > maxCount) {
      maxCount = count;
      primaryBearing = bearing;
    }
  });

  // Return the grid angle (offset from true north)
  return primaryBearing % 90; // Normalize to 0-90 range
}

/**
 * Snap path to city block grid
 *
 * Adjusts points to align with block boundaries
 * Makes routes follow actual street grid patterns
 */
export function snapToBlockGrid(
  path: Point2D[],
  blockSize: number = 100
): Point2D[] {
  return path.map(point => ({
    x: Math.round(point.x * 1000 / blockSize) * blockSize / 1000,
    y: Math.round(point.y * 1000 / blockSize) * blockSize / 1000,
  }));
}

/**
 * Calculate optimal block size for area
 *
 * Analyzes typical street spacing in the selected area
 * Returns recommended block size in meters
 */
export function estimateBlockSize(
  samplePoints: LatLng[]
): number {
  if (samplePoints.length < 10) {
    return 100; // Default to 100m blocks
  }

  // Calculate distances between consecutive points
  const distances: number[] = [];

  for (let i = 1; i < samplePoints.length; i++) {
    const dist = haversineDistance(samplePoints[i - 1], samplePoints[i]);
    distances.push(dist);
  }

  // Find median distance (more robust than average)
  distances.sort((a, b) => a - b);
  const median = distances[Math.floor(distances.length / 2)];

  // Round to nearest 50m for block size
  return Math.round(median / 50) * 50;
}

/**
 * Simplify grid path by removing redundant points
 *
 * Removes intermediate points on straight segments
 * Keeps only turning points (corners)
 */
export function simplifyGridPath(path: Point2D[]): Point2D[] {
  if (path.length < 3) {
    return path;
  }

  const simplified: Point2D[] = [path[0]];

  for (let i = 1; i < path.length - 1; i++) {
    const prev = simplified[simplified.length - 1];
    const curr = path[i];
    const next = path[i + 1];

    // Check if current point is on a straight line
    const dx1 = curr.x - prev.x;
    const dy1 = curr.y - prev.y;
    const dx2 = next.x - curr.x;
    const dy2 = next.y - curr.y;

    // If direction changes (corner), keep the point
    const isCorner = Math.abs(dx1 - dx2) > 0.001 || Math.abs(dy1 - dy2) > 0.001;

    if (isCorner) {
      simplified.push(curr);
    }
  }

  // Always include end point
  simplified.push(path[path.length - 1]);

  return simplified;
}

/**
 * Generate grid-aware GPS art path
 *
 * Main entry point for grid-based route generation
 * Converts smooth artistic path to grid-aligned navigable route
 */
export function generateGridArtPath(
  normalizedPath: Point2D[],
  options: GridPathOptions = {}
): Point2D[] {
  // Step 1: Convert to Manhattan path (horizontal/vertical only)
  let gridPath = convertToGridPath(normalizedPath, options);

  // Step 2: Snap to block grid
  if (options.snapToBlocks) {
    gridPath = snapToBlockGrid(gridPath, options.blockSize);
  }

  // Step 3: Simplify (remove redundant points on straight segments)
  gridPath = simplifyGridPath(gridPath);

  console.log('Grid path generated:', {
    originalPoints: normalizedPath.length,
    gridPoints: gridPath.length,
    blockSize: options.blockSize,
  });

  return gridPath;
}
