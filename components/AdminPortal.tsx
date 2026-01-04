
import React, { useState } from 'react';
import { ADMIN_CREDENTIALS } from '../constants.tsx';
import { X, Lock, Mail, AlertCircle } from 'lucide-react';

interface AdminPortalProps {
  onLogin: () => void;
  onClose: () => void;
}

const AdminPortal: React.FC<AdminPortalProps> = ({ onLogin, onClose }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (email === ADMIN_CREDENTIALS.email && password === ADMIN_CREDENTIALS.password) {
      onLogin();
    } else {
      setError('Invalid credentials. Please try again.');
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm px-4">
      <div className="w-full max-w-md bg-[#161b22] border border-[#30363d] rounded-xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
        <div className="flex items-center justify-between p-6 border-b border-[#30363d]">
          <h3 className="text-xl font-bold text-white">Admin Authentication</h3>
          <button onClick={onClose} className="text-[#8b949e] hover:text-white transition-colors">
            <X className="w-6 h-6" />
          </button>
        </div>
        
        <form onSubmit={handleLogin} className="p-8 space-y-6">
          {error && (
            <div className="flex items-center space-x-2 p-3 bg-red-900/20 border border-red-900/50 text-red-400 text-sm rounded-lg">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div className="space-y-2">
            <label className="block text-sm font-medium text-[#8b949e]">Email Address</label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#484f58]" />
              <input 
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                className="w-full bg-[#0d1117] border border-[#30363d] rounded-lg py-2.5 pl-10 pr-4 text-white focus:outline-none focus:ring-2 focus:ring-[#58a6ff]/50 focus:border-[#58a6ff] transition-all"
                placeholder="atik@gmail.com"
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-medium text-[#8b949e]">Master Password</label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#484f58]" />
              <input 
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                className="w-full bg-[#0d1117] border border-[#30363d] rounded-lg py-2.5 pl-10 pr-4 text-white focus:outline-none focus:ring-2 focus:ring-[#58a6ff]/50 focus:border-[#58a6ff] transition-all"
                placeholder="••••••••"
                required
              />
            </div>
          </div>

          <button 
            type="submit"
            className="w-full py-3 bg-[#238636] hover:bg-[#2ea043] text-white font-bold rounded-lg transition-all shadow-lg active:scale-[0.98]"
          >
            Access Curriculum Dashboard
          </button>
        </form>

        <div className="px-8 pb-8 text-center">
          <p className="text-xs text-[#484f58]">
            This portal is for educational management only. All curriculum changes are persisted locally for the current session environment.
          </p>
        </div>
      </div>
    </div>
  );
};

export default AdminPortal;
