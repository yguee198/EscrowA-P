import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { useMutation } from '@tanstack/react-query';
import { escrowService } from '../services/escrowService';
import { walletService } from '../services/walletService';
import PINModal from '../components/PINModal';
import { ArrowLeft, Shield, AlertCircle } from 'lucide-react';


export default function EscrowCreate() {
  const [step, setStep] = useState(1);
  const [receiverPhone, setReceiverPhone] = useState('');
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [showPinModal, setShowPinModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [createdEscrowId, setCreatedEscrowId] = useState<string | null>(null);
  const navigate = useNavigate();

  const { data: balance } = useQuery({
    queryKey: ['balance'],
    queryFn: walletService.getBalance,
  });

  const parsedAmount = parseFloat(amount) || 0;
  const fee = parsedAmount * 0.01;
  const total = parsedAmount + fee;
  const userBalance = balance?.balance || 0;

  const isValidPhone = receiverPhone.trim().length >= 9;
  const isValidAmount = !isNaN(parsedAmount) && parsedAmount > 0;

  const isDisabled =
    !isValidPhone ||
    !isValidAmount ||
    !description.trim() ||
    total > userBalance;

  const escrowMutation = useMutation({
    mutationFn: escrowService.createEscrow,
    onSuccess: (data) => {
      toast.success('Escrow created successfully!');

      setCreatedEscrowId(data.transactionId); // 🔥 save ID
      setShowPinModal(true); // 🔥 open confirm popup
    },
  });

  const handlePinSubmit = async (pin: string) => {
    try {
       setLoading(true);

      if (!receiverPhone) {
        toast.error('Please enter a recipient phone number');
        return;
      }

      if (isNaN(parsedAmount) || parsedAmount <= 0) {
        toast.error('Please enter a valid amount');
        return;
      }

      // ✅ normalize phone
      const formattedPhone = receiverPhone.startsWith('0')
        ? '+250' + receiverPhone.slice(1)
        : receiverPhone;

      // 🔥 STEP 1: CREATE ESCROW
      const res = await escrowService.createEscrow({
        receiverPhone: formattedPhone,
        amount: parsedAmount,
        description,
        pin,
      });
      // we assume backend returns the created escrow ID in res.id (adjust if different) insted of apply transactionId
      const escrowId = res.id;

      if (!escrowId) {
        toast.error('Failed to get escrow ID');
        return;
      }

      
      toast.success('Escrow created & released successfully 🎉');

      setShowPinModal(false);

      // 🔥 redirect directly (nta white screen)
      navigate('/', { replace: true });

    } catch (error: any) {
      console.error(error);
      toast.error(error?.message || 'Transaction failed');
    }
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
          <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
            <Shield className="w-6 h-6 text-purple-600" />
          </div>
          <div className="ml-4">
            <h1 className="text-2xl font-bold">Create Escrow</h1>
            <p className="text-gray-600">Secure payment with protection</p>
          </div>
        </div>

        {step === 1 && (
          <div className="space-y-4">
            <div className="bg-purple-50 border border-purple-200 rounded-lg p-4 flex items-start">
              <AlertCircle className="w-5 h-5 text-purple-600 mr-2 mt-0.5 flex-shrink-0" />
              <div className="text-sm text-purple-800">
                <p className="font-semibold mb-1">What is Escrow?</p>
                <p>
                  Escrow holds your payment securely until you confirm the service or goods
                  have been delivered. You can release the funds when satisfied, or cancel
                  to get a refund if conditions aren't met.
                </p>
              </div>
            </div>

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
              <p className="text-sm text-gray-500 mt-1">
                The person who will receive the funds after you release them
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
              <p className="text-sm text-gray-500 mt-1">
                Available: {balance?.balance || '0'} RWF
              </p>
              {parsedAmount > 0 && total > userBalance && (
                <p className="text-red-600 text-sm mt-1">
                  Insufficient balance (including fee)
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Description
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="input"
                placeholder="What is this payment for? (e.g., Freelance work, Product purchase)"
                rows={3}
              />
              <p className="text-sm text-gray-500 mt-1">
                Describe the conditions for releasing the payment
              </p>
            </div>

            <button
              onClick={() => setStep(2)}
              disabled={isDisabled}
              className="btn btn-primary w-full"
            >
              Continue
            </button>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-6">
            <div className="bg-gray-50 rounded-lg p-4 space-y-3">
              <h3 className="font-semibold text-gray-900 mb-3">Escrow Summary</h3>
              <div className="flex justify-between">
                <span className="text-gray-600">Recipient</span>
                <span className="font-semibold">{receiverPhone}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Amount</span>
                <span className="font-semibold">{parsedAmount} RWF</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Fee (1%)</span>
                <span className="font-semibold">{fee.toFixed(2)} RWF</span>
              </div>
              <div className="border-t pt-3 flex justify-between">
                <span className="font-semibold">Total</span>
                <span className="font-bold text-lg">{total.toFixed(2)} RWF</span>
              </div>
              {description && (
                <div className="border-t pt-3">
                  <span className="text-gray-600 block mb-1">Description</span>
                  <span className="font-semibold">{description}</span>
                </div>
              )}
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p className="text-sm text-blue-800">
                <strong>How it works:</strong>
              </p>
              <ol className="list-decimal list-inside text-sm text-blue-800 mt-2 space-y-1">
                <li>Funds will be held securely in escrow</li>
                <li>The recipient will be notified</li>
                <li>You can release funds when conditions are met</li>
                <li>Or cancel to get a refund if needed</li>
              </ol>
            </div>

            <div className="flex space-x-3">
              <button onClick={() => setStep(1)} className="btn btn-secondary flex-1">
                Back
              </button>
              <button
                onClick={() => setShowPinModal(true)}
                disabled={isDisabled}
                className="btn btn-primary flex-1"
              >
                Create Escrow
              </button>
            </div>
          </div>
        )}
      </div>

      <PINModal
        isOpen={showPinModal}
        onClose={() => setShowPinModal(false)}
        onSubmit={handlePinSubmit}
        loading={escrowMutation.isPending}
        // loading={loading}
      />
    </div>
  );
}
