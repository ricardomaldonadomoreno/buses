// src/pages/AdminWeMove.tsx — PANEL DE ADMINISTRACIÓN WEMOVE
import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import {
  LayoutDashboard, Users, Shield, FileCheck, Coins, HeadphonesIcon,
  LogOut, Menu, X, Loader2, UserPlus, Trash2,
  RefreshCw, CheckCircle, Clock, AlertCircle, Ban,
  MapPin, ArrowLeft, AlertTriangle, XCircle, Eye,
  ChevronLeft, ChevronRight, ZoomIn,
} from 'lucide-react';
import { cn } from '@/lib/utils';

// ── Tipos ─────────────────────────────────────────────────────
interface AdminUser { id: string; email: string; fullName: string; }
type Section = 'overview' | 'transporters' | 'docs' | 'credits' | 'operators' | 'claims';

const SECTIONS: { key: Section; label: string; icon: React.ElementType }[] = [
  { key: 'overview',     label: 'Panel general',      icon: LayoutDashboard },
  { key: 'transporters', label: 'Transportadores',    icon: Users },
  { key: 'docs',         label: 'Verificaciones',     icon: FileCheck },
  { key: 'credits',      label: 'Créditos',           icon: Coins },
  { key: 'operators',    label: 'Operadores soporte', icon: HeadphonesIcon },
  { key: 'claims',       label: 'Atención cliente',   icon: AlertTriangle },
];

const DEFAULT_PERMISSIONS = {
  canVerifyDocs: false, canAddCredits: false,
  canViewTrips: false, canHandleClaims: false, canBlockUsers: false,
};
const PERMISSION_LABELS: Record<string, string> = {
  canVerifyDocs: 'Verificar documentos', canAddCredits: 'Gestionar créditos',
  canViewTrips: 'Ver viajes', canHandleClaims: 'Atender reclamos', canBlockUsers: 'Bloquear usuarios',
};

// ── Helpers de badge ──────────────────────────────────────────
function StatusBadge({ status, submitted }: { status: string; submitted?: boolean }) {
  if (status === 'verified')
    return <span className="inline-flex items-center gap-1 text-xs text-green-400 bg-green-950 border border-green-800 px-2 py-0.5 rounded-full"><CheckCircle className="h-3 w-3" />Verificado</span>;
  if (status === 'blocked')
    return <span className="inline-flex items-center gap-1 text-xs text-red-400 bg-red-950 border border-red-900 px-2 py-0.5 rounded-full"><Ban className="h-3 w-3" />Bloqueado</span>;
  if (status === 'rejected')
    return <span className="inline-flex items-center gap-1 text-xs text-red-400 bg-red-950 border border-red-900 px-2 py-0.5 rounded-full"><XCircle className="h-3 w-3" />Rechazado</span>;
  if (submitted)
    return <span className="inline-flex items-center gap-1 text-xs text-amber-400 bg-amber-950 border border-amber-800 px-2 py-0.5 rounded-full"><Clock className="h-3 w-3" />En revisión</span>;
  return <span className="inline-flex items-center gap-1 text-xs text-zinc-400 bg-zinc-800 border border-zinc-700 px-2 py-0.5 rounded-full"><AlertCircle className="h-3 w-3" />Sin docs</span>;
}

// ── StatCard ──────────────────────────────────────────────────
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

