// src/pages/AdminWeMove.tsx — PANEL DE ADMINISTRACIÓN WEMOVE
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import {
  LayoutDashboard, Users, Shield, FileCheck, Coins, HeadphonesIcon,
  LogOut, Menu, X, Eye, EyeOff, Loader2, UserPlus, Trash2,
  RefreshCw, CheckCircle, Clock, AlertCircle, Ban,
  Lock, MapPin, ArrowLeft, AlertTriangle,
} from 'lucide-react';
import { cn } from '@/lib/utils';

// ── Tipos ────────────────────────────────────────────────────
interface AdminUser { id: string; email: string; fullName: string; }
type Section = 'overview' | 'transporters' | 'docs' | 'credits' | 'operators' | 'claims';

const SECTIONS: { key: Section; label: string; icon: React.ElementType }[] = [
  { key: 'overview',      label: 'Panel general',      icon: LayoutDashboard },
  { key: 'transporters',  label: 'Transportadores',    icon: Users },
  { key: 'docs',          label: 'Verificaciones',     icon: FileCheck },
  { key: 'credits',       label: 'Créditos',           icon: Coins },
  { key: 'operators',     label: 'Operadores soporte', icon: HeadphonesIcon },
  { key: 'claims',        label: 'Atención cliente',   icon: AlertTriangle },
];

