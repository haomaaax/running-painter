import opentype from 'opentype.js';
import { Point2D } from '../../types/route';
import { normalizePath } from './normalizer';
import { simplifyPath, removeDuplicates } from './pathSimplifier';
import { optimizeStrokeOrder } from './strokeOptimizer';
import { mergeStrokes } from './strokeMerger';
import { textToAnalogPath } from './analogDigits';

export interface TextStroke {
  points: Point2D[];
  id: string;
}

// Font cache to avoid reloading
let cachedFont: opentype.Font | null = null;
let fontLoadPromise: Promise<opentype.Font> | null = null;

/**
 * Load font file (Arial Black or fallback)
 * Priority: Arial Black > Roboto Bold > System font
 */
async function loadFont(): Promise<opentype.Font> {
  // Return cached font if available
  if (cachedFont) {
    return cachedFont;
  }

  // Return in-progress promise if loading
  if (fontLoadPromise) {
    return fontLoadPromise;
  }

  // Try to load fonts in order of preference
  const fontPaths = [
    '/fonts/ArialBlack.ttf',
    '/fonts/Arial-Bold.ttf',
    '/fonts/Roboto-Bold.ttf',
  ];

  fontLoadPromise = (async () => {
    for (const fontPath of fontPaths) {
      try {
        const font = await opentype.load(fontPath);
        cachedFont = font;
        return font;
      } catch (error) {
        console.warn(`Failed to load font from ${fontPath}:`, error);
      }
    }

    throw new Error(
      'No font file found. Please add a font file to public/fonts/. ' +
      'See README for instructions.'
    );
  })();

  return fontLoadPromise;
}

/**
 * Convert text to separate strokes
 *
 * Detects pen lifts ('M' commands) to split text into independent strokes.
 * This prevents retracing when connecting characters.
 */
async function textToStrokes(text: string): Promise<TextStroke[]> {
  const font = await loadFont();
  const fontSize = 200;
  const path = font.getPath(text, 0, fontSize, fontSize);

  const strokes: TextStroke[] = [];
  let currentStroke: Point2D[] = [];
  let strokeId = 0;

  path.commands.forEach((cmd) => {
    switch (cmd.type) {
      case 'M': // Move to - START NEW STROKE (pen lift!)
        // Save previous stroke if it exists
        if (currentStroke.length > 0) {
          strokes.push({
            points: currentStroke,
            id: `stroke-${strokeId++}`,
          });
          currentStroke = [];
        }

        // Start new stroke at this position
        if ('x' in cmd && 'y' in cmd) {
          currentStroke.push({ x: cmd.x, y: cmd.y });
        }
        break;

      case 'L': // Line to - CONTINUE CURRENT STROKE
        if ('x' in cmd && 'y' in cmd) {
          currentStroke.push({ x: cmd.x, y: cmd.y });
        }
        break;

      case 'C': // Bezier curve - CONTINUE CURRENT STROKE
        if ('x' in cmd && 'y' in cmd && 'x1' in cmd && 'y1' in cmd && 'x2' in cmd && 'y2' in cmd) {
          const prevPoint = currentStroke.length > 0 ? currentStroke[currentStroke.length - 1] : { x: 0, y: 0 };
          const samples = 10;

          for (let t = 0; t <= samples; t++) {
            const tNorm = t / samples;
            const point = cubicBezier(
              prevPoint,
              { x: cmd.x1, y: cmd.y1 },
              { x: cmd.x2, y: cmd.y2 },
              { x: cmd.x, y: cmd.y },
              tNorm
            );
            currentStroke.push(point);
          }
        }
        break;

      case 'Q': // Quadratic bezier curve - CONTINUE CURRENT STROKE
        if ('x' in cmd && 'y' in cmd && 'x1' in cmd && 'y1' in cmd) {
          const prevPoint = currentStroke.length > 0 ? currentStroke[currentStroke.length - 1] : { x: 0, y: 0 };
          const samples = 10;

          for (let t = 0; t <= samples; t++) {
            const tNorm = t / samples;
            const point = quadraticBezier(
              prevPoint,
              { x: cmd.x1, y: cmd.y1 },
              { x: cmd.x, y: cmd.y },
              tNorm
            );
            currentStroke.push(point);
          }
        }
        break;

      case 'Z': // Close path - END CURRENT STROKE
        if (currentStroke.length > 0) {
          // Close the stroke (connect back to first point)
          currentStroke.push(currentStroke[0]);
          strokes.push({
            points: currentStroke,
            id: `stroke-${strokeId++}`,
          });
          currentStroke = [];
        }
        break;
    }
  });

  // Save final stroke if it exists
  if (currentStroke.length > 0) {
    strokes.push({
      points: currentStroke,
      id: `stroke-${strokeId++}`,
    });
  }

  return strokes;
}

