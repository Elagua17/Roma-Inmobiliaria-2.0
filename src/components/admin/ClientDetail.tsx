import { X, Pencil, Eye, Trash2 } from 'lucide-react';
import { Client } from '@/types';

function ClientDetail({
  client,
  onClose,
  onEdit,
  onDelete,
}: {
  client: Client;
  onClose: () => void;
  onEdit: () => void;
  onDelete: () => void;
}) {
  return (
    <div className="bg-white border border-primary-100 rounded-2xl p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <button onClick={onClose} className="p-2 -ml-2 text-primary-400 hover:text-primary-700 hover:bg-primary-50 rounded-lg transition-colors">
            <X className="w-5 h-5" />
          </button>
          <h2 className="text-xl font-bold text-primary-900">Detalle del Cliente</h2>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={onEdit} className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-primary-700 bg-primary-50 hover:bg-primary-100 rounded-lg transition-colors">
            <Pencil className="w-4 h-4" />
            Editar
          </button>
          <button onClick={onDelete} className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-red-500 bg-red-500/10 hover:bg-red-500/20 rounded-lg transition-colors">
            <Trash2 className="w-4 h-4" />
            Eliminar
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div>
          <h3 className="text-sm font-semibold text-primary-900 border-b border-primary-100 pb-2 mb-4">Información Personal</h3>
          <dl className="space-y-4 text-sm">
            <div>
              <dt className="text-primary-500 mb-1">Nombre completo</dt>
              <dd className="font-semibold text-primary-900">{client.first_name} {client.last_name}</dd>
            </div>
            <div>
              <dt className="text-primary-500 mb-1">Teléfono</dt>
              <dd className="font-medium text-primary-900">{client.phone || '-'}</dd>
            </div>
            <div>
              <dt className="text-primary-500 mb-1">Email</dt>
              <dd className="font-medium text-primary-900">{client.email || '-'}</dd>
            </div>
            <div>
              <dt className="text-primary-500 mb-1">Notas adicionales</dt>
              <dd className="text-primary-700 whitespace-pre-line">{client.notes || '-'}</dd>
            </div>
          </dl>
        </div>

        <div>
          <h3 className="text-sm font-semibold text-primary-900 border-b border-primary-100 pb-2 mb-4">Propiedades Asociadas ({client.properties?.length || 0})</h3>
          {client.properties && client.properties.length > 0 ? (
            <div className="space-y-2">
              {client.properties.map((p) => (
                <div key={p.id} className="flex items-center justify-between p-3 bg-primary-50 rounded-xl border border-primary-100">
                  <div>
                    <div className="text-xs font-semibold text-primary-500 mb-0.5">{p.ref_code}</div>
                    <div className="text-sm font-semibold text-primary-900 line-clamp-1">{p.title}</div>
                  </div>
                  <a href={`/propiedad/${encodeURIComponent(p.id)}`} target="_blank" rel="noopener noreferrer" className="p-2 text-primary-600 hover:text-primary-900 hover:bg-primary-100 rounded-lg transition-colors">
                    <Eye className="w-4 h-4" />
                  </a>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-primary-500">Este cliente no tiene propiedades asignadas aún.</p>
          )}
        </div>
      </div>
    </div>
  );
}

export default ClientDetail;
