import { Phone, MapPin, Building2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { buildGeneralWhatsAppLink } from '@/lib/utils';
import BrandLogo from '@/components/BrandLogo';

export default function Footer() {
  return (
    <footer className="bg-primary-50 text-primary-500 mt-20 border-t border-primary-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
          <div>
            <BrandLogo className="h-20 w-36 sm:w-44 mb-5" />
            <p className="text-sm text-primary-500 leading-relaxed max-w-xs">
              Propiedades seleccionadas, atención cercana y oportunidades para encontrar tu próximo hogar.
            </p>
          </div>

          <div>
            <h3 className="text-accent-700 font-semibold mb-4 text-sm uppercase tracking-[0.18em]">Contacto</h3>
            <ul className="space-y-3 text-sm">
              <li className="flex items-center gap-3"><Phone className="w-4 h-4 text-accent-600 flex-shrink-0" /><a href={buildGeneralWhatsAppLink()} target="_blank" rel="noopener noreferrer" className="hover:text-accent-700 transition-colors">+54 9 3434 47-8206</a></li>
              <li className="flex items-center gap-3"><MapPin className="w-4 h-4 text-accent-600 flex-shrink-0" /><span>Blas Parera 575, Paraná, Entre Ríos, Argentina</span></li>
            </ul>
          </div>

          <div>
            <h3 className="text-accent-700 font-semibold mb-4 text-sm uppercase tracking-[0.18em]">Navegación</h3>
            <ul className="space-y-2 text-sm">
              <li><Link to="/?op=venta" className="hover:text-accent-700 transition-colors">Propiedades en venta</Link></li>
              <li><Link to="/?op=alquiler" className="hover:text-accent-700 transition-colors">Propiedades en alquiler</Link></li>
              <li><Link to="/admin" className="hover:text-accent-700 transition-colors flex items-center gap-2"><Building2 className="w-4 h-4" />Panel administrador</Link></li>
            </ul>
          </div>
        </div>

        <div className="border-t border-primary-200 mt-10 pt-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs text-primary-400">© {new Date().getFullYear()} ROMA INMOBILIARIA. Todos los derechos reservados.</p>
          <p className="text-xs text-primary-400">Elegancia, confianza y patrimonio.</p>
        </div>
      </div>
    </footer>
  );
}
