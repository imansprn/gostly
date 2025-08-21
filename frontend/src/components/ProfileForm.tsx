import React, { useState, useEffect } from 'react';
import { Profile } from '../types';

interface ProfileFormProps {
  profile?: Profile;
  onSubmit: (profile: Omit<Profile, 'id' | 'status'> & { id?: number }) => void;
  onCancel: () => void;
}

const defaultProfile = {
  name: '',
  type: 'forward',
  listen: ':1080',
  remote: '',
  username: '',
  password: ''
};

const ProfileForm: React.FC<ProfileFormProps> = ({ profile, onSubmit, onCancel }) => {
  const [formData, setFormData] = useState(profile || defaultProfile);
  const [errors, setErrors] = useState<Record<string, string>>({});
  
  useEffect(() => {
    if (profile) {
      setFormData(profile);
    } else {
      setFormData(defaultProfile);
    }
  }, [profile]);
  
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Clear error when field is edited
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };
  
  const validate = () => {
    const newErrors: Record<string, string> = {};
    
    if (!formData.name.trim()) newErrors.name = 'Name is required';
    if (!formData.listen.trim()) newErrors.listen = 'Listen address is required';
    if (!formData.remote.trim()) newErrors.remote = 'Remote address is required';
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (validate()) {
      const submitData = { ...formData };
      onSubmit(submitData);
    }
  };
  
  return (
    <div className="bg-white rounded-xl shadow-lg border border-slate-200 max-w-2xl mx-auto">
      <div className="px-8 py-6 border-b border-slate-100">
        <h2 className="text-2xl font-light text-slate-900">
          {profile ? 'Edit Profile' : 'Create New Profile'}
        </h2>
        <p className="text-slate-600 mt-1">
          {profile ? 'Update your proxy profile settings' : 'Configure a new GOST proxy profile'}
        </p>
      </div>
      
      <form onSubmit={handleSubmit} className="px-8 py-6">
        <div className="space-y-6">
          {/* Profile Name */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2" htmlFor="name">
              Profile Name
            </label>
            <input
              type="text"
              id="name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-slate-200 focus:border-slate-300 transition-colors duration-200 ${
                errors.name ? 'border-red-300 focus:ring-red-200 focus:border-red-400' : 'border-slate-300'
              }`}
              placeholder="My Proxy Server"
            />
            {errors.name && <p className="text-red-500 text-sm mt-2">{errors.name}</p>}
          </div>
          
          {/* Protocol Type */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2" htmlFor="type">
              Protocol Type
            </label>
            <select
              id="type"
              name="type"
              value={formData.type}
              onChange={handleChange}
              className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-200 focus:border-slate-300 transition-colors duration-200"
            >
              <option value="forward">Forward Proxy (SOCKS5)</option>
              <option value="reverse">Reverse Proxy (TCP)</option>
              <option value="http">HTTP Proxy</option>
              <option value="tcp">TCP Forwarding</option>
              <option value="udp">UDP Forwarding</option>
              <option value="ss">Shadowsocks</option>
            </select>
          </div>
          
          {/* Listen Address */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2" htmlFor="listen">
              Listen Address
            </label>
            <input
              type="text"
              id="listen"
              name="listen"
              value={formData.listen}
              onChange={handleChange}
              className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-slate-200 focus:border-slate-300 transition-colors duration-200 ${
                errors.listen ? 'border-red-300 focus:ring-red-200 focus:border-red-400' : 'border-slate-300'
              }`}
              placeholder=":1080 or 127.0.0.1:1080"
            />
            {errors.listen && <p className="text-red-500 text-sm mt-2">{errors.listen}</p>}
          </div>
          
          {/* Remote Address */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2" htmlFor="remote">
              Remote Address
            </label>
            <input
              type="text"
              id="remote"
              name="remote"
              value={formData.remote}
              onChange={handleChange}
              className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-slate-200 focus:border-slate-300 transition-colors duration-200 ${
                errors.remote ? 'border-red-300 focus:ring-red-200 focus:border-red-400' : 'border-slate-300'
              }`}
              placeholder="example.com:1080 or 192.168.1.1:1080"
            />
            {errors.remote && <p className="text-red-500 text-sm mt-2">{errors.remote}</p>}
          </div>
          
          {/* Username */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2" htmlFor="username">
              Username <span className="text-slate-400 font-normal">(Optional)</span>
            </label>
            <input
              type="text"
              id="username"
              name="username"
              value={formData.username}
              onChange={handleChange}
              className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-200 focus:border-slate-300 transition-colors duration-200"
              placeholder="Username for authentication"
            />
          </div>
          
          {/* Password */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2" htmlFor="password">
              Password <span className="text-slate-400 font-normal">(Optional)</span>
            </label>
            <input
              type="password"
              id="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-200 focus:border-slate-300 transition-colors duration-200"
              placeholder="Password for authentication"
            />
          </div>
        </div>
        
        {/* Form Actions */}
        <div className="flex items-center justify-end space-x-4 pt-6 border-t border-slate-100">
          <button
            type="button"
            onClick={onCancel}
            className="px-6 py-2.5 border border-slate-300 text-slate-700 font-medium rounded-lg hover:bg-slate-50 transition-colors duration-200"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="px-6 py-2.5 bg-slate-800 hover:bg-slate-700 text-white font-medium rounded-lg transition-colors duration-200 shadow-sm hover:shadow-md"
          >
            {profile ? 'Update Profile' : 'Create Profile'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default ProfileForm;