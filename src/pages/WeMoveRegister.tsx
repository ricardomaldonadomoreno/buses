import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { LanguageSelector } from '@/components/LanguageSelector';
import { useWeMoveAuth } from '@/hooks/useWeMoveAuth';
import { useToast } from '@/hooks/use-toast';
import { ArrowLeft, UserPlus, LogIn, Eye, EyeOff, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

type Tab = 'signup' | 'login';

export default function WeMoveRegister() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { toast } = useToast();
  const { user, loading, countryCodes, signUp, signIn } = useWeMoveAuth();

  const [tab, setTab] = useState<Tab>(
    searchParams.get('tab') === 'login' ? 'login' : 'signup'
  );

  // Signup state
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
  const [showSignupPass, setShowSignupPass] = useState(false);

  // Login state
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginLoading, setLoginLoading] = useState(false);
  const [showLoginPass, setShowLoginPass] = useState(false);

  // Redirect if already logged in
  useEffect(() => {
    if (!loading && user) {
      navigate('/wemove/dashboard');
    }
  }, [user, loading, navigate]);

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();

    if (signupPassword !== confirmPassword) {
      toast({ title: t('wemoveRegister.errors.passwordMismatch'), variant: 'destructive' });
      return;
    }
    if (signupPassword.length < 6) {
      toast({ title: t('wemoveRegister.errors.passwordTooShort'), variant: 'destructive' });
      return;
    }
    if (!countryCode) {
      toast({ title: t('wemoveRegister.errors.selectCountryCode'), variant: 'destructive' });
      return;
    }

    setSignupLoading(true);
    const { error } = await signUp(
      signupEmail, signupPassword,
      firstName, lastName,
      countryCode, phoneNumber,
      documentType, documentNumber
    );
    setSignupLoading(false);

    if (error) {
      toast({ title: t('wemoveRegister.errors.signupFailed'), description: error.message, variant: 'destructive' });
      return;
    }

    toast({ title: t('wemoveRegister.success.accountCreated'), description: t('wemoveRegister.success.checkEmail') });
    navigate(`/wemove/verify-email?email=${encodeURIComponent(signupEmail)}`);
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginLoading(true);
    const { error } = await signIn(loginEmail, loginPassword);
    setLoginLoading(false);

    if (error) {
      const msg = error.message === 'not_wemove_transporter'
        ? t('wemoveRegister.errors.notTransporter')
        : t('wemoveRegister.errors.loginFailed');
      toast({ title: msg, variant: 'destructive' });
      return;
    }
    navigate('/wemove/dashboard');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">

      {/* Header */}
      <header className="sticky top-0 z-50 bg-background/95 backdrop-blur-md border-b border-border/50">
        <div className="h-px w-full bg-gradient-to-r from-transparent via-primary to-transparent" />
        <div className="container flex h-16 items-center justify-between">
          <Link to="/wemove" className="flex items-center gap-3 group">
            <img src="/logo.png" alt="WeMove" className="h-9 w-auto object-contain transition-opacity group-hover:opacity-80" />
            <span className="font-serif text-lg font-semibold text-foreground">
              We<span className="text-primary">Move</span>
            </span>
          </Link>
          <div className="flex items-center gap-3">
            <LanguageSelector />
            <Link
              to="/wemove"
              className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors min-h-[44px] px-3"
            >
              <ArrowLeft className="h-4 w-4" />
              {t('common.back')}
            </Link>
          </div>
        </div>
      </header>

      {/* Main */}
      <main className="flex-1 flex items-start justify-center px-4 py-10">
        <div className="w-full max-w-md">

          {/* Hero text */}
          <div className="text-center mb-8">
            <h1 className="font-serif text-3xl font-semibold text-foreground mb-2">
              {t('wemoveRegister.title')}
            </h1>
            <p className="text-sm text-muted-foreground">
              {t('wemoveRegister.subtitle')}
            </p>
          </div>

          {/* Card */}
          <div className="bg-card rounded-3xl border border-border/60 shadow-sm overflow-hidden">
            <div className="h-1 w-full bg-gradient-to-r from-primary/60 via-primary to-primary/60" />

            {/* Tab switcher */}
            <div className="flex border-b border-border/40">
              {(['signup', 'login'] as Tab[]).map((t_) => (
                <button
                  key={t_}
                  onClick={() => setTab(t_)}
                  className={cn(
                    'flex-1 flex items-center justify-center gap-2 py-4 text-sm font-medium transition-colors',
                    tab === t_
                      ? 'text-primary border-b-2 border-primary bg-primary/5'
                      : 'text-muted-foreground hover:text-foreground'
                  )}
                >
                  {t_ === 'signup'
                    ? <><UserPlus className="h-4 w-4" />{t('wemoveRegister.tabs.signup')}</>
                    : <><LogIn className="h-4 w-4" />{t('wemoveRegister.tabs.login')}</>
                  }
                </button>
              ))}
            </div>

            <div className="p-6">
              {/* ── SIGNUP ── */}
              {tab === 'signup' && (
                <form onSubmit={handleSignup} className="space-y-5">

                  {/* Credentials */}
                  <Section label={t('wemoveRegister.sections.credentials')}>
                    <Field label={t('wemoveRegister.fields.email')}>
                      <Input type="email" value={signupEmail} onChange={e => setSignupEmail(e.target.value)} required className="rounded-xl border-border/60" />
                    </Field>
                    <Field label={t('wemoveRegister.fields.password')}>
                      <PasswordInput value={signupPassword} onChange={setSignupPassword} show={showSignupPass} onToggle={() => setShowSignupPass(!showSignupPass)} />
                    </Field>
                    <Field label={t('wemoveRegister.fields.confirmPassword')}>
                      <Input type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} required className="rounded-xl border-border/60" />
                    </Field>
                  </Section>

                  {/* Phone */}
                  <Section label={t('wemoveRegister.sections.phone')}>
                    <div className="grid grid-cols-5 gap-2">
                      <div className="col-span-2">
                        <Label className="text-xs text-muted-foreground mb-1.5 block">{t('wemoveRegister.fields.countryCode')}</Label>
                        <Select value={countryCode} onValueChange={setCountryCode}>
                          <SelectTrigger className="rounded-xl border-border/60 h-11">
                            <SelectValue placeholder="+" />
                          </SelectTrigger>
                          <SelectContent>
                            {countryCodes.map(cc => (
                              <SelectItem key={cc.id} value={cc.dial_code}>
                                {cc.country_iso} {cc.dial_code}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="col-span-3">
                        <Label className="text-xs text-muted-foreground mb-1.5 block">{t('wemoveRegister.fields.phoneNumber')}</Label>
                        <Input value={phoneNumber} onChange={e => setPhoneNumber(e.target.value)} required className="rounded-xl border-border/60 h-11" />
                      </div>
                    </div>
                  </Section>

                  {/* Identity */}
                  <Section label={t('wemoveRegister.sections.identity')}>
                    <div className="grid grid-cols-2 gap-3">
                      <Field label={t('wemoveRegister.fields.firstName')}>
                        <Input value={firstName} onChange={e => setFirstName(e.target.value)} required className="rounded-xl border-border/60" />
                      </Field>
                      <Field label={t('wemoveRegister.fields.lastName')}>
                        <Input value={lastName} onChange={e => setLastName(e.target.value)} required className="rounded-xl border-border/60" />
                      </Field>
                    </div>
                    <Field label={t('wemoveRegister.fields.documentType')}>
                      <Select value={documentType} onValueChange={v => setDocumentType(v as typeof documentType)}>
                        <SelectTrigger className="rounded-xl border-border/60">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="id_card">{t('wemoveRegister.documentTypes.idCard')}</SelectItem>
                          <SelectItem value="driver_license">{t('wemoveRegister.documentTypes.driverLicense')}</SelectItem>
                          <SelectItem value="passport">{t('wemoveRegister.documentTypes.passport')}</SelectItem>
                        </SelectContent>
                      </Select>
                    </Field>
                    <Field label={t('wemoveRegister.fields.documentNumber')}>
                      <Input value={documentNumber} onChange={e => setDocumentNumber(e.target.value)} required className="rounded-xl border-border/60" />
                    </Field>
                  </Section>

                  <button
                    type="submit"
                    disabled={signupLoading}
                    className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl bg-primary text-primary-foreground font-semibold text-sm hover:bg-primary/90 transition-colors disabled:opacity-60 min-h-[52px]"
                  >
                    {signupLoading
                      ? <><Loader2 className="h-4 w-4 animate-spin" />{t('common.loading')}</>
                      : <><UserPlus className="h-4 w-4" />{t('wemoveRegister.buttons.createAccount')}</>
                    }
                  </button>
                </form>
              )}

              {/* ── LOGIN ── */}
              {tab === 'login' && (
                <form onSubmit={handleLogin} className="space-y-5">
                  <Field label={t('wemoveRegister.fields.email')}>
                    <Input type="email" value={loginEmail} onChange={e => setLoginEmail(e.target.value)} required className="rounded-xl border-border/60" />
                  </Field>
                  <Field label={t('wemoveRegister.fields.password')}>
                    <PasswordInput value={loginPassword} onChange={setLoginPassword} show={showLoginPass} onToggle={() => setShowLoginPass(!showLoginPass)} />
                  </Field>
                  <button
                    type="submit"
                    disabled={loginLoading}
                    className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl bg-primary text-primary-foreground font-semibold text-sm hover:bg-primary/90 transition-colors disabled:opacity-60 min-h-[52px]"
                  >
                    {loginLoading
                      ? <><Loader2 className="h-4 w-4 animate-spin" />{t('common.loading')}</>
                      : <><LogIn className="h-4 w-4" />{t('wemoveRegister.buttons.login')}</>
                    }
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

// ── Small helper components ──

function Section({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-3">
      <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">{label}</p>
      {children}
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs text-muted-foreground">{label}</Label>
      {children}
    </div>
  );
}

function PasswordInput({ value, onChange, show, onToggle }: {
  value: string;
  onChange: (v: string) => void;
  show: boolean;
  onToggle: () => void;
}) {
  return (
    <div className="relative">
      <Input
        type={show ? 'text' : 'password'}
        value={value}
        onChange={e => onChange(e.target.value)}
        required
        className="rounded-xl border-border/60 pr-10"
      />
      <button
        type="button"
        onClick={onToggle}
        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
        tabIndex={-1}
      >
        {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
      </button>
    </div>
  );
}
