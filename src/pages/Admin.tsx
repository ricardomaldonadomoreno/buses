// src/pages/Admin.tsx — BACKOFFICE GENERAL BUSES.APP
import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import {
  LayoutDashboard, Users, Shield, FileCheck, Coins, HeadphonesIcon,
  Package, Wallet, Scale, Settings, Bus, Truck, Plane,
  LogOut, Menu, X, Eye, EyeOff, Loader2, UserPlus, Trash2,
  RefreshCw, CheckCircle, Clock, AlertCircle, Ban, ChevronDown,
  ChevronRight, Lock, TrendingUp, MapPin, Star, AlertTriangle,
  BarChart3, Activity, Zap
} from 'lucide-react';
import { cn } from '@/lib/utils';

// ── Tipos ────────────────────────────────────────────────────
interface AdminUser { id: string; email: string; fullName: string; }

type Platform = 'wemove' | 'packservice' | 'pasajes' | 's4' | 's5' | 's6';
type WeMoveSection = 'overview' | 'transporters' | 'docs' | 'credits' | 'operators' | 'claims';
type ActiveView =
  | { platform: 'dashboard' }
  | { platform: Platform; section: WeMoveSection | 'overview' };

const DEFAULT_PERMISSIONS = {
  canVerifyDocs: false, canAddCredits: false,
  canViewTrips: false, canHandleClaims: false, canBlockUsers: false,
};
const PERMISSION_LABELS: Record<string, string> = {
  canVerifyDocs: 'Verificar documentos', canAddCredits: 'Gestionar créditos',
  canViewTrips: 'Ver viajes', canHandleClaims: 'Atender reclamos', canBlockUsers: 'Bloquear usuarios',
};

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
          <Icon className="h-4.5 w-4.5" />
        </div>
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════════════
// COMING SOON
// ════════════════════════════════════════════════════════════
function ComingSoon({ name, icon: Icon }: { name: string; icon: React.ElementType }) {
  return (
    <div className="flex flex-col items-center justify-center py-24 text-center">
      <div className="w-16 h-16 rounded-2xl bg-zinc-900 border border-zinc-800 flex items-center justify-center mb-4">
        <Icon className="h-8 w-8 text-zinc-600" />
      </div>
      <h2 className="text-lg font-bold text-white">{name}</h2>
      <p className="text-sm text-zinc-500 mt-1">Panel en construcción</p>
      <span className="mt-3 text-xs bg-zinc-800 border border-zinc-700 text-zinc-400 px-3 py-1 rounded-full">Próximamente</span>
    </div>
  );
}

