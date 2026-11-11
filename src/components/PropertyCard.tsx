import { BedDouble, Bath, Maximize, Car, MapPin, ChevronRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import type { Property } from '@/types';
import { formatPrice, sanitizeImageUrl } from '@/lib/utils';
import { PROPERTY_TYPE_LABELS, OPERATION_LABELS } from '@/lib/constants';

interface PropertyCardProps { property: Property; }

export default function PropertyCard({ property }: PropertyCardProps) {
  const opLabel = OPERATION_LABELS[property.operation];
  const typeLabel = PROPERTY_TYPE_LABELS[property.property_type];
  const coverUrl = sanitizeImageUrl(property.images[0]);
  const hasImage = Boolean(coverUrl);

  return (
    <Link to={`/propiedad/${encodeURIComponent(property.id)}`} className="group bg-white rounded-2xl overflow-hidden border border-primary-200 shadow-sm hover:shadow-gold hover:border-accent-600 transition-all duration-300 animate-slide-up">
      <div className="relative aspect-[4/3] overflow-hidden bg-primary-100">
        {hasImage ? <img src={coverUrl} alt={property.title} loading="lazy" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" /> : <div className="w-full h-full flex items-center justify-center bg-primary-100"><MapPin className="w-12 h-12 text-primary-400" /></div>}
        <div className="absolute top-3 left-3 flex gap-2">
          <span className="px-3 py-1 text-xs font-bold rounded-full shadow-sm bg-accent-600 text-primary-900">{opLabel}</span>
        </div>
        <div className="absolute bottom-3 left-3"><span className="px-3 py-1 text-xs font-medium bg-primary-900/85 backdrop-blur-sm text-accent-800 rounded-full shadow-sm">{typeLabel}</span></div>
      </div>

      <div className="p-4">
        <h3 className="font-semibold text-primary-900 text-base leading-snug line-clamp-2 group-hover:text-accent-700 transition-colors">{property.title}</h3>
        <p className="text-sm text-primary-500 mt-2 mb-3 flex items-center gap-1 line-clamp-1"><MapPin className="w-3.5 h-3.5 flex-shrink-0 text-accent-600" />{property.location}</p>
        <p className="text-lg font-bold text-accent-700 mb-3">{formatPrice(property.price, property.currency)}{property.operation === 'alquiler' && <span className="text-sm font-normal text-primary-500">/mes</span>}</p>
        <div className="flex items-center gap-3 sm:gap-4 text-primary-500 text-sm flex-wrap">
          {property.bedrooms !== null && property.bedrooms > 0 && <span className="flex items-center gap-1"><BedDouble className="w-4 h-4 text-accent-600" />{property.bedrooms} amb.</span>}
          {property.bathrooms !== null && property.bathrooms > 0 && <span className="flex items-center gap-1"><Bath className="w-4 h-4 text-accent-600" />{property.bathrooms} baño{property.bathrooms > 1 ? 's' : ''}</span>}
          {property.covered_area !== null && property.covered_area > 0 && <span className="flex items-center gap-1"><Maximize className="w-4 h-4 text-accent-600" />{property.covered_area} m²</span>}
          {property.parking > 0 && <span className="flex items-center gap-1"><Car className="w-4 h-4 text-accent-600" />{property.parking} coch.</span>}
        </div>
        <div className="mt-3 pt-3 border-t border-primary-200"><span className="text-sm font-semibold text-accent-700 group-hover:text-accent-800 transition-colors inline-flex items-center gap-1">Ver detalles<ChevronRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" /></span></div>
      </div>
    </Link>
  );
}
