// src/pages/WeMoveDashboard.tsx
import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useWeMoveAuth } from '@/hooks/useWeMoveAuth';
import { useToast } from '@/hooks/use-toast';
import {
  useMyProfile, useMyWeMoveTransporter,
  useMyTransportUnits, useMyWeMoveRoutes,
  useCancelWeMoveRoute
} from '@/hooks/useWeMoveTransporter';
import { SeatSelector } from '@/components/wemove/SeatSelector';
import { SeatLayoutEditor, SeatLayout } from '@/components/wemove/SeatLayoutEditor';
import { useQueryClient } from '@tanstack/react-query';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import {
  ArrowLeft, Plus, Star, Bus, MapPin, ArrowRight,
  Calendar, Users, Clock, XCircle, LogOut, User,
  DollarSign, CheckCircle, AlertCircle, Layout,
  ChevronDown, ChevronUp, Printer, Share2
} from 'lucide-react';
import { cn } from '@/lib/utils';

// ── Hook: bookings por ruta ───────────────────────────────────
function useRouteBookings(routeId: string | null) {
  const [bookings, setBookings] = useState<any[]>([]);
  const [loading, setLoading]   = useState(false);

  useEffect(() => {
    if (!routeId) { setBookings([]); return; }
    setLoading(true);
    supabase
      .from('wemove_bookings')
      .select('*')
      .eq('route_id', routeId)
      .in('status', ['confirmed', 'paid', 'expired'])
      .order('created_at', { ascending: true })
      .then(({ data }) => { setBookings(data ?? []); setLoading(false); });

    const ch = supabase
      .channel(`bookings-${routeId}`)
      .on('postgres_changes', {
        event: '*', schema: 'public',
        table: 'wemove_bookings',
        filter: `route_id=eq.${routeId}`
      }, () => {
        supabase.from('wemove_bookings')
          .select('*').eq('route_id', routeId)
          .in('status', ['confirmed', 'paid', 'expired'])
          .order('created_at', { ascending: true })
          .then(({ data }) => setBookings(data ?? []));
      })
      .subscribe();

    return () => { supabase.removeChannel(ch); };
  }, [routeId]);

  return { bookings, loading };
}

