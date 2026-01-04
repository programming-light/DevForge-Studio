
import React from 'react';
import { Subject } from '../types';
import * as LucideIcons from 'lucide-react';
import { 
  Plus, Trash2, ArrowRight, Github, Briefcase, ExternalLink, 
  ShieldCheck, Heart, Youtube, Facebook, MessageSquare, Send,
  Sparkles, BookOpen, Terminal, GitBranch, HeartHandshake
} from 'lucide-react';

interface DashboardProps {
  subjects: Subject[];
  onSelectSubject: (id: string) => void;
  isAdmin: boolean;
  onAddSubject: () => void;
  onDeleteSubject: (id: string) => void;
}

const Dashboard: React.FC<DashboardProps> = ({ subjects, onSelectSubject, isAdmin, onAddSubject, onDeleteSubject }) => {
  const socialLinks = [
    { name: 'YouTube', icon: Youtube, url: 'https://www.youtube.com/@NeshakhorProgrammer', color: '#ff0000', label: 'Watch Tutorials' },
    { name: 'Facebook', icon: Facebook, url: 'https://www.facebook.com/groups/neshakhorprogrammerfamily/', color: '#1877f2', label: 'Join Community' },
    { name: 'Discord', icon: MessageSquare, url: 'https://discord.com/invite/ybdsjwq35K', color: '#5865f2', label: 'Chat with Devs' },
    { name: 'Telegram', icon: Send, url: 'https://t.me/addlist/7N3OxwMPslxkMDc1', color: '#0088cc', label: 'Stay Updated' },
  ];

  const GITHUB_REPO = "https://github.com/programming-light/DevForge-Studio";

  return (
    <div className="flex-1 overflow-y-auto bg-[#0d1117] p-6 md:p-16 lg:p-24 scroll-smooth">
      <div className="max-w-7xl mx-auto">
        {/* Hero Section */}
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-16 md:mb-24 space-y-10 md:space-y-0">
          <div className="max-w-3xl text-center md:text-left">
            <div className="flex flex-wrap justify-center md:justify-start gap-4 mb-10">
              <div className="inline-flex items-center space-x-2.5 px-5 py-2.5 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-[10px] font-black uppercase tracking-[0.3em] shadow-[0_0_20px_rgba(59,130,246,0.15)] backdrop-blur-md">
                <Terminal className="w-4 h-4 shrink-0" />
                <span className="whitespace-nowrap">Professional Development Suite</span>
              </div>
              <div className="inline-flex items-center space-x-2.5 px-5 py-2.5 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-[10px] font-black uppercase tracking-[0.3em] shadow-[0_0_20px_rgba(99,102,241,0.15)] backdrop-blur-md">
                <Sparkles className="w-4 h-4 shrink-0" />
                <span className="whitespace-nowrap">Standard Mastery Platform</span>
              </div>
            </div>
            <h1 className="text-5xl md:text-7xl lg:text-8xl font-black text-white tracking-tighter mb-8 leading-[1.1]">
              DevForge <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-500">Studio</span>
            </h1>
            <p className="text-[#a1a1aa] text-lg md:text-xl font-medium leading-relaxed max-w-2xl mx-auto md:mx-0">
              The premier ecosystem for software engineering. Forge scalable applications and master technical architecture with <span className="text-white font-bold underline decoration-blue-500 underline-offset-8 decoration-2">Programming Light</span>. 
            </p>
          </div>
          {isAdmin && (
            <button 
              onClick={onAddSubject}
              className="flex items-center space-x-3 px-8 py-4 md:px-10 md:py-5 bg-[#238636] hover:bg-[#2ea043] text-white rounded-3xl font-black uppercase tracking-widest text-[10px] md:text-xs transition-all shadow-[0_20px_50px_-15px_rgba(35,134,54,0.4)] active:scale-95"
            >
              <Plus className="w-5 h-5" />
              <span>Create Module</span>
            </button>
          )}
        </div>

        {/* Subjects Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 md:gap-12 mb-32">
          {subjects.map((subject) => {
            const IconComponent = (LucideIcons as any)[subject.icon] || LucideIcons.FileCode;
            return (
              <div 
                key={subject.id}
                onClick={() => onSelectSubject(subject.id)}
                className="group relative bg-[#161b22] border border-[#30363d] rounded-[2.5rem] p-10 md:p-12 cursor-pointer hover:border-[#58a6ff] hover:bg-[#1c2128] transition-all flex flex-col h-full shadow-2xl hover:-translate-y-4"
              >
                <div className="mb-10 md:mb-12 flex items-center justify-between">
                  <div 
                    className="p-6 md:p-7 rounded-[1.5rem] md:rounded-[2rem] group-hover:rotate-6 group-hover:scale-110 transition-all shadow-[0_20px_40px_-10px_rgba(0,0,0,0.6)]" 
                    style={{ backgroundColor: `${subject.color}25`, color: subject.color }}
                  >
                    <IconComponent className="w-10 h-10 md:w-14 md:h-14" />
                  </div>
                  {isAdmin && (
                    <button 
                      onClick={(e) => { e.stopPropagation(); onDeleteSubject(subject.id); }}
                      className="p-3 md:p-4 text-[#484f58] hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity bg-[#0d1117] rounded-xl md:rounded-2xl"
                    >
                      <Trash2 className="w-5 h-5 md:w-6 md:h-6" />
                    </button>
                  )}
                </div>
                <h3 className="text-2xl md:text-3xl font-black text-white mb-4 md:mb-5 tracking-tight">{subject.title}</h3>
                <p className="text-base md:text-lg text-[#a1a1aa] leading-relaxed mb-10 md:mb-12 flex-1 font-medium">{subject.description}</p>
                <div className="mt-auto flex items-center text-[10px] font-black uppercase tracking-[0.3em] text-[#58a6ff] group-hover:translate-x-4 transition-transform">
                  Access Lab <ArrowRight className="w-4 h-4 ml-2" />
                </div>
              </div>
            );
          })}
        </div>

        {/* Founder & Brand Identity Section */}
        <div className="relative overflow-hidden bg-[#161b22] border border-[#30363d] rounded-[2.5rem] md:rounded-[3.5rem] p-8 md:p-20 shadow-2xl">
          <div className="absolute top-0 right-0 p-8 md:p-12 opacity-5 pointer-events-none">
            <Github className="w-48 h-48 md:w-64 md:h-64 text-white" />
          </div>
          
          <div className="relative z-10 flex flex-col lg:flex-row items-center lg:items-start gap-12 md:gap-16">
            <div className="shrink-0 relative group">
              <div className="absolute -inset-4 bg-gradient-to-tr from-blue-600 to-purple-600 rounded-full blur opacity-25 group-hover:opacity-50 transition duration-500"></div>
              <img 
                src="https://avatars.githubusercontent.com/u/82232344?v=4" 
                alt="Sayed Atiqur Rahman" 
                className="w-40 h-40 md:w-56 md:h-56 rounded-full border-4 border-[#30363d] object-cover relative transition-transform duration-500 group-hover:scale-105 shadow-2xl"
              />
              <div className="absolute bottom-2 right-2 md:bottom-4 md:right-4 bg-blue-600 p-2 md:p-3 rounded-xl md:rounded-2xl border-4 border-[#161b22] shadow-xl">
                <ShieldCheck className="w-5 h-5 md:w-6 md:h-6 text-white" />
              </div>
            </div>

            <div className="flex-1 text-center lg:text-left">
              <div className="inline-flex items-center space-x-2 text-blue-400 font-black uppercase tracking-[0.25em] text-[10px] mb-4">
                <Briefcase className="w-4 h-4" />
                <span>Founder and CEO</span>
              </div>
              <h2 className="text-4xl md:text-5xl font-black text-white mb-4 tracking-tight leading-tight">Sayed Atiqur Rahman</h2>
              <div className="mb-6">
                <p className="text-[#a1a1aa] text-lg md:text-xl font-medium leading-relaxed max-w-3xl">
                  Mid-level Full Stack Developer. Dedicated to providing the community with professional-grade learning tools and building scalable web ecosystems.
                </p>
                <div className="mt-8 p-6 md:p-10 bg-[#0d1117] border border-blue-500/30 rounded-[2.5rem] inline-block w-full max-w-2xl shadow-[0_10px_40px_-10px_rgba(59,130,246,0.3)] group transition-all hover:border-blue-500/50">
                  <div className="flex items-center space-x-3 mb-5">
                    <div className="w-3 h-3 rounded-full bg-blue-500 animate-pulse" />
                    <span className="text-blue-400 font-black text-[10px] uppercase tracking-[0.3em]">Open Source Announcement</span>
                  </div>
                  <p className="text-sm md:text-base text-[#e6edf3] font-bold leading-relaxed mb-8">
                    I am officially declaring this application as an <span className="text-blue-400 tracking-wider font-black uppercase text-xs">Open Source project</span>. 
                    Anyone is welcome to contribute, fix bugs, or request features. Let's build the future of DevForge Studio together!
                  </p>
                  <a 
                    href={GITHUB_REPO}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center space-x-4 px-8 py-4 bg-white text-[#0d1117] rounded-2xl font-black text-xs uppercase tracking-[0.2em] hover:bg-blue-400 hover:text-white transition-all shadow-2xl active:scale-95"
                  >
                    <GitBranch className="w-5 h-5" />
                    <span>Contribute on GitHub</span>
                    <ExternalLink className="w-4 h-4 opacity-50" />
                  </a>
                </div>
              </div>

              {/* GitHub Links */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-2xl mb-10 mt-10">
                <a 
                  href={GITHUB_REPO} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="flex items-center justify-between p-6 bg-[#0d1117] border border-[#30363d] rounded-2xl hover:border-[#58a6ff] hover:bg-[#1c2128] transition-all group shadow-2xl"
                >
                  <div className="flex items-center space-x-4">
                    <Github className="w-7 h-7 text-white group-hover:scale-110 transition-transform" />
                    <div className="text-left">
                      <p className="text-white font-black text-xs uppercase tracking-tight">DevForge Source</p>
                      <p className="text-[#8b949e] text-[10px] font-bold">Public Repository</p>
                    </div>
                  </div>
                  <ExternalLink className="w-4 h-4 text-[#484f58] group-hover:text-[#58a6ff] group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
                </a>

                <a 
                  href="https://github.com/NeshakhorProgrammer" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="flex items-center justify-between p-6 bg-[#0d1117] border border-[#30363d] rounded-2xl hover:border-[#58a6ff] hover:bg-[#1c2128] transition-all group shadow-2xl"
                >
                  <div className="flex items-center space-x-4">
                    <Github className="w-7 h-7 text-white group-hover:scale-110 transition-transform" />
                    <div className="text-left">
                      <p className="text-white font-black text-xs uppercase tracking-tight">Community Hub</p>
                      <p className="text-[#8b949e] text-[10px] font-bold">Neshakhor Programmer</p>
                    </div>
                  </div>
                  <ExternalLink className="w-4 h-4 text-[#484f58] group-hover:text-[#58a6ff] group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
                </a>
              </div>

              {/* Social Follow Links */}
              <div className="flex flex-wrap justify-center lg:justify-start gap-4">
                {socialLinks.map((social) => (
                  <a 
                    key={social.name}
                    href={social.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center space-x-3 px-6 py-4 bg-[#1c2128] border border-[#30363d] rounded-2xl hover:border-white transition-all group shadow-xl"
                    style={{ borderColor: `${social.color}40` }}
                  >
                    <social.icon className="w-6 h-6 transition-transform group-hover:scale-125" style={{ color: social.color }} />
                    <div className="text-left">
                      <p className="text-white font-black text-[10px] uppercase tracking-widest">{social.name}</p>
                      <p className="text-[#8b949e] text-[9px] font-bold uppercase">{social.label}</p>
                    </div>
                  </a>
                ))}
              </div>
            </div>
          </div>

          <div className="mt-20 pt-10 border-t border-[#30363d] flex flex-col md:flex-row justify-between items-center text-[#484f58] space-y-4 md:space-y-0">
            <div className="flex items-center space-x-4 text-[10px] font-black uppercase tracking-[0.3em]">
              <span>Crafted for Engineers</span>
              <Heart className="w-5 h-5 text-blue-500 fill-current animate-pulse" />
              <span>by Programming Light</span>
            </div>
            <div className="text-[10px] font-black uppercase tracking-[0.4em] opacity-50">© 2024 Neshakhor Programmer Group</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
