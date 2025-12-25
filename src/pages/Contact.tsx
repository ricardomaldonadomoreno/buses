import { useTranslation } from 'react-i18next';
import { LandingHeader } from '@/components/landing/LandingHeader';
import { LandingFooter } from '@/components/landing/LandingFooter';
import { Mail, Phone, MapPin } from 'lucide-react';
const Contact = () => {
  const {
    t
  } = useTranslation();
  return <div className="flex min-h-screen flex-col bg-background">
      <LandingHeader />
      <main className="flex-1 container py-16">
        <h1 className="text-4xl font-black mb-8 text-center">{t('common.contact')}</h1>
        
        <div className="max-w-md mx-auto space-y-6">
          <div className="border-4 border-foreground bg-card p-6 flex items-center gap-4">
            <Mail className="h-8 w-8 text-primary" />
            <div>
              <h3 className="font-bold">Email</h3>
              <p className="text-muted-foreground">buses.app@gmail.com</p>
            </div>
          </div>
          
          <div className="border-4 border-foreground bg-card p-6 flex items-center gap-4">
            <Phone className="h-8 w-8 text-primary" />
            <div>
              <h3 className="font-bold">Teléfono</h3>
              <p className="text-muted-foreground">+1 234 567 890</p>
            </div>
          </div>
          
          <div className="border-4 border-foreground bg-card p-6 flex items-center gap-4">
            <MapPin className="h-8 w-8 text-primary" />
            <div>
              <h3 className="font-bold">Dirección</h3>
              <p className="text-muted-foreground">PANAMA SC986 - 5555</p>
            </div>
          </div>
        </div>
      </main>
      <LandingFooter />
    </div>;
};
export default Contact;