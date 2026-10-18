import React, { useEffect, useState, useRef } from 'react';
import { ZoomIn, ZoomOut, RotateCcw, Crosshair } from 'lucide-react';

interface ImageZoomViewerProps {
  src: string;
  alt: string;
  className?: string;
}

export const ImageZoomViewer: React.FC<ImageZoomViewerProps> = ({
  src,
  alt,
  className = '',
}) => {
  const [scale, setScale] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [showReticle, setShowReticle] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setScale(1);
    setPosition({ x: 0, y: 0 });
  }, [src]);

  const updateScale = (nextScale: number) => {
    setScale(nextScale);
    if (nextScale === 1) setPosition({ x: 0, y: 0 });
  };

  const handleZoomIn = () => updateScale(Math.min(scale + 0.5, 6));
  const handleZoomOut = () => updateScale(Math.max(scale - 0.5, 1));
  const handleSetScale = (newScale: number) => {
    updateScale(newScale);
  };

  const handleReset = () => {
    updateScale(1);
  };

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (scale > 1) {
      setIsDragging(true);
      setDragStart({ x: e.clientX - position.x, y: e.clientY - position.y });
      e.currentTarget.setPointerCapture(e.pointerId);
    }
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (isDragging && scale > 1) {
      setPosition({
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y,
      });
    }
  };

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const delta = e.deltaY < 0 ? 0.25 : -0.25;
    updateScale(Math.max(1, Math.min(6, scale + delta)));
  };

  const handleViewportKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key === '+' || e.key === '=') {
      e.preventDefault();
      handleZoomIn();
    } else if (e.key === '-') {
      e.preventDefault();
      handleZoomOut();
    } else if (e.key === '0' || e.key === 'Home') {
      e.preventDefault();
      handleReset();
    } else if (scale > 1 && e.key.startsWith('Arrow')) {
      e.preventDefault();
      const delta = e.shiftKey ? 40 : 16;
      setPosition((current) => ({
        x: current.x + (e.key === 'ArrowLeft' ? delta : e.key === 'ArrowRight' ? -delta : 0),
        y: current.y + (e.key === 'ArrowUp' ? delta : e.key === 'ArrowDown' ? -delta : 0),
      }));
    }
  };

  return (
    <div className={`relative rounded-2xl border border-cyan-500/20 bg-bio-950 overflow-hidden shadow-2xl glass-panel-elevated reticle-corner ${className}`}>
      {/* Floating HUD Toolbar */}
      <div className="absolute top-3 right-3 z-20 flex items-center gap-1.5 p-1 rounded-xl bg-bio-950/90 backdrop-blur-xl border border-bio-800 text-slate-300 shadow-xl font-mono text-xs select-none">
        {/* Preset quick zoom */}
        <div className="flex items-center gap-1 pr-1 border-r border-bio-800">
          {[1, 2, 4].map((s) => (
            <button
              key={s}
              onClick={() => handleSetScale(s)}
              aria-label={`Set zoom to ${s} times`}
              aria-pressed={scale === s}
              className={`px-2 py-1 rounded text-[11px] transition-colors ${
                scale === s
                  ? 'bg-cyan-950 text-cyan-300 font-bold border border-cyan-700'
                  : 'hover:bg-bio-900 text-slate-400 hover:text-white'
              }`}
            >
              {s}x
            </button>
          ))}
        </div>

        {/* Reticle toggle */}
        <button
          onClick={() => setShowReticle(!showReticle)}
          aria-label="Toggle optical reticle overlay"
          aria-pressed={showReticle}
          className={`p-1.5 rounded transition-colors ${
            showReticle
              ? 'bg-cyan-950 text-cyan-300 border border-cyan-700'
              : 'hover:bg-bio-900 text-slate-400 hover:text-white'
          }`}
          title="Toggle Optical Reticle Overlay"
        >
          <Crosshair className="w-3.5 h-3.5" />
        </button>

        <button
          onClick={handleZoomIn}
          disabled={scale >= 6}
          aria-label="Zoom in"
          className="p-1.5 hover:bg-bio-900 rounded text-slate-300 hover:text-white disabled:opacity-30"
          title="Zoom In"
        >
          <ZoomIn className="w-3.5 h-3.5" />
        </button>
        <button
          onClick={handleZoomOut}
          disabled={scale <= 1}
          aria-label="Zoom out"
          className="p-1.5 hover:bg-bio-900 rounded text-slate-300 hover:text-white disabled:opacity-30"
          title="Zoom Out"
        >
          <ZoomOut className="w-3.5 h-3.5" />
        </button>
        <button
          onClick={handleReset}
          aria-label="Reset viewport"
          className="p-1.5 hover:bg-bio-900 rounded text-slate-300 hover:text-white"
          title="Reset Viewport"
        >
          <RotateCcw className="w-3.5 h-3.5" />
        </button>

        <span className="text-[11px] px-2 py-0.5 text-cyan-400 border-l border-bio-800">
          {Math.round(scale * 100)}%
        </span>
      </div>

      {/* Coordinate HUD in Top Left */}
      <div className="absolute top-3 left-3 z-10 px-2.5 py-1 rounded-lg bg-bio-950/80 backdrop-blur-md border border-bio-800 font-mono text-[10px] text-slate-400 flex items-center gap-2 select-none">
        <span className="text-cyan-400">PAN X: {Math.round(position.x)}px</span>
        <span>&bull;</span>
        <span className="text-cyan-400">PAN Y: {Math.round(position.y)}px</span>
      </div>

      {/* Reticle Overlay */}
      {showReticle && (
        <div className="absolute inset-0 pointer-events-none z-10 flex items-center justify-center">
          <div className="w-full h-px bg-cyan-500/25" />
          <div className="h-full w-px bg-cyan-500/25 absolute" />
          <div className="w-32 h-32 rounded-full border border-cyan-500/30 absolute" />
          <div className="w-64 h-64 rounded-full border border-cyan-500/20 absolute" />
          <Crosshair className="w-6 h-6 text-cyan-400/40 absolute" />
        </div>
      )}

      {/* Interactive Microscope Canvas Area */}
      <div
        ref={containerRef}
        role="group"
        aria-label="Interactive image viewport. Use plus and minus to zoom, arrow keys to pan, and zero to reset."
        tabIndex={0}
        onKeyDown={handleViewportKeyDown}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={() => setIsDragging(false)}
        onPointerCancel={() => setIsDragging(false)}
        onWheel={handleWheel}
        style={{ touchAction: scale > 1 ? 'none' : 'pan-y' }}
        className={`w-full aspect-[4/3] flex items-center justify-center select-none bg-bio-900/95 overflow-hidden ${
          scale > 1 ? (isDragging ? 'cursor-grabbing' : 'cursor-grab') : 'cursor-default'
        }`}
      >
        <img
          src={src}
          alt={alt}
          draggable={false}
          onDragStart={(event) => event.preventDefault()}
          className="max-w-full max-h-full object-contain transition-transform duration-75"
          style={{
            transform: `translate(${position.x}px, ${position.y}px) scale(${scale})`,
          }}
        />
      </div>

      {/* Bottom HUD Bar */}
      <div className="px-4 py-2 bg-bio-950/90 border-t border-bio-800/80 flex items-center justify-between text-[11px] text-slate-400 font-mono select-none">
        <div className="flex items-center gap-2">
          <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
          <span className="text-slate-300">IMAGE VIEWPORT</span>
        </div>
        <div className="flex items-center gap-3 text-slate-500">
          <span>Click &amp; drag to pan</span>
          <span>&bull;</span>
          <span>Scroll to zoom</span>
        </div>
      </div>
    </div>
  );
};
