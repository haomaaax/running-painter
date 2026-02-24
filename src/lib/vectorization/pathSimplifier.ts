import { Point2D } from '../../types/route';

/**
 * Calculate perpendicular distance from point to line segment
 */
function perpendicularDistance(
  point: Point2D,
  lineStart: Point2D,
  lineEnd: Point2D
): number {
  const dx = lineEnd.x - lineStart.x;
  const dy = lineEnd.y - lineStart.y;

  // Handle zero-length line segment
  if (dx === 0 && dy === 0) {
    const px = point.x - lineStart.x;
    const py = point.y - lineStart.y;
    return Math.sqrt(px * px + py * py);
  }

  // Calculate perpendicular distance using cross product
  const numerator = Math.abs(
    dy * point.x - dx * point.y + lineEnd.x * lineStart.y - lineEnd.y * lineStart.x
  );
  const denominator = Math.sqrt(dx * dx + dy * dy);

  return numerator / denominator;
}

/**
 * Ramer-Douglas-Peucker algorithm for path simplification
 * Reduces the number of points in a path while preserving its shape
 *
 * @param points - Array of points to simplify
 * @param tolerance - Maximum distance from original path (higher = fewer points)
 * @returns Simplified array of points
 */
export function simplifyPath(points: Point2D[], tolerance: number = 0.01): Point2D[] {
  if (points.length <= 2) {
    return points;
  }

  // Find the point with maximum distance from line between start and end
  let maxDistance = 0;
  let maxIndex = 0;

  const start = points[0];
  const end = points[points.length - 1];

  for (let i = 1; i < points.length - 1; i++) {
    const distance = perpendicularDistance(points[i], start, end);
    if (distance > maxDistance) {
      maxDistance = distance;
      maxIndex = i;
    }
  }

  // If max distance is greater than tolerance, recursively simplify
  if (maxDistance > tolerance) {
    // Recursive call on both halves
    const leftHalf = simplifyPath(points.slice(0, maxIndex + 1), tolerance);
    const rightHalf = simplifyPath(points.slice(maxIndex), tolerance);

    // Combine results (excluding duplicate point at maxIndex)
    return leftHalf.slice(0, -1).concat(rightHalf);
  } else {
    // If max distance is less than tolerance, return just start and end
    return [start, end];
  }
}

/**
 * Simplify path to approximately target number of points
 * Uses binary search to find appropriate tolerance
 */
export function simplifyToPointCount(
  points: Point2D[],
  targetCount: number,
  maxIterations: number = 10
): Point2D[] {
  if (points.length <= targetCount) {
    return points;
  }

  // Binary search for appropriate tolerance
  let minTolerance = 0.0001;
  let maxTolerance = 1.0;
  let bestResult = points;

  for (let i = 0; i < maxIterations; i++) {
    const tolerance = (minTolerance + maxTolerance) / 2;
    const simplified = simplifyPath(points, tolerance);

    if (simplified.length === targetCount) {
      return simplified;
    }

    bestResult = simplified;

    if (simplified.length > targetCount) {
      // Need more aggressive simplification
      minTolerance = tolerance;
    } else {
      // Too aggressive
      maxTolerance = tolerance;
    }
  }

  return bestResult;
}

/**
 * Uniformly sample points along a path
 * Alternative to simplification - maintains equal spacing
 */
export function uniformSample(points: Point2D[], numSamples: number): Point2D[] {
  if (points.length <= numSamples) {
    return points;
  }

  const result: Point2D[] = [points[0]]; // Always include first point

  // Calculate total path length
  let totalLength = 0;
  const segmentLengths: number[] = [];

  for (let i = 1; i < points.length; i++) {
    const dx = points[i].x - points[i - 1].x;
    const dy = points[i].y - points[i - 1].y;
    const length = Math.sqrt(dx * dx + dy * dy);
    segmentLengths.push(length);
    totalLength += length;
  }

  const sampleDistance = totalLength / (numSamples - 1);

  let accumulatedLength = 0;
  let nextSampleDistance = sampleDistance;
  let currentSegmentIndex = 0;
  let currentSegmentProgress = 0;

  for (let sample = 1; sample < numSamples - 1; sample++) {
    while (accumulatedLength + (segmentLengths[currentSegmentIndex] - currentSegmentProgress) < nextSampleDistance) {
      accumulatedLength += segmentLengths[currentSegmentIndex] - currentSegmentProgress;
      currentSegmentIndex++;
      currentSegmentProgress = 0;
    }

    // Interpolate point on current segment
    const remainingDistance = nextSampleDistance - accumulatedLength;
    const t = (currentSegmentProgress + remainingDistance) / segmentLengths[currentSegmentIndex];

    const p1 = points[currentSegmentIndex];
    const p2 = points[currentSegmentIndex + 1];

    result.push({
      x: p1.x + t * (p2.x - p1.x),
      y: p1.y + t * (p2.y - p1.y),
    });

    currentSegmentProgress += remainingDistance;
    nextSampleDistance += sampleDistance;
  }

  result.push(points[points.length - 1]); // Always include last point

  return result;
}

/**
 * Remove duplicate consecutive points
 */
export function removeDuplicates(points: Point2D[], threshold: number = 0.0001): Point2D[] {
  if (points.length <= 1) return points;

  const result: Point2D[] = [points[0]];

  for (let i = 1; i < points.length; i++) {
    const prev = result[result.length - 1];
    const curr = points[i];

    const dx = curr.x - prev.x;
    const dy = curr.y - prev.y;
    const distance = Math.sqrt(dx * dx + dy * dy);

    if (distance > threshold) {
      result.push(curr);
    }
  }

  return result;
}
