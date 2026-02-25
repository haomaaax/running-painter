import { Point2D } from '../../types/route';

/**
 * Analog clock-style digit paths
 * Each digit is defined as a simple continuous outline
 * Coordinates in 0-1 normalized space (0,0 = top-left, 1,1 = bottom-right)
 *
 * Designed for GPS art - simple, recognizable shapes with minimal points
 */

const ANALOG_DIGITS: Record<string, Point2D[]> = {
  '0': [
    // Oval shape for zero
    { x: 0.5, y: 0.0 },
    { x: 0.75, y: 0.05 },
    { x: 0.9, y: 0.2 },
    { x: 0.95, y: 0.5 },
    { x: 0.9, y: 0.8 },
    { x: 0.75, y: 0.95 },
    { x: 0.5, y: 1.0 },
    { x: 0.25, y: 0.95 },
    { x: 0.1, y: 0.8 },
    { x: 0.05, y: 0.5 },
    { x: 0.1, y: 0.2 },
    { x: 0.25, y: 0.05 },
    { x: 0.5, y: 0.0 }, // Close path
  ],

  '1': [
    // Vertical line with small top serif
    { x: 0.35, y: 0.15 },
    { x: 0.5, y: 0.0 },
    { x: 0.5, y: 1.0 },
    { x: 0.3, y: 1.0 },
    { x: 0.7, y: 1.0 },
    { x: 0.5, y: 1.0 },
    { x: 0.5, y: 0.0 },
    { x: 0.35, y: 0.15 },
  ],

  '2': [
    // Smooth analog clock "2" - top curve, middle slope, bottom line
    { x: 0.1, y: 0.2 },
    { x: 0.15, y: 0.05 },
    { x: 0.3, y: 0.0 },
    { x: 0.7, y: 0.0 },
    { x: 0.85, y: 0.05 },
    { x: 0.9, y: 0.15 },
    { x: 0.9, y: 0.3 },
    { x: 0.85, y: 0.4 },
    { x: 0.7, y: 0.5 },
    { x: 0.5, y: 0.6 },
    { x: 0.3, y: 0.75 },
    { x: 0.15, y: 0.9 },
    { x: 0.1, y: 1.0 },
    { x: 0.9, y: 1.0 },
    { x: 0.9, y: 0.85 },
    { x: 0.3, y: 0.85 },
    { x: 0.5, y: 0.7 },
    { x: 0.7, y: 0.55 },
    { x: 0.8, y: 0.4 },
    { x: 0.8, y: 0.2 },
    { x: 0.75, y: 0.1 },
    { x: 0.6, y: 0.05 },
    { x: 0.4, y: 0.05 },
    { x: 0.25, y: 0.1 },
    { x: 0.15, y: 0.18 },
    { x: 0.1, y: 0.2 },
  ],

  '3': [
    // Smooth "3" with two curves
    { x: 0.15, y: 0.15 },
    { x: 0.25, y: 0.05 },
    { x: 0.4, y: 0.0 },
    { x: 0.6, y: 0.0 },
    { x: 0.75, y: 0.05 },
    { x: 0.85, y: 0.15 },
    { x: 0.9, y: 0.25 },
    { x: 0.85, y: 0.35 },
    { x: 0.7, y: 0.45 },
    { x: 0.6, y: 0.5 },
    { x: 0.7, y: 0.55 },
    { x: 0.85, y: 0.65 },
    { x: 0.9, y: 0.75 },
    { x: 0.85, y: 0.85 },
    { x: 0.75, y: 0.95 },
    { x: 0.6, y: 1.0 },
    { x: 0.4, y: 1.0 },
    { x: 0.25, y: 0.95 },
    { x: 0.15, y: 0.85 },
    { x: 0.1, y: 0.75 },
    { x: 0.15, y: 0.7 },
    { x: 0.25, y: 0.75 },
    { x: 0.25, y: 0.85 },
    { x: 0.35, y: 0.92 },
    { x: 0.5, y: 0.95 },
    { x: 0.65, y: 0.92 },
    { x: 0.75, y: 0.85 },
    { x: 0.8, y: 0.75 },
    { x: 0.75, y: 0.6 },
    { x: 0.6, y: 0.52 },
    { x: 0.5, y: 0.5 },
    { x: 0.6, y: 0.48 },
    { x: 0.75, y: 0.4 },
    { x: 0.8, y: 0.25 },
    { x: 0.75, y: 0.15 },
    { x: 0.65, y: 0.08 },
    { x: 0.5, y: 0.05 },
    { x: 0.35, y: 0.08 },
    { x: 0.25, y: 0.15 },
    { x: 0.15, y: 0.15 },
  ],

  '4': [
    // "4" with vertical and diagonal strokes
    { x: 0.7, y: 0.0 },
    { x: 0.7, y: 0.7 },
    { x: 0.9, y: 0.7 },
    { x: 0.9, y: 0.8 },
    { x: 0.7, y: 0.8 },
    { x: 0.7, y: 1.0 },
    { x: 0.6, y: 1.0 },
    { x: 0.6, y: 0.8 },
    { x: 0.1, y: 0.8 },
    { x: 0.1, y: 0.7 },
    { x: 0.6, y: 0.7 },
    { x: 0.6, y: 0.0 },
    { x: 0.7, y: 0.0 },
  ],

  '5': [
    // "5" with top line, curve on bottom
    { x: 0.9, y: 0.0 },
    { x: 0.9, y: 0.1 },
    { x: 0.2, y: 0.1 },
    { x: 0.2, y: 0.45 },
    { x: 0.4, y: 0.45 },
    { x: 0.6, y: 0.48 },
    { x: 0.75, y: 0.55 },
    { x: 0.85, y: 0.65 },
    { x: 0.9, y: 0.75 },
    { x: 0.85, y: 0.85 },
    { x: 0.75, y: 0.95 },
    { x: 0.6, y: 1.0 },
    { x: 0.4, y: 1.0 },
    { x: 0.25, y: 0.95 },
    { x: 0.15, y: 0.85 },
    { x: 0.1, y: 0.75 },
    { x: 0.15, y: 0.7 },
    { x: 0.2, y: 0.75 },
    { x: 0.25, y: 0.85 },
    { x: 0.35, y: 0.92 },
    { x: 0.5, y: 0.95 },
    { x: 0.65, y: 0.92 },
    { x: 0.75, y: 0.85 },
    { x: 0.8, y: 0.75 },
    { x: 0.75, y: 0.6 },
    { x: 0.65, y: 0.53 },
    { x: 0.5, y: 0.5 },
    { x: 0.3, y: 0.5 },
    { x: 0.1, y: 0.48 },
    { x: 0.1, y: 0.0 },
    { x: 0.9, y: 0.0 },
  ],

  '6': [
    // "6" with loop at bottom
    { x: 0.7, y: 0.05 },
    { x: 0.5, y: 0.0 },
    { x: 0.3, y: 0.05 },
    { x: 0.15, y: 0.15 },
    { x: 0.08, y: 0.3 },
    { x: 0.05, y: 0.5 },
    { x: 0.08, y: 0.7 },
    { x: 0.15, y: 0.85 },
    { x: 0.3, y: 0.95 },
    { x: 0.5, y: 1.0 },
    { x: 0.7, y: 0.95 },
    { x: 0.85, y: 0.85 },
    { x: 0.92, y: 0.7 },
    { x: 0.95, y: 0.5 },
    { x: 0.9, y: 0.35 },
    { x: 0.8, y: 0.5 },
    { x: 0.7, y: 0.9 },
    { x: 0.5, y: 0.95 },
    { x: 0.3, y: 0.9 },
    { x: 0.2, y: 0.8 },
    { x: 0.15, y: 0.65 },
    { x: 0.15, y: 0.5 },
    { x: 0.2, y: 0.35 },
    { x: 0.3, y: 0.1 },
    { x: 0.5, y: 0.05 },
    { x: 0.65, y: 0.08 },
    { x: 0.7, y: 0.05 },
  ],

  '7': [
    // "7" with top line and diagonal
    { x: 0.1, y: 0.0 },
    { x: 0.9, y: 0.0 },
    { x: 0.9, y: 0.1 },
    { x: 0.4, y: 1.0 },
    { x: 0.3, y: 1.0 },
    { x: 0.8, y: 0.1 },
    { x: 0.1, y: 0.1 },
    { x: 0.1, y: 0.0 },
  ],

  '8': [
    // "8" with two stacked circles
    { x: 0.5, y: 0.0 },
    { x: 0.7, y: 0.03 },
    { x: 0.85, y: 0.1 },
    { x: 0.9, y: 0.2 },
    { x: 0.85, y: 0.3 },
    { x: 0.7, y: 0.37 },
    { x: 0.6, y: 0.4 },
    { x: 0.5, y: 0.43 },
    { x: 0.4, y: 0.4 },
    { x: 0.3, y: 0.37 },
    { x: 0.15, y: 0.3 },
    { x: 0.1, y: 0.2 },
    { x: 0.15, y: 0.1 },
    { x: 0.3, y: 0.03 },
    { x: 0.5, y: 0.0 },
  ],

  '9': [
    // "9" with loop at top (mirror of 6)
    { x: 0.3, y: 0.95 },
    { x: 0.5, y: 1.0 },
    { x: 0.7, y: 0.95 },
    { x: 0.85, y: 0.85 },
    { x: 0.92, y: 0.7 },
    { x: 0.95, y: 0.5 },
    { x: 0.92, y: 0.3 },
    { x: 0.85, y: 0.15 },
    { x: 0.7, y: 0.05 },
    { x: 0.5, y: 0.0 },
    { x: 0.3, y: 0.05 },
    { x: 0.15, y: 0.15 },
    { x: 0.08, y: 0.3 },
    { x: 0.05, y: 0.5 },
    { x: 0.1, y: 0.65 },
    { x: 0.2, y: 0.5 },
    { x: 0.3, y: 0.1 },
    { x: 0.5, y: 0.05 },
    { x: 0.7, y: 0.1 },
    { x: 0.8, y: 0.2 },
    { x: 0.85, y: 0.35 },
    { x: 0.85, y: 0.5 },
    { x: 0.8, y: 0.65 },
    { x: 0.7, y: 0.9 },
    { x: 0.5, y: 0.95 },
    { x: 0.35, y: 0.92 },
    { x: 0.3, y: 0.95 },
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
