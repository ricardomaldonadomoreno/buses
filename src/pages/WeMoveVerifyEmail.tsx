import { useTranslation } from 'react-i18next';
import { useSearchParams, Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { LanguageSelector } from '@/components/LanguageSelector';
import { Mail, ArrowLeft, LogIn } from 'lucide-react';

export default function WeMoveVerifyEmail() {
  const { t } = useTranslation();
  const [searchParams] = useSearchParams();
  const email = searchParams.get('email') || '';

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
          <Card className="border-4 border-foreground shadow-[8px_8px_0px_0px_hsl(var(--foreground))]">
            <CardHeader className="text-center">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 border-4 border-foreground">
                <Mail className="h-8 w-8 text-primary" />
              </div>
              <CardTitle className="text-2xl font-black">
                {t('wemoveAuth.verifyEmail.title')}
              </CardTitle>
            </CardHeader>
            <CardContent className="text-center space-y-6">
              <p className="text-muted-foreground">
                {t('wemoveAuth.verifyEmail.message')}
              </p>
              {email && (
                <p className="font-semibold text-foreground break-all">
                  {email}
                </p>
              )}
              <p className="text-sm text-muted-foreground">
                {t('wemoveAuth.verifyEmail.checkSpam')}
              </p>
              <Button 
                asChild 
                className="w-full border-4 border-foreground font-bold"
              >
                <Link to="/wemove/register?tab=login">
                  <LogIn className="h-4 w-4 mr-2" />
                  {t('wemoveAuth.verifyEmail.goToLogin')}
                </Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