// ── Modal de documentos ───────────────────────────────────────
// Muestra las 4 imágenes y permite aprobar / rechazar con motivo opcional
function DocsModal({ item, onClose, onApprove, onReject }: {
  item: any;
  onClose: () => void;
  onApprove: (userId: string) => Promise<void>;
  onReject: (userId: string, reason: string) => Promise<void>;
}) {
  const [rejecting, setRejecting]       = useState(false);
  const [rejReason, setRejReason]       = useState('');
  const [loadingAction, setLoading]     = useState<'approve' | 'reject' | null>(null);
  const [lightbox, setLightbox]         = useState<string | null>(null);

  const docs = [
    { label: 'Carnet de identidad',  url: item.id_card_url },
    { label: 'Licencia de conducir', url: item.license_url },
    { label: 'Selfie con carnet',    url: item.selfie_url },
    { label: 'Foto del vehículo',    url: item.vehicle_photo_url },
  ];

  const uploadedCount = docs.filter(d => d.url).length;

  const handleApprove = async () => {
    setLoading('approve');
    await onApprove(item.user_id);
    setLoading(null);
  };

  const handleReject = async () => {
    setLoading('reject');
    await onReject(item.user_id, rejReason.trim());
    setLoading(null);
  };

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4" onClick={onClose}>
        <div
          className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto"
          onClick={e => e.stopPropagation()}
        >
          {/* Header del modal */}
          <div className="flex items-center justify-between mb-5">
            <div>
              <h3 className="text-lg font-bold text-white">{item.full_name}</h3>
              <p className="text-xs text-zinc-500">{item.email}</p>
              <p className="text-xs text-zinc-600 mt-0.5">
                Enviado: {item.submitted_at ? new Date(item.submitted_at).toLocaleDateString('es-BO') : '—'}
                {' · '}{uploadedCount}/4 documentos
              </p>
            </div>
            <button onClick={onClose} className="w-8 h-8 rounded-xl bg-zinc-800 flex items-center justify-center hover:bg-zinc-700">
              <X className="h-4 w-4 text-zinc-400" />
            </button>
          </div>

          {/* Grid de documentos */}
          <div className="grid grid-cols-2 gap-3 mb-5">
            {docs.map(({ label, url }) => (
              <div key={label}>
                <p className="text-xs text-zinc-500 mb-1.5">{label}</p>
                {url ? (
                  <div className="relative group cursor-zoom-in" onClick={() => setLightbox(url)}>
                    <img
                      src={url}
                      alt={label}
                      className="w-full h-36 object-cover rounded-xl border border-zinc-700 group-hover:border-primary/50 transition-colors"
                    />
                    <div className="absolute inset-0 rounded-xl bg-black/0 group-hover:bg-black/30 flex items-center justify-center transition-all opacity-0 group-hover:opacity-100">
                      <ZoomIn className="h-6 w-6 text-white" />
                    </div>
                  </div>
                ) : (
                  <div className="w-full h-36 rounded-xl border border-dashed border-zinc-700 flex flex-col items-center justify-center gap-1 text-zinc-600">
                    <AlertCircle className="h-5 w-5" />
                    <span className="text-xs">Sin foto</span>
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Formulario de rechazo (aparece al hacer clic en Rechazar) */}
          {rejecting && (
            <div className="mb-4 bg-red-950/40 border border-red-900 rounded-xl p-4 space-y-2">
              <p className="text-xs font-semibold text-red-400">Motivo de rechazo (opcional, el chofer lo verá)</p>
              <textarea
                value={rejReason}
                onChange={e => setRejReason(e.target.value)}
                placeholder="Ej: Imagen borrosa, documento vencido, foto no coincide con selfie…"
                rows={3}
                className="w-full bg-zinc-900 border border-zinc-700 rounded-xl px-3 py-2 text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-red-700 resize-none"
              />
              <div className="flex gap-2">
                <button
                  onClick={handleReject}
                  disabled={!!loadingAction}
                  className="flex-1 py-2 bg-red-950 border border-red-800 text-red-400 rounded-xl text-sm font-semibold hover:bg-red-900 disabled:opacity-50 flex items-center justify-center gap-2 transition-colors"
                >
                  {loadingAction === 'reject'
                    ? <><Loader2 className="h-4 w-4 animate-spin" />Rechazando…</>
                    : <><XCircle className="h-4 w-4" />Confirmar rechazo</>
                  }
                </button>
                <button onClick={() => setRejecting(false)} className="px-4 py-2 bg-zinc-800 text-zinc-400 rounded-xl text-sm hover:bg-zinc-700 transition-colors">
                  Cancelar
                </button>
              </div>
            </div>
          )}

          {/* Acciones principales */}
          {!rejecting && (
            <div className="flex gap-3">
              <button
                onClick={handleApprove}
                disabled={!!loadingAction}
                className="flex-1 py-2.5 bg-green-950 border border-green-800 text-green-400 rounded-xl text-sm font-semibold hover:bg-green-900 disabled:opacity-50 flex items-center justify-center gap-2 transition-colors"
              >
                {loadingAction === 'approve'
                  ? <><Loader2 className="h-4 w-4 animate-spin" />Aprobando…</>
                  : <><CheckCircle className="h-4 w-4" />Aprobar</>
                }
              </button>
              <button
                onClick={() => setRejecting(true)}
                disabled={!!loadingAction}
                className="flex-1 py-2.5 bg-red-950 border border-red-900 text-red-400 rounded-xl text-sm font-semibold hover:bg-red-900 disabled:opacity-50 flex items-center justify-center gap-2 transition-colors"
              >
                <XCircle className="h-4 w-4" />Rechazar
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Lightbox de imagen */}
      {lightbox && (
        <div className="fixed inset-0 z-[60] bg-black/95 flex items-center justify-center p-4" onClick={() => setLightbox(null)}>
          <img src={lightbox} alt="doc" className="max-w-full max-h-full rounded-xl object-contain" />
          <button className="absolute top-4 right-4 w-10 h-10 rounded-full bg-zinc-800 flex items-center justify-center">
            <X className="h-5 w-5 text-white" />
          </button>
        </div>
      )}
    </>
  );
}

// ════════════════════════════════════════════════════════════
// OVERVIEW
// ════════════════════════════════════════════════════════════
function Overview({ onNavigate }: { onNavigate: (s: Section) => void }) {
  const [stats, setStats]   = useState<any>(null);
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
    { label: 'Verificaciones pendientes', section: 'docs'        as Section, icon: FileCheck,     color: 'text-amber-400', badge: stats?.pending },
    { label: 'Gestión de créditos',       section: 'credits'     as Section, icon: Coins,          color: 'text-green-400' },
    { label: 'Transportadores',           section: 'transporters'as Section, icon: Users,          color: 'text-blue-400' },
    { label: 'Operadores de soporte',     section: 'operators'   as Section, icon: HeadphonesIcon, color: 'text-primary' },
    { label: 'Atención al cliente',       section: 'claims'      as Section, icon: AlertTriangle,  color: 'text-red-400' },
  ];

  if (loading) return <div className="flex justify-center py-20"><Loader2 className="h-7 w-7 animate-spin text-primary" /></div>;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-white">Panel WeMove</h2>
        <p className="text-sm text-zinc-500 mt-0.5">Administración de la flota comunitaria</p>
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard label="Transportadores" value={stats.total ?? 0}    icon={Users}          accent="text-blue-400"  sub={`${stats.verified} verificados`} />
        <StatCard label="Docs pendientes" value={stats.pending ?? 0}  icon={FileCheck}      accent="text-amber-400" />
        <StatCard label="Viajes activos"  value={stats.active ?? 0}   icon={MapPin}         accent="text-green-400" sub={`${stats.completed} completados`} />
        <StatCard label="Operadores"      value={stats.operators ?? 0} icon={HeadphonesIcon} accent="text-primary"   sub={`${stats.activeOps} activos`} />
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
  const [list, setList]     = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'verified' | 'pending' | 'rejected' | 'none'>('all');
  const { toast } = useToast();

  const load = useCallback(async () => {
    setLoading(true);
    const { data: trans } = await supabase
      .from('wemove_transporters')
      .select('id, user_id, verification_status, documents_submitted, submitted_at, avatar_url, rejection_reason')
      .order('submitted_at', { ascending: false, nullsFirst: false });

    if (trans?.length) {
      const ids = trans.map(t => t.user_id);
      const [{ data: profiles }, { data: users }] = await Promise.all([
        supabase.from('profiles').select('id, full_name, wemove_credits').in('id', ids),
        supabase.from('users').select('id, email').in('id', ids),
      ]);
      setList(trans.map(t => ({
        ...t,
        full_name: profiles?.find(p => p.id === t.user_id)?.full_name ?? '—',
        email:     users?.find(u => u.id === t.user_id)?.email ?? '—',
        credits:   profiles?.find(p => p.id === t.user_id)?.wemove_credits ?? 0,
      })));
    } else setList([]);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const verify     = async (uid: string) => {
    await supabase.from('wemove_transporters').update({ verification_status: 'verified', rejection_reason: null }).eq('user_id', uid);
    toast({ title: '✓ Transportador verificado' }); load();
  };
  const block      = async (uid: string) => {
    if (!confirm('¿Bloquear este transportador?')) return;
    await supabase.from('wemove_transporters').update({ verification_status: 'blocked' }).eq('user_id', uid);
    toast({ title: 'Transportador bloqueado' }); load();
  };
  const unblock    = async (uid: string) => {
    await supabase.from('wemove_transporters').update({ verification_status: 'pending' }).eq('user_id', uid);
    toast({ title: 'Desbloqueo aplicado' }); load();
  };
  const addCredits = async (uid: string, n: number) => {
    const t = list.find(t => t.user_id === uid);
    await supabase.from('profiles').update({ wemove_credits: (t?.credits ?? 0) + n }).eq('id', uid);
    toast({ title: `✓ +${n} créditos` }); load();
  };

  const filtered = list.filter(t =>
    filter === 'all'      ? true :
    filter === 'verified' ? t.verification_status === 'verified' :
    filter === 'pending'  ? (t.documents_submitted && t.verification_status === 'pending') :
    filter === 'rejected' ? t.verification_status === 'rejected' :
    !t.documents_submitted
  );

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
        {[['all','Todos'],['verified','Verificados'],['pending','En revisión'],['rejected','Rechazados'],['none','Sin docs']].map(([k,l]) => (
          <button key={k} onClick={() => setFilter(k as any)}
            className={cn('px-3 py-1.5 rounded-xl text-xs font-medium border transition-colors',
              filter === k ? 'bg-primary text-primary-foreground border-primary' : 'bg-zinc-800 text-zinc-400 border-zinc-700 hover:border-zinc-500')}>
            {l}
          </button>
        ))}
      </div>
      {loading
        ? <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
        : (
          <div className="space-y-3">
            {filtered.map(t => (
              <div key={t.id} className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4 space-y-3">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-sm font-bold text-primary overflow-hidden shrink-0">
                      {t.avatar_url
                        ? <img src={t.avatar_url} alt="" className="w-full h-full object-cover" />
                        : t.full_name?.[0]?.toUpperCase()
                      }
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-white">{t.full_name}</p>
                      <p className="text-xs text-zinc-500">{t.email}</p>
                      {t.rejection_reason && (
                        <p className="text-xs text-red-400 mt-0.5 italic">Motivo: {t.rejection_reason}</p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <StatusBadge status={t.verification_status} submitted={t.documents_submitted} />
                    <span className="text-xs text-zinc-400 bg-zinc-800 px-2 py-0.5 rounded-full">{t.credits} créditos</span>
                  </div>
                </div>
                <div className="flex gap-2 flex-wrap">
                  {t.verification_status !== 'verified' && t.documents_submitted && t.verification_status !== 'blocked' && (
                    <button onClick={() => verify(t.user_id)} className="flex items-center gap-1.5 px-3 py-1.5 bg-green-950 border border-green-800 text-green-400 rounded-xl text-xs font-medium hover:bg-green-900 transition-colors">
                      <CheckCircle className="h-3.5 w-3.5" /> Verificar
                    </button>
                  )}
                  <button onClick={() => addCredits(t.user_id, 1)} className="px-2.5 py-1.5 bg-zinc-800 border border-zinc-700 text-zinc-300 rounded-xl text-xs font-medium hover:bg-zinc-700 transition-colors">+1</button>
                  <button onClick={() => addCredits(t.user_id, 5)} className="px-2.5 py-1.5 bg-zinc-800 border border-zinc-700 text-zinc-300 rounded-xl text-xs font-medium hover:bg-zinc-700 transition-colors">+5</button>
                  {t.verification_status !== 'blocked'
                    ? <button onClick={() => block(t.user_id)} className="flex items-center gap-1.5 px-3 py-1.5 bg-red-950 border border-red-900 text-red-400 rounded-xl text-xs font-medium hover:bg-red-900 transition-colors">
                        <Ban className="h-3.5 w-3.5" /> Bloquear
                      </button>
                    : <button onClick={() => unblock(t.user_id)} className="flex items-center gap-1.5 px-3 py-1.5 bg-zinc-800 border border-zinc-700 text-zinc-400 rounded-xl text-xs font-medium hover:bg-zinc-700 transition-colors">
                        Desbloquear
                      </button>
                  }
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
        )
      }
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
  const { toast } = useToast();

  // Usa la vista vw_wemove_pending_verifications que creó la migración
  // Si aún no existe, hace la query manual con join
  const load = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('wemove_transporters')
      .select(
        'user_id, id_card_url, license_url, selfie_url, vehicle_photo_url, ' +
        'submitted_at, rejection_reason, avatar_url'
      )
      .eq('documents_submitted', true)
      .eq('verification_status', 'pending')
      .order('submitted_at', { ascending: true });

    if (error) { console.error(error); setLoading(false); return; }

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
  }, []);

  useEffect(() => { load(); }, [load]);

  const approve = async (uid: string) => {
    await supabase.from('wemove_transporters').update({
      verification_status: 'verified',
      rejection_reason: null,
    }).eq('user_id', uid);
    toast({ title: '✅ Transportador verificado' });
    setViewing(null);
    load();
  };

  const reject = async (uid: string, reason: string) => {
    await supabase.from('wemove_transporters').update({
      verification_status: 'rejected',
      documents_submitted: false,  // el chofer podrá volver a enviar
      rejection_reason: reason || null,
    }).eq('user_id', uid);
    toast({ title: 'Documentos rechazados', variant: 'destructive' });
    setViewing(null);
    load();
  };

  // Cuántos docs subió cada transportador
  const docsCount = (item: any) =>
    [item.id_card_url, item.license_url, item.selfie_url, item.vehicle_photo_url].filter(Boolean).length;

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-white">Verificaciones pendientes</h2>
          <p className="text-sm text-zinc-500 mt-0.5">{list.length} solicitudes por revisar</p>
        </div>
        <button onClick={load} className="p-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-400 transition-colors">
          <RefreshCw className="h-4 w-4" />
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
      ) : list.length === 0 ? (
        <div className="text-center py-16 bg-zinc-900 border border-zinc-800 rounded-2xl">
          <CheckCircle className="h-10 w-10 mx-auto mb-3 text-green-500/50" />
          <p className="text-white font-medium">Todo al día</p>
          <p className="text-sm text-zinc-500 mt-1">No hay documentos pendientes de revisión</p>
        </div>
      ) : (
        <div className="space-y-3">
          {list.map(item => {
            const count = docsCount(item);
            return (
              <div key={item.user_id} className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4">
                <div className="flex items-center justify-between gap-3 flex-wrap">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-sm font-bold text-primary overflow-hidden shrink-0">
                      {item.avatar_url
                        ? <img src={item.avatar_url} alt="" className="w-full h-full object-cover" />
                        : item.full_name?.[0]?.toUpperCase()
                      }
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-white">{item.full_name}</p>
                      <p className="text-xs text-zinc-500">{item.email}</p>
                      <p className="text-xs text-zinc-600 mt-0.5">
                        Enviado: {item.submitted_at ? new Date(item.submitted_at).toLocaleDateString('es-BO') : '—'}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-wrap">
                    {/* Indicador de documentos subidos */}
                    <div className="flex gap-1">
                      {[item.id_card_url, item.license_url, item.selfie_url, item.vehicle_photo_url].map((url, i) => (
                        <div
                          key={i}
                          className={cn('w-2 h-2 rounded-full', url ? 'bg-green-500' : 'bg-zinc-700')}
                          title={['Carnet','Licencia','Selfie','Vehículo'][i]}
                        />
                      ))}
                    </div>
                    <span className="text-xs text-zinc-500">{count}/4 docs</span>
                  </div>
                </div>

                {/* Miniaturas pequeñas de documentos subidos */}
                <div className="flex gap-2 mt-3">
                  {[
                    { label: 'Carnet',   url: item.id_card_url },
                    { label: 'Licencia', url: item.license_url },
                    { label: 'Selfie',   url: item.selfie_url },
                    { label: 'Vehículo', url: item.vehicle_photo_url },
                  ].map(({ label, url }) =>
                    url ? (
                      <div key={label} className="relative group">
                        <img
                          src={url} alt={label}
                          className="w-14 h-14 object-cover rounded-lg border border-zinc-700 cursor-pointer hover:border-primary/50 transition-colors"
                          onClick={() => setViewing(item)}
                        />
                        <span className="absolute -bottom-4 left-0 right-0 text-center text-[9px] text-zinc-600 leading-none">{label}</span>
                      </div>
                    ) : (
                      <div key={label} className="w-14 h-14 rounded-lg border border-dashed border-zinc-800 flex items-center justify-center">
                        <AlertCircle className="h-4 w-4 text-zinc-700" />
                      </div>
                    )
                  )}
                </div>

                {/* Acciones rápidas de la tarjeta */}
                <div className="flex gap-2 mt-5 flex-wrap">
                  <button
                    onClick={() => setViewing(item)}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-zinc-800 border border-zinc-700 text-zinc-300 rounded-xl text-xs font-medium hover:bg-zinc-700 transition-colors"
                  >
                    <Eye className="h-3.5 w-3.5" /> Ver documentos
                  </button>
                  <button
                    onClick={() => approve(item.user_id)}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-green-950 border border-green-800 text-green-400 rounded-xl text-xs font-medium hover:bg-green-900 transition-colors"
                  >
                    <CheckCircle className="h-3.5 w-3.5" /> Aprobar
                  </button>
                  <button
                    onClick={() => setViewing(item)}  // abre el modal para poner motivo de rechazo
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-red-950 border border-red-900 text-red-400 rounded-xl text-xs font-medium hover:bg-red-900 transition-colors"
                  >
                    <XCircle className="h-3.5 w-3.5" /> Rechazar
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal con documentos ampliados + acciones */}
      {viewing && (
        <DocsModal
          item={viewing}
          onClose={() => setViewing(null)}
          onApprove={approve}
          onReject={reject}
        />
      )}
    </div>
  );
}

// ════════════════════════════════════════════════════════════
// CRÉDITOS
// ════════════════════════════════════════════════════════════
function Credits() {
  const [list, setList]       = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch]   = useState('');
  const [custom, setCustom]   = useState<Record<string, string>>({});
  const { toast } = useToast();

  const load = useCallback(async () => {
    setLoading(true);
    const { data: trans } = await supabase.from('wemove_transporters').select('user_id, avatar_url');
    if (trans?.length) {
      const ids = trans.map(t => t.user_id);
      const [{ data: profiles }, { data: users }] = await Promise.all([
        supabase.from('profiles').select('id, full_name, wemove_credits').in('id', ids).order('wemove_credits', { ascending: true }),
        supabase.from('users').select('id, email').in('id', ids),
      ]);
      setList((profiles ?? []).map(p => ({
        ...p,
        email:      users?.find(u => u.id === p.id)?.email ?? '—',
        avatar_url: trans?.find(t => t.user_id === p.id)?.avatar_url,
      })));
    } else setList([]);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

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
      <input
        value={search} onChange={e => setSearch(e.target.value)}
        placeholder="Buscar por nombre o email…"
        className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-2.5 text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-primary/50 transition-all"
      />
      {loading
        ? <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
        : (
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
                  {[1, 5, 10].map(n => (
                    <button key={n} onClick={() => add(t.id, n)} className="px-2.5 py-1.5 bg-zinc-800 border border-zinc-700 text-zinc-300 rounded-xl text-xs font-medium hover:bg-zinc-700 transition-colors">+{n}</button>
                  ))}
                  <div className="flex items-center gap-1">
                    <input
                      type="number" min="1" placeholder="N" value={custom[t.id] ?? ''}
                      onChange={e => setCustom(p => ({ ...p, [t.id]: e.target.value }))}
                      className="w-14 bg-zinc-800 border border-zinc-700 rounded-lg px-2 py-1.5 text-xs text-white focus:outline-none focus:border-primary/50"
                    />
                    <button
                      onClick={() => { const n = parseInt(custom[t.id]); if (n > 0) { add(t.id, n); setCustom(p => ({ ...p, [t.id]: '' })); }}}
                      className="px-2.5 py-1.5 bg-primary/20 border border-primary/30 text-primary rounded-xl text-xs font-medium hover:bg-primary/30 transition-colors"
                    >OK</button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )
      }
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
  const { toast } = useToast();

  const load = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase.from('wemove_operators').select('*').order('created_at', { ascending: false });
    setList(data ?? []);
    setLoading(false);
  }, []);
  useEffect(() => { load(); }, [load]);

  const create = async () => {
    if (!name.trim() || !email.trim()) { toast({ title: 'Completa nombre y email', variant: 'destructive' }); return; }
    setSaving(true);
    try {
      const { error } = await supabase.from('wemove_operators').insert({
        name: name.trim(), email: email.trim().toLowerCase(),
        permissions: perms, active: true, created_by: adminId,
      });
      if (error) throw error;
      toast({ title: '✓ Operador creado' });
      setForm(false); setName(''); setEmail(''); setPerms({ ...DEFAULT_PERMISSIONS }); load();
    } catch (err: any) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    } finally { setSaving(false); }
  };

  const toggle = async (op: any) => {
    await supabase.from('wemove_operators').update({ active: !op.active }).eq('id', op.id);
    toast({ title: op.active ? 'Desactivado' : 'Activado' }); load();
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
            <button onClick={create} disabled={saving}
              className="flex-1 py-2.5 bg-primary text-primary-foreground rounded-xl text-sm font-semibold hover:bg-primary/90 disabled:opacity-50 flex items-center justify-center gap-2 transition-colors">
              {saving ? <><Loader2 className="h-4 w-4 animate-spin" />Creando…</> : '✓ Crear operador'}
            </button>
            <button onClick={() => setForm(false)} className="px-4 py-2.5 bg-zinc-800 border border-zinc-700 text-zinc-400 rounded-xl text-sm hover:bg-zinc-700 transition-colors">Cancelar</button>
          </div>
        </div>
      )}
      {loading
        ? <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
        : list.length === 0
          ? <div className="text-center py-16 bg-zinc-900 border border-zinc-800 rounded-2xl">
              <Shield className="h-10 w-10 mx-auto mb-3 text-zinc-600" />
              <p className="text-white font-medium">Sin operadores</p>
              <p className="text-sm text-zinc-500 mt-1">Crea el primer operador de soporte WeMove</p>
            </div>
          : <div className="space-y-3">
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
      }
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
// SIDEBAR
// ════════════════════════════════════════════════════════════
function WeMovesSidebar({ section, onSection, pendingDocs, onBack, onClose }: {
  section: Section; onSection: (s: Section) => void;
  pendingDocs: number; onBack: () => void; onClose: () => void;
}) {
  return (
    <nav className="flex flex-col h-full py-4 overflow-y-auto">
      <div className="px-3 mb-3">
        <button onClick={() => { onBack(); onClose(); }}
          className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs text-zinc-600 hover:text-zinc-400 hover:bg-zinc-800 transition-all">
          <ArrowLeft className="h-3.5 w-3.5" />Backoffice general
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
                  <Icon className="h-4 w-4 shrink-0" />{s.label}
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
// ADMIN GUARD + LOGIN
// ════════════════════════════════════════════════════════════
function AdminLogin({ onLogin }: { onLogin: (u: AdminUser) => void }) {
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw]     = useState(false);
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState('');
  const { toast } = useToast();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true); setError('');
    try {
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({ email, password });
      if (authError) throw authError;
      const { data: profile } = await supabase.from('profiles').select('role, full_name').eq('id', authData.user.id).single();
      if (profile?.role !== 'super_admin') {
        await supabase.auth.signOut();
        throw new Error('Acceso denegado. Solo super administradores.');
      }
      onLogin({ id: authData.user.id, email: authData.user.email!, fullName: profile.full_name ?? '' });
    } catch (err: any) {
      setError(err.message);
    } finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen bg-zinc-950 flex items-center justify-center p-4">
      <div className="w-full max-w-sm space-y-6">
        <div className="text-center">
          <div className="w-12 h-12 rounded-2xl bg-blue-500/20 border border-blue-500/30 flex items-center justify-center mx-auto mb-4">
            <span className="text-blue-400 text-xl font-bold">W</span>
          </div>
          <h1 className="text-2xl font-bold text-white">WeMove Admin</h1>
          <p className="text-zinc-500 text-sm mt-1">Acceso restringido a super administradores</p>
        </div>
        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="text-xs text-zinc-500">Email</label>
            <input type="email" value={email} onChange={e => setEmail(e.target.value)} required
              className="w-full mt-1 bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-2.5 text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-primary/50" />
          </div>
          <div>
            <label className="text-xs text-zinc-500">Contraseña</label>
            <div className="relative mt-1">
              <input type={showPw ? 'text' : 'password'} value={password} onChange={e => setPassword(e.target.value)} required
                className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-2.5 text-sm text-white pr-10 focus:outline-none focus:border-primary/50" />
              <button type="button" onClick={() => setShowPw(v => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300">
                {showPw ? <Eye className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>
          {error && <p className="text-xs text-red-400 bg-red-950 border border-red-900 px-3 py-2 rounded-xl">{error}</p>}
          <button type="submit" disabled={loading}
            className="w-full py-2.5 bg-primary text-primary-foreground rounded-xl text-sm font-semibold hover:bg-primary/90 disabled:opacity-50 flex items-center justify-center gap-2">
            {loading ? <><Loader2 className="h-4 w-4 animate-spin" />Iniciando…</> : 'Iniciar sesión'}
          </button>
        </form>
      </div>
    </div>
  );
}

function AdminGuard({ children }: { children: (user: AdminUser) => React.ReactNode }) {
  const [admin, setAdmin]       = useState<AdminUser | null>(null);
  const [checking, setChecking] = useState(true);

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

  // Refrescar el contador de docs pendientes al cambiar sección
  useEffect(() => {
    supabase
      .from('wemove_transporters')
      .select('*', { count: 'exact', head: true })
      .eq('verification_status', 'pending')
      .eq('documents_submitted', true)
      .then(({ count }) => setPending(count ?? 0));
  }, [section]);

  const logout = async () => {
    await supabase.auth.signOut();
    toast({ title: 'Sesión cerrada' });
    navigate('/admin');
  };

  const renderSection = (admin: AdminUser) => {
    switch (section) {
      case 'overview':     return <Overview onNavigate={setSection} />;
      case 'transporters': return <Transporters />;
      case 'docs':         return <Verifications />;
      case 'credits':      return <Credits />;
      case 'operators':    return <Operators adminId={admin.id} />;
      case 'claims':       return <ComingSoon label="Atención al cliente" />;
    }
  };

  return (
    <AdminGuard>
      {(admin) => (
        <div className="min-h-screen bg-zinc-950 flex flex-col">
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
                <span className="font-bold text-white text-sm">WeMove <span className="text-primary">Admin</span></span>
              </div>
              <span className="text-zinc-700 hidden md:inline">·</span>
              <span className="text-xs text-zinc-500 hidden md:inline">{SECTIONS.find(s => s.key === section)?.label}</span>
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
              sidebarOpen ? 'translate-x-0' : '-translate-x-full',
            )}>
              <WeMovesSidebar
                section={section} onSection={setSection}
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
