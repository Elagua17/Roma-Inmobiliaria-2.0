import type { Property, Filters } from '@/types';
import { WHATSAPP_NUMBER } from '@/lib/constants';

export function sanitizeImageUrl(url: string | undefined | null): string {
  if (!url || typeof url !== 'string') return '';
  try {
    const parsed = new URL(url, window.location.origin);
    if (parsed.protocol === 'https:' || parsed.protocol === 'http:') {
      return parsed.href;
    }
  } catch {
    // URL inválida
  }
  return '';
}

export function formatPrice(price: number, currency: string): string {
  const formatted = new Intl.NumberFormat('es-AR', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(price);
  const symbol = currency === 'USD' ? 'US$' : '$';
  return `${symbol} ${formatted}`;
}

export function formatPriceShort(price: number, currency: string): string {
  const symbol = currency === 'USD' ? 'US$' : '$';
  if (price >= 1_000_000) return `${symbol} ${(price / 1_000_000).toFixed(1)}M`;
  if (price >= 1_000) return `${symbol} ${(price / 1_000).toFixed(0)}K`;
  return `${symbol} ${price}`;
}

export function buildWhatsAppLink(property: Property): string {
  const priceText = `${formatPrice(property.price, property.currency)}${property.operation === 'alquiler' ? '/mes' : ''}`;
  const message = `Hola, estoy interesado en la propiedad: ${property.title} (Ref: ${property.ref_code} - ${priceText}). ¿Sigue disponible para coordinar una visita?`;
  return `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;
}

export function buildGeneralWhatsAppLink(): string {
  const message = 'Hola, me gustaría recibir información sobre las propiedades disponibles.';
  return `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;
}

export function filterProperties(properties: Property[], filters: Filters): Property[] {
  return properties.filter((p) => {
    if (filters.operation !== 'all' && p.operation !== filters.operation) return false;
    if (filters.propertyType !== 'all' && p.property_type !== filters.propertyType) return false;
    if (filters.location && !p.location.toLowerCase().includes(filters.location.toLowerCase())) return false;
    if (filters.search) {
      const q = filters.search.toLowerCase();
      const matches =
        p.title.toLowerCase().includes(q) ||
        p.location.toLowerCase().includes(q) ||
        p.ref_code.toLowerCase().includes(q) ||
        (p.address?.toLowerCase().includes(q) ?? false);
      if (!matches) return false;
    }
    if (filters.bedrooms !== null) {
      if (filters.bedrooms >= 4) {
        if ((p.bedrooms ?? 0) < 4) return false;
      } else {
        if (p.bedrooms !== filters.bedrooms) return false;
      }
    }
    if (filters.bathrooms !== null) {
      if (filters.bathrooms >= 3) {
        if ((p.bathrooms ?? 0) < 3) return false;
      } else {
        if (p.bathrooms !== filters.bathrooms) return false;
      }
    }
    if (filters.minPrice !== null && filters.maxPrice !== null && filters.minPrice > filters.maxPrice) {
      return false;
    }
    if (filters.minPrice !== null && p.price < filters.minPrice) return false;
    if (filters.maxPrice !== null && p.price > filters.maxPrice) return false;
    if (filters.parking && p.parking === 0) return false;
    return true;
  });
}
