// src/pages/Admin.tsx — HUB GENERAL BUSES.APP BACKOFFICE
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import {
  LayoutDashboard, Shield, Bus, Package, Truck,
  LogOut, Menu, X, Eye, EyeOff, Loader2, Lock,
  AlertCircle, ChevronRight, Users, FileCheck,
  MapPin, HeadphonesIcon, Settings, Zap, Activity, BarChart3,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface AdminUser { id: string; email: string; fullName: string; }

// ════════════════════════════════════════════════════════════
// LOGIN
// ════════════════════════════════════════════════════════════
function AdminLogin({ onLogin }: { onLogin: (u: AdminUser) => void }) {
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw]     = useState(false);
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState('');
  const { toast }               = useToast();

  const handleLogin = async () => {
    if (!email || !password) { setError('Completa todos los campos'); return; }
    setLoading(true); setError('');
    try {
      const { data, error: authErr } = await supabase.auth.signInWithPassword({ email, password });
      if (authErr) throw authErr;
      const { data: profile, error: pErr } = await supabase
        .from('profiles').select('role, full_name').eq('id', data.user!.id).single();
      if (pErr || profile?.role !== 'super_admin') {
        await supabase.auth.signOut();
        throw new Error('Acceso denegado. No tienes permisos de administrador.');
      }
      onLogin({ id: data.user!.id, email: data.user!.email!, fullName: profile.full_name ?? email });
      toast({ title: `Bienvenido, ${profile.full_name ?? email}` });
    } catch (err: any) {
      setError(err.message ?? 'Error al iniciar sesión');
    } finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen bg-zinc-950 flex items-center justify-center p-4">
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-40 -right-40 w-96 h-96 rounded-full bg-primary/8 blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-96 h-96 rounded-full bg-primary/5 blur-3xl" />
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.015)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.015)_1px,transparent_1px)] bg-[size:72px_72px]" />
      </div>
      <div className="relative w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-zinc-900 border border-zinc-700 mb-4">
            <Lock className="h-7 w-7 text-primary" />
          </div>
          <h1 className="text-xl font-bold text-white">Buses.App Backoffice</h1>
          <p className="text-zinc-600 text-xs mt-1">Acceso restringido — Super Admin</p>
        </div>
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-7 space-y-4 shadow-2xl">
          {error && (
            <div className="bg-red-950/60 border border-red-900 rounded-xl p-3 flex items-center gap-2">
              <AlertCircle className="h-4 w-4 text-red-400 shrink-0" />
              <p className="text-xs text-red-300">{error}</p>
            </div>
          )}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-zinc-500">Correo</label>
            <input type="email" value={email} onChange={e => setEmail(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleLogin()} placeholder="admin@buses.app"
              className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-3.5 py-2.5 text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-primary/60 transition-all" />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-zinc-500">Contraseña</label>
            <div className="relative">
              <input type={showPw ? 'text' : 'password'} value={password}
                onChange={e => setPassword(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleLogin()} placeholder="••••••••"
                className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-3.5 py-2.5 pr-10 text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-primary/60 transition-all" />
              <button onClick={() => setShowPw(v => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-600 hover:text-zinc-300 transition-colors">
                {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>
          <button onClick={handleLogin} disabled={loading}
            className="w-full py-2.5 rounded-xl bg-primary text-primary-foreground font-semibold text-sm hover:bg-primary/90 disabled:opacity-50 flex items-center justify-center gap-2 transition-all mt-2">
            {loading ? <><Loader2 className="h-4 w-4 animate-spin" />Verificando…</> : 'Ingresar'}
          </button>
        </div>
        <p className="text-center text-xs text-zinc-800 mt-5">Buses.App © {new Date().getFullYear()}</p>
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════════════
// STAT CARD
// ════════════════════════════════════════════════════════════
function StatCard({ label, value, icon: Icon, accent = 'text-primary', sub }: {
  label: string; value: number | string; icon: React.ElementType; accent?: string; sub?: string;
}) {
  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs text-zinc-500 font-medium">{label}</p>
          <p className="text-2xl font-bold text-white mt-1">{value}</p>
          {sub && <p className="text-xs text-zinc-600 mt-0.5">{sub}</p>}
        </div>
        <div className={cn('w-9 h-9 rounded-xl bg-zinc-800 flex items-center justify-center shrink-0', accent)}>
          <Icon className="h-4 w-4" />
        </div>
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════════════
// DASHBOARD GENERAL
// ════════════════════════════════════════════════════════════
function DashboardGeneral({ onNavigate }: { onNavigate: (path: string) => void }) {
  const [data, setData]       = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      const [
        { count: transporters },
        { count: pendingDocs },
        { count: activeRoutes },
        { count: operators },
      ] = await Promise.all([
        supabase.from('wemove_transporters').select('*', { count: 'exact', head: true }),
        supabase.from('wemove_transporters').select('*', { count: 'exact', head: true })
          .eq('verification_status', 'pending').eq('documents_submitted', true),
        supabase.from('wemove_routes').select('*', { count: 'exact', head: true }).eq('status', 'active'),
        supabase.from('wemove_operators').select('*', { count: 'exact', head: true }),
      ]);
      setData({ transporters, pendingDocs, activeRoutes, operators });
      setLoading(false);
    };
    load();
  }, []);

  const platforms = [
    {
      name: 'WeMove', icon: Bus, color: 'text-blue-400', border: 'border-blue-900/40',
      status: 'activo', route: '/admin/wemove',
      stats: loading ? [] : [
        { label: 'Transportadores', value: data?.transporters ?? 0 },
        { label: 'Viajes activos',  value: data?.activeRoutes  ?? 0 },
        { label: 'Docs pendientes', value: data?.pendingDocs   ?? 0, alert: (data?.pendingDocs ?? 0) > 0 },
      ],
    },
    {
      name: 'PackService', icon: Package, color: 'text-amber-400', border: 'border-amber-900/30',
      status: 'activo', route: '/admin/packservice',
      stats: [
        { label: 'Transacciones', value: '—' },
        { label: 'En disputa',    value: '—' },
        { label: 'En tránsito',   value: '—' },
      ],
    },
    {
      name: 'Pasajes', icon: Truck, color: 'text-green-400', border: 'border-zinc-800',
      status: 'próximamente', route: null,
      stats: [{ label: 'Empresas', value: '—' }, { label: 'Rutas', value: '—' }, { label: 'Reservas', value: '—' }],
    },
    { name: 'Servicio 4', icon: Zap,       color: 'text-purple-400', border: 'border-zinc-800', status: 'próximamente', route: null, stats: [] },
    { name: 'Servicio 5', icon: Activity,  color: 'text-pink-400',   border: 'border-zinc-800', status: 'próximamente', route: null, stats: [] },
    { name: 'Servicio 6', icon: BarChart3, color: 'text-cyan-400',   border: 'border-zinc-800', status: 'próximamente', route: null, stats: [] },
  ];

  return (
    <div className="space-y-7">
      <div>
        <h2 className="text-xl font-bold text-white">Dashboard general</h2>
        <p className="text-sm text-zinc-500 mt-0.5">Estado de todas las plataformas Buses.App</p>
      </div>

      {/* Métricas rápidas */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard label="Transportadores WeMove" value={loading ? '…' : (data?.transporters ?? 0)} icon={Users}          accent="text-blue-400" />
        <StatCard label="Viajes activos"          value={loading ? '…' : (data?.activeRoutes  ?? 0)} icon={MapPin}         accent="text-green-400" />
        <StatCard label="Docs pendientes"         value={loading ? '…' : (data?.pendingDocs   ?? 0)} icon={FileCheck}      accent="text-amber-400" />
        <StatCard label="Operadores soporte"      value={loading ? '…' : (data?.operators     ?? 0)} icon={HeadphonesIcon} accent="text-primary" />
      </div>

      {/* Grid de plataformas */}
      <div>
        <p className="text-xs font-semibold text-zinc-600 uppercase tracking-wider mb-3">Plataformas</p>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {platforms.map(p => (
            <div key={p.name}
              onClick={() => p.route && onNavigate(p.route)}
              className={cn(
                'bg-zinc-900 border rounded-2xl p-5 space-y-3 transition-all',
                p.route ? 'cursor-pointer hover:border-zinc-600 hover:bg-zinc-800/60 group' : 'opacity-50 cursor-default',
                p.border,
              )}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className={cn('w-8 h-8 rounded-xl bg-zinc-800 flex items-center justify-center', p.color)}>
                    <p.icon className="h-4 w-4" />
                  </div>
                  <span className="text-sm font-bold text-white">{p.name}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className={cn('text-xs px-2 py-0.5 rounded-full border',
                    p.status === 'activo'
                      ? 'text-green-400 bg-green-950 border-green-800'
                      : 'text-zinc-500 bg-zinc-800 border-zinc-700')}>
                    {p.status}
                  </span>
                  {p.route && <ChevronRight className="h-3.5 w-3.5 text-zinc-600 group-hover:text-zinc-300 transition-colors" />}
                </div>
              </div>
              {p.stats.length > 0 ? (
                <div className="space-y-2 pt-1">
                  {p.stats.map((s: any) => (
                    <div key={s.label} className="flex items-center justify-between">
                      <span className="text-xs text-zinc-500">{s.label}</span>
                      <span className={cn('text-sm font-bold', s.alert ? 'text-amber-400' : 'text-white')}>{s.value}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-zinc-700 text-center py-2">Sin datos disponibles</p>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════════════
// SIDEBAR
// ════════════════════════════════════════════════════════════
type SideSection = 'dashboard' | 'settings';

function Sidebar({ section, onSection, onNavigate, onClose }: {
  section: SideSection;
  onSection: (s: SideSection) => void;
  onNavigate: (path: string) => void;
  onClose: () => void;
}) {
  const platforms = [
    { label: 'WeMove',       icon: Bus,      route: '/admin/wemove',       active: true },
    { label: 'PackService',  icon: Package,  route: '/admin/packservice',  active: true },
    { label: 'Pasajes',      icon: Truck,    route: null,                  active: false },
    { label: 'Servicio 4',   icon: Zap,      route: null,                  active: false },
    { label: 'Servicio 5',   icon: Activity, route: null,                  active: false },
    { label: 'Servicio 6',   icon: BarChart3,route: null,                  active: false },
  ];

  return (
    <nav className="flex flex-col h-full py-4 overflow-y-auto">
      {/* Dashboard */}
      <div className="px-3 mb-4">
        <button onClick={() => { onSection('dashboard'); onClose(); }}
          className={cn('w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all',
            section === 'dashboard'
              ? 'bg-primary/15 text-primary border border-primary/20'
              : 'text-zinc-400 hover:bg-zinc-800 hover:text-white')}>
          <LayoutDashboard className="h-4 w-4 shrink-0" />
          Dashboard
        </button>
      </div>

      {/* Plataformas */}
      <div className="px-3 mb-2">
        <p className="text-xs font-semibold text-zinc-600 uppercase tracking-wider px-1 mb-2">Plataformas</p>
        <div className="space-y-1">
          {platforms.map(p => {
            const Icon = p.icon;
            return (
              <button key={p.label}
                disabled={!p.active || !p.route}
                onClick={() => { if (p.route) { onNavigate(p.route); onClose(); } }}
                className={cn(
                  'w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-medium transition-all',
                  p.active && p.route
                    ? 'text-zinc-300 hover:bg-zinc-800 hover:text-white'
                    : 'text-zinc-700 cursor-not-allowed',
                )}>
                <div className="flex items-center gap-2.5">
                  <Icon className="h-4 w-4 shrink-0" />
                  {p.label}
                </div>
                {p.active && p.route
                  ? <ChevronRight className="h-3.5 w-3.5 text-zinc-600" />
                  : <span className="text-xs text-zinc-700">pronto</span>
                }
              </button>
            );
          })}
        </div>
      </div>

      {/* Footer */}
      <div className="mt-auto px-3">
        <button onClick={() => { onSection('settings'); onClose(); }}
          className={cn('w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all',
            section === 'settings'
              ? 'bg-primary/15 text-primary border border-primary/20'
              : 'text-zinc-400 hover:bg-zinc-800 hover:text-white')}>
          <Settings className="h-4 w-4 shrink-0" />
          Configuración
        </button>
      </div>
    </nav>
  );
}

// ════════════════════════════════════════════════════════════
// MAIN
// ════════════════════════════════════════════════════════════
export default function Admin() {
  const [admin, setAdmin]         = useState<AdminUser | null>(null);
  const [checking, setChecking]   = useState(true);
  const [section, setSection]     = useState<SideSection>('dashboard');
  const [sidebarOpen, setSidebar] = useState(false);
  const { toast }                 = useToast();
  const navigate                  = useNavigate();

  useEffect(() => {
    const check = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        const { data: profile } = await supabase
          .from('profiles').select('role, full_name').eq('id', session.user.id).single();
        if (profile?.role === 'super_admin')
          setAdmin({ id: session.user.id, email: session.user.email!, fullName: profile.full_name ?? '' });
      }
      setChecking(false);
    };
    check();
  }, []);

  const logout = async () => {
    await supabase.auth.signOut();
    setAdmin(null);
    toast({ title: 'Sesión cerrada' });
  };

  if (checking) return (
    <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
      <Loader2 className="h-8 w-8 animate-spin text-primary" />
    </div>
  );
  if (!admin) return <AdminLogin onLogin={setAdmin} />;

  const renderContent = () => {
    if (section === 'dashboard') return <DashboardGeneral onNavigate={navigate} />;
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <div className="w-14 h-14 rounded-2xl bg-zinc-900 border border-zinc-800 flex items-center justify-center mb-4">
          <Settings className="h-7 w-7 text-zinc-600" />
        </div>
        <h2 className="text-lg font-bold text-white">Configuración</h2>
        <p className="text-sm text-zinc-500 mt-1">Próximamente</p>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-zinc-950 flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-zinc-900/95 backdrop-blur-md border-b border-zinc-800 h-14 flex items-center justify-between px-4 gap-3">
        <div className="flex items-center gap-3">
          <button onClick={() => setSidebar(v => !v)}
            className="lg:hidden w-8 h-8 rounded-lg bg-zinc-800 flex items-center justify-center text-zinc-400 hover:bg-zinc-700 transition-colors">
            {sidebarOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
          </button>
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-primary/20 border border-primary/30 flex items-center justify-center">
              <Shield className="h-3.5 w-3.5 text-primary" />
            </div>
            <span className="font-bold text-white text-sm">
              Buses <span className="text-primary">Backoffice</span>
            </span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-zinc-600 hidden md:inline">{admin.email}</span>
          <span className="text-xs text-primary bg-primary/10 border border-primary/20 px-2 py-0.5 rounded-full hidden sm:inline">Super Admin</span>
          <button onClick={logout}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-xl transition-colors">
            <LogOut className="h-3.5 w-3.5" /> Salir
          </button>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar desktop */}
        <aside className={cn(
          'fixed inset-y-0 left-0 z-30 w-52 bg-zinc-900 border-r border-zinc-800 pt-14 transition-transform duration-200 lg:static lg:translate-x-0 lg:pt-0',
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        )}>
          <Sidebar
            section={section}
            onSection={setSection}
            onNavigate={navigate}
            onClose={() => setSidebar(false)}
          />
        </aside>

        {sidebarOpen && (
          <div className="fixed inset-0 z-20 bg-black/60 lg:hidden" onClick={() => setSidebar(false)} />
        )}

        <main className="flex-1 overflow-y-auto p-5 lg:p-8">
          {renderContent()}
        </main>
      </div>
    </div>
  );
}
