import { useState, useEffect, useCallback } from 'react';
import { Users, Search, Pencil, UserPlus, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { supabase } from '@/lib/supabase';
import { Client } from '@/types';
import ClientDetail from './ClientDetail';
import ClientForm from './ClientForm';

function ClientManager() {
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Client | null>(null);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);

  const fetchClients = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('clients')
      .select('*, properties(id, title, ref_code)')
      .order('created_at', { ascending: false });
    if (!error && data) {
      setClients(data as Client[]);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchClients();
  }, [fetchClients]);

  const handleDelete = async (client: Client) => {
    const propCount = client.properties?.length ?? 0;
    const confirmMsg =
      propCount > 0
        ? `¿Eliminar al cliente ${client.first_name} ${client.last_name}? Tiene ${propCount} propiedad(es) asociada(s). Esta acción no se puede deshacer.`
        : `¿Eliminar al cliente ${client.first_name} ${client.last_name}? Esta acción no se puede deshacer.`;

    if (!confirm(confirmMsg)) return;

    const { error } = await supabase.from('clients').delete().eq('id', client.id);
    if (error) {
      toast.error(
        propCount > 0
          ? 'No se pudo eliminar: primero desvinculá o eliminá sus propiedades asociadas.'
          : 'Error al eliminar el cliente.',
      );
    } else {
      toast.success('Cliente eliminado correctamente.');
      setClients((prev) => prev.filter((c) => c.id !== client.id));
      if (selectedClient?.id === client.id) {
        setSelectedClient(null);
      }
    }
  };

  const filtered = clients.filter((c) => {
    const q = search.toLowerCase();
    return (
      c.first_name.toLowerCase().includes(q) ||
      c.last_name.toLowerCase().includes(q) ||
      (c.phone && c.phone.includes(q)) ||
      (c.email && c.email.toLowerCase().includes(q))
    );
  });

  return (
    <div>
      {selectedClient ? (
        <ClientDetail
          client={selectedClient}
          onClose={() => setSelectedClient(null)}
          onEdit={() => {
            setEditing(selectedClient);
            setShowForm(true);
          }}
          onDelete={() => handleDelete(selectedClient)}
        />
      ) : (
        <>
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
            <div className="relative w-full sm:w-96">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-primary-400" />
              <input
                type="text"
                placeholder="Buscar por nombre, teléfono o email..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-9 pr-4 py-2.5 text-sm bg-white border border-primary-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-400"
              />
            </div>
            <button
              onClick={() => { setEditing(null); setShowForm(true); }}
              className="flex items-center gap-2 px-4 py-2.5 text-sm font-semibold text-white bg-primary-700 hover:bg-primary-800 rounded-xl transition-colors shrink-0"
            >
              <UserPlus className="w-4 h-4" />
              Nuevo cliente
            </button>
          </div>

          {loading ? (
            <div className="py-20 text-center text-sm text-primary-400">Cargando clientes...</div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-20 bg-primary-100 border border-primary-200 rounded-2xl">
              <Users className="w-12 h-12 mx-auto text-primary-400 mb-3" />
              <p className="text-white font-semibold text-lg">No se encontraron clientes</p>
            </div>
          ) : (
            <div className="bg-primary-100 border border-primary-200 rounded-2xl overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="bg-primary-200 text-primary-400 font-medium border-b border-primary-300">
                    <tr>
                      <th className="px-4 py-3">Nombre</th>
                      <th className="px-4 py-3">Contacto</th>
                      <th className="px-4 py-3">Propiedades</th>
                      <th className="px-4 py-3 w-28"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-primary-200">
                    {filtered.map((c) => (
                      <tr key={c.id} className="hover:bg-primary-200/50 transition-colors group cursor-pointer" onClick={() => setSelectedClient(c)}>
                        <td className="px-4 py-3">
                          <div className="font-semibold text-white">{c.first_name} {c.last_name}</div>
                        </td>
                        <td className="px-4 py-3 text-primary-400">
                          <div>{c.phone || '-'}</div>
                          <div className="text-xs text-primary-500">{c.email || '-'}</div>
                        </td>
                        <td className="px-4 py-3">
                          <span className="inline-flex items-center justify-center bg-primary-200 text-primary-600 px-2.5 py-0.5 rounded-full text-xs font-semibold">
                            {c.properties?.length || 0}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <div className="inline-flex items-center gap-1">
                            <button
                              onClick={(e) => { e.stopPropagation(); setEditing(c); setShowForm(true); }}
                              className="p-1.5 text-primary-500 hover:text-white transition-colors"
                              aria-label="Editar cliente"
                              title="Editar cliente"
                            >
                              <Pencil className="w-4 h-4" />
                            </button>
                            <button
                              onClick={(e) => { e.stopPropagation(); handleDelete(c); }}
                              className="p-1.5 text-red-500 hover:text-red-400 transition-colors"
                              aria-label="Eliminar cliente"
                              title="Eliminar cliente"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}

      {showForm && (
        <ClientForm
          client={editing}
          onClose={() => setShowForm(false)}
          onSaved={(updatedClient) => {
            setShowForm(false);
            fetchClients();
            if (selectedClient && updatedClient.id === selectedClient.id) {
              setSelectedClient((prev) => (prev ? { ...prev, ...updatedClient } : null));
            }
          }}
        />
      )}
    </div>
  );
}

export default ClientManager;
