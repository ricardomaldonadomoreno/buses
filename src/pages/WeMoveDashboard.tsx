import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate, Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { LanguageSelector } from '@/components/LanguageSelector';
import { useWeMoveAuth } from '@/hooks/useWeMoveAuth';
import { useMyWeMoveTransporter, useMyProfile, useMyTransportUnits, useMyWeMoveRoutes, useCancelWeMoveRoute } from '@/hooks/useWeMoveTransporter';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import {
  ArrowLeft, LogOut, User, Route, Star, Bus, MapPin,
  ArrowRight, Calendar, Users, CheckCircle, Clock, XCircle, Plus
} from 'lucide-react';

export default function WeMoveDashboard() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user, loading, signOut } = useWeMoveAuth();

  const { data: transporter } = useMyWeMoveTransporter(user?.id);
  const { data: profile } = useMyProfile(user?.id);
  const { data: units = [] } = useMyTransportUnits(user?.id);
  const { data: myRoutes = [], isLoading: routesLoading } = useMyWeMoveRoutes(user?.id);
  const cancelRoute = useCancelWeMoveRoute();

  useEffect(() => {
    if (!loading && !user) {
      navigate('/wemove/register');
    }
  }, [user, loading, navigate]);

  const handleSignOut = async () => {
    await signOut();
    navigate('/wemove');
  };

  const handleCancelRoute = async (routeId: string) => {
    if (!user) return;
    try {
      await cancelRoute.mutateAsync({ routeId, userId: user.id });
      toast({ title: t('weMoveDashboard.routeCancelled') });
    } catch {
      toast({ title: t('weMoveDashboard.errorCancelRoute'), variant: 'destructive' });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>{t('common.loading')}</p>
      </div>
    );
  }

  if (!user) return null;

  const activeRoutes = myRoutes.filter(r => r.status === 'active');
  const completedRoutes = myRoutes.filter(r => r.status === 'completed');
  const displayName = profile?.full_name || user.email?.split('@')[0] || 'Transportador';

  const verificationStatus = transporter?.verification_status ?? 'pending';
  const isVerified = verificationStatus === 'verified';

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-primary border-b-4 border-foreground">
        <div className="container flex items-center justify-between py-4">
          <Link to="/wemove" className="text-2xl font-black text-primary-foreground">
            WeMove
          </Link>
          <div className="flex items-center gap-4">
            <LanguageSelector />
            <Button
              variant="outline"
              size="sm"
              onClick={handleSignOut}
              className="border-2 border-primary-foreground text-primary-foreground hover:bg-primary-foreground hover:text-primary gap-2"
            >
              <LogOut className="h-4 w-4" />
              {t('common.logout')}
            </Button>
          </div>
        </div>
      </header>

      <main className="container py-8 max-w-3xl">
        {/* Welcome */}
        <div className="mb-6">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div>
              <h1 className="text-3xl font-black">
                {t('weMoveDashboard.welcome')}, {displayName} 👋
              </h1>
              <p className="text-muted-foreground mt-1">{user.email}</p>
            </div>
            <div className="flex items-center gap-2">
              {isVerified ? (
                <Badge className="bg-green-100 text-green-800 border-2 border-green-400 gap-1">
                  <CheckCircle className="h-3.5 w-3.5" />
                  {t('weMoveDashboard.verified')}
                </Badge>
              ) : (
                <Badge variant="outline" className="border-2 border-yellow-400 text-yellow-700 gap-1">
                  <Clock className="h-3.5 w-3.5" />
                  {t('weMoveDashboard.statusPending')}
                </Badge>
              )}
              {profile?.rating ? (
                <Badge variant="outline" className="border-2 border-foreground gap-1">
                  <Star className="h-3.5 w-3.5 fill-yellow-400 text-yellow-400" />
                  {profile.rating.toFixed(1)}
                </Badge>
              ) : null}
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          <Card className="border-4 border-foreground shadow-[3px_3px_0px_0px_hsl(var(--foreground))] text-center">
            <CardContent className="pt-4 pb-4">
              <div className="text-3xl font-black text-primary">{activeRoutes.length}</div>
              <div className="text-xs text-muted-foreground mt-1">{t('weMoveDashboard.activeRoutes')}</div>
            </CardContent>
          </Card>
          <Card className="border-4 border-foreground shadow-[3px_3px_0px_0px_hsl(var(--foreground))] text-center">
            <CardContent className="pt-4 pb-4">
              <div className="text-3xl font-black text-primary">{units.length}</div>
              <div className="text-xs text-muted-foreground mt-1">{t('weMoveDashboard.myUnits')}</div>
            </CardContent>
          </Card>
          <Card className="border-4 border-foreground shadow-[3px_3px_0px_0px_hsl(var(--foreground))] text-center">
            <CardContent className="pt-4 pb-4">
              <div className="text-3xl font-black text-primary">{transporter?.total_trips ?? 0}</div>
              <div className="text-xs text-muted-foreground mt-1">{t('weMoveDashboard.totalTrips')}</div>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
          <Button
            size="lg"
            asChild
            className="border-4 border-foreground gap-2 h-auto py-5 shadow-[3px_3px_0px_0px_hsl(var(--foreground))]"
          >
            <Link to="/wemove/profile">
              <User className="h-5 w-5" />
              <span className="flex flex-col items-start">
                <span className="font-bold">{t('weMoveDashboard.buttons.completeProfile')}</span>
                <span className="text-xs opacity-80">{t('weMoveDashboard.buttons.completeProfileDesc')}</span>
              </span>
            </Link>
          </Button>

          <Button
            size="lg"
            asChild
            variant="outline"
            className="border-4 border-foreground gap-2 h-auto py-5 shadow-[3px_3px_0px_0px_hsl(var(--foreground))]"
          >
            <Link to="/wemove/publish-route">
              <Route className="h-5 w-5" />
              <span className="flex flex-col items-start">
                <span className="font-bold">{t('weMoveDashboard.buttons.publishRoute')}</span>
                <span className="text-xs text-muted-foreground">{t('weMoveDashboard.buttons.publishRouteDesc')}</span>
              </span>
            </Link>
          </Button>
        </div>

        {/* My Routes */}
        <Card className="border-4 border-foreground shadow-[4px_4px_0px_0px_hsl(var(--foreground))]">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>{t('weMoveDashboard.myRoutes')}</CardTitle>
                <CardDescription>{t('weMoveDashboard.myRoutesDesc')}</CardDescription>
              </div>
              <Button size="sm" asChild variant="outline" className="border-2 border-foreground gap-1">
                <Link to="/wemove/publish-route">
                  <Plus className="h-4 w-4" />
                  {t('weMoveDashboard.newRoute')}
                </Link>
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {routesLoading ? (
              <p className="text-muted-foreground text-sm py-4 text-center">{t('common.loading')}</p>
            ) : myRoutes.length === 0 ? (
              <div className="text-center py-8 border-2 border-dashed border-muted-foreground/30 rounded-lg">
                <MapPin className="h-10 w-10 mx-auto text-muted-foreground mb-3" />
                <p className="text-muted-foreground">{t('weMoveDashboard.noRoutes')}</p>
                <Button asChild variant="outline" size="sm" className="mt-3 border-2 border-foreground gap-1">
                  <Link to="/wemove/publish-route">
                    <Plus className="h-4 w-4" />
                    {t('weMoveDashboard.publishFirstRoute')}
                  </Link>
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                {myRoutes.map(route => (
                  <div
                    key={route.id}
                    className="flex items-center justify-between p-4 border-2 border-foreground rounded-lg gap-3"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-bold text-sm">
                          {route.route?.origin?.name ?? '—'}
                        </span>
                        <ArrowRight className="h-3.5 w-3.5 shrink-0" />
                        <span className="font-bold text-sm">
                          {route.route?.destination?.name ?? '—'}
                        </span>
                        {route.status === 'active' ? (
                          <Badge className="bg-green-100 text-green-800 border-green-300 text-xs ml-1">
                            {t('weMoveDashboard.statusActive')}
                          </Badge>
                        ) : route.status === 'completed' ? (
                          <Badge variant="outline" className="text-xs ml-1">
                            {t('weMoveDashboard.statusCompleted')}
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="text-xs ml-1 border-red-300 text-red-600">
                            {t('weMoveDashboard.statusCancelled')}
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-3 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {format(new Date(route.departure_time), 'dd/MM/yyyy HH:mm')}
                        </span>
                        <span className="flex items-center gap-1">
                          <Users className="h-3 w-3" />
                          {route.available_seats} {t('weMove.availableSeats')}
                        </span>
                        <span className="font-bold text-primary">${route.price.toFixed(2)}</span>
                      </div>
                      {route.transport_unit && (
                        <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
                          <Bus className="h-3 w-3" />
                          <span className="capitalize">{route.transport_unit.type}</span>
                        </div>
                      )}
                    </div>
                    {route.status === 'active' && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleCancelRoute(route.id)}
                        className="border-2 border-destructive text-destructive hover:bg-destructive hover:text-destructive-foreground shrink-0 gap-1"
                      >
                        <XCircle className="h-3.5 w-3.5" />
                        {t('common.cancel')}
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Back Link */}
        <div className="mt-8 text-center">
          <Button variant="ghost" asChild>
            <Link to="/wemove">
              <ArrowLeft className="h-4 w-4 mr-2" />
              {t('weMoveDashboard.backToWeMove')}
            </Link>
          </Button>
        </div>
      </main>
    </div>
  );
}