const DEFAULT_PERMISSIONS = {
  canVerifyDocs: false, canAddCredits: false,
  canViewTrips: false, canHandleClaims: false, canBlockUsers: false,
};
const PERMISSION_LABELS: Record<string, string> = {
  canVerifyDocs: 'Verificar documentos', canAddCredits: 'Gestionar créditos',
  canViewTrips: 'Ver viajes', canHandleClaims: 'Atender reclamos', canBlockUsers: 'Bloquear usuarios',
};

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
// OVERVIEW
// ════════════════════════════════════════════════════════════
function Overview({ onNavigate }: { onNavigate: (s: Section) => void }) {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      const [
        { count: total }, { count: verified }, { count: pending },
        { count: active }, { count: completed },
        { data: ops },
      ] = await Promise.all([
        supabase.from('wemove_transporters').select('*', { count: 'exact', head: true }),
        supabase.from('wemove_transporters').select('*', { count: 'exact', head: true }).eq('verification_status', 'verified'),
        supabase.from('wemove_transporters').select('*', { count: 'exact', head: true }).eq('verification_status', 'pending').eq('documents_submitted', true),
        supabase.from('wemove_routes').select('*', { count: 'exact', head: true }).eq('status', 'active'),
        supabase.from('wemove_routes').select('*', { count: 'exact', head: true }).eq('status', 'completed'),
        supabase.from('wemove_operators').select('id, active'),
      ]);
      setStats({ total, verified, pending, active, completed, operators: ops?.length ?? 0, activeOps: ops?.filter(o => o.active).length ?? 0 });
      setLoading(false);
    };
    load();
  }, []);

  const quickActions = [
    { label: 'Verificaciones pendientes', section: 'docs'         as Section, icon: FileCheck,      color: 'text-amber-400', badge: stats?.pending },
    { label: 'Gestión de créditos',       section: 'credits'      as Section, icon: Coins,           color: 'text-green-400' },
    { label: 'Transportadores',           section: 'transporters' as Section, icon: Users,           color: 'text-blue-400' },
    { label: 'Operadores de soporte',     section: 'operators'    as Section, icon: HeadphonesIcon,  color: 'text-primary' },
    { label: 'Atención al cliente',       section: 'claims'       as Section, icon: AlertTriangle,   color: 'text-red-400' },
  ];

  if (loading) return <div className="flex justify-center py-20"><Loader2 className="h-7 w-7 animate-spin text-primary" /></div>;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-white">Panel WeMove</h2>
        <p className="text-sm text-zinc-500 mt-0.5">Administración de la flota comunitaria</p>
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard label="Transportadores" value={stats.total   ?? 0} icon={Users}          accent="text-blue-400"  sub={`${stats.verified} verificados`} />
        <StatCard label="Docs pendientes" value={stats.pending ?? 0} icon={FileCheck}      accent="text-amber-400" />
        <StatCard label="Viajes activos"  value={stats.active  ?? 0} icon={MapPin}         accent="text-green-400" sub={`${stats.completed} completados`} />
        <StatCard label="Operadores"      value={stats.operators ?? 0} icon={HeadphonesIcon} accent="text-primary"  sub={`${stats.activeOps} activos`} />
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
              <ArrowLeft className="h-4 w-4 text-zinc-600 group-hover:text-zinc-300 transition-colors rotate-180" />
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════════════
// TRANSPORTADORES
// ════════════════════════════════════════════════════════════
function Transporters() {
  const [list, setList]       = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter]   = useState<'all'|'verified'|'pending'|'none'>('all');
  const { toast }             = useToast();

  const load = async () => {
    setLoading(true);
    const { data: trans } = await supabase.from('wemove_transporters')
      .select('id, user_id, verification_status, documents_submitted, submitted_at')
      .order('submitted_at', { ascending: false });
    if (trans?.length) {
      const ids = trans.map(t => t.user_id);
      const [{ data: profiles }, { data: users }] = await Promise.all([
        supabase.from('profiles').select('id, full_name, wemove_credits, avatar_url').in('id', ids),
        supabase.from('users').select('id, email, created_at').in('id', ids),
      ]);
      setList(trans.map(t => ({
        ...t,
        full_name:  profiles?.find(p => p.id === t.user_id)?.full_name   ?? '—',
        email:      users?.find(u => u.id === t.user_id)?.email           ?? '—',
        credits:    profiles?.find(p => p.id === t.user_id)?.wemove_credits ?? 0,
        avatar_url: profiles?.find(p => p.id === t.user_id)?.avatar_url,
      })));
    } else setList([]);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const verify     = async (uid: string) => { await supabase.from('wemove_transporters').update({ verification_status: 'verified' }).eq('user_id', uid); toast({ title: '✓ Verificado' }); load(); };
  const block      = async (uid: string) => { if (!confirm('¿Bloquear?')) return; await supabase.from('wemove_transporters').update({ verification_status: 'blocked' }).eq('user_id', uid); toast({ title: 'Bloqueado' }); load(); };
  const addCredits = async (uid: string, n: number) => {
    const t = list.find(t => t.user_id === uid);
    await supabase.from('profiles').update({ wemove_credits: (t?.credits ?? 0) + n }).eq('id', uid);
    toast({ title: `✓ +${n} créditos` }); load();
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
// VERIFICACIONES
// ════════════════════════════════════════════════════════════
function Verifications() {
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
      const [{ data: profiles }, { data: users }] = await Promise.all([
        supabase.from('profiles').select('id, full_name').in('id', ids),
        supabase.from('users').select('id, email').in('id', ids),
      ]);
      setList(data.map(d => ({
        ...d,
        full_name: profiles?.find(p => p.id === d.user_id)?.full_name ?? '—',
        email:     users?.find(u => u.id === d.user_id)?.email ?? '—',
      })));
    } else setList([]);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const approve = async (uid: string) => {
    await supabase.from('wemove_transporters').update({ verification_status: 'verified' }).eq('user_id', uid);
    toast({ title: '✅ Transportador verificado' }); setViewing(null); load();
  };
  const reject = async (uid: string) => {
    await supabase.from('wemove_transporters').update({ verification_status: 'rejected', documents_submitted: false }).eq('user_id', uid);
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

      {/* Modal documentos */}
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
                  {url
                    ? <a href={url as string} target="_blank" rel="noopener noreferrer"><img src={url as string} alt={label as string} className="w-full h-36 object-cover rounded-xl border border-zinc-700 hover:border-primary/50 transition-colors" /></a>
                    : <div className="w-full h-36 rounded-xl border border-dashed border-zinc-700 flex items-center justify-center text-xs text-zinc-600">Sin foto</div>
                  }
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
// CRÉDITOS
// ════════════════════════════════════════════════════════════
function Credits() {
  const [list, setList]        = useState<any[]>([]);
  const [loading, setLoading]  = useState(true);
  const [search, setSearch]    = useState('');
  const [custom, setCustom]    = useState<Record<string, string>>({});
  const { toast }              = useToast();

  const load = async () => {
    setLoading(true);
    const { data: trans } = await supabase.from('wemove_transporters').select('user_id');
    if (trans?.length) {
      const ids = trans.map(t => t.user_id);
      const [{ data: profiles }, { data: users }] = await Promise.all([
        supabase.from('profiles').select('id, full_name, wemove_credits, avatar_url').in('id', ids).order('wemove_credits', { ascending: true }),
        supabase.from('users').select('id, email').in('id', ids),
      ]);
      setList((profiles ?? []).map(p => ({ ...p, email: users?.find(u => u.id === p.id)?.email ?? '—' })));
    } else setList([]);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const add = async (uid: string, n: number) => {
    const t = list.find(t => t.id === uid);
    await supabase.from('profiles').update({ wemove_credits: (t?.wemove_credits ?? 0) + n }).eq('id', uid);
    toast({ title: `✓ +${n} créditos a ${t?.full_name}` }); load();
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
                  <button key={n} onClick={() => add(t.id, n)} className="px-2.5 py-1.5 bg-zinc-800 border border-zinc-700 text-zinc-300 rounded-xl text-xs font-medium hover:bg-zinc-700 transition-colors">+{n}</button>
                ))}
                <div className="flex items-center gap-1">
                  <input type="number" min="1" placeholder="N" value={custom[t.id] ?? ''}
                    onChange={e => setCustom(p => ({ ...p, [t.id]: e.target.value }))}
                    className="w-14 bg-zinc-800 border border-zinc-700 rounded-lg px-2 py-1.5 text-xs text-white focus:outline-none focus:border-primary/50" />
                  <button onClick={() => { const n = parseInt(custom[t.id]); if (n > 0) { add(t.id, n); setCustom(p => ({ ...p, [t.id]: '' })); }}}
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
// OPERADORES
// ════════════════════════════════════════════════════════════
function Operators({ adminId }: { adminId: string }) {
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
      setForm(false); setName(''); setEmail(''); setPerms({ ...DEFAULT_PERMISSIONS }); load();
    } catch (err: any) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    } finally { setSaving(false); }
  };

  const toggle = async (op: any) => { await supabase.from('wemove_operators').update({ active: !op.active }).eq('id', op.id); toast({ title: op.active ? 'Desactivado' : 'Activado' }); load(); };
  const remove = async (id: string) => { if (!confirm('¿Eliminar operador?')) return; await supabase.from('wemove_operators').delete().eq('id', id); toast({ title: 'Operador eliminado' }); load(); };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-white">Operadores de soporte</h2>
          <p className="text-sm text-zinc-500 mt-0.5">{list.length} registrados</p>
        </div>
        <button onClick={() => setForm(v => !v)} className="flex items-center gap-2 px-4 py-2 rounded-xl bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 transition-colors">
          <UserPlus className="h-4 w-4" /> Nuevo
        </button>
      </div>

      {showForm && (
        <div className="bg-zinc-900 border border-primary/20 rounded-2xl p-5 space-y-4">
          <h3 className="text-sm font-semibold text-white">Crear operador</h3>
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
                <label key={key} className="flex items-center gap-2.5 p-2.5 bg-zinc-800 rounded-xl cursor-pointer">
                  <input type="checkbox" checked={perms[key as keyof typeof perms]}
                    onChange={e => setPerms(p => ({ ...p, [key]: e.target.checked }))}
                    className="w-4 h-4 accent-primary rounded" />
                  <span className="text-xs text-zinc-300">{PERMISSION_LABELS[key]}</span>
                </label>
              ))}
            </div>
          </div>
          <div className="flex gap-2">
            <button onClick={create} disabled={saving} className="flex-1 py-2.5 bg-primary text-primary-foreground rounded-xl text-sm font-semibold hover:bg-primary/90 disabled:opacity-50 flex items-center justify-center gap-2 transition-colors">
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
// COMING SOON
// ════════════════════════════════════════════════════════════
function ComingSoon({ label }: { label: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-24 text-center">
      <div className="w-14 h-14 rounded-2xl bg-zinc-900 border border-zinc-800 flex items-center justify-center mb-4">
        <AlertTriangle className="h-7 w-7 text-zinc-600" />
      </div>
      <h2 className="text-lg font-bold text-white">{label}</h2>
      <p className="text-sm text-zinc-500 mt-1">Sección en construcción</p>
      <span className="mt-3 text-xs bg-zinc-800 border border-zinc-700 text-zinc-400 px-3 py-1 rounded-full">Próximamente</span>
    </div>
  );
}

