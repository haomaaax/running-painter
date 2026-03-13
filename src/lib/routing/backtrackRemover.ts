import { Point2D } from '../../types/route';
import { calculatePathLength } from '../vectorization/normalizer';

interface Segment {
  start: Point2D;
  end: Point2D;
  direction: 'horizontal' | 'vertical' | 'diagonal';
  index: number;
  length: number;
}

interface BacktrackingResult {
  hasBacktracking: boolean;
  overlappingSegments: number;
  totalSegments: number;
  efficiency: number;
  details: string[];
}

interface OptimizedResult {
  optimizedPath: Point2D[];
  originalLength: number;
  optimizedLength: number;
  reductionPercent: number;
  segmentsRemoved: number;
}

/**
 * Detect backtracking in normalized path (before geo conversion)
 *
 * Backtracking occurs when the path revisits the same line segment,
 * either in the same or opposite direction.
 */
export function detectBacktracking(path: Point2D[]): BacktrackingResult {
  if (path.length < 2) {
    return {
      hasBacktracking: false,
      overlappingSegments: 0,
      totalSegments: 0,
      efficiency: 1.0,
      details: [],
    };
  }

  const segments = extractSegments(path);
  const segmentMap = new Map<string, number[]>();
  const details: string[] = [];

  // Build segment signature map
  segments.forEach((seg, idx) => {
    const sig = getSegmentSignature(seg);
    if (!segmentMap.has(sig)) {
      segmentMap.set(sig, []);
    }
    segmentMap.get(sig)!.push(idx);
  });

  // Find overlaps
  const overlapping: number[][] = [];
  segmentMap.forEach((indices, sig) => {
    if (indices.length > 1) {
      overlapping.push(indices);
      details.push(
        `Segment "${sig}" traversed ${indices.length}x at indices: ${indices.join(', ')}`
      );
    }
  });

  const totalSegments = segments.length;
  const overlappingCount = overlapping.length;
  const efficiency = totalSegments > 0 ? 1 - (overlappingCount / totalSegments) : 1;

  return {
    hasBacktracking: overlappingCount > 0,
    overlappingSegments: overlappingCount,
    totalSegments,
    efficiency,
    details,
  };
}

/**
 * Remove backtracking from path while preserving connectivity
 *
 * Strategy:
 * 1. Identify segments that are traversed multiple times
 * 2. Remove redundant traversals
 * 3. Ensure path remains connected
 */
export function removeBacktracking(path: Point2D[]): OptimizedResult {
  if (path.length < 2) {
    return {
      optimizedPath: [...path],
      originalLength: 0,
      optimizedLength: 0,
      reductionPercent: 0,
      segmentsRemoved: 0,
    };
  }

  const originalLength = calculatePathLength(path);
  let currentPath = [...path];
  let totalRemoved = 0;

  // Iteratively find and remove backtracks
  let iterations = 0;
  const maxIterations = 100; // Prevent infinite loops

  while (iterations < maxIterations) {
    const backtrack = findNextBacktrack(currentPath);
    if (!backtrack) break;

    const newPath = removeBacktrackSegment(currentPath, backtrack);
    if (newPath.length >= currentPath.length) break; // No progress made

    currentPath = newPath;
    totalRemoved++;
    iterations++;
  }

  const optimizedLength = calculatePathLength(currentPath);
  const reductionPercent = originalLength > 0
    ? ((originalLength - optimizedLength) / originalLength) * 100
    : 0;

  return {
    optimizedPath: currentPath,
    originalLength,
    optimizedLength,
    reductionPercent,
    segmentsRemoved: totalRemoved,
  };
}

/**
 * Consolidate duplicate corner visits
 *
 * Removes points where the path visits the same coordinate multiple times,
 * keeping only the first visit.
 */
export function consolidateCorners(path: Point2D[]): Point2D[] {
  if (path.length < 2) return [...path];

  const seen = new Map<string, number>(); // coordinate → first index
  const toKeep = new Set<number>();

  path.forEach((point, idx) => {
    const key = coordKey(point);

    if (!seen.has(key)) {
      // First time seeing this coordinate - keep it
      seen.set(key, idx);
      toKeep.add(idx);
    } else {
      // Seen before - only keep if it's start or end point
      if (idx === 0 || idx === path.length - 1) {
        toKeep.add(idx);
      }
    }
  });

  return path.filter((_, idx) => toKeep.has(idx));
}

