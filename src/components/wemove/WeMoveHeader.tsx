// src/components/wemove/WeMoveHeader.tsx
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { LanguageSelector } from '@/components/LanguageSelector';
import { UserCircle, Home } from 'lucide-react';

export function WeMoveHeader() {
  const { t } = useTranslation();
  return (
    <header className="sticky top-0 z-50 w-full bg-foreground border-b-2 border-foreground">
      <div className="container flex h-14 items-center justify-between">
        <Link to="/wemove" className="flex items-center gap-2 group">
          <img src="/logo.png" alt="BUSES" className="h-8 w-auto object-contain opacity-90 group-hover:opacity-100 transition-opacity" />
          <div className="leading-none">
            <span className="font-black text-lg text-primary tracking-tight">WeMove</span>
            <span className="text-[10px] font-bold text-background/40 block uppercase tracking-widest">{t('weMove.byBusesApp')}</span>
          </div>
        </Link>
        <nav className="flex items-center gap-2">
          <LanguageSelector />
          <Link to="/" className="flex items-center gap-1.5 px-3 py-2 text-xs font-bold text-background/70 hover:text-background transition-colors">
            <Home className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">{t('common.backToHome')}</span>
          </Link>
          <Link to="/wemove/register"
            className="flex items-center gap-1.5 px-4 py-2 bg-primary text-primary-foreground text-xs font-black uppercase tracking-wide hover:bg-primary/90 transition-colors border-2 border-primary">
            <UserCircle className="h-3.5 w-3.5" />
            {t('common.access')}
          </Link>
        </nav>
      </div>
    </header>
  );
}
