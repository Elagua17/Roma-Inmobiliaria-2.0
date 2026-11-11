import React from 'react';
import { BarChart3, X, Eye, TrendingUp, MessageCircle, Share2 } from 'lucide-react';
import { Property } from '@/types';

function StatsPanel({ properties, onClose }: { properties: Property[]; onClose: () => void }) {
  // Sort properties by visit_count
  const sortedProperties = [...properties].sort((a, b) => (b.visit_count ?? 0) - (a.visit_count ?? 0));
  
  const totalVisits = sortedProperties.reduce((sum, p) => sum + (p.visit_count ?? 0), 0);
  const maxVisits = sortedProperties.length > 0 ? (sortedProperties[0].visit_count ?? 0) : 0;

  return (
    <div className="fixed inset-0 z-50 flex items-start sm:items-center justify-center bg-primary-900/60 backdrop-blur-sm p-0 sm:p-4 overflow-y-auto">
      <div className="bg-white w-full sm:max-w-3xl sm:rounded-2xl shadow-2xl min-h-screen sm:min-h-0 sm:max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-primary-100 px-5 sm:px-6 py-4 flex items-center justify-between z-10">
          <div className="flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-primary-700" />
            <h2 className="text-lg font-bold text-primary-900">Estadísticas de la Inmobiliaria</h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-primary-500 hover:bg-primary-50 rounded-lg transition-colors"
            aria-label="Cerrar"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5 sm:p-6 space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-gradient-to-br from-primary-50 to-primary-100 border border-primary-200 rounded-xl p-5">
              <div className="flex items-center gap-2 mb-2">
                <Eye className="w-5 h-5 text-primary-600" />
                <span className="text-xs font-semibold text-primary-600 uppercase tracking-wide">Visitas totales</span>
              </div>
              <p className="text-3xl font-bold text-primary-900">{totalVisits.toLocaleString('es-AR')}</p>
            </div>
            <div className="bg-gradient-to-br from-accent-50 to-accent-100 border border-accent-200 rounded-xl p-5">
              <div className="flex items-center gap-2 mb-2">
                <TrendingUp className="w-5 h-5 text-accent-600" />
                <span className="text-xs font-semibold text-accent-600 uppercase tracking-wide">Propiedades</span>
              </div>
              <p className="text-3xl font-bold text-primary-900">{properties.length}</p>
            </div>
            <div className="bg-gradient-to-br from-primary-50 to-accent-50 border border-primary-200 rounded-xl p-5">
              <div className="flex items-center gap-2 mb-2">
                <BarChart3 className="w-5 h-5 text-primary-600" />
                <span className="text-xs font-semibold text-primary-600 uppercase tracking-wide">Promedio por prop.</span>
              </div>
              <p className="text-3xl font-bold text-primary-900">
                {properties.length > 0 ? Math.round(totalVisits / properties.length).toLocaleString('es-AR') : '0'}
              </p>
            </div>
          </div>

          <div>
            <h3 className="text-sm font-bold text-primary-900 mb-3">Ranking de Propiedades</h3>
            <div className="space-y-2">
              {sortedProperties.length === 0 ? (
                <p className="text-sm text-primary-500 py-4 text-center">No hay propiedades cargadas aún.</p>
              ) : (
                sortedProperties.map((p, idx) => {
                  const visits = p.visit_count ?? 0;
                  const whatsapp = p.whatsapp_clicks ?? 0;
                  const shares = p.shares ?? 0;
                  const barWidth = maxVisits > 0 ? (visits / maxVisits) * 100 : 0;
                  return (
                    <div key={p.id} className="flex items-center gap-3 bg-primary-50 border border-primary-100 rounded-xl p-3">
                      <span className="flex-shrink-0 w-7 h-7 flex items-center justify-center text-xs font-bold text-primary-700 bg-primary-100 rounded-full">
                        {idx + 1}
                      </span>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-primary-900 line-clamp-1">{p.title}</p>
                        <p className="text-xs text-primary-500 line-clamp-1">{p.location} · {p.ref_code}</p>
                        <div className="mt-1.5 h-1.5 bg-primary-100 rounded-full overflow-hidden">
                          <div className="h-full bg-accent-500 rounded-full transition-all" style={{ width: `${barWidth}%` }} />
                        </div>
                      </div>
                      <div className="flex-shrink-0 flex items-center gap-3">
                        <span className="inline-flex items-center gap-1 text-sm font-bold text-primary-800" title="Visitas">
                          <Eye className="w-3.5 h-3.5 text-primary-400" />
                          {visits}
                        </span>
                        <span className="inline-flex items-center gap-1 text-sm font-bold text-primary-800" title="Clics a WhatsApp">
                          <MessageCircle className="w-3.5 h-3.5 text-[#25D366]" />
                          {whatsapp}
                        </span>
                        <span className="inline-flex items-center gap-1 text-sm font-bold text-primary-800" title="Veces Compartido">
                          <Share2 className="w-3.5 h-3.5 text-primary-400" />
                          {shares}
                        </span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default StatsPanel;
