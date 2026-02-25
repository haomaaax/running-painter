import { create } from 'zustand';
import { Point2D, LatLng, SuggestedLocation } from '../types/route';

interface RouteState {
  // Input
  inputType: 'text' | 'shape';
  inputValue: string;
  targetDistance: number;
  gridMode: boolean;           // Enable grid-aware path generation
  blockSize: number;           // City block size for grid mode (meters)

  // Location
  userLocation: LatLng | null;           // GPS location (optional)
  selectedCenter: LatLng | null;         // User-selected center
  locationMode: 'gps' | 'manual';        // How location was set
  suggestedLocations: SuggestedLocation[] | null; // Grid suggestions

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
  setGridMode: (enabled: boolean) => void;
  setBlockSize: (size: number) => void;
  setUserLocation: (location: LatLng | null) => void;
  setSelectedCenter: (location: LatLng | null) => void;
  setLocationMode: (mode: 'gps' | 'manual') => void;
  setSuggestedLocations: (locations: SuggestedLocation[] | null) => void;
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
  gridMode: false,       // Disable by default for cleaner analog routes
  blockSize: 100,        // 100m default block size

  userLocation: null,
  selectedCenter: null,
  locationMode: 'gps',
  suggestedLocations: null,

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
  setGridMode: (enabled) => set({ gridMode: enabled }),
  setBlockSize: (size) => set({ blockSize: size }),
  setUserLocation: (location) => set({ userLocation: location }),
  setSelectedCenter: (location) => set({ selectedCenter: location }),
  setLocationMode: (mode) => set({ locationMode: mode }),
  setSuggestedLocations: (locations) => set({ suggestedLocations: locations }),
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
