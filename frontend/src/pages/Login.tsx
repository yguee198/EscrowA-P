import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { authService } from '../services/authService';
import { useAuthStore } from '../store/authStore';
import { Lock, Phone } from 'lucide-react';
import { FaFacebookF } from 'react-icons/fa';
import { FcGoogle } from 'react-icons/fc';
import PhoneInput from "react-phone-input-2";
import "react-phone-input-2/lib/style.css";


export default function Login() {
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [remember, setRemember] = useState(true);

  const [showPassword, setShowPassword] = useState(false);
  const [timer, setTimer] = useState(0);
  const duration = 20;

  const navigate = useNavigate();
  const setAuth = useAuthStore((state) => state.setAuth);

  // ✅ normalize phone (IMPORTANT)
  const formatPhone = (phone: string) => {
    if (!phone) return "";

    // remove spaces
    let clean = phone.replace(/\s+/g, '');

    // add + if missing
    if (!clean.startsWith('+')) {
      clean = `+${clean}`;
    }

    return clean;
  };

  const loginMutation = useMutation({
    mutationFn: authService.login,
    onSuccess: (data) => {
      setAuth(data.token, data.user);
      toast.success('Login successful!');
      navigate('/');
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message || 'Login failed');
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const formattedPhone = formatPhone(phone);

    console.log("PHONE UI:", phone);
    console.log("PHONE FINAL:", formattedPhone);

    loginMutation.mutate({
      phone: formattedPhone,
      password,
    });
  };

  useEffect(() => {
    let interval: NodeJS.Timeout;

    if (showPassword && timer < duration) {
      interval = setInterval(() => {
        setTimer((prev) => prev + 1);
      }, 1000);
    }

    if (timer >= duration) {
      setShowPassword(false);
      setTimer(0);
    }

    return () => clearInterval(interval);
  }, [showPassword, timer]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-50 to-primary-100 px-4">

      {/* CARD */}
      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl p-8 mt-3">

        {/* HEADER */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-primary-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <Lock className="text-white w-8 h-8" />
          </div>

          <h1 className="text-2xl font-bold text-gray-900">Log in</h1>
          <p className="text-gray-500 text-sm mt-1">
            Welcome back! Please enter your details.
          </p>
        </div>

        {/* FORM */}
        <form onSubmit={handleSubmit} className="space-y-5">

          {/* PHONE */}
          <div>
            <div>
              <PhoneInput
                country={"rw"}
                value={phone}
                onChange={(value) => {
                  const formatted = value.startsWith("+") ? value : `+${value}`;
                  setPhone(formatted);
                }}
                enableSearch={false}
                disableSearchIcon={true}
                countryCodeEditable={false}

                inputProps={{
                  required: true,
                  name: "phone",
                  minLength:"12", 
                }}

                inputStyle={{
                  width: "100%",
                  height: "44px",
                  borderRadius: "8px",
                  border: "1px solid #d1d5db",
                  paddingLeft: "60px"
                }}

                buttonStyle={{
                  border: "1px solid #d1d5db",
                  borderRadius: "8px 0 0 8px",
                  backgroundColor: "white"
                }}

                containerStyle={{
                  width: "100%"
                }}
              />
            </div>
          </div>

          {/* PASSWORD */}
          <div>
            <div className="flex justify-between mb-2">
              <label className="text-sm text-gray-600">
                Password
              </label>

              <Link
                to="/forgot-password"
                className="text-sm text-primary-600 hover:underline"
              >
                Forgot password?
              </Link>
            </div>

            {/* <div className="relative">
              <Lock className="absolute left-3 top-3.5 w-4 h-4 text-gray-400" />

              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                className="w-full pl-10 pr-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:outline-none"
              />
            </div> */}

            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                className={`w-full pl-4 pr-16 py-2.5 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:outline-none transition
                  ${showPassword ? "border-green-400" : "border-gray-300"}`}
              />

              {/* LOCK TIMER BUTTON */}
              <button
                type="button"
                onClick={() => {
                  if (!showPassword) {
                    setShowPassword(true);
                    setTimer(0);
                  }
                }}
                className="absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 flex items-center justify-center"
              >
                <div className="relative w-9 h-9">
                  {/* Gray Ring */}
                  <svg className="absolute inset-0 w-full h-full -rotate-90">
                    <circle cx="18" cy="18" r="16" stroke="#e5e7eb" strokeWidth="3" fill="none" />
                  </svg>
                  {/* Green Progress */}
                  {showPassword && (
                    <svg className="absolute inset-0 w-full h-full -rotate-90">
                      <circle
                        cx="18" cy="18"
                        r="16"
                        stroke="#22c55e"
                        strokeWidth="3"
                        fill="none"
                        strokeDasharray={100}
                        strokeDashoffset={100 - (timer / duration) * 100}
                        strokeLinecap="round"
                      />
                    </svg>
                  )}
                  {/* Lock Icon */}
                  <div className={`absolute inset-0 flex items-center justify-center rounded-full transition
                    ${showPassword ? "bg-green-50" : "bg-gray-100 hover:bg-gray-200"}`}>
                    <Lock className={`w-4 h-4 ${showPassword ? "text-green-600" : "text-gray-500"}`} />
                  </div>
                </div>
              </button>
            </div>
          </div>

          {/* REMEMBER */}
          <div className="flex items-center justify-between text-sm">
            <label className="flex items-center gap-2 text-gray-600">
              <input
                type="checkbox"
                checked={remember}
                onChange={() => setRemember(!remember)}
                className="accent-primary-600"
              />
              Remember me
            </label>
          </div>

          {/* BUTTON */}
          <button
            type="submit"
            disabled={loginMutation.isPending}
            className="w-full bg-primary-600 hover:bg-primary-700 text-white py-2.5 rounded-lg font-medium transition"
          >
            {loginMutation.isPending ? 'Signing in...' : 'Log in'}
          </button>

          {/* DIVIDER */}
          <div className="flex items-center gap-3 my-4">
            <div className="flex-1 h-px bg-gray-300" />
            <span className="text-gray-400 text-sm">OR</span>
            <div className="flex-1 h-px bg-gray-300" />
          </div>

          {/* SOCIAL */}{/* SOCIAL LOGIN */}
          <div className="space-y-3">

            {/* Facebook Button */}
            <button
              type="button"
              className="w-full flex items-center justify-center gap-3 border border-gray-300 bg-white py-2.5 rounded-lg text-sm font-medium hover:bg-gray-50 transition"
            >
              <div className="w-6 h-6 bg-[#1877F2] rounded-full flex items-center justify-center">
                <FaFacebookF className="text-white text-xs" />
              </div>
              <span className="text-gray-700">Log in with Facebook</span>
            </button>

            {/* Google Button */}
            <button
              type="button"
              className="w-full flex items-center justify-center gap-3 border border-gray-300 bg-white py-2.5 rounded-lg text-sm font-medium hover:bg-gray-50 transition"
            >
              <FcGoogle className="text-xl" />
              <span className="text-gray-700">Log in with Google</span>
            </button>

          </div>

        </form>

        {/* FOOTER */}
        <p className="text-center text-sm text-gray-500 mt-6">
          Don’t have an account?{' '}
          <Link to="/register" className="text-primary-600 font-medium hover:underline">
            Sign up
          </Link>
        </p>

      </div>
    </div>
  );
}
