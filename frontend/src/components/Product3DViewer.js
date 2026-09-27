// Interactive product viewer for the product detail page.
//
// Two modes:
//  1. A real 3D model — when the product has a `model_url` (.glb/.gltf, set in
//     Admin > Product Catalog), it renders with Google's <model-viewer>
//     (loaded once from cdn.jsdelivr.net): orbit, zoom and auto-rotate.
//  2. Interactive photo view (default) — the product photo on a card that the
//     visitor drags/tilts in 3D perspective with a moving light glare, plus a
//     zoom toggle. Works for every product without needing 3D files.
import React, { useEffect, useRef, useState } from 'react';
import { useT } from '../i18n';

const MODEL_VIEWER_SRC = 'https://cdn.jsdelivr.net/npm/@google/model-viewer@3.5.0/dist/model-viewer.min.js';
// Pinned version + subresource-integrity hash: if the CDN ever served a
// different file, the browser refuses to run it (supply-chain protection).
const MODEL_VIEWER_SRI = 'sha384-Ftcjj/GNLxPvzNDftO/oryXB9aGxsGZY9JGqsXG0uUKgQDl9RfDgsx9NJ/4IVNPe';
let modelViewerLoaded = false;
function loadModelViewer() {
  if (modelViewerLoaded || (typeof customElements !== 'undefined' && customElements.get('model-viewer'))) return;
  modelViewerLoaded = true;
  try {
    const s = document.createElement('script');
    s.type = 'module';
    s.src = MODEL_VIEWER_SRC;
    s.integrity = MODEL_VIEWER_SRI;
    s.crossOrigin = 'anonymous';
    document.head.appendChild(s);
  } catch (e) { /* viewer simply won't upgrade; the poster image still shows */ }
}

const clamp = (v, min, max) => Math.min(max, Math.max(min, v));

function TiltViewer({ image, alt, onImgError }) {
  const { t } = useT();
  const boxRef = useRef(null);
  const [rot, setRot] = useState({ x: -8, y: 18 });   // a gentle starting angle so depth is visible
  const [dragging, setDragging] = useState(false);
  const [zoom, setZoom] = useState(1);
  const last = useRef(null);

  const onDown = (e) => {
    const p = e.touches ? e.touches[0] : e;
    last.current = { x: p.clientX, y: p.clientY };
    setDragging(true);
  };
  const onMove = (e) => {
    if (!last.current) return;
    const p = e.touches ? e.touches[0] : e;
    const dx = p.clientX - last.current.x;
    const dy = p.clientY - last.current.y;
    last.current = { x: p.clientX, y: p.clientY };
    setRot(r => ({ x: clamp(r.x - dy * 0.35, -28, 28), y: clamp(r.y + dx * 0.35, -45, 45) }));
  };
  const onUp = () => { last.current = null; setDragging(false); };

  useEffect(() => {
    window.addEventListener('mouseup', onUp);
    window.addEventListener('touchend', onUp);
    return () => { window.removeEventListener('mouseup', onUp); window.removeEventListener('touchend', onUp); };
  }, []);

  // Light glare follows the tilt so the card reads as a 3D object.
  const glareX = 50 - rot.y * 1.2;
  const glareY = 50 + rot.x * 1.2;

  return (
    <div>
      <div
        ref={boxRef}
        role="img" aria-label={alt}
        className="relative w-full aspect-[4/3] select-none touch-none overflow-hidden rounded-2xl bg-gradient-to-br from-gray-100 to-gray-200"
        style={{ perspective: '900px', cursor: dragging ? 'grabbing' : 'grab' }}
        onMouseDown={onDown} onMouseMove={onMove}
        onTouchStart={onDown} onTouchMove={onMove}
      >
        <div
          className="absolute inset-6 sm:inset-10"
          style={{
            transform: `rotateX(${rot.x}deg) rotateY(${rot.y}deg) scale(${zoom})`,
            transformStyle: 'preserve-3d',
            transition: dragging ? 'none' : 'transform 0.35s ease-out',
          }}
        >
          {/* card edge for thickness */}
          <div className="absolute inset-0 rounded-xl bg-gray-400/60" style={{ transform: 'translateZ(-8px)' }} aria-hidden="true"></div>
          <img src={image} alt="" draggable="false"
            className="absolute inset-0 w-full h-full object-cover rounded-xl shadow-2xl"
            onError={onImgError} />
          {/* moving glare */}
          <div className="absolute inset-0 rounded-xl pointer-events-none" aria-hidden="true"
            style={{ background: `radial-gradient(circle at ${glareX}% ${glareY}%, rgba(255,255,255,0.45), rgba(255,255,255,0) 55%)` }}></div>
        </div>
        <span className="absolute bottom-3 left-1/2 -translate-x-1/2 bg-black/50 text-white text-[11px] px-3 py-1 rounded-full pointer-events-none">
          🖐 {t('Drag to rotate')}
        </span>
      </div>
      <div className="flex items-center gap-2 mt-3">
        <button type="button" onClick={() => setZoom(z => clamp(z + 0.2, 0.6, 2))} className="px-3 py-1.5 rounded-lg border border-gray-200 bg-white text-sm font-semibold text-gray-700 hover:bg-gray-50" aria-label={t('Zoom in')}>+</button>
        <button type="button" onClick={() => setZoom(z => clamp(z - 0.2, 0.6, 2))} className="px-3 py-1.5 rounded-lg border border-gray-200 bg-white text-sm font-semibold text-gray-700 hover:bg-gray-50" aria-label={t('Zoom out')}>−</button>
        <button type="button" onClick={() => { setRot({ x: -8, y: 18 }); setZoom(1); }} className="px-3 py-1.5 rounded-lg border border-gray-200 bg-white text-xs font-semibold text-gray-700 hover:bg-gray-50">
          ↺ {t('Reset view')}
        </button>
      </div>
    </div>
  );
}

