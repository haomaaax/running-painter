import { Point2D } from './route';

export type InputType = 'text' | 'shape';

export interface ShapeDefinition {
  id: string;
  name: string;
  path: string; // SVG path or file path
}

export interface VectorizedShape {
  points: Point2D[];
  bounds: {
    minX: number;
    maxX: number;
    minY: number;
    maxY: number;
  };
}
