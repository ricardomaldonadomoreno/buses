import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate, Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { LanguageSelector } from '@/components/LanguageSelector';
import { useWeMoveAuth } from '@/hooks/useWeMoveAuth';
import { useToast } from '@/hooks/use-toast';
import { useLocations } from '@/hooks/useWeMoveData';
import { useMyTransportUnits, usePublishWeMoveRoute } from '@/hooks/useWeMoveTransporter';
import { ArrowLeft, LogOut, MapPin, Calendar, Users, DollarSign, Bus } from 'lucide-react';

export default function WeMovePublishRoute() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user, loading, signOut } = useWeMoveAuth();

  const { data: locations = [] } = useLocations();
  const { data: units = [] } = useMyTransportUnits(user?.id);
  const publishRoute = usePublishWeMoveRoute();

  const [originId, setOriginId] = useState('');
  const [destinationId, setDestinationId] = useState('');
  const [departureDate, setDepartureDate] = useState('');
  const [departureTime, setDepartureTime] = useState('');
  const [availableSeats, setAvailableSeats] = useState('');
  const [price, setPrice] = useState('');
  const [transportUnitId, setTransportUnitId] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!loading && !user) {
      navigate('/wemove/register');
    }
  }, [user, loading, navigate]);

  // Auto-select first unit if only one
  useEffect(() => {
    if (units.length === 1 && !transportUnitId) {
      setTransportUnitId(units[0].id);
    }
  }, [units]);

  const handleSignOut = async () => {
    await signOut();
    navigate('/wemove');
  };

  const handleSubmit = async () => {
    if (!user) return;

    if (!originId || !destinationId) {
      toast({ title: t('wemovePublish.errorSelectLocations'), variant: 'destructive' });
      return;
    }
    if (originId === destinationId) {
      toast({ title: t('wemovePublish.errorSameLocation'), variant: 'destructive' });
      return;
    }
    if (!departureDate || !departureTime) {
      toast({ title: t('wemovePublish.errorSelectDateTime'), variant: 'destructive' });
      return;
    }
    if (!availableSeats || parseInt(availableSeats) < 1) {
      toast({ title: t('wemovePublish.errorInvalidSeats'), variant: 'destructive' });
      return;
    }
    if (!price || parseFloat(price) <= 0) {
      toast({ title: t('wemovePublish.errorInvalidPrice'), variant: 'destructive' });
      return;
    }
    if (!transportUnitId) {
      toast({ title: t('wemovePublish.errorSelectUnit'), variant: 'destructive' });
      return;
    }

    const departureISO = new Date(`${departureDate}T${departureTime}:00`).toISOString();
    const now = new Date();
    if (new Date(departureISO) <= now) {
      toast({ title: t('wemovePublish.errorPastDate'), variant: 'destructive' });
      return;
    }

    setSubmitting(true);
    try {
      await publishRoute.mutateAsync({
        transporterId: user.id,
        transportUnitId,
        originId,
        destinationId,
        departureTime: departureISO,
        availableSeats: parseInt(availableSeats),
        price: parseFloat(price),
      });
      toast({ title: t('wemovePublish.successPublished') });
      navigate('/wemove/dashboard');
    } catch (err: any) {
      toast({
        title: t('wemovePublish.errorPublishing'),
        description: err?.message,
        variant: 'destructive',
      });
    } finally {
      setSubmitting(false);
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

  // Get tomorrow's date as min value
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate());
  const minDate = tomorrow.toISOString().split('T')[0];

  const selectedUnit = units.find(u => u.id === transportUnitId);
  const maxSeats = selectedUnit ? selectedUnit.capacity : undefined;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-primary border-b-4 border-foreground">
        <div className="container flex items-center justify-between py-4">
          <Link to="/wemove/dashboard" className="text-2xl font-black text-primary-foreground">
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

      <main className="container py-8 max-w-xl">
        <div className="mb-6">
          <Button variant="ghost" asChild className="mb-4">
            <Link to="/wemove/dashboard">
              <ArrowLeft className="h-4 w-4 mr-2" />
              {t('weMoveDashboard.backToDashboard')}
            </Link>
          </Button>
          <h1 className="text-3xl font-black">{t('wemovePublish.title')}</h1>
          <p className="text-muted-foreground mt-1">{t('wemovePublish.subtitle')}</p>
        </div>

        {units.length === 0 ? (
          <Card className="border-4 border-foreground shadow-[4px_4px_0px_0px_hsl(var(--foreground))]">
            <CardContent className="pt-6 text-center py-10">
              <Bus className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="font-bold text-lg mb-2">{t('wemovePublish.noUnitsTitle')}</h3>
              <p className="text-muted-foreground mb-4">{t('wemovePublish.noUnitsDesc')}</p>
              <Button asChild className="border-2 border-foreground">
                <Link to="/wemove/profile">{t('wemovePublish.goToProfile')}</Link>
              </Button>
            </CardContent>
          </Card>
        ) : (
          <Card className="border-4 border-foreground shadow-[4px_4px_0px_0px_hsl(var(--foreground))]">
            <CardHeader>
              <CardTitle>{t('wemovePublish.routeDetails')}</CardTitle>
              <CardDescription>{t('wemovePublish.routeDetailsDesc')}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              {/* Route */}
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-sm font-bold text-muted-foreground uppercase tracking-wide">
                  <MapPin className="h-4 w-4" />
                  {t('wemovePublish.sectionRoute')}
                </div>
                <div className="space-y-2">
                  <Label>{t('wemovePublish.origin')}</Label>
                  <Select value={originId} onValueChange={setOriginId}>
                    <SelectTrigger className="border-2 border-foreground">
                      <SelectValue placeholder={t('wemovePublish.selectOrigin')} />
                    </SelectTrigger>
                    <SelectContent>
                      {locations.map(loc => (
                        <SelectItem key={loc.id} value={loc.id}>
                          {loc.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>{t('wemovePublish.destination')}</Label>
                  <Select value={destinationId} onValueChange={setDestinationId}>
                    <SelectTrigger className="border-2 border-foreground">
                      <SelectValue placeholder={t('wemovePublish.selectDestination')} />
                    </SelectTrigger>
                    <SelectContent>
                      {locations
                        .filter(loc => loc.id !== originId)
                        .map(loc => (
                          <SelectItem key={loc.id} value={loc.id}>
                            {loc.name}
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Date & Time */}
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-sm font-bold text-muted-foreground uppercase tracking-wide">
                  <Calendar className="h-4 w-4" />
                  {t('wemovePublish.sectionDateTime')}
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label>{t('wemovePublish.date')}</Label>
                    <Input
                      type="date"
                      min={minDate}
                      value={departureDate}
                      onChange={e => setDepartureDate(e.target.value)}
                      className="border-2 border-foreground"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>{t('wemovePublish.time')}</Label>
                    <Input
                      type="time"
                      value={departureTime}
                      onChange={e => setDepartureTime(e.target.value)}
                      className="border-2 border-foreground"
                    />
                  </div>
                </div>
              </div>

              {/* Transport Unit */}
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-sm font-bold text-muted-foreground uppercase tracking-wide">
                  <Bus className="h-4 w-4" />
                  {t('wemovePublish.sectionUnit')}
                </div>
                <div className="space-y-2">
                  <Label>{t('wemovePublish.selectUnit')}</Label>
                  <Select value={transportUnitId} onValueChange={setTransportUnitId}>
                    <SelectTrigger className="border-2 border-foreground">
                      <SelectValue placeholder={t('wemovePublish.selectUnitPlaceholder')} />
                    </SelectTrigger>
                    <SelectContent>
                      {units.map(unit => (
                        <SelectItem key={unit.id} value={unit.id}>
                          {unit.type.charAt(0).toUpperCase() + unit.type.slice(1)} — {unit.capacity} {t('wemoveProfile.seats')}
                          {unit.verified ? ` ✓` : ''}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Seats & Price */}
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-sm font-bold text-muted-foreground uppercase tracking-wide">
                  <Users className="h-4 w-4" />
                  {t('wemovePublish.sectionSeatsPrice')}
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label>{t('wemovePublish.availableSeats')}</Label>
                    <Input
                      type="number"
                      min="1"
                      max={maxSeats}
                      value={availableSeats}
                      onChange={e => setAvailableSeats(e.target.value)}
                      placeholder="ej. 10"
                      className="border-2 border-foreground"
                    />
                    {maxSeats && (
                      <p className="text-xs text-muted-foreground">
                        {t('wemovePublish.maxSeatsHint', { max: maxSeats })}
                      </p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label>
                      <span className="flex items-center gap-1">
                        <DollarSign className="h-3 w-3" />
                        {t('wemovePublish.pricePerSeat')}
                      </span>
                    </Label>
                    <Input
                      type="number"
                      min="0.01"
                      step="0.01"
                      value={price}
                      onChange={e => setPrice(e.target.value)}
                      placeholder="ej. 25.00"
                      className="border-2 border-foreground"
                    />
                  </div>
                </div>
              </div>

              {/* Summary preview */}
              {originId && destinationId && departureDate && departureTime && availableSeats && price && (
                <Card className="bg-primary/5 border-2 border-primary">
                  <CardContent className="pt-4 pb-4">
                    <h4 className="font-bold mb-2 text-sm">{t('wemovePublish.preview')}</h4>
                    <div className="space-y-1 text-sm">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">{t('wemovePublish.route')}</span>
                        <span className="font-medium">
                          {locations.find(l => l.id === originId)?.name} → {locations.find(l => l.id === destinationId)?.name}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">{t('wemovePublish.departure')}</span>
                        <span className="font-medium">{departureDate} {departureTime}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">{t('wemovePublish.seats')}</span>
                        <span className="font-medium">{availableSeats}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">{t('wemovePublish.price')}</span>
                        <span className="font-bold text-primary">${parseFloat(price || '0').toFixed(2)}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              <Button
                onClick={handleSubmit}
                disabled={submitting}
                size="lg"
                className="w-full border-2 border-foreground font-bold text-base"
              >
                {submitting ? t('common.loading') : t('wemovePublish.publishButton')}
              </Button>
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  );
}
