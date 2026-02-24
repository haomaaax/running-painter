import { LatLng } from '../../types/route';
import { saveAs } from 'file-saver';

/**
 * Generate GPX XML content from a route
 * GPX format: https://www.topografix.com/GPX/1/1/
 */
export function generateGPX(
  route: LatLng[],
  name: string,
  description?: string
): string {
  const now = new Date().toISOString();

  // Generate track points with timestamps (1 second intervals)
  const trackPoints = route
    .map((point, index) => {
      const timestamp = new Date(Date.now() + index * 1000).toISOString();
      return `      <trkpt lat="${point.lat.toFixed(6)}" lon="${point.lng.toFixed(6)}">
        <ele>0</ele>
        <time>${timestamp}</time>
      </trkpt>`;
    })
    .join('\n');

  // Generate GPX XML
  const gpx = `<?xml version="1.0" encoding="UTF-8"?>
<gpx version="1.1"
     creator="Running Route Painter - https://claude.com/claude-code"
     xmlns="http://www.topografix.com/GPX/1/1"
     xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
     xsi:schemaLocation="http://www.topografix.com/GPX/1/1 http://www.topografix.com/GPX/1/1/gpx.xsd">
  <metadata>
    <name>${escapeXml(name)}</name>
    ${description ? `<desc>${escapeXml(description)}</desc>` : ''}
    <time>${now}</time>
  </metadata>
  <trk>
    <name>${escapeXml(name)}</name>
    ${description ? `<desc>${escapeXml(description)}</desc>` : ''}
    <type>running</type>
    <trkseg>
${trackPoints}
    </trkseg>
  </trk>
</gpx>`;

  return gpx;
}

/**
 * Export route as GPX file (download to user's device)
 */
export function exportAsGPX(
  route: LatLng[],
  name: string,
  description?: string
): void {
  if (route.length === 0) {
    throw new Error('Route is empty');
  }

  const gpxContent = generateGPX(route, name, description);
  const blob = new Blob([gpxContent], { type: 'application/gpx+xml' });
  const fileName = `${sanitizeFileName(name)}.gpx`;

  saveAs(blob, fileName);
}

/**
 * Escape XML special characters
 */
function escapeXml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

/**
 * Sanitize filename for safe download
 */
function sanitizeFileName(name: string): string {
  return name
    .replace(/[^a-z0-9_\-]/gi, '_')
    .replace(/_+/g, '_')
    .toLowerCase();
}

/**
 * Generate route statistics for GPX description
 */
export function generateRouteDescription(
  distance: number,
  shape: string,
  date: Date = new Date()
): string {
  const distanceKm = (distance / 1000).toFixed(1);
  const dateStr = date.toLocaleDateString();

  return `Running route shaped like "${shape}" - ${distanceKm} km. Created with Running Route Painter on ${dateStr}.`;
}

/**
 * Validate route before export
 */
export function validateRouteForExport(route: LatLng[]): {
  valid: boolean;
  error?: string;
} {
  if (!route || route.length === 0) {
    return { valid: false, error: 'No route to export' };
  }

  if (route.length < 2) {
    return { valid: false, error: 'Route must have at least 2 points' };
  }

  // Check for valid coordinates
  for (const point of route) {
    if (
      isNaN(point.lat) ||
      isNaN(point.lng) ||
      point.lat < -90 ||
      point.lat > 90 ||
      point.lng < -180 ||
      point.lng > 180
    ) {
      return { valid: false, error: 'Route contains invalid coordinates' };
    }
  }

  return { valid: true };
}
