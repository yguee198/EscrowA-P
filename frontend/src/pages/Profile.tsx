import { useState, useRef } from 'react';
import { useAuthStore } from '../store/authStore';

export default function Profile() {
  const { user } = useAuthStore();

  const [fullName, setFullName] = useState(user?.fullName || '');
  const [image, setImage] = useState(user?.profilePicture || '');

  const fileRef = useRef<HTMLInputElement | null>(null);

  const handleImage = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImage(URL.createObjectURL(file));
    }
  };

  const handleSave = () => {
    console.log({ fullName, image });
    // later → send to backend
  };

  return (
    <div className="max-w-2xl mx-auto">
      <h2 className="text-2xl font-bold mb-6">Profile</h2>

      <div className="bg-white p-6 rounded-2xl shadow space-y-5">

        {/* IMAGE */}
        <div className="flex items-center gap-4">
          <div
            onClick={() => fileRef.current?.click()}
            className="w-20 h-20 rounded-full overflow-hidden border-2 border-green-400 cursor-pointer"
          >
            <img
              src={image || 'https://via.placeholder.com/150'}
              className="w-full h-full object-cover"
            />
          </div>

          <button
            onClick={() => fileRef.current?.click()}
            className="text-sm text-primary-600"
          >
            Change Photo
          </button>

          <input
            type="file"
            ref={fileRef}
            onChange={handleImage}
            className="hidden"
          />
        </div>

        {/* NAME */}
        <input
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
          placeholder="Full name"
          className="w-full border p-2 rounded-lg"
        />

        {/* PHONE (readonly) */}
        <input
          value={user?.phone}
          disabled
          // placeholder ="Phone number"
          className="w-full border p-2 rounded-lg bg-gray-100"
        />

        <button
          onClick={handleSave}
          className="w-full bg-primary-600 text-white py-2 rounded-lg"
        >
          Save Changes
        </button>
      </div>
    </div>
  );
}