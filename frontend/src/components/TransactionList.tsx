import { ArrowUpRight, ArrowDownLeft, Shield, Loader2 } from 'lucide-react';
import StatusBadge from './StatusBadge';

interface Transaction {
  id: string;
  amount: string;
  type: string;
  status: string;
  senderPhone?: string;
  receiverPhone?: string;
  createdAt: string;
}

interface TransactionListProps {
  transactions: Transaction[];
  loading?: boolean;
}

export default function TransactionList({ transactions, loading }: TransactionListProps) {
  if (loading) {
    return (
      <div className="card flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-primary-600" />
      </div>
    );
  }

  return (
    <div className="card">
      <h2 className="text-lg font-semibold mb-4">Recent Transactions</h2>
      <div className="space-y-3">
        {transactions.length === 0 ? (
          <p className="text-center text-gray-500 py-8">No transactions yet</p>
        ) : (
          transactions.map((tx) => (
            <div
              key={tx.id}
              className="flex items-center justify-between p-4 hover:bg-gray-50 rounded-lg transition"
            >
              <div className="flex items-center">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                  tx.type === 'SEND' ? 'bg-red-100' : 'bg-green-100'
                }`}>
                  {tx.type === 'ESCROW' ? (
                    <Shield className="w-5 h-5 text-purple-600" />
                  ) : tx.type === 'SEND' ? (
                    <ArrowUpRight className="w-5 h-5 text-red-600" />
                  ) : (
                    <ArrowDownLeft className="w-5 h-5 text-green-600" />
                  )}
                </div>
                <div className="ml-3">
                  <p className="font-medium">{tx.type}</p>
                  <p className="text-sm text-gray-500">
                    {new Date(tx.createdAt).toLocaleDateString()}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p className="font-semibold">
                  {tx.type === 'SEND' ? '-' : '+'}{tx.amount} RWF
                </p>
                <StatusBadge status={tx.status} />
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}