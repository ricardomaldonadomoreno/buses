import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { LanguageSelector } from '@/components/LanguageSelector';
import { useWeMoveAuth } from '@/hooks/useWeMoveAuth';
import { useToast } from '@/hooks/use-toast';
import { ArrowLeft, UserPlus, LogIn } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function WeMoveRegister() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { toast } = useToast();
  const { user, loading, countryCodes, signUp, signIn } = useWeMoveAuth();
  
  // Get tab from query param
  const defaultTab = searchParams.get('tab') === 'login' ? 'login' : 'signup';

  // Signup form state
  const [signupEmail, setSignupEmail] = useState('');
  const [signupPassword, setSignupPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [countryCode, setCountryCode] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [documentType, setDocumentType] = useState<'id_card' | 'driver_license' | 'passport'>('id_card');
  const [documentNumber, setDocumentNumber] = useState('');
  const [signupLoading, setSignupLoading] = useState(false);

  // Login form state
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginLoading, setLoginLoading] = useState(false);

  useEffect(() => {
    if (!loading && user) {
      navigate('/wemove/dashboard');
    }
  }, [user, loading, navigate]);

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (signupPassword !== confirmPassword) {
      toast({
        title: t('wemoveRegister.errors.passwordMismatch'),
        variant: 'destructive',
      });
      return;
    }

    if (signupPassword.length < 6) {
      toast({
        title: t('wemoveRegister.errors.passwordTooShort'),
        variant: 'destructive',
      });
      return;
    }

    if (!countryCode) {
      toast({
        title: t('wemoveRegister.errors.selectCountryCode'),
        variant: 'destructive',
      });
      return;
    }

    setSignupLoading(true);
    
    const { error } = await signUp(
      signupEmail,
      signupPassword,
      firstName,
      lastName,
      countryCode,
      phoneNumber,
      documentType,
      documentNumber
    );

    setSignupLoading(false);

    if (error) {
      toast({
        title: t('wemoveRegister.errors.signupFailed'),
        description: error.message,
        variant: 'destructive',
      });
      return;
    }

    toast({
      title: t('wemoveRegister.success.accountCreated'),
      description: t('wemoveRegister.success.checkEmail'),
    });

    // Navigate to verify email page instead of dashboard
    navigate(`/wemove/verify-email?email=${encodeURIComponent(signupEmail)}`);
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginLoading(true);

    const { error } = await signIn(loginEmail, loginPassword);

    setLoginLoading(false);

    if (error) {
      if (error.message === 'not_wemove_transporter') {
        toast({
          title: t('wemoveRegister.errors.notTransporter'),
          variant: 'destructive',
        });
      } else {
        toast({
          title: t('wemoveRegister.errors.loginFailed'),
          description: error.message,
          variant: 'destructive',
        });
      }
      return;
    }

    navigate('/wemove/dashboard');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>{t('common.loading')}</p>
      </div>
    );
  }

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
            <Button variant="secondary" size="sm" asChild className="border-2 border-foreground">
              <Link to="/wemove">
                <ArrowLeft className="h-4 w-4 mr-2" />
                {t('common.back')}
              </Link>
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container py-8 md:py-12">
        <div className="max-w-md mx-auto">
          <div className="text-center mb-8">
            <h1 className="text-3xl md:text-4xl font-black text-foreground mb-2">
              {t('wemoveRegister.title')}
            </h1>
            <p className="text-muted-foreground">
              {t('wemoveRegister.subtitle')}
            </p>
          </div>

          <Card className="border-4 border-foreground shadow-[8px_8px_0px_0px_hsl(var(--foreground))]">
            <CardHeader className="pb-4">
              <Tabs defaultValue={defaultTab} className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="signup" className="gap-2">
                    <UserPlus className="h-4 w-4" />
                    {t('wemoveRegister.tabs.signup')}
                  </TabsTrigger>
                  <TabsTrigger value="login" className="gap-2">
                    <LogIn className="h-4 w-4" />
                    {t('wemoveRegister.tabs.login')}
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="signup" className="mt-6">
                  <form onSubmit={handleSignup} className="space-y-4">
                    {/* Account Credentials */}
                    <div className="space-y-4">
                      <h3 className="font-bold text-foreground">{t('wemoveRegister.sections.credentials')}</h3>
                      
                      <div className="space-y-2">
                        <Label htmlFor="signup-email">{t('wemoveRegister.fields.email')}</Label>
                        <Input
                          id="signup-email"
                          type="email"
                          value={signupEmail}
                          onChange={(e) => setSignupEmail(e.target.value)}
                          required
                          className="border-2 border-foreground"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="signup-password">{t('wemoveRegister.fields.password')}</Label>
                        <Input
                          id="signup-password"
                          type="password"
                          value={signupPassword}
                          onChange={(e) => setSignupPassword(e.target.value)}
                          required
                          className="border-2 border-foreground"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="confirm-password">{t('wemoveRegister.fields.confirmPassword')}</Label>
                        <Input
                          id="confirm-password"
                          type="password"
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                          required
                          className="border-2 border-foreground"
                        />
                      </div>
                    </div>

                    {/* Phone Number */}
                    <div className="space-y-4">
                      <h3 className="font-bold text-foreground">{t('wemoveRegister.sections.phone')}</h3>
                      
                      <div className="grid grid-cols-3 gap-2">
                        <div className="space-y-2">
                          <Label>{t('wemoveRegister.fields.countryCode')}</Label>
                          <Select value={countryCode} onValueChange={setCountryCode}>
                            <SelectTrigger className="border-2 border-foreground">
                              <SelectValue placeholder="+XX" />
                            </SelectTrigger>
                            <SelectContent>
                              {countryCodes.map((cc) => (
                                <SelectItem key={cc.id} value={cc.dial_code}>
                                  {cc.dial_code} ({cc.country_iso})
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="col-span-2 space-y-2">
                          <Label htmlFor="phone">{t('wemoveRegister.fields.phoneNumber')}</Label>
                          <Input
                            id="phone"
                            type="tel"
                            value={phoneNumber}
                            onChange={(e) => setPhoneNumber(e.target.value)}
                            required
                            className="border-2 border-foreground"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Personal Identity */}
                    <div className="space-y-4">
                      <h3 className="font-bold text-foreground">{t('wemoveRegister.sections.identity')}</h3>
                      
                      <div className="grid grid-cols-2 gap-2">
                        <div className="space-y-2">
                          <Label htmlFor="first-name">{t('wemoveRegister.fields.firstName')}</Label>
                          <Input
                            id="first-name"
                            value={firstName}
                            onChange={(e) => setFirstName(e.target.value)}
                            required
                            className="border-2 border-foreground"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="last-name">{t('wemoveRegister.fields.lastName')}</Label>
                          <Input
                            id="last-name"
                            value={lastName}
                            onChange={(e) => setLastName(e.target.value)}
                            required
                            className="border-2 border-foreground"
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label>{t('wemoveRegister.fields.documentType')}</Label>
                        <Select 
                          value={documentType} 
                          onValueChange={(v) => setDocumentType(v as 'id_card' | 'driver_license' | 'passport')}
                        >
                          <SelectTrigger className="border-2 border-foreground">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="id_card">{t('wemoveRegister.documentTypes.idCard')}</SelectItem>
                            <SelectItem value="driver_license">{t('wemoveRegister.documentTypes.driverLicense')}</SelectItem>
                            <SelectItem value="passport">{t('wemoveRegister.documentTypes.passport')}</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="document-number">{t('wemoveRegister.fields.documentNumber')}</Label>
                        <Input
                          id="document-number"
                          value={documentNumber}
                          onChange={(e) => setDocumentNumber(e.target.value)}
                          required
                          className="border-2 border-foreground"
                        />
                      </div>
                    </div>

                    <Button 
                      type="submit" 
                      className="w-full border-4 border-foreground font-bold"
                      disabled={signupLoading}
                    >
                      {signupLoading ? t('common.loading') : t('wemoveRegister.buttons.createAccount')}
                    </Button>
                  </form>
                </TabsContent>

                <TabsContent value="login" className="mt-6">
                  <form onSubmit={handleLogin} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="login-email">{t('wemoveRegister.fields.email')}</Label>
                      <Input
                        id="login-email"
                        type="email"
                        value={loginEmail}
                        onChange={(e) => setLoginEmail(e.target.value)}
                        required
                        className="border-2 border-foreground"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="login-password">{t('wemoveRegister.fields.password')}</Label>
                      <Input
                        id="login-password"
                        type="password"
                        value={loginPassword}
                        onChange={(e) => setLoginPassword(e.target.value)}
                        required
                        className="border-2 border-foreground"
                      />
                    </div>

                    <Button 
                      type="submit" 
                      className="w-full border-4 border-foreground font-bold"
                      disabled={loginLoading}
                    >
                      {loginLoading ? t('common.loading') : t('wemoveRegister.buttons.login')}
                    </Button>
                  </form>
                </TabsContent>
              </Tabs>
            </CardHeader>
          </Card>
        </div>
      </main>
    </div>
  );
}
