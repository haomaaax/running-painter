export interface Point2D {
  x: number;
  y: number;
}

export interface LatLng {
  lat: number;
  lng: number;
}

export interface Route {
  id: string;
  name: string;
  idealPath: Point2D[];
  geoPath: LatLng[];
  snappedRoute: LatLng[];
  distance: number; // in meters
  createdAt: Date;
}

export interface RouteGenerationProgress {
  step: string;
  progress: number; // 0-100
}
