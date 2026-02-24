import { create } from 'zustand';
import { Point2D, LatLng } from '../types/route';

interface RouteState {
  // Input
  inputType: 'text' | 'shape';
  inputValue: string;
  targetDistance: number;

  // Location
  userLocation: LatLng | null;

  // Processing
  isGenerating: boolean;
  progress: number;
  currentStep: string;

  // Results
  idealPath: Point2D[] | null;
  geoPath: LatLng[] | null;
  snappedRoute: LatLng[] | null;
  routeDistance: number | null;

  // Error handling
  error: string | null;

  // Actions
  setInput: (type: 'text' | 'shape', value: string) => void;
  setDistance: (distance: number) => void;
  setUserLocation: (location: LatLng | null) => void;
  setGenerating: (isGenerating: boolean) => void;
  setProgress: (progress: number, step: string) => void;
  setIdealPath: (path: Point2D[] | null) => void;
  setGeoPath: (path: LatLng[] | null) => void;
  setSnappedRoute: (route: LatLng[] | null, distance: number | null) => void;
  setError: (error: string | null) => void;
  resetRoute: () => void;
}

export const useRouteStore = create<RouteState>((set) => ({
  // Initial state
  inputType: 'text',
  inputValue: '',
  targetDistance: 10000, // 10km default

  userLocation: null,

  isGenerating: false,
  progress: 0,
  currentStep: '',

  idealPath: null,
  geoPath: null,
  snappedRoute: null,
  routeDistance: null,

  error: null,

  // Actions
  setInput: (type, value) => set({ inputType: type, inputValue: value, error: null }),
  setDistance: (distance) => set({ targetDistance: distance }),
  setUserLocation: (location) => set({ userLocation: location }),
  setGenerating: (isGenerating) => set({ isGenerating }),
  setProgress: (progress, step) => set({ progress, currentStep: step }),
  setIdealPath: (path) => set({ idealPath: path }),
  setGeoPath: (path) => set({ geoPath: path }),
  setSnappedRoute: (route, distance) => set({ snappedRoute: route, routeDistance: distance }),
  setError: (error) => set({ error, isGenerating: false }),
  resetRoute: () => set({
    idealPath: null,
    geoPath: null,
    snappedRoute: null,
    routeDistance: null,
    progress: 0,
    currentStep: '',
    error: null,
  }),
}));
