// src/pages/WeMoveAdmin.tsx — PANEL SUPER ADMIN COMPLETO
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import {
  LayoutDashboard, Users, FileCheck, Coins, Settings,
  LogOut, Menu, X, Eye, EyeOff, Shield, CheckCircle,
  Clock, AlertCircle, Loader2, UserPlus, Trash2, RefreshCw,
  TrendingUp, Car, MapPin, Star, Ban, ChevronRight, Lock
} from 'lucide-react';
import { cn } from '@/lib/utils';

// ── Tipos ────────────────────────────────────────────────────
interface AdminUser { id: string; email: string; role: string; }
interface Stats {
  totalTransporters: number;
  verifiedTransporters: number;
  pendingDocs: number;
  totalTrips: number;
  activeTrips: number;
  completedTrips: number;
  totalCreditsConsumed: number;
  totalOperators: number;
}
interface Transporter {
  id: string; user_id: string; full_name: string; email: string;
  verification_status: string; documents_submitted: boolean;
  wemove_credits: number; avatar_url?: string; created_at: string;
}
interface Operator {
  id: string; name: string; email: string; active: boolean;
  permissions: Record<string, boolean>; created_at: string;
}

// ── Secciones del sidebar ────────────────────────────────────
type Section = 'dashboard' | 'transporters' | 'docs' | 'credits' | 'operators' | 'settings';

const SECTIONS: { key: Section; label: string; icon: React.ElementType }[] = [
  { key: 'dashboard',     label: 'Dashboard',        icon: LayoutDashboard },
  { key: 'transporters',  label: 'Transportadores',  icon: Users },
  { key: 'docs',          label: 'Verificaciones',   icon: FileCheck },
  { key: 'credits',       label: 'Créditos',         icon: Coins },
  { key: 'operators',     label: 'Operadores',       icon: Shield },
  { key: 'settings',      label: 'Configuración',    icon: Settings },
];

// ── Permisos default ─────────────────────────────────────────
const DEFAULT_PERMISSIONS = {
  canVerifyDocs: false,
  canAddCredits: false,
  canViewTrips: false,
  canHandleClaims: false,
  canBlockUsers: false,
};
const PERMISSION_LABELS: Record<string, string> = {
  canVerifyDocs:    'Verificar documentos',
  canAddCredits:    'Gestionar créditos',
  canViewTrips:     'Ver viajes',
  canHandleClaims:  'Atender reclamos',
  canBlockUsers:    'Bloquear usuarios',
};

