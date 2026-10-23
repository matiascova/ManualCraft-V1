import React, { memo } from 'react';
import { Table, ExternalLink, Edit3, Trash2, Download } from 'lucide-react';
import { UserManual, ManualStep, getActionTypeSpanish, formatStepOperativeTitle } from '../../types/manual';
import { detectSapTransactionCode, detectSapModuleCode } from '../../utils/sapProcessMatrix';

export interface SapProcessMatrixTableProps {
  manual: UserManual;
  isSap: boolean;
  isZ20: boolean;
  onEditStep: (step: ManualStep) => void;
  onDeleteStep: (stepId: string) => void;
  onOpenExportModal?: () => void;
}

export const SapProcessMatrixTable: React.FC<SapProcessMatrixTableProps> = memo(({
  manual,
  isSap,
  isZ20,
  onEditStep,
  onDeleteStep,
  onOpenExportModal,
}) => {
  return (
    <section
      id="matriz-flujo-proceso"
      className="bg-white rounded-2xl border-2 border-slate-200 overflow-hidden shadow-sm"
    >
      {/* Header matching Official Corporate Template */}
      <div className="bg-[#183B6C] text-white p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Table className="w-4 h-4 text-indigo-300" />
            <span className="text-[10px] uppercase font-bold tracking-widest text-indigo-200">
              SECCIÓN 2 · MATRIZ OFICIAL DEL FLUJO DE PROCESO
            </span>
          </div>
          <h3 className="text-base sm:text-lg font-black text-white tracking-tight">
            Matriz de Secuencia Operativa &amp; {isSap ? 'Transacciones SAP' : 'Acciones'}
          </h3>
          <p className="text-xs text-slate-200 mt-0.5">
            {isSap
              ? isZ20
                ? 'Secuencia completa del proceso y transacción operativa (Transacción ZMMT0020 - Columna de Módulo no requerida).'
                : 'Secuencia completa del proceso, módulo SAP (primera columna) y transacción operativa a utilizar en cada paso.'
              : 'Secuencia cronológica de pasos, acciones y resultados esperados en el sistema.'}
          </p>
        </div>

        {/* Status Pill on Column Rules */}
        <div className="flex items-center gap-2 flex-wrap">
          {isSap && !isZ20 && (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-blue-500/30 border border-blue-300/40 text-blue-100 text-[11px] font-bold rounded-lg backdrop-blur-xs">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>Módulo SAP: 1ª Columna</span>
            </span>
          )}
          {isSap && isZ20 && (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-amber-500/30 border border-amber-300/40 text-amber-100 text-[11px] font-bold rounded-lg backdrop-blur-xs">
              <span>Transacción ZMMT0020 (Módulo oculto)</span>
            </span>
          )}
        </div>
      </div>

      {/* Informative Rule Notice Banner */}
      {isSap && (
        <div className="bg-slate-50 border-b border-slate-200 px-4 py-2.5 flex items-center justify-between text-xs text-slate-600 gap-3">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-semibold text-slate-800">
              {isZ20
                ? 'Transacción ZMMT0020 activa:'
                : 'Transacción SAP activa:'}
            </span>
            <span className="font-mono bg-white px-2 py-0.5 border border-slate-300 rounded font-bold text-[#183B6C]">
              {detectSapTransactionCode(manual)}
            </span>
            {!isZ20 && (
              <span className="font-mono bg-blue-50 text-blue-700 px-2 py-0.5 border border-blue-200 rounded font-bold">
                Módulo {detectSapModuleCode(manual)}
              </span>
            )}
            <span className="text-[11px] text-slate-500 hidden sm:inline">
              {isZ20
                ? 'Norma aplicada: En la transacción ZMMT0020, no es necesario mostrar la columna de módulo.'
                : 'Norma aplicada: El módulo de SAP se presenta como primera columna de la matriz.'}
            </span>
          </div>
          <div className="text-[11px] text-slate-400 font-mono shrink-0">
            {manual.steps.length} pasos indexados
          </div>
        </div>
      )}

      {/* Table Container */}
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="bg-[#183B6C] text-white uppercase text-[10.5px] font-bold tracking-wider">
              {isSap && !isZ20 && (
                <th className="py-3 px-3.5 border-r border-[#264b82] text-center w-24">
                  Módulo
                </th>
              )}
              <th className="py-3 px-3 border-r border-[#264b82] text-center w-12">
                #
              </th>
              <th className="py-3 px-4 border-r border-[#264b82]">
                Paso Operativo
              </th>
              <th className="py-3 px-3.5 border-r border-[#264b82] w-36">
                {isSap ? 'Transacción' : 'Tipo de Acción'}
              </th>
              <th className="py-3 px-3.5 border-r border-[#264b82] w-48">
                {isSap ? 'Acción / Campo Clave' : 'Elemento de Interfaz'}
              </th>
              <th className="py-3 px-4 border-r border-[#264b82]">
                {isSap ? 'Observación / Resultado' : 'Resultado Esperado'}
              </th>
              <th className="py-3 px-3 text-center w-20">
                Acción
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {manual.steps.map((st, sIdx) => {
              const isEven = sIdx % 2 === 0;
              const txCode = isSap ? detectSapTransactionCode(manual, st) : '';
              const modCode = isSap ? detectSapModuleCode(manual, st, txCode) : '';

              return (
                <tr
                  key={st.id}
                  className={`transition-colors hover:bg-indigo-50/40 ${
                    isEven ? 'bg-slate-50/50' : 'bg-white'
                  }`}
                >
                  {/* 1st Column: Módulo SAP (only if SAP and NOT ZMMT0020) */}
                  {isSap && !isZ20 && (
                    <td className="py-2.5 px-3 text-center font-bold border-r border-slate-200/80">
                      <span className="inline-block px-2.5 py-1 rounded bg-blue-100 text-blue-800 text-[10.5px] font-black border border-blue-200 shadow-2xs tracking-wide">
                        {modCode}
                      </span>
                    </td>
                  )}

                  {/* Step Number Badge */}
                  <td className="py-2.5 px-3 text-center border-r border-slate-200/80">
                    <span className="inline-flex items-center justify-center w-6 h-6 rounded-md bg-[#183B6C] text-white font-bold text-[11px] shadow-2xs">
                      {sIdx + 1}
                    </span>
                  </td>

                  {/* Step Title aligned to correlatives */}
                  <td className="py-2.5 px-4 font-bold text-slate-900 border-r border-slate-200/80">
                    <a
                      href={`#step-${st.id}`}
                      className="hover:text-indigo-600 transition-colors block"
                      title="Ir al paso en el manual"
                    >
                      {formatStepOperativeTitle(st.title, sIdx + 1)}
                    </a>
                  </td>

                  {/* Transaction Code or Action Type */}
                  <td className="py-2.5 px-3.5 border-r border-slate-200/80 font-mono text-[11px] font-bold text-[#183B6C]">
                    {isSap ? (
                      <span className="inline-block px-2 py-0.5 rounded bg-indigo-50 border border-indigo-200">
                        {txCode}
                      </span>
                    ) : (
                      <span className="inline-block px-2 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200">
                        {getActionTypeSpanish(st.actionType)}
                      </span>
                    )}
                  </td>

                  {/* Action / Target Element */}
                  <td className="py-2.5 px-3.5 border-r border-slate-200/80 text-slate-700">
                    <span className="font-semibold text-slate-800">
                      {getActionTypeSpanish(st.actionType)}
                    </span>
                    {st.targetElement && (
                      <span className="text-slate-500 font-mono text-[11px] block truncate">
                        · {st.targetElement}
                      </span>
                    )}
                  </td>

                  {/* Observación / Resultado */}
                  <td className="py-2.5 px-4 text-slate-600 leading-snug border-r border-slate-200/80">
                    {st.expectedResult || st.description}
                  </td>

                  {/* Actions: View step, edit or delete */}
                  <td className="py-2.5 px-3 text-center">
                    <div className="flex items-center justify-center gap-1">
                      <a
                        href={`#step-${st.id}`}
                        className="inline-flex items-center justify-center p-1.5 text-indigo-600 hover:text-indigo-800 hover:bg-indigo-50 rounded-lg transition-colors"
                        title="Ver detalle del paso"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                      <button
                        type="button"
                        onClick={() => onEditStep(st)}
                        className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
                        title="Editar contenido y captura del paso"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => onDeleteStep(st.id)}
                        disabled={manual.steps.length <= 1}
                        className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-slate-400 rounded-lg transition-colors"
                        title="Eliminar esta pantalla/paso (reajusta correlativos automáticamente iniciando en 1)"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Table Footer */}
      <div className="p-3 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between text-xs text-slate-500 gap-2">
        <span className="text-[11px]">
          {isSap
            ? isZ20
              ? 'Regla de negocio: En transacción ZMMT0020 la primera columna es el número de paso (#) y se prescinde de la columna Módulo SAP.'
              : 'Regla de negocio: Módulo de SAP activo como primera columna de la matriz oficial del flujo.'
            : 'Tabla sinóptica sincronizada con la exportación oficial a PDF y Word.'}
        </span>
        {onOpenExportModal && (
          <button
            type="button"
            onClick={onOpenExportModal}
            className="inline-flex items-center gap-1.5 text-indigo-600 hover:text-indigo-800 font-semibold text-xs self-start sm:self-auto"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Exportar Matriz Oficial a PDF / Word</span>
          </button>
        )}
      </div>
    </section>
  );
});

SapProcessMatrixTable.displayName = 'SapProcessMatrixTable';
