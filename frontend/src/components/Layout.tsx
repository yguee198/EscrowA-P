import { Outlet, Link, useLocation } from 'react-router-dom';
import { Home, Send, Download, LogOut } from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import { useNavigate } from 'react-router-dom';
import { useState } from 'react';

export default function Layout() {
  const location = useLocation();
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();
  const [openProfile, setOpenProfile] = useState(false);

  const navItems = [
    { path: '/', icon: Home, label: 'Home' },
    { path: '/send', icon: Send, label: 'Send' },
    { path: '/withdraw', icon: Download, label: 'Withdraw' },
  ];

  const handleLogout = () => {
    if (confirm("Are you sure you want to logout?")) {
      logout();
    }
  };
  
  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <h1 className="text-xl font-bold text-primary-600">EscrowPay</h1>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-600">{user?.phone}</span>
              <div className="relative">
                <div
                  onClick={() => setOpenProfile(!openProfile)}
                  className="w-3 h-3 rounded-full cursor-pointer hover:bg-green-400/30 transition"
                ></div>

                {/* PROFILE PANEL */}
                {openProfile && (
                  <div className="absolute right-0 mt-3 w-56 bg-white shadow-lg rounded-xl p-4 z-50">

                    <p className="font-semibold">{user?.fullName || 'User'}</p>
                    <p className="text-xs text-gray-500">{user?.phone}</p>

                    <button
                      onClick={() => navigate('/profile')}
                      className="mt-3 text-sm text-primary-600 hover:none"
                    >
                      Open Profile
                    </button>
                  </div>
                )}
              </div>

              <button
                onClick={logout}
                className="text-gray-600 hover:text-gray-900"
              >
                <LogOut className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Outlet />
      </main>

      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 md:hidden">
        <div className="flex justify-around">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex flex-col items-center py-3 px-6 ${isActive ? 'text-primary-600' : 'text-gray-600'
                  }`}
              >
                <Icon className="w-6 h-6" />
                <span className="text-xs mt-1">{item.label}</span>
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}