/**
 * Extract segments from path
 */
function extractSegments(path: Point2D[]): Segment[] {
  const segments: Segment[] = [];

  for (let i = 0; i < path.length - 1; i++) {
    const start = path[i];
    const end = path[i + 1];
    const dx = Math.abs(end.x - start.x);
    const dy = Math.abs(end.y - start.y);

    let direction: 'horizontal' | 'vertical' | 'diagonal';
    if (dy < 0.01) {
      direction = 'horizontal';
    } else if (dx < 0.01) {
      direction = 'vertical';
    } else {
      direction = 'diagonal';
    }

    segments.push({
      start,
      end,
      direction,
      index: i,
      length: Math.sqrt(dx * dx + dy * dy),
    });
  }

  return segments;
}

/**
 * Generate normalized signature for a segment
 *
 * For horizontal/vertical segments, normalizes to canonical form
 * (min coordinate first) so that segments traversed in opposite
 * directions have the same signature.
 */
function getSegmentSignature(seg: Segment): string {
  const { start, end, direction } = seg;

  if (direction === 'horizontal') {
    const x1 = Math.min(start.x, end.x);
    const x2 = Math.max(start.x, end.x);
    const y = start.y;
    return `H:${x1.toFixed(3)}-${x2.toFixed(3)},${y.toFixed(3)}`;
  } else if (direction === 'vertical') {
    const x = start.x;
    const y1 = Math.min(start.y, end.y);
    const y2 = Math.max(start.y, end.y);
    return `V:${x.toFixed(3)},${y1.toFixed(3)}-${y2.toFixed(3)}`;
  } else {
    // Diagonal - use directional signature
    return `D:${start.x.toFixed(3)},${start.y.toFixed(3)}-${end.x.toFixed(3)},${end.y.toFixed(3)}`;
  }
}

/**
 * Find next backtracking pattern in path
 */
function findNextBacktrack(path: Point2D[]): { startIdx: number; endIdx: number } | null {
  const segments = extractSegments(path);
  const segmentMap = new Map<string, number[]>();

  // Build map
  segments.forEach((seg, idx) => {
    const sig = getSegmentSignature(seg);
    if (!segmentMap.has(sig)) {
      segmentMap.set(sig, []);
    }
    segmentMap.get(sig)!.push(idx);
  });

  // Find first overlap
  for (const indices of segmentMap.values()) {
    if (indices.length > 1) {
      // Found backtrack - return indices
      return {
        startIdx: indices[0],
        endIdx: indices[1],
      };
    }
  }

  return null;
}

/**
 * Remove a backtracking segment from path
 *
 * Strategy: Remove the loop between two traversals of the same segment
 */
function removeBacktrackSegment(
  path: Point2D[],
  backtrack: { startIdx: number; endIdx: number }
): Point2D[] {
  const { startIdx, endIdx } = backtrack;

  // Remove the loop between these two segments
  // Keep: [0...startIdx+1] + [endIdx+1...end]
  const before = path.slice(0, startIdx + 2); // Include endpoint of first segment
  const after = path.slice(endIdx + 1);

  return [...before, ...after];
}

/**
 * Generate coordinate key for point
 */
function coordKey(point: Point2D): string {
  return `${point.x.toFixed(4)},${point.y.toFixed(4)}`;
}

/**
 * Check if path is grid-aligned (mostly horizontal/vertical segments)
 */
export function isGridAligned(path: Point2D[], threshold: number = 0.95): boolean {
  if (path.length < 2) return false;

  const segments = extractSegments(path);
  const gridSegments = segments.filter(
    seg => seg.direction === 'horizontal' || seg.direction === 'vertical'
  );

  return gridSegments.length / segments.length >= threshold;
}

/**
 * Analyze path metrics
 */
export function analyzePath(path: Point2D[]): {
  totalPoints: number;
  totalSegments: number;
  gridAlignedPercent: number;
  backtrackingAnalysis: BacktrackingResult;
} {
  const segments = extractSegments(path);
  const gridSegments = segments.filter(
    seg => seg.direction === 'horizontal' || seg.direction === 'vertical'
  );

  return {
    totalPoints: path.length,
    totalSegments: segments.length,
    gridAlignedPercent: segments.length > 0
      ? (gridSegments.length / segments.length) * 100
      : 0,
    backtrackingAnalysis: detectBacktracking(path),
  };
}
