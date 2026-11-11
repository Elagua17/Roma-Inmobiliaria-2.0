import React, { useState, useRef, useEffect } from 'react';
import { Upload, X, Plus, Save, Trash2, Loader2, UserPlus, GripVertical } from 'lucide-react';
import imageCompression from 'browser-image-compression';
import toast from 'react-hot-toast';
import { supabase } from '@/lib/supabase';
import { Property, Client, PropertyType, Operation, Currency } from '@/types';
import { PROPERTY_TYPE_LABELS, AMENITY_LIST } from '@/lib/constants';
import ClientForm from './ClientForm';

export interface PropertyFormData {
  ref_code: string;
  title: string;
  description: string;
  operation: Operation;
  property_type: PropertyType;
  price: string;
  currency: Currency;
  location: string;
  address: string;
  bedrooms: string;
  bathrooms: string;
  parking: string;
  covered_area: string;
  total_area: string;
  amenities: string[];
  images: string[];
  lat: number | null;
  lng: number | null;
  featured: boolean;
  client_id: string;
}

const emptyForm: PropertyFormData = {
  ref_code: '',
  title: '',
  description: '',
  operation: 'venta',
  property_type: 'casa',
  price: '',
  currency: 'USD',
  location: '',
  address: '',
  bedrooms: '',
  bathrooms: '',
  parking: '0',
  covered_area: '',
  total_area: '',
  amenities: [],
  images: [],
  lat: null,
  lng: null,
  featured: false,
  client_id: '',
};

