import { Building2, Phone } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { buildGeneralWhatsAppLink } from '@/lib/utils';
import BrandLogo from '@/components/BrandLogo';

export default function Header() {
  const location = useLocation();
  const isAdmin = location.pathname.startsWith('/admin');

  return (
    <header className="sticky top-0 z-50 bg-primary-50/95 backdrop-blur-md border-b border-primary-200 shadow-lg shadow-black/20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-[72px]">
          <Link to="/" className="flex items-center group" aria-label="ROMA Inmobiliaria - inicio">
            <BrandLogo className="h-12 w-20 sm:w-24" />
          </Link>

          <nav className="flex items-center gap-1 sm:gap-3">
            <Link
              to="/"
              className="px-3 sm:px-4 py-2 text-sm font-medium text-primary-500 hover:text-accent-700 hover:bg-primary-100 rounded-lg transition-colors"
            >
              Propiedades
            </Link>
            <a
              href={buildGeneralWhatsAppLink()}
              target="_blank"
              rel="noopener noreferrer"
              className="hidden sm:flex items-center gap-2 px-4 py-2 text-sm font-semibold text-primary-900 bg-whatsapp hover:bg-whatsapp-dark rounded-lg transition-colors shadow-sm"
            >
              <Phone className="w-4 h-4" />
              Contacto
            </a>
            {!isAdmin && (
              <Link
                to="/admin"
                className="p-2 text-primary-400 hover:text-accent-700 hover:bg-primary-100 rounded-lg transition-colors"
                title="Panel administrador"
                aria-label="Panel administrador"
              >
                <Building2 className="w-5 h-5" />
              </Link>
            )}
          </nav>
        </div>
      </div>
    </header>
  );
}
