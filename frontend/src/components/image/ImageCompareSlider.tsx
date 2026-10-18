import React, { useState, useRef, useCallback } from 'react';
import { Columns, SplitSquareVertical, MoveHorizontal } from 'lucide-react';

interface ImageCompareSliderProps {
  originalSrc: string;
  processedSrc: string;
  originalLabel?: string;
  processedLabel?: string;
  className?: string;
}

export const ImageCompareSlider: React.FC<ImageCompareSliderProps> = ({
  originalSrc,
  processedSrc,
  originalLabel = 'Original Input',
  processedLabel = 'Processed Output',
  className = '',
}) => {
  const [sliderPosition, setSliderPosition] = useState(50);
  const [isSideBySide, setIsSideBySide] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleMove = useCallback(
    (clientX: number) => {
      if (!containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const x = clientX - rect.left;
      const width = rect.width;
      const position = Math.max(0, Math.min(100, (x / width) * 100));
      setSliderPosition(position);
    },
    []
  );

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    setIsDragging(true);
    e.currentTarget.setPointerCapture(e.pointerId);
    handleMove(e.clientX);
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (isDragging) handleMove(e.clientX);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    const increments: Record<string, number> = {
      ArrowLeft: -2,
      ArrowRight: 2,
      Home: -sliderPosition,
      End: 100 - sliderPosition,
    };
    if (e.key in increments) {
      e.preventDefault();
      setSliderPosition((position) => Math.max(0, Math.min(100, position + increments[e.key])));
    }
  };

  return (
    <div className={`space-y-3 ${className}`}>
      {/* Mode toggle & Controls */}
      <div className="flex items-center justify-between text-xs px-1 select-none">
        <div className="flex items-center gap-2">
          <span className="font-mono text-slate-400 text-[11px]">VIEWPORT:</span>
          <button
            onClick={() => setIsSideBySide(false)}
            aria-pressed={!isSideBySide}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-xs font-mono transition-colors ${
              !isSideBySide
                ? 'bg-cyan-950 text-cyan-300 border-cyan-700/80 shadow-sm'
                : 'bg-bio-900 text-slate-400 border-bio-800 hover:text-slate-200'
            }`}
          >
            <SplitSquareVertical className="w-3.5 h-3.5" />
            Split Slider
          </button>
          <button
            onClick={() => setIsSideBySide(true)}
            aria-pressed={isSideBySide}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-xs font-mono transition-colors ${
              isSideBySide
                ? 'bg-cyan-950 text-cyan-300 border-cyan-700/80 shadow-sm'
                : 'bg-bio-900 text-slate-400 border-bio-800 hover:text-slate-200'
            }`}
          >
            <Columns className="w-3.5 h-3.5" />
            Side-by-Side
          </button>
        </div>

        {!isSideBySide && (
          <div className="flex items-center gap-1.5 font-mono text-[11px] text-cyan-400 bg-bio-950 px-2 py-0.5 rounded border border-bio-800">
            <MoveHorizontal className="w-3 h-3 text-cyan-500" />
            <span>DIVIDER: {Math.round(sliderPosition)}%</span>
          </div>
        )}
      </div>

      {isSideBySide ? (
        /* Side by Side layout */
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-bio-950 p-3 rounded-2xl border border-bio-800">
          <div className="space-y-1.5">
            <div className="text-[11px] font-mono text-slate-400 px-1 flex items-center justify-between">
              <span className="text-slate-300">{originalLabel}</span>
              <span className="text-bio-400">Baseline Reference</span>
            </div>
            <div className="relative aspect-square w-full rounded-xl overflow-hidden border border-bio-800 bg-bio-900 flex items-center justify-center reticle-corner shadow-inner">
              <img
                src={originalSrc}
                alt={originalLabel}
                className="w-full h-full object-contain"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <div className="text-[11px] font-mono text-cyan-400 px-1 flex items-center justify-between">
              <span className="text-cyan-300 font-semibold">{processedLabel}</span>
              <span className="text-cyan-500">Transformed</span>
            </div>
            <div className="relative aspect-square w-full rounded-xl overflow-hidden border border-cyan-800/60 bg-bio-900 flex items-center justify-center reticle-corner shadow-inner">
              <img
                src={processedSrc}
                alt={processedLabel}
                className="w-full h-full object-contain"
              />
            </div>
          </div>
        </div>
      ) : (
        /* Interactive Split Slider layout */
        <div
          ref={containerRef}
          role="slider"
          aria-label="Image comparison divider"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={Math.round(sliderPosition)}
          aria-valuetext={`${Math.round(sliderPosition)}% original image`}
          tabIndex={0}
          onKeyDown={handleKeyDown}
          onPointerMove={handlePointerMove}
          onPointerDown={handlePointerDown}
          onPointerUp={() => setIsDragging(false)}
          onPointerCancel={() => setIsDragging(false)}
          className="relative aspect-square sm:aspect-[4/3] w-full touch-none rounded-2xl overflow-hidden select-none cursor-ew-resize border border-cyan-500/30 bg-bio-900 shadow-2xl glass-panel-elevated reticle-corner"
        >
          {/* Base: Processed image (full background) */}
          <img
            src={processedSrc}
            alt={processedLabel}
            className="absolute inset-0 w-full h-full object-contain pointer-events-none"
          />

          {/* Top clipped layer: Original image */}
          <div
            className="absolute inset-0 overflow-hidden pointer-events-none"
            style={{ width: `${sliderPosition}%` }}
          >
            <img
              src={originalSrc}
              alt={originalLabel}
              className="absolute inset-0 w-full h-full object-contain max-w-none"
              style={{
                width: containerRef.current ? `${containerRef.current.clientWidth}px` : '100%',
                height: containerRef.current ? `${containerRef.current.clientHeight}px` : '100%',
              }}
            />
          </div>

          {/* Vertical divider line */}
          <div
            className="absolute top-0 bottom-0 w-0.5 bg-gradient-to-b from-cyan-300 via-cyan-400 to-teal-400 shadow-[0_0_12px_rgba(6,182,212,0.9)] cursor-ew-resize pointer-events-none"
            style={{ left: `${sliderPosition}%` }}
          >
            <div className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-8 h-8 rounded-full bg-bio-950/95 border-2 border-cyan-400 shadow-[0_0_15px_rgba(6,182,212,0.7)] flex items-center justify-center pointer-events-none backdrop-blur-md">
              <div className="flex gap-0.5 text-cyan-300 font-bold font-mono text-[10px]">
                <span>&lang;</span>
                <span>&rang;</span>
              </div>
            </div>
          </div>

          {/* Overlay Badges */}
          <div className="absolute top-3 left-3 pointer-events-none">
            <span className="px-2.5 py-1 rounded-lg bg-bio-950/85 backdrop-blur-md border border-bio-700 text-slate-200 text-xs font-mono shadow-sm">
              {originalLabel}
            </span>
          </div>
          <div className="absolute top-3 right-3 pointer-events-none">
            <span className="px-2.5 py-1 rounded-lg bg-bio-950/85 backdrop-blur-md border border-cyan-500/50 text-cyan-300 text-xs font-mono shadow-sm">
              {processedLabel}
            </span>
          </div>
        </div>
      )}
    </div>
  );
};
