import { useState, useRef, useEffect } from 'react';
import { X, Lock } from 'lucide-react';

interface PINModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (pin: string) => void;
  loading?: boolean;
}

export default function PINModal({ isOpen, onClose, onSubmit, loading }: PINModalProps) {
  const [pin, setPin] = useState(['', '', '', '']);
  const inputRefs = [
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
  ];

  useEffect(() => {
    if (isOpen) {
      inputRefs[0].current?.focus();
    }
  }, [isOpen]);

  const handleChange = (index: number, value: string) => {
    if (value.length > 1) return;
    if (!/^\d*$/.test(value)) return;

    const newPin = [...pin];
    newPin[index] = value;
    setPin(newPin);

    if (value && index < 3) {
      inputRefs[index + 1].current?.focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !pin[index] && index > 0) {
      inputRefs[index - 1].current?.focus();
    }
  };

  const handleSubmit = () => {
    const fullPin = pin.join('');
    if (fullPin.length === 4) {
      onSubmit(fullPin);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl p-6 max-w-sm w-full mx-4">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center">
            <Lock className="w-6 h-6 text-primary-600 mr-2" />
            <h2 className="text-xl font-bold">Enter PIN</h2>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="w-6 h-6" />
          </button>
        </div>

        <p className="text-gray-600 mb-6 text-center">
          Enter your 4-digit PIN to confirm this transaction
        </p>

        <div className="flex justify-center space-x-4 mb-6">
          {pin.map((digit, index) => (
            <input
              key={index}
              ref={inputRefs[index]}
              type="password"
              maxLength={1}
              value={digit}
              onChange={(e) => handleChange(index, e.target.value)}
              onKeyDown={(e) => handleKeyDown(index, e)}
              className="w-14 h-14 text-center text-2xl font-bold border-2 border-gray-300 rounded-lg focus:border-primary-600 focus:outline-none"
            />
          ))}
        </div>

        <button
          onClick={handleSubmit}
          disabled={pin.join('').length !== 4 || loading}
          className="btn btn-primary w-full"
        >
          {loading ? 'Processing...' : 'Confirm'}
        </button>
      </div>
    </div>
  );
}