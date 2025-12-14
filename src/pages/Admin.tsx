import { useTranslation } from 'react-i18next';
import { Header } from '@/components/Header';
import { LanguageSelector } from '@/components/LanguageSelector';
import { Link, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Users, 
  Truck, 
  Package, 
  Wallet, 
  Scale, 
  Settings,
  Menu,
  X,
  Bus
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useState } from 'react';
import { cn } from '@/lib/utils';

const menuItems = [
  { key: 'dashboard', icon: LayoutDashboard, path: '/admin' },
  { key: 'users', icon: Users, path: '/admin/users' },
  { key: 'trips', icon: Truck, path: '/admin/trips' },
  { key: 'transactions', icon: Package, path: '/admin/transactions' },
  { key: 'escrow', icon: Wallet, path: '/admin/escrow' },
  { key: 'disputes', icon: Scale, path: '/admin/disputes' },
  { key: 'settings', icon: Settings, path: '/admin/settings' },
];

const Admin = () => {
  const { t } = useTranslation();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const getLabel = (key: string) => {
    const labels: Record<string, string> = {
      dashboard: t('common.dashboard'),
      users: t('admin.users'),
      trips: t('admin.trips'),
      transactions: t('admin.transactions'),
      escrow: t('admin.escrow'),
      disputes: t('admin.disputes'),
      settings: t('admin.settings'),
    };
    return labels[key] || key;
  };

  return (
    <div className="flex min-h-screen flex-col">
      {/* Admin Header */}
      <header className="sticky top-0 z-50 w-full border-b-2 border-foreground bg-background">
        <div className="flex h-16 items-center justify-between px-4">
          <div className="flex items-center gap-4">
            <Button
              variant="outline"
              size="icon"
              className="border-2 lg:hidden"
              onClick={() => setSidebarOpen(!sidebarOpen)}
            >
              {sidebarOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </Button>
            <Link to="/admin" className="flex items-center gap-2 font-bold text-xl">
              <div className="flex h-10 w-10 items-center justify-center border-2 border-foreground bg-primary">
                <Bus className="h-6 w-6 text-primary-foreground" />
              </div>
              <span className="hidden sm:inline">{t('admin.title')}</span>
            </Link>
          </div>
          <div className="flex items-center gap-4">
            <LanguageSelector />
            <Button variant="outline" className="border-2" asChild>
              <Link to="/">{t('common.home')}</Link>
            </Button>
          </div>
        </div>
      </header>

      <div className="flex flex-1">
        {/* Sidebar */}
        <aside
          className={cn(
            "fixed inset-y-0 left-0 z-40 w-64 border-r-2 border-foreground bg-background pt-20 transition-transform lg:static lg:translate-x-0 lg:pt-0",
            sidebarOpen ? "translate-x-0" : "-translate-x-full"
          )}
        >
          <nav className="p-4 space-y-2">
            {menuItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path;
              return (
                <Link
                  key={item.key}
                  to={item.path}
                  onClick={() => setSidebarOpen(false)}
                  className={cn(
                    "flex items-center gap-3 px-4 py-3 font-medium transition-colors border-2",
                    isActive
                      ? "border-foreground bg-primary text-primary-foreground shadow-xs"
                      : "border-transparent hover:border-foreground hover:bg-secondary"
                  )}
                >
                  <Icon className="h-5 w-5" />
                  {getLabel(item.key)}
                </Link>
              );
            })}
          </nav>
        </aside>

        {/* Overlay */}
        {sidebarOpen && (
          <div
            className="fixed inset-0 z-30 bg-background/80 lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        {/* Main Content */}
        <main className="flex-1 bg-secondary p-6 lg:p-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold">{t('common.dashboard')}</h1>
          </div>

          {/* Dashboard Stats */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {[
              { label: t('admin.users'), value: '1,234', icon: Users },
              { label: t('admin.trips'), value: '567', icon: Truck },
              { label: t('admin.transactions'), value: '890', icon: Package },
              { label: t('admin.disputes'), value: '12', icon: Scale },
            ].map((stat, index) => {
              const Icon = stat.icon;
              return (
                <div
                  key={index}
                  className="border-2 border-foreground bg-background p-6 shadow-xs"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">{stat.label}</p>
                      <p className="text-3xl font-bold mt-1">{stat.value}</p>
                    </div>
                    <div className="h-12 w-12 border-2 border-foreground flex items-center justify-center">
                      <Icon className="h-6 w-6" />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Recent Activity Placeholder */}
          <div className="mt-8 border-2 border-foreground bg-background p-6 shadow-xs">
            <h2 className="text-xl font-bold mb-4">Recent Activity</h2>
            <div className="border-2 border-dashed border-foreground p-8 text-center text-muted-foreground">
              Activity feed will appear here
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default Admin;
