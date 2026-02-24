import opentype from 'opentype.js';
import { Point2D } from '../../types/route';
import { normalizePath } from './normalizer';
import { simplifyPath, removeDuplicates } from './pathSimplifier';

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
 * Convert text to path using opentype.js
 */
export async function textToPath(text: string): Promise<Point2D[]> {
  if (!text || text.trim().length === 0) {
    throw new Error('Text cannot be empty');
  }

  try {
    const font = await loadFont();

    // Convert text to path
    // Use larger font size for better quality, we'll normalize later
    const fontSize = 200;
    const path = font.getPath(text, 0, fontSize, fontSize);

    // Convert opentype path commands to points
    const points: Point2D[] = [];

    // Sample points along the path
    path.commands.forEach((cmd) => {
      switch (cmd.type) {
        case 'M': // Move to
        case 'L': // Line to
          if ('x' in cmd && 'y' in cmd) {
            points.push({ x: cmd.x, y: cmd.y });
          }
          break;

        case 'C': // Cubic bezier curve
          if ('x' in cmd && 'y' in cmd && 'x1' in cmd && 'y1' in cmd && 'x2' in cmd && 'y2' in cmd) {
            // Sample points along the curve
            const prevPoint = points.length > 0 ? points[points.length - 1] : { x: 0, y: 0 };
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
              points.push(point);
            }
          }
          break;

        case 'Q': // Quadratic bezier curve
          if ('x' in cmd && 'y' in cmd && 'x1' in cmd && 'y1' in cmd) {
            const prevPoint = points.length > 0 ? points[points.length - 1] : { x: 0, y: 0 };
            const samples = 10;

            for (let t = 0; t <= samples; t++) {
              const tNorm = t / samples;
              const point = quadraticBezier(
                prevPoint,
                { x: cmd.x1, y: cmd.y1 },
                { x: cmd.x, y: cmd.y },
                tNorm
              );
              points.push(point);
            }
          }
          break;

        case 'Z': // Close path
          if (points.length > 0) {
            points.push(points[0]); // Close the path
          }
          break;
      }
    });

    if (points.length === 0) {
      throw new Error('No path data generated from text');
    }

    // Flip Y axis (fonts have inverted Y)
    const flipped = points.map(p => ({ x: p.x, y: -p.y }));

    // Remove duplicates
    const cleaned = removeDuplicates(flipped, 0.1);

    // Simplify path (reduce from potentially thousands of points to ~100)
    const simplified = simplifyPath(cleaned, 2.0);

    // Normalize to 0-1 coordinate space
    return normalizePath(simplified);

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
