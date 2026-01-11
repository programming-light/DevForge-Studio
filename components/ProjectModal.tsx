import React, { useState } from 'react';
import { Project } from '../types';

interface ProjectModalProps {
  show: boolean;
  onClose: () => void;
  projects: Project[];
  onSave: (name: string) => void;
  onLoad: (id: number) => void;
  onDelete: (id: number) => void;
}

const ProjectModal: React.FC<ProjectModalProps> = ({ show, onClose, projects, onSave, onLoad, onDelete }) => {
  const [projectName, setProjectName] = useState('');

  if (!show) {
    return null;
  }

  const handleSave = () => {
    if (projectName.trim()) {
      onSave(projectName.trim());
      setProjectName('');
    }
  };

  return (
    <div className="fixed inset-0 bg-black/30 backdrop-blur-sm z-[100] flex items-center justify-center" onClick={onClose}>
      <div className="w-full max-w-2xl bg-[#161b22] border border-[#30363d] rounded-lg shadow-2xl overflow-hidden" onClick={e => e.stopPropagation()}>
        <div className="p-4 border-b border-[#30363d] flex items-center justify-between">
          <h2 className="text-lg font-bold text-white">Manage Projects</h2>
          <button onClick={onClose} className="p-1 text-[#8b949e] hover:text-white">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <div className="p-6">
          <div className="mb-4">
            <h3 className="text-md font-semibold text-white mb-2">Save Current Project</h3>
            <div className="flex items-center space-x-2">
              <input
                type="text"
                value={projectName}
                onChange={(e) => setProjectName(e.target.value)}
                placeholder="Enter project name"
                className="w-full bg-[#0d1117] border border-[#30363d] rounded px-3 py-2 text-white outline-none"
              />
              <button onClick={handleSave} className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">
                Save
              </button>
            </div>
          </div>
          <div>
            <h3 className="text-md font-semibold text-white mb-2">Load Project</h3>
            <div className="max-h-64 overflow-y-auto">
              {projects.map(project => (
                <div key={project.id} className="flex items-center justify-between p-3 bg-[#0d1117] rounded border border-[#30363d] mb-2">
                  <div>
                    <p className="text-white font-semibold">{project.name}</p>
                    <p className="text-xs text-[#8b949e]">Last updated: {new Date(project.updatedAt).toLocaleString()}</p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <button onClick={() => onLoad(project.id)} className="px-3 py-1 bg-green-600 text-white rounded hover:bg-green-700">
                      Load
                    </button>
                    <button onClick={() => onDelete(project.id)} className="px-3 py-1 bg-red-600 text-white rounded hover:bg-red-700">
                      Delete
                    </button>
                  </div>
                </div>
              ))}
              {projects.length === 0 && (
                <p className="text-center text-[#8b949e]">No saved projects.</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProjectModal;
