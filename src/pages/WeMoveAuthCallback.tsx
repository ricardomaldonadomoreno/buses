import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Loader2, CheckCircle2, XCircle } from 'lucide-react';
import { Link } from 'react-router-dom';

type Status = 'processing' | 'success' | 'error';

export default function WeMoveAuthCallback() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [status, setStatus] = useState<Status>('processing');
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    const handleCallback = async () => {
      try {
        // Exchange the code in the URL for a valid session
        const { data, error } = await supabase.auth.exchangeCodeForSession(
          window.location.href
        );

        if (error || !data.session) {
          setErrorMsg(error?.message || 'No session returned');
          setStatus('error');
          return;
        }

        const userId = data.session.user.id;

        // The DB trigger may take a moment to create the wemove_transporter record.
        // We retry up to 6 times (3 seconds total) before giving up.
        let transporter = null;
        for (let attempt = 0; attempt < 6; attempt++) {
          const { data: td } = await supabase
            .from('wemove_transporters')
            .select('id, verification_status')
            .eq('user_id', userId)
            .maybeSingle();

          if (td) {
            transporter = td;
            break;
          }
          // Wait 500ms before retrying
          await new Promise((res) => setTimeout(res, 500));
        }

        if (!transporter) {
          // Trigger didn't fire — user authenticated but no transporter record.
          // This is not a fatal error; we'll create the record manually.
          const { error: insertError } = await supabase
            .from('wemove_transporters')
            .insert({ user_id: userId });

          if (insertError && insertError.code !== '23505') {
            // 23505 = unique_violation (record already exists, that's fine)
            console.error('Could not create transporter record:', insertError);
          }
        }

        setStatus('success');
        // Short pause so user sees the success state
        setTimeout(() => navigate('/wemove/dashboard'), 1500);
      } catch (err: unknown) {
        console.error('Auth callback exception:', err);
        setErrorMsg(err instanceof Error ? err.message : 'Unknown error');
        setStatus('error');
      }
    };

    handleCallback();
  }, [navigate]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background px-4">
      <div className="w-full max-w-sm text-center space-y-6">

        {/* Logo */}
        <img src="/logo.png" alt="BUSES" className="h-14 w-auto mx-auto mb-2" />

        {/* Status display */}
        {status === 'processing' && (
          <>
            <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto" />
            <div>
              <p className="font-serif text-xl font-semibold text-foreground">
                {t('wemoveAuth.callback.processing')}
              </p>
              <p className="text-sm text-muted-foreground mt-2">
                Esto solo tomará un momento…
              </p>
            </div>
          </>
        )}

        {status === 'success' && (
          <>
            <CheckCircle2 className="h-12 w-12 text-primary mx-auto" />
            <div>
              <p className="font-serif text-xl font-semibold text-foreground">
                {t('wemoveAuth.callback.success')}
              </p>
              <p className="text-sm text-muted-foreground mt-2">
                Redirigiendo a tu panel…
              </p>
            </div>
          </>
        )}

        {status === 'error' && (
          <>
            <XCircle className="h-12 w-12 text-destructive mx-auto" />
            <div>
              <p className="font-serif text-xl font-semibold text-foreground">
                {t('wemoveAuth.callback.error')}
              </p>
              {errorMsg && (
                <p className="text-xs text-muted-foreground mt-1 break-words">{errorMsg}</p>
              )}
            </div>
            <Link
              to="/wemove/register?tab=login"
              className="inline-flex items-center justify-center px-6 py-3 rounded-full bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 transition-colors"
            >
              Volver al acceso
            </Link>
          </>
        )}
      </div>
    </div>
  );
}
