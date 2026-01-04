
import React, { useState } from 'react';
import { Plus, Trash2, HelpCircle, ExternalLink, Code } from 'lucide-react';

interface EntityRow {
  id: string;
  name: string;
  description: string;
}

const EntityLab: React.FC = () => {
  const [entities, setEntities] = useState<EntityRow[]>([
    { id: '1', name: '&copy;', description: 'Copyright Symbol' },
    { id: '2', name: '&trade;', description: 'Trademark Symbol' },
    { id: '3', name: '&reg;', description: 'Registered Symbol' },
    { id: '4', name: '&lt;', description: 'Less Than (<)' },
    { id: '5', name: '&gt;', description: 'Greater Than (>)' },
    { id: '6', name: '&amp;', description: 'Ampersand (&)' },
    { id: '7', name: '&nbsp;', description: 'Non-breaking Space' },
    { id: '8', name: '&quot;', description: 'Double Quote' },
    { id: '9', name: '&euro;', description: 'Euro Symbol' },
    { id: '10', name: '&pound;', description: 'Pound Symbol' },
    { id: '11', name: '&yen;', description: 'Yen Symbol' },
    { id: '12', name: '&deg;', description: 'Degree Symbol' },
  ]);

  const updateEntity = (id: string, field: keyof EntityRow, value: string) => {
    setEntities(prev => prev.map(e => e.id === id ? { ...e, [field]: value } : e));
  };

  const addEntity = () => {
    setEntities(prev => [...prev, { id: Date.now().toString(), name: '&...', description: 'New description' }]);
  };

  const deleteEntity = (id: string) => {
    setEntities(prev => prev.filter(e => e.id !== id));
  };

  return (
    <div className="bg-[#161b22] border border-[#30363d] rounded-xl overflow-hidden mt-6 shadow-xl">
      <div className="px-6 py-4 border-b border-[#30363d] flex items-center justify-between bg-[#1c2128]">
        <div className="flex items-center space-x-2">
          <HelpCircle className="w-5 h-5 text-[#58a6ff]" />
          <h3 className="font-bold text-white">Interactive HTML Entity Lab</h3>
        </div>
        <div className="flex items-center space-x-3">
          <a 
            href="https://developer.mozilla.org/en-US/docs/Glossary/Character_reference" 
            target="_blank" 
            rel="noopener noreferrer"
            className="flex items-center space-x-1.5 px-3 py-1.5 bg-[#21262d] border border-[#30363d] rounded-lg text-xs text-[#8b949e] hover:text-white transition-all"
          >
            <span>MDN Docs</span>
            <ExternalLink className="w-3 h-3" />
          </a>
          <button 
            onClick={addEntity}
            className="p-1.5 bg-[#238636] hover:bg-[#2ea043] text-white rounded-md transition-colors"
            title="Add Row"
          >
            <Plus className="w-4 h-4" />
          </button>
        </div>
      </div>
      <div className="overflow-x-auto max-h-[400px]">
        <table className="w-full text-left text-sm">
          <thead className="bg-[#0d1117] text-[#8b949e] uppercase text-[10px] font-bold tracking-widest sticky top-0 z-10">
            <tr>
              <th className="px-6 py-3">Entity Name (Code)</th>
              <th className="px-6 py-3">Description</th>
              <th className="px-6 py-3">Result (Live)</th>
              <th className="px-6 py-3 w-10"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#30363d]">
            {entities.map(entity => (
              <tr key={entity.id} className="hover:bg-[#1c2128] transition-colors">
                <td className="px-6 py-4">
                  <div className="flex items-center space-x-2">
                    <Code className="w-3 h-3 text-[#58a6ff]" />
                    <input 
                      value={entity.name}
                      onChange={(e) => updateEntity(entity.id, 'name', e.target.value)}
                      className="bg-[#0d1117] border border-[#30363d] rounded px-2 py-1.5 text-[#e6edf3] w-full font-mono text-xs focus:border-[#58a6ff] outline-none shadow-inner"
                      placeholder="e.g. &copy;"
                    />
                  </div>
                </td>
                <td className="px-6 py-4">
                  <input 
                    value={entity.description}
                    onChange={(e) => updateEntity(entity.id, 'description', e.target.value)}
                    className="bg-transparent border-none text-[#8b949e] w-full outline-none focus:text-white text-xs"
                    placeholder="What is this symbol?"
                  />
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center justify-center bg-white text-black rounded p-2 min-w-[48px] h-12 text-xl font-bold shadow-lg ring-1 ring-gray-200">
                    <span dangerouslySetInnerHTML={{ __html: entity.name }} />
                  </div>
                </td>
                <td className="px-6 py-4 text-center">
                  <button onClick={() => deleteEntity(entity.id)} className="text-[#484f58] hover:text-red-400 p-1 rounded hover:bg-red-900/10">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="p-4 bg-[#0d1117] text-[10px] text-[#484f58] italic border-t border-[#30363d] flex justify-between items-center">
        <span>Tip: Character references can use names (e.g. &amp;copy;) or numbers (e.g. &amp;#169;).</span>
        <span className="text-[#58a6ff]">Explore Character References</span>
      </div>
    </div>
  );
};

export default EntityLab;
