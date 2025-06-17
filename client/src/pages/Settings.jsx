import React, { useState, useEffect } from 'react';
import api from '../services/api';

const Settings = () => {
  const [profile, setProfile] = useState({
    email: '',
    user_timezone: '',
    profile_picture_url: '',
  });
  const [message, setMessage] = useState('');

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const response = await api.get('/auth/me/');
        setProfile(response.data);
      } catch (error) {
        console.error('Error fetching profile:', error);
      }
    };
    fetchProfile();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setProfile((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.patch('/auth/update_profile/', profile);
      setMessage('Profile updated successfully!');
    } catch (error) {
      setMessage('Error updating profile.');
      console.error('Error updating profile:', error);
    }
  };

  return (
    <div className="p-6 bg-gray-100 min-h-screen">
      <h1 className="text-3xl font-bold text-gray-800 mb-6">Settings</h1>
      <form onSubmit={handleSubmit} className="bg-white shadow-lg rounded-lg p-6 max-w-md">
        <div className="mb-4">
          <label className="block text-gray-700 mb-1">Email</label>
          <input
            type="email"
            name="email"
            value={profile.email}
            onChange={handleChange}
            className="w-full border border-gray-300 rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            disabled
          />
        </div>
        <div className="mb-4">
          <label className="block text-gray-700 mb-1">Timezone</label>
          <input
            type="text"
            name="user_timezone"
            value={profile.user_timezone}
            onChange={handleChange}
            className="w-full border border-gray-300 rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>
        <div className="mb-4">
          <label className="block text-gray-700 mb-1">Profile Picture URL</label>
          <input
            type="url"
            name="profile_picture_url"
            value={profile.profile_picture_url}
            onChange={handleChange}
            className="w-full border border-gray-300 rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>
        <button
          type="submit"
          className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700"
        >
          Save Changes
        </button>
        {message && <p className="mt-4 text-gray-600">{message}</p>}
      </form>
    </div>
  );
};

export default Settings;