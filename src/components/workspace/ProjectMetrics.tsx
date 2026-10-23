import React, { memo } from 'react';
import { BookOpen, Layers, Clock, Sliders } from 'lucide-react';

export interface ProjectMetricsProps {
  manualsCount: number;
  totalSteps: number;
  totalMinutes: number;
  activeFeaturesCount: number;
  className?: string;
}

/**
 * Isolated Project KPI Metrics Component.
 * Displays horizontal widescreen cards with project indicators:
 * manual count, procedural step count, estimated duration, and document features.
 */
export const ProjectMetrics = memo(function ProjectMetrics({
  manualsCount,
  totalSteps,
  totalMinutes,
  activeFeaturesCount,
  className = '',
}: ProjectMetricsProps) {
  return (
    <div
      className={`mt-4 pt-3 border-t border-slate-100 grid grid-cols-2 lg:grid-cols-4 gap-3 text-left ${className}`}
    >
      <div className="px-2 py-1 bg-slate-50/80 rounded-lg border border-slate-200/60 flex items-center justify-between">
        <div>
          <div className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">
            Manuales del Proyecto
          </div>
          <div className="text-base font-black text-slate-800 tabular-nums flex items-center gap-1">
            <span>{manualsCount}</span>
            <span className="text-xs font-normal text-slate-500">manual(es)</span>
          </div>
        </div>
        <BookOpen className="w-4 h-4 text-indigo-600" />
      </div>

      <div className="px-2 py-1 bg-slate-50/80 rounded-lg border border-slate-200/60 flex items-center justify-between">
        <div>
          <div className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">
            Pasos Procedimentales
          </div>
          <div className="text-base font-black text-slate-800 tabular-nums flex items-center gap-1">
            <span>{totalSteps}</span>
            <span className="text-xs font-normal text-slate-500">pasos</span>
          </div>
        </div>
        <Layers className="w-4 h-4 text-indigo-600" />
      </div>

      <div className="px-2 py-1 bg-slate-50/80 rounded-lg border border-slate-200/60 flex items-center justify-between">
        <div>
          <div className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">
            Tiempo Total Estimado
          </div>
          <div className="text-base font-black text-slate-800 tabular-nums flex items-center gap-1">
            <span>~{totalMinutes} min</span>
          </div>
        </div>
        <Clock className="w-4 h-4 text-indigo-600" />
      </div>

      <div className="px-2 py-1 bg-slate-50/80 rounded-lg border border-slate-200/60 flex items-center justify-between">
        <div>
          <div className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">
            Características del Doc.
          </div>
          <div className="text-base font-black text-slate-800 tabular-nums flex items-center gap-1">
            <span>{activeFeaturesCount} / 12</span>
            <span className="text-xs font-normal text-slate-500">activas</span>
          </div>
        </div>
        <Sliders className="w-4 h-4 text-emerald-600" />
      </div>
    </div>
  );
});
