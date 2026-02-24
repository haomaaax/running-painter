import { Point2D } from '../../types/route';
import { normalizePath } from './normalizer';

export interface ShapeDefinition {
  id: string;
  name: string;
  filename: string;
}

export const AVAILABLE_SHAPES: ShapeDefinition[] = [
  { id: 'heart', name: 'Heart', filename: '/shapes/heart.svg' },
  { id: 'star', name: 'Star', filename: '/shapes/star.svg' },
  { id: 'smiley', name: 'Smiley', filename: '/shapes/smiley.svg' },
  { id: 'circle', name: 'Circle', filename: '/shapes/circle.svg' },
  { id: 'triangle', name: 'Triangle', filename: '/shapes/triangle.svg' },
];

/**
 * Parse SVG path data into points
 * Simplified parser that handles basic path commands
 */
function parseSVGPath(pathData: string, numPoints: number = 50): Point2D[] {
  // Create a temporary SVG element to use the browser's path parsing
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
  path.setAttribute('d', pathData);
  svg.appendChild(path);

  const points: Point2D[] = [];
  const pathLength = path.getTotalLength();

  // Sample points along the path
  for (let i = 0; i <= numPoints; i++) {
    const distance = (i / numPoints) * pathLength;
    const point = path.getPointAtLength(distance);
    points.push({ x: point.x, y: point.y });
  }

  return points;
}

/**
 * Extract path data from SVG content
 */
function extractPathsFromSVG(svgContent: string): string[] {
  const parser = new DOMParser();
  const doc = parser.parseFromString(svgContent, 'image/svg+xml');

  const paths: string[] = [];

  // Get all path elements
  const pathElements = doc.querySelectorAll('path');
  pathElements.forEach(path => {
    const d = path.getAttribute('d');
    if (d) paths.push(d);
  });

  // Handle circles
  const circles = doc.querySelectorAll('circle');
  circles.forEach(circle => {
    const cx = parseFloat(circle.getAttribute('cx') || '0');
    const cy = parseFloat(circle.getAttribute('cy') || '0');
    const r = parseFloat(circle.getAttribute('r') || '0');

    // Convert circle to path
    const circlePath = `M ${cx - r},${cy} A ${r},${r} 0 1,0 ${cx + r},${cy} A ${r},${r} 0 1,0 ${cx - r},${cy}`;
    paths.push(circlePath);
  });

  return paths;
}

/**
 * Load and parse a shape from SVG file
 */
export async function loadShape(shapeId: string): Promise<Point2D[]> {
  const shape = AVAILABLE_SHAPES.find(s => s.id === shapeId);

  if (!shape) {
    throw new Error(`Shape not found: ${shapeId}`);
  }

  try {
    const response = await fetch(shape.filename);
    if (!response.ok) {
      throw new Error(`Failed to load shape: ${response.statusText}`);
    }

    const svgContent = await response.text();
    const pathDataArray = extractPathsFromSVG(svgContent);

    if (pathDataArray.length === 0) {
      throw new Error('No paths found in SVG');
    }

    // Combine all paths into one
    let allPoints: Point2D[] = [];

    for (const pathData of pathDataArray) {
      const points = parseSVGPath(pathData, 30); // 30 points per path
      allPoints = allPoints.concat(points);
    }

    // Normalize to 0-1 space
    return normalizePath(allPoints);

  } catch (error) {
    console.error('Error loading shape:', error);
    throw error;
  }
}

/**
 * Get a shape definition by ID
 */
export function getShapeById(shapeId: string): ShapeDefinition | undefined {
  return AVAILABLE_SHAPES.find(s => s.id === shapeId);
}
