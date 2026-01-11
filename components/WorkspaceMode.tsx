import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { FileNode, TerminalLog, Environment } from '../types';
import { 
  File, Folder, FolderOpen, ChevronRight, ChevronDown, 
  FilePlus, FolderPlus, X, Play, Terminal as TerminalIcon, 
  Globe, Trash2, Code2, Box, Cpu, Layers, Package, Settings as SettingsIcon,
  Menu, Download, Link, Check, Clipboard, Edit2, Search, Rocket, RotateCcw,
  CloudUpload, Clock, Save, PlayCircle, Maximize2, Minimize2, Github, GitBranch,
  Plus, ExternalLink
} from 'lucide-react';
import CodeEditor from './CodeEditor';
import Preview from './Preview';
import FakeTerminal from './FakeTerminal';
import GitHubPanel from './GitHubPanel';
import usePyodide from '../hooks/usePyodide';
import { useProjects } from '../hooks/useProjects';
import ProjectModal from './ProjectModal';
import { generatePreviewCode } from './PreviewGenerator';
import DependencyModal from './DependencyModal';

interface WorkspaceModeProps {
  files: FileNode[];
  activeFileId: string | null;
  setActiveFileId: (id: string | null) => void;
  openFiles: string[];
  setOpenFiles: React.Dispatch<React.SetStateAction<string[]>>;
  onUpdateFile: (id: string, content: string) => void;
  onRenameFile: (id: string, newName: string) => void;
  onCreateFile: (name: string, type: 'file' | 'folder', parentId: string | null, content?: string) => string;
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
  const [terminalMode, setTerminalMode] = useState<'integrated' | 'container'>('integrated');
  const [terminalImage, setTerminalImage] = useState<'node' | 'python' | 'ubuntu'>('node');
  const [saveStatus, setSaveStatus] = useState<'saved' | 'saving'>('saved');
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  
  const [dependencies, setDependencies] = useState<Record<string, string>>({});
  const [currentDirectory, setCurrentDirectory] = useState<string>('root');
  const [showCommandPalette, setShowCommandPalette] = useState(false);
  const [showSearchBar, setShowSearchBar] = useState(false);
  const [showSandboxPanel, setShowSandboxPanel] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState('');
  const [dependencySearch, setDependencySearch] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [showGitHubPanel, setShowGitHubPanel] = useState(false);
  const [showDependencyModal, setShowDependencyModal] = useState(false);
  
  // Project management states
  const [showProjectModal, setShowProjectModal] = useState(false);
  const { projects, loading, saveProject, loadProject, deleteProject } = useProjects(
    files,
    onDeleteFile,
    onCreateFile,
    setActiveFileId,
    setOpenFiles
  );
  const [showNodeModules, setShowNodeModules] = useState(false);
  const [focusCurrentFile, setFocusCurrentFile] = useState(false);
  const [recentlyDeleted, setRecentlyDeleted] = useState<FileNode | null>(null);
    
  
  const saveTimeoutRef = useRef<number | null>(null);

  useEffect(() => {
    const packageJsonFile = files.find(f => f.name === 'package.json');
    if (packageJsonFile) {
      try {
        const pkg = JSON.parse(packageJsonFile.content || '{}');
        const allDeps = { ...pkg.dependencies, ...pkg.devDependencies };
        const newDeps: Record<string, string> = {};
        for (const depName in allDeps) {
          newDeps[depName] = `https://esm.sh/${depName}@${allDeps[depName]}`;
        }
        setDependencies(newDeps);
      } catch (e) {
        // ignore parse error
      }
    }
  }, [files]);

  const handleAddDependency = (name: string, version: string) => {
    addLog(`Adding dependency: ${name}@${version}`, 'info');

    // Update dependencies for import map
    setDependencies(prev => ({ ...prev, [name]: `https://esm.sh/${name}@${version}` }));

    // Update package.json
    const packageJsonFile = files.find(f => f.name === 'package.json' && f.parentId === 'root');
    if (packageJsonFile) {
      try {
        const packageJson = JSON.parse(packageJsonFile.content || '{}');
        packageJson.dependencies = packageJson.dependencies || {};
        packageJson.dependencies[name] = `^${version}`;
        onUpdateFile(packageJsonFile.id, JSON.stringify(packageJson, null, 2));
        addLog(`Added ${name} to package.json.`, 'info');
      } catch (e) {
        addLog('Error updating package.json', 'error');
      }
    } else {
        // Create package.json if it doesn't exist
        const newPackageJson = {
            name: 'new-project',
            dependencies: {
                [name]: `^${version}`
            }
        };
        onCreateFile('package.json', 'file', 'root', JSON.stringify(newPackageJson, null, 2));
        addLog(`Created package.json and added ${name}.`, 'info');
    }
    setShowDependencyModal(false);
  };
  
  const handleUndoDelete = () => {
    if (recentlyDeleted) {
      onCreateFile(recentlyDeleted.name, recentlyDeleted.type, recentlyDeleted.parentId, recentlyDeleted.content);
      setRecentlyDeleted(null);
      addLog(`Restored ${recentlyDeleted.name}`, 'info');
    }
  };

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
    
    // Global keyboard shortcuts
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl+Shift+P: Open command palette
      if (e.ctrlKey && e.shiftKey && e.key.toLowerCase() === 'p') {
        e.preventDefault();
        setShowCommandPalette(true);
      }
      // Ctrl+P: Quick open file
      else if (e.ctrlKey && e.key.toLowerCase() === 'p') {
        e.preventDefault();
        setIsSidebarOpen(true); // Ensure sidebar is open
        setShowSearchBar(true); // Show the search bar
      }
      // Ctrl+N: New file
      else if (e.ctrlKey && e.key.toLowerCase() === 'n') {
        e.preventDefault();
        setNewItem({ parentId: 'root', type: 'file' });
      }
      // Ctrl+Shift+N: New folder
      else if (e.ctrlKey && e.shiftKey && e.key.toLowerCase() === 'n') {
        e.preventDefault();
        setNewItem({ parentId: 'root', type: 'folder' });
      }
      // Ctrl+Shift+F: Search in files
      else if (e.ctrlKey && e.shiftKey && e.key.toLowerCase() === 'f') {
        e.preventDefault();
        setShowSearchBar(true); // Show the search bar
      }
      // Ctrl+Z: Undo last action
      else if (e.ctrlKey && e.key.toLowerCase() === 'z') {
        e.preventDefault();
        handleUndoDelete();
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    
    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, []);
    
  // Git operations using isomorphic-git
  const gitCloneRepo = async (repoUrl: string) => {
    // In a real implementation, this would use isomorphic-git to clone the repository
    // into the current filesystem
    addLog(`Cloning repository from: ${repoUrl}`, 'info');
    
    // This would integrate with the existing filesystem
    // For now, we'll simulate the operation
    // In a real implementation, we would use isomorphic-git to clone the repo
    // into the current file system
  };

  const gitOperation = async (operation: string, options?: any) => {
    addLog(`Performing git ${operation}...`, 'info');
    // In a real implementation, this would use isomorphic-git
  };
    
  // Sidebar resize state (draggable resizer)
  const [sidebarWidth, setSidebarWidth] = useState<number>(() => isMobile ? window.innerWidth : 256);
  const [isResizing, setIsResizing] = useState(false);
  const sidebarRef = useRef<HTMLDivElement | null>(null);
  const startXRef = useRef(0);
  const startWidthRef = useRef(0);

  // Right panel resize state
  const [rightWidth, setRightWidth] = useState<number>(520);
  const [isRightResizing, setIsRightResizing] = useState(false);
  const rightStartXRef = useRef(0);
  const rightStartWidthRef = useRef(0);

  // Keep width within sensible limits when opening or on device change
  useEffect(() => {
    if (!isSidebarOpen) return;
    if (isMobile) {
      setSidebarWidth(window.innerWidth);
    } else {
      setSidebarWidth((w) => Math.max(200, Math.min(w || 256, 720)));
    }
  }, [isSidebarOpen, isMobile]);

  // Mouse/touch handlers for left resizing
  useEffect(() => {
    if (!isResizing) return;
    const onMove = (e: MouseEvent) => {
      const clientX = e.clientX;
      const delta = clientX - startXRef.current;
      let newWidth = startWidthRef.current + delta;
      newWidth = Math.max(200, Math.min(newWidth, Math.min(window.innerWidth - 200, 720)));
      setSidebarWidth(newWidth);
      document.body.style.userSelect = 'none';
    };
    const onUp = () => {
      setIsResizing(false);
      document.body.style.userSelect = '';
    };
    document.addEventListener('mousemove', onMove);
    document.addEventListener('mouseup', onUp);
    document.addEventListener('mouseleave', onUp);
    return () => {
      document.removeEventListener('mousemove', onMove);
      document.removeEventListener('mouseup', onUp);
      document.removeEventListener('mouseleave', onUp);
      document.body.style.userSelect = '';
    };
  }, [isResizing]);

