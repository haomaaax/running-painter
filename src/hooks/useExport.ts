import { useState } from 'react';
import { useRouteStore } from '../store/routeStore';
import {
  exportAsGPX,
  generateRouteDescription,
  validateRouteForExport,
} from '../lib/export/gpxGenerator';
import {
  generateGoogleMapsUrl,
  generateGoogleMapsAppUrl,
  copyToClipboard,
  openInNewTab,
  isMobileDevice,
  validateRouteForUrl,
} from '../lib/export/googleMapsUrl';

export function useExport() {
  const [copied, setCopied] = useState(false);
  const [exportError, setExportError] = useState<string | null>(null);

  const snappedRoute = useRouteStore((state) => state.snappedRoute);
  const routeDistance = useRouteStore((state) => state.routeDistance);
  const inputValue = useRouteStore((state) => state.inputValue);
  const inputType = useRouteStore((state) => state.inputType);

  const handleExportGPX = () => {
    setExportError(null);

    if (!snappedRoute) {
      setExportError('No route to export. Please generate a route first.');
      return;
    }

    const validation = validateRouteForExport(snappedRoute);
    if (!validation.valid) {
      setExportError(validation.error || 'Invalid route');
      return;
    }

    try {
      const routeName = inputValue || 'Running Route';
      const description = generateRouteDescription(
        routeDistance || 0,
        routeName
      );

      exportAsGPX(snappedRoute, routeName, description);
    } catch (error) {
      setExportError(
        error instanceof Error ? error.message : 'Failed to export GPX'
      );
    }
  };

  const handleOpenInGoogleMaps = () => {
    setExportError(null);

    if (!snappedRoute) {
      setExportError('No route to export. Please generate a route first.');
      return;
    }

    const validation = validateRouteForUrl(snappedRoute);
    if (!validation.valid) {
      setExportError(validation.error || 'Invalid route');
      return;
    }

    try {
      const url = isMobileDevice()
        ? generateGoogleMapsAppUrl(snappedRoute)
        : generateGoogleMapsUrl(snappedRoute);

      openInNewTab(url);
    } catch (error) {
      setExportError(
        error instanceof Error ? error.message : 'Failed to open Google Maps'
      );
    }
  };

  const handleCopyGoogleMapsUrl = async () => {
    setExportError(null);
    setCopied(false);

    if (!snappedRoute) {
      setExportError('No route to export. Please generate a route first.');
      return;
    }

    const validation = validateRouteForUrl(snappedRoute);
    if (!validation.valid) {
      setExportError(validation.error || 'Invalid route');
      return;
    }

    try {
      const url = generateGoogleMapsUrl(snappedRoute);
      await copyToClipboard(url);
      setCopied(true);

      // Reset copied state after 3 seconds
      setTimeout(() => setCopied(false), 3000);
    } catch (error) {
      setExportError(
        error instanceof Error ? error.message : 'Failed to copy URL'
      );
    }
  };

  const hasRoute = snappedRoute && snappedRoute.length > 0;

  return {
    exportGPX: handleExportGPX,
    openInGoogleMaps: handleOpenInGoogleMaps,
    copyGoogleMapsUrl: handleCopyGoogleMapsUrl,
    hasRoute,
    copied,
    exportError,
  };
}
