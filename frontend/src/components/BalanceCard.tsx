import { Wallet, Eye, EyeOff } from 'lucide-react';
import { useState } from 'react';

interface BalanceCardProps {
  balance: string;
  currency: string;
}

export default function BalanceCard({ balance, currency }: BalanceCardProps) {
  const [showBalance, setShowBalance] = useState(true);

  return (
    <div className="card bg-gradient-to-br from-primary-600 to-primary-700 text-white">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center">
          <Wallet className="w-6 h-6 mr-2" />
          <span className="text-sm opacity-90">Available Balance</span>
        </div>
        <button
          onClick={() => setShowBalance(!showBalance)}
          className="p-2 hover:bg-white/10 rounded-lg transition"
        >
          {showBalance ? <Eye className="w-5 h-5" /> : <EyeOff className="w-5 h-5" />}
        </button>
      </div>
      <div className="text-4xl font-bold mb-2">
        {showBalance ? `${parseFloat(balance).toLocaleString()} ${currency}` : '••••••'}
      </div>
      <p className="text-sm opacity-75">Your wallet balance within Escrow</p>
    </div>
  );
}