  // Mouse/touch handlers for right resizing
  useEffect(() => {
    if (!isRightResizing) return;
    const onMove = (e: MouseEvent) => {
      const clientX = e.clientX;
      const delta = rightStartXRef.current - clientX; // positive when dragging left
      let newWidth = Math.max(200, Math.min(rightStartWidthRef.current + delta, Math.min(window.innerWidth - 200, 1000)));
      setRightWidth(newWidth);
      document.body.style.userSelect = 'none';
    };
    const onUp = () => {
      setIsRightResizing(false);
      document.body.style.userSelect = '';
    };
    document.addEventListener('mousemove', onMove);
    document.addEventListener('mouseup', onUp);
    document.addEventListener('mouseleave', onUp);
    return () => {
      document.removeEventListener('mousemove', onMove);
      document.removeEventListener('mouseup', onUp);
      document.removeEventListener('mouseleave', onUp);
      document.body.style.userSelect = '';
    };
  }, [isRightResizing]);

  const startRightResize = (clientX: number) => {
    rightStartXRef.current = clientX;
    rightStartWidthRef.current = rightWidth;
    setIsRightResizing(true);
  };

  const handleRightMouseDownResize = (e: React.MouseEvent) => { e.preventDefault(); startRightResize(e.clientX); };
  const handleRightTouchStart = (e: React.TouchEvent) => startRightResize(e.touches[0].clientX);

  // Update CSS variables used by sidebars
  useEffect(() => {
    const val = isSidebarOpen && !isMobile ? `${sidebarWidth}px` : '0px';
    document.documentElement.style.setProperty('--devforge-sidebar-width', val);
    const rval = (isPreviewOpen || isTerminalOpen) ? `${rightWidth}px` : '0px';
    document.documentElement.style.setProperty('--devforge-right-width', rval);
  }, [sidebarWidth, isSidebarOpen, isMobile, rightWidth, isPreviewOpen, isTerminalOpen]);
  const startResize = (clientX: number) => {
    startXRef.current = clientX;
    startWidthRef.current = sidebarWidth;
    setIsResizing(true);
  };

  // Update CSS variable used by .devforge-sidebar so we avoid inline styles and linter warnings
  useEffect(() => {
    const val = isSidebarOpen && !isMobile ? `${sidebarWidth}px` : '0px';
    document.documentElement.style.setProperty('--devforge-sidebar-width', val);
  }, [sidebarWidth, isSidebarOpen, isMobile]);

