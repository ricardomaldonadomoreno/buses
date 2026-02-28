import { useTranslation } from 'react-i18next';
import { useSearchParams, Link } from 'react-router-dom';
import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Mail, ArrowLeft, RefreshCw, CheckCircle2 } from 'lucide-react';
import { LanguageSelector } from '@/components/LanguageSelector';

export default function WeMoveVerifyEmail() {
  const { t } = useTranslation();
  const [searchParams] = useSearchParams();
  const email = searchParams.get('email') || '';
  const [resending, setResending] = useState(false);
  const [resent, setResent] = useState(false);
  const [resendError, setResendError] = useState('');

  const handleResend = async () => {
    if (!email || resending || resent) return;
    setResending(true);
    setResendError('');

    const { error } = await supabase.auth.resend({
      type: 'signup',
      email,
      options: {
        emailRedirectTo: `${window.location.origin}/wemove/auth/callback`,
      },
    });

    setResending(false);
    if (error) {
      setResendError(error.message);
    } else {
      setResent(true);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">

      {/* Header */}
      <header className="sticky top-0 z-50 bg-background/95 backdrop-blur-md border-b border-border/50">
        <div className="h-px w-full bg-gradient-to-r from-transparent via-primary to-transparent" />
        <div className="container flex h-16 items-center justify-between">
          <Link to="/wemove" className="flex items-center gap-3 group">
            <img
              src="/logo.png"
              alt="WeMove"
              className="h-9 w-auto object-contain transition-opacity group-hover:opacity-80"
            />
            <span className="font-serif text-lg font-semibold text-foreground">
              We<span className="text-primary">Move</span>
            </span>
          </Link>
          <div className="flex items-center gap-3">
            <LanguageSelector />
            <Link
              to="/wemove"
              className="flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors min-h-[44px] px-3"
            >
              <ArrowLeft className="h-4 w-4" />
              {t('common.back')}
            </Link>
          </div>
        </div>
      </header>

      {/* Main */}
      <main className="flex-1 flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-md">

          {/* Card */}
          <div className="bg-card rounded-3xl border border-border/60 shadow-sm overflow-hidden">

            {/* Gold top strip */}
            <div className="h-1 w-full bg-gradient-to-r from-primary/60 via-primary to-primary/60" />

            <div className="p-8 text-center space-y-6">

              {/* Icon */}
              <div className="mx-auto w-20 h-20 rounded-2xl bg-primary/10 flex items-center justify-center">
                <Mail className="h-9 w-9 text-primary" />
              </div>

              {/* Title */}
              <div>
                <h1 className="font-serif text-2xl font-semibold text-foreground">
                  {t('wemoveAuth.verifyEmail.title')}
                </h1>
                <p className="text-sm text-muted-foreground mt-2 leading-relaxed">
                  {t('wemoveAuth.verifyEmail.message')}
                </p>
              </div>

              {/* Email display */}
              {email && (
                <div className="bg-muted/60 rounded-xl px-4 py-3">
                  <p className="text-sm font-semibold text-foreground break-all">{email}</p>
                </div>
              )}

              {/* Steps */}
              <div className="text-left space-y-3 bg-muted/30 rounded-2xl p-4">
                <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-3">
                  Pasos a seguir
                </p>
                {[
                  'Revisa tu bandeja de entrada',
                  'Busca un correo de buses.app',
                  'Haz clic en "Confirmar cuenta"',
                  'Serás redirigido a tu panel',
                ].map((step, i) => (
                  <div key={i} className="flex items-start gap-3">
                    <span className="w-5 h-5 rounded-full bg-primary/15 text-primary text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">
                      {i + 1}
                    </span>
                    <p className="text-sm text-foreground/80">{step}</p>
                  </div>
                ))}
              </div>

              {/* Spam note */}
              <p className="text-xs text-muted-foreground">
                {t('wemoveAuth.verifyEmail.checkSpam')}
              </p>

              {/* Resend button */}
              <div className="space-y-2">
                {resent ? (
                  <div className="flex items-center justify-center gap-2 text-sm text-primary font-medium">
                    <CheckCircle2 className="h-4 w-4" />
                    Correo reenviado exitosamente
                  </div>
                ) : (
                  <button
                    onClick={handleResend}
                    disabled={resending || !email}
                    className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl border border-border text-sm font-medium text-foreground hover:bg-muted transition-colors disabled:opacity-50 min-h-[48px]"
                  >
                    <RefreshCw className={`h-4 w-4 ${resending ? 'animate-spin' : ''}`} />
                    {resending ? 'Reenviando…' : 'Reenviar correo de verificación'}
                  </button>
                )}
                {resendError && (
                  <p className="text-xs text-destructive">{resendError}</p>
                )}
              </div>

              {/* Login link */}
              <div className="pt-2 border-t border-border/40">
                <p className="text-xs text-muted-foreground mb-3">
                  ¿Ya verificaste tu cuenta?
                </p>
                <Link
                  to="/wemove/register?tab=login"
                  className="inline-flex items-center justify-center w-full px-4 py-3 rounded-xl bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 transition-colors min-h-[48px]"
                >
                  Iniciar sesión
                </Link>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
