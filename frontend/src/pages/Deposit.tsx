import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { walletService } from '../services/walletService';
import { ArrowLeft, Wallet } from 'lucide-react';

export default function Deposit() {
  const [amount, setAmount] = useState('');
  const navigate = useNavigate();

  const depositMutation = useMutation({
    mutationFn: walletService.deposit,
    onSuccess: () => {
      toast.success('Deposit successful!');
      navigate('/');
    },
  });

  const handleDeposit = () => {
    depositMutation.mutate(parseFloat(amount));
  };

  return (
    <div className="max-w-2xl mx-auto">
      <button
        onClick={() => navigate(-1)}
        className="flex items-center text-gray-600 hover:text-gray-900 mb-6"
      >
        <ArrowLeft className="w-5 h-5 mr-2" />
        Back
      </button>

      <div className="card">
        <div className="flex items-center mb-6">
          <div className="w-12 h-12 bg-emerald-100 rounded-full flex items-center justify-center">
            <Wallet className="w-6 h-6 text-emerald-600" />
          </div>
          <div className="ml-4">
            <h1 className="text-2xl font-bold">Add Funds</h1>
            <p className="text-gray-600">Deposit money into your wallet</p>
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Amount (RWF)
            </label>
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="input"
              placeholder="10,000"
            />
          </div>

          <button
            onClick={handleDeposit}
            disabled={!amount || parseFloat(amount) <= 0}
            className="btn btn-primary w-full"
          >
            {depositMutation.isPending ? 'Processing...' : 'Deposit'}
          </button>
        </div>
      </div>
    </div>
  );
}