// ════════════════════════════════════════════════════════════
// LOGIN SCREEN
// ════════════════════════════════════════════════════════════
function AdminLogin({ onLogin }: { onLogin: (user: AdminUser) => void }) {
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
      if (!data.user) throw new Error('Sin usuario');

      // Verificar rol super_admin
      const { data: profile, error: profileErr } = await supabase
        .from('profiles').select('role, full_name').eq('id', data.user.id).single();
      if (profileErr || profile?.role !== 'super_admin') {
        await supabase.auth.signOut();
        throw new Error('Acceso denegado. No tienes permisos de administrador.');
      }

      onLogin({ id: data.user.id, email: data.user.email!, role: profile.role });
      toast({ title: `Bienvenido, ${profile.full_name ?? email}` });
    } catch (err: any) {
      setError(err.message ?? 'Error al iniciar sesión');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-zinc-950 flex items-center justify-center p-4">
      {/* Fondo decorativo */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-96 h-96 rounded-full bg-primary/10 blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-96 h-96 rounded-full bg-primary/5 blur-3xl" />
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:64px_64px]" />
      </div>

      <div className="relative w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary/20 border border-primary/30 mb-4">
            <Lock className="h-8 w-8 text-primary" />
          </div>
          <h1 className="text-2xl font-bold text-white">Panel de Administración</h1>
          <p className="text-zinc-500 text-sm mt-1">Acceso restringido — Solo super admin</p>
        </div>

        {/* Card */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-8 space-y-5 shadow-2xl">
          {error && (
            <div className="bg-red-950/50 border border-red-800 rounded-xl p-3 flex items-center gap-2">
              <AlertCircle className="h-4 w-4 text-red-400 shrink-0" />
              <p className="text-xs text-red-300">{error}</p>
            </div>
          )}

          <div className="space-y-2">
            <label className="text-xs font-medium text-zinc-400">Correo electrónico</label>
            <input
              type="email" value={email} onChange={e => setEmail(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleLogin()}
              placeholder="admin@buses.app"
              className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-3 text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/30 transition-all"
            />
          </div>

          <div className="space-y-2">
            <label className="text-xs font-medium text-zinc-400">Contraseña</label>
            <div className="relative">
              <input
                type={showPw ? 'text' : 'password'} value={password}
                onChange={e => setPassword(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleLogin()}
                placeholder="••••••••"
                className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-3 pr-11 text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/30 transition-all"
              />
              <button onClick={() => setShowPw(v => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300 transition-colors">
                {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          <button onClick={handleLogin} disabled={loading}
            className="w-full py-3 rounded-xl bg-primary text-primary-foreground font-semibold text-sm hover:bg-primary/90 disabled:opacity-50 flex items-center justify-center gap-2 transition-all">
            {loading ? <><Loader2 className="h-4 w-4 animate-spin" />Verificando…</> : 'Ingresar al panel'}
          </button>
        </div>

        <p className="text-center text-xs text-zinc-700 mt-6">
          Buses.App © {new Date().getFullYear()} — Acceso restringido
        </p>
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════════════
// STAT CARD
// ════════════════════════════════════════════════════════════
function StatCard({ label, value, icon: Icon, color = 'text-primary', sub }: {
  label: string; value: number | string; icon: React.ElementType; color?: string; sub?: string;
}) {
  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5 flex items-center justify-between">
      <div>
        <p className="text-xs text-zinc-500 font-medium">{label}</p>
        <p className="text-3xl font-bold text-white mt-1">{value}</p>
        {sub && <p className="text-xs text-zinc-600 mt-0.5">{sub}</p>}
      </div>
      <div className={cn('w-12 h-12 rounded-xl bg-zinc-800 flex items-center justify-center', color)}>
        <Icon className="h-6 w-6" />
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════════════
// SECCIÓN: DASHBOARD
// ════════════════════════════════════════════════════════════
function DashboardSection({ stats, loading }: { stats: Stats | null; loading: boolean }) {
  if (loading) return (
    <div className="flex items-center justify-center py-20">
      <Loader2 className="h-8 w-8 animate-spin text-primary" />
    </div>
  );
  if (!stats) return null;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-white">Resumen general</h2>
        <p className="text-sm text-zinc-500 mt-0.5">Estado actual de la plataforma WeMove</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Transportadores" value={stats.totalTransporters} icon={Users} color="text-blue-400" sub={`${stats.verifiedTransporters} verificados`} />
        <StatCard label="Docs pendientes" value={stats.pendingDocs} icon={FileCheck} color="text-amber-400" />
        <StatCard label="Viajes activos" value={stats.activeTrips} icon={MapPin} color="text-green-400" sub={`${stats.completedTrips} completados`} />
        <StatCard label="Créditos consumidos" value={stats.totalCreditsConsumed} icon={Coins} color="text-primary" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Verificación */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5 space-y-3">
          <h3 className="text-sm font-semibold text-white">Estado de verificaciones</h3>
          {[
            { label: 'Verificados', value: stats.verifiedTransporters, color: 'bg-green-500', total: stats.totalTransporters },
            { label: 'Pendientes', value: stats.pendingDocs, color: 'bg-amber-500', total: stats.totalTransporters },
            { label: 'Sin documentos', value: Math.max(0, stats.totalTransporters - stats.verifiedTransporters - stats.pendingDocs), color: 'bg-zinc-600', total: stats.totalTransporters },
          ].map(item => (
            <div key={item.label} className="space-y-1">
              <div className="flex justify-between text-xs">
                <span className="text-zinc-400">{item.label}</span>
                <span className="text-white font-medium">{item.value}</span>
              </div>
              <div className="h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                <div className={cn('h-full rounded-full transition-all', item.color)}
                  style={{ width: `${item.total > 0 ? (item.value / item.total) * 100 : 0}%` }} />
              </div>
            </div>
          ))}
        </div>

        {/* Viajes */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5 space-y-3">
          <h3 className="text-sm font-semibold text-white">Estado de viajes</h3>
          {[
            { label: 'Activos', value: stats.activeTrips, color: 'bg-blue-500' },
            { label: 'Completados', value: stats.completedTrips, color: 'bg-green-500' },
            { label: 'Total publicados', value: stats.totalTrips, color: 'bg-zinc-500' },
          ].map(item => (
            <div key={item.label} className="flex items-center justify-between py-1.5 border-b border-zinc-800 last:border-0">
              <div className="flex items-center gap-2">
                <div className={cn('w-2 h-2 rounded-full', item.color)} />
                <span className="text-xs text-zinc-400">{item.label}</span>
              </div>
              <span className="text-sm font-bold text-white">{item.value}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════════════
// SECCIÓN: TRANSPORTADORES
// ════════════════════════════════════════════════════════════
function TransportersSection() {
  const [transporters, setTransporters] = useState<Transporter[]>([]);
  const [loading, setLoading]           = useState(true);
  const [filter, setFilter]             = useState<'all'|'verified'|'pending'|'none'>('all');
  const { toast }                       = useToast();

  const load = async () => {
    setLoading(true);
    const { data } = await supabase
      .from('wemove_transporters')
      .select('id, user_id, verification_status, documents_submitted, submitted_at')
      .order('created_at', { ascending: false });

    if (data && data.length > 0) {
      const userIds = data.map(t => t.user_id);
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, full_name, wemove_credits, avatar_url')
        .in('id', userIds);
      const { data: users } = await supabase
        .from('users')
        .select('id, email, created_at')
        .in('id', userIds);

      const merged = data.map(t => ({
        id: t.id,
        user_id: t.user_id,
        verification_status: t.verification_status,
        documents_submitted: t.documents_submitted,
        full_name: profiles?.find(p => p.id === t.user_id)?.full_name ?? '—',
        email: users?.find(u => u.id === t.user_id)?.email ?? '—',
        wemove_credits: profiles?.find(p => p.id === t.user_id)?.wemove_credits ?? 0,
        avatar_url: profiles?.find(p => p.id === t.user_id)?.avatar_url,
        created_at: users?.find(u => u.id === t.user_id)?.created_at ?? '',
      }));
      setTransporters(merged);
    }
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const handleVerify = async (userId: string) => {
    await supabase.from('wemove_transporters')
      .update({ verification_status: 'verified' }).eq('user_id', userId);
    toast({ title: '✓ Transportador verificado' });
    load();
  };

  const handleAddCredits = async (userId: string, amount: number) => {
    const { data: profile } = await supabase.from('profiles').select('wemove_credits').eq('id', userId).single();
    const current = profile?.wemove_credits ?? 0;
    await supabase.from('profiles').update({ wemove_credits: current + amount }).eq('id', userId);
    toast({ title: `✓ +${amount} créditos agregados` });
    load();
  };

  const handleBlock = async (userId: string) => {
    if (!confirm('¿Bloquear este transportador?')) return;
    await supabase.from('wemove_transporters')
      .update({ verification_status: 'blocked' }).eq('user_id', userId);
    toast({ title: 'Transportador bloqueado' });
    load();
  };

  const filtered = transporters.filter(t => {
    if (filter === 'verified') return t.verification_status === 'verified';
    if (filter === 'pending')  return t.documents_submitted && t.verification_status === 'pending';
    if (filter === 'none')     return !t.documents_submitted;
    return true;
  });

  const statusBadge = (t: Transporter) => {
    if (t.verification_status === 'verified')
      return <span className="text-xs text-green-400 bg-green-950 border border-green-800 px-2 py-0.5 rounded-full flex items-center gap-1"><CheckCircle className="h-3 w-3" />Verificado</span>;
    if (t.documents_submitted)
      return <span className="text-xs text-amber-400 bg-amber-950 border border-amber-800 px-2 py-0.5 rounded-full flex items-center gap-1"><Clock className="h-3 w-3" />En revisión</span>;
    return <span className="text-xs text-zinc-400 bg-zinc-800 border border-zinc-700 px-2 py-0.5 rounded-full flex items-center gap-1"><AlertCircle className="h-3 w-3" />Sin docs</span>;
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-white">Transportadores</h2>
          <p className="text-sm text-zinc-500 mt-0.5">{transporters.length} registrados</p>
        </div>
        <button onClick={load} className="p-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-400 transition-colors">
          <RefreshCw className="h-4 w-4" />
        </button>
      </div>

      {/* Filtros */}
      <div className="flex gap-2 flex-wrap">
        {[['all','Todos'],['verified','Verificados'],['pending','En revisión'],['none','Sin docs']].map(([k, l]) => (
          <button key={k} onClick={() => setFilter(k as any)}
            className={cn('px-3 py-1.5 rounded-xl text-xs font-medium transition-colors border',
              filter === k ? 'bg-primary text-primary-foreground border-primary' : 'bg-zinc-800 text-zinc-400 border-zinc-700 hover:border-zinc-500')}>
            {l}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
      ) : (
        <div className="space-y-3">
          {filtered.map(t => (
            <div key={t.id} className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4">
              <div className="flex items-center justify-between flex-wrap gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-sm font-bold text-primary overflow-hidden shrink-0">
                    {t.avatar_url ? <img src={t.avatar_url} alt="" className="w-full h-full object-cover" /> : t.full_name[0]?.toUpperCase()}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-white">{t.full_name}</p>
                    <p className="text-xs text-zinc-500">{t.email}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                  {statusBadge(t)}
                  <span className="text-xs text-zinc-400 bg-zinc-800 px-2 py-0.5 rounded-full">
                    {t.wemove_credits} créditos
                  </span>
                </div>
              </div>

              {/* Acciones */}
              <div className="flex gap-2 mt-3 flex-wrap">
                {t.verification_status !== 'verified' && t.documents_submitted && (
                  <button onClick={() => handleVerify(t.user_id)}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-green-950 border border-green-800 text-green-400 rounded-xl text-xs font-medium hover:bg-green-900 transition-colors">
                    <CheckCircle className="h-3.5 w-3.5" /> Verificar
                  </button>
                )}
                <button onClick={() => handleAddCredits(t.user_id, 5)}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-zinc-800 border border-zinc-700 text-zinc-300 rounded-xl text-xs font-medium hover:bg-zinc-700 transition-colors">
                  <Coins className="h-3.5 w-3.5" /> +5 créditos
                </button>
                <button onClick={() => handleAddCredits(t.user_id, 1)}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-zinc-800 border border-zinc-700 text-zinc-300 rounded-xl text-xs font-medium hover:bg-zinc-700 transition-colors">
                  <Coins className="h-3.5 w-3.5" /> +1 crédito
                </button>
                {t.verification_status !== 'blocked' && (
                  <button onClick={() => handleBlock(t.user_id)}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-red-950 border border-red-900 text-red-400 rounded-xl text-xs font-medium hover:bg-red-900 transition-colors">
                    <Ban className="h-3.5 w-3.5" /> Bloquear
                  </button>
                )}
              </div>
            </div>
          ))}
          {filtered.length === 0 && (
            <div className="text-center py-12 text-zinc-600">
              <Users className="h-8 w-8 mx-auto mb-2 opacity-30" />
              <p className="text-sm">No hay transportadores en esta categoría</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ════════════════════════════════════════════════════════════
// SECCIÓN: DOCUMENTOS PENDIENTES
// ════════════════════════════════════════════════════════════
function DocsSection() {
  const [pending, setPending] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewing, setViewing] = useState<any | null>(null);
  const { toast }             = useToast();

  const load = async () => {
    setLoading(true);
    const { data } = await supabase
      .from('wemove_transporters')
      .select('user_id, id_card_url, license_url, selfie_url, vehicle_photo_url, submitted_at, verification_status')
      .eq('documents_submitted', true)
      .eq('verification_status', 'pending')
      .order('submitted_at', { ascending: true });

    if (data) {
      const userIds = data.map(d => d.user_id);
      const { data: profiles } = await supabase.from('profiles').select('id, full_name').in('id', userIds);
      const { data: users }    = await supabase.from('users').select('id, email').in('id', userIds);
      setPending(data.map(d => ({
        ...d,
        full_name: profiles?.find(p => p.id === d.user_id)?.full_name ?? '—',
        email:     users?.find(u => u.id === d.user_id)?.email ?? '—',
      })));
    }
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const handleApprove = async (userId: string) => {
    await supabase.from('wemove_transporters')
      .update({ verification_status: 'verified' }).eq('user_id', userId);
    toast({ title: '✅ Transportador verificado' });
    setViewing(null); load();
  };

  const handleReject = async (userId: string) => {
    await supabase.from('wemove_transporters')
      .update({ verification_status: 'rejected', documents_submitted: false }).eq('user_id', userId);
    toast({ title: 'Documentos rechazados', variant: 'destructive' });
    setViewing(null); load();
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-white">Verificaciones pendientes</h2>
          <p className="text-sm text-zinc-500 mt-0.5">{pending.length} solicitudes por revisar</p>
        </div>
        <button onClick={load} className="p-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-400 transition-colors">
          <RefreshCw className="h-4 w-4" />
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
      ) : pending.length === 0 ? (
        <div className="text-center py-16 bg-zinc-900 border border-zinc-800 rounded-2xl">
          <CheckCircle className="h-10 w-10 mx-auto mb-3 text-green-500/50" />
          <p className="text-white font-medium">Todo al día</p>
          <p className="text-sm text-zinc-500 mt-1">No hay documentos pendientes de revisión</p>
        </div>
      ) : (
        <div className="space-y-3">
          {pending.map(item => (
            <div key={item.user_id} className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4 flex items-center justify-between gap-3 flex-wrap">
              <div>
                <p className="text-sm font-semibold text-white">{item.full_name}</p>
                <p className="text-xs text-zinc-500">{item.email}</p>
                <p className="text-xs text-zinc-600 mt-0.5">
                  Enviado: {item.submitted_at ? new Date(item.submitted_at).toLocaleDateString('es-BO') : '—'}
                </p>
              </div>
              <div className="flex gap-2">
                <button onClick={() => setViewing(item)}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-zinc-800 border border-zinc-700 text-zinc-300 rounded-xl text-xs font-medium hover:bg-zinc-700 transition-colors">
                  <Eye className="h-3.5 w-3.5" /> Ver docs
                </button>
                <button onClick={() => handleApprove(item.user_id)}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-green-950 border border-green-800 text-green-400 rounded-xl text-xs font-medium hover:bg-green-900 transition-colors">
                  <CheckCircle className="h-3.5 w-3.5" /> Aprobar
                </button>
                <button onClick={() => handleReject(item.user_id)}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-red-950 border border-red-900 text-red-400 rounded-xl text-xs font-medium hover:bg-red-900 transition-colors">
                  <X className="h-3.5 w-3.5" /> Rechazar
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal ver documentos */}
      {viewing && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4" onClick={() => setViewing(null)}>
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-5">
              <div>
                <h3 className="text-lg font-bold text-white">{viewing.full_name}</h3>
                <p className="text-xs text-zinc-500">{viewing.email}</p>
              </div>
              <button onClick={() => setViewing(null)} className="w-8 h-8 rounded-xl bg-zinc-800 flex items-center justify-center hover:bg-zinc-700 transition-colors">
                <X className="h-4 w-4 text-zinc-400" />
              </button>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {[
                { label: 'Carnet de identidad', url: viewing.id_card_url },
                { label: 'Licencia de conducir', url: viewing.license_url },
                { label: 'Selfie con carnet', url: viewing.selfie_url },
                { label: 'Foto del vehículo', url: viewing.vehicle_photo_url },
              ].map(doc => (
                <div key={doc.label} className="space-y-1.5">
                  <p className="text-xs text-zinc-500 font-medium">{doc.label}</p>
                  {doc.url ? (
                    <a href={doc.url} target="_blank" rel="noopener noreferrer">
                      <img src={doc.url} alt={doc.label} className="w-full h-36 object-cover rounded-xl border border-zinc-700 hover:border-primary/50 transition-colors" />
                    </a>
                  ) : (
                    <div className="w-full h-36 rounded-xl border border-dashed border-zinc-700 flex items-center justify-center text-xs text-zinc-600">Sin foto</div>
                  )}
                </div>
              ))}
            </div>
            <div className="flex gap-3 mt-5">
              <button onClick={() => handleApprove(viewing.user_id)}
                className="flex-1 py-2.5 bg-green-950 border border-green-800 text-green-400 rounded-xl text-sm font-semibold hover:bg-green-900 transition-colors flex items-center justify-center gap-2">
                <CheckCircle className="h-4 w-4" /> Aprobar verificación
              </button>
              <button onClick={() => handleReject(viewing.user_id)}
                className="flex-1 py-2.5 bg-red-950 border border-red-900 text-red-400 rounded-xl text-sm font-semibold hover:bg-red-900 transition-colors flex items-center justify-center gap-2">
                <X className="h-4 w-4" /> Rechazar documentos
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ════════════════════════════════════════════════════════════
// SECCIÓN: CRÉDITOS
// ════════════════════════════════════════════════════════════
function CreditsSection() {
  const [transporters, setTransporters] = useState<any[]>([]);
  const [loading, setLoading]           = useState(true);
  const [search, setSearch]             = useState('');
  const [customAmt, setCustomAmt]       = useState<Record<string, string>>({});
  const { toast }                       = useToast();

  const load = async () => {
    setLoading(true);
    const { data: profiles } = await supabase.from('profiles').select('id, full_name, wemove_credits, avatar_url').order('wemove_credits', { ascending: true });
    const { data: trans }    = await supabase.from('wemove_transporters').select('user_id, verification_status');
    const { data: users }    = await supabase.from('users').select('id, email');
    if (profiles) {
      const transporterIds = new Set(trans?.map(t => t.user_id) ?? []);
      setTransporters(profiles
        .filter(p => transporterIds.has(p.id))
        .map(p => ({
          ...p,
          email: users?.find(u => u.id === p.id)?.email ?? '—',
          verification_status: trans?.find(t => t.user_id === p.id)?.verification_status ?? '—',
        })));
    }
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const addCredits = async (userId: string, amount: number) => {
    const t = transporters.find(t => t.id === userId);
    if (!t) return;
    await supabase.from('profiles').update({ wemove_credits: (t.wemove_credits ?? 0) + amount }).eq('id', userId);
    toast({ title: `✓ +${amount} créditos a ${t.full_name}` });
    load();
  };

  const filtered = transporters.filter(t =>
    t.full_name?.toLowerCase().includes(search.toLowerCase()) ||
    t.email?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-xl font-bold text-white">Gestión de créditos</h2>
        <p className="text-sm text-zinc-500 mt-0.5">Agrega créditos manualmente a transportadores</p>
      </div>

      <input value={search} onChange={e => setSearch(e.target.value)}
        placeholder="Buscar por nombre o email…"
        className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-2.5 text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-primary/50 transition-all" />

      {loading ? (
        <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
      ) : (
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
                  {t.wemove_credits ?? 0}
                  <span className="text-xs text-zinc-500 font-normal ml-1">créditos</span>
                </span>
                <button onClick={() => addCredits(t.id, 1)}
                  className="px-2.5 py-1.5 bg-zinc-800 border border-zinc-700 text-zinc-300 rounded-xl text-xs font-medium hover:bg-zinc-700 transition-colors">+1</button>
                <button onClick={() => addCredits(t.id, 5)}
                  className="px-2.5 py-1.5 bg-zinc-800 border border-zinc-700 text-zinc-300 rounded-xl text-xs font-medium hover:bg-zinc-700 transition-colors">+5</button>
                <button onClick={() => addCredits(t.id, 10)}
                  className="px-2.5 py-1.5 bg-zinc-800 border border-zinc-700 text-zinc-300 rounded-xl text-xs font-medium hover:bg-zinc-700 transition-colors">+10</button>
                <div className="flex items-center gap-1">
                  <input
                    type="number" min="1" placeholder="N"
                    value={customAmt[t.id] ?? ''}
                    onChange={e => setCustomAmt(prev => ({ ...prev, [t.id]: e.target.value }))}
                    className="w-14 bg-zinc-800 border border-zinc-700 rounded-lg px-2 py-1.5 text-xs text-white focus:outline-none focus:border-primary/50"
                  />
                  <button
                    onClick={() => { const n = parseInt(customAmt[t.id]); if (n > 0) { addCredits(t.id, n); setCustomAmt(p => ({ ...p, [t.id]: '' })); }}}
                    className="px-2.5 py-1.5 bg-primary/20 border border-primary/30 text-primary rounded-xl text-xs font-medium hover:bg-primary/30 transition-colors">
                    Agregar
                  </button>
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
// SECCIÓN: OPERADORES DE SOPORTE
// ════════════════════════════════════════════════════════════
function OperatorsSection({ adminId }: { adminId: string }) {
  const [operators, setOperators] = useState<Operator[]>([]);
  const [loading, setLoading]     = useState(true);
  const [showForm, setShowForm]   = useState(false);
  const [newName, setNewName]     = useState('');
  const [newEmail, setNewEmail]   = useState('');
  const [newPerms, setNewPerms]   = useState({ ...DEFAULT_PERMISSIONS });
  const [saving, setSaving]       = useState(false);
  const { toast }                 = useToast();

  const load = async () => {
    setLoading(true);
    const { data } = await supabase.from('wemove_operators').select('*').order('created_at', { ascending: false });
    if (data) setOperators(data);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const handleCreate = async () => {
    if (!newName.trim() || !newEmail.trim()) { toast({ title: 'Completa nombre y email', variant: 'destructive' }); return; }
    setSaving(true);
    try {
      const { error } = await supabase.from('wemove_operators').insert({
        name: newName.trim(), email: newEmail.trim().toLowerCase(),
        permissions: newPerms, active: true, created_by: adminId,
      });
      if (error) throw error;
      toast({ title: '✓ Operador creado' });
      setShowForm(false); setNewName(''); setNewEmail(''); setNewPerms({ ...DEFAULT_PERMISSIONS });
      load();
    } catch (err: any) {
      toast({ title: 'Error al crear operador', description: err.message, variant: 'destructive' });
    } finally { setSaving(false); }
  };

  const handleToggleActive = async (op: Operator) => {
    await supabase.from('wemove_operators').update({ active: !op.active }).eq('id', op.id);
    toast({ title: op.active ? 'Operador desactivado' : 'Operador activado' });
    load();
  };

  const handleDelete = async (id: string) => {
    if (!confirm('¿Eliminar este operador?')) return;
    await supabase.from('wemove_operators').delete().eq('id', id);
    toast({ title: 'Operador eliminado' });
    load();
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-white">Operadores de soporte</h2>
          <p className="text-sm text-zinc-500 mt-0.5">{operators.length} operadores registrados</p>
        </div>
        <button onClick={() => setShowForm(v => !v)}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 transition-colors">
          <UserPlus className="h-4 w-4" /> Nuevo operador
        </button>
      </div>

      {/* Formulario nuevo operador */}
      {showForm && (
        <div className="bg-zinc-900 border border-primary/20 rounded-2xl p-5 space-y-4">
          <h3 className="text-sm font-semibold text-white">Crear nuevo operador</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-zinc-500 font-medium">Nombre completo</label>
              <input value={newName} onChange={e => setNewName(e.target.value)}
                placeholder="Ej: María García"
                className="w-full mt-1.5 bg-zinc-800 border border-zinc-700 rounded-xl px-3 py-2.5 text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-primary/50 transition-all" />
            </div>
            <div>
              <label className="text-xs text-zinc-500 font-medium">Email</label>
              <input type="email" value={newEmail} onChange={e => setNewEmail(e.target.value)}
                placeholder="operador@buses.app"
                className="w-full mt-1.5 bg-zinc-800 border border-zinc-700 rounded-xl px-3 py-2.5 text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-primary/50 transition-all" />
            </div>
          </div>
          <div>
            <p className="text-xs text-zinc-500 font-medium mb-2">Permisos</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {Object.entries(DEFAULT_PERMISSIONS).map(([key]) => (
                <label key={key} className="flex items-center gap-2.5 p-2.5 bg-zinc-800 rounded-xl cursor-pointer hover:bg-zinc-750 transition-colors">
                  <input type="checkbox"
                    checked={newPerms[key as keyof typeof newPerms]}
                    onChange={e => setNewPerms(p => ({ ...p, [key]: e.target.checked }))}
                    className="w-4 h-4 accent-primary rounded" />
                  <span className="text-xs text-zinc-300">{PERMISSION_LABELS[key]}</span>
                </label>
              ))}
            </div>
          </div>
          <div className="flex gap-2">
            <button onClick={handleCreate} disabled={saving}
              className="flex-1 py-2.5 bg-primary text-primary-foreground rounded-xl text-sm font-semibold hover:bg-primary/90 disabled:opacity-50 flex items-center justify-center gap-2 transition-colors">
              {saving ? <><Loader2 className="h-4 w-4 animate-spin" />Creando…</> : '✓ Crear operador'}
            </button>
            <button onClick={() => setShowForm(false)}
              className="px-4 py-2.5 bg-zinc-800 border border-zinc-700 text-zinc-400 rounded-xl text-sm font-medium hover:bg-zinc-700 transition-colors">
              Cancelar
            </button>
          </div>
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
      ) : operators.length === 0 ? (
        <div className="text-center py-16 bg-zinc-900 border border-zinc-800 rounded-2xl">
          <Shield className="h-10 w-10 mx-auto mb-3 text-zinc-600" />
          <p className="text-white font-medium">Sin operadores</p>
          <p className="text-sm text-zinc-500 mt-1">Crea el primer operador de soporte</p>
        </div>
      ) : (
        <div className="space-y-3">
          {operators.map(op => (
            <div key={op.id} className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4">
              <div className="flex items-center justify-between flex-wrap gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-zinc-800 border border-zinc-700 flex items-center justify-center text-sm font-bold text-zinc-400">
                    {op.name[0]?.toUpperCase()}
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
                  <button onClick={() => handleToggleActive(op)}
                    className="px-3 py-1.5 bg-zinc-800 border border-zinc-700 text-zinc-300 rounded-xl text-xs font-medium hover:bg-zinc-700 transition-colors">
                    {op.active ? 'Desactivar' : 'Activar'}
                  </button>
                  <button onClick={() => handleDelete(op.id)}
                    className="w-8 h-8 bg-red-950 border border-red-900 text-red-400 rounded-xl flex items-center justify-center hover:bg-red-900 transition-colors">
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
              {/* Permisos */}
              <div className="flex flex-wrap gap-1.5 mt-3">
                {Object.entries(op.permissions ?? {}).map(([key, val]) => val && (
                  <span key={key} className="text-xs text-primary bg-primary/10 border border-primary/20 px-2 py-0.5 rounded-full">
                    {PERMISSION_LABELS[key] ?? key}
                  </span>
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
// MAIN ADMIN PANEL
// ════════════════════════════════════════════════════════════
export default function WeMoveAdmin() {
  const [adminUser, setAdminUser]   = useState<AdminUser | null>(null);
  const [checking, setChecking]     = useState(true);
  const [section, setSection]       = useState<Section>('dashboard');
  const [sidebarOpen, setSidebar]   = useState(false);
  const [stats, setStats]           = useState<Stats | null>(null);
  const [statsLoading, setStatsLoading] = useState(true);
  const { toast }                   = useToast();

  // Verificar sesión existente al cargar
  useEffect(() => {
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        const { data: profile } = await supabase
          .from('profiles').select('role, full_name').eq('id', session.user.id).single();
        if (profile?.role === 'super_admin') {
          setAdminUser({ id: session.user.id, email: session.user.email!, role: 'super_admin' });
        }
      }
      setChecking(false);
    };
    checkSession();
  }, []);

  // Cargar stats cuando hay sesión
  useEffect(() => {
    if (!adminUser) return;
    const loadStats = async () => {
      setStatsLoading(true);
      const [{ count: totalT }, { count: verifiedT }, { count: pendingD }, { count: totalTrips },
             { count: activeTrips }, { count: completedTrips }] = await Promise.all([
        supabase.from('wemove_transporters').select('*', { count: 'exact', head: true }),
        supabase.from('wemove_transporters').select('*', { count: 'exact', head: true }).eq('verification_status', 'verified'),
        supabase.from('wemove_transporters').select('*', { count: 'exact', head: true }).eq('documents_submitted', true).eq('verification_status', 'pending'),
        supabase.from('wemove_routes').select('*', { count: 'exact', head: true }),
        supabase.from('wemove_routes').select('*', { count: 'exact', head: true }).eq('status', 'active'),
        supabase.from('wemove_routes').select('*', { count: 'exact', head: true }).eq('status', 'completed'),
      ]);
      const { data: operators } = await supabase.from('wemove_operators').select('id');
      setStats({
        totalTransporters: totalT ?? 0,
        verifiedTransporters: verifiedT ?? 0,
        pendingDocs: pendingD ?? 0,
        totalTrips: totalTrips ?? 0,
        activeTrips: activeTrips ?? 0,
        completedTrips: completedTrips ?? 0,
        totalCreditsConsumed: 0,
        totalOperators: operators?.length ?? 0,
      });
      setStatsLoading(false);
    };
    loadStats();
  }, [adminUser]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setAdminUser(null);
    toast({ title: 'Sesión cerrada' });
  };

  if (checking) return (
    <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
      <Loader2 className="h-8 w-8 animate-spin text-primary" />
    </div>
  );

  if (!adminUser) return <AdminLogin onLogin={setAdminUser} />;

  const renderSection = () => {
    switch (section) {
      case 'dashboard':    return <DashboardSection stats={stats} loading={statsLoading} />;
      case 'transporters': return <TransportersSection />;
      case 'docs':         return <DocsSection />;
      case 'credits':      return <CreditsSection />;
      case 'operators':    return <OperatorsSection adminId={adminUser.id} />;
      case 'settings':     return (
        <div className="text-center py-16 text-zinc-600">
          <Settings className="h-10 w-10 mx-auto mb-3 opacity-30" />
          <p className="text-white font-medium">Configuración</p>
          <p className="text-sm mt-1">Próximamente</p>
        </div>
      );
    }
  };

  return (
    <div className="min-h-screen bg-zinc-950 flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-zinc-900/95 backdrop-blur-md border-b border-zinc-800">
        <div className="flex h-14 items-center justify-between px-4 gap-3">
          <div className="flex items-center gap-3">
            <button onClick={() => setSidebar(v => !v)}
              className="lg:hidden w-8 h-8 rounded-lg bg-zinc-800 flex items-center justify-center text-zinc-400 hover:bg-zinc-700 transition-colors">
              {sidebarOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
            </button>
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-primary/20 border border-primary/30 flex items-center justify-center">
                <Shield className="h-3.5 w-3.5 text-primary" />
              </div>
              <span className="font-bold text-white text-sm hidden sm:inline">WeMove <span className="text-primary">Admin</span></span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-zinc-500 hidden md:inline">{adminUser.email}</span>
            <span className="text-xs text-primary bg-primary/10 border border-primary/20 px-2 py-0.5 rounded-full hidden sm:inline">Super Admin</span>
            <button onClick={handleLogout}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-xl transition-colors">
              <LogOut className="h-3.5 w-3.5" /> Salir
            </button>
          </div>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <aside className={cn(
          'fixed inset-y-0 left-0 z-30 w-56 bg-zinc-900 border-r border-zinc-800 pt-14 transition-transform duration-200 lg:static lg:translate-x-0 lg:pt-0',
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        )}>
          <nav className="p-3 space-y-1">
            {SECTIONS.map(s => {
              const Icon = s.icon;
              const isActive = section === s.key;
              return (
                <button key={s.key} onClick={() => { setSection(s.key); setSidebar(false); }}
                  className={cn('w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all',
                    isActive ? 'bg-primary/15 text-primary border border-primary/20' : 'text-zinc-400 hover:bg-zinc-800 hover:text-white')}>
                  <Icon className="h-4 w-4 shrink-0" />
                  {s.label}
                  {s.key === 'docs' && (stats?.pendingDocs ?? 0) > 0 && (
                    <span className="ml-auto text-xs bg-amber-500 text-black font-bold px-1.5 py-0.5 rounded-full">
                      {stats!.pendingDocs}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </aside>

        {/* Overlay móvil */}
        {sidebarOpen && (
          <div className="fixed inset-0 z-20 bg-black/60 lg:hidden" onClick={() => setSidebar(false)} />
        )}

        {/* Main */}
        <main className="flex-1 overflow-y-auto p-5 lg:p-8">
          {renderSection()}
        </main>
      </div>
    </div>
  );
}