// ════════════════════════════════════════════════════════════
// SIDEBAR WEMOVE
// ════════════════════════════════════════════════════════════
function WeMovesSidebar({ section, onSection, pendingDocs, onBack, onClose }: {
  section: Section;
  onSection: (s: Section) => void;
  pendingDocs: number;
  onBack: () => void;
  onClose: () => void;
}) {
  return (
    <nav className="flex flex-col h-full py-4 overflow-y-auto">
      {/* Volver al hub */}
      <div className="px-3 mb-3">
        <button onClick={() => { onBack(); onClose(); }}
          className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs text-zinc-600 hover:text-zinc-400 hover:bg-zinc-800 transition-all">
          <ArrowLeft className="h-3.5 w-3.5" />
          Backoffice general
        </button>
      </div>

      <div className="px-3 mb-2">
        <div className="flex items-center gap-2 px-1 mb-3">
          <div className="w-6 h-6 rounded-lg bg-blue-500/20 border border-blue-500/30 flex items-center justify-center">
            <span className="text-blue-400 text-xs font-bold">W</span>
          </div>
          <span className="text-xs font-bold text-zinc-400 uppercase tracking-wider">WeMove</span>
        </div>
        <div className="space-y-0.5">
          {SECTIONS.map(s => {
            const Icon = s.icon;
            const isActive = section === s.key;
            return (
              <button key={s.key} onClick={() => { onSection(s.key); onClose(); }}
                className={cn('w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-medium transition-all',
                  isActive ? 'bg-primary/15 text-primary border border-primary/20' : 'text-zinc-400 hover:bg-zinc-800 hover:text-white')}>
                <div className="flex items-center gap-2.5">
                  <Icon className="h-4 w-4 shrink-0" />
                  {s.label}
                </div>
                {s.key === 'docs' && pendingDocs > 0 && (
                  <span className="text-xs bg-amber-500 text-black font-bold px-1.5 py-0.5 rounded-full">{pendingDocs}</span>
                )}
              </button>
            );
          })}
        </div>
      </div>
    </nav>
  );
}

