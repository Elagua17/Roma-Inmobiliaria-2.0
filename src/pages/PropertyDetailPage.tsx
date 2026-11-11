import { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  ChevronLeft,
  ChevronRight,
  BedDouble,
  Bath,
  Maximize,
  Car,
  MapPin,
  Check,
  Phone,
  ArrowLeft,
  Share2,
  Home as HomeIcon,
  Eye,
} from 'lucide-react';
import type { Property } from '@/types';
import { supabase } from '@/lib/supabase';
import { formatPrice, buildWhatsAppLink, sanitizeImageUrl } from '@/lib/utils';
import { PROPERTY_TYPE_LABELS, OPERATION_LABELS } from '@/lib/constants';

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const PUBLIC_PROPERTY_COLUMNS =
  'id, ref_code, title, description, operation, property_type, price, currency, location, address, bedrooms, bathrooms, parking, covered_area, total_area, amenities, images, lat, lng, featured, visit_count, created_at, updated_at';

export default function PropertyDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [property, setProperty] = useState<Property | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentImage, setCurrentImage] = useState(0);
  const [visitCount, setVisitCount] = useState<number | null>(null);
  const [shareStatus, setShareStatus] = useState<string | null>(null);
  const shareTimeoutRef = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      if (shareTimeoutRef.current) window.clearTimeout(shareTimeoutRef.current);
    };
  }, []);

  useEffect(() => {
    let cancelled = false;
    async function fetchProperty() {
      if (!id || !UUID_REGEX.test(id)) {
        setError('Propiedad no encontrada.');
        setLoading(false);
        return;
      }
      setLoading(true);
      setError(null);
      setCurrentImage(0);
      setVisitCount(null);

      const { data, error } = await supabase
        .from('properties')
        .select(PUBLIC_PROPERTY_COLUMNS)
        .eq('id', id)
        .maybeSingle();

      if (cancelled) return;

      if (error) {
        setError('No pudimos cargar esta propiedad.');
      } else if (!data) {
        setError('Esta propiedad ya no está disponible.');
      } else {
        setProperty(data as Property);
        const visitKey = `visited_prop_${id}`;
        if (!sessionStorage.getItem(visitKey)) {
          sessionStorage.setItem(visitKey, '1');
          const { data: visitData } = await supabase.rpc('increment_visit', {
            p_property_id: id,
          });
          if (!cancelled && typeof visitData === 'number') {
            setVisitCount(visitData);
          } else if (!cancelled) {
            setVisitCount((data as Property).visit_count);
          }
        } else {
          setVisitCount((data as Property).visit_count);
        }
      }
      if (!cancelled) {
        setLoading(false);
      }
    }
    fetchProperty();
    return () => {
      cancelled = true;
    };
  }, [id]);

  const safeImages = property ? property.images.map(sanitizeImageUrl).filter(Boolean) : [];

  const nextImage = useCallback(() => {
    if (safeImages.length === 0) return;
    setCurrentImage((prev) => (prev + 1) % safeImages.length);
  }, [safeImages.length]);

  const prevImage = useCallback(() => {
    if (safeImages.length === 0) return;
    setCurrentImage((prev) => (prev - 1 + safeImages.length) % safeImages.length);
  }, [safeImages.length]);

  const handleWhatsAppClick = useCallback(async () => {
    if (!property) return;
    const waKey = `wa_prop_${property.id}`;
    if (sessionStorage.getItem(waKey)) return;
    sessionStorage.setItem(waKey, '1');
    try {
      await supabase.rpc('increment_whatsapp', { p_property_id: property.id });
    } catch {
      // Silencioso en producción para no exponer detalles internos en consola
    }
  }, [property]);

  const handleShare = useCallback(async () => {
    if (!property) return;
    const shareUrl = `${window.location.origin}/propiedad/${property.id}`;
    const shareData = {
      title: `${property.title} - ROMA Inmobiliaria Paraná`,
      text: `${property.title} - ${formatPrice(property.price, property.currency)}. Mirá esta propiedad en ROMA Inmobiliaria Paraná.`,
      url: shareUrl,
    };
    try {
      if (navigator.share) {
        await navigator.share(shareData);
        setShareStatus('Enlace compartido');
      } else {
        await navigator.clipboard.writeText(shareUrl);
        setShareStatus('Enlace copiado al portapapeles');
      }
      
      const shareKey = `share_prop_${property.id}`;
      if (!sessionStorage.getItem(shareKey)) {
        sessionStorage.setItem(shareKey, '1');
        await supabase.rpc('increment_share', { p_property_id: property.id });
      }
    } catch (err) {
      if (err instanceof Error && err.name === 'AbortError') return;
      setShareStatus('No se pudo compartir. Copiá el enlace manualmente.');
    }
    if (shareTimeoutRef.current) window.clearTimeout(shareTimeoutRef.current);
    shareTimeoutRef.current = window.setTimeout(() => setShareStatus(null), 3000);
  }, [property]);

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center py-20">
        <div className="w-10 h-10 border-3 border-primary-200 border-t-primary-700 rounded-full animate-spin" />
        <p className="mt-4 text-sm text-primary-500">Cargando propiedad...</p>
      </div>
    );
  }

  if (error || !property) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center py-20 px-4">
        <HomeIcon className="w-16 h-16 text-primary-200 mb-4" />
        <p className="text-primary-700 font-semibold text-lg text-center">{error ?? 'Propiedad no encontrada'}</p>
        <Link
          to="/"
          className="mt-6 px-5 py-2.5 text-sm font-semibold text-white bg-primary-700 rounded-lg hover:bg-primary-800 transition-colors"
        >
          Volver al catálogo
        </Link>
      </div>
    );
  }

  const hasImages = safeImages.length > 0;
  const opLabel = OPERATION_LABELS[property.operation];
  const typeLabel = PROPERTY_TYPE_LABELS[property.property_type];
  const isVenta = property.operation === 'venta';
  const mapsQuery = property.address && property.address.toLowerCase() !== property.location.toLowerCase()
    ? `${property.address}, ${property.location}`
    : property.address || property.location;
  const hasValidCoords =
    typeof property.lat === 'number' &&
    typeof property.lng === 'number' &&
    Number.isFinite(property.lat) &&
    Number.isFinite(property.lng) &&
    property.lat >= -90 &&
    property.lat <= 90 &&
    property.lng >= -180 &&
    property.lng <= 180;
  const mapsUrl = hasValidCoords
    ? `https://www.google.com/maps?q=${encodeURIComponent(`${property.lat},${property.lng}`)}&z=15&output=embed`
    : `https://www.google.com/maps?q=${encodeURIComponent(mapsQuery)}&z=${property.address ? 15 : 12}&output=embed`;

  return (
    <div className="min-h-screen pb-24 lg:pb-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <Link
          to="/"
          className="inline-flex items-center gap-1.5 text-sm font-medium text-primary-600 hover:text-primary-900 transition-colors mb-4"
        >
          <ArrowLeft className="w-4 h-4" />
          Volver al catálogo
        </Link>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 lg:gap-8">
          <div className="lg:col-span-3">
            <div className="relative aspect-[16/10] rounded-2xl overflow-hidden bg-primary-100 group">
              {hasImages ? (
                <img
                  src={safeImages[currentImage] ?? safeImages[0]}
                  alt={`${property.title} - foto ${currentImage + 1}`}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <MapPin className="w-16 h-16 text-primary-300" />
                </div>
              )}

              {hasImages && safeImages.length > 1 && (
                <>
                  <button
                    onClick={prevImage}
                    className="absolute left-3 top-1/2 -translate-y-1/2 w-10 h-10 flex items-center justify-center bg-primary-50/90 backdrop-blur-sm rounded-full shadow-md hover:bg-primary-100 transition-colors opacity-0 group-hover:opacity-100 transition-opacity"
                    aria-label="Foto anterior"
                  >
                    <ChevronLeft className="w-5 h-5 text-primary-800" />
                  </button>
                  <button
                    onClick={nextImage}
                    className="absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 flex items-center justify-center bg-primary-50/90 backdrop-blur-sm rounded-full shadow-md hover:bg-primary-100 transition-colors opacity-0 group-hover:opacity-100 transition-opacity"
                    aria-label="Foto siguiente"
                  >
                    <ChevronRight className="w-5 h-5 text-primary-800" />
                  </button>
                  <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
                    {safeImages.map((_, idx) => (
                      <button
                        key={idx}
                        onClick={() => setCurrentImage(idx)}
                        className={`h-1.5 rounded-full transition-all ${
                          idx === currentImage ? 'w-6 bg-white' : 'w-1.5 bg-primary-100/70 hover:bg-accent-600/90'
                        }`}
                        aria-label={`Ir a foto ${idx + 1}`}
                      />
                    ))}
                  </div>
                </>
              )}

              <div className="absolute top-3 left-3 flex gap-2">
                <span
                  className={`px-3 py-1 text-xs font-semibold rounded-full shadow-sm ${
                    isVenta ? 'bg-primary-700 text-white' : 'bg-accent-600 text-white'
                  }`}
                >
                  {opLabel}
                </span>
                <span className="px-3 py-1 text-xs font-medium bg-primary-900/90 backdrop-blur-sm text-accent-800 rounded-full shadow-sm">
                  {typeLabel}
                </span>
              </div>
            </div>

            {hasImages && safeImages.length > 1 && (
              <div className="mt-3 flex gap-2 overflow-x-auto no-scrollbar pb-1">
                {safeImages.map((img, idx) => (
                  <button
                    key={idx}
                    onClick={() => setCurrentImage(idx)}
                    className={`flex-shrink-0 w-20 h-16 rounded-lg overflow-hidden border-2 transition-colors ${
                      idx === currentImage ? 'border-primary-700' : 'border-transparent hover:border-primary-300'
                    }`}
                  >
                    <img src={img} alt={`Miniatura ${idx + 1}`} className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}

            <div className="mt-6 lg:hidden bg-white rounded-2xl border border-primary-100 p-5 shadow-sm">
              <DetailPriceBlock property={property} onShare={handleShare} onWhatsAppClick={handleWhatsAppClick} shareStatus={shareStatus} visitCount={visitCount} />
            </div>

            <div className="mt-6 bg-white rounded-2xl border border-primary-100 p-6 shadow-sm">
              <h2 className="text-lg font-bold text-primary-900 mb-3">Descripción</h2>
              <p className="text-primary-700 leading-relaxed whitespace-pre-line text-sm sm:text-base">
                {property.description}
              </p>
            </div>

            <div className="mt-6 bg-white rounded-2xl border border-primary-100 p-6 shadow-sm">
              <h2 className="text-lg font-bold text-primary-900 mb-4">Ficha técnica</h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                <SpecItem icon={<BedDouble className="w-4 h-4" />} label="Dormitorios" value={property.bedrooms != null ? property.bedrooms.toString() : '—'} />
                <SpecItem icon={<Bath className="w-4 h-4" />} label="Baños" value={property.bathrooms != null ? property.bathrooms.toString() : '—'} />
                <SpecItem icon={<Car className="w-4 h-4" />} label="Cocheras" value={property.parking > 0 ? property.parking.toString() : '—'} />
                <SpecItem icon={<Maximize className="w-4 h-4" />} label="m² cubiertos" value={property.covered_area != null && property.covered_area > 0 ? `${property.covered_area} m²` : '—'} />
                <SpecItem icon={<Maximize className="w-4 h-4" />} label="m² totales" value={property.total_area != null && property.total_area > 0 ? `${property.total_area} m²` : '—'} />
                <SpecItem icon={<MapPin className="w-4 h-4" />} label="Ubicación" value={property.location} />
              </div>
            </div>

            {property.amenities.length > 0 && (
              <div className="mt-6 bg-white rounded-2xl border border-primary-100 p-6 shadow-sm">
                <h2 className="text-lg font-bold text-primary-900 mb-4">Comodidades</h2>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {property.amenities.map((amenity) => (
                    <div key={amenity} className="flex items-center gap-2 text-sm text-primary-700">
                      <span className="w-5 h-5 flex items-center justify-center bg-accent-100 rounded-full flex-shrink-0">
                        <Check className="w-3 h-3 text-accent-700" />
                      </span>
                      {amenity}
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="mt-6 bg-white rounded-2xl border border-primary-100 p-6 shadow-sm">
              <h2 className="text-lg font-bold text-primary-900 mb-4">Ubicación</h2>
              <div className="rounded-xl overflow-hidden border border-primary-100">
                <iframe
                  src={mapsUrl}
                  className="w-full h-64 sm:h-80"
                  loading="lazy"
                  sandbox="allow-scripts allow-same-origin allow-popups"
                  title={`Mapa de ${property.location}`}
                  referrerPolicy="no-referrer"
                />
              </div>
              {property.address && (
                <p className="mt-3 text-sm text-primary-600 flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-primary-400" />
                  {property.address}
                </p>
              )}
            </div>
          </div>

          <div className="lg:col-span-2">
            <div className="lg:sticky lg:top-20 hidden lg:block bg-white rounded-2xl border border-primary-100 p-6 shadow-sm">
              <DetailPriceBlock property={property} onShare={handleShare} onWhatsAppClick={handleWhatsAppClick} shareStatus={shareStatus} visitCount={visitCount} />
            </div>
          </div>
        </div>
      </div>

      <div className="fixed bottom-0 left-0 right-0 z-50 lg:hidden">
        <div className="bg-white border-t border-primary-100 px-4 py-3 shadow-lg">
          <div className="flex items-center justify-between gap-3">
            <div className="min-w-0 flex-1">
              <p className="text-xs text-primary-500 truncate">{property.ref_code}</p>
              <p className="font-bold text-primary-900 text-sm truncate">
                {formatPrice(property.price, property.currency)}
                {property.operation === 'alquiler' && <span className="text-xs font-normal text-primary-500">/mes</span>}
              </p>
            </div>
            <a
              href={buildWhatsAppLink(property)}
              target="_blank"
              rel="noopener noreferrer"
              onClick={handleWhatsAppClick}
              className="flex items-center gap-2 px-5 py-3 text-sm font-semibold text-white bg-whatsapp hover:bg-whatsapp-dark rounded-xl transition-colors shadow-md flex-shrink-0"
            >
              <Phone className="w-4 h-4" />
              Consultar
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}

function DetailPriceBlock({ property, onShare, onWhatsAppClick, shareStatus, visitCount }: { property: Property; onShare: () => void; onWhatsAppClick: () => void; shareStatus: string | null; visitCount: number | null }) {
  return (
    <div>
      <p className="text-xs text-primary-500 mb-1">Ref: {property.ref_code}</p>
      <h1 className="text-xl font-bold text-primary-900 leading-snug mb-2">{property.title}</h1>
      <div className="flex items-center gap-3 mb-4">
        <p className="text-sm text-primary-600 flex items-center gap-1.5">
          <MapPin className="w-4 h-4 text-primary-400" />
          {property.location}
        </p>
        {visitCount !== null && (
          <span className="inline-flex items-center gap-1 text-xs font-medium text-primary-600 bg-primary-50 px-2 py-0.5 rounded-full">
            <Eye className="w-3.5 h-3.5" />
            {visitCount} {visitCount === 1 ? 'visita' : 'visitas'}
          </span>
        )}
      </div>

      <div className="flex items-baseline gap-1 mb-5">
        <span className="text-3xl font-bold text-primary-900">{formatPrice(property.price, property.currency)}</span>
        {property.operation === 'alquiler' && (
          <span className="text-sm font-normal text-primary-500">/mes</span>
        )}
      </div>

      <a
        href={buildWhatsAppLink(property)}
        target="_blank"
        rel="noopener noreferrer"
        onClick={onWhatsAppClick}
        className="flex items-center justify-center gap-2 w-full px-5 py-3.5 text-sm font-semibold text-white bg-whatsapp hover:bg-whatsapp-dark rounded-xl transition-colors shadow-md mb-3"
      >
        <Phone className="w-5 h-5" />
        Consultar por WhatsApp
      </a>

      <button
        onClick={onShare}
        className="flex items-center justify-center gap-2 w-full px-5 py-3 text-sm font-semibold text-primary-700 bg-primary-50 hover:bg-primary-100 rounded-xl transition-colors"
      >
        <Share2 className="w-4 h-4" />
        Compartir propiedad
      </button>
      {shareStatus && (
        <p className="mt-2 text-xs text-center text-accent-700 font-medium">{shareStatus}</p>
      )}

      <div className="mt-6 pt-6 border-t border-primary-100">
        <h3 className="text-sm font-semibold text-primary-900 mb-3">Resumen</h3>
        <div className="space-y-2.5 text-sm">
          <SummaryRow label="Operación" value={OPERATION_LABELS[property.operation]} />
          <SummaryRow label="Tipo" value={PROPERTY_TYPE_LABELS[property.property_type]} />
          {property.bedrooms !== null && property.bedrooms > 0 && (
            <SummaryRow label="Dormitorios" value={property.bedrooms.toString()} />
          )}
          {property.bathrooms !== null && property.bathrooms > 0 && (
            <SummaryRow label="Baños" value={property.bathrooms.toString()} />
          )}
          {property.covered_area !== null && property.covered_area > 0 && (
            <SummaryRow label="Sup. cubierta" value={`${property.covered_area} m²`} />
          )}
          {property.total_area !== null && property.total_area > 0 && (
            <SummaryRow label="Sup. total" value={`${property.total_area} m²`} />
          )}
          {property.parking > 0 && (
            <SummaryRow label="Cocheras" value={property.parking.toString()} />
          )}
        </div>
      </div>
    </div>
  );
}

function SpecItem({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-center gap-1.5 text-primary-400">
        {icon}
        <span className="text-xs font-medium text-primary-500">{label}</span>
      </div>
      <span className="text-sm font-semibold text-primary-900">{value}</span>
    </div>
  );
}

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-primary-500">{label}</span>
      <span className="font-medium text-primary-900">{value}</span>
    </div>
  );
}
