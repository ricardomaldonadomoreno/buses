import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';

export default function WeMoveAuthCallback() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [processing, setProcessing] = useState(true);

  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        const { data, error } = await supabase.auth.exchangeCodeForSession(window.location.href);
        
        if (error) {
          console.error('Auth callback error:', error);
          toast({
            title: t('wemoveAuth.callback.error'),
            description: error.message,
            variant: 'destructive',
          });
          navigate('/wemove/register?tab=login');
          return;
        }

        if (data.session) {
          toast({
            title: t('wemoveAuth.callback.success'),
          });
          navigate('/wemove/dashboard');
        } else {
          toast({
            title: t('wemoveAuth.callback.error'),
            variant: 'destructive',
          });
          navigate('/wemove/register?tab=login');
        }
      } catch (err) {
        console.error('Auth callback exception:', err);
        toast({
          title: t('wemoveAuth.callback.error'),
          variant: 'destructive',
        });
        navigate('/wemove/register?tab=login');
      } finally {
        setProcessing(false);
      }
    };

    handleAuthCallback();
  }, [navigate, toast, t]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background">
      <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
      <p className="text-lg text-muted-foreground">
        {t('wemoveAuth.callback.processing')}
      </p>
    </div>
  );
}
