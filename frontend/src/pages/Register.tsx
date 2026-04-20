import { useState, ChangeEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { authService } from '../services/authService';
import { useAuthStore } from '../store/authStore';
import PhoneInput from 'react-phone-input-2';
import 'react-phone-input-2/lib/style.css';
import { UserPlus, Lock, Phone, Mail, Camera } from 'lucide-react';


export default function Register() {
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [pin, setPin] = useState('');
  const [nid, setNid] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [profileImage, setProfileImage] = useState<File | undefined>(undefined);


  const navigate = useNavigate();
  const setAuth = useAuthStore((state) => state.setAuth);
  const cleanNid = nid.replace(/\s/g, '');

  const registerMutation = useMutation({
    mutationFn: authService.register,
    onSuccess: (data) => {
      setAuth(data.token, data.user);
      toast.success('Registration successful!');
      navigate('/');
    },
  });


  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const cleanedPhone = phone.replace(/\s/g, '');

    if (password !== confirmPassword) return toast.error('Passwords do not match');
    if (pin !== confirmPin) return toast.error('PINs do not match');
    if (!/^\d{4}$/.test(pin)) return toast.error('PIN must be 4 digits');
   
    // those function have some issues as well!.
    if (!/^\+[1-9]\d{7,14}$/.test(cleanedPhone))
      return toast.error('Phone must be in international format (E.164)');

    if (!/^\d{16}$/.test(cleanNid)) {
      return toast.error('NID must be exactly 16 digits');

    }

    registerMutation.mutate({ phone: cleanedPhone, email: email || undefined, password, pin, nid: cleanNid, profileImage });
  };

  const handleImageChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setProfileImage(e.target.files[0]);
    }
  };

  return (

    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-[#d9eaee] to-[#cfd6ec] px-4 py-8">

      {/* HEADER */}
      <div className="text-center mb-10">
        <h1 className="text-3xl font-bold text-gray-800">Escrow-PayTrust</h1>
        <p className="text-gray-500 mt-2 text-sm">
          Secure Pro Payment Platform
        </p>
      </div>

      {/* CARD */}
      <div className="w-full max-w-md bg-white rounded-2xl border border-gray-200 shadow-lg p-8">

        {/* PROFILE IMAGE */}
        <div className="flex justify-center mb-8">
          <div className="relative">
            <div className="w-24 h-24 rounded-full border-4 border-white shadow-md overflow-hidden bg-gray-100 flex items-center justify-center">
              {profileImage ? (
                <img
                  src={URL.createObjectURL(profileImage)}
                  alt="Profile"
                  className="w-full h-full object-cover"
                />
              ) : (
                <UserPlus className="w-10 h-10 text-gray-400" />
              )}
            </div>

            {/* Upload Button */}
            <label className="absolute bottom-0 right-0 bg-primary-600 hover:bg-primary-700 p-2 rounded-full cursor-pointer shadow-md transition">
              <Camera className="w-4 h-4 text-white" />
              <input
                type="file"
                accept="image/*"
                onChange={handleImageChange}
                hidden
              />
            </label>
          </div>
        </div>

        {/* TITLE */}
        <div className="text-center mb-8">
          <h2 className="text-2xl font-semibold text-gray-800">
            Create Account
          </h2>
          <p className="text-sm text-gray-500 mt-1">
            Open your secure account in seconds
          </p>
        </div>

        {/* FORM */}
        <form onSubmit={handleSubmit} className="space-y-5">

          {/* INPUTS */}
          {[
            { value: phone, set: setPhone, placeholder: "Phone Number *", type: "tel", isPhone: true },
            { icon: <Mail size={18} />, value: email, set: setEmail, placeholder: "Email (Optional)", type: "email" },
            { icon: <Lock size={18} />, value: password, set: setPassword, placeholder: "Password *", type: "password" },
            { icon: <Lock size={18} />, value: confirmPassword, set: setConfirmPassword, placeholder: "Confirm Password *", type: "password" },
            { icon: <UserPlus size={18} />, value: nid, set: setNid, placeholder: "National ID *", type: "text" }
          ].map((field, index) => (
            <div
              key={index}
              className="flex items-center border border-gray-300 rounded-lg px-3 py-3 focus-within:ring-2 focus-within:ring-blue-500 transition"
            >
              {field.isPhone ? (
                <>
                  <PhoneInput
                    country={'rw'} // default country
                    value={phone}
                    onChange={(value) => {
                      const formatted = value.startsWith('+') ? value : '+' + value;
                      setPhone(formatted);
                    }}
                    placeholder="Enter your phone number"
                    inputStyle={{ width: '100%', height: '24px', border: 'none', outline: 'none', fontSize: '0.875rem', paddingLeft: '40px', }}
                    buttonStyle={{
                      border: 'none',
                      backgroundColor: 'transparent',
                    }}
                    containerStyle={{
                      width: '100%',
                    }}
                    inputProps={{ required: true }}
                  />
                </>
              ) : (
                <>
                  <div className="text-gray-400 mr-3">
                    {field.icon}
                  </div>

                  <input
                    type={field.type}
                    value={field.value}
                    onChange={(e) => {
                      if (field.placeholder === "National ID *") {
                        let value = e.target.value.replace(/\D/g, '').slice(0, 16);
                        const formatted = value.replace(/(\d{4})(?=\d)/g, '$1 ');
                        field.set(formatted);
                      } else {
                        field.set(e.target.value);
                      }
                    }}
                    placeholder={field.placeholder}
                    required={field.placeholder.includes("*")}
                    maxLength={field.placeholder === "National ID *" ? 19 : undefined} // 16 digits + 3 spaces
                    className="w-full outline-none text-sm tracking-widest"
                  />
                </>
              )}
            </div>
          ))}

          {/* PIN SECTION */}
          <div className="pt-4 border-t border-gray-100">
            <p className="text-center text-sm text-gray-500 mb-4">
              Create a 4-digit transaction PIN
            </p>

            <div className="grid grid-cols-2 gap-4">
              {[{ value: pin, set: setPin, placeholder: "PIN *" },
              { value: confirmPin, set: setConfirmPin, placeholder: "Confirm PIN *" }
              ].map((field, index) => (
                <div
                  key={index}
                  className="flex items-center border border-gray-300 rounded-lg px-3 py-3 focus-within:ring-2 focus-within:ring-blue-500 transition"
                >
                  <Lock size={18} className="text-gray-400 mr-3" />

                  <input
                    type="password"
                    value={field.value}
                    onChange={(e) => field.set(e.target.value)}
                    placeholder={field.placeholder}
                    maxLength={4}
                    required
                    className="w-full text-center tracking-widest outline-none text-sm"
                  />
                </div>
              ))}
            </div>
          </div>

          {/* SUBMIT BUTTON */}
          <button
            type="submit"
            disabled={registerMutation.isPending}
            className="w-full mt-6 py-3 rounded-md text-white font-semibold bg-gradient-to-r from-primary-600 to-primary-700 hover:from-primary-700 hover:to-primary-600 transition shadow-lg"
          >
            {registerMutation.isPending ? "Creating..." : "Create Account"}
          </button>

        </form>

        {/* FOOTER */}
        <p className="text-center text-sm text-gray-500 mt-6">
          Already have an account?{" "}
          <Link
            to="/login"
            className="text-primary-600 font-medium hover:underline"
          >
            Sign in
          </Link>
        </p>

      </div>
    </div>

  );
}