// ════════════════════════════════════════════════════════════
// GUARD — verifica sesión super_admin sin redirigir al login
// ════════════════════════════════════════════════════════════
function AdminGuard({ children }: { children: (user: AdminUser) => React.ReactNode }) {
  const [admin, setAdmin]       = useState<AdminUser | null>(null);
  const [checking, setChecking] = useState(true);
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw]     = useState(false);
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState('');
  const { toast }               = useToast();

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (session?.user) {
        const { data: profile } = await supabase.from('profiles').select('role, full_name').eq('id', session.user.id).single();
        if (profile?.role === 'super_admin')
          setAdmin({ id: session.user.id, email: session.user.email!, fullName: profile.full_name ?? '' });
      }
      setChecking(false);
    });
  }, []);

  if (checking) return <div className="min-h-screen bg-zinc-950 flex items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  if (!admin) return <AdminLogin onLogin={setAdmin} />;
  return <>{children(admin)}</>;
}

// ════════════════════════════════════════════════════════════
// MAIN
// ════════════════════════════════════════════════════════════
export default function AdminWeMove() {
  const navigate                  = useNavigate();
  const { toast }                 = useToast();
  const [section, setSection]     = useState<Section>('overview');
  const [sidebarOpen, setSidebar] = useState(false);
  const [pendingDocs, setPending] = useState(0);

  useEffect(() => {
    supabase.from('wemove_transporters').select('*', { count: 'exact', head: true })
      .eq('verification_status', 'pending').eq('documents_submitted', true)
      .then(({ count }) => setPending(count ?? 0));
  }, [section]);

  const logout = async () => {
    await supabase.auth.signOut();
    toast({ title: 'Sesión cerrada' });
    navigate('/admin');
  };

  const renderSection = (admin: AdminUser) => {
    switch (section) {
      case 'overview':      return <Overview onNavigate={setSection} />;
      case 'transporters':  return <Transporters />;
      case 'docs':          return <Verifications />;
      case 'credits':       return <Credits />;
      case 'operators':     return <Operators adminId={admin.id} />;
      case 'claims':        return <ComingSoon label="Atención al cliente" />;
    }
  };

  return (
    <AdminGuard>
      {(admin) => (
        <div className="min-h-screen bg-zinc-950 flex flex-col">
          {/* Header */}
          <header className="sticky top-0 z-40 bg-zinc-900/95 backdrop-blur-md border-b border-zinc-800 h-14 flex items-center justify-between px-4 gap-3">
            <div className="flex items-center gap-3">
              <button onClick={() => setSidebar(v => !v)}
                className="lg:hidden w-8 h-8 rounded-lg bg-zinc-800 flex items-center justify-center text-zinc-400 hover:bg-zinc-700 transition-colors">
                {sidebarOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
              </button>
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-blue-500/20 border border-blue-500/30 flex items-center justify-center">
                  <span className="text-blue-400 text-xs font-bold">W</span>
                </div>
                <span className="font-bold text-white text-sm">
                  WeMove <span className="text-primary">Admin</span>
                </span>
              </div>
              <span className="text-zinc-700 hidden md:inline">·</span>
              <span className="text-xs text-zinc-500 hidden md:inline">
                {SECTIONS.find(s => s.key === section)?.label}
              </span>
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
            <aside className={cn(
              'fixed inset-y-0 left-0 z-30 w-52 bg-zinc-900 border-r border-zinc-800 pt-14 transition-transform duration-200 lg:static lg:translate-x-0 lg:pt-0',
              sidebarOpen ? 'translate-x-0' : '-translate-x-full'
            )}>
              <WeMovesSidebar
                section={section}
                onSection={setSection}
                pendingDocs={pendingDocs}
                onBack={() => navigate('/admin')}
                onClose={() => setSidebar(false)}
              />
            </aside>

            {sidebarOpen && (
              <div className="fixed inset-0 z-20 bg-black/60 lg:hidden" onClick={() => setSidebar(false)} />
            )}

            <main className="flex-1 overflow-y-auto p-5 lg:p-8">
              {renderSection(admin)}
            </main>
          </div>
        </div>
      )}
    </AdminGuard>
  );
}
