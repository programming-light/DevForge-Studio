
import React, { useState } from 'react';
import { AppMode } from '../types';
import { 
  BookOpen, Code2, ShieldCheck, LogOut, Github, Sparkles, 
  Users, Youtube, Facebook, 
  MessageSquare, Send, ChevronDown, Download, User
} from 'lucide-react';

interface NavbarProps {
  mode: AppMode;
  setMode: (mode: AppMode) => void;
  isAdmin: boolean;
  openAdminLogin: () => void;
  onLogout: () => void;
  activeSubjectId: string | null;
  onClearSubject: () => void;
  onDownload: () => void;
}

const Navbar: React.FC<NavbarProps> = ({ 
  mode, setMode, isAdmin, openAdminLogin, onLogout, activeSubjectId, onClearSubject, onDownload
}) => {
  const [showSocials, setShowSocials] = useState(false);

  const socials = [
    { name: 'DevForge Project', icon: Github, url: 'https://github.com/programming-light/DevForge-Studio', color: '#ffffff' },
    { name: 'YouTube', icon: Youtube, url: 'https://www.youtube.com/@NeshakhorProgrammer', color: '#ff0000' },
    { name: 'Facebook', icon: Facebook, url: 'https://www.facebook.com/groups/neshakhorprogrammerfamily/', color: '#1877f2' },
    { name: 'Discord', icon: MessageSquare, url: 'https://discord.com/invite/ybdsjwq35K', color: '#5865f2' },
    { name: 'Telegram', icon: Send, url: 'https://t.me/addlist/7N3OxwMPslxkMDc1', color: '#0088cc' },
  ];

  return (
    <nav className="h-14 border-b border-[#30363d] bg-[#161b22] flex items-center justify-between px-3 md:px-6 shrink-0 z-50">
      <div className="flex items-center space-x-2 md:space-x-6">
        <div className="flex items-center space-x-2 md:space-x-3 group cursor-pointer" onClick={() => { setMode(AppMode.ACADEMY); onClearSubject(); }}>
          <div className="p-1.5 bg-gradient-to-br from-blue-600 to-indigo-700 rounded-lg shadow-lg group-hover:scale-110 transition-transform shrink-0">
            <Code2 className="w-4 h-4 md:w-5 md:h-5 text-white" />
          </div>
          <div className="hidden xs:flex flex-col">
            <span className="font-black text-[11px] md:text-sm tracking-tighter text-white leading-none uppercase">DevForge</span>
            <span className="hidden md:flex text-[9px] text-[#8b949e] font-black uppercase tracking-widest items-center mt-1">
              Programming Light <Sparkles className="w-2 h-2 ml-1 text-blue-400" />
            </span>
          </div>
        </div>
        
        <div className="hidden sm:block h-6 w-px bg-[#30363d]" />

        <div className="flex items-center space-x-0.5 p-0.5 bg-[#0d1117] rounded-lg border border-[#30363d]">
          <button 
            onClick={() => setMode(AppMode.ACADEMY)}
            className={`flex items-center space-x-2 px-2.5 md:px-4 py-1.5 rounded-md transition-all ${
              mode === AppMode.ACADEMY ? 'bg-[#21262d] text-white shadow-sm' : 'text-[#8b949e] hover:text-white'
            }`}
          >
            <BookOpen className="w-3.5 h-3.5" />
            <span className="text-[10px] font-black uppercase tracking-widest hidden md:inline">Academy</span>
          </button>
          <button 
            onClick={() => setMode(AppMode.WORKSPACE) }
            className={`flex items-center space-x-2 px-2.5 md:px-4 py-1.5 rounded-md transition-all ${
              mode === AppMode.WORKSPACE ? 'bg-[#21262d] text-white shadow-sm' : 'text-[#8b949e] hover:text-white'
            }`}
          >
            <Code2 className="w-3.5 h-3.5" />
            <span className="text-[10px] font-black uppercase tracking-widest hidden md:inline">IDE</span>
          </button>
        </div>
      </div>

      <div className="flex items-center space-x-2 md:space-x-4">
        {mode === AppMode.WORKSPACE && (
          <button 
            onClick={onDownload}
            className="flex items-center space-x-2 px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-[10px] font-black uppercase tracking-widest transition-all shadow-lg active:scale-95 shrink-0"
          >
            <Download className="w-3.5 h-3.5" />
            <span className="hidden lg:inline">Export Project</span>
          </button>
        )}

        <div className="relative">
          <button 
            onClick={() => setShowSocials(!showSocials)}
            className="flex items-center space-x-2 px-2.5 py-1.5 bg-[#21262d] border border-[#30363d] rounded-lg text-[#8b949e] hover:text-white transition-all text-[10px] font-black uppercase"
          >
            <Users className="w-3.5 h-3.5" />
            <span className="hidden xl:inline">Community</span>
            <ChevronDown className={`w-3 h-3 transition-transform ${showSocials ? 'rotate-180' : ''}`} />
          </button>

          {showSocials && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setShowSocials(false)} />
              <div className="absolute right-0 mt-2 w-52 bg-[#161b22] border border-[#30363d] rounded-xl shadow-2xl py-2 z-20">
                {socials.map((social) => (
                  <a 
                    key={social.name}
                    href={social.url}
                    target="_blank"
                    className="flex items-center space-x-3 px-4 py-2 text-sm text-[#8b949e] hover:text-white hover:bg-[#1c2128] transition-colors"
                  >
                    <social.icon className="w-4 h-4" style={{ color: social.color }} />
                    <span className="font-medium text-[10px] uppercase tracking-wider">{social.name}</span>
                  </a>
                ))}
              </div>
            </>
          )}
        </div>

        <div className="hidden xs:block h-6 w-px bg-[#30363d]" />

        {isAdmin ? (
          <button 
            onClick={onLogout} 
            className="flex items-center space-x-2 px-2.5 py-1.5 bg-red-500/10 border border-red-500/20 text-red-400 hover:text-red-300 rounded-lg transition-all text-[10px] font-black uppercase"
          >
            <LogOut className="w-4 h-4" />
            <span className="hidden md:inline">Exit Portal</span>
          </button>
        ) : (
          <button 
            onClick={openAdminLogin} 
            className="flex items-center space-x-2 px-2.5 py-1.5 bg-[#21262d] border border-[#30363d] rounded-lg text-[#8b949e] hover:text-white transition-all text-[10px] font-black uppercase tracking-widest active:scale-95"
          >
            <ShieldCheck className="w-4 h-4" />
            <span className="hidden sm:inline">Admin</span>
          </button>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
