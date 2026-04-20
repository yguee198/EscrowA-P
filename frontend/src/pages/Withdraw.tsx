import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation, useQuery } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { walletService } from '../services/walletService';
import PINModal from '../components/PINModal';
import { ArrowLeft, Download, AlertCircle } from 'lucide-react';

export default function Withdraw() {
  const [step, setStep] = useState(1);
  const [amount, setAmount] = useState('');
  const [bankAccount, setBankAccount] = useState('');
  const [bankName, setBankName] = useState('');
  const [showPinModal, setShowPinModal] = useState(false);
  const navigate = useNavigate();

  const { data: balance } = useQuery({
    queryKey: ['balance'],
    queryFn: walletService.getBalance,
  });

  const withdrawMutation = useMutation({
    mutationFn: walletService.withdraw,
    onSuccess: () => {
      toast.success('Withdrawal request submitted successfully!');
      navigate('/');
    },
  });

  const handlePinSubmit = (pin: string) => {
    withdrawMutation.mutate({
      amount: parseFloat(amount),
      bankAccount,
      bankName,
      pin,
    });
  };

  const fee = parseFloat(amount) * 0.02; // 2% withdrawal fee
  const total = parseFloat(amount) - fee;

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
          <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center">
            <Download className="w-6 h-6 text-orange-600" />
          </div>
          <div className="ml-4">
            <h1 className="text-2xl font-bold">Withdraw Funds</h1>
            <p className="text-gray-600">Transfer to your bank account</p>
          </div>
        </div>

        {step === 1 && (
          <div className="space-y-4">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex items-start">
              <AlertCircle className="w-5 h-5 text-blue-600 mr-2 mt-0.5 flex-shrink-0" />
              <div className="text-sm text-blue-800">
                <p className="font-semibold mb-1">Withdrawal Information</p>
                <ul className="list-disc list-inside space-y-1">
                  <li>Withdrawals are processed within 1-3 business days</li>
                  <li>A 2% processing fee applies to all withdrawals</li>
                  <li>Minimum withdrawal amount: 5,000 RWF</li>
                </ul>
              </div>
            </div>

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
                min="5000"
              />
              <p className="text-sm text-gray-500 mt-1">
                Available: {balance?.balance || '0'} RWF
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Bank Name
              </label>
              <select
                value={bankName}
                onChange={(e) => setBankName(e.target.value)}
                className="input"
              >
                <option value="">Select your bank</option>
                <option value="Bank of Kigali">Bank of Kigali</option>
                <option value="Equity Bank">Equity Bank</option>
                <option value="I&M Bank">I&M Bank</option>
                <option value="KCB Bank">KCB Bank</option>
                <option value="Cogebanque">Cogebanque</option>
                <option value="Access Bank">Access Bank</option>
                <option value="GT Bank">GT Bank</option>
                <option value="Ecobank">Ecobank</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Bank Account Number
              </label>
              <input
                type="text"
                value={bankAccount}
                onChange={(e) => setBankAccount(e.target.value)}
                className="input"
                placeholder="Enter your account number"
              />
            </div>

            <button
              onClick={() => setStep(2)}
              disabled={
                !amount ||
                parseFloat(amount) < 5000 ||
                parseFloat(amount) > parseFloat(balance?.balance || '0') ||
                !bankAccount ||
                !bankName
              }
              className="btn btn-primary w-full"
            >
              Continue
            </button>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-6">
            <div className="bg-gray-50 rounded-lg p-4 space-y-3">
              <h3 className="font-semibold text-gray-900 mb-3">Withdrawal Summary</h3>
              <div className="flex justify-between">
                <span className="text-gray-600">Amount</span>
                <span className="font-semibold">{amount} RWF</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Processing Fee (2%)</span>
                <span className="font-semibold text-red-600">-{fee.toFixed(2)} RWF</span>
              </div>
              <div className="border-t pt-3 flex justify-between">
                <span className="font-semibold">You will receive</span>
                <span className="font-bold text-lg text-green-600">{total.toFixed(2)} RWF</span>
              </div>
              <div className="border-t pt-3 space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-600">Bank</span>
                  <span className="font-semibold">{bankName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Account</span>
                  <span className="font-semibold">{bankAccount}</span>
                </div>
              </div>
            </div>

            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <p className="text-sm text-yellow-800">
                <strong>Note:</strong> Please ensure your bank account details are correct. 
                Incorrect details may result in delays or failed transactions.
              </p>
            </div>

            <div className="flex space-x-3">
              <button onClick={() => setStep(1)} className="btn btn-secondary flex-1">
                Back
              </button>
              <button
                onClick={() => setShowPinModal(true)}
                className="btn btn-primary flex-1"
              >
                Confirm Withdrawal
              </button>
            </div>
          </div>
        )}
      </div>

      <PINModal
        isOpen={showPinModal}
        onClose={() => setShowPinModal(false)}
        onSubmit={handlePinSubmit}
        loading={withdrawMutation.isPending}
      />
    </div>
  );
}
