import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { FileNode, TerminalLog, Environment } from '../types';
import { 
  File, Folder, FolderOpen, ChevronRight, ChevronDown, 
  FilePlus, FolderPlus, X, Play, Terminal as TerminalIcon, 
  Globe, Trash2, Code2, Box, Cpu, Layers, Package, Settings as SettingsIcon,
  Menu, Download, Link, Check, Clipboard, Edit2, Search, Rocket, RotateCcw,
  CloudUpload, Clock, Save, PlayCircle, Maximize2, Minimize2
} from 'lucide-react';
import CodeEditor from './CodeEditor';
import Preview from './Preview';
import Terminal from './Terminal';
import usePyodide from '../hooks/usePyodide';

interface WorkspaceModeProps {
  files: FileNode[];
  activeFileId: string | null;
  setActiveFileId: (id: string | null) => void;
  openFiles: string[];
  setOpenFiles: React.Dispatch<React.SetStateAction<string[]>>;
  onUpdateFile: (id: string, content: string) => void;
  onRenameFile: (id: string, newName: string) => void;
  onCreateFile: (name: string, type: 'file' | 'folder', parentId: string | null, content?: string) => void;
  onDeleteFile: (id: string) => void;
  onToggleFolder: (id: string) => void;
  autoSaveInterval: number;
  setAutoSaveInterval: (val: number) => void;
}

const FileIcon = ({ name, type, isOpen }: { name: string; type: 'file' | 'folder'; isOpen?: boolean }) => {
  if (type === 'folder') {
    return isOpen ? (
      <FolderOpen className="w-4 h-4 text-blue-400 fill-blue-400/20" />
    ) : (
      <Folder className="w-4 h-4 text-blue-400 fill-blue-400/20" />
    );
  }
  const ext = name.split('.').pop()?.toLowerCase();
  switch (ext) {
    case 'html': return <File className="w-4 h-4 text-orange-500" />;
    case 'css': return <File className="w-4 h-4 text-blue-500" />;
    case 'js': case 'jsx': return <File className="w-4 h-4 text-yellow-400" />;
    case 'ts': case 'tsx': return <File className="w-4 h-4 text-blue-400" />;
    case 'py': return <File className="w-4 h-4 text-sky-400" />;
    case 'json': return <Package className="w-4 h-4 text-purple-400" />;
    default: return <File className="w-4 h-4 text-[#8b949e]" />;
  }
};

