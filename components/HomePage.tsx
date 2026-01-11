import React from 'react';
import { BookOpen, Code, GraduationCap, FolderOpen, Github, Globe } from 'lucide-react';

const HomePage: React.FC = () => {
  return (
    <div className="flex flex-col items-center justify-center h-full bg-[#0d1117] text-[#c9d1d9] p-8 overflow-y-auto">
      <div className="max-w-4xl w-full">
        <div className="text-center mb-12">
          <h1 className="text-5xl font-bold mb-4 bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">
            DevForge Studio
          </h1>
          <p className="text-xl text-[#8b949e] max-w-2xl mx-auto">
            Your all-in-one development environment for learning and building web applications
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
          <div className="bg-[#161b22] rounded-xl p-6 border border-[#30363d] hover:border-[#8b949e]/50 transition-all">
            <div className="flex items-center mb-4">
              <div className="bg-blue-500/10 p-3 rounded-lg mr-4">
                <GraduationCap className="w-6 h-6 text-blue-400" />
              </div>
              <h2 className="text-xl font-semibold">Learning Academy</h2>
            </div>
            <p className="text-[#8b949e] mb-4">
              Interactive lessons to learn HTML, CSS, JavaScript, and Python with hands-on exercises
            </p>
            <button 
              onClick={() => window.location.hash = '#/academy'}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
            >
              Start Learning
            </button>
          </div>

          <div className="bg-[#161b22] rounded-xl p-6 border border-[#30363d] hover:border-[#8b949e]/50 transition-all">
            <div className="flex items-center mb-4">
              <div className="bg-green-500/10 p-3 rounded-lg mr-4">
                <Code className="w-6 h-6 text-green-400" />
              </div>
              <h2 className="text-xl font-semibold">Workspace</h2>
            </div>
            <p className="text-[#8b949e] mb-4">
              Full-featured code editor with live preview for building your own projects
            </p>
            <button 
              onClick={() => window.location.hash = '#/workspace'}
              className="px-4 py-2 bg-green-600 hover:bg-green-700 rounded-lg transition-colors"
            >
              Open Workspace
            </button>
          </div>
        </div>

        <div className="bg-[#161b22] rounded-xl p-8 border border-[#30363d] mb-8">
          <h2 className="text-2xl font-semibold mb-6 text-center">What You Can Do Here</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="flex justify-center mb-3">
                <FolderOpen className="w-10 h-10 text-yellow-400" />
              </div>
              <h3 className="text-lg font-medium mb-2">Project Management</h3>
              <p className="text-[#8b949e]">Create, organize, and manage your coding projects with ease</p>
            </div>
            <div className="text-center">
              <div className="flex justify-center mb-3">
                <Globe className="w-10 h-10 text-purple-400" />
              </div>
              <h3 className="text-lg font-medium mb-2">Live Preview</h3>
              <p className="text-[#8b949e]">See your code come to life with real-time preview functionality</p>
            </div>
            <div className="text-center">
              <div className="flex justify-center mb-3">
                <Github className="w-10 h-10 text-gray-400" />
              </div>
              <h3 className="text-lg font-medium mb-2">Version Control</h3>
              <p className="text-[#8b949e]">Save and manage your project versions securely</p>
            </div>
          </div>
        </div>

        <div className="text-center">
          <p className="text-[#8b949e] mb-6">
            Whether you're a beginner learning to code or an experienced developer building your next project,
            DevForge Studio provides the tools you need to succeed.
          </p>
          <div className="flex justify-center space-x-4">
            <button 
              onClick={() => window.location.hash = '#/academy'}
              className="px-6 py-3 bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors font-medium"
            >
              Start Learning
            </button>
            <button 
              onClick={() => window.location.hash = '#/workspace'}
              className="px-6 py-3 bg-green-600 hover:bg-green-700 rounded-lg transition-colors font-medium"
            >
              Open Workspace
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HomePage;