// ════════════════════════════════════════════════════════════
// DASHBOARD GENERAL
// ════════════════════════════════════════════════════════════
function DashboardGeneral() {
  const [data, setData]     = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      const [
        { count: transporters }, { count: pendingDocs },
        { count: routes }, { count: activeRoutes },
        { count: operators },
      ] = await Promise.all([
        supabase.from('wemove_transporters').select('*', { count: 'exact', head: true }),
        supabase.from('wemove_transporters').select('*', { count: 'exact', head: true }).eq('verification_status', 'pending').eq('documents_submitted', true),
        supabase.from('wemove_routes').select('*', { count: 'exact', head: true }),
        supabase.from('wemove_routes').select('*', { count: 'exact', head: true }).eq('status', 'active'),
        supabase.from('wemove_operators').select('*', { count: 'exact', head: true }),
      ]);
      setData({ transporters, pendingDocs, routes, activeRoutes, operators });
      setLoading(false);
    };
    load();
  }, []);

  if (loading) return <div className="flex justify-center py-20"><Loader2 className="h-7 w-7 animate-spin text-primary" /></div>;

  const platforms = [
    { name: 'WeMove', icon: Bus, color: 'text-blue-400', status: 'activo', stats: [
      { label: 'Transportadores', value: data.transporters ?? 0 },
      { label: 'Viajes activos', value: data.activeRoutes ?? 0 },
      { label: 'Docs pendientes', value: data.pendingDocs ?? 0, alert: (data.pendingDocs ?? 0) > 0 },
    ]},
    { name: 'PackService', icon: Package, color: 'text-amber-400', status: 'activo', stats: [
      { label: 'Transacciones', value: '—' },
      { label: 'En disputa', value: '—' },
      { label: 'En tránsito', value: '—' },
    ]},
    { name: 'Pasajes', icon: Truck, color: 'text-green-400', status: 'próximamente', stats: [
      { label: 'Empresas', value: '—' },
      { label: 'Rutas', value: '—' },
      { label: 'Reservas', value: '—' },
    ]},
    { name: 'Servicio 4', icon: Zap, color: 'text-purple-400', status: 'próximamente', stats: [] },
    { name: 'Servicio 5', icon: Activity, color: 'text-pink-400', status: 'próximamente', stats: [] },
    { name: 'Servicio 6', icon: BarChart3, color: 'text-cyan-400', status: 'próximamente', stats: [] },
  ];

  return (
    <div className="space-y-7">
      <div>
        <h2 className="text-xl font-bold text-white">Dashboard general</h2>
        <p className="text-sm text-zinc-500 mt-0.5">Estado de todas las plataformas Buses.App</p>
      </div>

      {/* Cards rápidas */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard label="Transportadores WeMove" value={data.transporters ?? 0} icon={Users} accent="text-blue-400" />
        <StatCard label="Viajes activos" value={data.activeRoutes ?? 0} icon={MapPin} accent="text-green-400" />
        <StatCard label="Docs pendientes" value={data.pendingDocs ?? 0} icon={FileCheck} accent="text-amber-400" />
        <StatCard label="Operadores soporte" value={data.operators ?? 0} icon={HeadphonesIcon} accent="text-primary" />
      </div>

      {/* Grid de plataformas */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {platforms.map(p => (
          <div key={p.name} className={cn('bg-zinc-900 border rounded-2xl p-5 space-y-3',
            p.status === 'activo' ? 'border-zinc-800' : 'border-zinc-800/50 opacity-60')}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className={cn('w-8 h-8 rounded-xl bg-zinc-800 flex items-center justify-center', p.color)}>
                  <p.icon className="h-4 w-4" />
                </div>
                <span className="text-sm font-bold text-white">{p.name}</span>
              </div>
              <span className={cn('text-xs px-2 py-0.5 rounded-full border',
                p.status === 'activo'
                  ? 'text-green-400 bg-green-950 border-green-800'
                  : 'text-zinc-500 bg-zinc-800 border-zinc-700')}>
                {p.status}
              </span>
            </div>
            {p.stats.length > 0 ? (
              <div className="space-y-2">
                {p.stats.map(s => (
                  <div key={s.label} className="flex items-center justify-between">
                    <span className="text-xs text-zinc-500">{s.label}</span>
                    <span className={cn('text-sm font-bold', (s as any).alert ? 'text-amber-400' : 'text-white')}>{s.value}</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-zinc-600 text-center py-2">Sin datos disponibles</p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════════════
// WEMOVE — OVERVIEW
// ════════════════════════════════════════════════════════════
function WeMoveOverview({ onNavigate }: { onNavigate: (s: WeMoveSection) => void }) {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      const [
        { count: total }, { count: verified }, { count: pending },
        { count: totalRoutes }, { count: active }, { count: completed },
        { data: operators },
      ] = await Promise.all([
        supabase.from('wemove_transporters').select('*', { count: 'exact', head: true }),
        supabase.from('wemove_transporters').select('*', { count: 'exact', head: true }).eq('verification_status', 'verified'),
        supabase.from('wemove_transporters').select('*', { count: 'exact', head: true }).eq('verification_status', 'pending').eq('documents_submitted', true),
        supabase.from('wemove_routes').select('*', { count: 'exact', head: true }),
        supabase.from('wemove_routes').select('*', { count: 'exact', head: true }).eq('status', 'active'),
        supabase.from('wemove_routes').select('*', { count: 'exact', head: true }).eq('status', 'completed'),
        supabase.from('wemove_operators').select('id, active'),
      ]);
      setStats({ total, verified, pending, totalRoutes, active, completed, operators: operators?.length ?? 0, activeOperators: operators?.filter(o => o.active).length ?? 0 });
      setLoading(false);
    };
    load();
  }, []);

  const quickActions = [
    { label: 'Verificaciones pendientes', section: 'docs' as WeMoveSection, icon: FileCheck, color: 'text-amber-400', badge: stats?.pending },
    { label: 'Gestión de créditos', section: 'credits' as WeMoveSection, icon: Coins, color: 'text-green-400' },
    { label: 'Transportadores', section: 'transporters' as WeMoveSection, icon: Users, color: 'text-blue-400' },
    { label: 'Operadores de soporte', section: 'operators' as WeMoveSection, icon: HeadphonesIcon, color: 'text-primary' },
    { label: 'Atención al cliente', section: 'claims' as WeMoveSection, icon: AlertTriangle, color: 'text-red-400' },
  ];

  if (loading) return <div className="flex justify-center py-20"><Loader2 className="h-7 w-7 animate-spin text-primary" /></div>;

  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-center gap-2 mb-1">
          <Bus className="h-5 w-5 text-primary" />
          <h2 className="text-xl font-bold text-white">WeMove</h2>
        </div>
        <p className="text-sm text-zinc-500">Panel de administración de la flota comunitaria</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard label="Transportadores" value={stats.total ?? 0} icon={Users} accent="text-blue-400" sub={`${stats.verified} verificados`} />
        <StatCard label="Docs pendientes" value={stats.pending ?? 0} icon={FileCheck} accent="text-amber-400" />
        <StatCard label="Viajes activos" value={stats.active ?? 0} icon={MapPin} accent="text-green-400" sub={`${stats.completed} completados`} />
        <StatCard label="Operadores" value={stats.operators ?? 0} icon={HeadphonesIcon} accent="text-primary" sub={`${stats.activeOperators} activos`} />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {quickActions.map(a => (
          <button key={a.section} onClick={() => onNavigate(a.section)}
            className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4 flex items-center justify-between hover:border-zinc-600 transition-all group text-left">
            <div className="flex items-center gap-3">
              <div className={cn('w-9 h-9 rounded-xl bg-zinc-800 flex items-center justify-center', a.color)}>
                <a.icon className="h-4 w-4" />
              </div>
              <span className="text-sm font-medium text-white">{a.label}</span>
            </div>
            <div className="flex items-center gap-2">
              {a.badge != null && a.badge > 0 && (
                <span className="text-xs bg-amber-500 text-black font-bold px-1.5 py-0.5 rounded-full">{a.badge}</span>
              )}
              <ChevronRight className="h-4 w-4 text-zinc-600 group-hover:text-zinc-300 transition-colors" />
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════════════
// WEMOVE — TRANSPORTADORES
// ════════════════════════════════════════════════════════════
function WeMoveTransporters() {
  const [list, setList]     = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all'|'verified'|'pending'|'none'>('all');
  const { toast }           = useToast();

  const load = async () => {
    setLoading(true);
    const { data: trans } = await supabase.from('wemove_transporters')
      .select('id, user_id, verification_status, documents_submitted, submitted_at')
      .order('submitted_at', { ascending: false });
    if (trans?.length) {
      const ids = trans.map(t => t.user_id);
      const { data: profiles } = await supabase.from('profiles').select('id, full_name, wemove_credits, avatar_url').in('id', ids);
      const { data: users }    = await supabase.from('users').select('id, email, created_at').in('id', ids);
      setList(trans.map(t => ({
        ...t,
        full_name: profiles?.find(p => p.id === t.user_id)?.full_name ?? '—',
        email:     users?.find(u => u.id === t.user_id)?.email ?? '—',
        credits:   profiles?.find(p => p.id === t.user_id)?.wemove_credits ?? 0,
        avatar_url: profiles?.find(p => p.id === t.user_id)?.avatar_url,
        created_at: users?.find(u => u.id === t.user_id)?.created_at,
      })));
    } else setList([]);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const verify  = async (userId: string) => {
    await supabase.from('wemove_transporters').update({ verification_status: 'verified' }).eq('user_id', userId);
    toast({ title: '✓ Transportador verificado' }); load();
  };
  const block   = async (userId: string) => {
    if (!confirm('¿Bloquear este transportador?')) return;
    await supabase.from('wemove_transporters').update({ verification_status: 'blocked' }).eq('user_id', userId);
    toast({ title: 'Transportador bloqueado' }); load();
  };
  const addCredits = async (userId: string, amt: number) => {
    const t = list.find(t => t.user_id === userId);
    await supabase.from('profiles').update({ wemove_credits: (t?.credits ?? 0) + amt }).eq('id', userId);
    toast({ title: `✓ +${amt} créditos` }); load();
  };

  const filtered = list.filter(t =>
    filter === 'all' ? true :
    filter === 'verified' ? t.verification_status === 'verified' :
    filter === 'pending'  ? (t.documents_submitted && t.verification_status === 'pending') :
    !t.documents_submitted
  );

  const badge = (t: any) => {
    if (t.verification_status === 'verified')
      return <span className="text-xs text-green-400 bg-green-950 border border-green-800 px-2 py-0.5 rounded-full flex items-center gap-1"><CheckCircle className="h-3 w-3" />Verificado</span>;
    if (t.documents_submitted)
      return <span className="text-xs text-amber-400 bg-amber-950 border border-amber-800 px-2 py-0.5 rounded-full flex items-center gap-1"><Clock className="h-3 w-3" />En revisión</span>;
    if (t.verification_status === 'blocked')
      return <span className="text-xs text-red-400 bg-red-950 border border-red-900 px-2 py-0.5 rounded-full flex items-center gap-1"><Ban className="h-3 w-3" />Bloqueado</span>;
    return <span className="text-xs text-zinc-400 bg-zinc-800 border border-zinc-700 px-2 py-0.5 rounded-full flex items-center gap-1"><AlertCircle className="h-3 w-3" />Sin docs</span>;
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-white">Transportadores WeMove</h2>
          <p className="text-sm text-zinc-500 mt-0.5">{list.length} registrados en total</p>
        </div>
        <button onClick={load} className="p-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-400 transition-colors">
          <RefreshCw className="h-4 w-4" />
        </button>
      </div>
      <div className="flex gap-2 flex-wrap">
        {[['all','Todos'],['verified','Verificados'],['pending','En revisión'],['none','Sin docs']].map(([k,l]) => (
          <button key={k} onClick={() => setFilter(k as any)}
            className={cn('px-3 py-1.5 rounded-xl text-xs font-medium border transition-colors',
              filter === k ? 'bg-primary text-primary-foreground border-primary' : 'bg-zinc-800 text-zinc-400 border-zinc-700 hover:border-zinc-500')}>
            {l}
          </button>
        ))}
      </div>
      {loading ? <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div> : (
        <div className="space-y-3">
          {filtered.map(t => (
            <div key={t.id} className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4 space-y-3">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-sm font-bold text-primary overflow-hidden shrink-0">
                    {t.avatar_url ? <img src={t.avatar_url} alt="" className="w-full h-full object-cover" /> : t.full_name?.[0]?.toUpperCase()}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-white">{t.full_name}</p>
                    <p className="text-xs text-zinc-500">{t.email}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                  {badge(t)}
                  <span className="text-xs text-zinc-400 bg-zinc-800 px-2 py-0.5 rounded-full">{t.credits} créditos</span>
                </div>
              </div>
              <div className="flex gap-2 flex-wrap">
                {t.verification_status !== 'verified' && t.documents_submitted && (
                  <button onClick={() => verify(t.user_id)} className="flex items-center gap-1.5 px-3 py-1.5 bg-green-950 border border-green-800 text-green-400 rounded-xl text-xs font-medium hover:bg-green-900 transition-colors">
                    <CheckCircle className="h-3.5 w-3.5" /> Verificar
                  </button>
                )}
                <button onClick={() => addCredits(t.user_id, 1)} className="px-2.5 py-1.5 bg-zinc-800 border border-zinc-700 text-zinc-300 rounded-xl text-xs font-medium hover:bg-zinc-700 transition-colors">+1 crédito</button>
                <button onClick={() => addCredits(t.user_id, 5)} className="px-2.5 py-1.5 bg-zinc-800 border border-zinc-700 text-zinc-300 rounded-xl text-xs font-medium hover:bg-zinc-700 transition-colors">+5 créditos</button>
                {t.verification_status !== 'blocked' && (
                  <button onClick={() => block(t.user_id)} className="flex items-center gap-1.5 px-3 py-1.5 bg-red-950 border border-red-900 text-red-400 rounded-xl text-xs font-medium hover:bg-red-900 transition-colors">
                    <Ban className="h-3.5 w-3.5" /> Bloquear
                  </button>
                )}
              </div>
            </div>
          ))}
          {filtered.length === 0 && (
            <div className="text-center py-12 text-zinc-600">
              <Users className="h-8 w-8 mx-auto mb-2 opacity-30" />
              <p className="text-sm">Sin transportadores en esta categoría</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ════════════════════════════════════════════════════════════
// WEMOVE — VERIFICACIONES
// ════════════════════════════════════════════════════════════
function WeMoveVerifications() {
  const [list, setList]       = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewing, setViewing] = useState<any | null>(null);
  const { toast }             = useToast();

  const load = async () => {
    setLoading(true);
    const { data } = await supabase.from('wemove_transporters')
      .select('user_id, id_card_url, license_url, selfie_url, vehicle_photo_url, submitted_at')
      .eq('documents_submitted', true).eq('verification_status', 'pending')
      .order('submitted_at', { ascending: true });
    if (data?.length) {
      const ids = data.map(d => d.user_id);
      const { data: profiles } = await supabase.from('profiles').select('id, full_name').in('id', ids);
      const { data: users }    = await supabase.from('users').select('id, email').in('id', ids);
      setList(data.map(d => ({
        ...d,
        full_name: profiles?.find(p => p.id === d.user_id)?.full_name ?? '—',
        email:     users?.find(u => u.id === d.user_id)?.email ?? '—',
      })));
    } else setList([]);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const approve = async (userId: string) => {
    await supabase.from('wemove_transporters').update({ verification_status: 'verified' }).eq('user_id', userId);
    toast({ title: '✅ Transportador verificado' }); setViewing(null); load();
  };
  const reject = async (userId: string) => {
    await supabase.from('wemove_transporters').update({ verification_status: 'rejected', documents_submitted: false }).eq('user_id', userId);
    toast({ title: 'Documentos rechazados', variant: 'destructive' }); setViewing(null); load();
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-white">Verificaciones pendientes</h2>
          <p className="text-sm text-zinc-500 mt-0.5">{list.length} solicitudes por revisar</p>
        </div>
        <button onClick={load} className="p-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-400 transition-colors"><RefreshCw className="h-4 w-4" /></button>
      </div>
      {loading ? <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
        : list.length === 0 ? (
          <div className="text-center py-16 bg-zinc-900 border border-zinc-800 rounded-2xl">
            <CheckCircle className="h-10 w-10 mx-auto mb-3 text-green-500/50" />
            <p className="text-white font-medium">Todo al día</p>
            <p className="text-sm text-zinc-500 mt-1">No hay documentos pendientes</p>
          </div>
        ) : (
          <div className="space-y-3">
            {list.map(item => (
              <div key={item.user_id} className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4 flex items-center justify-between gap-3 flex-wrap">
                <div>
                  <p className="text-sm font-semibold text-white">{item.full_name}</p>
                  <p className="text-xs text-zinc-500">{item.email}</p>
                  <p className="text-xs text-zinc-600 mt-0.5">Enviado: {item.submitted_at ? new Date(item.submitted_at).toLocaleDateString('es-BO') : '—'}</p>
                </div>
                <div className="flex gap-2 flex-wrap">
                  <button onClick={() => setViewing(item)} className="flex items-center gap-1.5 px-3 py-1.5 bg-zinc-800 border border-zinc-700 text-zinc-300 rounded-xl text-xs font-medium hover:bg-zinc-700 transition-colors">
                    <Eye className="h-3.5 w-3.5" /> Ver docs
                  </button>
                  <button onClick={() => approve(item.user_id)} className="flex items-center gap-1.5 px-3 py-1.5 bg-green-950 border border-green-800 text-green-400 rounded-xl text-xs font-medium hover:bg-green-900 transition-colors">
                    <CheckCircle className="h-3.5 w-3.5" /> Aprobar
                  </button>
                  <button onClick={() => reject(item.user_id)} className="flex items-center gap-1.5 px-3 py-1.5 bg-red-950 border border-red-900 text-red-400 rounded-xl text-xs font-medium hover:bg-red-900 transition-colors">
                    <X className="h-3.5 w-3.5" /> Rechazar
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

      {viewing && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4" onClick={() => setViewing(null)}>
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-5">
              <div><h3 className="text-lg font-bold text-white">{viewing.full_name}</h3><p className="text-xs text-zinc-500">{viewing.email}</p></div>
              <button onClick={() => setViewing(null)} className="w-8 h-8 rounded-xl bg-zinc-800 flex items-center justify-center hover:bg-zinc-700"><X className="h-4 w-4 text-zinc-400" /></button>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {[['Carnet', viewing.id_card_url],['Licencia', viewing.license_url],['Selfie con carnet', viewing.selfie_url],['Foto vehículo', viewing.vehicle_photo_url]].map(([label, url]) => (
                <div key={label as string}>
                  <p className="text-xs text-zinc-500 mb-1.5">{label}</p>
                  {url ? (
                    <a href={url as string} target="_blank" rel="noopener noreferrer">
                      <img src={url as string} alt={label as string} className="w-full h-36 object-cover rounded-xl border border-zinc-700 hover:border-primary/50 transition-colors" />
                    </a>
                  ) : (
                    <div className="w-full h-36 rounded-xl border border-dashed border-zinc-700 flex items-center justify-center text-xs text-zinc-600">Sin foto</div>
                  )}
                </div>
              ))}
            </div>
            <div className="flex gap-3 mt-5">
              <button onClick={() => approve(viewing.user_id)} className="flex-1 py-2.5 bg-green-950 border border-green-800 text-green-400 rounded-xl text-sm font-semibold hover:bg-green-900 transition-colors flex items-center justify-center gap-2">
                <CheckCircle className="h-4 w-4" /> Aprobar
              </button>
              <button onClick={() => reject(viewing.user_id)} className="flex-1 py-2.5 bg-red-950 border border-red-900 text-red-400 rounded-xl text-sm font-semibold hover:bg-red-900 transition-colors flex items-center justify-center gap-2">
                <X className="h-4 w-4" /> Rechazar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ════════════════════════════════════════════════════════════
// WEMOVE — CRÉDITOS
// ════════════════════════════════════════════════════════════
function WeMoveCredits() {
  const [list, setList]         = useState<any[]>([]);
  const [loading, setLoading]   = useState(true);
  const [search, setSearch]     = useState('');
  const [customAmt, setCustom]  = useState<Record<string, string>>({});
  const { toast }               = useToast();

  const load = async () => {
    setLoading(true);
    const { data: trans } = await supabase.from('wemove_transporters').select('user_id');
    if (trans?.length) {
      const ids = trans.map(t => t.user_id);
      const { data: profiles } = await supabase.from('profiles').select('id, full_name, wemove_credits, avatar_url').in('id', ids).order('wemove_credits', { ascending: true });
      const { data: users }    = await supabase.from('users').select('id, email').in('id', ids);
      setList((profiles ?? []).map(p => ({ ...p, email: users?.find(u => u.id === p.id)?.email ?? '—' })));
    } else setList([]);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const add = async (userId: string, amt: number) => {
    const t = list.find(t => t.id === userId);
    await supabase.from('profiles').update({ wemove_credits: (t?.wemove_credits ?? 0) + amt }).eq('id', userId);
    toast({ title: `✓ +${amt} créditos a ${t?.full_name}` }); load();
  };

  const filtered = list.filter(t =>
    t.full_name?.toLowerCase().includes(search.toLowerCase()) ||
    t.email?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-xl font-bold text-white">Gestión de créditos</h2>
        <p className="text-sm text-zinc-500 mt-0.5">Agrega créditos manualmente a transportadores</p>
      </div>
      <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar por nombre o email…"
        className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-2.5 text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-primary/50 transition-all" />
      {loading ? <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div> : (
        <div className="space-y-3">
          {filtered.map(t => (
            <div key={t.id} className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4 flex items-center justify-between gap-3 flex-wrap">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center text-sm font-bold text-primary overflow-hidden shrink-0">
                  {t.avatar_url ? <img src={t.avatar_url} alt="" className="w-full h-full object-cover" /> : t.full_name?.[0]?.toUpperCase()}
                </div>
                <div>
                  <p className="text-sm font-semibold text-white">{t.full_name}</p>
                  <p className="text-xs text-zinc-500">{t.email}</p>
                </div>
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className={cn('text-lg font-bold', (t.wemove_credits ?? 0) <= 1 ? 'text-red-400' : 'text-white')}>
                  {t.wemove_credits ?? 0} <span className="text-xs text-zinc-500 font-normal">créditos</span>
                </span>
                {[1,5,10].map(n => (
                  <button key={n} onClick={() => add(t.id, n)}
                    className="px-2.5 py-1.5 bg-zinc-800 border border-zinc-700 text-zinc-300 rounded-xl text-xs font-medium hover:bg-zinc-700 transition-colors">+{n}</button>
                ))}
                <div className="flex items-center gap-1">
                  <input type="number" min="1" placeholder="N" value={customAmt[t.id] ?? ''}
                    onChange={e => setCustom(p => ({ ...p, [t.id]: e.target.value }))}
                    className="w-14 bg-zinc-800 border border-zinc-700 rounded-lg px-2 py-1.5 text-xs text-white focus:outline-none focus:border-primary/50" />
                  <button onClick={() => { const n = parseInt(customAmt[t.id]); if (n > 0) { add(t.id, n); setCustom(p => ({ ...p, [t.id]: '' })); }}}
                    className="px-2.5 py-1.5 bg-primary/20 border border-primary/30 text-primary rounded-xl text-xs font-medium hover:bg-primary/30 transition-colors">OK</button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ════════════════════════════════════════════════════════════
// WEMOVE — OPERADORES
// ════════════════════════════════════════════════════════════
function WeMoveOperators({ adminId }: { adminId: string }) {
  const [list, setList]       = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setForm]   = useState(false);
  const [name, setName]       = useState('');
  const [email, setEmail]     = useState('');
  const [perms, setPerms]     = useState({ ...DEFAULT_PERMISSIONS });
  const [saving, setSaving]   = useState(false);
  const { toast }             = useToast();

  const load = async () => {
    setLoading(true);
    const { data } = await supabase.from('wemove_operators').select('*').order('created_at', { ascending: false });
    setList(data ?? []);
    setLoading(false);
  };
  useEffect(() => { load(); }, []);

  const create = async () => {
    if (!name.trim() || !email.trim()) { toast({ title: 'Completa nombre y email', variant: 'destructive' }); return; }
    setSaving(true);
    try {
      const { error } = await supabase.from('wemove_operators').insert({ name: name.trim(), email: email.trim().toLowerCase(), permissions: perms, active: true, created_by: adminId });
      if (error) throw error;
      toast({ title: '✓ Operador creado' });
      setForm(false); setName(''); setEmail(''); setPerms({ ...DEFAULT_PERMISSIONS });
      load();
    } catch (err: any) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    } finally { setSaving(false); }
  };

  const toggle = async (op: any) => {
    await supabase.from('wemove_operators').update({ active: !op.active }).eq('id', op.id);
    toast({ title: op.active ? 'Operador desactivado' : 'Operador activado' }); load();
  };
  const remove = async (id: string) => {
    if (!confirm('¿Eliminar operador?')) return;
    await supabase.from('wemove_operators').delete().eq('id', id);
    toast({ title: 'Operador eliminado' }); load();
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-white">Operadores de soporte</h2>
          <p className="text-sm text-zinc-500 mt-0.5">{list.length} operadores registrados</p>
        </div>
        <button onClick={() => setForm(v => !v)}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 transition-colors">
          <UserPlus className="h-4 w-4" /> Nuevo
        </button>
      </div>

      {showForm && (
        <div className="bg-zinc-900 border border-primary/20 rounded-2xl p-5 space-y-4">
          <h3 className="text-sm font-semibold text-white">Crear operador de soporte</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-zinc-500">Nombre</label>
              <input value={name} onChange={e => setName(e.target.value)} placeholder="Ej: María García"
                className="w-full mt-1.5 bg-zinc-800 border border-zinc-700 rounded-xl px-3 py-2.5 text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-primary/50 transition-all" />
            </div>
            <div>
              <label className="text-xs text-zinc-500">Email</label>
              <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="soporte@buses.app"
                className="w-full mt-1.5 bg-zinc-800 border border-zinc-700 rounded-xl px-3 py-2.5 text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-primary/50 transition-all" />
            </div>
          </div>
          <div>
            <p className="text-xs text-zinc-500 mb-2">Permisos</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {Object.entries(DEFAULT_PERMISSIONS).map(([key]) => (
                <label key={key} className="flex items-center gap-2.5 p-2.5 bg-zinc-800 rounded-xl cursor-pointer hover:bg-zinc-750 transition-colors">
                  <input type="checkbox" checked={perms[key as keyof typeof perms]}
                    onChange={e => setPerms(p => ({ ...p, [key]: e.target.checked }))}
                    className="w-4 h-4 accent-primary rounded" />
                  <span className="text-xs text-zinc-300">{PERMISSION_LABELS[key]}</span>
                </label>
              ))}
            </div>
          </div>
          <div className="flex gap-2">
            <button onClick={create} disabled={saving}
              className="flex-1 py-2.5 bg-primary text-primary-foreground rounded-xl text-sm font-semibold hover:bg-primary/90 disabled:opacity-50 flex items-center justify-center gap-2 transition-colors">
              {saving ? <><Loader2 className="h-4 w-4 animate-spin" />Creando…</> : '✓ Crear operador'}
            </button>
            <button onClick={() => setForm(false)} className="px-4 py-2.5 bg-zinc-800 border border-zinc-700 text-zinc-400 rounded-xl text-sm hover:bg-zinc-700 transition-colors">Cancelar</button>
          </div>
        </div>
      )}

      {loading ? <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
        : list.length === 0 ? (
          <div className="text-center py-16 bg-zinc-900 border border-zinc-800 rounded-2xl">
            <Shield className="h-10 w-10 mx-auto mb-3 text-zinc-600" />
            <p className="text-white font-medium">Sin operadores</p>
            <p className="text-sm text-zinc-500 mt-1">Crea el primer operador de soporte WeMove</p>
          </div>
        ) : (
          <div className="space-y-3">
            {list.map(op => (
              <div key={op.id} className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4">
                <div className="flex items-center justify-between flex-wrap gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-zinc-800 border border-zinc-700 flex items-center justify-center text-sm font-bold text-zinc-400">
                      {op.name?.[0]?.toUpperCase()}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-semibold text-white">{op.name}</p>
                        <span className={cn('text-xs px-2 py-0.5 rounded-full border', op.active ? 'text-green-400 bg-green-950 border-green-800' : 'text-zinc-500 bg-zinc-800 border-zinc-700')}>
                          {op.active ? 'Activo' : 'Inactivo'}
                        </span>
                      </div>
                      <p className="text-xs text-zinc-500">{op.email}</p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => toggle(op)} className="px-3 py-1.5 bg-zinc-800 border border-zinc-700 text-zinc-300 rounded-xl text-xs font-medium hover:bg-zinc-700 transition-colors">
                      {op.active ? 'Desactivar' : 'Activar'}
                    </button>
                    <button onClick={() => remove(op.id)} className="w-8 h-8 bg-red-950 border border-red-900 text-red-400 rounded-xl flex items-center justify-center hover:bg-red-900 transition-colors">
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
                <div className="flex flex-wrap gap-1.5 mt-3">
                  {Object.entries(op.permissions ?? {}).map(([k, v]) => v && (
                    <span key={k} className="text-xs text-primary bg-primary/10 border border-primary/20 px-2 py-0.5 rounded-full">{PERMISSION_LABELS[k] ?? k}</span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
    </div>
  );
}

// ════════════════════════════════════════════════════════════
// SIDEBAR
// ════════════════════════════════════════════════════════════
const PLATFORMS = [
  { key: 'wemove',      label: 'WeMove',      icon: Bus,     sections: [
    { key: 'overview',      label: 'Panel general', icon: LayoutDashboard },
    { key: 'transporters',  label: 'Transportadores', icon: Users },
    { key: 'docs',          label: 'Verificaciones', icon: FileCheck },
    { key: 'credits',       label: 'Créditos', icon: Coins },
    { key: 'operators',     label: 'Operadores soporte', icon: HeadphonesIcon },
    { key: 'claims',        label: 'Atención cliente', icon: AlertTriangle },
  ]},
  { key: 'packservice', label: 'PackService', icon: Package, sections: [
    { key: 'overview', label: 'Panel general', icon: LayoutDashboard },
    { key: 'escrow',   label: 'Escrow', icon: Wallet },
    { key: 'disputes', label: 'Disputas', icon: Scale },
  ]},
  { key: 'pasajes',     label: 'Pasajes',     icon: Truck,   sections: [
    { key: 'overview', label: 'Panel general', icon: LayoutDashboard },
  ]},
];

function Sidebar({ view, onNavigate, onClose }: {
  view: ActiveView;
  onNavigate: (v: ActiveView) => void;
  onClose: () => void;
}) {
  const [expanded, setExpanded] = useState<Record<string, boolean>>({ wemove: true });

  return (
    <nav className="flex flex-col h-full py-4 overflow-y-auto">
      {/* Dashboard general */}
      <div className="px-3 mb-2">
        <button onClick={() => { onNavigate({ platform: 'dashboard' }); onClose(); }}
          className={cn('w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all',
            view.platform === 'dashboard' ? 'bg-primary/15 text-primary border border-primary/20' : 'text-zinc-400 hover:bg-zinc-800 hover:text-white')}>
          <LayoutDashboard className="h-4 w-4 shrink-0" />
          Dashboard general
        </button>
      </div>

      <div className="px-3 mb-1">
        <p className="text-xs font-semibold text-zinc-600 uppercase tracking-wider px-1 mb-2">Plataformas</p>
      </div>

      {PLATFORMS.map(p => {
        const Icon = p.icon;
        const isExpanded = expanded[p.key];
        const isActive = view.platform === p.key;
        return (
          <div key={p.key} className="px-3 mb-1">
            <button onClick={() => setExpanded(e => ({ ...e, [p.key]: !isExpanded }))}
              className={cn('w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-semibold transition-all',
                isActive ? 'text-white bg-zinc-800' : 'text-zinc-400 hover:bg-zinc-800 hover:text-white')}>
              <div className="flex items-center gap-2.5">
                <Icon className="h-4 w-4 shrink-0" />
                {p.label}
              </div>
              <ChevronDown className={cn('h-3.5 w-3.5 transition-transform', isExpanded && 'rotate-180')} />
            </button>
            {isExpanded && (
              <div className="ml-3 mt-1 space-y-0.5 border-l border-zinc-800 pl-3">
                {p.sections.map(s => {
                  const SIcon = s.icon;
                  const active = view.platform === p.key && (view as any).section === s.key;
                  return (
                    <button key={s.key}
                      onClick={() => { onNavigate({ platform: p.key as Platform, section: s.key as WeMoveSection }); onClose(); }}
                      className={cn('w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium transition-all',
                        active ? 'bg-primary/15 text-primary' : 'text-zinc-500 hover:bg-zinc-800 hover:text-white')}>
                      <SIcon className="h-3.5 w-3.5 shrink-0" />
                      {s.label}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        );
      })}
    </nav>
  );
}

// ════════════════════════════════════════════════════════════
// MAIN
// ════════════════════════════════════════════════════════════
export default function Admin() {
  const [admin, setAdmin]       = useState<AdminUser | null>(null);
  const [checking, setChecking] = useState(true);
  const [view, setView]         = useState<ActiveView>({ platform: 'dashboard' });
  const [sidebarOpen, setSidebar] = useState(false);
  const { toast }               = useToast();

  useEffect(() => {
    const check = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        const { data: profile } = await supabase.from('profiles').select('role, full_name').eq('id', session.user.id).single();
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
    if (view.platform === 'dashboard') return <DashboardGeneral />;
    if (view.platform === 'wemove') {
      const s = (view as any).section;
      if (s === 'overview')     return <WeMoveOverview onNavigate={s => setView({ platform: 'wemove', section: s })} />;
      if (s === 'transporters') return <WeMoveTransporters />;
      if (s === 'docs')         return <WeMoveVerifications />;
      if (s === 'credits')      return <WeMoveCredits />;
      if (s === 'operators')    return <WeMoveOperators adminId={admin.id} />;
      if (s === 'claims')       return <ComingSoon name="Atención al cliente" icon={AlertTriangle} />;
    }
    if (view.platform === 'packservice') return <ComingSoon name="PackService" icon={Package} />;
    if (view.platform === 'pasajes')     return <ComingSoon name="Pasajes" icon={Truck} />;
    return null;
  };

  const currentTitle = () => {
    if (view.platform === 'dashboard') return 'Dashboard general';
    const plat = PLATFORMS.find(p => p.key === view.platform);
    const sec  = plat?.sections.find(s => s.key === (view as any).section);
    return sec ? `${plat?.label} · ${sec.label}` : plat?.label ?? '';
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
            <span className="font-bold text-white text-sm hidden sm:inline">
              Buses <span className="text-primary">Backoffice</span>
            </span>
          </div>
          <span className="text-zinc-700 hidden md:inline">·</span>
          <span className="text-xs text-zinc-500 hidden md:inline">{currentTitle()}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-zinc-600 hidden md:inline">{admin.email}</span>
          <span className="text-xs text-primary bg-primary/10 border border-primary/20 px-2 py-0.5 rounded-full hidden sm:inline">Super Admin</span>
          <button onClick={logout} className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-xl transition-colors">
            <LogOut className="h-3.5 w-3.5" /> Salir
          </button>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar desktop */}
        <aside className={cn(
          'fixed inset-y-0 left-0 z-30 w-56 bg-zinc-900 border-r border-zinc-800 pt-14 transition-transform duration-200 lg:static lg:translate-x-0 lg:pt-0',
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        )}>
          <Sidebar view={view} onNavigate={setView} onClose={() => setSidebar(false)} />
        </aside>

        {sidebarOpen && (
          <div className="fixed inset-0 z-20 bg-black/60 lg:hidden" onClick={() => setSidebar(false)} />
        )}

        {/* Main */}
        <main className="flex-1 overflow-y-auto p-5 lg:p-8">
          {renderContent()}
        </main>
      </div>
    </div>
  );
}
