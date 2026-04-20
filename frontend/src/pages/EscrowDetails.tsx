import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { ArrowLeft, Shield, Clock, CheckCircle, XCircle, Loader2 } from 'lucide-react';
import StatusBadge from '../components/StatusBadge';
import PINModal from '../components/PINModal';
import { useState } from 'react';
import { escrowService } from '../services/escrowService';

export default function EscrowDetails() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [showPinModal, setShowPinModal] = useState(false);

  const { data: escrow, isLoading } = useQuery({
    queryKey: ['escrow', id],
    queryFn: () => escrowService.getEscrow(id!),
    enabled: !!id,
    // refetchInterval: (query) => {
    //   const escrow = query.state.data;
    //   return escrow?.status === 'HELD' ? 5000 : false;
    // },
    refetchInterval: false,

  });

  // const receiverId = escrow?.receiverId;

  const releaseMutation = useMutation({
    mutationFn: (pin: string) => escrowService.confirmEscrow(id!, pin),
    onSuccess: () => {
      toast.success('Funds released successfully');

      queryClient.invalidateQueries({ queryKey: ['escrow', id] });
      // if (action === 'release'){
      //   toast.success('Funds released successfully');
      // }
      setShowPinModal(false);

      // Auto redirect nyuma ya 3 sec
      setTimeout(() => {
        navigate('/', { replace: true });
      }, 1500);
    },

    onError: (error: any) => {
      toast.error(error?.message || 'Failed to release funds');
    },
  });

  //  we removed cancel mutation becouse in backend we
  //  have automatic cancellation.
 
  const handlePinSubmit = (pin: string) => {
    releaseMutation.mutate(pin);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-primary-600" />
      </div>
    );
  }

  if (!escrow) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-600">Escrow transaction not found</p>
        <button onClick={() => navigate('/')} className="btn btn-primary mt-4">
          Go Home
        </button>
      </div>
    );
  }

  // const currentUserPhone = localStorage.getItem('currentUserPhone') || '';

  // // Shyira condition ukoresheje escrow.transaction.senderPhone
  // const canRelease = escrow.status === 'HELD' && escrow.transaction.senderPhone === currentUserPhone;
  const normalize = (p: string) => p?.replace(/\D/g, '');

  const canRelease =
    escrow.status === 'HELD' &&
    normalize(escrow.transaction.senderPhone) ===
    normalize(localStorage.getItem('currentUserPhone') || '');

  const canCancel = escrow.status === 'HELD';

  return (
    <div className="max-w-2xl mx-auto px-4 pb-24">

      {/* HEADER */}
      <div className="flex items-center justify-between mb-6">
        <button
          onClick={() => navigate('/', { replace: true })}
          className="flex items-center text-gray-500 hover:text-gray-900 transition"
        >
          <ArrowLeft className="w-5 h-5 mr-2" />
          Home
        </button>

        <StatusBadge status={escrow.status} />
      </div>


      {/* MAIN CARD */}
      <div className="bg-white shadow-sm border rounded-2xl p-6 space-y-6">

        {/* TITLE SECTION */}
        <div className="flex items-center">
          <div className="w-14 h-14 bg-purple-100 rounded-full flex items-center justify-center">
            <Shield className="w-7 h-7 text-purple-600" />
          </div>

          <div className="ml-4">
            <h1 className="text-2xl font-bold">Escrow Transaction</h1>
            <p className="text-gray-500 text-sm">
              Secure & Protected Payment
            </p>
          </div>
        </div>


        {/* AMOUNT BIG DISPLAY */}
        <div className="text-center border-y py-6">
          <p className="text-sm text-gray-500 mb-1">Total Amount</p>
          <p className="text-3xl font-bold tracking-tight">
            {escrow.amount} RWF
          </p>
        </div>


        {/* TRANSACTION DETAILS */}
        <div className="space-y-4 text-sm">

          <div className="flex justify-between">
            <span className="text-gray-500">Transaction ID</span>
            <span className="font-mono">{escrow.id}</span>
          </div>

          <div className="flex justify-between">
            <span className="text-gray-500">Sender</span>
            <span className="font-semibold">{escrow.senderPhone}</span>
          </div>

          <div className="flex justify-between">
            <span className="text-gray-500">Receiver</span>
            <span className="font-semibold">{escrow.receiverPhone}</span>
          </div>

          {escrow.description && (
            <div className="flex justify-between">
              <span className="text-gray-500">Description</span>
              <span className="font-medium text-right max-w-xs">
                {escrow.description}
              </span>
            </div>
          )}

          <div className="flex justify-between">
            <span className="text-gray-500">Created At</span>
            <span>
              {new Date(escrow.createdAt ?? new Date().toISOString()).toLocaleString()}
            </span>
          </div>

        </div>


        {/* STATUS MESSAGE CARD */}
        <div
          className={`rounded-xl p-4 transition-all duration-300 ${escrow.status === 'HELD'
            ? 'bg-yellow-50 border border-yellow-200'
            : escrow.status === 'RELEASED'
              ? 'bg-green-50 border border-green-200'
              : 'bg-red-50 border border-red-200'
            }`}
        >
          <div className="flex items-start">

            {escrow.status === 'HELD' && (
              <Clock className="w-5 h-5 text-yellow-600 mr-3 mt-1" />
            )}
            {escrow.status === 'RELEASED' && (
              <CheckCircle className="w-5 h-5 text-green-600 mr-3 mt-1" />
            )}
            {escrow.status === 'CANCELLED' && (
              <XCircle className="w-5 h-5 text-red-600 mr-3 mt-1" />
            )}

            <div>
              <p className="font-semibold mb-1">
                {escrow.status === 'HELD' && 'Funds are securely held in escrow'}
                {escrow.status === 'RELEASED' && 'Funds have been released successfully'}
                {escrow.status === 'CANCELLED' && 'Transaction has been cancelled'}
              </p>

              <p className="text-sm opacity-80">
                {escrow.status === 'HELD' &&
                  'The sender can release funds when the agreement conditions are met.'}
                {escrow.status === 'RELEASED' &&
                  'The recipient has received the funds.'}
                {escrow.status === 'CANCELLED' &&
                  'Funds were returned to the sender.'}
              </p>
            </div>

          </div>
        </div>

      </div>


      {/* ACTION BAR (Sticky Bottom Professional Style) */}
      {(canRelease) && (
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t p-4 shadow-lg">
          <div className="max-w-2xl mx-auto flex space-x-3">
            {/* we removed cancer becouse in backend we have automatic cancellation */}


            {canRelease && (
              <button
                onClick={() => setShowPinModal(true)}
                disabled={releaseMutation.isPending}
                className="flex-1 bg-purple-600 text-white rounded-xl py-3 font-medium hover:bg-purple-700 transition disabled:opacity-50"
              >
                {releaseMutation.isPending ? 'Processing...' : 'Release Funds'}
              </button>
            )}

          </div>
        </div>
      )}


      {/* PIN MODAL */}
      <PINModal
        isOpen={showPinModal}
        onClose={() => {
          setShowPinModal(false);
        }}
        onSubmit={handlePinSubmit}
        loading={releaseMutation.isPending}
      />

    </div>
  );
}
