import { useState } from 'react';
import { useRouteStore } from '../store/routeStore';
import { generateRoute, validateRouteInputs } from '../lib/routing/routeGenerator';

export function useRouteGenerator() {
  const [isGenerating, setIsGenerating] = useState(false);

  const idealPath = useRouteStore((state) => state.idealPath);
  const userLocation = useRouteStore((state) => state.userLocation);
  const selectedCenter = useRouteStore((state) => state.selectedCenter);
  const targetDistance = useRouteStore((state) => state.targetDistance);
  const inputType = useRouteStore((state) => state.inputType);
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

    const effectiveGridMode = gridMode && inputType === 'shape';

    try {
      const result = await generateRoute(
        idealPath!,
        routeCenter!,
        {
          targetDistance,
          numSegments: 8,              // Higher segmentation improves local shape adherence
          maxWaypointsPerSegment: 18,  // Denser waypoints reduce large detours between anchors
          optimizeDistance: false,
          distanceTolerance: 0.15,
          gridMode: effectiveGridMode,
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
