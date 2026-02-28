import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate, Link } from 'react-router-dom';
import { useWeMoveAuth } from '@/hooks/useWeMoveAuth';
import { useMyWeMoveTransporter, useMyProfile, useMyTransportUnits, useMyWeMoveRoutes, useCancelWeMoveRoute } from '@/hooks/useWeMoveTransporter';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { LanguageSelector } from '@/components/LanguageSelector';
import {
  LogOut, User, Star, Bus, MapPin, ArrowRight,
  Calendar, Users, CheckCircle, Clock, Plus,
  PawPrint, Luggage, ChevronDown, ChevronUp,
  AlertCircle, Loader2, TrendingUp, Shield, Bell, Route
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface Booking {
  id: string;
  passenger_name: string;
  passenger_email: string;
  passenger_phone: string | null;
  passenger_doc: string | null;
  seat_label: string;
  brings_pet: boolean;
  pet_description: string | null;
  extra_luggage: boolean;
  luggage_details: string | null;
  special_notes: string | null;
  status: string;
  payment_status: string;
  payment_method: string | null;
  amount_paid: number | null;
  booked_at: string;
  confirmed_at?: string | null;
  cancelled_at?: string | null;
}

function useRouteBookings(routeId: string | null) {
  return useQuery({
    queryKey: ['route-bookings', routeId],
    queryFn: async () => {
      if (!routeId) return [];
      const { data, error } = await supabase
        .from('wemove_bookings')
        .select('*')
        .eq('route_id', routeId)
        .order('booked_at', { ascending: true });
      if (error) throw error;
      return data as Booking[];
    },
    enabled: !!routeId,
  });
}

function useUpdateBooking() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ bookingId, updates }: { bookingId: string; updates: Record<string, unknown> }) => {
      const { error } = await supabase
        .from('wemove_bookings')
        .update(updates)
        .eq('id', bookingId);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['route-bookings'] }),
  });
}

const STATUS_CFG: Record<string, { label: string; cls: string }> = {
  pending:   { label: 'Pendiente',       cls: 'text-amber-700 bg-amber-50 border-amber-200' },
  confirmed: { label: 'Confirmado',      cls: 'text-blue-700 bg-blue-50 border-blue-200' },
  paid:      { label: 'Pagado',          cls: 'text-green-700 bg-green-50 border-green-200' },
  cancelled: { label: 'Cancelado',       cls: 'text-red-700 bg-red-50 border-red-200' },
  no_show:   { label: 'No se presentó', cls: 'text-gray-600 bg-gray-50 border-gray-200' },
};

const VEHICLE_EMOJI: Record<string, string> = {
  bus: '🚌', microbus: '🚐', minibus: '🚐', van: '🚐',
  sedan: '🚗', suv: '🚙', boat: '⛵', plane: '✈️', coaster: '🚌',
};

