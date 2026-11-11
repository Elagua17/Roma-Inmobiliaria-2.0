import React, { useState } from 'react';
import { Save, X } from 'lucide-react';
import toast from 'react-hot-toast';
import { supabase } from '@/lib/supabase';
import { Client } from '@/types';

export default function ClientForm({ client, onClose, onSaved }: { client: Client | null; onClose: () => void; onSaved: (client: Client) => void }) {
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    first_name: client?.first_name || '',
    last_name: client?.last_name || '',
    phone: client?.phone || '',
    email: client?.email || '',
    notes: client?.notes || ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const firstName = form.first_name.trim();
    const lastName = form.last_name.trim();
    const phone = form.phone.trim();
    const email = form.email.trim().toLowerCase();
    const notes = form.notes.trim();

    if (!firstName || !lastName) {
      toast.error('El nombre y apellido son obligatorios.');
      return;
    }

    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      toast.error('El formato del correo electrónico no es válido.');
      return;
    }

    const payload = {
      first_name: firstName.slice(0, 100),
      last_name: lastName.slice(0, 100),
      phone: phone ? phone.slice(0, 40) : null,
      email: email ? email.slice(0, 150) : null,
      notes: notes ? notes.slice(0, 2000) : null,
    };

    setSaving(true);
    let result;
    
    if (client) {
      result = await supabase.from('clients').update(payload).eq('id', client.id).select().single();
    } else {
      result = await supabase.from('clients').insert([payload]).select().single();
    }

    if (result.error) {
      toast.error('Ocurrió un error al guardar el cliente.');
    } else {
      toast.success(client ? 'Cliente actualizado.' : 'Cliente creado.');
      onSaved(result.data as Client);
    }
    setSaving(false);
  };

  const inputClass = "w-full bg-primary-50 border border-primary-200 text-primary-900 rounded-lg px-4 py-2.5 outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500 transition-all placeholder:text-primary-400";

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-primary-900/60 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-primary-100 bg-primary-50">
          <h3 className="text-lg font-bold text-primary-900">
            {client ? 'Editar Cliente' : 'Nuevo Cliente'}
          </h3>
          <button onClick={onClose} className="p-2 text-primary-400 hover:text-primary-600 hover:bg-primary-100 rounded-lg transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-primary-700 mb-1.5">Nombre *</label>
              <input 
                type="text" 
                value={form.first_name} 
                onChange={e => setForm({...form, first_name: e.target.value})} 
                className={inputClass} 
                placeholder="Ej: Juan" 
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-primary-700 mb-1.5">Apellido *</label>
              <input 
                type="text" 
                value={form.last_name} 
                onChange={e => setForm({...form, last_name: e.target.value})} 
                className={inputClass} 
                placeholder="Ej: Pérez" 
              />
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-primary-700 mb-1.5">Teléfono</label>
            <input 
              type="text" 
              value={form.phone} 
              onChange={e => setForm({...form, phone: e.target.value})} 
              className={inputClass} 
              placeholder="Ej: +54 9 11 1234-5678" 
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-primary-700 mb-1.5">Correo Electrónico</label>
            <input 
              type="email" 
              value={form.email} 
              onChange={e => setForm({...form, email: e.target.value})} 
              className={inputClass} 
              placeholder="Ej: juan@email.com" 
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-primary-700 mb-1.5">Notas / Preferencias</label>
            <textarea 
              value={form.notes} 
              onChange={e => setForm({...form, notes: e.target.value})} 
              className={`${inputClass} resize-y min-h-[100px]`} 
              placeholder="Ej: Busca departamento de 2 ambientes..." 
            />
          </div>

          <div className="pt-4 flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 text-sm font-medium text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex items-center gap-2 px-5 py-2.5 text-sm font-medium text-white bg-primary-700 hover:bg-primary-800 rounded-lg transition-colors disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              {saving ? 'Guardando...' : 'Guardar Cliente'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
