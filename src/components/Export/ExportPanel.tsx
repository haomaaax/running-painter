import { useState } from 'react';
import { useExport } from '../../hooks/useExport';
import ExportInstructions from './ExportInstructions';

export default function ExportPanel() {
  const [showInstructions, setShowInstructions] = useState(false);
  const { exportGPX, openInGoogleMaps, copyGoogleMapsUrl, hasRoute, copied, exportError } = useExport();

  if (!hasRoute) {
    return null;
  }

  return (
    <>
      <div style={{
        marginTop: '20px',
        padding: '16px',
        backgroundColor: '#f0fdf4',
        border: '1px solid #86efac',
        borderRadius: '6px'
      }}>
        <h3 style={{ fontSize: '0.875rem', fontWeight: '600', color: '#166534', marginBottom: '12px' }}>
          Export Your Route
        </h3>

        {/* Export Buttons */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {/* GPX Download */}
          <button
            onClick={exportGPX}
            style={{
              padding: '10px 16px',
              backgroundColor: '#10b981',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              fontSize: '0.875rem',
              fontWeight: '600',
              cursor: 'pointer',
              transition: 'background-color 0.2s',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px'
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.backgroundColor = '#059669';
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.backgroundColor = '#10b981';
            }}
          >
            <span>📥</span>
            Download GPX File
          </button>

          {/* Open in Google Maps */}
          <button
            onClick={openInGoogleMaps}
            style={{
              padding: '10px 16px',
              backgroundColor: '#3b82f6',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              fontSize: '0.875rem',
              fontWeight: '600',
              cursor: 'pointer',
              transition: 'background-color 0.2s',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px'
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.backgroundColor = '#2563eb';
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.backgroundColor = '#3b82f6';
            }}
          >
            <span>🗺️</span>
            Open in Google Maps
          </button>

          {/* Copy URL */}
          <button
            onClick={copyGoogleMapsUrl}
            style={{
              padding: '10px 16px',
              backgroundColor: copied ? '#22c55e' : '#6b7280',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              fontSize: '0.875rem',
              fontWeight: '600',
              cursor: 'pointer',
              transition: 'background-color 0.2s',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px'
            }}
            onMouseOver={(e) => {
              if (!copied) {
                e.currentTarget.style.backgroundColor = '#4b5563';
              }
            }}
            onMouseOut={(e) => {
              if (!copied) {
                e.currentTarget.style.backgroundColor = '#6b7280';
              }
            }}
          >
            <span>{copied ? '✓' : '📋'}</span>
            {copied ? 'URL Copied!' : 'Copy Google Maps URL'}
          </button>
        </div>

        {/* Export Error */}
        {exportError && (
          <div style={{
            marginTop: '12px',
            padding: '8px',
            backgroundColor: '#fef2f2',
            border: '1px solid #fecaca',
            borderRadius: '4px',
            fontSize: '0.75rem',
            color: '#dc2626'
          }}>
            {exportError}
          </div>
        )}

        {/* Help Link */}
        <div style={{
          marginTop: '12px',
          paddingTop: '12px',
          borderTop: '1px solid #86efac'
        }}>
          <button
            onClick={() => setShowInstructions(true)}
            style={{
              background: 'none',
              border: 'none',
              color: '#166534',
              fontSize: '0.75rem',
              textDecoration: 'underline',
              cursor: 'pointer',
              padding: 0
            }}
          >
            ℹ️ How to use exported routes
          </button>
        </div>

        {/* Quick Tips */}
        <div style={{
          marginTop: '8px',
          fontSize: '0.75rem',
          color: '#666'
        }}>
          <p>• GPX: Import to GPS devices/apps</p>
          <p>• Google Maps: Navigate on mobile</p>
          <p>• URL: Share with friends</p>
        </div>
      </div>

      {/* Instructions Modal */}
      {showInstructions && (
        <ExportInstructions onClose={() => setShowInstructions(false)} />
      )}
    </>
  );
}
