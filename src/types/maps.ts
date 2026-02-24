import { LatLng } from './route';

export interface DirectionsRequest {
  origin: LatLng;
  destination: LatLng;
  waypoints: LatLng[];
  travelMode: 'WALKING' | 'BICYCLING';
}

export interface DirectionsResult {
  route: LatLng[];
  distance: number;
  duration: number;
}
