import { Point2D } from '../../types/route';
import { TextStroke } from './textToPath';

/**
 * Find optimal order to draw strokes
 *
 * Uses greedy nearest-neighbor algorithm:
 * 1. Start with arbitrary stroke
 * 2. Find nearest unvisited stroke
 * 3. Repeat until all strokes visited
 * 4. Determine if we need to reverse any strokes for shorter connections
 */
export function optimizeStrokeOrder(strokes: TextStroke[]): TextStroke[] {
  if (strokes.length <= 1) {
    return strokes;
  }

  const visited = new Set<string>();
  const orderedStrokes: TextStroke[] = [];

  // Start with first stroke
  let currentStroke = strokes[0];
  visited.add(currentStroke.id);
  orderedStrokes.push(currentStroke);

  while (visited.size < strokes.length) {
    let nearestStroke: TextStroke | null = null;
    let minDistance = Infinity;
    let shouldReverse = false;

    // Find nearest unvisited stroke
    for (const stroke of strokes) {
      if (visited.has(stroke.id)) continue;

      // Check distance from current end to stroke start
      const distToStart = pointDistance(
        currentStroke.points[currentStroke.points.length - 1],
        stroke.points[0]
      );

      // Check distance from current end to stroke end (reversed)
      const distToEnd = pointDistance(
        currentStroke.points[currentStroke.points.length - 1],
        stroke.points[stroke.points.length - 1]
      );

      if (distToStart < minDistance) {
        minDistance = distToStart;
        nearestStroke = stroke;
        shouldReverse = false;
      }

      if (distToEnd < minDistance) {
        minDistance = distToEnd;
        nearestStroke = stroke;
        shouldReverse = true;
      }
    }

    if (nearestStroke) {
      visited.add(nearestStroke.id);

      // Reverse stroke if needed for shorter connection
      const strokeToAdd = shouldReverse
        ? { ...nearestStroke, points: [...nearestStroke.points].reverse() }
        : nearestStroke;

      orderedStrokes.push(strokeToAdd);
      currentStroke = strokeToAdd;
    }
  }

  return orderedStrokes;
}

function pointDistance(p1: Point2D, p2: Point2D): number {
  const dx = p2.x - p1.x;
  const dy = p2.y - p1.y;
  return Math.sqrt(dx * dx + dy * dy);
}
