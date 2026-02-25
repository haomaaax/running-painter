import { useState } from 'react';
import { useRouteStore } from '../store/routeStore';
import { generateRoute, validateRouteInputs } from '../lib/routing/routeGenerator';

export function useRouteGenerator() {
  const [isGenerating, setIsGenerating] = useState(false);

  const idealPath = useRouteStore((state) => state.idealPath);
  const userLocation = useRouteStore((state) => state.userLocation);
  const selectedCenter = useRouteStore((state) => state.selectedCenter);
  const targetDistance = useRouteStore((state) => state.targetDistance);
  const gridMode = useRouteStore((state) => state.gridMode);
  const blockSize = useRouteStore((state) => state.blockSize);

  // Use selected center if available, otherwise fall back to GPS location
  const routeCenter = selectedCenter || userLocation;

  const setProgress = useRouteStore((state) => state.setProgress);
  const setSnappedRoute = useRouteStore((state) => state.setSnappedRoute);
  const setError = useRouteStore((state) => state.setError);
  const error = useRouteStore((state) => state.error);

  const generateRunningRoute = async () => {
    // Validate inputs
    const validation = validateRouteInputs(idealPath, routeCenter, targetDistance);

    if (!validation.valid) {
      setError(validation.error || 'Invalid inputs');
      return;
    }

    setIsGenerating(true);
    setError(null);
    setProgress(0, 'Starting route generation...');

    try {
      const result = await generateRoute(
        idealPath!,
        routeCenter!,
        {
          targetDistance,
          numSegments: 5,              // Reduced from 10 to reduce API overhead
          maxWaypointsPerSegment: 10,  // Reduced from 23 to give Google more routing freedom
          optimizeDistance: false,
          distanceTolerance: 0.15,
          gridMode,
          blockSize,
          onProgress: (progress, step) => {
            setProgress(progress, step);
          },
        }
      );

      setSnappedRoute(result.snappedRoute, result.distance);
      setProgress(100, 'Route ready!');
      setError(null);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Route generation failed';
      setError(errorMessage);
      console.error('Route generation error:', err);
    } finally {
      setIsGenerating(false);
    }
  };

  return {
    generateRoute: generateRunningRoute,
    isGenerating,
    error,
  };
}
