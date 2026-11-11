import { Search, SlidersHorizontal, X, ChevronDown, Home, Bed, Bath, MapPin } from 'lucide-react';
import { useState } from 'react';
import type { ReactNode } from 'react';
import type { Filters } from '@/types';
import { PROPERTY_TYPE_LABELS } from '@/lib/constants';

interface FilterBarProps {
  filters: Filters;
  onChange: (filters: Filters) => void;
  resultCount: number;
  locations: string[];
}

export default function FilterBar({ filters, onChange, resultCount, locations }: FilterBarProps) {
  const [mobileOpen, setMobileOpen] = useState(false);

  const update = (partial: Partial<Filters>) => onChange({ ...filters, ...partial });

  const parsePrice = (v: string): number | null => {
    const trimmed = v.trim();
    if (!trimmed) return null;
    const num = Number(trimmed);
    return !Number.isNaN(num) && num >= 0 ? Math.floor(num) : null;
  };

  const hasActiveFilters =
    filters.search.trim() !== '' ||
    filters.operation !== 'all' ||
    filters.propertyType !== 'all' ||
    filters.location !== '' ||
    filters.bedrooms !== null ||
    filters.bathrooms !== null ||
    filters.minPrice !== null ||
    filters.maxPrice !== null ||
    filters.parking;

  const clearAll = () => {
    onChange({
      search: '',
      operation: 'all',
      propertyType: 'all',
      location: '',
      bedrooms: null,
      bathrooms: null,
      minPrice: null,
      maxPrice: null,
      parking: false,
    });
  };

  return (
    <div className="bg-white border border-primary-200 rounded-2xl shadow-gold overflow-visible">
      <div className="p-4">
        <div className="flex items-center gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-primary-400" />
            <input
              type="text"
              placeholder="Buscar por título, ubicación o código..."
              value={filters.search}
              onChange={(e) => update({ search: e.target.value })}
              className="w-full pl-10 pr-4 py-3 text-sm bg-primary-100 border border-primary-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-accent-600 focus:border-accent-600 transition-all text-primary-900 placeholder:text-primary-400"
            />
          </div>
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="lg:hidden flex items-center gap-2 px-4 py-3 text-sm font-medium text-accent-700 bg-primary-100 border border-primary-200 rounded-xl hover:bg-primary-200 transition-colors flex-shrink-0"
          >
            <SlidersHorizontal className="w-4 h-4" />
            Filtros
            {hasActiveFilters && (
              <span className="w-2 h-2 bg-accent-500 rounded-full" />
            )}
          </button>
        </div>

        <div className="flex flex-wrap items-center gap-2 mt-3">
          <div className="flex gap-1 bg-primary-100 rounded-xl p-1 border border-primary-200">
            <button
              onClick={() => update({ operation: 'all' })}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
                filters.operation === 'all' ? 'bg-accent-600 text-primary-900 shadow-sm' : 'text-primary-500 hover:text-accent-700'
              }`}
            >
              Todos
            </button>
            <button
              onClick={() => update({ operation: 'venta' })}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
                filters.operation === 'venta' ? 'bg-accent-600 text-primary-900 shadow-sm' : 'text-primary-500 hover:text-accent-700'
              }`}
            >
              Venta
            </button>
            <button
              onClick={() => update({ operation: 'alquiler' })}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
                filters.operation === 'alquiler' ? 'bg-accent-600 text-primary-900 shadow-sm' : 'text-primary-500 hover:text-accent-700'
              }`}
            >
              Alquiler
            </button>
          </div>

          <div className="hidden lg:flex flex-wrap items-center gap-2">
            <FilterSelect
              prefix="Tipo"
              icon={<Home className="w-4 h-4" />}
              value={filters.propertyType}
              options={[{ value: 'all', label: 'Todos' }, ...Object.entries(PROPERTY_TYPE_LABELS).map(([value, label]) => ({ value, label }))]}
              onChange={(v) => update({ propertyType: v as Filters['propertyType'] })}
            />
            <FilterSelect
              prefix="Ubicación"
              icon={<MapPin className="w-4 h-4" />}
              value={filters.location || 'all'}
              options={[{ value: 'all', label: 'Todas' }, ...locations.map((location) => ({ value: location, label: location }))]}
              onChange={(v) => update({ location: v === 'all' ? '' : v })}
            />
            <FilterSelect
              prefix="Dormitorios"
              icon={<Bed className="w-4 h-4" />}
              value={filters.bedrooms?.toString() ?? 'any'}
              options={[
                { value: 'any', label: 'Todos' },
                { value: '1', label: '1' },
                { value: '2', label: '2' },
                { value: '3', label: '3' },
                { value: '4', label: '4+' },
              ]}
              onChange={(v) => update({ bedrooms: v === 'any' ? null : parseInt(v) })}
            />
            <FilterSelect
              prefix="Baños"
              icon={<Bath className="w-4 h-4" />}
              value={filters.bathrooms?.toString() ?? 'any'}
              options={[
                { value: 'any', label: 'Todos' },
                { value: '1', label: '1' },
                { value: '2', label: '2' },
                { value: '3', label: '3+' },
              ]}
              onChange={(v) => update({ bathrooms: v === 'any' ? null : parseInt(v) })}
            />
            <FilterInput
              type="number"
              value={filters.minPrice?.toString() ?? ''}
              placeholder="Precio mínimo"
              onChange={(v) => update({ minPrice: parsePrice(v) })}
            />
            <FilterInput
              type="number"
              value={filters.maxPrice?.toString() ?? ''}
              placeholder="Precio máximo"
              onChange={(v) => update({ maxPrice: parsePrice(v) })}
            />
            <button
              onClick={() => update({ parking: !filters.parking })}
              className={`px-3 py-2 text-xs font-semibold rounded-lg border transition-colors ${
                filters.parking
                  ? 'bg-accent-600 text-primary-900 border-accent-600'
                  : 'bg-primary-100 text-primary-500 border-primary-200 hover:bg-primary-200'
              }`}
            >
              Con cochera
            </button>
          </div>

          {hasActiveFilters && (
            <button
              onClick={clearAll}
              className="flex items-center gap-1 px-2 py-1 text-xs font-medium text-primary-500 hover:text-primary-900 transition-colors"
            >
              <X className="w-3 h-3" />
              Limpiar
            </button>
          )}

          <span className="ml-auto text-xs font-medium text-primary-500">
            {resultCount} {resultCount === 1 ? 'propiedad' : 'propiedades'}
          </span>
        </div>
      </div>

      {mobileOpen && (
        <div className="lg:hidden border-t border-primary-200 p-4 space-y-3 animate-slide-up bg-primary-50">
          <div>
            <label className="block text-xs font-semibold text-primary-700 mb-1.5">Tipo de propiedad</label>
            <FilterSelect
              fullWidth
              prefix="Tipo"
              icon={<Home className="w-4 h-4" />}
              value={filters.propertyType}
              options={[{ value: 'all', label: 'Todos' }, ...Object.entries(PROPERTY_TYPE_LABELS).map(([value, label]) => ({ value, label }))]}
              onChange={(v) => update({ propertyType: v as Filters['propertyType'] })}
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-primary-700 mb-1.5">Ubicación</label>
            <FilterSelect
              fullWidth
              prefix="Ubicación"
              icon={<MapPin className="w-4 h-4" />}
              value={filters.location || 'all'}
              options={[{ value: 'all', label: 'Todas' }, ...locations.map((location) => ({ value: location, label: location }))]}
              onChange={(v) => update({ location: v === 'all' ? '' : v })}
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-primary-700 mb-1.5">Dormitorios</label>
              <FilterSelect
                fullWidth
                prefix="Dormitorios"
                icon={<Bed className="w-4 h-4" />}
                value={filters.bedrooms?.toString() ?? 'any'}
                options={[
                  { value: 'any', label: 'Todos' },
                  { value: '1', label: '1' },
                  { value: '2', label: '2' },
                  { value: '3', label: '3' },
                  { value: '4', label: '4+' },
                ]}
                onChange={(v) => update({ bedrooms: v === 'any' ? null : parseInt(v) })}
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-primary-700 mb-1.5">Baños</label>
              <FilterSelect
                fullWidth
                prefix="Baños"
                icon={<Bath className="w-4 h-4" />}
                value={filters.bathrooms?.toString() ?? 'any'}
                options={[
                  { value: 'any', label: 'Todos' },
                  { value: '1', label: '1' },
                  { value: '2', label: '2' },
                  { value: '3', label: '3+' },
                ]}
                onChange={(v) => update({ bathrooms: v === 'any' ? null : parseInt(v) })}
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-primary-700 mb-1.5">Precio mín.</label>
              <FilterInput
                fullWidth
                type="number"
                value={filters.minPrice?.toString() ?? ''}
                placeholder="Precio mínimo"
                onChange={(v) => update({ minPrice: parsePrice(v) })}
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-primary-700 mb-1.5">Precio máx.</label>
              <FilterInput
                fullWidth
                type="number"
                value={filters.maxPrice?.toString() ?? ''}
                placeholder="Precio máximo"
                onChange={(v) => update({ maxPrice: parsePrice(v) })}
              />
            </div>
          </div>
          <button
            onClick={() => update({ parking: !filters.parking })}
            className={`w-full px-3 py-2.5 text-sm font-semibold rounded-lg border transition-colors ${
              filters.parking
                ? 'bg-primary-700 text-white border-primary-700'
                : 'bg-white text-primary-600 border-primary-200 hover:bg-primary-50'
            }`}
          >
            Con cochera
          </button>
        </div>
      )}
    </div>
  );
}

function FilterSelect({
  prefix,
  icon,
  value,
  options,
  onChange,
  fullWidth,
}: {
  prefix: string;
  icon: ReactNode;
  value: string;
  options: { value: string; label: string }[];
  onChange: (v: string) => void;
  fullWidth?: boolean;
}) {
  const selectedOption = options.find((option) => option.value === value);
  const selectedLabel = selectedOption?.label ?? 'Todos';

  return (
    <div className={`relative ${fullWidth ? 'w-full' : ''}`}>
      <div className="flex w-full items-center gap-2 px-3 pr-8 py-2 text-xs font-semibold text-primary-900 bg-primary-100 border border-primary-200 rounded-lg transition-all pointer-events-none focus-within:ring-2 focus-within:ring-accent-600">
        <span className="text-accent-600 flex-shrink-0">{icon}</span>
        <span className="truncate">{prefix}: {selectedLabel}</span>
      </div>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="absolute inset-0 w-full appearance-none opacity-0 cursor-pointer"
        aria-label={`${prefix}: ${selectedLabel}`}
      >
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
      <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-accent-600 pointer-events-none" />
    </div>
  );
}

function FilterInput({
  label,
  value,
  placeholder,
  onChange,
  type = 'text',
  fullWidth,
}: {
  label?: string;
  value: string;
  placeholder: string;
  onChange: (v: string) => void;
  type?: string;
  fullWidth?: boolean;
}) {
  return (
    <input
      type={type}
      min={type === 'number' ? '0' : undefined}
      value={value}
      placeholder={placeholder}
      onChange={(e) => onChange(e.target.value)}
      className={`${fullWidth ? 'w-full' : 'w-32'} px-3 py-2 text-xs font-medium text-primary-900 bg-primary-100 border border-primary-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent-600 focus:border-accent-600 transition-all placeholder:text-primary-400`}
      aria-label={label}
    />
  );
}
