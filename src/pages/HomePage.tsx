import { useMemo, useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Search as SearchIcon, TrendingUp, Home as HomeIcon } from 'lucide-react';
import type { Property, Filters } from '@/types';
import { supabase } from '@/lib/supabase';
import { filterProperties } from '@/lib/utils';
import PropertyCard from '@/components/PropertyCard';
import FilterBar from '@/components/FilterBar';

export default function HomePage() {
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchParams] = useSearchParams();

  const [filters, setFilters] = useState<Filters>(() => {
    const op = searchParams.get('op');
    return {
      search: '',
      operation: op === 'venta' || op === 'alquiler' ? op : 'all',
      propertyType: 'all',
      location: '',
      bedrooms: null,
      bathrooms: null,
      minPrice: null,
      maxPrice: null,
      parking: false,
    };
  });

  useEffect(() => {
    const op = searchParams.get('op');
    setFilters((prev) => ({
      ...prev,
      operation: op === 'venta' || op === 'alquiler' ? op : 'all',
    }));
  }, [searchParams]);

  useEffect(() => {
    async function fetchProperties() {
      setLoading(true);
      const { data, error } = await supabase
        .from('properties')
        .select('id, ref_code, title, operation, property_type, price, currency, location, address, bedrooms, bathrooms, parking, covered_area, total_area, images, featured, created_at')
        .order('created_at', { ascending: false });
      if (error) {
        setError('No pudimos cargar las propiedades. Intentá nuevamente.');
      } else {
        setProperties((data ?? []) as Property[]);
      }
      setLoading(false);
    }
    fetchProperties();
  }, []);

  const filtered = useMemo(() => filterProperties(properties, filters), [properties, filters]);
  const featured = useMemo(() => properties.filter((p) => p.featured).slice(0, 3), [properties]);
  const locations = useMemo(
    () => Array.from(new Set(properties.map((property) => property.location))).sort((a, b) => a.localeCompare(b)),
    [properties],
  );

  return (
    <div className="min-h-screen">
      <section className="relative bg-gradient-to-br from-primary-50 via-primary-100 to-primary-200 overflow-hidden">
        <div className="absolute inset-0">
          <img
            src="https://images.pexels.com/photos/323780/pexels-photo-323780.jpeg?auto=compress&cs=tinysrgb&h=650&w=940"
            alt=""
            className="w-full h-full object-cover"
          />
        </div>
        <div className="absolute inset-0 bg-gradient-to-r from-primary-50/85 via-primary-50/60 to-primary-100/40" />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-24">
          <div className="max-w-2xl">
            <span className="inline-flex items-center gap-2 px-3 py-1 text-xs font-semibold text-accent-700 bg-accent-100 border border-accent-300 rounded-full mb-4">
              <TrendingUp className="w-3.5 h-3.5" />
              Propiedades seleccionadas
            </span>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-primary-900 leading-tight tracking-tight mb-4">
              Encontrá tu<br />
              <span className="text-accent-700">próximo hogar</span>
            </h1>
            <p className="text-lg text-primary-800 leading-relaxed mb-8 max-w-xl">
              Casas, departamentos, terrenos y locales en venta y alquiler. Contactá directamente por WhatsApp, sin registros ni intermediarios.
            </p>
          </div>
        </div>
      </section>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-8 relative z-10">
        <FilterBar filters={filters} onChange={setFilters} resultCount={filtered.length} locations={locations} />

        {loading && (
          <div className="mt-12 flex flex-col items-center justify-center py-20">
            <div className="w-10 h-10 border-3 border-primary-200 border-t-primary-700 rounded-full animate-spin" />
            <p className="mt-4 text-sm text-primary-500">Cargando propiedades...</p>
          </div>
        )}

        {error && (
          <div className="mt-12 text-center py-20">
            <p className="text-primary-700 font-medium">{error}</p>
            <button
              onClick={() => window.location.reload()}
              className="mt-4 px-5 py-2 text-sm font-semibold text-white bg-primary-700 rounded-lg hover:bg-primary-800 transition-colors"
            >
              Reintentar
            </button>
          </div>
        )}

        {!loading && !error && (
          <>
            {featured.length > 0 && filters.operation === 'all' && filters.propertyType === 'all' && !filters.search && !filters.location && (
              <section className="mt-12">
                <div className="flex items-center gap-2 mb-5">
                  <HomeIcon className="w-5 h-5 text-primary-700" />
                  <h2 className="text-xl font-bold text-primary-900">Destacadas</h2>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                  {featured.map((p) => (
                    <PropertyCard key={p.id} property={p} />
                  ))}
                </div>
              </section>
            )}

            <section className="mt-12 pb-12">
              <div className="flex items-center gap-2 mb-5">
                <SearchIcon className="w-5 h-5 text-primary-700" />
                <h2 className="text-xl font-bold text-primary-900">
                  {filters.operation !== 'all' || filters.propertyType !== 'all' || filters.search || filters.location
                    ? 'Resultados de tu búsqueda'
                    : 'Todas las propiedades'}
                </h2>
              </div>

              {filtered.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                  {filtered.map((p) => (
                    <PropertyCard key={p.id} property={p} />
                  ))}
                </div>
              ) : (
                <div className="text-center py-20 bg-primary-50 rounded-2xl">
                  <SearchIcon className="w-12 h-12 text-primary-300 mx-auto mb-4" />
                  <p className="text-primary-700 font-semibold text-lg">No encontramos propiedades</p>
                  <p className="text-primary-500 text-sm mt-1">Probá ajustar los filtros de búsqueda</p>
                </div>
              )}
            </section>
          </>
        )}
      </main>
    </div>
  );
}
