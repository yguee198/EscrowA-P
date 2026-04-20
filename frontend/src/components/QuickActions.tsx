import { Link } from 'react-router-dom';
import { Send, Download, Shield, Plus, Wallet } from 'lucide-react';

export default function QuickActions() {
  const actions = [
    { icon: Send, label: 'Send Money', path: '/send', color: 'bg-blue-500' },
    { icon: Plus, label: 'Request', path: '/request', color: 'bg-green-500' },
    { icon: Shield, label: 'Escrow', path: '/escrow/create', color: 'bg-purple-500' },
    { icon: Download, label: 'Withdraw', path: '/withdraw', color: 'bg-orange-500' },
     { icon: Wallet, label: 'Add Fund', path: '/deposit', color: 'bg-emerald-500' },
  ];

  return (
    <div className="card">
      <h2 className="text-lg font-semibold mb-4">Quick Actions</h2>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {actions.map((action) => {
          const Icon = action.icon;
          return (
            <Link
              key={action.path}
              to={action.path}
              className="flex flex-col items-center p-4 rounded-lg hover:bg-gray-50 transition"
            >
              <div className={`w-12 h-12 ${action.color} rounded-full flex items-center justify-center mb-2`}>
                <Icon className="w-6 h-6 text-white" />
              </div>
              <span className="text-sm font-medium text-gray-700">{action.label}</span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}