export default function PropertyForm({
  property,
  onClose,
  onSaved,
}: {
  property: Property | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [form, setForm] = useState<PropertyFormData>(() => {
    if (!property) return emptyForm;
    return {
      ref_code: property.ref_code,
      title: property.title,
      description: property.description,
      operation: property.operation,
      property_type: property.property_type,
      price: property.price.toString(),
      currency: property.currency,
      location: property.location,
      address: property.address ?? '',
      bedrooms: property.bedrooms?.toString() ?? '',
      bathrooms: property.bathrooms?.toString() ?? '',
      parking: property.parking.toString(),
      covered_area: property.covered_area?.toString() ?? '',
      total_area: property.total_area?.toString() ?? '',
      lat: property.lat,
      lng: property.lng,
      amenities: property.amenities,
      images: property.images,
      featured: property.featured,
      client_id: property.client_id ?? '',
    };
  });
  const [saving, setSaving] = useState(false);
  const [newAmenity, setNewAmenity] = useState('');
  const [uploading, setUploading] = useState(false);
  const [clients, setClients] = useState<Client[]>([]);
  const [showClientForm, setShowClientForm] = useState(false);
  const [draggedIdx, setDraggedIdx] = useState<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const update = (partial: Partial<PropertyFormData>) =>
    setForm((prev) => ({ ...prev, ...partial }));

  useEffect(() => {
    supabase.from('clients').select('*').order('first_name').then(({ data }) => {
      if (data) setClients(data as Client[]);
    });
  }, []);

  useEffect(() => {
    if (!property) {
      supabase.rpc('generate_ref_code').then(({ data, error }) => {
        if (!error && data) {
          update({ ref_code: data as string });
        }
      });
    }
  }, [property]);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    setUploading(true);
    const uploaded: string[] = [];

    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    const maxRawSizeBytes = 10 * 1024 * 1024; // 10 MB

    const options = {
      maxSizeMB: 1,
      maxWidthOrHeight: 1920,
      useWebWorker: true,
      fileType: 'image/webp'
    };

    for (const file of Array.from(files)) {
      if (!allowedTypes.includes(file.type)) {
        toast.error(`Formato no permitido en ${file.name}. Usá JPG, PNG, WebP o GIF.`);
        continue;
      }
      if (file.size > maxRawSizeBytes) {
        toast.error(`El archivo ${file.name} supera el límite de 10 MB.`);
        continue;
      }
      try {
        const compressedFile = await imageCompression(file, options);
        const randomHex = Array.from(crypto.getRandomValues(new Uint8Array(8)))
          .map((b) => b.toString(16).padStart(2, '0'))
          .join('');
        const fileName = `${Date.now()}-${randomHex}.webp`;
        
        const { error } = await supabase.storage
          .from('property-images')
          .upload(fileName, compressedFile, { cacheControl: '3600', upsert: false });
          
        if (!error) {
          const { data: publicUrl } = supabase.storage.from('property-images').getPublicUrl(fileName);
          if (publicUrl.publicUrl) uploaded.push(publicUrl.publicUrl);
        } else {
          toast.error(`Error al subir ${file.name}`);
        }
      } catch {
        toast.error(`Error al comprimir ${file.name}`);
      }
    }
    
    if (uploaded.length > 0) {
      setForm((prev) => ({ ...prev, images: [...prev.images, ...uploaded] }));
      toast.success(`${uploaded.length} foto(s) subidas exitosamente.`);
    }
    setUploading(false);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleDragStart = (idx: number) => setDraggedIdx(idx);
  const handleDragOver = (e: React.DragEvent, idx: number) => {
    e.preventDefault();
    if (draggedIdx === null || draggedIdx === idx) return;
    setForm((prev) => {
      const newImages = [...prev.images];
      const draggedImg = newImages[draggedIdx];
      newImages.splice(draggedIdx, 1);
      newImages.splice(idx, 0, draggedImg);
      return { ...prev, images: newImages };
    });
    setDraggedIdx(idx);
  };
  const handleDragEnd = () => setDraggedIdx(null);

  const removeImage = (idx: number) => {
    setForm((prev) => ({ ...prev, images: prev.images.filter((_, i) => i !== idx) }));
  };

  const addAmenity = () => {
    const val = newAmenity.trim();
    if (val && !form.amenities.includes(val)) {
      setForm((prev) => ({ ...prev, amenities: [...prev.amenities, val] }));
      setNewAmenity('');
    }
  };

  const removeAmenity = (idx: number) => {
    setForm((prev) => ({ ...prev, amenities: prev.amenities.filter((_, i) => i !== idx) }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    let refCode = form.ref_code.trim();
    if (!refCode && !property) {
      const { data: generated } = await supabase.rpc('generate_ref_code');
      if (generated) {
        refCode = generated as string;
        update({ ref_code: refCode });
      }
    }

    if (!refCode || !form.title.trim() || !form.description.trim() || !form.location.trim() || !form.client_id) {
      toast.error('Completá todos los campos obligatorios, incluyendo localidad y cliente.');
      return;
    }

    setSaving(true);

    const data = {
      ref_code: refCode,
      title: form.title.trim(),
      description: form.description.trim(),
      operation: form.operation,
      property_type: form.property_type,
      price: Math.max(0, parseFloat(form.price) || 0),
      currency: form.currency,
      location: form.location.trim(),
      address: form.address.trim() || null,
      bedrooms: form.bedrooms !== '' ? Math.max(0, parseInt(form.bedrooms)) : null,
      bathrooms: form.bathrooms !== '' ? Math.max(0, parseInt(form.bathrooms)) : null,
      parking: Math.max(0, parseInt(form.parking) || 0),
      covered_area: form.covered_area !== '' ? Math.max(0, parseInt(form.covered_area)) : null,
      total_area: form.total_area !== '' ? Math.max(0, parseInt(form.total_area)) : null,
      amenities: form.amenities,
      images: form.images,
      lat: form.lat,
      lng: form.lng,
      featured: form.featured,
      client_id: form.client_id,
    };

    let result;
    if (property) {
      result = await supabase.from('properties').update(data).eq('id', property.id);
    } else {
      result = await supabase.from('properties').insert(data);
    }

    if (result.error) {
      toast.error(result.error.message.includes('duplicate')
        ? 'Ya existe una propiedad con ese código de referencia.'
        : 'Error al guardar. Revisá los datos e intentá nuevamente.');
      setSaving(false);
    } else {
      if (property) {
        const removedImages = property.images.filter((img) => !form.images.includes(img));
        const paths = removedImages
          .map((url) => url.split('/property-images/')[1])
          .filter((p): p is string => Boolean(p));
        if (paths.length > 0) {
          await supabase.storage.from('property-images').remove(paths);
        }
      }
      onSaved();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start sm:items-center justify-center bg-primary-900/60 backdrop-blur-sm p-0 sm:p-4 overflow-y-auto">
      <div className="bg-white w-full sm:max-w-2xl sm:rounded-2xl shadow-2xl min-h-screen sm:min-h-0 sm:max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-primary-100 px-5 sm:px-6 py-4 flex items-center justify-between z-10">
          <h2 className="text-lg font-bold text-primary-900">
            {property ? 'Editar propiedad' : 'Nueva propiedad'}
          </h2>
          <button
            onClick={onClose}
            className="p-2 text-primary-500 hover:bg-primary-50 rounded-lg transition-colors"
            aria-label="Cerrar"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 sm:p-6 space-y-5">

          <Field label="Código de propiedad (automático)">
            <input
              type="text"
              value={form.ref_code}
              readOnly
              className={`${inputClass} bg-primary-100 text-primary-500 cursor-not-allowed`}
            />
          </Field>

          <Field label="Cliente asociado" required>
            <div className="flex gap-2">
              <select
                value={form.client_id}
                onChange={(e) => update({ client_id: e.target.value })}
                className={inputClass}
              >
                <option value="">Seleccionar cliente...</option>
                {clients.map(c => (
                  <option key={c.id} value={c.id}>{c.first_name} {c.last_name}</option>
                ))}
              </select>
              <button
                type="button"
                onClick={() => setShowClientForm(true)}
                className="px-4 py-2.5 text-sm font-semibold text-primary-700 bg-primary-50 hover:bg-primary-100 rounded-lg transition-colors flex-shrink-0"
              >
                <UserPlus className="w-4 h-4" />
              </button>
            </div>
          </Field>

          <Field label="Título" required>
            <input
              type="text"
              value={form.title}
              onChange={(e) => update({ title: e.target.value })}
              placeholder="Casa moderna con pileta..."
              className={inputClass}
            />
          </Field>

          <div className="grid grid-cols-2 gap-4">
            <Field label="Operación" required>
              <select
                value={form.operation}
                onChange={(e) => update({ operation: e.target.value as Operation })}
                className={inputClass}
              >
                <option value="venta">Venta</option>
                <option value="alquiler">Alquiler</option>
              </select>
            </Field>
            <Field label="Tipo de propiedad" required>
              <select
                value={form.property_type}
                onChange={(e) => update({ property_type: e.target.value as PropertyType })}
                className={inputClass}
              >
                {Object.entries(PROPERTY_TYPE_LABELS).map(([value, label]) => (
                  <option key={value} value={value}>{label}</option>
                ))}
              </select>
            </Field>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <Field label="Precio" required>
              <input
                type="number"
                value={form.price}
                onChange={(e) => update({ price: e.target.value })}
                placeholder="0"
                className={inputClass}
              />
            </Field>
            <Field label="Moneda" required>
              <select
                value={form.currency}
                onChange={(e) => update({ currency: e.target.value as Currency })}
                className={inputClass}
              >
                <option value="USD">USD</option>
                <option value="ARS">ARS</option>
              </select>
            </Field>
            <Field label="Cocheras">
              <input
                type="number"
                value={form.parking}
                onChange={(e) => update({ parking: e.target.value })}
                placeholder="0"
                min="0"
                className={inputClass}
              />
            </Field>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="Localidad / Barrio (para filtro)" required>
              <input
                type="text"
                value={form.location}
                onChange={(e) => update({ location: e.target.value })}
                placeholder="Ej: Paraná, Centro"
                className={inputClass}
              />
            </Field>
            <Field label="Dirección (ubicación en el mapa)">
              <input
                type="text"
                value={form.address}
                onChange={(e) => update({ address: e.target.value })}
                placeholder="Av. Córdoba 5500, Paraná"
                className={inputClass}
              />
            </Field>
          </div>

          <label className="flex items-center gap-2.5 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={form.featured}
              onChange={(e) => update({ featured: e.target.checked })}
              className="w-4 h-4 rounded border-primary-300 text-primary-700 focus:ring-primary-500"
            />
            <span className="text-sm font-medium text-primary-700">
              Destacar propiedad en la portada (máx. 3 visibles)
            </span>
          </label>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <Field label="Dormitorios">
              <input
                type="number"
                value={form.bedrooms}
                onChange={(e) => update({ bedrooms: e.target.value })}
                placeholder="—"
                min="0"
                className={inputClass}
              />
            </Field>
            <Field label="Baños">
              <input
                type="number"
                value={form.bathrooms}
                onChange={(e) => update({ bathrooms: e.target.value })}
                placeholder="—"
                min="0"
                className={inputClass}
              />
            </Field>
            <Field label="m² cubiertos">
              <input
                type="number"
                value={form.covered_area}
                onChange={(e) => update({ covered_area: e.target.value })}
                placeholder="—"
                min="0"
                className={inputClass}
              />
            </Field>
            <Field label="m² totales">
              <input
                type="number"
                value={form.total_area}
                onChange={(e) => update({ total_area: e.target.value })}
                placeholder="—"
                min="0"
                className={inputClass}
              />
            </Field>
          </div>

          <Field label="Descripción" required>
            <textarea
              value={form.description}
              onChange={(e) => update({ description: e.target.value })}
              placeholder="Descripción detallada de la propiedad..."
              rows={4}
              className={`${inputClass} resize-y`}
            />
          </Field>

          <Field label="Fotos">
            <div className="space-y-3">
              {form.images.length > 0 && (
                <div className="flex gap-2 flex-wrap">
                  {form.images.map((img, idx) => (
                    <div 
                      key={idx} 
                      draggable
                      onDragStart={() => handleDragStart(idx)}
                      onDragOver={(e) => handleDragOver(e, idx)}
                      onDragEnd={handleDragEnd}
                      className={`relative w-20 h-16 rounded-lg overflow-hidden group cursor-grab active:cursor-grabbing border-2 transition-all ${draggedIdx === idx ? 'border-primary-500 opacity-50' : 'border-transparent'}`}
                    >
                      <img src={img} alt="" className="w-full h-full object-cover pointer-events-none" />
                      
                      <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity gap-2">
                        <GripVertical className="w-4 h-4 text-white cursor-grab" />
                        <button
                          type="button"
                          onClick={() => removeImage(idx)}
                          className="p-1 hover:bg-red-500/80 rounded transition-colors"
                        >
                          <Trash2 className="w-4 h-4 text-white" />
                        </button>
                      </div>
                      
                      {idx === 0 && (
                        <div className="absolute bottom-0 inset-x-0 bg-primary-600/90 py-0.5 text-[8px] text-center text-white font-bold tracking-wider uppercase">
                          Portada
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp,image/gif"
                multiple
                onChange={handleFileSelect}
                className="hidden"
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
                className="flex items-center gap-2 px-4 py-2.5 text-sm font-semibold text-primary-700 bg-primary-50 hover:bg-primary-100 border border-primary-200 rounded-lg transition-colors disabled:opacity-50"
              >
                {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                {uploading ? 'Subiendo...' : 'Subir fotos desde tu dispositivo'}
              </button>
            </div>
          </Field>

          <Field label="Comodidades">
            <div className="space-y-3">
              {form.amenities.length > 0 && (
                <div className="flex gap-2 flex-wrap">
                  {form.amenities.map((a, idx) => (
                    <span
                      key={idx}
                      className="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-medium text-primary-700 bg-primary-50 rounded-full"
                    >
                      {a}
                      <button type="button" onClick={() => removeAmenity(idx)} className="text-primary-400 hover:text-red-500">
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  ))}
                </div>
              )}
              <div className="flex flex-wrap gap-2">
                {AMENITY_LIST.filter((a) => !form.amenities.includes(a)).map((a) => (
                  <button
                    key={a}
                    type="button"
                    onClick={() => update({ amenities: [...form.amenities, a] })}
                    className="px-3 py-1 text-xs font-medium text-primary-600 bg-primary-50 border border-primary-200 hover:bg-primary-100 hover:text-primary-900 rounded-full transition-colors"
                  >
                    + {a}
                  </button>
                ))}
              </div>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newAmenity}
                  onChange={(e) => setNewAmenity(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addAmenity(); } }}
                  placeholder="Otra comodidad..."
                  className={inputClass}
                />
                <button
                  type="button"
                  onClick={addAmenity}
                  className="px-4 py-2.5 text-sm font-semibold text-primary-700 bg-primary-50 hover:bg-primary-100 rounded-lg transition-colors flex-shrink-0"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
            </div>
          </Field>

          <div className="flex items-center gap-3 pt-3 border-t border-primary-100">
            <button
              type="submit"
              disabled={saving || uploading}
              className="flex items-center gap-2 px-5 py-3 text-sm font-semibold text-white bg-primary-700 hover:bg-primary-800 rounded-xl transition-colors disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              {uploading ? 'Subiendo fotos...' : saving ? 'Guardando...' : 'Guardar'}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-3 text-sm font-medium text-primary-600 bg-primary-50 hover:bg-primary-100 rounded-xl transition-colors"
            >
              Cancelar
            </button>
          </div>
        </form>
      </div>

      {showClientForm && (
        <ClientForm
          client={null}
          onClose={() => setShowClientForm(false)}
          onSaved={(newClient) => {
            setClients((prev) => [...prev, newClient].sort((a, b) => a.first_name.localeCompare(b.first_name)));
            update({ client_id: newClient.id });
            setShowClientForm(false);
          }}
        />
      )}
    </div>
  );
}


const inputClass =
  'w-full px-3 py-2.5 text-sm text-primary-900 bg-primary-50 border border-primary-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-400 focus:bg-primary-50 transition-all placeholder:text-primary-300';

function Field({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-xs font-semibold text-primary-700 mb-1.5">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      {children}
    </div>
  );
}