// ── Componente: manifiesto de pasajeros ───────────────────────
function RouteManifest({ route, units }: { route: any; units: any[] }) {
  const { toast }             = useToast();
  const qc                    = useQueryClient();
  const { bookings, loading } = useRouteBookings(route.id);
  const [marking, setMarking] = useState<string | null>(null);
  const { user }              = useWeMoveAuth();

  const unit       = units.find(u => u.id === route.transport_unit_id);
  const layout     = unit?.seat_layout ?? null;
  const takenSeats = bookings
    .filter(b => b.status === 'confirmed' || b.status === 'paid')
    .map(b => b.seat_label).filter(Boolean);

  const paid      = bookings.filter(b => b.status === 'paid').length;
  const confirmed = bookings.filter(b => b.status === 'confirmed').length;
  const expired   = bookings.filter(b => b.status === 'expired').length;

  const handleMarkPaid = async (bookingId: string) => {
    if (!user) return;
    setMarking(bookingId);
    const { data, error } = await supabase.rpc('mark_booking_paid', {
      p_booking_id:          bookingId,
      p_transporter_user_id: user.id,
    });
    setMarking(null);
    if (error) {
      toast({ title: 'Error al confirmar pago', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: `✓ Pago confirmado · comisión Bs.${data?.commission ?? '—'}` });
      qc.invalidateQueries({ queryKey: ['my-wemove-routes', user.id] });
    }
  };

  const handlePrint = () => {
    const lines = bookings.map(b =>
      `${b.seat_label ?? '?'} | ${b.passenger_name} | ${b.passenger_phone ?? '—'} | ${b.status === 'paid' ? 'PAGADO' : 'PENDIENTE'}`
    ).join('\n');
    const win = window.open('', '_blank');
    if (!win) return;
    win.document.write(`<pre style="font-family:monospace;padding:20px">
MANIFIESTO DE PASAJEROS
${route.trip_code ?? ''} — ${route.route?.origin?.name} → ${route.route?.destination?.name}
${format(new Date(route.departure_time), "d 'de' MMMM yyyy · HH:mm", { locale: es })}
─────────────────────────────────────────
ASIENTO | NOMBRE | TELÉFONO | ESTADO
─────────────────────────────────────────
${lines}
─────────────────────────────────────────
Total: ${bookings.length} reservas · ${paid} pagadas · ${confirmed} pendientes
    </pre>`);
    win.print();
  };

  return (
    // CAMBIO: en lg, layout horizontal — mapa izquierda, lista derecha
    <div className="flex flex-col lg:flex-row gap-6">

      {/* ── Mapa del vehículo — columna izquierda en escritorio ── */}
      {(layout || (unit?.capacity ?? 0) > 0) && (
        // CAMBIO: w-fit para que se ajuste al contenido del vehículo
        <div className="bg-muted/20 rounded-2xl p-4 w-fit shrink-0 self-start">
          <p className="text-xs font-black uppercase tracking-widest text-muted-foreground mb-3">
            Mapa del vehículo
          </p>
          <SeatSelector
            layout={layout}
            totalSeats={unit?.capacity ?? 10}
            takenSeats={takenSeats}
            selectedSeat={null}
            onSelect={() => {}}
            readOnly
          />
        </div>
      )}

      {/* ── Columna derecha: estadísticas + lista de pasajeros ── */}
      <div className="flex-1 min-w-0 space-y-4">

        {/* Estadísticas */}
        <div className="grid grid-cols-3 gap-2 text-center">
          <StatBadge label="Pagadas"    value={paid}      color="text-green-600 bg-green-50 border-green-200" />
          <StatBadge label="Pendientes" value={confirmed} color="text-amber-600 bg-amber-50 border-amber-200" />
          <StatBadge label="Expiradas"  value={expired}   color="text-muted-foreground bg-muted/40 border-border" />
        </div>

        {/* Lista pasajeros */}
        {loading ? (
          <div className="h-16 bg-muted/30 rounded-xl animate-pulse" />
        ) : bookings.length === 0 ? (
          <div className="text-center py-8 border-2 border-dashed border-border rounded-xl">
            <Users className="h-8 w-8 text-muted-foreground/30 mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">Sin reservas aún</p>
          </div>
        ) : (
          <div className="space-y-2">
            {bookings.map(b => {
              const isPaid    = b.status === 'paid';
              const isExpired = b.status === 'expired';
              const isOverdue = !isPaid && !isExpired && b.payment_deadline &&
                new Date(b.payment_deadline) < new Date();
              return (
                <div key={b.id} className={cn(
                  'rounded-xl border-2 p-3.5 space-y-2 transition-colors',
                  isPaid    ? 'border-green-200 bg-green-50/30' :
                  isExpired ? 'border-border bg-muted/20 opacity-60' :
                  isOverdue ? 'border-red-200 bg-red-50/30' :
                              'border-foreground/20 bg-background'
                )}>
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2.5">
                      <div className={cn(
                        'w-9 h-9 rounded-xl flex items-center justify-center text-sm font-black border-2 shrink-0',
                        isPaid    ? 'bg-green-100 border-green-300 text-green-700' :
                        isExpired ? 'bg-muted border-border text-muted-foreground' :
                                    'bg-primary/10 border-primary/30 text-primary'
                      )}>
                        {b.seat_label ?? '?'}
                      </div>
                      <div>
                        <p className="text-sm font-bold leading-tight">{b.passenger_name}</p>
                        <div className="flex flex-wrap gap-2 mt-0.5 text-xs text-muted-foreground">
                          {b.passenger_phone && <span>📞 {b.passenger_phone}</span>}
                          {b.passenger_email && <span>✉ {b.passenger_email}</span>}
                          {b.has_pet && <span>🐾 Mascota</span>}
                          {b.has_extra_luggage && <span>🧳 Equipaje extra</span>}
                        </div>
                        {b.passenger_notes && (
                          <p className="text-xs text-muted-foreground italic mt-0.5">"{b.passenger_notes}"</p>
                        )}
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      {isPaid ? (
                        <span className="text-xs font-bold text-green-700 flex items-center gap-1">
                          <CheckCircle className="h-3.5 w-3.5" /> Pagado
                        </span>
                      ) : isExpired ? (
                        <span className="text-xs text-muted-foreground">Expirado</span>
                      ) : (
                        <span className={cn('text-xs font-bold', isOverdue ? 'text-red-600' : 'text-amber-600')}>
                          {isOverdue ? '⚠ Vencido' : 'Pendiente'}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-1 border-t border-foreground/8">
                    <span className="text-xs text-muted-foreground font-mono">
                      Código: <span className="font-black text-foreground">{b.boarding_code ?? '—'}</span>
                    </span>
                    {!isPaid && !isExpired && (
                      <button
                        onClick={() => handleMarkPaid(b.id)}
                        disabled={!!marking}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-green-500 text-white text-xs font-bold hover:bg-green-600 disabled:opacity-50 transition-colors"
                      >
                        {marking === b.id
                          ? <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                          : <CheckCircle className="h-3.5 w-3.5" />
                        }
                        Marcar pagado
                      </button>
                    )}
                    {isPaid && b.commission_amount && (
                      <span className="text-xs text-muted-foreground">
                        Comisión: <span className="font-bold text-foreground">Bs.{b.commission_amount}</span>
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Acciones pie */}
        {bookings.length > 0 && (
          <div className="flex gap-2 pt-2">
            <button onClick={handlePrint}
              className="flex items-center gap-1.5 px-4 py-2 border-2 border-foreground rounded-xl text-xs font-bold hover:bg-muted transition-colors">
              <Printer className="h-3.5 w-3.5" /> Imprimir manifiesto
            </button>
            <button
              onClick={() => {
                const url = `${window.location.origin}/wemove/booking/${route.id}`;
                navigator.clipboard.writeText(url);
                toast({ title: '✓ Enlace copiado al portapapeles' });
              }}
              className="flex items-center gap-1.5 px-4 py-2 border-2 border-primary/40 text-primary rounded-xl text-xs font-bold hover:bg-primary/10 transition-colors">
              <Share2 className="h-3.5 w-3.5" /> Compartir viaje
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

function StatBadge({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div className={cn('border rounded-xl py-2 px-3', color)}>
      <p className="text-lg font-black">{value}</p>
      <p className="text-[10px] font-bold uppercase tracking-wide">{label}</p>
    </div>
  );
}

// ── Dashboard principal ───────────────────────────────────────
export default function WeMoveDashboard() {
  const navigate  = useNavigate();
  const { toast } = useToast();
  const { user, loading, signOut } = useWeMoveAuth();
  const qc        = useQueryClient();

  const { data: profile }     = useMyProfile(user?.id);
  const { data: transporter } = useMyWeMoveTransporter(user?.id);
  const { data: units = [] }  = useMyTransportUnits(user?.id);
  const { data: routes = [], isLoading: routesLoading } = useMyWeMoveRoutes(user?.id);
  const cancelRoute           = useCancelWeMoveRoute();

  const [activeTab, setActiveTab]     = useState<string | null>(null);
  const [showHistory, setShowHistory] = useState(false);
  const [editorUnit, setEditorUnit]   = useState<{
    id: string; type: string; capacity: number; layout: SeatLayout | null;
  } | null>(null);

  useEffect(() => {
    if (!loading && !user) navigate('/wemove/register');
  }, [user, loading, navigate]);

  useEffect(() => {
    if (routes.length > 0 && !activeTab) {
      const first = routes.find(r => r.status === 'active') ?? routes[0];
      setActiveTab(first.id);
    }
  }, [routes]);

  const handleCancelRoute = async (routeId: string) => {
    if (!user || !confirm('¿Cancelar este viaje?')) return;
    try {
      await cancelRoute.mutateAsync({ routeId, userId: user.id });
      toast({ title: 'Viaje cancelado' });
      qc.invalidateQueries({ queryKey: ['my-wemove-routes', user.id] });
    } catch {
      toast({ title: 'Error al cancelar', variant: 'destructive' });
    }
  };

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
    </div>
  );
  if (!user) return null;

  const displayName  = profile?.full_name || user.email?.split('@')[0] || 'Transportador';
  const isVerified   = transporter?.verification_status === 'verified';
  const activeRoutes = routes.filter(r => r.status === 'active');
  const pastRoutes   = routes.filter(r => r.status !== 'active');
  const selectedRoute = routes.find(r => r.id === activeTab) ?? null;

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-background/95 backdrop-blur-md border-b border-border/50">
        <div className="h-px w-full bg-gradient-to-r from-transparent via-primary to-transparent" />
        <div className="container flex h-14 items-center justify-between">
          <Link to="/wemove" className="font-serif text-lg font-semibold">
            We<span className="text-primary">Move</span>
          </Link>
          <div className="flex items-center gap-2">
            <Link to="/wemove/publish-route"
              className="flex items-center gap-1.5 px-3 py-2 bg-primary text-primary-foreground text-xs font-bold rounded-xl hover:bg-primary/90 transition-colors">
              <Plus className="h-3.5 w-3.5" /> Nuevo viaje
            </Link>
            <button onClick={async () => { await signOut(); navigate('/wemove'); }}
              className="p-2 text-muted-foreground hover:text-foreground transition-colors">
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </div>
      </header>

      <div className="flex-1 container py-6">
        <div className="flex flex-col lg:flex-row gap-6">

          {/* ── COLUMNA IZQUIERDA ─────────────────────────── */}
          <aside className="lg:w-64 shrink-0 space-y-4">

            {/* Perfil */}
            <div className="bg-card border border-border/60 rounded-2xl p-5 text-center space-y-3">
              <div className="w-16 h-16 rounded-full bg-primary/10 border-4 border-primary/20 flex items-center justify-center mx-auto text-2xl font-black text-primary">
                {displayName.charAt(0).toUpperCase()}
              </div>
              <div>
                <p className="font-bold text-sm">{displayName}</p>
                <p className="text-xs text-muted-foreground">{user.email}</p>
              </div>
              {profile?.rating ? (
                <div className="flex items-center justify-center gap-1">
                  {[1,2,3,4,5].map(i => (
                    <Star key={i} className={cn('h-3.5 w-3.5',
                      i <= Math.round(profile.rating ?? 0)
                        ? 'fill-yellow-400 text-yellow-400'
                        : 'text-muted-foreground/30'
                    )} />
                  ))}
                  <span className="text-xs font-bold ml-1">{profile.rating}</span>
                </div>
              ) : (
                <p className="text-xs text-muted-foreground">Sin calificaciones aún</p>
              )}
              {isVerified ? (
                <span className="inline-flex items-center gap-1 text-xs text-green-700 bg-green-50 border border-green-200 px-2.5 py-1 rounded-full font-semibold">
                  <CheckCircle className="h-3 w-3" /> Verificado
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 text-xs text-amber-700 bg-amber-50 border border-amber-200 px-2.5 py-1 rounded-full font-semibold">
                  <AlertCircle className="h-3 w-3" /> Pendiente verificación
                </span>
              )}
              <Link to="/wemove/profile"
                className="flex items-center justify-center gap-1.5 w-full py-2 border-2 border-foreground/20 rounded-xl text-xs font-bold hover:bg-muted transition-colors">
                <User className="h-3.5 w-3.5" /> Mi perfil y documentos
              </Link>
            </div>

            {/* Estadísticas */}
            <div className="bg-card border border-border/60 rounded-2xl p-4 grid grid-cols-2 gap-3">
              <div className="text-center">
                <p className="text-2xl font-black text-primary">{activeRoutes.length}</p>
                <p className="text-[10px] text-muted-foreground uppercase tracking-wide font-bold">Activos</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-black">{transporter?.total_trips ?? 0}</p>
                <p className="text-[10px] text-muted-foreground uppercase tracking-wide font-bold">Viajes</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-black">{units.length}</p>
                <p className="text-[10px] text-muted-foreground uppercase tracking-wide font-bold">Unidades</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-black">{Math.min(routes.length, 10)}/10</p>
                <p className="text-[10px] text-muted-foreground uppercase tracking-wide font-bold">Fichas</p>
              </div>
            </div>

            {/* CAMBIO: Mis unidades simplificado — solo botón a /wemove/profile */}
            <div className="bg-card border border-border/60 rounded-2xl p-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Bus className="h-4 w-4 text-primary" />
                <div>
                  <p className="text-xs font-bold">Mis unidades</p>
                  <p className="text-xs text-muted-foreground">{units.length} registradas</p>
                </div>
              </div>
              <Link to="/wemove/profile"
                className="flex items-center gap-1.5 px-3 py-2 bg-primary text-primary-foreground text-xs font-bold rounded-xl hover:bg-primary/90 transition-colors shrink-0">
                <Plus className="h-3.5 w-3.5" /> Ver / Agregar
              </Link>
            </div>

          </aside>

          {/* ── COLUMNA DERECHA ────────────────────────────── */}
          <main className="flex-1 min-w-0 space-y-4">

            {/* Tabs de rutas activas */}
            <div className="flex items-center gap-1 overflow-x-auto pb-1 scrollbar-none">
              {routesLoading ? (
                <div className="h-10 w-48 bg-muted/30 rounded-xl animate-pulse" />
              ) : activeRoutes.map(route => (
                <button
                  key={route.id}
                  onClick={() => setActiveTab(route.id)}
                  className={cn(
                    'shrink-0 flex items-center gap-2 px-4 py-2.5 rounded-xl border-2 text-xs font-bold transition-all whitespace-nowrap',
                    activeTab === route.id
                      ? 'border-primary bg-primary text-primary-foreground shadow-sm'
                      : 'border-border bg-card text-foreground hover:border-primary/50'
                  )}
                >
                  <span className="font-mono text-[10px] opacity-70">{route.trip_code ?? '—'}</span>
                  <span>{route.route?.origin?.name ?? '—'}</span>
                  <ArrowRight className="h-3 w-3 opacity-60" />
                  <span>{route.route?.destination?.name ?? '—'}</span>
                </button>
              ))}
              {activeRoutes.length < 10 && (
                <Link to="/wemove/publish-route"
                  className="shrink-0 flex items-center gap-1.5 px-4 py-2.5 rounded-xl border-2 border-dashed border-primary/40 text-primary text-xs font-bold hover:bg-primary/5 transition-colors whitespace-nowrap">
                  <Plus className="h-3.5 w-3.5" /> Nuevo viaje
                </Link>
              )}
            </div>

            {/* Ficha de la ruta seleccionada */}
            {selectedRoute ? (
              <RouteCard
                route={selectedRoute}
                units={units}
                onCancel={handleCancelRoute}
              />
            ) : !routesLoading && (
              <div className="bg-card border-2 border-dashed border-border rounded-2xl py-16 text-center space-y-3">
                <MapPin className="h-10 w-10 text-muted-foreground/30 mx-auto" />
                <p className="font-bold text-muted-foreground">No tienes viajes publicados</p>
                <Link to="/wemove/publish-route"
                  className="inline-flex items-center gap-2 px-5 py-2.5 bg-primary text-primary-foreground text-sm font-bold rounded-xl hover:bg-primary/90 transition-colors">
                  <Plus className="h-4 w-4" /> Publicar primer viaje
                </Link>
              </div>
            )}

            {/* Historial */}
            {pastRoutes.length > 0 && (
              <div className="bg-card border border-border/60 rounded-2xl overflow-hidden">
                <button
                  onClick={() => setShowHistory(!showHistory)}
                  className="w-full flex items-center justify-between px-5 py-3.5 hover:bg-muted/30 transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm font-semibold">Historial de viajes</span>
                    <span className="text-xs bg-muted text-muted-foreground px-2 py-0.5 rounded-full font-bold">
                      {pastRoutes.length}
                    </span>
                  </div>
                  {showHistory ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                </button>
                {showHistory && (
                  <div className="border-t border-border/40 divide-y divide-border/30">
                    {pastRoutes.map(route => (
                      <div key={route.id}
                        onClick={() => setActiveTab(route.id)}
                        className="flex items-center gap-3 px-5 py-3 hover:bg-muted/20 cursor-pointer transition-colors">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1.5 text-sm font-semibold text-muted-foreground">
                            {route.route?.origin?.name ?? '—'}
                            <ArrowRight className="h-3 w-3" />
                            {route.route?.destination?.name ?? '—'}
                          </div>
                          <p className="text-xs text-muted-foreground mt-0.5">
                            {format(new Date(route.departure_time), "d MMM yyyy", { locale: es })}
                            {route.trip_code && ` · ${route.trip_code}`}
                          </p>
                        </div>
                        <span className={cn(
                          'text-xs px-2 py-0.5 rounded-full font-bold border',
                          route.status === 'completed'
                            ? 'text-green-700 bg-green-50 border-green-200'
                            : 'text-red-600 bg-red-50 border-red-200'
                        )}>
                          {route.status === 'completed' ? 'Completado' : 'Cancelado'}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </main>
        </div>
      </div>

      {/* Modal editor de asientos */}
      {editorUnit && (
        <SeatLayoutEditor
          unitId={editorUnit.id}
          unitType={editorUnit.type}
          unitCapacity={editorUnit.capacity}
          initialLayout={editorUnit.layout}
          onSave={() => {
            setEditorUnit(null);
            qc.invalidateQueries({ queryKey: ['my-transport-units', user?.id] });
            toast({ title: '✓ Plantilla de asientos guardada' });
          }}
          onClose={() => setEditorUnit(null)}
        />
      )}
    </div>
  );
}

// ── Ficha individual de ruta ──────────────────────────────────
function RouteCard({ route, units, onCancel }: {
  route: any; units: any[]; onCancel: (id: string) => void;
}) {
  const departure = format(new Date(route.departure_time), "d 'de' MMMM · HH:mm", { locale: es });
  const unit      = units.find(u => u.id === route.transport_unit_id);
  const isPast    = new Date(route.departure_time) < new Date();

  return (
    <div className="bg-card border border-border/60 rounded-2xl overflow-hidden">
      {/* Header */}
      <div className="bg-primary/5 border-b border-border/40 px-5 py-4">
        <div className="flex items-start justify-between gap-3 flex-wrap">
          <div className="space-y-1">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-black text-lg">{route.route?.origin?.name ?? '—'}</span>
              <ArrowRight className="h-4 w-4 text-muted-foreground" />
              <span className="font-black text-lg">{route.route?.destination?.name ?? '—'}</span>
              <span className={cn(
                'text-xs px-2 py-0.5 rounded-full font-bold border',
                route.status === 'active'    ? 'text-green-700 bg-green-50 border-green-200' :
                route.status === 'completed' ? 'text-blue-700 bg-blue-50 border-blue-200' :
                                               'text-red-600 bg-red-50 border-red-200'
              )}>
                {route.status === 'active' ? 'Activo' : route.status === 'completed' ? 'Completado' : 'Cancelado'}
              </span>
            </div>
            <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
              <span className="flex items-center gap-1"><Calendar className="h-3 w-3" /> {departure}</span>
              <span className="flex items-center gap-1"><DollarSign className="h-3 w-3" /> Bs. {route.price} / asiento</span>
              {unit && (
                <span className="flex items-center gap-1">
                  <Bus className="h-3 w-3" /> {unit.type}
                  {unit.plate ? ` · ${unit.plate}` : ''}
                  {unit.color ? ` · ${unit.color}` : ''}
                </span>
              )}
              <span className="flex items-center gap-1"><Users className="h-3 w-3" /> {route.available_seats} asientos libres</span>
            </div>
            {route.notes && <p className="text-xs text-muted-foreground italic">📌 {route.notes}</p>}
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            {route.trip_code && (
              <span className="text-xs font-black text-primary bg-primary/10 border border-primary/30 px-2.5 py-1 rounded-full">
                {route.trip_code}
              </span>
            )}
            {route.status === 'active' && !isPast && (
              <button onClick={() => onCancel(route.id)}
                className="flex items-center gap-1.5 px-3 py-1.5 border-2 border-red-200 text-red-600 rounded-xl text-xs font-bold hover:bg-red-50 transition-colors">
                <XCircle className="h-3.5 w-3.5" /> Cancelar
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Manifiesto */}
      <div className="p-5">
        <RouteManifest route={route} units={units} />
      </div>
    </div>
  );
}
