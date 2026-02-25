import { Point2D } from '../../types/route';
import { TextStroke } from './textToPath';

/**
 * Merge separate strokes into one continuous path
 *
 * Adds straight-line connectors between stroke endpoints
 */
export function mergeStrokes(strokes: TextStroke[]): Point2D[] {
  if (strokes.length === 0) return [];
  if (strokes.length === 1) return strokes[0].points;

  const mergedPath: Point2D[] = [];

  for (let i = 0; i < strokes.length; i++) {
    const stroke = strokes[i];

    // Add all points from current stroke
    mergedPath.push(...stroke.points);

    // Add connector to next stroke (if not last stroke)
    if (i < strokes.length - 1) {
      const currentEnd = stroke.points[stroke.points.length - 1];
      const nextStart = strokes[i + 1].points[0];

      // Add intermediate points for connector (for grid mode)
      const connector = createConnector(currentEnd, nextStart);
      mergedPath.push(...connector);
    }
  }

  return mergedPath;
}

/**
 * Create connector between two points
 *
 * For grid mode: creates Manhattan path (horizontal then vertical)
 * For smooth mode: creates direct line
 */
function createConnector(
  start: Point2D,
  end: Point2D,
  gridMode: boolean = true
): Point2D[] {
  if (gridMode) {
    // Manhattan connector: go horizontal first, then vertical
    const midPoint: Point2D = {
      x: end.x,
      y: start.y,
    };

    // Only include midPoint if it's different from start and end
    if (Math.abs(midPoint.x - start.x) > 0.001 && Math.abs(midPoint.y - end.y) > 0.001) {
      return [midPoint];
    }

    return []; // Direct connection if already aligned
  } else {
    // Direct connector (no intermediate points)
    return [];
  }
}
