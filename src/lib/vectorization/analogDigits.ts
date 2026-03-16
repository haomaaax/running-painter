import { Point2D } from '../../types/route';

/**
 * Analog clock-style digit paths
 * Each digit is defined as a simple continuous outline
 * Coordinates in 0-1 normalized space (0,0 = top-left, 1,1 = bottom-right)
 *
 * Designed for GPS art - simple, recognizable shapes with minimal points
 */

/**
 * Single-stroke 7-segment style digits optimized for grid-based GPS art
 *
 * Design principles:
 * - Continuous path from start to end (minimal backtracking)
 * - Grid-aligned (horizontal/vertical segments only)
 * - Simplified for recognizability on GPS tracks
 * - Optimized for 1-5km routes on grid cities
 */
const ANALOG_DIGITS: Record<string, Point2D[]> = {
  '0': [
    // Rectangle - starts bottom-right (connects well after "2")
    { x: 0.85, y: 0.85 },  // Start bottom-right
    { x: 0.15, y: 0.85 },  // Across bottom to left
    { x: 0.15, y: 0.15 },  // Up left side
    { x: 0.85, y: 0.15 },  // Across top to right
    { x: 0.85, y: 0.85 },  // Down right side (completes rectangle)
  ],

  '1': [
    // Simple vertical line on right side
    { x: 0.70, y: 0.15 },  // Start top
    { x: 0.70, y: 0.85 },  // End bottom
  ],

  '2': [
    // Z-shape - ends bottom-right for easy connection to next digit
    { x: 0.15, y: 0.15 },  // Start top-left
    { x: 0.85, y: 0.15 },  // Top bar right
    { x: 0.85, y: 0.50 },  // Down to middle
    { x: 0.15, y: 0.50 },  // Middle bar left
    { x: 0.15, y: 0.85 },  // Down to bottom
    { x: 0.85, y: 0.85 },  // Bottom bar right (end here)
  ],

  '3': [
    // Modified E-shape (readable as "3")
    { x: 0.15, y: 0.15 },  // Start top-left
    { x: 0.85, y: 0.15 },  // Top bar right
    { x: 0.85, y: 0.45 },  // Down right side (upper)
    { x: 0.30, y: 0.45 },  // Middle bar left (partial)
    { x: 0.85, y: 0.55 },  // Diagonal to lower right
    { x: 0.85, y: 0.85 },  // Down right side (lower)
    { x: 0.15, y: 0.85 },  // Bottom bar left
  ],

  '4': [
    // Grid-friendly "4" - right vertical with crossing horizontal
    { x: 0.15, y: 0.15 },  // Start top-left
    { x: 0.15, y: 0.60 },  // Down left side
    { x: 0.85, y: 0.60 },  // Across horizontal bar
    { x: 0.70, y: 0.60 },  // Back partway (to vertical position)
    { x: 0.70, y: 0.15 },  // Up to top
    { x: 0.70, y: 0.85 },  // Down to bottom
  ],

  '5': [
    // Reverse S-shape (mirror of "2")
    { x: 0.85, y: 0.15 },  // Start top-right
    { x: 0.15, y: 0.15 },  // Top bar left
    { x: 0.15, y: 0.50 },  // Down left side to middle
    { x: 0.85, y: 0.50 },  // Middle bar right
    { x: 0.85, y: 0.85 },  // Down right side to bottom
    { x: 0.15, y: 0.85 },  // Bottom bar left
  ],

  '6': [
    // b-shape - starts top-right (connects well after "2"), ends middle-left
    { x: 0.85, y: 0.15 },  // Start top-right
    { x: 0.15, y: 0.15 },  // Top bar left
    { x: 0.15, y: 0.85 },  // Down left side
    { x: 0.85, y: 0.85 },  // Across bottom right
    { x: 0.85, y: 0.50 },  // Up right side (partial)
    { x: 0.15, y: 0.50 },  // Across middle back to left
  ],

  '7': [
    // L-shape inverted: top bar with diagonal/vertical down
    { x: 0.15, y: 0.15 },  // Start top-left
    { x: 0.85, y: 0.15 },  // Top bar right
    { x: 0.85, y: 0.30 },  // Down a bit
    { x: 0.40, y: 0.85 },  // Diagonal to bottom-left
  ],

  '8': [
    // Two small stacked rectangles (figure-8 simplified)
    { x: 0.15, y: 0.15 },  // Start top-left
    { x: 0.85, y: 0.15 },  // Top bar right
    { x: 0.85, y: 0.45 },  // Down to upper-middle
    { x: 0.15, y: 0.45 },  // Across to left
    { x: 0.15, y: 0.15 },  // Back up to close top rect
    { x: 0.15, y: 0.55 },  // Jump to lower rect start
    { x: 0.85, y: 0.55 },  // Across to right
    { x: 0.85, y: 0.85 },  // Down to bottom
    { x: 0.15, y: 0.85 },  // Across to left
    { x: 0.15, y: 0.55 },  // Up to close bottom rect
  ],

  '9': [
    // d-shape: vertical right side with top loop (inverted 6)
    { x: 0.85, y: 0.85 },  // Start bottom-right
    { x: 0.85, y: 0.15 },  // Up right side
    { x: 0.15, y: 0.15 },  // Across top
    { x: 0.15, y: 0.50 },  // Down left side (partial)
    { x: 0.85, y: 0.50 },  // Across middle back to right
  ],
};

