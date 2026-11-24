import { useEffect, useRef, useState } from 'react';
import { Bird } from 'lucide-react';
import { drawPixelBird } from '../game/pixelSprites';
import { FlyerId, PHOTO_ASSET_URL } from '../game/types';

interface PixelBirdPreviewProps {
  flyer: FlyerId;
  size?: number;
}

export function PixelBirdPreview({ flyer, size = 44 }: PixelBirdPreviewProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [imgError, setImgError] = useState(false);

  useEffect(() => {
    if (flyer === 'photo') return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.imageSmoothingEnabled = false;
    ctx.save();
    ctx.translate(canvas.width / 2, canvas.height / 2);
    drawPixelBird(ctx, flyer, 1, 2, -8.5, -6.5);
    ctx.restore();
  }, [flyer]);

  if (flyer === 'photo') {
    if (imgError) {
      return (
        <div
          style={{ width: size, height: size }}
          className="flex items-center justify-center rounded-md bg-slate-800 border border-slate-700 text-sky-400 shrink-0"
        >
          <Bird className="w-5 h-5" />
        </div>
      );
    }

    return (
      <div
        style={{ width: size, height: size }}
        className="relative overflow-hidden rounded-md border-2 border-slate-900 bg-slate-800 shrink-0"
      >
        <img
          src={PHOTO_ASSET_URL}
          alt="Photo Flyer portrait"
          referrerPolicy="no-referrer"
          onError={() => setImgError(true)}
          className="w-full h-full object-cover object-top"
        />
      </div>
    );
  }

  return (
    <canvas
      ref={canvasRef}
      width={40}
      height={32}
      style={{ width: size, height: Math.round(size * 0.8) }}
      className="pixelated shrink-0"
      aria-hidden="true"
    />
  );
}
