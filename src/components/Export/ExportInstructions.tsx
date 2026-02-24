interface ExportInstructionsProps {
  onClose: () => void;
}

export default function ExportInstructions({ onClose }: ExportInstructionsProps) {
  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
        padding: '20px',
      }}
      onClick={onClose}
    >
      <div
        style={{
          backgroundColor: 'white',
          borderRadius: '8px',
          maxWidth: '600px',
          maxHeight: '80vh',
          overflow: 'auto',
          padding: '24px',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 'bold', margin: 0 }}>
            How to Use Your Route
          </h2>
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              fontSize: '1.5rem',
              cursor: 'pointer',
              padding: '4px 8px',
            }}
          >
            ×
          </button>
        </div>

        <div style={{ fontSize: '0.875rem', lineHeight: '1.6' }}>
          {/* GPX File Instructions */}
          <section style={{ marginBottom: '24px' }}>
            <h3 style={{ fontSize: '1rem', fontWeight: '600', marginBottom: '12px', color: '#10b981' }}>
              📥 GPX File
            </h3>
            <p style={{ marginBottom: '8px', color: '#666' }}>
              The GPX file can be imported to various GPS apps and devices:
            </p>

            <div style={{ marginLeft: '16px' }}>
              <h4 style={{ fontSize: '0.875rem', fontWeight: '600', marginTop: '12px', marginBottom: '8px' }}>
                iOS (iPhone/iPad):
              </h4>
              <ol style={{ marginLeft: '20px', color: '#666' }}>
                <li>Download the GPX file</li>
                <li>Open in Files app → tap the file</li>
                <li>Choose "Share" → "Import with [App Name]"</li>
                <li>Apps: Google Maps, Strava, AllTrails, Komoot, MapMyRun</li>
              </ol>

              <h4 style={{ fontSize: '0.875rem', fontWeight: '600', marginTop: '12px', marginBottom: '8px' }}>
                Android:
              </h4>
              <ol style={{ marginLeft: '20px', color: '#666' }}>
                <li>Download the GPX file</li>
                <li>Open with your preferred GPS app</li>
                <li>Apps: Google Maps, Strava, AllTrails, Komoot, OruxMaps</li>
              </ol>

              <h4 style={{ fontSize: '0.875rem', fontWeight: '600', marginTop: '12px', marginBottom: '8px' }}>
                Desktop:
              </h4>
              <ol style={{ marginLeft: '20px', color: '#666' }}>
                <li>Import to Garmin Connect, Strava, or similar</li>
                <li>Sync to your GPS watch/device</li>
              </ol>
            </div>
          </section>

          {/* Google Maps Instructions */}
          <section style={{ marginBottom: '24px' }}>
            <h3 style={{ fontSize: '1rem', fontWeight: '600', marginBottom: '12px', color: '#3b82f6' }}>
              🗺️ Google Maps
            </h3>
            <p style={{ marginBottom: '8px', color: '#666' }}>
              Opens the route directly in Google Maps:
            </p>

            <ol style={{ marginLeft: '20px', color: '#666' }}>
              <li>Click "Open in Google Maps"</li>
              <li>The route opens with waypoints</li>
              <li>On mobile: Opens in Google Maps app</li>
              <li>On desktop: Opens in web browser</li>
              <li>Tap "Start" to begin navigation</li>
            </ol>

            <div style={{
              marginTop: '12px',
              padding: '12px',
              backgroundColor: '#eff6ff',
              borderRadius: '6px',
              fontSize: '0.75rem'
            }}>
              <strong>Note:</strong> Due to waypoint limits, complex routes are simplified.
              The shape may not be perfect, but the route is navigable.
            </div>
          </section>

          {/* Copy URL Instructions */}
          <section style={{ marginBottom: '24px' }}>
            <h3 style={{ fontSize: '1rem', fontWeight: '600', marginBottom: '12px', color: '#6b7280' }}>
              📋 Copy URL
            </h3>
            <p style={{ marginBottom: '8px', color: '#666' }}>
              Share the route with others:
            </p>

            <ol style={{ marginLeft: '20px', color: '#666' }}>
              <li>Click "Copy Google Maps URL"</li>
              <li>URL is copied to clipboard</li>
              <li>Share via text, email, or social media</li>
              <li>Recipients can open in Google Maps</li>
            </ol>
          </section>

          {/* Tips */}
          <section>
            <h3 style={{ fontSize: '1rem', fontWeight: '600', marginBottom: '12px' }}>
              💡 Tips
            </h3>
            <ul style={{ marginLeft: '20px', color: '#666' }}>
              <li>GPX is best for GPS watches (Garmin, Suunto, etc.)</li>
              <li>Google Maps works great for phones</li>
              <li>Test the route in your area before running</li>
              <li>Bring your phone for GPS tracking</li>
              <li>Routes follow sidewalks and paths when available</li>
            </ul>
          </section>

          {/* Alternative Apps */}
          <section style={{ marginTop: '20px', padding: '12px', backgroundColor: '#f9fafb', borderRadius: '6px' }}>
            <h4 style={{ fontSize: '0.875rem', fontWeight: '600', marginBottom: '8px' }}>
              Recommended Apps:
            </h4>
            <ul style={{ marginLeft: '20px', fontSize: '0.75rem', color: '#666' }}>
              <li><strong>Strava:</strong> Track runs, import GPX</li>
              <li><strong>AllTrails:</strong> Hiking/running routes</li>
              <li><strong>Komoot:</strong> Route planning</li>
              <li><strong>MapMyRun:</strong> Running tracker</li>
              <li><strong>Google Maps:</strong> Navigation</li>
            </ul>
          </section>
        </div>

        <div style={{ marginTop: '24px', textAlign: 'center' }}>
          <button
            onClick={onClose}
            style={{
              padding: '10px 24px',
              backgroundColor: '#10b981',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              fontSize: '0.875rem',
              fontWeight: '600',
              cursor: 'pointer',
            }}
          >
            Got it!
          </button>
        </div>
      </div>
    </div>
  );
}
