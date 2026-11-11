import React, { useState, useEffect, useCallback } from 'react';
import { LogOut, Plus, Pencil, Trash2, Eye, ImageIcon, BarChart3, Lock, AlertCircle, ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { supabase } from '@/lib/supabase';
import { Property } from '@/types';
import { formatPrice, sanitizeImageUrl } from '@/lib/utils';
import { OPERATION_LABELS } from '@/lib/constants';
import ClientManager from '@/components/admin/ClientManager';
import PropertyForm from '@/components/admin/PropertyForm';
import StatsPanel from '@/components/admin/StatsPanel';

const MAX_LOGIN_ATTEMPTS = 5;
const LOCKOUT_DURATION_MS = 60_000;

export default function AdminPage() {
  const [session, setSession] = useState<unknown>(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [authError, setAuthError] = useState('');
  const [loading, setLoading] = useState(true);
  const [loggingIn, setLoggingIn] = useState(false);
  const [failedAttempts, setFailedAttempts] = useState(0);
  const [lockoutUntil, setLockoutUntil] = useState<number | null>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoading(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (lockoutUntil && Date.now() < lockoutUntil) {
      const remainingSec = Math.ceil((lockoutUntil - Date.now()) / 1000);
      setAuthError(`Demasiados intentos. Esperá ${remainingSec} segundos.`);
      return;
    }

    setLoggingIn(true);
    setAuthError('');
    const { error } = await supabase.auth.signInWithPassword({
      email: email.trim().toLowerCase(),
      password,
    });
    if (error) {
      const nextAttempts = failedAttempts + 1;
      setFailedAttempts(nextAttempts);
      if (nextAttempts >= MAX_LOGIN_ATTEMPTS) {
        setLockoutUntil(Date.now() + LOCKOUT_DURATION_MS);
        setFailedAttempts(0);
        setAuthError('Demasiados intentos fallidos. Bloqueado por 60 segundos.');
      } else {
        setAuthError('Email o contraseña incorrectos.');
      }
    } else {
      setFailedAttempts(0);
      setLockoutUntil(null);
      setPassword('');
    }
    setLoggingIn(false);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  if (loading) {
    return <div className="min-h-screen bg-primary-50 flex justify-center items-center"><div className="w-8 h-8 border-2 border-primary-200 border-t-primary-600 rounded-full animate-spin" /></div>;
  }

  if (!session) {
    return (
      <div className="min-h-screen bg-transparent flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-sm">
          <Link
            to="/"
            className="inline-flex items-center gap-1.5 text-sm font-medium text-primary-400 hover:text-white transition-colors mb-6"
          >
            <ArrowLeft className="w-4 h-4" />
            Volver al inicio
          </Link>

          <div className="bg-primary-100 rounded-2xl border border-primary-200 shadow-xl p-8">
            <div className="w-14 h-14 rounded-2xl bg-primary-200 flex items-center justify-center mx-auto mb-5">
              <Lock className="w-7 h-7 text-primary-400" />
            </div>
            <h1 className="text-xl font-bold text-white text-center mb-1">Panel administrador</h1>
            <p className="text-sm text-primary-400 text-center mb-6">Inicia sesión con tu cuenta de administrador</p>

            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => { setEmail(e.target.value); setAuthError(''); }}
                  placeholder="Email"
                  autoFocus
                  required
                  className="w-full text-sm font-medium px-4 py-3 bg-primary-200 border border-primary-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 text-white placeholder:text-primary-500 transition-all"
                />
              </div>
              <div>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => { setPassword(e.target.value); setAuthError(''); }}
                  placeholder="Contraseña"
                  required
                  className="w-full text-sm font-medium px-4 py-3 bg-primary-200 border border-primary-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 text-white placeholder:text-primary-500 transition-all"
                />
              </div>
              {authError && (
                <p className="mt-2 text-xs text-red-500 text-center flex items-center justify-center gap-1">
                  <AlertCircle className="w-3.5 h-3.5" />
                  {authError}
                </p>
              )}
              <button
                type="submit"
                disabled={loggingIn}
                className="w-full mt-4 px-5 py-3 text-sm font-bold text-white bg-primary-700 hover:bg-primary-800 rounded-xl transition-colors disabled:opacity-50"
              >
                {loggingIn ? 'Ingresando...' : 'Ingresar'}
              </button>
            </form>
          </div>
        </div>
      </div>
    );
  }

  return <AdminDashboard onLogout={handleLogout} />;
}

function AdminDashboard({ onLogout }: { onLogout: () => void }) {
  const [activeTab, setActiveTab] = useState<'properties' | 'clients'>('properties');
  
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editing, setEditing] = useState<Property | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [showStats, setShowStats] = useState(false);

  const fetchProperties = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('properties')
      .select('*, client:clients(*)')
      .order('created_at', { ascending: false });
    if (error) {
      setError('No pudimos cargar las propiedades.');
    } else {
      setProperties((data ?? []) as Property[]);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    if (activeTab === 'properties') {
      fetchProperties();
    }
  }, [fetchProperties, activeTab]);

  const handleEdit = (property: Property) => {
    setEditing(property);
    setShowForm(true);
  };

  const handleNew = () => {
    setEditing(null);
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('¿Eliminar esta propiedad? Esta acción no se puede deshacer.')) return;
    const target = properties.find((p) => p.id === id);
    const { error } = await supabase.from('properties').delete().eq('id', id);
    if (error) {
      toast.error('Error al eliminar la propiedad.');
    } else {
      if (target && target.images.length > 0) {
        const paths = target.images
          .map((url) => url.split('/property-images/')[1])
          .filter((p): p is string => Boolean(p));
        if (paths.length > 0) {
          await supabase.storage.from('property-images').remove(paths);
        }
      }
      toast.success('Propiedad eliminada correctamente.');
      setProperties((prev) => prev.filter((p) => p.id !== id));
    }
  };

  const handleSaved = () => {
    setShowForm(false);
    setEditing(null);
    fetchProperties();
    toast.success('Propiedad guardada exitosamente.');
  };

  return (
    <div className="min-h-screen bg-transparent">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
          <div>
            <h1 className="text-2xl font-bold text-white">Panel administrador</h1>
            <p className="text-sm text-primary-400 mt-0.5">Gestioná tu inmobiliaria</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={onLogout}
              className="flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-white bg-primary-100 hover:bg-primary-200 border border-primary-200 rounded-lg transition-colors"
            >
              <LogOut className="w-4 h-4" />
              Salir
            </button>
          </div>
        </div>

        <div className="flex items-center gap-4 border-b border-primary-200 mb-6">
          <button
            onClick={() => setActiveTab('properties')}
            className={`pb-3 text-sm font-semibold border-b-2 transition-colors ${
              activeTab === 'properties' ? 'border-primary-700 text-primary-700' : 'border-transparent text-primary-400 hover:text-primary-600'
            }`}
          >
            Propiedades
          </button>
          <button
            onClick={() => setActiveTab('clients')}
            className={`pb-3 text-sm font-semibold border-b-2 transition-colors ${
              activeTab === 'clients' ? 'border-primary-700 text-primary-700' : 'border-transparent text-primary-400 hover:text-primary-600'
            }`}
          >
            Clientes
          </button>
        </div>

        {activeTab === 'properties' && (
          <>
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-lg font-bold text-white">Propiedades</h2>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setShowStats(true)}
                  className="flex items-center gap-2 px-4 py-2.5 text-sm font-semibold text-white bg-primary-100 hover:bg-primary-200 border border-primary-200 rounded-lg transition-colors shadow-sm"
                >
                  <BarChart3 className="w-4 h-4" />
                  Estadísticas
                </button>
                <button
                  onClick={handleNew}
                  className="flex items-center gap-2 px-4 py-2.5 text-sm font-semibold text-white bg-primary-700 hover:bg-primary-800 rounded-lg transition-colors shadow-sm"
                >
                  <Plus className="w-4 h-4" />
                  Nueva propiedad
                </button>
              </div>
            </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl p-4 mb-6 text-sm">
            {error}
          </div>
        )}

        {loading ? (
          <div className="flex flex-col items-center py-20">
            <div className="w-10 h-10 border-3 border-primary-200 border-t-primary-700 rounded-full animate-spin" />
            <p className="mt-4 text-sm text-primary-500">Cargando...</p>
          </div>
        ) : properties.length === 0 ? (
          <div className="text-center py-20 bg-primary-50 rounded-2xl">
            <p className="text-primary-700 font-semibold text-lg">No hay propiedades cargadas</p>
            <p className="text-primary-500 text-sm mt-1 mb-4">Empezá agregando tu primera propiedad</p>
            <button
              onClick={handleNew}
              className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-semibold text-white bg-primary-700 hover:bg-primary-800 rounded-lg transition-colors"
            >
              <Plus className="w-4 h-4" />
              Nueva propiedad
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {properties.map((p) => (
              <div
                key={p.id}
                className="flex items-center gap-3 sm:gap-4 bg-primary-100 border border-primary-200 rounded-xl p-3 sm:p-4 hover:shadow-md transition-shadow"
              >
                <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-lg overflow-hidden bg-primary-200 flex-shrink-0">
                  {sanitizeImageUrl(p.images[0]) ? (
                    <img src={sanitizeImageUrl(p.images[0])} alt={p.title} className="w-full h-full object-cover opacity-80" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <ImageIcon className="w-6 h-6 text-primary-400" />
                    </div>
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`px-2 py-0.5 text-[10px] font-semibold rounded-full ${
                      p.operation === 'venta' ? 'bg-primary-200 text-primary-600' : 'bg-accent-200 text-accent-600'
                    }`}>
                      {OPERATION_LABELS[p.operation]}
                    </span>
                    <span className="text-[10px] font-medium text-primary-400">{p.ref_code}</span>
                  </div>
                  <h3 className="font-semibold text-white text-sm line-clamp-1">{p.title}</h3>
                  <p className="text-xs text-primary-400 line-clamp-1">{p.location}</p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <p className="text-sm font-bold text-primary-600">{formatPrice(p.price, p.currency)}</p>
                    <span className="inline-flex items-center gap-1 text-[10px] font-medium text-primary-400 bg-primary-200 px-1.5 py-0.5 rounded-full">
                      <Eye className="w-3 h-3" />
                      {p.visit_count ?? 0}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-1 sm:gap-2 flex-shrink-0">
                  <button
                    onClick={() => handleEdit(p)}
                    className="p-2 text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
                    aria-label="Editar"
                  >
                    <Pencil className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(p.id)}
                    className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                    aria-label="Eliminar"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
          </>
        )}

        {activeTab === 'clients' && (
          <ClientManager />
        )}
      </div>

      {showForm && (
        <PropertyForm
          property={editing}
          onClose={() => {
            setShowForm(false);
            setEditing(null);
          }}
          onSaved={handleSaved}
        />
      )}

      {showStats && (
        <StatsPanel properties={properties} onClose={() => setShowStats(false)} />
      )}
    </div>
  );
}


