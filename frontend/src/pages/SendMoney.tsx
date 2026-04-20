import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation, useQuery } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { transactionService } from '../services/transactionService';
import { walletService } from '../services/walletService';
import PINModal from '../components/PINModal';
import { ArrowLeft, Send, Shield } from 'lucide-react';

export default function SendMoney() {
  const [step, setStep] = useState(1);
  const [receiverPhone, setReceiverPhone] = useState('');
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [showPinModal, setShowPinModal] = useState(false);
  const navigate = useNavigate();

  const { data: balance } = useQuery({
    queryKey: ['balance'],
    queryFn: walletService.getBalance,
  });

  const sendMutation = useMutation({
    mutationFn: transactionService.sendMoney,
    onSuccess: (data) => {
      toast.success('Money sent successfully!');
      navigate('/', { state: { transactionId: data.transactionId } });
    },
  });

  const handlePinSubmit = (pin: string) => {
    sendMutation.mutate({
      receiverPhone,
      amount: parseFloat(amount),
      pin,
      description,
    });
  };

  const fee = parseFloat(amount) * 0.01; 
  const total = parseFloat(amount) + fee;

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
          <div className="w-12 h-12 bg-primary-100 rounded-full flex items-center justify-center">
            <Send className="w-6 h-6 text-primary-600" />
          </div>
          <div className="ml-4">
            <h1 className="text-2xl font-bold">Send Money</h1>
            <p className="text-gray-600">Transfer funds securely</p>
          </div>
        </div>

        {step === 1 && (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Recipient Phone Number
              </label>
              <input
                type="tel"
                value={receiverPhone}
                onChange={(e) => setReceiverPhone(e.target.value)}
                className="input"
                placeholder="078XXXXXXX"
              />
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
              />
              <p className="text-sm text-gray-500 mt-1">
                Available: {balance?.balance || '0'} RWF
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Description (Optional)
              </label>
              <input
                type="text"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="input"
                placeholder="Payment for..."
              />
            </div>

            <button
              onClick={() => setStep(2)}
              disabled={!receiverPhone || !amount || parseFloat(amount) <= 0}
              className="btn btn-primary w-full"
            >
              Continue
            </button>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-6">
            <div className="bg-gray-50 rounded-lg p-4 space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-600">Amount</span>
                <span className="font-semibold">{amount} RWF</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Fee (1%)</span>
                <span className="font-semibold">{fee.toFixed(2)} RWF</span>
              </div>
              <div className="border-t pt-3 flex justify-between">
                <span className="font-semibold">Total</span>
                <span className="font-bold text-lg">{total.toFixed(2)} RWF</span>
              </div>
            </div>

            <div className="flex items-center justify-center space-x-2 text-sm text-gray-600">
              <Shield className="w-4 h-4 text-green-600" />
              <span>Protected Transaction</span>
            </div>

            <div className="flex space-x-3">
              <button onClick={() => setStep(1)} className="btn btn-secondary flex-1">
                Back
              </button>
              <button
                onClick={() => setShowPinModal(true)}
                className="btn btn-primary flex-1"
              >
                Confirm & Pay
              </button>
            </div>
          </div>
        )}
      </div>

      <PINModal
        isOpen={showPinModal}
        onClose={() => setShowPinModal(false)}
        onSubmit={handlePinSubmit}
        loading={sendMutation.isPending}
      />
    </div>
  );
}