/**
 * Calculate the area of a stroke using the shoelace formula
 * Larger area = outer outline, smaller area = inner holes
 */
function calculateStrokeArea(points: Point2D[]): number {
  if (points.length < 3) return 0;

  let area = 0;
  for (let i = 0; i < points.length - 1; i++) {
    area += points[i].x * points[i + 1].y - points[i + 1].x * points[i].y;
  }
  return Math.abs(area / 2);
}

/**
 * Filter out inner strokes (holes in characters like 0, 6, 8, etc.)
 * Keep only outer outlines for single-line pen drawing style
 */
function filterOuterStrokes(strokes: TextStroke[]): TextStroke[] {
  if (strokes.length === 0) return strokes;

  // Calculate area for each stroke
  const strokesWithArea = strokes.map(stroke => ({
    stroke,
    area: calculateStrokeArea(stroke.points),
  }));

  // Find the maximum area
  const maxArea = Math.max(...strokesWithArea.map(s => s.area));

  // Keep ONLY strokes with the maximum area (the largest outline)
  // This ensures true single-line pen drawing style
  const filtered = strokesWithArea
    .filter(s => s.area === maxArea)
    .map(s => s.stroke);

  console.log(`Filtered ${strokes.length} strokes down to ${filtered.length} outer strokes (largest only)`);

  return filtered;
}

/**
 * Convert text to path using stroke-based approach
 *
 * Pipeline:
 * 1. Split text into separate strokes (detects pen lifts)
 * 2. Filter outer strokes only (removes inner holes - single-line pen drawing style)
 * 3. Optimize stroke order (TSP - minimize connector distance)
 * 4. Merge strokes into single continuous path
 * 5. Normalize and simplify
 *
 * This prevents retracing and creates a clear START → END flow with single-line outlines
 */
export async function textToPath(text: string): Promise<Point2D[]> {
  if (!text || text.trim().length === 0) {
    throw new Error('Text cannot be empty');
  }

  try {
    // Use analog clock-style digits (simple, clean geometry for GPS art)
    const analogPath = textToAnalogPath(text);

    console.log(`Text "${text}" converted to analog path with ${analogPath.length} points`);

    // Flip Y axis (analog coords are top=0, but map needs proper orientation)
    const flipped = analogPath.map(p => ({ x: p.x, y: 1 - p.y }));

    // Remove duplicates
    const cleaned = removeDuplicates(flipped, 0.01);

    // Simplify path (light simplification for clean paths)
    const simplified = simplifyPath(cleaned, 0.02);

    // Normalize to 0-1 coordinate space
    const normalized = normalizePath(simplified);

    console.log(`Final normalized path: ${normalized.length} points`);

    return normalized;

  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`Failed to convert text to path: ${error.message}`);
    }
    throw error;
  }
}

/**
 * Cubic Bezier curve interpolation
 */
function cubicBezier(
  p0: Point2D,
  p1: Point2D,
  p2: Point2D,
  p3: Point2D,
  t: number
): Point2D {
  const t2 = t * t;
  const t3 = t2 * t;
  const mt = 1 - t;
  const mt2 = mt * mt;
  const mt3 = mt2 * mt;

  return {
    x: mt3 * p0.x + 3 * mt2 * t * p1.x + 3 * mt * t2 * p2.x + t3 * p3.x,
    y: mt3 * p0.y + 3 * mt2 * t * p1.y + 3 * mt * t2 * p2.y + t3 * p3.y,
  };
}

/**
 * Quadratic Bezier curve interpolation
 */
function quadraticBezier(
  p0: Point2D,
  p1: Point2D,
  p2: Point2D,
  t: number
): Point2D {
  const mt = 1 - t;
  const mt2 = mt * mt;
  const t2 = t * t;

  return {
    x: mt2 * p0.x + 2 * mt * t * p1.x + t2 * p2.x,
    y: mt2 * p0.y + 2 * mt * t * p1.y + t2 * p2.y,
  };
}

/**
 * Check if a font is loaded and ready
 */
export function isFontLoaded(): boolean {
  return cachedFont !== null;
}

/**
 * Preload font (call this on app startup)
 */
export async function preloadFont(): Promise<void> {
  try {
    await loadFont();
  } catch (error) {
    console.warn('Font preload failed:', error);
  }
}