  const handleMouseDownResize = (e: React.MouseEvent) => { e.preventDefault(); startResize(e.clientX); };
  const handleTouchStart = (e: React.TouchEvent) => startResize(e.touches[0].clientX);
  const handleResizerKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowLeft') setSidebarWidth(w => Math.max(200, w - 10));
    if (e.key === 'ArrowRight') setSidebarWidth(w => Math.min(720, w + 10));
    if (e.key === 'Home') setSidebarWidth(200);
    if (e.key === 'End') setSidebarWidth(Math.min(720, window.innerWidth - 100));
  };

  const [terminalLogs, setTerminalLogs] = useState<{type: 'log' | 'error' | 'info', content: string, timestamp: Date}[]>([]);

  const [newItem, setNewItem] = useState<{ parentId: string | null; type: 'file' | 'folder' } | null>(null);
  const [newItemName, setNewItemName] = useState('');
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [renamingName, setRenamingName] = useState('');
  
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [lastSelectedId, setLastSelectedId] = useState<string | null>(null);
  const contextRef = useRef<HTMLDivElement>(null);
  const [contextMenu, setContextMenu] = useState<{ x: number, y: number, visible: boolean, targetId: string | null, targetType: 'file' | 'folder' | 'root' }>({ 
    x: 0, y: 0, visible: false, targetId: null, targetType: 'file'
  });

  const activeFile = useMemo(() => files.find(f => f.id === activeFileId), [files, activeFileId]);

  // If `activeFileId` comes from URL or external source it might be a slug/name (e.g., 'package-json').
  // Resolve name -> id and ensure file is opened and sidebar is visible.
  useEffect(() => {
    if (!activeFileId) return;

    const findById = files.find(f => f.id === activeFileId);
    if (findById) {
      setOpenFiles(prev => prev.includes(findById.id) ? prev : [...prev, findById.id]);
      setIsSidebarOpen(true);
      return;
    }

    const normalize = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
    const bySlug = files.find(f => normalize(f.name) === normalize(activeFileId));
    const byName = files.find(f => f.name === activeFileId);
    const resolved = bySlug || byName;
    if (resolved) {
      setOpenFiles(prev => prev.includes(resolved.id) ? prev : [...prev, resolved.id]);
      setIsSidebarOpen(true);
      setActiveFileId(resolved.id);
    }
  }, [activeFileId, files, setActiveFileId, setOpenFiles]);

  // Global contextmenu handler: allow right-click anywhere on file rows (works even if inner elements consume events)
  useEffect(() => {
    const onDocContext = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      const row = target.closest('[data-file-id]') as HTMLElement | null;
      if (row) {
        e.preventDefault();
        const id = row.getAttribute('data-file-id');
        const type = (row.getAttribute('data-file-type') as 'file' | 'folder') || 'file';
        setContextMenu({ x: e.pageX, y: e.pageY, visible: true, targetId: id, targetType: type });
      } else {
        setContextMenu(p => ({ ...p, visible: false }));
      }
    };

    const onDocClick = () => setContextMenu(p => ({ ...p, visible: false }));

    document.addEventListener('contextmenu', onDocContext);
    document.addEventListener('click', onDocClick);

    return () => {
      document.removeEventListener('contextmenu', onDocContext);
      document.removeEventListener('click', onDocClick);
    };
  }, [files]);

  const addLog = useCallback((content: string, type: 'log' | 'error' | 'info' = 'log') => {
    setTerminalLogs(prev => [...prev, { content, type, timestamp: new Date() }]);
  }, []);

  const executeJs = (code: string) => {
    const oldLog = console.log;
    console.log = (...args: any[]) => {
        const message = args.map(arg => {
            try {
                if (typeof arg === 'object' && arg !== null) {
                    return JSON.stringify(arg);
                }
                return String(arg);
            } catch (e) {
                return 'Unserializable object';
            }
        }).join(' ');
        addLog(message);
    };

    try {
        const runner = new Function(code);
        runner();
        addLog('Script execution complete.', 'info');
    } catch (err: any) {
        addLog(err.message, 'error');
    } finally {
        console.log = oldLog;
    }
  }

  const [processes, setProcesses] = useState<Record<string, { cmd: string, isRunning: boolean, interval?: number }>>({});
  const [foregroundPid, setForegroundPid] = useState<string | null>(null);

  const stopProcess = (pid: string, bySignal = false) => {
    const p = processes[pid];
    if (!p) return;
    if (p.interval) window.clearInterval(p.interval);
    setProcesses(prev => ({ ...prev, [pid]: { ...p, isRunning: false, interval: undefined } }));
    if (foregroundPid === pid) setForegroundPid(null);
    addLog(bySignal ? `Process ${pid} terminated (SIGINT)` : `Process ${pid} terminated`, 'info');
  };

  // Handle control signals from Terminal (e.g., Ctrl+C, Esc)
  const handleControlSignal = (signal: string) => {
    if (foregroundPid) {
      addLog(`^${signal}`, 'info');
      stopProcess(foregroundPid, true);
    } else {
      addLog(`No foreground process to send ${signal} to`, 'info');
    }
  };

  const handleCommand = async (cmd: string) => {
    addLog(`$ ${cmd}`, 'info');
    const [command, ...args] = cmd.trim().split(' ');

    // alias common package managers to npm-style behavior
    const pmAliases: Record<string,string> = { yarn: 'npm', pnpm: 'npm', choco: 'choco', pip: 'pip' };
    const effectiveCommand = pmAliases[command] || command;

    switch (effectiveCommand) {
        case 'clear':
            setTerminalLogs([]);
            break;
        case 'ls':
            const rootFiles = files.filter(f => f.parentId === currentDirectory);
            if (rootFiles.length === 0) {
                addLog('Directory is empty.');
            } else {
                const fileList = rootFiles.map(f => `${f.type === 'folder' ? `[${f.name}]` : f.name}`).join('\n');
                addLog(fileList);
            }
            break;
        case 'pwd':
            addLog(currentDirectory || '/', 'info');
            break;
        case 'mkdir': {
            const dirName = args[0];
            if (!dirName) { addLog('Usage: mkdir <folder-name>', 'error'); break; }
            onCreateFile(dirName, 'folder', currentDirectory);
            addLog(`Created folder: ${dirName}`, 'info');
        }
            break;
        case 'touch': {
            const fileName = args[0];
            if (!fileName) { addLog('Usage: touch <file-name>', 'error'); break; }
            onCreateFile(fileName, 'file', currentDirectory, '');
            addLog(`Created file: ${fileName}`, 'info');
        }
            break;
        case 'rm': {
            const target = args[0];
            if (!target) { addLog('Usage: rm <name>', 'error'); break; }
            const entry = files.find(f => f.name === target && f.parentId === currentDirectory);
            if (!entry) { addLog(`rm: cannot remove '${target}': No such file or directory`, 'error'); break; }
            setRecentlyDeleted(entry);
            onDeleteFile(entry.id);
            addLog(`Removed ${target}`, 'info');
        }
            break;
        case 'cd':
            const dirName = args[0];
            if (!dirName) {
                setCurrentDirectory('root');
                break;
            }
            if (dirName === '..') {
                const current = files.find(f => f.id === currentDirectory);
                if (current && current.parentId) {
                    setCurrentDirectory(current.parentId);
                }
                break;
            }
            const dir = files.find(f => f.name === dirName && f.type === 'folder' && f.parentId === currentDirectory);
            if (dir) {
                setCurrentDirectory(dir.id);
            } else {
                addLog(`cd: no such file or directory: ${dirName}`, 'error');
            }
            break;
        case 'cat':
            const fileName = args[0];
            if (!fileName) {
                addLog('Usage: cat <filename>', 'error');
                break;
            }
            const file = files.find(f => f.name === fileName && f.parentId === currentDirectory);
            if (file && file.type === 'file') {
                addLog(file.content || '');
            } else {
                addLog(`cat: ${fileName}: No such file or directory`, 'error');
            }
            break;
        case 'node':
            if (env === Environment.PYTHON) {
                addLog('node is not available in Python environment. Use python instead.', 'error');
                break;
            }
            const jsFileName = args[0];
            if (!jsFileName) {
                addLog('Usage: node <filename.js>', 'error');
                break;
            }
            const jsFile = files.find(f => f.name === jsFileName);
            if (jsFile && (jsFile.name.endsWith('.js') || jsFile.name.endsWith('.jsx'))) {
                executeJs(jsFile.content || '');
            } else {
                addLog(`node: ${jsFileName}: No such file or not a JavaScript file`, 'error');
            }
            break;
        case 'python':
            {
              const pyFileName = args[0];
              if (!pyFileName) { addLog('Usage: python <script.py>', 'error'); break; }
              const pyFile = files.find(f => f.name === pyFileName && pyFileName.endsWith('.py'));
              if (pyFile) {
                try {
                  const result = await runPython(pyFile.content || '');
                  if (result) String(result).split('\n').forEach(line => addLog(line));
                } catch (err: any) { addLog(err.message, 'error'); }
              } else {
                addLog(`python: ${pyFileName}: No such file`, 'error');
              }
            }
            break;
        case 'pip':
            {
              const sub = args[0];
              if (sub === 'install') {
                const pkg = args[1];
                if (!pkg) { addLog('Usage: pip install <package>', 'error'); break; }
                addLog(`Installing ${pkg}...`, 'info');
                // add/append to requirements.txt
                const req = files.find(f => f.name === 'requirements.txt' && f.parentId === currentDirectory);
                if (req && req.type === 'file') {
                  const newContent = ((req.content || '') + '\n' + pkg).trim();
                  onUpdateFile(req.id, newContent);
                } else {
                  onCreateFile('requirements.txt', 'file', currentDirectory, pkg);
                }
                addLog(`Successfully installed ${pkg} (simulated).`, 'info');
              } else {
                addLog(`pip: command not found: ${sub}`, 'error');
              }
            }
            break;
        case 'npm':
            // Only allow npm if environment is not Python
            if (env === Environment.PYTHON) {
                addLog('npm is not available in Python environment. Use pip instead.', 'error');
                break;
            }
            const subCommand = args[0];
            if (subCommand === 'install' || subCommand === 'i') {
                const packageName = args[1];
                if (!packageName) {
                    addLog('Usage: npm install <package-name>', 'error');
                    break;
                }
                addLog(`Installing ${packageName}...`, 'info');
                const packageUrl = `https://esm.sh/${packageName}`;
                setDependencies(prev => ({ ...prev, [packageName]: packageUrl }));
                
                const packageJsonFile = files.find(f => f.name === 'package.json' && f.parentId === currentDirectory);
                if (packageJsonFile) {
                    try {
                        const packageJson = JSON.parse(packageJsonFile.content || '{}');
                        packageJson.dependencies = packageJson.dependencies || {};
                        packageJson.dependencies[packageName] = `^${packageUrl.split('/').pop()}`; // A bit of a guess
                        onUpdateFile(packageJsonFile.id, JSON.stringify(packageJson, null, 2));
                        addLog(`Added ${packageName} to dependencies. You can now import it in your code.`, 'info');
                    } catch (e) {
                        addLog('Error updating package.json', 'error');
                    }
                }
            } else if (subCommand === 'create' && args[1] === 'vite@latest') {
                const projectName = args[2] || 'my-vite-app';
                addLog(`Creating a new Vite project: ${projectName}...`, 'info');

                const newFolderId = onCreateFile(projectName, 'folder', currentDirectory); // Create the project folder and capture its id
                
                // Define Vite project file templates
                const viteFiles = [
                    { name: 'index.html', content: `<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <link rel="icon" type="image/svg+xml" href="/vite.svg" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Vite App</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/main.js"></script>
  </body>
</html>` },
                    { name: 'main.js', content: `import './style.css'

document.querySelector('#root').innerHTML = \`
  <h1>Hello Vite!</h1>
  <a href="https://vitejs.dev/guide/features.html" target="_blank">Documentation</a>
\` `},
                    { name: 'style.css', content: `body { font-family: sans-serif; }` },
                    { name: 'package.json', content: `{ 
  "name": "${projectName}",
  "private": true,
  "version": "0.0.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview"
  },
  "devDependencies": {
    "vite": "^5.0.8"
  },
  "dependencies": {}
}`},
                    { name: 'vite.config.js', content: `import { defineConfig } from 'vite'

export default defineConfig({
  plugins: [],
})`}
                ];

                viteFiles.forEach(fileData => {
                    onCreateFile(fileData.name, 'file', newFolderId, fileData.content);
                });

                addLog(`Vite project '${projectName}' created successfully!`, 'info');
                addLog(`Run 'cd ${projectName}' to enter the project directory.`, 'info');

            } else if (subCommand === 'run') {
                const script = args[1];
                if (!script) { addLog('Usage: npm run <script>', 'error'); break; }
                if (script === 'dev') {
                  addLog(`Starting 'npm run dev' (simulated)...`, 'info');
                  const pid = `proc-${Date.now()}`;
                  setForegroundPid(pid);
                  const interval = window.setInterval(() => {
                    addLog(`[dev] Local: http://localhost:5173/ (simulated)`);
                  }, 2000);
                  setProcesses(prev => ({ ...prev, [pid]: { cmd: `npm run ${script}`, isRunning: true, interval } }));
                  addLog(`Process ${pid} started (simulated). Use Ctrl+C or 'kill ${pid}' to stop.`, 'info');
                } else {
                  addLog(`npm run: Unknown script '${script}'`, 'error');
                }
            } else {
                addLog(`npm: command not found: ${subCommand}`, 'error');
            }
            break;
        case 'help':
            addLog('Supported commands: clear, ls, cd, cat, node, npm install, npm run, pip install, edit, write, echo, grep, head, tail, wc, cp, mv, kill, help', 'info');
            break;
        case 'kill': {
            const pid = args[0] || foregroundPid;
            if (!pid) { addLog('Usage: kill <pid>', 'error'); break; }
            if (processes[pid]) {
              stopProcess(pid);
            } else {
              addLog(`No such process: ${pid}`, 'error');
            }
        }
            break;
        case 'edit': {
            const target = args[0];
            if (!target) { addLog('Usage: edit <filename>', 'error'); break; }
            const f = files.find(x => x.name === target && x.type === 'file');
            if (f) { setActiveFileId(f.id); setOpenFiles(prev => prev.includes(f.id) ? prev : [...prev, f.id]); addLog(`Opened ${target} in editor`, 'info'); } 
            else addLog(`edit: ${target}: No such file`, 'error');
        }
            break;
        case 'write': {
            const target = args[0];
            const content = args.slice(1).join(' ');
            if (!target || !content) { addLog('Usage: write <filename> <content>', 'error'); break; }
            const f = files.find(x => x.name === target && x.type === 'file');
            if (f) { onUpdateFile(f.id, content); addLog(`Wrote to ${target}`, 'info'); } else { onCreateFile(target, 'file', currentDirectory, content); addLog(`Created ${target} and wrote content`, 'info'); }
        }
            break;
        case 'echo':
            addLog(args.join(' '));
            break;
        case 'grep': {
            const pattern = args[0];
            const fileName = args[1];
            if (!pattern || !fileName) { addLog('Usage: grep <pattern> <filename>', 'error'); break; }
            const file = files.find(f => f.name === fileName && f.parentId === currentDirectory);
            if (file && file.type === 'file') {
                const content = file.content || '';
                const lines = content.split('\n');
                const matches = lines.filter(line => line.includes(pattern));
                if (matches.length > 0) {
                    matches.forEach(line => addLog(line));
                } else {
                    addLog(`No matches for pattern '${pattern}' in ${fileName}`);
                }
            } else {
                addLog(`grep: ${fileName}: No such file`, 'error');
            }
            break;
        }
        case 'cp':
            addLog('cp command is simulated (not implemented in browser)', 'info');
            break;
        case 'mv':
            addLog('mv command is simulated (not implemented in browser)', 'info');
            break;
        case 'head': {
            const fileName = args[0];
            const lines = parseInt(args[1]) || 10;
            if (!fileName) { addLog('Usage: head <filename> [lines]', 'error'); break; }
            const file = files.find(f => f.name === fileName && f.parentId === currentDirectory);
            if (file && file.type === 'file') {
                const content = file.content || '';
                const fileLines = content.split('\n');
                const headLines = fileLines.slice(0, lines);
                addLog(headLines.join('\n'));
            } else {
                addLog(`head: ${fileName}: No such file`, 'error');
            }
            break;
        }
        case 'tail': {
            const fileName = args[0];
            const lines = parseInt(args[1]) || 10;
            if (!fileName) { addLog('Usage: tail <filename> [lines]', 'error'); break; }
            const file = files.find(f => f.name === fileName && f.parentId === currentDirectory);
            if (file && file.type === 'file') {
                const content = file.content || '';
                const fileLines = content.split('\n');
                const tailLines = fileLines.slice(-lines);
                addLog(tailLines.join('\n'));
            } else {
                addLog(`tail: ${fileName}: No such file`, 'error');
            }
            break;
        }
        case 'wc': {
            const fileName = args[0];
            if (!fileName) { addLog('Usage: wc <filename>', 'error'); break; }
            const file = files.find(f => f.name === fileName && f.parentId === currentDirectory);
            if (file && file.type === 'file') {
                const content = file.content || '';
                const lines = content.split('\n').length;
                const words = content.trim().split(/\s+/).filter(w => w).length;
                const chars = content.length;
                addLog(`${lines} ${words} ${chars} ${fileName}`);
            } else {
                addLog(`wc: ${fileName}: No such file`, 'error');
            }
            break;
        }
        default:
            addLog(`Command not found: ${command}. Type 'help' for a list of supported commands.`, 'error');
            break;
    }
  };

  const handleSelect = (e: React.MouseEvent | React.PointerEvent, id: string) => {
    e.stopPropagation();
    const file = files.find(x => x.id === id);
    if (!file) return;

    // Check if Ctrl/Cmd key is pressed for multi-selection
    const isMultiSelect = e.ctrlKey || e.metaKey;
    // Check if Shift key is pressed for range selection
    const isRangeSelect = e.shiftKey && lastSelectedId;

    if (isRangeSelect) {
      // Range selection: select all items between lastSelectedId and current id
      const allFileIds = files.map(f => f.id);
      const startIndex = allFileIds.indexOf(lastSelectedId);
      const endIndex = allFileIds.indexOf(id);
      
      if (startIndex !== -1 && endIndex !== -1) {
        const start = Math.min(startIndex, endIndex);
        const end = Math.max(startIndex, endIndex);
        const rangeIds = allFileIds.slice(start, end + 1);
        
        // If we're already in a multi-selection, add to the selection
        if (selectedIds.length > 0) {
          const newSelectedIds = Array.from(new Set([...selectedIds, ...rangeIds]));
          setSelectedIds(newSelectedIds);
        } else {
          setSelectedIds(rangeIds);
        }
      }
    } else if (isMultiSelect) {
      // Multi-selection: toggle the current item
      if (selectedIds.includes(id)) {
        setSelectedIds(prev => prev.filter(x => x !== id));
      } else {
        setSelectedIds(prev => [...prev, id]);
      }
    } else {
      // Single selection: clear and select only the current item
      setSelectedIds([id]);
    }
    
    // Update last selected ID for range selection
    setLastSelectedId(id);
    
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
      if (id !== 'root') {
        const fileToDelete = files.find(f => f.id === id);
        if (fileToDelete) {
          setRecentlyDeleted(fileToDelete);
        }
        onDeleteFile(id);
      }
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
        executeJs(activeFile.content || '');
    } else {
      addLog(`Execution not supported for .${ext} directly. Use Preview.`, 'info');
    }
  };

  const renderTree = (parentId: string | null = 'root', depth = 0) => {
    return files
      .filter(f => f.parentId === parentId && !(f.name === 'node_modules' && !showNodeModules))
      .sort((a,b) => (a.type === b.type ? a.name.localeCompare(b.name) : a.type === 'folder' ? -1 : 1))
      .map(file => {
        const isSelected = selectedIds.includes(file.id);
        const isRenaming = renamingId === file.id;
        const paddingClass = `pl-${Math.min(depth + 1, 12)}`;
        return (
          <div key={file.id}>
            <div 
              data-file-id={file.id}
              data-file-type={file.type}
              onClick={(e) => {
                if (file.type === 'folder') onToggleFolder(file.id);
                handleSelect(e, file.id);
              }}
              onContextMenu={(e) => { e.preventDefault(); e.stopPropagation(); setContextMenu({ x: e.pageX, y: e.pageY, visible: true, targetId: file.id, targetType: file.type }); }}
              className={`flex items-center px-4 py-1.5 cursor-pointer transition-colors group relative ${paddingClass} ${isSelected ? 'bg-[#21262d] text-white border-l-2 border-blue-500' : 'text-[#8b949e] hover:bg-[#1c2128]'}`}
            >
              <div className="mr-2">{file.type === 'folder' && (file.isOpen ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />)}</div>
              <FileIcon name={file.name} type={file.type} isOpen={file.isOpen} />
              {isRenaming ? (
                <input autoFocus aria-label="Rename file" title="Rename file" placeholder="new-name" className="ml-2 bg-[#0d1117] border border-blue-500 rounded px-1 text-xs text-white outline-none w-full" value={renamingName} onChange={e => setRenamingName(e.target.value)} onBlur={submitRename} onKeyDown={e => e.key === 'Enter' && submitRename()} onClick={e => e.stopPropagation()} />
              ) : (
                <span className="ml-2 text-sm truncate">{file.name}</span>
              )}
            </div> 
            {file.type === 'folder' && file.isOpen && renderTree(file.id, depth + 1)}
          </div>
        );
      });
  };

  const previewCode = generatePreviewCode(files, currentDirectory, dependencies, activeFileId, focusCurrentFile);

  // Command palette component
  const CommandPalette = () => {
    if (!showCommandPalette) return null;
    
    const commands = [
      { id: 'new-file', label: 'New File', action: () => { setNewItem({ parentId: 'root', type: 'file' }); setShowCommandPalette(false); } },
      { id: 'new-folder', label: 'New Folder', action: () => { setNewItem({ parentId: 'root', type: 'folder' }); setShowCommandPalette(false); } },
      { id: 'format-code', label: 'Format Code', action: () => { 
        if (activeFileId && activeFile) {
          // This will be handled by the keydown event
          const event = new KeyboardEvent('keydown', { ctrlKey: true, shiftKey: true, key: 'f' });
          document.dispatchEvent(event);
        }
        setShowCommandPalette(false); 
      } },
      { id: 'toggle-preview', label: 'Toggle Preview', action: () => { setIsPreviewOpen(!isPreviewOpen); setShowCommandPalette(false); } },
      { id: 'toggle-terminal', label: 'Toggle Terminal', action: () => { setIsTerminalOpen(!isTerminalOpen); setShowCommandPalette(false); } },
    ];
    
    return (
      <div className="fixed inset-0 bg-black/30 backdrop-blur-sm z-[100] flex items-start justify-center pt-32" onClick={() => setShowCommandPalette(false)}>
        <div className="w-full max-w-md bg-[#161b22] border border-[#30363d] rounded-lg shadow-2xl overflow-hidden" onClick={e => e.stopPropagation()}>
          <div className="p-3 border-b border-[#30363d] flex items-center">
            <Search className="w-4 h-4 text-[#8b949e] ml-2" />
            <input
              autoFocus
              placeholder="Type a command..."
              className="w-full bg-transparent border-none outline-none text-white ml-3 py-1 text-sm"
              onKeyDown={(e) => {
                if (e.key === 'Escape') {
                  setShowCommandPalette(false);
                }
              }}
            />
            <button onClick={() => setShowCommandPalette(false)} className="p-1 text-[#8b949e] hover:text-white">
              <X className="w-4 h-4" />
            </button>
          </div>
          <div className="max-h-64 overflow-y-auto">
            {commands.map((cmd) => (
              <button
                key={cmd.id}
                onClick={cmd.action}
                className="w-full text-left px-4 py-2 text-sm text-[#c9d1d9] hover:bg-[#30363d] flex items-center"
              >
                <span className="ml-1">{cmd.label}</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    );
  };
  
  return (
    <div className="flex-1 flex flex-col overflow-hidden bg-[#0d1117] relative select-none">
      {showCommandPalette && <CommandPalette />}
      <div className="flex-1 flex overflow-hidden">
        <aside ref={sidebarRef} className={`${isSidebarOpen ? (isMobile ? 'fixed inset-0 w-full' : 'devforge-sidebar') : 'w-0'} bg-[#0d1117]/90 backdrop-blur-sm border-r border-[#30363d]/50 flex flex-col overflow-hidden shrink-0 z-50 h-full`}>
          <div className="p-4 border-b border-[#30363d] flex items-center justify-between bg-[#1c2128]">
            <span className="text-[10px] font-black uppercase tracking-widest text-[#8b949e]">{showSettings ? 'Settings' : 'Explorer'}</span>
            <div className="flex items-center space-x-2">
              {!showSettings && (
                <>
                  <button aria-label="Create new file" title="Create new file" onClick={() => setNewItem({ parentId: 'root', type: 'file' })} className="p-1 hover:bg-[#30363d] rounded text-[#8b949e] hover:text-white"><FilePlus className="w-4 h-4" /></button>
                  <button aria-label="Create new folder" title="Create new folder" onClick={() => setNewItem({ parentId: 'root', type: 'folder' })} className="p-1 hover:bg-[#30363d] rounded text-[#8b949e] hover:text-white"><FolderPlus className="w-4 h-4" /></button>
                  <button aria-label="Manage projects" title="Manage projects" onClick={() => setShowProjectModal(true)} className="p-1 hover:bg-[#30363d] rounded text-[#8b949e] hover:text-white"><Folder className="w-4 h-4" /></button>
                  <button aria-label="GitHub integration" title="GitHub integration" onClick={() => setShowGitHubPanel(!showGitHubPanel)} className="p-1 hover:bg-[#30363d] rounded text-[#8b949e] hover:text-white"><Github className="w-4 h-4" /></button>
                </>
              )}
              {isMobile && <button aria-label="Close sidebar" title="Close sidebar" onClick={() => setIsSidebarOpen(false)} className="p-1 text-[#8b949e]"><X className="w-5 h-5" /></button>} 
            </div>
          </div>

          {!showSettings ? (
            <div className="flex flex-col h-full">
              <div className="flex-1 overflow-y-auto no-scrollbar pt-2">
                
                {renderTree('root')}
                {newItem && (
                  <div className="px-4 py-2">
                    <input autoFocus className="w-full bg-[#0d1117] border border-blue-500 rounded px-2 py-1 text-xs text-white outline-none" placeholder="name..." value={newItemName} onChange={e => setNewItemName(e.target.value)} onBlur={() => { if(newItemName.trim()) onCreateFile(newItemName, newItem.type, newItem.parentId); setNewItem(null); setNewItemName(''); }} onKeyDown={e => e.key === 'Enter' && e.currentTarget.blur()} />
                  </div>
                )}
              </div>
              <div className="mt-auto border-t border-[#30363d] pt-4">
                <div className="px-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold text-white">Dependencies</span>
                    <button 
                      onClick={() => setShowDependencyModal(true)}
                      className="text-xs text-blue-400 hover:text-blue-300"
                    >
                      <Plus className="w-3 h-3 inline mr-1" /> Add
                    </button>
                  </div>
                  <div className="space-y-1 max-h-40 overflow-y-auto">
                    {Object.entries(dependencies).map(([name, version]) => (
                      <div key={name} className="flex justify-between items-center p-1.5 bg-[#0d1117] rounded border border-[#30363d] text-xs">
                        <div className="flex items-center space-x-1">
                          <Package className="w-3 h-3 text-blue-400" />
                          <span className="text-white truncate">{name}</span>
                        </div>
                        <div className="flex space-x-1">
                          <a 
                            href={`https://www.npmjs.com/package/${name}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-400 hover:text-blue-300"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <ExternalLink className="w-3 h-3" />
                          </a>
                          <button 
                            onClick={() => {
                              // Remove dependency
                              setDependencies(prev => {
                                const newDeps = { ...prev };
                                delete newDeps[name];
                                return newDeps;
                              });
                                            
                              // Update package.json
                              const packageJsonFile = files.find(f => f.name === 'package.json' && f.parentId === 'root');
                              if (packageJsonFile) {
                                try {
                                  const packageJson = JSON.parse(packageJsonFile.content || '{}');
                                  packageJson.dependencies = packageJson.dependencies || {};
                                  delete packageJson.dependencies[name];
                                  onUpdateFile(packageJsonFile.id, JSON.stringify(packageJson, null, 2));
                                  addLog(`Removed ${name} from dependencies`, 'info');
                                } catch (e) {
                                  addLog('Error updating package.json', 'error');
                                }
                              }
                            }}
                            className="text-red-400 hover:text-red-300"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    ))}
                    {Object.keys(dependencies).length === 0 && (
                      <div className="text-xs text-[#8b949e] text-center py-2">No dependencies</div>
                    )}
                  </div>
                </div>
                

              </div>
            </div>
          ) : (
            <div className="flex-1 p-6 space-y-6">
              <div className="space-y-4">
                <span className="text-[10px] font-black text-[#8b949e] uppercase tracking-widest">Auto-save</span>
                <label className="sr-only" htmlFor="autosave-range">Auto-save delay</label>
                <input id="autosave-range" aria-label="Auto-save delay" type="range" min="100" max="5000" step="100" value={autoSaveInterval} onChange={(e) => setAutoSaveInterval(parseInt(e.target.value))} className="w-full h-1 bg-[#30363d] rounded-lg appearance-none cursor-pointer accent-blue-500" />
                <div className="flex justify-between text-[10px] font-bold text-blue-400"><span>Delay</span><span>{autoSaveInterval}ms</span></div>
              </div>
            </div>
          )
        }
        </aside>

        {/* Resizer for adjusting sidebar width (desktop only) */}
        {!isMobile && isSidebarOpen && (
          <div
            role="separator"
            aria-orientation="vertical"
            aria-label="Resize sidebar"
            tabIndex={0}
            onMouseDown={handleMouseDownResize}
            onTouchStart={handleTouchStart}
            onKeyDown={handleResizerKeyDown}
            title="Drag to resize sidebar"
            className="w-1 cursor-col-resize z-50 bg-transparent resizer-hover transition-colors flex items-center justify-center"
          >
            <div className="resizer-handle flex flex-col items-center justify-center pointer-events-none">
              <span className="block w-[2px] h-3 bg-[#484f58] rounded mb-1" />
              <span className="block w-[2px] h-3 bg-[#484f58] rounded mb-1" />
              <span className="block w-[2px] h-3 bg-[#484f58] rounded" />
            </div>
          </div>
        )} 

        <main className="flex-1 flex flex-col min-w-0 bg-[#0d1117]">
          <div className="flex bg-[#161b22] border-b border-[#30363d] overflow-x-auto no-scrollbar items-center pr-4 shrink-0">
            {isMobile && !isSidebarOpen && <button aria-label="Open sidebar" title="Open sidebar" onClick={() => setIsSidebarOpen(true)} className="p-4 text-[#8b949e]"><Menu className="w-5 h-5" /></button>} 
            <div className="flex-1 flex overflow-x-auto no-scrollbar">
              {openFiles.map(fid => {
                const f = files.find(x => x.id === fid);
                return f ? (
                  <div key={fid} onClick={() => setActiveFileId(fid)} className={`flex items-center px-4 py-2.5 min-w-[120px] max-w-[180px] border-r border-[#30363d] cursor-pointer transition-colors group ${activeFileId === fid ? 'bg-[#0d1117] text-white border-t-2 border-blue-500' : 'text-[#8b949e] hover:bg-[#1c2128]'}`}>
                    <FileIcon name={f.name} type={f.type} /><span className="ml-2 text-xs truncate flex-1">{f.name}</span>
                    <button aria-label="Close file" title="Close file" onClick={(e) => { e.stopPropagation(); setOpenFiles(openFiles.filter(x => x !== fid)); if (activeFileId === fid) setActiveFileId(null); }} className="ml-2 opacity-0 group-hover:opacity-100 transition-opacity"><X className="w-3 h-3 hover:text-red-400" /></button> 
                  </div>
                ) : null;
              })}
            </div>
            {activeFile && (activeFile.name.endsWith('.js') || activeFile.name.endsWith('.py')) && (
              <button aria-label="Run file" title="Run file" onClick={handleRunCode} className="ml-2 flex items-center px-3 py-1 bg-[#238636] hover:bg-[#2ea043] text-white rounded-lg text-[10px] font-black uppercase transition-all shadow-lg active:scale-95 shrink-0">
                <Play className="w-3 h-3 fill-current" />
              </button>
            )}
            {activeFile && activeFile.name.endsWith('.html') && (
              <button 
                aria-label={focusCurrentFile ? "Show default preview" : "Focus on this HTML file"}
                title={focusCurrentFile ? "Show default preview (click to return to default behavior)" : "Focus on this HTML file"}
                onClick={() => setFocusCurrentFile(!focusCurrentFile)}
                className={`ml-2 flex items-center px-3 py-1 rounded-lg text-[10px] font-black uppercase transition-all shadow-lg active:scale-95 shrink-0 ${focusCurrentFile ? 'bg-yellow-500/20 border border-yellow-500/50 text-yellow-400' : 'bg-[#216a8f] hover:bg-[#2a7da8] text-white'}`}
              >
                <Play className="w-3 h-3 fill-current" />
              </button>
            )} 
          </div>
          <div 
            className="flex-1 relative overflow-hidden"
            onContextMenu={(e) => {
              if (activeFile && activeFile.name.endsWith('.html')) {
                e.preventDefault();
                setContextMenu({
                  x: e.pageX, 
                  y: e.pageY, 
                  visible: true, 
                  targetId: activeFileId, 
                  targetType: 'file'
                });
              }
            }}
          >
            {activeFile ? <CodeEditor key={activeFileId} value={activeFile.content || ''} onChange={handleEditorChange} language={activeFile.name.split('.').pop() || 'html'} /> : <div className="h-full flex items-center justify-center opacity-10 font-black uppercase tracking-[0.5em]">DevForge IDE</div>}
          </div>
        </main>

        {/* Right resizer placed between main content and right panel */}
        {!isMobile && (isPreviewOpen || isTerminalOpen) && (
          <div
            role="separator"
            aria-orientation="vertical"
            aria-label="Resize panel"
            tabIndex={0}
            onMouseDown={handleRightMouseDownResize}
            onTouchStart={handleRightTouchStart}
            onKeyDown={(e) => { if (e.key === 'ArrowLeft') setRightWidth(w => Math.max(200, w - 10)); if (e.key === 'ArrowRight') setRightWidth(w => Math.min(1000, w + 10)); }}
            title="Drag to resize panel"
            className="w-1 cursor-col-resize z-50 bg-transparent resizer-hover transition-colors flex items-center justify-center"
          >
            <div className="resizer-handle flex flex-col items-center justify-center pointer-events-none">
              <span className="block w-[2px] h-3 bg-[#484f58] rounded mb-1" />
              <span className="block w-[2px] h-3 bg-[#484f58] rounded mb-1" />
              <span className="block w-[2px] h-3 bg-[#484f58] rounded" />
            </div>
          </div>
        )}

        <div className="flex shrink-0 h-full relative">
          {(isPreviewOpen || isTerminalOpen) && (
            <aside className={`${isTerminalMaximized ? 'fixed inset-0 w-full z-[100]' : (isMobile ? 'fixed inset-x-0 bottom-0 h-[60vh] w-full z-[60]' : 'devforge-right')} bg-[#161b22] border-l border-[#30363d] flex flex-col shadow-2xl transition-all duration-300 overflow-hidden min-h-0`}>
              {isPreviewOpen && !isTerminalMaximized && (
                <div className={`${isTerminalOpen ? 'h-[50%]' : 'h-full'} flex flex-col border-b border-[#30363d]/50`}>
                  <div className="p-3 bg-[#0d1117] border-b border-[#30363d]/50 flex justify-between items-center px-4 text-[10px] font-black text-[#8b949e] uppercase tracking-widest">
                    <div className="flex items-center space-x-2"><Globe className="w-3 h-3 text-blue-400" /><span>Preview</span></div>
                    <div className="flex items-center space-x-2">
                      <button 
                        aria-label={focusCurrentFile ? "Show index.html" : "Focus on current HTML file"}
                        title={focusCurrentFile ? "Show index.html (click to return to default behavior)" : "Focus on current HTML file"}
                        onClick={() => setFocusCurrentFile(!focusCurrentFile)}
                        className={`p-1 rounded ${focusCurrentFile ? 'text-yellow-400 bg-yellow-400/10' : 'text-[#8b949e] hover:text-white'}`}
                      >
                        <Play className={`w-4 h-4`} />
                      </button>
                      <button aria-label="Close preview" title="Close preview" onClick={() => setIsPreviewOpen(false)} className="text-[#8b949e] hover:text-white"><X className="w-4 h-4" /></button>
                    </div>
                  </div>
                  <div className="flex-1 bg-white overflow-hidden"><Preview code={previewCode} dependencies={dependencies} /></div> 
                </div>
              )}
              {isTerminalOpen && (
                <div key={`terminal-${isTerminalMaximized}-${isTerminalOpen}`} className={`flex flex-col min-h-0 ${isPreviewOpen && !isTerminalMaximized ? 'h-[50%]' : 'flex-1'} bg-[#0d1117]`}>
                  <div className="p-3 bg-[#0d1117] border-b border-[#30363d]/50 flex justify-between items-center px-4 text-[10px] font-black text-[#8b949e] uppercase tracking-widest">
                    <div className="flex items-center space-x-2"><TerminalIcon className="w-3 h-3 text-green-500" /><span>Terminal</span></div>
                    <div className="flex items-center space-x-3">
                      <button aria-label={isTerminalMaximized ? "Restore terminal" : "Maximize terminal"} title={isTerminalMaximized ? "Restore terminal" : "Maximize terminal"} onClick={() => setIsTerminalMaximized(!isTerminalMaximized)} className="p-1 hover:text-white transition-colors">
                        {isTerminalMaximized ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
                      </button>
                      <button aria-label="Close terminal" title="Close terminal" onClick={() => { setIsTerminalOpen(false); setIsTerminalMaximized(false); }} className="p-1 text-[#8b949e] hover:text-white"><X className="w-4 h-4" /></button>
                    </div>
                  </div>
                  <FakeTerminal logs={terminalLogs} onCommand={handleCommand} onControlSignal={handleControlSignal} image={env === Environment.PYTHON ? 'python' : 'node'} onFileChange={onUpdateFile} />
                </div>
              )}
            </aside>
          )}

          <div className="w-12 bg-[#0d1117] border-l border-[#30363d] flex flex-col items-center pt-8 space-y-6 shrink-0 z-40">
            <button aria-label="Toggle preview" title="Toggle preview" onClick={() => setIsPreviewOpen(!isPreviewOpen)} className={`p-2 rounded-lg transition-all ${isPreviewOpen ? 'text-blue-500 bg-blue-500/10' : 'text-[#484f58] hover:text-white'}`}><Globe className="w-5 h-5" /></button>
            <button aria-label="Toggle terminal" title="Toggle terminal" onClick={() => setIsTerminalOpen(!isTerminalOpen)} className={`p-2 rounded-lg transition-all ${isTerminalOpen ? 'text-green-500 bg-green-500/10' : 'text-[#484f58] hover:text-white'}`}><TerminalIcon className="w-5 h-5" /></button>
            <button 
              aria-label="Search files"
              title="Search files (Ctrl+P)"
              onClick={() => {
                setShowSearchBar(!showSearchBar);
                if (!showSearchBar) {
                  // Focus the input when the panel opens
                  setTimeout(() => {
                    const input = document.getElementById('search-files-input');
                    if (input) input.focus();
                  }, 100);
                }
              }}
              className={`p-2 rounded-lg transition-all ${showSearchBar ? 'text-blue-500 bg-blue-500/10' : 'text-[#484f58] hover:text-white'}`}
            >
              <Search className="w-5 h-5" />
            </button>
            <button 
              aria-label="Build Docker image"
              title="Build Docker image and compose"
              onClick={() => {
                // Simulate Docker image building process
                addLog('Starting Docker image build process...', 'info');
                addLog('Creating Dockerfile...', 'info');
                
                // Create or update Dockerfile based on environment
                const dockerfileExists = files.find(f => f.name === 'Dockerfile');
                if (!dockerfileExists) {
                  let dockerfileContent = '';
                  if (env === 'python') {
                    dockerfileContent = `FROM python:3.11-slim
WORKDIR /app
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
COPY . .
CMD ["python", "app.py"]`;
                  } else {
                    dockerfileContent = `FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
EXPOSE 3000
CMD ["npm", "run", "dev"]`;
                  }
                  onCreateFile('Dockerfile', 'file', 'root', dockerfileContent);
                  addLog('Dockerfile created', 'info');
                } else {
                  addLog('Using existing Dockerfile', 'info');
                }
                
                // Create or update .dockerignore based on environment
                const dockerignoreExists = files.find(f => f.name === '.dockerignore');
                if (!dockerignoreExists) {
                  let dockerignoreContent = '';
                  if (env === 'python') {
                    dockerignoreContent = `__pycache__/
*.pyc
*.pyo
*.pyd
.Python
env/
virtualenv/
.venv/
pip-log.txt
pip-delete-this-directory.txt
.tox/
.coverage
.coverage.*
.cache
nosetests.xml
coverage.xml
*.cover
*.log
.git
.mypy_cache/
.pytest_cache/
.hypothesis/
`;
                  } else {
                    dockerignoreContent = `.git
.gitignore
node_modules/
npm-debug.log
yarn-debug.log*
yarn-error.log*
coverage/
*.log
.env
.vscode/
.idea/
`;
                  }
                  onCreateFile('.dockerignore', 'file', 'root', dockerignoreContent);
                  addLog('.dockerignore created', 'info');
                } else {
                  addLog('Using existing .dockerignore', 'info');
                }
                
                // Create or update docker-compose.yml
                const composeExists = files.find(f => f.name === 'docker-compose.yml');
                if (!composeExists) {
                  onCreateFile('docker-compose.yml', 'file', 'root', `version: '3.8'
services:
  app:
    build: .
    ports:
      - "3000:3000"
    volumes:
      - .:/app
      - /app/node_modules`);
                  addLog('docker-compose.yml created', 'info');
                } else {
                  addLog('Using existing docker-compose.yml', 'info');
                }
                
                addLog('Docker image build process completed!', 'info');
                setIsTerminalOpen(true); // Show terminal to see logs
              }}
              className="p-2 rounded-lg transition-all text-[#484f58] hover:text-white"
            >
              <Box className="w-5 h-5" />
            </button>
            <button 
              aria-label="Sandbox Templates"
              title="Sandbox templates and dependencies"
              onClick={() => setShowSandboxPanel(!showSandboxPanel)}
              className={`p-2 rounded-lg transition-all ${showSandboxPanel ? 'text-blue-500 bg-blue-500/10' : 'text-[#484f58] hover:text-white'}`}
            >
              <Layers className="w-5 h-5" />
            </button>
            <div className="flex-1" />
            <button 
              aria-label="GitHub Integration"
              title="Connect to GitHub and manage repositories"
              onClick={() => setShowGitHubPanel(!showGitHubPanel)}
              className={`p-2 rounded-lg transition-all ${showGitHubPanel ? 'text-blue-500 bg-blue-500/10' : 'text-[#484f58] hover:text-white'}`}
            >
              <Github className="w-5 h-5" />
            </button>
            <button aria-label="Open settings" title="Open settings" onClick={() => setShowSettings(!showSettings)} className={`p-2 rounded-lg transition-all ${showSettings ? 'text-blue-500 bg-blue-500/10' : 'text-[#484f58] hover:text-white'}`}><SettingsIcon className="w-5 h-5" /></button>
          </div> 
        </div>
      </div>

      {/* Sandbox Panel */}
      {showSandboxPanel && (
        <div className="absolute top-16 right-12 w-80 h-[calc(100vh-4rem)] bg-[#161b22] border border-[#30363d] rounded-lg shadow-2xl z-50 flex flex-col">
          <div className="p-4 border-b border-[#30363d] flex justify-between items-center">
            <div className="flex items-center space-x-2">
              <Layers className="w-4 h-4 text-green-500" />
              <span className="text-sm font-bold text-white">Sandbox</span>
            </div>
            <button 
              onClick={() => setShowSandboxPanel(false)} 
              className="text-[#8b949e] hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
          
          <div className="flex-1 flex flex-col p-4 space-y-4 overflow-y-auto">
            <div className="space-y-4">
              <div>
                <label className="text-xs text-[#8b949e] mb-1 block">Select Template</label>
                <div className="grid grid-cols-2 gap-2">
                  <button 
                    onClick={() => setSelectedTemplate('react')}
                    className={`p-3 rounded-lg border transition-all text-left ${selectedTemplate === 'react' ? 'border-blue-500 bg-blue-500/10' : 'border-[#30363d] hover:border-[#40464d] bg-[#0d1117]'}`}
                  >
                    <div className="font-medium text-white text-sm">React + Vite</div>
                    <div className="text-xs text-[#8b949e] mt-1">React with Vite build tool</div>
                  </button>
                  <button 
                    onClick={() => setSelectedTemplate('nextjs')}
                    className={`p-3 rounded-lg border transition-all text-left ${selectedTemplate === 'nextjs' ? 'border-blue-500 bg-blue-500/10' : 'border-[#30363d] hover:border-[#40464d] bg-[#0d1117]'}`}
                  >
                    <div className="font-medium text-white text-sm">Next.js</div>
                    <div className="text-xs text-[#8b949e] mt-1">React framework for production</div>
                  </button>
                  <button 
                    onClick={() => setSelectedTemplate('vue')}
                    className={`p-3 rounded-lg border transition-all text-left ${selectedTemplate === 'vue' ? 'border-blue-500 bg-blue-500/10' : 'border-[#30363d] hover:border-[#40464d] bg-[#0d1117]'}`}
                  >
                    <div className="font-medium text-white text-sm">Vue + Vite</div>
                    <div className="text-xs text-[#8b949e] mt-1">Vue with Vite build tool</div>
                  </button>
                  <button 
                    onClick={() => setSelectedTemplate('django')}
                    className={`p-3 rounded-lg border transition-all text-left ${selectedTemplate === 'django' ? 'border-blue-500 bg-blue-500/10' : 'border-[#30363d] hover:border-[#40464d] bg-[#0d1117]'}`}
                  >
                    <div className="font-medium text-white text-sm">Django</div>
                    <div className="text-xs text-[#8b949e] mt-1">High-level Python Web framework</div>
                  </button>
                  <button 
                    onClick={() => setSelectedTemplate('vanilla')}
                    className={`p-3 rounded-lg border transition-all text-left ${selectedTemplate === 'vanilla' ? 'border-blue-500 bg-blue-500/10' : 'border-[#30363d] hover:border-[#40464d] bg-[#0d1117]'}`}
                  >
                    <div className="font-medium text-white text-sm">Vanilla</div>
                    <div className="text-xs text-[#8b949e] mt-1">Basic HTML, CSS, JS</div>
                  </button>
                </div>
              </div>
              
              {selectedTemplate && (
                <button 
                  onClick={() => {
                    addLog(`Creating project with ${selectedTemplate} template...`, 'info');
                    switch(selectedTemplate) {
                      case 'react':
                        // ... (existing react case)
                        break;
                      case 'nextjs':
                        onCreateFile('pages', 'folder', 'root');
                        const pagesId = files.find(f => f.name === 'pages' && f.parentId === 'root')?.id;
                        if(pagesId) {
                          onCreateFile('index.js', 'file', pagesId, `export default function HomePage() {
  return <h1>Hello, Next.js!</h1>;
}`);
                        }
                        onCreateFile('package.json', 'file', 'root', JSON.stringify({
                          name: "next-project",
                          private: true,
                          scripts: {
                            dev: "next dev",
                            build: "next build",
                            start: "next start"
                          },
                          dependencies: {
                            "react": "^18.2.0",
                            "react-dom": "^18.2.0",
                            "next": "latest"
                          }
                        }, null, 2));
                        break;
                      case 'vue':
                        onCreateFile('src', 'folder', 'root');
                        const vueSrcId = files.find(f => f.name === 'src' && f.parentId === 'root')?.id;
                        if(vueSrcId) {
                          onCreateFile('main.js', 'file', vueSrcId, `import { createApp } from 'vue'
import App from './App.vue'
createApp(App).mount('#app')`);
                          onCreateFile('App.vue', 'file', vueSrcId, `<template>
  <h1>Hello, Vue!</h1>
</template>`);
                        }
                        onCreateFile('index.html', 'file', 'root', `<!DOCTYPE html>
<html lang="en">
  <head>
    <title>Vue App</title>
  </head>
  <body>
    <div id="app"></div>
    <script type="module" src="/src/main.js"></script>
  </body>
</html>`);
                        onCreateFile('package.json', 'file', 'root', JSON.stringify({
                          name: "vue-project",
                          private: true,
                          scripts: {
                            dev: "vite",
                            build: "vite build"
                          },
                          dependencies: {
                            "vue": "^3.2.37"
                          },
                          devDependencies: {
                            "@vitejs/plugin-vue": "^3.0.3",
                            "vite": "^3.0.7"
                          }
                        }, null, 2));
                        break;
                      case 'vanilla':
                        onCreateFile('index.html', 'file', 'root', `<!DOCTYPE html>
<html>
  <head>
    <title>Vanilla JS App</title>
    <link rel="stylesheet" href="style.css">
  </head>
  <body>
    <h1>Hello, Vanilla JS!</h1>
    <script src="script.js"></script>
  </body>
</html>`);
                        onCreateFile('style.css', 'file', 'root', `h1 { color: blue; }`);
                        onCreateFile('script.js', 'file', 'root', `console.log('Hello from script.js');`);
                        break;
                      case 'django':
                        // ... (existing django case)
                        break;
                    }
                    addLog('Project structure created successfully!', 'info');
                    setShowSandboxPanel(false);
                    setIsTerminalOpen(true);
                  }}
                  className="w-full py-2 px-3 bg-[#0969da] hover:bg-[#1f7fdb] text-white rounded-md text-sm font-medium transition-colors"
                >
                  Create Project
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Dependency Modal */}
      <DependencyModal
        show={showDependencyModal}
        onClose={() => setShowDependencyModal(false)}
        onAddDependency={handleAddDependency}
      />

      {/* Project Modal */}
      {showProjectModal && (
        <ProjectModal
          show={showProjectModal}
          onClose={() => setShowProjectModal(false)}
          projects={projects}
          onLoadProject={(id) => {
            loadProject(id);
            setShowProjectModal(false);
          }}
          onSaveProject={(name) => saveProject(name)}
          onDeleteProject={(id) => deleteProject(id)}
        />
      )}

      {/* Search Panel */}
      {showSearchBar && (
        <div className="absolute top-16 right-12 w-80 h-[calc(100vh-4rem)] bg-[#161b22] border border-[#30363d] rounded-lg shadow-2xl z-50 flex flex-col">
          <div className="p-4 border-b border-[#30363d] flex justify-between items-center">
            <div className="flex items-center space-x-2">
              <Search className="w-4 h-4 text-green-500" />
              <span className="text-sm font-bold text-white">Search Files</span>
            </div>
            <button 
              onClick={() => setShowSearchBar(false)} 
              className="text-[#8b949e] hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
          
          <div className="flex-1 flex flex-col p-4 space-y-4">
            <div className="flex flex-col space-y-2">
              <label className="text-xs text-[#8b949e]">Search in workspace</label>
              <input
                id="search-files-input"
                autoFocus
                placeholder="Type to search files..."
                className="w-full bg-[#0d1117] border border-[#30363d] rounded px-3 py-2 text-sm text-white outline-none focus:ring-1 focus:ring-blue-500"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    const query = (e.target as HTMLInputElement).value.trim();
                    if (query) {
                      const matchingFile = files.find(f => f.name.toLowerCase().includes(query.toLowerCase()));
                      if (matchingFile) {
                        setActiveFileId(matchingFile.id);
                        setOpenFiles(prev => prev.includes(matchingFile.id) ? prev : [...prev, matchingFile.id]);
                        setShowSearchBar(false);
                      }
                    }
                  } else if (e.key === 'Escape') {
                    setShowSearchBar(false);
                  }
                }}
              />
            </div>
            
            <div className="space-y-2">
              <h4 className="text-xs font-semibold text-[#8b949e] uppercase tracking-wider">Recent Files</h4>
              <div className="space-y-1 max-h-64 overflow-y-auto">
                {files
                  .filter(f => f.type === 'file')
                  .slice(0, 10)
                  .map(file => (
                    <div 
                      key={file.id}
                      className="p-2 bg-[#0d1117] rounded border border-[#30363d] hover:bg-[#1c2128] transition-colors cursor-pointer flex items-center space-x-2"
                      onClick={() => {
                        setActiveFileId(file.id);
                        setOpenFiles(prev => prev.includes(file.id) ? prev : [...prev, file.id]);
                        setShowSearchBar(false);
                      }}
                    >
                      <File className="w-4 h-4 text-[#8b949e]" />
                      <span className="text-sm text-white truncate">{file.name}</span>
                    </div>
                  ))
                }
              </div>
            </div>
          </div>
        </div>
      )}

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
        <div ref={contextRef} style={{top: contextMenu.y, left: contextMenu.x}} className="fixed z-[110] bg-[#161b22]/90 backdrop-blur-md border border-[#30363d]/50 shadow-2xl rounded-lg py-1.5 w-48 animate-in fade-in zoom-in duration-100" onClick={e => e.stopPropagation()}>
          {contextMenu.targetType !== 'root' && (
            <>
              <button onClick={() => { handleRename(); setContextMenu(p => ({...p, visible: false})); }} className="w-full px-4 py-2 text-xs text-[#8b949e] hover:text-white hover:bg-[#21262d] flex items-center space-x-3"><Edit2 className="w-3.5 h-3.5" /><span>Rename</span></button>
              <button onClick={() => { handleBulkDelete(); setContextMenu(p => ({...p, visible: false})); }} className="w-full px-4 py-2 text-xs text-red-400 hover:bg-red-500/10 flex items-center space-x-3"><Trash2 className="w-3.5 h-3.5" /><span>Delete</span></button>
              {contextMenu.targetId && files.find(f => f.id === contextMenu.targetId)?.name.endsWith('.html') && (
                  <button 
                    onClick={() => {
                      setActiveFileId(contextMenu.targetId);
                      setOpenFiles(prev => prev.includes(contextMenu.targetId!) ? prev : [...prev, contextMenu.targetId!]);
                      setFocusCurrentFile(true);
                      setContextMenu(p => ({...p, visible: false}));
                    }}
                    className="w-full px-4 py-2 text-xs text-[#8b949e] hover:text-white hover:bg-[#21262d] flex items-center space-x-3"
                  >
                    <Play className="w-3.5 h-3.5" />
                    <span>Live Preview</span>
                  </button>
              )}
            </>
          )}
          {(contextMenu.targetType === 'folder' || contextMenu.targetType === 'root') && (
            <>
              <div className="h-px bg-[#30363d] my-1 mx-2" />
              <button onClick={() => { setNewItem({ parentId: contextMenu.targetId, type: 'file' }); setContextMenu(p => ({...p, visible: false})); }} className="w-full px-4 py-2 text-xs text-[#8b949e] hover:text-white hover:bg-[#21262d] flex items-center space-x-3"><FilePlus className="w-3.5 h-3.5" /><span>New File</span></button>
              <button onClick={() => { setNewItem({ parentId: contextMenu.targetId, type: 'folder' }); setContextMenu(p => ({...p, visible: false})); }} className="w-full px-4 py-2 text-xs text-[#8b949e] hover:text-white hover:bg-[#21262d] flex items-center space-x-3"><FolderPlus className="w-3.5 h-3.5" /><span>New Folder</span></button>
            </>
          )}
        </div>
      )}
      
      {/* GitHub Panel */}
      <GitHubPanel 
        isOpen={showGitHubPanel}
        onClose={() => setShowGitHubPanel(false)}
        files={files}
        onCloneRepo={gitCloneRepo}
        onGitOperation={gitOperation}
      />
    </div>
  );
};

export default WorkspaceMode;
