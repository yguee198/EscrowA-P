import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { transactionService } from '../services/transactionService';
import { ArrowLeft, DollarSign, User } from 'lucide-react';

export default function RequestMoney() {
  const [step, setStep] = useState(1);
  const [receiverPhone, setReceiverPhone] = useState('');
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const navigate = useNavigate();

  const requestMutation = useMutation({
    mutationFn: transactionService.requestMoney,
    onSuccess: (data) => {
      toast.success('Money request sent successfully!');
      navigate('/', { state: { requestId: data.requestId } });
    },
  });

  const handleSubmit = () => {
    requestMutation.mutate({
      receiverPhone,
      amount: parseFloat(amount),
      description,
    });
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
          <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
            <DollarSign className="w-6 h-6 text-green-600" />
          </div>
          <div className="ml-4">
            <h1 className="text-2xl font-bold">Request Money</h1>
            <p className="text-gray-600">Request payment from someone</p>
          </div>
        </div>

        {step === 1 && (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <User className="w-4 h-4 inline mr-1" />
                From Phone Number
              </label>
              <input
                type="tel"
                value={receiverPhone}
                onChange={(e) => setReceiverPhone(e.target.value)}
                className="input"
                placeholder="078XXXXXXX"
              />
              <p className="text-sm text-gray-500 mt-1">
                Enter the phone number of the person you want to request money from
              </p>
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
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Description
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="input"
                placeholder="What is this request for?"
                rows={3}
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
              <h3 className="font-semibold text-gray-900 mb-3">Request Summary</h3>
              <div className="flex justify-between">
                <span className="text-gray-600">From</span>
                <span className="font-semibold">{receiverPhone}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Amount</span>
                <span className="font-semibold">{amount} RWF</span>
              </div>
              {description && (
                <div className="flex justify-between">
                  <span className="text-gray-600">Description</span>
                  <span className="font-semibold text-right max-w-xs">{description}</span>
                </div>
              )}
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p className="text-sm text-blue-800">
                <strong>Note:</strong> The recipient will receive a notification and can choose to accept or decline your request.
              </p>
            </div>

            <div className="flex space-x-3">
              <button onClick={() => setStep(1)} className="btn btn-secondary flex-1">
                Back
              </button>
              <button
                onClick={handleSubmit}
                disabled={requestMutation.isPending}
                className="btn btn-primary flex-1"
              >
                {requestMutation.isPending ? 'Sending...' : 'Send Request'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
