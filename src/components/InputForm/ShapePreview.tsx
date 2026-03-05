import { useEffect, useRef } from 'react';
import { Point2D } from '../../types/route';

interface ShapePreviewProps {
  points: Point2D[] | null;
  width?: number;
  height?: number;
}

export default function ShapePreview({ points, width = 300, height = 200 }: ShapePreviewProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear canvas
    ctx.clearRect(0, 0, width, height);

    // Draw grid background
    ctx.strokeStyle = '#f0f0f0';
    ctx.lineWidth = 1;

    for (let x = 0; x <= width; x += 20) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height);
      ctx.stroke();
    }

    for (let y = 0; y <= height; y += 20) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
      ctx.stroke();
    }

    if (!points || points.length === 0) {
      // Show placeholder text
      ctx.fillStyle = '#999';
      ctx.font = '14px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('Shape preview will appear here', width / 2, height / 2);
      return;
    }

    // Scale points to fit canvas with padding
    const padding = 20;
    const scaleX = width - padding * 2;
    const scaleY = height - padding * 2;

    // Draw path
    ctx.strokeStyle = '#2563eb';
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    ctx.beginPath();

    points.forEach((point, index) => {
      const x = point.x * scaleX + padding;
      const y = point.y * scaleY + padding;

      if (index === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    });

    ctx.stroke();

    // Draw points
    ctx.fillStyle = '#ef4444';
    points.forEach((point) => {
      const x = point.x * scaleX + padding;
      const y = point.y * scaleY + padding;

      ctx.beginPath();
      ctx.arc(x, y, 3, 0, Math.PI * 2);
      ctx.fill();
    });

    // Show point count
    ctx.fillStyle = '#666';
    ctx.font = '12px monospace';
    ctx.textAlign = 'right';
    ctx.textBaseline = 'top';
    ctx.fillText(`${points.length} points`, width - 10, 10);

  }, [points, width, height]);

  return (
    <div className="border border-gray-300 rounded-md overflow-hidden">
      <canvas
        ref={canvasRef}
        width={width}
        height={height}
        style={{ display: 'block' }}
      />
    </div>
  );
}
