import { useTranslation } from 'react-i18next';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { Plus, Package, ArrowRight, DollarSign } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

// Mock data
const mockTransactions = [
  {
    id: '1',
    description: 'Laptop Dell XPS 15',
    origin: 'Madrid',
    destination: 'Barcelona',
    value: 1200,
    fee: 50,
    status: 'verified',
    sender: 'Juan S.',
  },
  {
    id: '2',
    description: 'Documentos legales',
    origin: 'Valencia',
    destination: 'Sevilla',
    value: 0,
    fee: 25,
    status: 'in_transit',
    sender: 'María L.',
  },
  {
    id: '3',
    description: 'Cámara Canon EOS R5',
    origin: 'Bilbao',
    destination: 'Madrid',
    value: 3500,
    fee: 80,
    status: 'waiting_deposit',
    sender: 'Pedro G.',
  },
];

const Transactions = () => {
  const { t } = useTranslation();

  const getStatusBadge = (status: string) => {
    const statusMap: Record<string, { key: string; variant: 'default' | 'outline' | 'secondary' | 'destructive' }> = {
      created: { key: 'created', variant: 'outline' },
      waiting_verification: { key: 'waitingVerification', variant: 'outline' },
      verified: { key: 'verified', variant: 'secondary' },
      waiting_deposit: { key: 'waitingDeposit', variant: 'outline' },
      in_transit: { key: 'inTransit', variant: 'default' },
      delivered: { key: 'delivered', variant: 'secondary' },
      completed: { key: 'completed', variant: 'secondary' },
      in_dispute: { key: 'inDispute', variant: 'destructive' },
      canceled: { key: 'canceled', variant: 'destructive' },
    };

    const config = statusMap[status] || { key: status, variant: 'outline' as const };
    return (
      <Badge variant={config.variant} className={config.variant === 'outline' ? 'border-2' : ''}>
        {t(`transactions.status.${config.key}`)}
      </Badge>
    );
  };

  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1 bg-secondary">
        <div className="container py-8 md:py-12">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
            <h1 className="text-3xl md:text-4xl font-bold">{t('transactions.title')}</h1>
            <Button className="shadow-sm" asChild>
              <Link to="/transactions/create">
                <Plus className="mr-2 h-4 w-4" />
                {t('transactions.create')}
              </Link>
            </Button>
          </div>

          <div className="grid gap-4">
            {mockTransactions.map((tx) => (
              <div
                key={tx.id}
                className="border-2 border-foreground bg-background p-6 shadow-xs hover:shadow-sm transition-shadow"
              >
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                  <div className="flex gap-4 items-start">
                    <div className="h-16 w-16 border-2 border-foreground bg-secondary flex items-center justify-center shrink-0">
                      <Package className="h-8 w-8" />
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 flex-wrap">
                        {getStatusBadge(tx.status)}
                        <span className="text-sm text-muted-foreground">{tx.sender}</span>
                      </div>
                      <h3 className="font-bold text-lg">{tx.description}</h3>
                      <p className="text-sm text-muted-foreground">
                        {tx.origin} → {tx.destination}
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                    <div className="text-right">
                      <div className="flex items-center gap-1 justify-end">
                        <DollarSign className="h-4 w-4" />
                        <span className="font-bold text-lg">${tx.value + tx.fee}</span>
                      </div>
                      <span className="text-sm text-muted-foreground">
                        {t('transactions.total')}
                      </span>
                    </div>
                    
                    <Button variant="outline" className="border-2" asChild>
                      <Link to={`/transactions/${tx.id}`}>
                        {t('common.view')}
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </Link>
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {mockTransactions.length === 0 && (
            <div className="border-2 border-dashed border-foreground p-12 text-center">
              <p className="text-muted-foreground">{t('common.noResults')}</p>
            </div>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Transactions;
