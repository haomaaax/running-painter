import { useState } from 'react';
import { useRouteStore } from '../store/routeStore';
import { generateRoute, validateRouteInputs } from '../lib/routing/routeGenerator';

export function useRouteGenerator() {
  const [isGenerating, setIsGenerating] = useState(false);

  const idealPath = useRouteStore((state) => state.idealPath);
  const userLocation = useRouteStore((state) => state.userLocation);
  const targetDistance = useRouteStore((state) => state.targetDistance);

  const setProgress = useRouteStore((state) => state.setProgress);
  const setSnappedRoute = useRouteStore((state) => state.setSnappedRoute);
  const setError = useRouteStore((state) => state.setError);
  const error = useRouteStore((state) => state.error);

  const generateRunningRoute = async () => {
    // Validate inputs
    const validation = validateRouteInputs(idealPath, userLocation, targetDistance);

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
        userLocation!,
        {
          targetDistance,
          numSegments: 5,
          maxWaypointsPerSegment: 8,
          optimizeDistance: true,
          distanceTolerance: 0.15,
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