function GlbViewer({ modelUrl, image, alt }) {
  const { t } = useT();
  useEffect(() => { loadModelViewer(); }, []);
  return (
    <model-viewer
      src={modelUrl}
      poster={image}
      alt={alt}
      camera-controls="true"
      auto-rotate="true"
      shadow-intensity="1"
      style={{ width: '100%', aspectRatio: '4 / 3', borderRadius: '1rem', background: '#f3f4f6' }}
    >
      <div slot="progress-bar"></div>
      <span className="absolute bottom-3 left-1/2 -translate-x-1/2 bg-black/50 text-white text-[11px] px-3 py-1 rounded-full pointer-events-none">
        🖐 {t('Drag to rotate')} · {t('Scroll to zoom')}
      </span>
    </model-viewer>
  );
}

export default function Product3DViewer({ image, alt, modelUrl, onImgError }) {
  const { t } = useT();
  const [mode, setMode] = useState('photo'); // photo | 3d
  const hasGlb = typeof modelUrl === 'string' && /^https:\/\/[^\s"'<>]+\.(glb|gltf)(\?|$)/i.test(modelUrl);

  return (
    <div>
      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm p-3">
        {mode === 'photo' ? (
          <div className="aspect-[4/3] rounded-xl overflow-hidden">
            <img src={image} alt={alt} className="w-full h-full object-cover" loading="lazy" onError={onImgError} />
          </div>
        ) : hasGlb ? (
          <GlbViewer modelUrl={modelUrl} image={image} alt={alt} />
        ) : (
          <TiltViewer image={image} alt={alt} onImgError={onImgError} />
        )}
      </div>
      <div className="flex rounded-xl border border-gray-200 overflow-hidden text-sm font-semibold mt-3 w-max">
        <button type="button" onClick={() => setMode('photo')}
          className={'px-4 py-2 ' + (mode === 'photo' ? 'bg-[#006948] text-white' : 'bg-white text-gray-600 hover:bg-gray-50')}>
          📷 {t('Photo')}
        </button>
        <button type="button" onClick={() => setMode('3d')}
          className={'px-4 py-2 ' + (mode === '3d' ? 'bg-[#006948] text-white' : 'bg-white text-gray-600 hover:bg-gray-50')}>
          🧊 {t('3D View')}
        </button>
      </div>
    </div>
  );
}
