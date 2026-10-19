import React from 'react';
import { VisualAnnotation } from '../types/manual';

export interface AnnotationOverlayProps {
  annotations?: VisualAnnotation[];
  interactive?: boolean;
  activeAnnotationId?: string | null;
  onSelectAnnotation?: (id: string) => void;
  /** Custom zoom scale factor (default: 1) */
  zoomScale?: number;
}

/**
 * Enterprise-grade Annotation Overlay
 * Single Source of Truth for rendering visual hotspots, arrows, bounding boxes, and blur areas.
 * Guarantees pixel-perfect coordinate anchoring, sharp OS pointer arrows, and uniform styling across:
 * - ManualView
 * - InteractivePlayer
 * - StepEditorModal
 * - ImageCropModal
 */
export const AnnotationOverlay: React.FC<AnnotationOverlayProps> = ({
  annotations = [],
  interactive = false,
  activeAnnotationId = null,
  onSelectAnnotation,
}) => {
  if (!annotations || annotations.length === 0) return null;

  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden select-none z-20">
      {annotations.map((ann) => {
        const isSelected = activeAnnotationId === ann.id;
        const color = ann.color || '#ef4444';

        // 1. BLUR REGION (PII Anonymization & Sensitive Data)
        if (ann.shape === 'blur') {
          const width = ann.width || 18;
          const height = ann.height || 10;
          return (
            <div
              key={ann.id}
              onClick={(e) => {
                if (interactive && onSelectAnnotation) {
                  e.stopPropagation();
                  onSelectAnnotation(ann.id);
                }
              }}
              style={{
                left: `${ann.x}%`,
                top: `${ann.y}%`,
                width: `${width}%`,
                height: `${height}%`,
                transform: 'translate(-50%, -50%)',
              }}
              className={`absolute backdrop-blur-md bg-slate-800/60 border rounded transition-all ${
                interactive ? 'pointer-events-auto cursor-pointer' : 'pointer-events-none'
              } ${isSelected ? 'border-indigo-400 ring-2 ring-indigo-400/50' : 'border-slate-400'}`}
              title={ann.label || 'Región Difuminada'}
            />
          );
        }

        // 2. ARROW POINTER (Crisp OS Mouse Cursor pointing to exact coordinate)
        if (ann.shape === 'arrow') {
          return (
            <div
              key={ann.id}
              onClick={(e) => {
                if (interactive && onSelectAnnotation) {
                  e.stopPropagation();
                  onSelectAnnotation(ann.id);
                }
              }}
              style={{
                left: `${ann.x}%`,
                top: `${ann.y}%`,
                transform: 'none',
              }}
              className={`absolute select-none z-20 ${
                interactive ? 'pointer-events-auto cursor-pointer' : 'pointer-events-none'
              }`}
            >
              <div className="relative">
                {/* Concentric radar ring and focal center dot at exact tip (0, 0) */}
                <div
                  style={{
                    left: '0px',
                    top: '0px',
                    transform: 'translate(-50%, -50%)',
                    borderColor: color,
                  }}
                  className="w-6 h-6 rounded-full border-2 absolute animate-ping opacity-60"
                />
                <div
                  style={{
                    left: '0px',
                    top: '0px',
                    transform: 'translate(-50%, -50%)',
                    backgroundColor: color,
                  }}
                  className="w-2.5 h-2.5 rounded-full absolute ring-2 ring-white shadow-xs"
                />

                {/* Crisp OS Mouse Pointer Arrow with tip exactly at (0, 0) */}
                <svg
                  width="28"
                  height="28"
                  viewBox="0 0 28 28"
                  className="drop-shadow-xl"
                  style={{ fill: color }}
                >
                  <path
                    d="M 0 0 L 0 20 L 5.5 15.5 L 9.5 24.5 L 12.8 23 L 8.8 14 L 15 14 Z"
                    stroke="#ffffff"
                    strokeWidth="1.8"
                    strokeLinejoin="round"
                  />
                </svg>
              </div>

              {/* Arrow Label */}
              {ann.label && (
                <span
                  style={{ backgroundColor: color }}
                  className="absolute text-white text-[10px] font-bold px-1.5 py-0.5 rounded shadow whitespace-nowrap ml-6 -mt-1 tracking-tight"
                >
                  {ann.label}
                </span>
              )}
            </div>
          );
        }

        // 3. RECTANGLE (Element bounding box highlighting fields / buttons)
        if (ann.shape === 'rect') {
          const width = ann.width || 20;
          const height = ann.height || 12;
          const isNearTop = (ann.y || 0) < 18;
          const pos = ann.labelPosition || (isNearTop ? 'bottom' : 'top');

          let labelStyle: React.CSSProperties = {
            backgroundColor: color,
          };

          if (ann.labelPosition === 'custom' && (ann.labelOffsetX !== undefined || ann.labelOffsetY !== undefined)) {
            labelStyle.top = '0px';
            labelStyle.left = '0px';
            labelStyle.transform = `translate(${ann.labelOffsetX || 0}px, ${ann.labelOffsetY || 0}px)`;
          } else if (pos === 'bottom') {
            labelStyle.bottom = '-26px';
            labelStyle.left = '0';
          } else if (pos === 'inside') {
            labelStyle.top = '6px';
            labelStyle.left = '6px';
          } else if (pos === 'right') {
            labelStyle.top = '0';
            labelStyle.right = '-110px';
          } else {
            labelStyle.top = '-26px';
            labelStyle.left = '0';
          }

          return (
            <div
              key={ann.id}
              onClick={(e) => {
                if (interactive && onSelectAnnotation) {
                  e.stopPropagation();
                  onSelectAnnotation(ann.id);
                }
              }}
              style={{
                left: `${ann.x}%`,
                top: `${ann.y}%`,
                width: `${width}%`,
                height: `${height}%`,
                borderColor: color,
                transform: 'translate(-50%, -50%)',
              }}
              className={`absolute border-2 bg-red-500/15 rounded shadow-lg transition-all ${
                interactive ? 'pointer-events-auto cursor-pointer' : 'pointer-events-none'
              } ${isSelected ? 'ring-2 ring-white/90 scale-102' : ''}`}
            >
              {ann.label && (
                <span
                  style={labelStyle}
                  className="absolute text-white text-[11px] font-bold px-2 py-0.5 rounded shadow whitespace-nowrap z-20 pointer-events-none"
                >
                  {ann.label}
                </span>
              )}
            </div>
          );
        }

        // 4. CIRCLE / RADAR (Default focal target)
        const isNearTop = (ann.y || 0) < 16;
        const isNearBottom = (ann.y || 0) > 82;
        const pos = ann.labelPosition || (isNearTop ? 'bottom' : isNearBottom ? 'top' : 'top');

        let labelStyle: React.CSSProperties = {
          backgroundColor: color,
        };

        if (ann.labelPosition === 'custom' && (ann.labelOffsetX !== undefined || ann.labelOffsetY !== undefined)) {
          labelStyle.top = '0px';
          labelStyle.left = '0px';
          labelStyle.transform = `translate(${ann.labelOffsetX || 0}px, ${ann.labelOffsetY || 0}px)`;
        } else if (pos === 'bottom') {
          labelStyle.top = 'calc(100% + 6px)';
          labelStyle.left = '50%';
          labelStyle.transform = 'translateX(-50%)';
        } else if (pos === 'right') {
          labelStyle.top = '50%';
          labelStyle.left = 'calc(100% + 6px)';
          labelStyle.transform = 'translateY(-50%)';
        } else if (pos === 'left') {
          labelStyle.top = '50%';
          labelStyle.right = 'calc(100% + 6px)';
          labelStyle.transform = 'translateY(-50%)';
        } else if (pos === 'inside') {
          labelStyle.top = '50%';
          labelStyle.left = '50%';
          labelStyle.transform = 'translate(-50%, -50%)';
        } else {
          labelStyle.bottom = 'calc(100% + 6px)';
          labelStyle.left = '50%';
          labelStyle.transform = 'translateX(-50%)';
        }

        return (
          <div
            key={ann.id}
            onClick={(e) => {
              if (interactive && onSelectAnnotation) {
                e.stopPropagation();
                onSelectAnnotation(ann.id);
              }
            }}
            style={{
              left: `${ann.x}%`,
              top: `${ann.y}%`,
              transform: 'translate(-50%, -50%)',
              borderColor: color,
            }}
            className={`absolute w-8 h-8 rounded-full border-[3px] flex items-center justify-center transition-all ${
              interactive ? 'pointer-events-auto cursor-pointer' : 'pointer-events-none'
            } ${isSelected ? 'ring-2 ring-white/90 scale-110' : ''}`}
          >
            <div
              style={{ backgroundColor: color }}
              className="w-4 h-4 rounded-full animate-ping opacity-80"
            />
            <div
              style={{ backgroundColor: color }}
              className="w-3.5 h-3.5 rounded-full absolute"
            />

            {ann.label && (
              <span
                style={labelStyle}
                className="absolute text-white text-[11px] font-bold px-2 py-0.5 rounded shadow whitespace-nowrap z-20 pointer-events-none"
              >
                {ann.label}
              </span>
            )}
          </div>
        );
      })}
    </div>
  );
};
