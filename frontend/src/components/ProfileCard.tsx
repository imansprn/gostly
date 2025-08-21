import React from 'react';
import { Profile } from '../types';

interface ProfileCardProps {
  profile: Profile;
  onEdit: (profile: Profile) => void;
  onDelete: (id: number) => void;
  onToggle: (id: number, shouldStart: boolean) => void;
}

const ProfileCard: React.FC<ProfileCardProps> = ({ profile, onEdit, onDelete, onToggle }) => {
  const { id, name, type, listen, remote, status } = profile;
  
  return (
    <div className="bg-white rounded-xl shadow-sm hover:shadow-md transition-all duration-200 border border-slate-200 overflow-hidden">
      {/* Header */}
      <div className="px-6 py-5 border-b border-slate-100">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-slate-900 mb-1">{name}</h3>
            <div className="flex items-center space-x-3">
              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                status === 'running' 
                  ? 'bg-green-100 text-green-800' 
                  : 'bg-slate-100 text-slate-600'
              }`}>
                <span className={`w-2 h-2 rounded-full mr-2 ${
                  status === 'running' ? 'bg-green-400' : 'bg-slate-400'
                }`}></span>
                {status === 'running' ? 'Running' : 'Stopped'}
              </span>
              <span className="text-xs text-slate-500">ID: {id}</span>
            </div>
          </div>
          
          <div className="flex items-center space-x-1">
            <button
              onClick={() => onEdit(profile)}
              className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-50 rounded-lg transition-colors duration-150"
              title="Edit Profile"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
            </button>
            <button
              onClick={() => onDelete(id)}
              className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors duration-150"
              title="Delete Profile"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </button>
          </div>
        </div>
      </div>
      
      {/* Content */}
      <div className="px-6 py-4">
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-slate-700">Protocol</span>
            <span className="text-sm text-slate-900 bg-slate-100 px-2 py-1 rounded-md font-mono">
              {type}
            </span>
          </div>
          
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-slate-700">Listen</span>
            <span className="text-sm text-slate-900 font-mono">{listen}</span>
          </div>
          
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-slate-700">Remote</span>
            <span className="text-sm text-slate-900 font-mono max-w-32 truncate" title={remote}>
              {remote}
            </span>
          </div>
        </div>
      </div>
      
      {/* Actions */}
      <div className="px-6 py-4 bg-slate-50 border-t border-slate-100">
        <button
          onClick={() => onToggle(id, status !== 'running')}
          className={`w-full py-2.5 px-4 rounded-lg font-medium transition-all duration-200 ${
            status === 'running'
              ? 'bg-red-500 hover:bg-red-600 text-white shadow-sm hover:shadow-md'
              : 'bg-slate-800 hover:bg-slate-700 text-white shadow-sm hover:shadow-md'
          }`}
        >
          {status === 'running' ? 'Stop Service' : 'Start Service'}
        </button>
      </div>
    </div>
  );
};

export default ProfileCard;