/**
 * Get the path for a single analog-style digit
 */
export function getAnalogDigit(char: string): Point2D[] {
  const digit = ANALOG_DIGITS[char];
  if (!digit) {
    throw new Error(`Analog digit not defined for character: ${char}`);
  }
  // Return a copy to avoid mutation
  return [...digit];
}

/**
 * Convert text to analog clock-style path
 * Arranges digits horizontally with spacing
 */
export function textToAnalogPath(text: string): Point2D[] {
  // Convert each character to analog digit
  const digitPaths: Point2D[][] = [];

  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    if (ANALOG_DIGITS[char]) {
      digitPaths.push(getAnalogDigit(char));
    } else if (char === ' ') {
      // Skip spaces
      continue;
    } else {
      console.warn(`Skipping unsupported character: "${char}"`);
    }
  }

  if (digitPaths.length === 0) {
    throw new Error('No valid analog digits found in text');
  }

  // Space digits horizontally
  const spacing = 1.1; // 1.1 units between digits (with digit width of 1)
  const combinedPath: Point2D[] = [];

  digitPaths.forEach((digitPath, index) => {
    const offsetX = index * spacing;

    digitPath.forEach(point => {
      combinedPath.push({
        x: point.x + offsetX,
        y: point.y,
      });
    });
  });

  console.log(`Analog path created: ${text} → ${digitPaths.length} digits, ${combinedPath.length} points`);

  return combinedPath;
}

/**
 * Check if a character is supported by analog digits
 */
export function isAnalogDigitSupported(char: string): boolean {
  return char in ANALOG_DIGITS;
}

/**
 * Get list of supported characters
 */
export function getSupportedCharacters(): string[] {
  return Object.keys(ANALOG_DIGITS);
}

/**
 * Validate digit design for backtracking issues
 * Returns metrics about potential backtracking in the design
 */
export function validateDigitDesign(digit: Point2D[]): {
  hasBacktracking: boolean;
  overlappingSegments: number;
  totalSegments: number;
  efficiency: number; // 0-1, where 1 = no backtracking
  details: string[];
} {
  const details: string[] = [];
  const segments = new Map<string, number[]>();

  // Build segment map (both directions for each segment)
  for (let i = 0; i < digit.length - 1; i++) {
    const p1 = digit[i];
    const p2 = digit[i + 1];

    // Create normalized segment signature (order-independent for horizontal/vertical)
    const isHorizontal = Math.abs(p1.y - p2.y) < 0.01;
    const isVertical = Math.abs(p1.x - p2.x) < 0.01;

    if (isHorizontal || isVertical) {
      // For grid-aligned segments, normalize to canonical form
      const x1 = Math.min(p1.x, p2.x);
      const x2 = Math.max(p1.x, p2.x);
      const y1 = Math.min(p1.y, p2.y);
      const y2 = Math.max(p1.y, p2.y);
      const signature = `${x1.toFixed(2)},${y1.toFixed(2)}_${x2.toFixed(2)},${y2.toFixed(2)}`;

      if (!segments.has(signature)) {
        segments.set(signature, []);
      }
      segments.get(signature)!.push(i);
    }
  }

  // Find overlapping segments
  let overlapping = 0;
  segments.forEach((indices, sig) => {
    if (indices.length > 1) {
      overlapping++;
      details.push(`Segment ${sig} traversed ${indices.length} times at indices: ${indices.join(', ')}`);
    }
  });

  const totalSegments = digit.length - 1;
  const efficiency = totalSegments > 0 ? 1 - (overlapping / totalSegments) : 1;

  return {
    hasBacktracking: overlapping > 0,
    overlappingSegments: overlapping,
    totalSegments,
    efficiency,
    details,
  };
}

/**
 * Validate all digit designs and log results
 */
export function validateAllDigits(): void {
  console.log('\n=== Digit Design Validation ===\n');

  Object.entries(ANALOG_DIGITS).forEach(([char, path]) => {
    const validation = validateDigitDesign(path);
    const status = validation.hasBacktracking ? '❌' : '✅';

    console.log(`${status} Digit "${char}":`);
    console.log(`   Points: ${path.length}`);
    console.log(`   Segments: ${validation.totalSegments}`);
    console.log(`   Overlapping: ${validation.overlappingSegments}`);
    console.log(`   Efficiency: ${(validation.efficiency * 100).toFixed(1)}%`);

    if (validation.details.length > 0) {
      validation.details.forEach(detail => {
        console.log(`   ⚠️  ${detail}`);
      });
    }
    console.log('');
  });
}
