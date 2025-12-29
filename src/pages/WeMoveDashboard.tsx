import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate, Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { LanguageSelector } from '@/components/LanguageSelector';
import { useWeMoveAuth } from '@/hooks/useWeMoveAuth';
import { ArrowLeft, LogOut, User, Route, Clock } from 'lucide-react';

export default function WeMoveDashboard() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { user, loading, signOut } = useWeMoveAuth();

  useEffect(() => {
    if (!loading && !user) {
      navigate('/wemove/register');
    }
  }, [user, loading, navigate]);

  const handleSignOut = async () => {
    await signOut();
    navigate('/wemove');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>{t('common.loading')}</p>
      </div>
    );
  }

  if (!user) {
    return null;
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
            <Button 
              variant="secondary" 
              size="sm" 
              className="border-2 border-foreground gap-2"
              onClick={handleSignOut}
            >
              <LogOut className="h-4 w-4" />
              {t('common.logout')}
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container py-8 md:py-12">
        <div className="max-w-2xl mx-auto">
          {/* Welcome Card */}
          <Card className="border-4 border-foreground shadow-[8px_8px_0px_0px_hsl(var(--foreground))] mb-8">
            <CardHeader>
              <CardTitle className="text-2xl md:text-3xl font-black">
                {t('weMoveDashboard.welcome')}
              </CardTitle>
              <CardDescription className="text-lg">
                {user.email}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-3 mb-6">
                <span className="font-bold">{t('weMoveDashboard.verificationStatus')}:</span>
                <Badge variant="secondary" className="border-2 border-foreground">
                  <Clock className="h-3 w-3 mr-1" />
                  {t('weMoveDashboard.statusPending')}
                </Badge>
              </div>
              <p className="text-muted-foreground">
                {t('weMoveDashboard.infoText')}
              </p>
            </CardContent>
          </Card>

          {/* Action Buttons */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Button 
              size="lg" 
              variant="outline"
              className="border-4 border-foreground gap-2 h-auto py-6"
              disabled
            >
              <User className="h-5 w-5" />
              <span className="flex flex-col items-start">
                <span className="font-bold">{t('weMoveDashboard.buttons.completeProfile')}</span>
                <span className="text-xs text-muted-foreground">{t('weMoveDashboard.comingSoon')}</span>
              </span>
            </Button>

            <Button 
              size="lg" 
              variant="outline"
              className="border-4 border-foreground gap-2 h-auto py-6"
              disabled
            >
              <Route className="h-5 w-5" />
              <span className="flex flex-col items-start">
                <span className="font-bold">{t('weMoveDashboard.buttons.publishRoute')}</span>
                <span className="text-xs text-muted-foreground">{t('weMoveDashboard.comingSoon')}</span>
              </span>
            </Button>
          </div>

          {/* Back Link */}
          <div className="mt-8 text-center">
            <Button variant="ghost" asChild>
              <Link to="/wemove">
                <ArrowLeft className="h-4 w-4 mr-2" />
                {t('weMoveDashboard.backToWeMove')}
              </Link>
            </Button>
          </div>
        </div>
      </main>
    </div>
  );
}