export default function WeMoveDashboard() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user, loading, signOut } = useWeMoveAuth();

  const { data: transporter }          = useMyWeMoveTransporter(user?.id);
  const { data: profile }              = useMyProfile(user?.id);
  const { data: units = [] }           = useMyTransportUnits(user?.id);
  const { data: myRoutes = [], isLoading: routesLoading } = useMyWeMoveRoutes(user?.id);
  const cancelRoute   = useCancelWeMoveRoute();
  const updateBooking = useUpdateBooking();

  const [expandedRoute, setExpandedRoute] = useState<string | null>(null);
  const { data: bookings = [], isLoading: bookingsLoading } = useRouteBookings(expandedRoute);

  useEffect(() => {
    if (!loading && !user) navigate('/wemove/register');
  }, [user, loading, navigate]);

  const handleSignOut = async () => {
    await signOut();
    navigate('/wemove');
  };

  const bookingAction = async (bookingId: string, action: 'confirm' | 'pay' | 'cancel') => {
    const now = new Date().toISOString();
    const updates: Record<string, unknown> = {
      confirm: { status: 'confirmed', confirmed_at: now },
      pay:     { status: 'paid', payment_status: 'paid' },
      cancel:  { status: 'cancelled', cancelled_at: now },
    }[action];
    try {
      await updateBooking.mutateAsync({ bookingId, updates });
      toast({ title: action === 'cancel' ? 'Reserva rechazada' : 'Reserva actualizada' });
    } catch {
      toast({ title: 'Error al actualizar', variant: 'destructive' });
    }
  };

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <Loader2 className="h-8 w-8 animate-spin text-primary" />
    </div>
  );
  if (!user) return null;

  const activeRoutes    = myRoutes.filter(r => r.status === 'active');
  const completedRoutes = myRoutes.filter(r => r.status === 'completed');
  const displayName     = profile?.full_name || user.email?.split('@')[0] || 'Transportador';
  const isVerified      = transporter?.verification_status === 'verified';

  return (
    <div className="min-h-screen bg-background flex flex-col">

      {/* HEADER */}
      <header className="sticky top-0 z-50 bg-background/95 backdrop-blur-md border-b border-border/50">
        <div className="h-px w-full bg-gradient-to-r from-transparent via-primary to-transparent" />
        <div className="container flex h-16 items-center justify-between gap-4">
          <Link to="/wemove" className="flex items-center gap-3 group">
            <img src="/logo.png" alt="WeMove" className="h-9 w-auto object-contain group-hover:opacity-80 transition-opacity" />
            <span className="font-serif text-lg font-semibold hidden sm:block">
              We<span className="text-primary">Move</span>
            </span>
          </Link>
          <div className="flex items-center gap-3">
            <LanguageSelector />
            <button onClick={handleSignOut}
              className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors min-h-[44px] px-3">
              <LogOut className="h-4 w-4" />
              <span className="hidden sm:inline">{t('common.logout')}</span>
            </button>
          </div>
        </div>
      </header>

      <main className="flex-1 container py-8 max-w-4xl space-y-8">

        {/* WELCOME */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="font-serif text-2xl font-semibold">
              Hola, <span className="text-primary">{displayName}</span>
            </h1>
            <div className="flex items-center gap-2 mt-1.5 flex-wrap">
              <span className={cn(
                'inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full border',
                isVerified
                  ? 'text-green-700 bg-green-50 border-green-200'
                  : 'text-amber-700 bg-amber-50 border-amber-200'
              )}>
                {isVerified ? <><Shield className="h-3 w-3" /> Verificado</> : <><Clock className="h-3 w-3" /> Verificación pendiente</>}
              </span>
              {!!profile?.rating && (
                <span className="inline-flex items-center gap-1.5 text-xs text-foreground/70 bg-muted px-2.5 py-1 rounded-full">
                  <Star className="h-3 w-3 fill-primary text-primary" /> {Number(profile.rating).toFixed(1)}
                </span>
              )}
            </div>
          </div>
          <div className="flex gap-2">
            <Link to="/wemove/profile"
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-border text-sm font-medium hover:bg-muted transition-colors min-h-[44px]">
              <User className="h-4 w-4" />
              <span className="hidden sm:inline">Mi perfil</span>
            </Link>
            <Link to="/wemove/publish-route"
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 transition-colors min-h-[44px]">
              <Plus className="h-4 w-4" /> Publicar viaje
            </Link>
          </div>
        </div>

        {/* STATS */}
        <div className="grid grid-cols-3 gap-3">
          {[
            { value: activeRoutes.length,         label: 'Viajes activos', icon: Route,      color: 'text-primary' },
            { value: units.length,                label: 'Mis unidades',   icon: Bus,        color: 'text-foreground' },
            { value: transporter?.total_trips ?? 0, label: 'Completados', icon: TrendingUp, color: 'text-green-600' },
          ].map(({ value, label, icon: Icon, color }) => (
            <div key={label} className="bg-card rounded-2xl border border-border/60 p-4 text-center">
              <Icon className={cn('h-5 w-5 mx-auto mb-2 opacity-50', color)} />
              <div className={cn('text-3xl font-serif font-bold', color)}>{value}</div>
              <div className="text-xs text-muted-foreground mt-0.5">{label}</div>
            </div>
          ))}
        </div>

        {/* NO UNITS WARNING */}
        {units.length === 0 && (
          <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-semibold text-amber-800">Sin unidades de transporte</p>
              <p className="text-xs text-amber-700 mt-0.5">Registra tu vehículo en tu perfil para poder publicar viajes.</p>
              <Link to="/wemove/profile" className="inline-block mt-2 text-xs font-semibold text-amber-800 underline underline-offset-2">
                Ir a Mi perfil →
              </Link>
            </div>
          </div>
        )}

        {/* MY ROUTES */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-serif text-lg font-semibold">Mis viajes publicados</h2>
            <span className="text-xs text-muted-foreground">{myRoutes.length} total</span>
          </div>

          {routesLoading ? (
            <div className="space-y-3">
              {[1,2].map(i => <div key={i} className="h-24 bg-card rounded-2xl border border-border/60 animate-pulse" />)}
            </div>
          ) : myRoutes.length === 0 ? (
            <div className="bg-card rounded-2xl border border-border/60 p-12 text-center">
              <Route className="h-10 w-10 text-muted-foreground/30 mx-auto mb-3" />
              <p className="text-sm text-muted-foreground">No has publicado ningún viaje aún</p>
              <Link to="/wemove/publish-route"
                className="inline-flex items-center gap-2 mt-4 px-5 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 transition-colors">
                <Plus className="h-4 w-4" /> Publicar mi primer viaje
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              {myRoutes.map((route) => {
                const isExpanded = expandedRoute === route.id;
                const departure  = new Date(route.departure_time);
                const emoji      = VEHICLE_EMOJI[route.transport_unit?.type ?? ''] ?? '🚌';
                const routeAny   = route as any;

                const routeStatusCls: Record<string, string> = {
                  active:    'text-green-700 bg-green-50 border-green-200',
                  completed: 'text-blue-700 bg-blue-50 border-blue-200',
                  cancelled: 'text-red-700 bg-red-50 border-red-200',
                };

                return (
                  <div key={route.id} className="bg-card rounded-2xl border border-border/60 overflow-hidden">
                    <div className="p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center gap-3 min-w-0">
                          <span className="text-2xl shrink-0">{emoji}</span>
                          <div className="min-w-0">
                            <div className="flex items-center gap-1.5 font-semibold text-sm">
                              <span className="truncate">{route.route?.origin?.name ?? '—'}</span>
                              <ArrowRight className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                              <span className="truncate">{route.route?.destination?.name ?? '—'}</span>
                            </div>
                            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1">
                              <span className="text-xs text-muted-foreground flex items-center gap-1">
                                <Calendar className="h-3 w-3" />
                                {format(departure, "d MMM · HH:mm", { locale: es })}
                              </span>
                              <span className="text-xs text-muted-foreground flex items-center gap-1">
                                <Users className="h-3 w-3" /> {route.available_seats} asientos
                              </span>
                              <span className="text-xs font-semibold text-primary">
                                Bs. {route.price}
                              </span>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          <span className={cn('text-xs font-medium px-2.5 py-1 rounded-full border',
                            routeStatusCls[route.status] ?? 'text-muted-foreground bg-muted border-border')}>
                            {route.status === 'active' ? 'Activo' : route.status === 'completed' ? 'Completado' : 'Cancelado'}
                          </span>
                          {route.status === 'active' && (
                            <button
                              onClick={() => cancelRoute.mutateAsync({ routeId: route.id, userId: user.id })
                                .then(() => toast({ title: 'Viaje cancelado' }))
                                .catch(() => toast({ title: 'Error', variant: 'destructive' }))}
                              className="text-xs text-red-600 hover:text-red-700 px-2 py-1 rounded-lg hover:bg-red-50 transition-colors">
                              Cancelar
                            </button>
                          )}
                        </div>
                      </div>

                      {/* Options */}
                      <div className="flex flex-wrap gap-1.5 mt-2.5">
                        {routeAny.accepts_pets  && <Badge>🐾 Mascotas</Badge>}
                        {routeAny.has_ac        && <Badge>❄️ A/C</Badge>}
                        {routeAny.has_wifi      && <Badge>📶 WiFi</Badge>}
                        {routeAny.door_to_door  && <Badge>🏠 Puerta a puerta</Badge>}
                      </div>

                      <button
                        onClick={() => setExpandedRoute(isExpanded ? null : route.id)}
                        className="flex items-center gap-1.5 mt-3 text-xs font-medium text-primary hover:text-primary/80 transition-colors">
                        {isExpanded ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
                        Ver pasajeros y reservas
                      </button>
                    </div>

                    {/* BOOKINGS PANEL */}
                    {isExpanded && (
                      <div className="border-t border-border/40 bg-muted/20">
                        {bookingsLoading ? (
                          <div className="p-6 flex items-center justify-center gap-2 text-sm text-muted-foreground">
                            <Loader2 className="h-4 w-4 animate-spin" /> Cargando…
                          </div>
                        ) : bookings.length === 0 ? (
                          <div className="p-8 text-center">
                            <Bell className="h-8 w-8 text-muted-foreground/20 mx-auto mb-2" />
                            <p className="text-sm text-muted-foreground">Sin reservas aún para este viaje</p>
                          </div>
                        ) : (
                          <div className="divide-y divide-border/30">
                            {/* Summary bar */}
                            <div className="px-4 py-2 flex flex-wrap gap-4 text-xs text-muted-foreground bg-muted/40">
                              <span className="font-medium">{bookings.length} reserva{bookings.length !== 1 ? 's' : ''}</span>
                              <span className="text-green-700">{bookings.filter(b => b.payment_status === 'paid').length} pagadas</span>
                              <span className="text-amber-700">{bookings.filter(b => b.status === 'pending').length} pendientes</span>
                              <span className="text-blue-700">{bookings.filter(b => b.status === 'confirmed').length} confirmadas</span>
                            </div>

                            {bookings.map((b) => {
                              const sc = STATUS_CFG[b.status] ?? STATUS_CFG.pending;
                              return (
                                <div key={b.id} className="p-4">
                                  <div className="flex items-start justify-between gap-3">
                                    <div className="min-w-0 flex-1">
                                      <div className="flex items-center gap-2.5">
                                        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-sm font-bold text-primary shrink-0">
                                          {b.passenger_name.charAt(0).toUpperCase()}
                                        </div>
                                        <div>
                                          <p className="text-sm font-semibold text-foreground">{b.passenger_name}</p>
                                          <p className="text-xs text-muted-foreground">{b.passenger_email}</p>
                                        </div>
                                      </div>

                                      <div className="flex flex-wrap gap-1.5 mt-2.5">
                                        <span className="text-xs font-bold bg-foreground/10 text-foreground px-2 py-0.5 rounded-lg">
                                          Asiento {b.seat_label}
                                        </span>
                                        {b.passenger_phone && (
                                          <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-lg">📞 {b.passenger_phone}</span>
                                        )}
                                        {b.passenger_doc && (
                                          <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-lg">🪪 {b.passenger_doc}</span>
                                        )}
                                        {b.brings_pet && (
                                          <span className="text-xs text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-lg">
                                            🐾 Mascota{b.pet_description ? `: ${b.pet_description}` : ''}
                                          </span>
                                        )}
                                        {b.extra_luggage && (
                                          <span className="text-xs text-blue-700 bg-blue-50 border border-blue-200 px-2 py-0.5 rounded-lg">
                                            🧳 Equipaje extra{b.luggage_details ? `: ${b.luggage_details}` : ''}
                                          </span>
                                        )}
                                        {b.special_notes && (
                                          <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-lg italic max-w-xs truncate">
                                            💬 {b.special_notes}
                                          </span>
                                        )}
                                      </div>

                                      {b.amount_paid && (
                                        <p className="text-xs font-semibold text-green-700 mt-1.5">
                                          Pagado: Bs. {b.amount_paid}{b.payment_method ? ` · ${b.payment_method}` : ''}
                                        </p>
                                      )}
                                    </div>

                                    <div className="flex flex-col items-end gap-2 shrink-0">
                                      <span className={cn('text-xs font-medium px-2.5 py-1 rounded-full border', sc.cls)}>
                                        {sc.label}
                                      </span>
                                      <span className={cn('text-xs', b.payment_status === 'paid' ? 'text-green-600 font-medium' : 'text-muted-foreground')}>
                                        {b.payment_status === 'paid' ? '✓ Pagado' : 'Sin pago'}
                                      </span>
                                      {b.status === 'pending' && (
                                        <div className="flex gap-1.5 mt-1">
                                          <button onClick={() => bookingAction(b.id, 'confirm')}
                                            className="text-xs px-2.5 py-1.5 rounded-lg bg-primary text-primary-foreground font-medium hover:bg-primary/90 transition-colors">
                                            Confirmar
                                          </button>
                                          <button onClick={() => bookingAction(b.id, 'cancel')}
                                            className="text-xs px-2.5 py-1.5 rounded-lg border border-red-200 text-red-600 hover:bg-red-50 transition-colors">
                                            Rechazar
                                          </button>
                                        </div>
                                      )}
                                      {b.status === 'confirmed' && b.payment_status === 'unpaid' && (
                                        <button onClick={() => bookingAction(b.id, 'pay')}
                                          className="text-xs px-2.5 py-1.5 rounded-lg bg-green-600 text-white font-medium hover:bg-green-700 transition-colors mt-1">
                                          Marcar pagado
                                        </button>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </section>

        {/* COMPLETED */}
        {completedRoutes.length > 0 && (
          <section>
            <h2 className="font-serif text-lg font-semibold mb-3">
              Completados <span className="text-muted-foreground text-base font-normal">({completedRoutes.length})</span>
            </h2>
            <div className="space-y-2">
              {completedRoutes.map(r => (
                <div key={r.id} className="bg-card/50 rounded-xl border border-border/40 px-4 py-3 flex items-center gap-3 opacity-60">
                  <span className="text-lg">{VEHICLE_EMOJI[r.transport_unit?.type ?? ''] ?? '🚌'}</span>
                  <span className="text-sm font-medium text-foreground/70">
                    {r.route?.origin?.name} → {r.route?.destination?.name}
                  </span>
                  <span className="ml-auto text-xs text-muted-foreground">
                    {format(new Date(r.departure_time), "d MMM yyyy", { locale: es })}
                  </span>
                </div>
              ))}
            </div>
          </section>
        )}

      </main>
    </div>
  );
}

function Badge({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center gap-1 text-xs text-foreground/60 bg-muted px-2 py-0.5 rounded-full">
      {children}
    </span>
  );
}
