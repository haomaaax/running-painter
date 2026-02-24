import { Point2D } from '../../types/route';

export interface Bounds {
  minX: number;
  maxX: number;
  minY: number;
  maxY: number;
  width: number;
  height: number;
  centerX: number;
  centerY: number;
}

/**
 * Calculate bounding box of a path
 */
export function getBounds(points: Point2D[]): Bounds {
  if (points.length === 0) {
    return {
      minX: 0, maxX: 0, minY: 0, maxY: 0,
      width: 0, height: 0, centerX: 0, centerY: 0
    };
  }

  let minX = Infinity;
  let maxX = -Infinity;
  let minY = Infinity;
  let maxY = -Infinity;

  for (const point of points) {
    minX = Math.min(minX, point.x);
    maxX = Math.max(maxX, point.x);
    minY = Math.min(minY, point.y);
    maxY = Math.max(maxY, point.y);
  }

  return {
    minX,
    maxX,
    minY,
    maxY,
    width: maxX - minX,
    height: maxY - minY,
    centerX: (minX + maxX) / 2,
    centerY: (minY + maxY) / 2,
  };
}

/**
 * Normalize path to 0-1 coordinate space
 * Centers the path and scales to fit within unit square
 */
export function normalizePath(points: Point2D[]): Point2D[] {
  if (points.length === 0) return [];

  const bounds = getBounds(points);

  // Handle edge case of zero width or height
  if (bounds.width === 0 || bounds.height === 0) {
    return points.map(() => ({ x: 0.5, y: 0.5 }));
  }

  // Scale factor to fit in unit square while maintaining aspect ratio
  const scale = 1 / Math.max(bounds.width, bounds.height);

  // Normalize and center
  return points.map(point => ({
    x: (point.x - bounds.minX) * scale,
    y: (point.y - bounds.minY) * scale,
  }));
}

/**
 * Scale normalized path to target dimensions
 */
export function scaleNormalizedPath(
  points: Point2D[],
  targetWidth: number,
  targetHeight: number
): Point2D[] {
  return points.map(point => ({
    x: point.x * targetWidth,
    y: point.y * targetHeight,
  }));
}

/**
 * Calculate approximate path length (sum of segment lengths)
 */
export function calculatePathLength(points: Point2D[]): number {
  if (points.length < 2) return 0;

  let length = 0;
  for (let i = 1; i < points.length; i++) {
    const dx = points[i].x - points[i - 1].x;
    const dy = points[i].y - points[i - 1].y;
    length += Math.sqrt(dx * dx + dy * dy);
  }

  return length;
}

/**
 * Rotate path around center by angle in radians
 */
export function rotatePath(points: Point2D[], angleRadians: number): Point2D[] {
  const bounds = getBounds(points);
  const centerX = bounds.centerX;
  const centerY = bounds.centerY;

  const cos = Math.cos(angleRadians);
  const sin = Math.sin(angleRadians);

  return points.map(point => {
    const x = point.x - centerX;
    const y = point.y - centerY;

    return {
      x: x * cos - y * sin + centerX,
      y: x * sin + y * cos + centerY,
    };
  });
}
