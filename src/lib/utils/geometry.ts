import { Point2D } from '../../types/route';
import { LatLng } from '../../types/route';

/**
 * Calculate bounding box for a set of geographic points
 */
export function getGeoBounds(points: LatLng[]): {
  north: number;
  south: number;
  east: number;
  west: number;
  center: LatLng;
} {
  if (points.length === 0) {
    return {
      north: 0,
      south: 0,
      east: 0,
      west: 0,
      center: { lat: 0, lng: 0 },
    };
  }

  let north = -Infinity;
  let south = Infinity;
  let east = -Infinity;
  let west = Infinity;

  for (const point of points) {
    north = Math.max(north, point.lat);
    south = Math.min(south, point.lat);
    east = Math.max(east, point.lng);
    west = Math.min(west, point.lng);
  }

  return {
    north,
    south,
    east,
    west,
    center: {
      lat: (north + south) / 2,
      lng: (east + west) / 2,
    },
  };
}

/**
 * Calculate centroid (geometric center) of a set of points
 */
export function calculateCentroid(points: Point2D[]): Point2D {
  if (points.length === 0) {
    return { x: 0, y: 0 };
  }

  let sumX = 0;
  let sumY = 0;

  for (const point of points) {
    sumX += point.x;
    sumY += point.y;
  }

  return {
    x: sumX / points.length,
    y: sumY / points.length,
  };
}

/**
 * Calculate centroid of geographic points
 */
export function calculateGeoCentroid(points: LatLng[]): LatLng {
  if (points.length === 0) {
    return { lat: 0, lng: 0 };
  }

  let sumLat = 0;
  let sumLng = 0;

  for (const point of points) {
    sumLat += point.lat;
    sumLng += point.lng;
  }

  return {
    lat: sumLat / points.length,
    lng: sumLng / points.length,
  };
}

/**
 * Interpolate between two points
 * @param t - Parameter from 0 to 1
 */
export function interpolate(p1: Point2D, p2: Point2D, t: number): Point2D {
  return {
    x: p1.x + (p2.x - p1.x) * t,
    y: p1.y + (p2.y - p1.y) * t,
  };
}

/**
 * Calculate angle between two points in radians
 */
export function angleRadians(p1: Point2D, p2: Point2D): number {
  return Math.atan2(p2.y - p1.y, p2.x - p1.x);
}

/**
 * Calculate angle between two points in degrees
 */
export function angleDegrees(p1: Point2D, p2: Point2D): number {
  return (angleRadians(p1, p2) * 180) / Math.PI;
}

/**
 * Translate (move) all points by offset
 */
export function translatePoints(points: Point2D[], offset: Point2D): Point2D[] {
  return points.map(p => ({
    x: p.x + offset.x,
    y: p.y + offset.y,
  }));
}

/**
 * Scale points by factor
 */
export function scalePoints(points: Point2D[], scale: number): Point2D[] {
  return points.map(p => ({
    x: p.x * scale,
    y: p.y * scale,
  }));
}

/**
 * Calculate the area of a polygon using the Shoelace formula
 * Useful for determining if a path is clockwise or counterclockwise
 */
export function calculatePolygonArea(points: Point2D[]): number {
  if (points.length < 3) return 0;

  let area = 0;
  for (let i = 0; i < points.length; i++) {
    const j = (i + 1) % points.length;
    area += points[i].x * points[j].y;
    area -= points[j].x * points[i].y;
  }

  return Math.abs(area / 2);
}

/**
 * Check if a path is closed (first and last points are the same)
 */
export function isPathClosed(points: Point2D[], tolerance: number = 0.001): boolean {
  if (points.length < 2) return false;

  const first = points[0];
  const last = points[points.length - 1];

  const dx = first.x - last.x;
  const dy = first.y - last.y;
  const distance = Math.sqrt(dx * dx + dy * dy);

  return distance < tolerance;
}
