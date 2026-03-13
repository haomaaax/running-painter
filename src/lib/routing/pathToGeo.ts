import { Point2D, LatLng } from '../../types/route';
import { getBounds } from '../vectorization/normalizer';
import { calculatePathLength } from '../vectorization/normalizer';
import { metersToLatLngOffset, addOffset } from '../utils/coordinates';
import { generateGridArtPath } from './gridPathGenerator';
import { formatDistance } from '../utils/distance';

export interface PathToGeoOptions {
  targetDistance?: number; // Target distance in meters
  rotation?: number; // Rotation in degrees
  scale?: number; // Manual scale override
  useGridMode?: boolean; // Enable grid-aware path generation (for grid cities)
  blockSize?: number; // City block size in meters (for grid mode)
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

  const {
    targetDistance = 10000,
    rotation = 0,
    scale,
    useGridMode = false,
    blockSize = 100,
  } = options;

  // GRID MODE: Convert smooth path to Manhattan-style grid path
  // This is THE KEY to making GPS art work on grid streets!
  let pathToConvert = normalizedPath;
  if (useGridMode) {
    pathToConvert = generateGridArtPath(normalizedPath, {
      blockSize,
      snapToBlocks: true,
    });
    console.log('🎨 Grid mode enabled:', {
      originalPoints: normalizedPath.length,
      gridPoints: pathToConvert.length,
      blockSize,
    });
  }

  // 1. Calculate the path's approximate perimeter in normalized space
  const normalizedLength = calculatePathLength(pathToConvert);

  // GRID INFLATION COMPENSATION: Adjust target distance to compensate for Manhattan path inflation
  let adjustedTargetDistance = targetDistance;

  if (useGridMode) {
    // Calculate how much the grid conversion inflated the path
    const originalLength = calculatePathLength(normalizedPath);
    const gridLength = normalizedLength;
    const gridInflationFactor = gridLength / originalLength;

    // Reduce target to compensate for grid's inherent length increase
    // Use max(1.3, factor) to avoid over-compensation
    adjustedTargetDistance = targetDistance / Math.max(1.3, gridInflationFactor);

    console.log('📏 Grid inflation compensation:', {
      originalLength: originalLength.toFixed(3),
      gridLength: gridLength.toFixed(3),
      inflationFactor: `${gridInflationFactor.toFixed(2)}x`,
      targetBefore: formatDistance(targetDistance),
      targetAfter: formatDistance(adjustedTargetDistance),
    });
  }

  if (normalizedLength === 0) {
    // Single point or all points are the same
    return [center];
  }

  // 2. Get bounds of normalized path first (needed for scaling calculation)
  const bounds = getBounds(pathToConvert);

  // 3. Determine scale factor
  // DISTANCE-FIRST SCALING: Target distance is the PRIMARY driver
  // Waypoint spacing is validated but doesn't override distance control
  let scaleFactor: number;

  if (scale !== undefined) {
    scaleFactor = scale;
  } else {
    // STEP 1: Calculate base scale from target distance
    // This ensures 5km routes are ~5x larger than 1km routes
    const baseScale = adjustedTargetDistance / normalizedLength;

    // STEP 2: Estimate waypoint count and spacing at this scale
    const estimatedWaypoints = Math.min(pathToConvert.length * 0.5, 100);
    const pathLengthAtBaseScale = normalizedLength * baseScale;
    const avgWaypointSpacing = pathLengthAtBaseScale / estimatedWaypoints;

    // STEP 3: Validate waypoint spacing
    const maxSpacing = 15;   // meters - accuracy threshold (ideal is ~8m)

    const pathWidth = bounds.width;
    const pathHeight = bounds.height;
    const maxDimension = Math.max(pathWidth, pathHeight);

    let finalScale = baseScale;
    const warnings: string[] = [];

    if (avgWaypointSpacing > maxSpacing) {
      // Spacing too large - route may be inaccurate

      if (useGridMode && targetDistance <= 5000) {
        // For short grid routes, apply a gentle constraint
        // Limit max dimension to 6 blocks (not the tiny 1.5-3.5!)
        const maxBlocks = 6;  // Reasonable upper bound
        const maxRecommendedSize = blockSize * maxBlocks;
        const shapeSizeAtBase = maxDimension * baseScale;

        if (shapeSizeAtBase > maxRecommendedSize) {
          finalScale = maxRecommendedSize / maxDimension;

          warnings.push(
            `⚠️  Route scaled down to ${maxBlocks} blocks for waypoint accuracy. ` +
            `For larger routes, consider longer target distance.`
          );
        }
      } else {
        // For long routes or non-grid, just warn
        warnings.push(
          `⚠️  Waypoint spacing ${avgWaypointSpacing.toFixed(1)}m may cause shape distortion. ` +
          `Consider simpler text or shorter distance.`
        );
      }
    }

    // Log scaling decisions
    console.log('📏 Distance-first scaling:');
    console.log(`   Target distance: ${formatDistance(targetDistance)}`);
    console.log(`   Base scale from distance: ${baseScale.toFixed(0)}m/unit`);
    console.log(`   Shape size at base scale: ${(maxDimension * baseScale).toFixed(0)}m`);
    console.log(`   Estimated waypoints: ${estimatedWaypoints.toFixed(0)}`);
    console.log(`   Avg waypoint spacing: ${avgWaypointSpacing.toFixed(1)}m`);

    if (finalScale !== baseScale) {
      console.log(`   Final scale (constrained): ${finalScale.toFixed(0)}m/unit`);
      console.log(`   Final shape size: ${(maxDimension * finalScale).toFixed(0)}m`);
    }

    if (warnings.length > 0) {
      warnings.forEach(w => console.log(`   ${w}`));
    }

    scaleFactor = finalScale;
  }

  // 4. Convert each point
  const geoPath: LatLng[] = pathToConvert.map(point => {
    // Center the point (so path is centered around 0,0)
    let x = point.x - bounds.centerX;
    // IMPORTANT: Flip Y axis - in graphics Y goes down, in geo Y (lat) goes up (north)
    let y = -(point.y - bounds.centerY);

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
