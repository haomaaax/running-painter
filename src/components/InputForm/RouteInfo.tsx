import { useRouteStore } from '../../store/routeStore';
import { calculatePathDistance, formatDistance } from '../../lib/utils/distance';
import { useRouteGenerator } from '../../hooks/useRouteGenerator';

export default function RouteInfo() {
  const idealPath = useRouteStore((state) => state.idealPath);
  const geoPath = useRouteStore((state) => state.geoPath);
  const snappedRoute = useRouteStore((state) => state.snappedRoute);
  const routeDistance = useRouteStore((state) => state.routeDistance);
  const targetDistance = useRouteStore((state) => state.targetDistance);
  const isGenerating = useRouteStore((state) => state.isGenerating);
  const progress = useRouteStore((state) => state.progress);
  const currentStep = useRouteStore((state) => state.currentStep);

  const { generateRoute, error } = useRouteGenerator();

  if (!idealPath || !geoPath) {
    return null;
  }

  const idealDistance = calculatePathDistance(geoPath);
  const hasSnappedRoute = snappedRoute && snappedRoute.length > 0;
  const finalDistance = hasSnappedRoute && routeDistance ? routeDistance : idealDistance;
  const distanceRatio = targetDistance > 0 ? (finalDistance / targetDistance) : 0;
  const percentageOfTarget = (distanceRatio * 100).toFixed(0);

  return (
    <>
      {/* Generate Route Button */}
      {!hasSnappedRoute && (
        <div style={{ marginTop: '20px' }}>
          <button
            onClick={generateRoute}
            disabled={isGenerating}
            style={{
              width: '100%',
              padding: '12px',
              backgroundColor: isGenerating ? '#9ca3af' : '#10b981',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              fontSize: '1rem',
              fontWeight: '600',
              cursor: isGenerating ? 'not-allowed' : 'pointer',
              transition: 'background-color 0.2s',
            }}
            onMouseOver={(e) => {
              if (!isGenerating) {
                e.currentTarget.style.backgroundColor = '#059669';
              }
            }}
            onMouseOut={(e) => {
              if (!isGenerating) {
                e.currentTarget.style.backgroundColor = '#10b981';
              }
            }}
          >
            {isGenerating ? `Generating... ${progress}%` : 'Generate Running Route'}
          </button>

          {/* Progress Info */}
          {isGenerating && currentStep && (
            <div style={{
              marginTop: '8px',
              padding: '8px',
              backgroundColor: '#f3f4f6',
              borderRadius: '4px',
              fontSize: '0.75rem',
              color: '#666',
              textAlign: 'center'
            }}>
              {currentStep}
            </div>
          )}

          {/* Error Display */}
          {error && (
            <div style={{
              marginTop: '8px',
              padding: '12px',
              backgroundColor: '#fef2f2',
              border: '1px solid #fecaca',
              borderRadius: '6px',
              fontSize: '0.875rem',
              color: '#dc2626'
            }}>
              {error}
            </div>
          )}
        </div>
      )}

      {/* Route Stats */}
      <div style={{
        marginTop: '20px',
        padding: '16px',
        backgroundColor: hasSnappedRoute ? '#f0fdf4' : '#eff6ff',
        border: `1px solid ${hasSnappedRoute ? '#86efac' : '#bae6fd'}`,
        borderRadius: '6px'
      }}>
        <h3 style={{
          fontSize: '0.875rem',
          fontWeight: '600',
          color: hasSnappedRoute ? '#166534' : '#0369a1',
          marginBottom: '12px'
        }}>
          {hasSnappedRoute ? 'Generated Route Stats' : 'Ideal Path Preview'}
        </h3>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '0.875rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ color: '#666' }}>Target Distance:</span>
            <span style={{ fontWeight: '600', color: hasSnappedRoute ? '#166534' : '#0369a1' }}>
              {formatDistance(targetDistance)}
            </span>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ color: '#666' }}>{hasSnappedRoute ? 'Actual Distance:' : 'Ideal Distance:'}</span>
            <span style={{ fontWeight: '600', color: hasSnappedRoute ? '#166534' : '#0369a1' }}>
              {formatDistance(finalDistance)}
            </span>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ color: '#666' }}>Accuracy:</span>
            <span style={{ fontWeight: '600', color: hasSnappedRoute ? '#166534' : '#0369a1' }}>
              {percentageOfTarget}% of target
            </span>
          </div>

          {hasSnappedRoute && (
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: '#666' }}>Route Points:</span>
              <span style={{ fontWeight: '600', color: '#166534' }}>
                {snappedRoute.length}
              </span>
            </div>
          )}
        </div>

        <div style={{
          marginTop: '12px',
          paddingTop: '12px',
          borderTop: `1px solid ${hasSnappedRoute ? '#86efac' : '#bae6fd'}`,
          fontSize: '0.75rem',
          color: '#666'
        }}>
          {hasSnappedRoute ? (
            <>
              <p>✓ Green solid line shows navigable route</p>
              <p>✓ Route follows real roads and paths</p>
              <p style={{ marginTop: '4px', fontStyle: 'italic' }}>
                Next: Export to Google Maps (Phase 5)
              </p>
            </>
          ) : (
            <>
              <p>✓ Blue dashed line shows ideal shape</p>
              <p>✓ Green dot = start, Red dot = end</p>
              <p style={{ marginTop: '4px', fontStyle: 'italic' }}>
                Click "Generate Running Route" to snap to roads
              </p>
            </>
          )}
        </div>
      </div>
    </>
  );
}
