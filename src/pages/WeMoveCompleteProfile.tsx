import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate, Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { LanguageSelector } from '@/components/LanguageSelector';
import { useWeMoveAuth } from '@/hooks/useWeMoveAuth';
import { useToast } from '@/hooks/use-toast';
import { useMyProfile, useMyUserData, useMyTransportUnits, useUpdateProfile, useUpsertTransportUnit, useDeleteTransportUnit } from '@/hooks/useWeMoveTransporter';
import { ArrowLeft, LogOut, Plus, Pencil, Trash2, Bus, CheckCircle, Clock } from 'lucide-react';

const VEHICLE_TYPES = [
  'bus',
  'microbus',
  'van',
  'minibus',
  'coaster',
  'sedan',
  'suv',
];

export default function WeMoveCompleteProfile() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user, loading, signOut } = useWeMoveAuth();

  const { data: profile } = useMyProfile(user?.id);
  const { data: userData } = useMyUserData(user?.id);
  const { data: units = [], isLoading: unitsLoading } = useMyTransportUnits(user?.id);
  const updateProfile = useUpdateProfile();
  const upsertUnit = useUpsertTransportUnit();
  const deleteUnit = useDeleteTransportUnit();

  const [fullName, setFullName] = useState('');
  const [savingProfile, setSavingProfile] = useState(false);

  // Unit form state
  const [showUnitForm, setShowUnitForm] = useState(false);
  const [editingUnitId, setEditingUnitId] = useState<string | null>(null);
  const [unitType, setUnitType] = useState('');
  const [unitCapacity, setUnitCapacity] = useState('');
  const [savingUnit, setSavingUnit] = useState(false);

  useEffect(() => {
    if (!loading && !user) {
      navigate('/wemove/register');
    }
  }, [user, loading, navigate]);

  useEffect(() => {
    if (profile?.full_name) {
      setFullName(profile.full_name);
    } else if (userData) {
      const name = [userData.first_name, userData.last_name].filter(Boolean).join(' ');
      setFullName(name);
    }
  }, [profile, userData]);

  const handleSignOut = async () => {
    await signOut();
    navigate('/wemove');
  };

  const handleSaveProfile = async () => {
    if (!user || !fullName.trim()) return;
    setSavingProfile(true);
    try {
      await updateProfile.mutateAsync({ userId: user.id, fullName: fullName.trim() });
      toast({ title: t('wemoveProfile.profileSaved'), variant: 'default' });
    } catch {
      toast({ title: t('wemoveProfile.errorSavingProfile'), variant: 'destructive' });
    } finally {
      setSavingProfile(false);
    }
  };

  const handleEditUnit = (unit: typeof units[0]) => {
    setEditingUnitId(unit.id);
    setUnitType(unit.type);
    setUnitCapacity(String(unit.capacity));
    setShowUnitForm(true);
  };

  const handleCancelUnitForm = () => {
    setShowUnitForm(false);
    setEditingUnitId(null);
    setUnitType('');
    setUnitCapacity('');
  };

  const handleSaveUnit = async () => {
    if (!user || !unitType || !unitCapacity) return;
    const cap = parseInt(unitCapacity, 10);
    if (isNaN(cap) || cap < 1) {
      toast({ title: t('wemoveProfile.invalidCapacity'), variant: 'destructive' });
      return;
    }
    setSavingUnit(true);
    try {
      await upsertUnit.mutateAsync({
        unitId: editingUnitId || undefined,
        transporterId: user.id,
        type: unitType,
        capacity: cap,
      });
      toast({ title: editingUnitId ? t('wemoveProfile.unitUpdated') : t('wemoveProfile.unitAdded') });
      handleCancelUnitForm();
    } catch {
      toast({ title: t('wemoveProfile.errorSavingUnit'), variant: 'destructive' });
    } finally {
      setSavingUnit(false);
    }
  };

  const handleDeleteUnit = async (unitId: string) => {
    if (!user) return;
    try {
      await deleteUnit.mutateAsync({ unitId, userId: user.id });
      toast({ title: t('wemoveProfile.unitDeleted') });
    } catch {
      toast({ title: t('wemoveProfile.errorDeletingUnit'), variant: 'destructive' });
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

      <main className="container py-8 max-w-2xl">
        <div className="mb-6">
          <Button variant="ghost" asChild className="mb-4">
            <Link to="/wemove/dashboard">
              <ArrowLeft className="h-4 w-4 mr-2" />
              {t('weMoveDashboard.backToDashboard')}
            </Link>
          </Button>
          <h1 className="text-3xl font-black">{t('wemoveProfile.title')}</h1>
          <p className="text-muted-foreground mt-1">{t('wemoveProfile.subtitle')}</p>
        </div>

        {/* Personal Info */}
        <Card className="border-4 border-foreground shadow-[4px_4px_0px_0px_hsl(var(--foreground))] mb-6">
          <CardHeader>
            <CardTitle>{t('wemoveProfile.personalInfo')}</CardTitle>
            <CardDescription>{t('wemoveProfile.personalInfoDesc')}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>{t('wemoveRegister.fields.email')}</Label>
              <Input value={user.email || ''} disabled className="bg-muted" />
            </div>
            {userData && (
              <>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>{t('wemoveRegister.fields.firstName')}</Label>
                    <Input value={userData.first_name || ''} disabled className="bg-muted" />
                  </div>
                  <div className="space-y-2">
                    <Label>{t('wemoveRegister.fields.lastName')}</Label>
                    <Input value={userData.last_name || ''} disabled className="bg-muted" />
                  </div>
                </div>
                {userData.phone_full && (
                  <div className="space-y-2">
                    <Label>{t('wemoveProfile.phone')}</Label>
                    <Input value={userData.phone_full} disabled className="bg-muted" />
                  </div>
                )}
                {userData.document_number && (
                  <div className="space-y-2">
                    <Label>{t('wemoveRegister.fields.documentNumber')}</Label>
                    <Input value={userData.document_number} disabled className="bg-muted" />
                  </div>
                )}
              </>
            )}
            <div className="space-y-2">
              <Label>{t('wemoveProfile.displayName')}</Label>
              <div className="flex gap-2">
                <Input
                  value={fullName}
                  onChange={e => setFullName(e.target.value)}
                  placeholder={t('wemoveProfile.displayNamePlaceholder')}
                />
                <Button
                  onClick={handleSaveProfile}
                  disabled={savingProfile || !fullName.trim()}
                  className="border-2 border-foreground whitespace-nowrap"
                >
                  {savingProfile ? t('common.loading') : t('common.save')}
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">{t('wemoveProfile.displayNameHint')}</p>
            </div>
          </CardContent>
        </Card>

        {/* Transport Units */}
        <Card className="border-4 border-foreground shadow-[4px_4px_0px_0px_hsl(var(--foreground))]">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>{t('wemoveProfile.myUnits')}</CardTitle>
                <CardDescription>{t('wemoveProfile.myUnitsDesc')}</CardDescription>
              </div>
              {!showUnitForm && (
                <Button
                  size="sm"
                  onClick={() => setShowUnitForm(true)}
                  className="border-2 border-foreground gap-2"
                >
                  <Plus className="h-4 w-4" />
                  {t('wemoveProfile.addUnit')}
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Unit form */}
            {showUnitForm && (
              <Card className="border-2 border-primary bg-primary/5">
                <CardContent className="pt-4 space-y-4">
                  <h3 className="font-bold">
                    {editingUnitId ? t('wemoveProfile.editUnit') : t('wemoveProfile.newUnit')}
                  </h3>
                  <div className="space-y-2">
                    <Label>{t('wemoveProfile.vehicleType')}</Label>
                    <Select value={unitType} onValueChange={setUnitType}>
                      <SelectTrigger className="border-2 border-foreground">
                        <SelectValue placeholder={t('wemoveProfile.selectVehicleType')} />
                      </SelectTrigger>
                      <SelectContent>
                        {VEHICLE_TYPES.map(vt => (
                          <SelectItem key={vt} value={vt}>
                            {t(`wemoveProfile.vehicleTypes.${vt}`, { defaultValue: vt.charAt(0).toUpperCase() + vt.slice(1) })}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>{t('wemoveProfile.capacity')}</Label>
                    <Input
                      type="number"
                      min="1"
                      max="100"
                      value={unitCapacity}
                      onChange={e => setUnitCapacity(e.target.value)}
                      placeholder="ej. 15"
                      className="border-2 border-foreground"
                    />
                    <p className="text-xs text-muted-foreground">{t('wemoveProfile.capacityHint')}</p>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      onClick={handleSaveUnit}
                      disabled={savingUnit || !unitType || !unitCapacity}
                      className="border-2 border-foreground"
                    >
                      {savingUnit ? t('common.loading') : t('common.save')}
                    </Button>
                    <Button variant="outline" onClick={handleCancelUnitForm} className="border-2 border-foreground">
                      {t('common.cancel')}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Units list */}
            {unitsLoading ? (
              <p className="text-muted-foreground text-sm">{t('common.loading')}</p>
            ) : units.length === 0 && !showUnitForm ? (
              <div className="text-center py-8 border-2 border-dashed border-muted-foreground/30 rounded-lg">
                <Bus className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
                <p className="text-muted-foreground">{t('wemoveProfile.noUnits')}</p>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowUnitForm(true)}
                  className="mt-3 border-2 border-foreground gap-2"
                >
                  <Plus className="h-4 w-4" />
                  {t('wemoveProfile.addFirstUnit')}
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                {units.map(unit => (
                  <div
                    key={unit.id}
                    className="flex items-center justify-between p-4 border-2 border-foreground rounded-lg"
                  >
                    <div className="flex items-center gap-3">
                      <Bus className="h-8 w-8 text-primary" />
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold capitalize">{unit.type}</span>
                          {unit.verified ? (
                            <Badge className="bg-green-100 text-green-800 border-green-300 gap-1 text-xs">
                              <CheckCircle className="h-3 w-3" />
                              {t('wemoveProfile.verified')}
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="gap-1 text-xs border-yellow-400 text-yellow-700">
                              <Clock className="h-3 w-3" />
                              {t('wemoveProfile.pendingVerification')}
                            </Badge>
                          )}
                        </div>
                        <span className="text-sm text-muted-foreground">
                          {unit.capacity} {t('wemoveProfile.seats')}
                        </span>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => handleEditUnit(unit)}
                        className="border-2 border-foreground h-8 w-8"
                      >
                        <Pencil className="h-3 w-3" />
                      </Button>
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => handleDeleteUnit(unit.id)}
                        className="border-2 border-destructive text-destructive hover:bg-destructive hover:text-destructive-foreground h-8 w-8"
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
