import { useQuery } from '@tanstack/react-query';
import { walletService } from '../services/walletService';
import BalanceCard from '../components/BalanceCard';
import QuickActions from '../components/QuickActions';
import TransactionList from '../components/TransactionList';
import { Loader2 } from 'lucide-react';

export default function Home() {
  const { data: balance, isLoading: balanceLoading } = useQuery({
    queryKey: ['balance'],
    queryFn: walletService.getBalance,
  });

  const { data: transactions, isLoading: transactionsLoading } = useQuery({
    queryKey: ['transactions'],
    queryFn: () => walletService.getTransactions(10, 0),
  });

  if (balanceLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-primary-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <BalanceCard balance={balance?.balance || '0'} currency={balance?.currency || 'RWF'} />
      <QuickActions />
      <TransactionList
        transactions={transactions || []}
        loading={transactionsLoading}
      />
    </div>
  );
}