import { useState, useEffect } from 'react';
import { useRouteStore } from '../../store/routeStore';
import { AVAILABLE_SHAPES, loadShape } from '../../lib/vectorization/shapeLoader';
import { textToPath } from '../../lib/vectorization/textToPath';
import ShapePreview from './ShapePreview';
import RouteInfo from './RouteInfo';
import ExportPanel from '../Export/ExportPanel';

export default function InputForm() {
  const [localInputType, setLocalInputType] = useState<'text' | 'shape'>('text');
  const [localText, setLocalText] = useState('2026');
  const [localShape, setLocalShape] = useState('heart');
  const [localDistance, setLocalDistance] = useState(10);
  const [isProcessing, setIsProcessing] = useState(false);
  const [previewError, setPreviewError] = useState<string | null>(null);

  const {
    setInput,
    setDistance,
    idealPath,
    setIdealPath,
    error: storeError,
  } = useRouteStore();

  // Generate preview when input changes
  useEffect(() => {
    const generatePreview = async () => {
      setIsProcessing(true);
      setPreviewError(null);

      try {
        if (localInputType === 'text') {
          if (!localText.trim()) {
            setIdealPath(null);
            return;
          }

          const path = await textToPath(localText);
          setIdealPath(path);
          setInput('text', localText);
        } else {
          const path = await loadShape(localShape);
          setIdealPath(path);
          setInput('shape', localShape);
        }
      } catch (error) {
        console.error('Preview generation error:', error);
        setPreviewError(error instanceof Error ? error.message : 'Failed to generate preview');
        setIdealPath(null);
      } finally {
        setIsProcessing(false);
      }
    };

    const timeoutId = setTimeout(generatePreview, 500); // Debounce

    return () => clearTimeout(timeoutId);
  }, [localInputType, localText, localShape, setIdealPath, setInput]);

  // Update distance in store
  useEffect(() => {
    setDistance(localDistance * 1000); // Convert km to meters
  }, [localDistance, setDistance]);

  return (
    <div>
      <h2 style={{ fontSize: '1.25rem', fontWeight: 'bold', marginBottom: '20px' }}>
        Design Your Route
      </h2>

      {/* Input Type Toggle */}
      <div style={{ marginBottom: '20px' }}>
        <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', marginBottom: '8px' }}>
          Input Type
        </label>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button
            onClick={() => setLocalInputType('text')}
            style={{
              flex: 1,
              padding: '8px 16px',
              borderRadius: '6px',
              border: localInputType === 'text' ? '2px solid #2563eb' : '1px solid #d1d5db',
              backgroundColor: localInputType === 'text' ? '#eff6ff' : 'white',
              color: localInputType === 'text' ? '#2563eb' : '#374151',
              fontWeight: localInputType === 'text' ? '600' : '400',
              cursor: 'pointer',
            }}
          >
            Text
          </button>
          <button
            onClick={() => setLocalInputType('shape')}
            style={{
              flex: 1,
              padding: '8px 16px',
              borderRadius: '6px',
              border: localInputType === 'shape' ? '2px solid #2563eb' : '1px solid #d1d5db',
              backgroundColor: localInputType === 'shape' ? '#eff6ff' : 'white',
              color: localInputType === 'shape' ? '#2563eb' : '#374151',
              fontWeight: localInputType === 'shape' ? '600' : '400',
              cursor: 'pointer',
            }}
          >
            Shape
          </button>
        </div>
      </div>

      {/* Text Input */}
      {localInputType === 'text' && (
        <div style={{ marginBottom: '20px' }}>
          <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', marginBottom: '8px' }}>
            Text to Draw
          </label>
          <input
            type="text"
            value={localText}
            onChange={(e) => setLocalText(e.target.value)}
            placeholder="e.g., 2026, LOVE, RUN"
            maxLength={10}
            style={{
              width: '100%',
              padding: '8px 12px',
              border: '1px solid #d1d5db',
              borderRadius: '6px',
              fontSize: '1rem',
            }}
          />
          <p style={{ marginTop: '4px', fontSize: '0.75rem', color: '#6b7280' }}>
            Keep it short (max 10 characters) for better results
          </p>
        </div>
      )}

      {/* Shape Selector */}
      {localInputType === 'shape' && (
        <div style={{ marginBottom: '20px' }}>
          <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', marginBottom: '8px' }}>
            Select Shape
          </label>
          <select
            value={localShape}
            onChange={(e) => setLocalShape(e.target.value)}
            style={{
              width: '100%',
              padding: '8px 12px',
              border: '1px solid #d1d5db',
              borderRadius: '6px',
              fontSize: '1rem',
            }}
          >
            {AVAILABLE_SHAPES.map((shape) => (
              <option key={shape.id} value={shape.id}>
                {shape.name}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Distance Input */}
      <div style={{ marginBottom: '20px' }}>
        <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', marginBottom: '8px' }}>
          Target Distance: {localDistance} km
        </label>
        <input
          type="range"
          min="1"
          max="50"
          step="1"
          value={localDistance}
          onChange={(e) => setLocalDistance(Number(e.target.value))}
          style={{ width: '100%' }}
        />
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: '#6b7280', marginTop: '4px' }}>
          <span>1 km</span>
          <span>50 km</span>
        </div>
      </div>

      {/* Preview */}
      <div style={{ marginBottom: '20px' }}>
        <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', marginBottom: '8px' }}>
          Shape Preview
        </label>
        {isProcessing ? (
          <div style={{
            height: '200px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            border: '1px solid #d1d5db',
            borderRadius: '6px',
            backgroundColor: '#f9fafb'
          }}>
            <p style={{ color: '#6b7280' }}>Generating preview...</p>
          </div>
        ) : (
          <ShapePreview points={idealPath} />
        )}
      </div>

      {/* Errors */}
      {(previewError || storeError) && (
        <div style={{
          padding: '12px',
          backgroundColor: '#fef2f2',
          border: '1px solid #fecaca',
          borderRadius: '6px',
          marginBottom: '20px'
        }}>
          <p style={{ fontSize: '0.875rem', color: '#dc2626' }}>
            {previewError || storeError}
          </p>
        </div>
      )}

      {/* Route Info - shows when path is mapped to geo */}
      <RouteInfo />

      {/* Export Panel - shows when route is generated */}
      <ExportPanel />
    </div>
  );
}
