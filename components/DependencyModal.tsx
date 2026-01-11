import React, { useState } from 'react';
import { Package, Search, X } from 'lucide-react';

interface DependencyModalProps {
  show: boolean;
  onClose: () => void;
  onAddDependency: (name: string, version: string) => void;
}

const DependencyModal: React.FC<DependencyModalProps> = ({ show, onClose, onAddDependency }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const handleSearch = async () => {
    if (!searchTerm.trim()) {
      setSearchResults([]);
      return;
    }
    setIsLoading(true);
    try {
      const response = await fetch(`https://registry.npmjs.org/-/v1/search?text=${encodeURIComponent(searchTerm)}`);
      const data = await response.json();
      setSearchResults(data.objects || []);
    } catch (error) {
      console.error('Failed to search for packages:', error);
      setSearchResults([]);
    }
    setIsLoading(false);
  };

  if (!show) {
    return null;
  }

  return (
    <div className="fixed inset-0 bg-black/30 backdrop-blur-sm z-[100] flex items-center justify-center" onClick={onClose}>
      <div className="w-full max-w-md bg-[#161b22] border border-[#30363d] rounded-lg shadow-2xl flex flex-col" onClick={e => e.stopPropagation()}>
        <div className="p-4 border-b border-[#30363d] flex items-center justify-between">
          <h2 className="text-lg font-bold text-white flex items-center">
            <Package className="w-5 h-5 mr-3 text-blue-400" />
            Add Dependency
          </h2>
          <button onClick={onClose} className="p-1 text-[#8b949e] hover:text-white">
            <X className="w-6 h-6" />
          </button>
        </div>
        <div className="p-4">
          <div className="flex items-center space-x-2">
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              placeholder="Search for a package on npm..."
              className="w-full bg-[#0d1117] border border-[#30363d] rounded px-3 py-2 text-white outline-none focus:ring-1 focus:ring-blue-500"
            />
            <button onClick={handleSearch} className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 flex items-center">
              <Search className="w-4 h-4 mr-2" />
              Search
            </button>
          </div>
        </div>
        <div className="flex-1 overflow-y-auto px-4 pb-4">
          {isLoading ? (
            <div className="text-center p-8 text-[#8b949e]">Loading...</div>
          ) : searchResults.length > 0 ? (
            <div className="space-y-2">
              {searchResults.map(result => (
                <div key={result.package.name} className="flex items-center justify-between p-3 bg-[#0d1117] rounded border border-[#30363d]">
                  <div>
                    <p className="text-white font-semibold">{result.package.name}</p>
                    <p className="text-xs text-[#8b949e] truncate max-w-sm">{result.package.description}</p>
                  </div>
                  <button onClick={() => onAddDependency(result.package.name, result.package.version)} className="px-3 py-1 bg-green-600 text-white rounded hover:bg-green-700 text-sm">
                    Add
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center p-8 text-[#8b949e]">No packages found.</div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DependencyModal;