const WorkspaceMode: React.FC<WorkspaceModeProps> = ({
  files, activeFileId, setActiveFileId, openFiles, setOpenFiles,
  onUpdateFile, onRenameFile, onCreateFile, onDeleteFile, onToggleFolder,
  autoSaveInterval, setAutoSaveInterval
}) => {
  const { runPython } = usePyodide();
  const [env, setEnv] = useState<Environment>(Environment.STANDARD);
  const [isSidebarOpen, setIsSidebarOpen] = useState(window.innerWidth > 768);
  const [isPreviewOpen, setIsPreviewOpen] = useState(window.innerWidth > 1024);
  const [isTerminalOpen, setIsTerminalOpen] = useState(false);
  const [isTerminalMaximized, setIsTerminalMaximized] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'saved' | 'saving'>('saved');
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  
  const saveTimeoutRef = useRef<number | null>(null);

  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
      if (mobile) {
        setIsSidebarOpen(false);
        setIsPreviewOpen(false);
        setIsTerminalOpen(false);
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const [terminalLogs, setTerminalLogs] = useState<{type: 'log' | 'error' | 'info', content: string, timestamp: Date}[]>([]);

  const [newItem, setNewItem] = useState<{ parentId: string | null; type: 'file' | 'folder' } | null>(null);
  const [newItemName, setNewItemName] = useState('');
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [renamingName, setRenamingName] = useState('');
  
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [contextMenu, setContextMenu] = useState<{ x: number, y: number, visible: boolean, targetId: string | null, targetType: 'file' | 'folder' | 'root' }>({
    x: 0, y: 0, visible: false, targetId: null, targetType: 'file'
  });

  const activeFile = useMemo(() => files.find(f => f.id === activeFileId), [files, activeFileId]);

  const addLog = useCallback((content: string, type: 'log' | 'error' | 'info' = 'log') => {
    setTerminalLogs(prev => [...prev, { content, type, timestamp: new Date() }]);
  }, []);

  const handleSelect = (e: React.MouseEvent | React.PointerEvent, id: string) => {
    e.stopPropagation();
    const file = files.find(x => x.id === id);
    if (!file) return;

    setSelectedIds([id]);
    if (file.type === 'file') {
      setActiveFileId(id);
      setOpenFiles(prev => prev.includes(id) ? prev : [...prev, id]);
      if (isMobile) setIsSidebarOpen(false);
    }
  };

  const handleRename = () => {
    const target = renamingId || contextMenu.targetId;
    const f = files.find(x => x.id === target);
    if (f) {
      setRenamingId(f.id);
      setRenamingName(f.name);
    }
  };

  const submitRename = () => {
    if (renamingId && renamingName.trim()) onRenameFile(renamingId, renamingName.trim());
    setRenamingId(null);
  };

  const handleBulkDelete = () => {
    const targets = selectedIds.length > 0 ? selectedIds : (contextMenu.targetId ? [contextMenu.targetId] : []);
    targets.forEach(id => {
      if (id !== 'root') onDeleteFile(id);
    });
    setSelectedIds([]);
  };

  const handleEditorChange = (val: string) => {
    if (!activeFileId) return;
    setSaveStatus('saving');
    if (saveTimeoutRef.current) window.clearTimeout(saveTimeoutRef.current);
    saveTimeoutRef.current = window.setTimeout(() => {
      onUpdateFile(activeFileId, val);
      setSaveStatus('saved');
    }, autoSaveInterval);
  };

  const handleRunCode = async () => {
    if (!activeFile) return;
    if (!isTerminalOpen) setIsTerminalOpen(true);
    addLog(`[${new Date().toLocaleTimeString()}] Executing ${activeFile.name}...`, 'info');
    
    const ext = activeFile.name.split('.').pop()?.toLowerCase();
    if (ext === 'py') {
      try {
        const result = await runPython(activeFile.content || '');
        if (result) String(result).split('\n').forEach(line => addLog(line));
      } catch (err: any) { addLog(err.message, 'error'); }
    } else if (ext === 'js' || ext === 'jsx') {
      try {
        const runner = new Function(activeFile.content || '');
        runner();
        addLog('Script execution complete.', 'info');
      } catch (err: any) { addLog(err.message, 'error'); }
    } else {
      addLog(`Execution not supported for .${ext} directly. Use Preview.`, 'info');
    }
  };

  const renderTree = (parentId: string | null = 'root', depth = 0) => {
    return files
      .filter(f => f.parentId === parentId)
      .sort((a,b) => (a.type === b.type ? a.name.localeCompare(b.name) : a.type === 'folder' ? -1 : 1))
      .map(file => {
        const isSelected = selectedIds.includes(file.id);
        const isRenaming = renamingId === file.id;
        return (
          <div key={file.id}>
            <div 
              onClick={(e) => {
                if (file.type === 'folder') onToggleFolder(file.id);
                handleSelect(e, file.id);
              }}
              onContextMenu={(e) => { e.preventDefault(); e.stopPropagation(); setContextMenu({ x: e.pageX, y: e.pageY, visible: true, targetId: file.id, targetType: file.type }); }}
              className={`flex items-center px-4 py-1.5 cursor-pointer transition-colors group relative ${isSelected ? 'bg-[#21262d] text-white border-l-2 border-blue-500' : 'text-[#8b949e] hover:bg-[#1c2128]'}`}
              style={{ paddingLeft: `${depth * 1 + 1}rem` }}
            >
              <div className="mr-2">{file.type === 'folder' && (file.isOpen ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />)}</div>
              <FileIcon name={file.name} type={file.type} isOpen={file.isOpen} />
              {isRenaming ? (
                <input autoFocus className="ml-2 bg-[#0d1117] border border-blue-500 rounded px-1 text-xs text-white outline-none w-full" value={renamingName} onChange={e => setRenamingName(e.target.value)} onBlur={submitRename} onKeyDown={e => e.key === 'Enter' && submitRename()} onClick={e => e.stopPropagation()} />
              ) : (
                <span className="ml-2 text-sm truncate">{file.name}</span>
              )}
            </div>
            {file.type === 'folder' && file.isOpen && renderTree(file.id, depth + 1)}
          </div>
        );
      });
  };

  const previewCode = useMemo(() => {
    const html = files.find(f => f.name === 'index.html')?.content || '';
    const css = files.find(f => f.name === 'style.css')?.content || '';
    const js = files.find(f => f.name === 'script.js')?.content || '';
    return html.replace('</head>', `<style>${css}</style></head>`).replace('</body>', `<script>${js}</script></body>`);
  }, [files]);

  return (
    <div className="flex-1 flex flex-col overflow-hidden bg-[#0d1117] relative select-none">
      <div className="flex-1 flex overflow-hidden">
        <aside className={`${isSidebarOpen ? (isMobile ? 'fixed inset-0 w-full' : 'w-64') : 'w-0'} bg-[#161b22] border-r border-[#30363d] flex flex-col transition-all duration-300 overflow-hidden shrink-0 z-50`}>
          <div className="p-4 border-b border-[#30363d] flex items-center justify-between bg-[#1c2128]">
            <span className="text-[10px] font-black uppercase tracking-widest text-[#8b949e]">{showSettings ? 'Settings' : 'Explorer'}</span>
            <div className="flex items-center space-x-2">
              {!showSettings && (
                <>
                  <button onClick={() => setNewItem({ parentId: 'root', type: 'file' })} className="p-1 hover:bg-[#30363d] rounded text-[#8b949e] hover:text-white"><FilePlus className="w-4 h-4" /></button>
                  <button onClick={() => setNewItem({ parentId: 'root', type: 'folder' })} className="p-1 hover:bg-[#30363d] rounded text-[#8b949e] hover:text-white"><FolderPlus className="w-4 h-4" /></button>
                </>
              )}
              {isMobile && <button onClick={() => setIsSidebarOpen(false)} className="p-1 text-[#8b949e]"><X className="w-5 h-5" /></button>}
            </div>
          </div>

          {!showSettings ? (
            <div className="flex-1 overflow-y-auto no-scrollbar pt-2">
              <div className="px-4 mb-4">
                <div className="flex bg-[#0d1117] p-1 rounded-xl border border-[#30363d] space-x-1">
                  <button onClick={() => setEnv(Environment.STANDARD)} className={`flex-1 py-1 rounded-lg text-[7px] font-black uppercase transition-all ${env === Environment.STANDARD ? 'bg-orange-500/20 text-orange-400' : 'text-[#484f58] hover:text-[#c9d1d9]'}`}>Web</button>
                  <button onClick={() => setEnv(Environment.NODEJS)} className={`flex-1 py-1 rounded-lg text-[7px] font-black uppercase transition-all ${env === Environment.NODEJS ? 'bg-green-500/20 text-green-400' : 'text-[#484f58] hover:text-[#c9d1d9]'}`}>Node</button>
                  <button onClick={() => setEnv(Environment.PYTHON)} className={`flex-1 py-1 rounded-lg text-[7px] font-black uppercase transition-all ${env === Environment.PYTHON ? 'bg-sky-500/20 text-sky-400' : 'text-[#484f58] hover:text-[#c9d1d9]'}`}>Python</button>
                </div>
              </div>
              {renderTree('root')}
              {newItem && (
                <div className="px-4 py-2">
                  <input autoFocus className="w-full bg-[#0d1117] border border-blue-500 rounded px-2 py-1 text-xs text-white outline-none" placeholder="name..." value={newItemName} onChange={e => setNewItemName(e.target.value)} onBlur={() => { if(newItemName.trim()) onCreateFile(newItemName, newItem.type, newItem.parentId); setNewItem(null); setNewItemName(''); }} onKeyDown={e => e.key === 'Enter' && e.currentTarget.blur()} />
                </div>
              )}
            </div>
          ) : (
            <div className="flex-1 p-6 space-y-6">
              <div className="space-y-4">
                <span className="text-[10px] font-black text-[#8b949e] uppercase tracking-widest">Auto-save</span>
                <input type="range" min="100" max="5000" step="100" value={autoSaveInterval} onChange={(e) => setAutoSaveInterval(parseInt(e.target.value))} className="w-full h-1 bg-[#30363d] rounded-lg appearance-none cursor-pointer accent-blue-500" />
                <div className="flex justify-between text-[10px] font-bold text-blue-400"><span>Delay</span><span>{autoSaveInterval}ms</span></div>
              </div>
            </div>
          )}
        </aside>

        <main className="flex-1 flex flex-col min-w-0 bg-[#0d1117]">
          <div className="flex bg-[#161b22] border-b border-[#30363d] overflow-x-auto no-scrollbar items-center pr-4 shrink-0">
            {isMobile && !isSidebarOpen && <button onClick={() => setIsSidebarOpen(true)} className="p-4 text-[#8b949e]"><Menu className="w-5 h-5" /></button>}
            <div className="flex-1 flex overflow-x-auto no-scrollbar">
              {openFiles.map(fid => {
                const f = files.find(x => x.id === fid);
                return f ? (
                  <div key={fid} onClick={() => setActiveFileId(fid)} className={`flex items-center px-4 py-2.5 min-w-[120px] max-w-[180px] border-r border-[#30363d] cursor-pointer transition-colors group ${activeFileId === fid ? 'bg-[#0d1117] text-white border-t-2 border-blue-500' : 'text-[#8b949e] hover:bg-[#1c2128]'}`}>
                    <FileIcon name={f.name} type={f.type} /><span className="ml-2 text-xs truncate flex-1">{f.name}</span>
                    <X className="w-3 h-3 ml-2 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity" onClick={(e) => { e.stopPropagation(); setOpenFiles(openFiles.filter(x => x !== fid)); if (activeFileId === fid) setActiveFileId(null); }} />
                  </div>
                ) : null;
              })}
            </div>
            {activeFile && (activeFile.name.endsWith('.js') || activeFile.name.endsWith('.py')) && (
              <button onClick={handleRunCode} className="ml-2 flex items-center px-3 py-1 bg-[#238636] hover:bg-[#2ea043] text-white rounded-lg text-[10px] font-black uppercase transition-all shadow-lg active:scale-95 shrink-0">
                <Play className="w-3 h-3 fill-current" />
              </button>
            )}
          </div>
          <div className="flex-1 relative overflow-hidden">
            {activeFile ? <CodeEditor key={activeFileId} value={activeFile.content || ''} onChange={handleEditorChange} language={activeFile.name.split('.').pop() || 'html'} /> : <div className="h-full flex items-center justify-center opacity-10 font-black uppercase tracking-[0.5em]">DevForge IDE</div>}
          </div>
        </main>

        <div className="flex shrink-0 h-full relative">
          {(isPreviewOpen || isTerminalOpen) && (
            <aside className={`${isTerminalMaximized && isMobile ? 'fixed inset-0 w-full z-[100]' : (isMobile ? 'fixed inset-x-0 bottom-0 h-[60vh] w-full z-[60]' : 'w-[520px]')} bg-[#161b22] border-l border-[#30363d] flex flex-col shadow-2xl transition-all duration-300 overflow-hidden`}>
              {isPreviewOpen && !isTerminalMaximized && (
                <div className={`${isTerminalOpen ? 'h-[50%]' : 'h-full'} flex flex-col border-b border-[#30363d]`}>
                  <div className="p-3 bg-[#1c2128] border-b border-[#30363d] flex justify-between items-center px-4 text-[10px] font-black text-[#8b949e] uppercase tracking-widest">
                    <div className="flex items-center space-x-2"><Globe className="w-3 h-3 text-blue-400" /><span>Preview</span></div>
                    <X className="w-4 h-4 cursor-pointer hover:text-white" onClick={() => setIsPreviewOpen(false)} />
                  </div>
                  <div className="flex-1 bg-white overflow-hidden"><Preview code={previewCode} /></div>
                </div>
              )}
              {isTerminalOpen && (
                <div className={`flex flex-col ${isPreviewOpen && !isTerminalMaximized ? 'h-[50%]' : 'flex-1'} bg-[#0d1117]`}>
                  <div className="p-3 bg-[#1c2128] border-b border-[#30363d] flex justify-between items-center px-4 text-[10px] font-black text-[#8b949e] uppercase tracking-widest">
                    <div className="flex items-center space-x-2"><TerminalIcon className="w-3 h-3 text-green-500" /><span>Terminal</span></div>
                    <div className="flex items-center space-x-3">
                      <button onClick={() => setIsTerminalMaximized(!isTerminalMaximized)} className="p-1 hover:text-white transition-colors">
                        {isTerminalMaximized ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
                      </button>
                      <X className="w-4 h-4 cursor-pointer hover:text-white" onClick={() => { setIsTerminalOpen(false); setIsTerminalMaximized(false); }} />
                    </div>
                  </div>
                  <Terminal logs={terminalLogs} onCommand={(cmd) => { if(cmd === 'clear') setTerminalLogs([]); else addLog(`$ ${cmd}`, 'info'); }} />
                </div>
              )}
            </aside>
          )}

          <div className="w-12 bg-[#0d1117] border-l border-[#30363d] flex flex-col items-center pt-8 space-y-6 shrink-0 z-40">
            <button onClick={() => setIsPreviewOpen(!isPreviewOpen)} className={`p-2 rounded-lg transition-all ${isPreviewOpen ? 'text-blue-500 bg-blue-500/10' : 'text-[#484f58] hover:text-white'}`}><Globe className="w-5 h-5" /></button>
            <button onClick={() => setIsTerminalOpen(!isTerminalOpen)} className={`p-2 rounded-lg transition-all ${isTerminalOpen ? 'text-green-500 bg-green-500/10' : 'text-[#484f58] hover:text-white'}`}><TerminalIcon className="w-5 h-5" /></button>
            <div className="flex-1" />
            <button onClick={() => setShowSettings(!showSettings)} className={`p-2 rounded-lg transition-all ${showSettings ? 'text-blue-500 bg-blue-500/10' : 'text-[#484f58] hover:text-white'}`}><SettingsIcon className="w-5 h-5" /></button>
          </div>
        </div>
      </div>

      <footer className="h-6 bg-[#21262d] border-t border-[#30363d] flex items-center justify-between px-3 text-[10px] font-bold z-[70] shrink-0">
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-1.5 text-blue-400 px-1.5 py-0.5 rounded hover:bg-[#30363d] cursor-pointer transition-colors">
            <Rocket className="w-3 h-3" />
            <span className="hidden sm:inline">Forge v1.0.8</span>
          </div>
          <div className="flex items-center space-x-1.5 text-[#8b949e]">
            {saveStatus === 'saving' ? <CloudUpload className="w-3 h-3 text-yellow-500 animate-pulse" /> : <Check className="w-3 h-3 text-green-500" />}
            <span className="hidden xs:inline">{saveStatus === 'saving' ? 'Syncing...' : 'Cloud Synced'}</span>
          </div>
        </div>
        <div className="flex items-center space-x-4 h-full">
          <div className="flex items-center space-x-1.5 text-[#8b949e]">
            <Clock className="w-3 h-3" />
            <span className="hidden sm:inline">Auto: {autoSaveInterval}ms</span>
          </div>
          <div className="px-2 bg-blue-600 text-white h-full flex items-center"><span>{env}</span></div>
        </div>
      </footer>

      {contextMenu.visible && (
        <div className="fixed z-[110] bg-[#161b22] border border-[#30363d] shadow-2xl rounded-lg py-1.5 w-48 animate-in fade-in zoom-in duration-100" style={{ left: Math.min(contextMenu.x, window.innerWidth - 200), top: Math.min(contextMenu.y, window.innerHeight - 150) }} onClick={e => e.stopPropagation()}>
          {contextMenu.targetType !== 'root' && (
            <>
              <button onClick={() => { handleRename(); setContextMenu(p => ({...p, visible: false})); }} className="w-full px-4 py-2 text-xs text-[#8b949e] hover:text-white hover:bg-[#21262d] flex items-center space-x-3"><Edit2 className="w-3.5 h-3.5" /><span>Rename</span></button>
              <button onClick={() => { handleBulkDelete(); setContextMenu(p => ({...p, visible: false})); }} className="w-full px-4 py-2 text-xs text-red-400 hover:bg-red-500/10 flex items-center space-x-3"><Trash2 className="w-3.5 h-3.5" /><span>Delete</span></button>
            </>
          )}
          {(contextMenu.targetType === 'folder' || contextMenu.targetType === 'root') && (
            <>
              <div className="h-px bg-[#30363d] my-1 mx-2" />
              <button onClick={() => { setNewItem({ parentId: contextMenu.targetId, type: 'file' }); setContextMenu(p => ({...p, visible: false})); }} className="w-full px-4 py-2 text-xs text-[#8b949e] hover:text-white hover:bg-[#21262d] flex items-center space-x-3"><FilePlus className="w-3.5 h-3.5" /><span>New File</span></button>
            </>
          )}
        </div>
      )}
    </div>
  );
};

export default WorkspaceMode;