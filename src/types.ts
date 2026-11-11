export type Operation = 'venta' | 'alquiler';
export type PropertyType = 'casa' | 'departamento' | 'terreno' | 'local' | 'campo' | 'galpon';
export type Currency = 'USD' | 'ARS';

export interface Client {
  id: string;
  first_name: string;
  last_name: string;
  phone: string | null;
  email: string | null;
  notes: string | null;
  properties?: Pick<Property, 'id' | 'title' | 'ref_code'>[];
  created_at: string;
  updated_at: string;
}

export interface Property {
  id: string;
  ref_code: string;
  title: string;
  description: string;
  operation: Operation;
  property_type: PropertyType;
  price: number;
  currency: Currency;
  location: string;
  address: string | null;
  bedrooms: number | null;
  bathrooms: number | null;
  parking: number;
  covered_area: number | null;
  total_area: number | null;
  amenities: string[];
  images: string[];
  lat: number | null;
  lng: number | null;
  featured: boolean;
  visit_count: number;
  whatsapp_clicks?: number;
  shares?: number;
  client_id?: string | null;
  client?: Client;
  created_at: string;
  updated_at: string;
}

export interface Filters {
  search: string;
  operation: Operation | 'all';
  propertyType: PropertyType | 'all';
  location: string;
  bedrooms: number | null;
  bathrooms: number | null;
  minPrice: number | null;
  maxPrice: number | null;
  parking: boolean;
}
