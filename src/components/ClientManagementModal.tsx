import React from 'react';
import { Client } from '../types/client';
import { Project } from '../types/project';
import { UserManual } from '../types/manual';
import {
  X,
  Building2,
  Plus,
  Edit2,
  Trash2,
  FolderKanban,
  BookOpen,
  Check,
  Download,
  ExternalLink,
  Package,
  FileCode2,
  Loader2,
} from 'lucide-react';
import { exportClientAllManualsHtmlZip } from '../utils/clientExportUtils';

interface ClientManagementModalProps {
  isOpen: boolean;
  onClose: () => void;
  clients: Client[];
  activeClientId: string;
  onSelectClient: (clientId: string) => void;
  onOpenNewClientModal: () => void;
  onOpenEditClientModal: (client: Client) => void;
  onDeleteClient: (clientId: string) => void;
  projects: Project[];
  manuals: UserManual[];
  onDownloadMasterIndex: (client: Client) => void;
}

export const ClientManagementModal: React.FC<ClientManagementModalProps> = ({
  isOpen,
  onClose,
  clients,
  activeClientId,
  onSelectClient,
  onOpenNewClientModal,
  onOpenEditClientModal,
  onDeleteClient,
  projects,
  manuals,
  onDownloadMasterIndex,
}) => {
  const [zippingClientId, setZippingClientId] = React.useState<string | null>(null);

  const handleDownloadZip = async (targetClient: Client) => {
    try {
      setZippingClientId(targetClient.id);
      await exportClientAllManualsHtmlZip(targetClient, projects, manuals);
    } catch (err: any) {
      console.error('Error exporting ZIP for client:', err);
    } finally {
      setZippingClientId(null);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-3xl w-full overflow-hidden my-6 animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100 bg-slate-50/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center text-white shadow-sm shadow-indigo-200">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">
                Gestión de Clientes Corporativos
              </h2>
              <p className="text-xs text-slate-500">
                Estructura Jerárquica: Cliente → Proyectos → Manuales
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                onClose();
                onOpenNewClientModal();
              }}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-xs transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Nuevo Cliente</span>
            </button>
            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 max-h-[70vh] overflow-y-auto space-y-3">
          {/* Card: Todos los Clientes (Vista Global) */}
          <div
            className={`p-4 rounded-xl border transition-all flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 ${
              activeClientId === 'all'
                ? 'border-indigo-500 bg-indigo-50/50 shadow-xs'
                : 'border-slate-200 hover:border-slate-300 bg-slate-50/50'
            }`}
          >
            <div className="flex items-center gap-3">
              <div className="w-12 h-10 rounded-lg bg-indigo-100 border border-indigo-200 text-indigo-700 flex items-center justify-center font-extrabold text-base flex-shrink-0">
                🌐
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-extrabold text-slate-900">Todos los Clientes (Vista Global)</h3>
                  {activeClientId === 'all' && (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-700 flex items-center gap-1">
                      <Check className="w-3 h-3" /> Activo
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-500 mt-0.5">
                  Muestra todos los proyectos y manuales de todos los clientes sin filtrar.
                </p>
                <div className="flex items-center gap-3 text-[11px] text-slate-500 font-medium mt-1">
                  <span className="flex items-center gap-1">
                    <FolderKanban className="w-3 h-3 text-indigo-600" />
                    {projects.length} Proyectos en total
                  </span>
                  <span>·</span>
                  <span className="flex items-center gap-1">
                    <BookOpen className="w-3 h-3 text-emerald-600" />
                    {manuals.length} Manuales en total
                  </span>
                </div>
              </div>
            </div>

            <div className="self-end sm:self-center">
              {activeClientId !== 'all' ? (
                <button
                  type="button"
                  onClick={() => {
                    onSelectClient('all');
                    onClose();
                  }}
                  className="px-3.5 py-1.5 text-xs font-bold text-white bg-slate-900 hover:bg-indigo-600 rounded-lg transition-colors"
                >
                  Ver Todos
                </button>
              ) : (
                <div className="px-3 py-1.5 text-xs font-bold text-indigo-700 bg-indigo-100 rounded-lg border border-indigo-200">
                  Seleccionado
                </div>
              )}
            </div>
          </div>

          {clients.length === 0 ? (
            <div className="text-center py-12 text-slate-400">
              <Building2 className="w-12 h-12 mx-auto mb-2 opacity-50" />
              <p className="text-xs font-bold text-slate-600">No hay clientes registrados</p>
              <p className="text-xs text-slate-400 mt-1">
                Crea tu primer cliente corporativo para organizar tus proyectos.
              </p>
            </div>
          ) : (
            clients.map((client) => {
              const clientProjects = projects.filter((p) => p.clientId === client.id);
              const clientManuals = manuals.filter((m) =>
                clientProjects.some((p) => p.id === m.projectId)
              );
              const isSelected = client.id === activeClientId;

              return (
                <div
                  key={client.id}
                  className={`p-4 rounded-xl border transition-all flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 ${
                    isSelected
                      ? 'border-indigo-500 bg-indigo-50/30 shadow-xs'
                      : 'border-slate-200 hover:border-slate-300 bg-white'
                  }`}
                >
                  <div className="flex items-start sm:items-center gap-4 flex-1">
                    {/* Logo */}
                    <div className="w-14 h-12 rounded-lg bg-slate-50 border border-slate-200 p-1 flex items-center justify-center flex-shrink-0">
                      {client.logo ? (
                        <img
                          src={client.logo}
                          alt={client.name}
                          className="max-w-full max-h-full object-contain"
                        />
                      ) : (
                        <Building2 className="w-6 h-6 text-slate-400" />
                      )}
                    </div>

                    {/* Details */}
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-sm font-extrabold text-slate-900">{client.name}</h3>
                        <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-slate-100 text-slate-600">
                          {client.code}
                        </span>
                        {isSelected && (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-700 flex items-center gap-1">
                            <Check className="w-3 h-3" /> Activo
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-500 line-clamp-1 mt-0.5">
                        {client.legalName || client.industry || client.description || 'Cliente Corporativo'}
                      </p>
                      <div className="flex items-center gap-3 text-[11px] text-slate-500 font-medium mt-1">
                        <span className="flex items-center gap-1">
                          <FolderKanban className="w-3 h-3 text-indigo-600" />
                          {clientProjects.length} Proyecto(s)
                        </span>
                        <span>·</span>
                        <span className="flex items-center gap-1">
                          <BookOpen className="w-3 h-3 text-emerald-600" />
                          {clientManuals.length} Manual(es)
                        </span>
                        {client.sapMandante && (
                          <>
                            <span>·</span>
                            <span className="text-indigo-700 font-semibold">{client.sapMandante}</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1.5 self-end sm:self-center flex-wrap">
                    {/* Generar / Descargar Portal Maestro HTML */}
                    <button
                      type="button"
                      onClick={() => onDownloadMasterIndex(client)}
                      className="px-2.5 py-1.5 text-xs font-bold text-indigo-700 hover:text-white bg-indigo-50 hover:bg-indigo-600 border border-indigo-200 rounded-lg shadow-2xs flex items-center gap-1 transition-all cursor-pointer"
                      title={`Descargar Portal Maestro HTML con todos los manuales de ${client.name}`}
                    >
                      <FileCode2 className="w-3.5 h-3.5" />
                      <span>Portal HTML</span>
                    </button>

                    {/* Descargar Paquete ZIP con todos los HTMLs */}
                    <button
                      type="button"
                      onClick={() => handleDownloadZip(client)}
                      disabled={zippingClientId === client.id || clientManuals.length === 0}
                      className="px-2.5 py-1.5 text-xs font-bold text-purple-700 hover:text-white bg-purple-50 hover:bg-purple-600 border border-purple-200 rounded-lg shadow-2xs flex items-center gap-1 transition-all cursor-pointer disabled:opacity-50"
                      title={`Descargar archivo ZIP con todos los manuales interactivos de ${client.name}`}
                    >
                      {zippingClientId === client.id ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <Package className="w-3.5 h-3.5" />
                      )}
                      <span>ZIP HTMLs</span>
                    </button>

                    {/* Editar */}
                    <button
                      type="button"
                      onClick={() => {
                        onClose();
                        onOpenEditClientModal(client);
                      }}
                      className="p-1.5 text-slate-500 hover:text-indigo-600 hover:bg-slate-100 rounded-lg transition-colors"
                      title="Editar información del cliente"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>

                    {/* Eliminar (si no es el único) */}
                    {clients.length > 1 && (
                      <button
                        type="button"
                        onClick={() => {
                          if (
                            window.confirm(
                              `¿Estás seguro de eliminar el cliente "${client.name}"? Los proyectos deberán reasignarse.`
                            )
                          ) {
                            onDeleteClient(client.id);
                          }
                        }}
                        className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        title="Eliminar cliente"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}

                    {/* Seleccionar */}
                    {!isSelected ? (
                      <button
                        type="button"
                        onClick={() => {
                          onSelectClient(client.id);
                          onClose();
                        }}
                        className="px-3 py-1.5 text-xs font-bold text-white bg-slate-900 hover:bg-indigo-600 rounded-lg transition-colors"
                      >
                        Seleccionar
                      </button>
                    ) : (
                      <div className="px-3 py-1.5 text-xs font-bold text-indigo-700 bg-indigo-50 rounded-lg border border-indigo-200">
                        Seleccionado
                      </div>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-slate-100 bg-slate-50/50 text-xs text-slate-500">
          <span>{clients.length} cliente(s) registrados</span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 font-bold text-slate-700 hover:bg-slate-200 rounded-lg transition-colors"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
};
