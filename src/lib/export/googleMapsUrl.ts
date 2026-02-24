import { LatLng } from '../../types/route';
import { samplePointsByDistance } from '../routing/segmentation';

/**
 * Generate Google Maps URL for navigation
 * URL has character limits, so we sample waypoints
 */
export function generateGoogleMapsUrl(route: LatLng[]): string {
  if (route.length === 0) {
    throw new Error('Route is empty');
  }

  // Google Maps URL supports up to ~10 waypoints for reasonable URL length
  // Sample route to get key waypoints
  const maxWaypoints = 9;
  const waypoints = route.length > maxWaypoints
    ? samplePointsByDistance(route, maxWaypoints)
    : route;

  const origin = waypoints[0];
  const destination = waypoints[waypoints.length - 1];
  const intermediateWaypoints = waypoints.slice(1, -1);

  // Build URL using Google Maps Directions URL scheme
  const originStr = `${origin.lat},${origin.lng}`;
  const destStr = `${destination.lat},${destination.lng}`;

  let url = `https://www.google.com/maps/dir/?api=1&origin=${originStr}&destination=${destStr}&travelmode=walking`;

  if (intermediateWaypoints.length > 0) {
    const waypointsStr = intermediateWaypoints
      .map(wp => `${wp.lat},${wp.lng}`)
      .join('|');
    url += `&waypoints=${waypointsStr}`;
  }

  return url;
}

/**
 * Generate Google Maps search URL (shows the route area)
 */
export function generateGoogleMapsSearchUrl(center: LatLng, zoom: number = 14): string {
  return `https://www.google.com/maps/@${center.lat},${center.lng},${zoom}z`;
}

/**
 * Generate shareable Google Maps link with route encoded in URL
 * This creates a link that can be shared via text/email
 */
export function generateShareableUrl(
  route: LatLng[],
  name: string,
  distance: number
): string {
  const googleMapsUrl = generateGoogleMapsUrl(route);
  const encodedName = encodeURIComponent(name);
  const distanceKm = (distance / 1000).toFixed(1);

  // For now, just return the Google Maps URL
  // In a real app, you might use a URL shortener or custom backend
  return googleMapsUrl;
}

/**
 * Copy text to clipboard
 */
export async function copyToClipboard(text: string): Promise<void> {
  try {
    await navigator.clipboard.writeText(text);
  } catch (error) {
    // Fallback for older browsers
    const textArea = document.createElement('textarea');
    textArea.value = text;
    textArea.style.position = 'fixed';
    textArea.style.left = '-999999px';
    document.body.appendChild(textArea);
    textArea.select();

    try {
      document.execCommand('copy');
    } catch (err) {
      throw new Error('Failed to copy to clipboard');
    } finally {
      document.body.removeChild(textArea);
    }
  }
}

/**
 * Open URL in new tab/window
 */
export function openInNewTab(url: string): void {
  window.open(url, '_blank', 'noopener,noreferrer');
}

/**
 * Detect if user is on mobile device
 */
export function isMobileDevice(): boolean {
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
    navigator.userAgent
  );
}

/**
 * Generate deep link for Google Maps mobile app
 * This opens directly in the app if installed
 */
export function generateGoogleMapsAppUrl(route: LatLng[]): string {
  const webUrl = generateGoogleMapsUrl(route);

  // On mobile, try to use the app scheme
  if (isMobileDevice()) {
    // Extract the parameters from web URL
    const url = new URL(webUrl);
    const params = new URLSearchParams(url.search);

    // Build comgooglemaps:// URL for app
    const origin = params.get('origin');
    const destination = params.get('destination');
    const waypoints = params.get('waypoints');

    let appUrl = `comgooglemaps://?daddr=${destination}&directionsmode=walking`;

    if (waypoints) {
      appUrl += `&waypoints=${waypoints}`;
    }

    return appUrl;
  }

  return webUrl;
}

/**
 * Calculate estimated URL length
 */
export function estimateUrlLength(route: LatLng[]): number {
  const url = generateGoogleMapsUrl(route);
  return url.length;
}

/**
 * Validate route for URL export
 */
export function validateRouteForUrl(route: LatLng[]): {
  valid: boolean;
  error?: string;
  warning?: string;
} {
  if (!route || route.length === 0) {
    return { valid: false, error: 'No route to export' };
  }

  if (route.length < 2) {
    return { valid: false, error: 'Route must have at least 2 points' };
  }

  const urlLength = estimateUrlLength(route);

  if (urlLength > 2000) {
    return {
      valid: true,
      warning: 'Route is complex and will be simplified for URL export',
    };
  }

  return { valid: true };
}
