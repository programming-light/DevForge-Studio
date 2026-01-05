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
  const [showNodeModules, setShowNodeModules] = useState(false);
  const [terminalMode, setTerminalMode] = useState<'integrated' | 'container'>('integrated');
  const [terminalImage, setTerminalImage] = useState<'node' | 'python' | 'ubuntu'>('node');
  const [saveStatus, setSaveStatus] = useState<'saved' | 'saving'>('saved');
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  
  const [dependencies, setDependencies] = useState<Record<string, string>>({});
  const [currentDirectory, setCurrentDirectory] = useState<string>('root');

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
                    { name: 'main.js', content: `import './style.css'\n\ndocument.querySelector('#root').innerHTML = \`\n  <h1>Hello Vite!</h1>\n  <a href="https://vitejs.dev/guide/features.html" target="_blank">Documentation</a>\n\` `},
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
                    { name: 'vite.config.js', content: `import { defineConfig } from 'vite'\n\nexport default defineConfig({\n  plugins: [],\n})`}
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
            addLog('Supported commands: clear, ls, cd, cat, node, npm install, npm run, pip install, edit, write, kill, help', 'info');
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
        default:
            addLog(`Command not found: ${command}. Type 'help' for a list of supported commands.`, 'error');
            break;
    }
  };

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

  const previewCode = useMemo(() => {
    const htmlFile = files.find(f => f.name === 'index.html' && f.parentId === currentDirectory);
    const cssFile = files.find(f => f.name === 'style.css' && f.parentId === currentDirectory);
    const jsFile = files.find(f => f.name === 'script.js' && f.parentId === currentDirectory);

    const html = htmlFile?.content || '';
    const css = cssFile?.content || '';
    const js = jsFile?.content || '';

    // A more robust way to inject CSS and JS
    let processedHtml = html;
    if (processedHtml.includes('</head>')) { // Only inject if </head> exists
      if (!processedHtml.includes('style.css')) {
          processedHtml = processedHtml.replace('</head>', `<link rel="stylesheet" href="style.css">\n</head>`);
      }
      if (!processedHtml.includes('script.js')) {
          processedHtml = processedHtml.replace('</body>', `<script src="script.js"></script>\n</body>`);
      }
    } else { // Fallback if no head, just append
      processedHtml = `<!DOCTYPE html><html><head></head><body>${processedHtml}<style>${css}</style><script>${js}</script></body></html>`;
      return processedHtml;
    }


    // This is a simplified preview. For a real app, you'd want to handle multiple files.
    return processedHtml.replace('<link rel="stylesheet" href="style.css">', `<style>${css}</style>`).replace('<script src="script.js"></script>', `<script>${js}</script>`);
  }, [files, currentDirectory]);

  return (
    <div className="flex-1 flex flex-col overflow-hidden bg-[#0d1117] relative select-none">
      <div className="flex-1 flex overflow-hidden">
        <aside ref={sidebarRef} className={`${isSidebarOpen ? (isMobile ? 'fixed inset-0 w-full' : 'devforge-sidebar') : 'w-0'} bg-[#161b22] border-r border-[#30363d] flex flex-col overflow-hidden shrink-0 z-50`}>
          <div className="p-4 border-b border-[#30363d] flex items-center justify-between bg-[#1c2128]">
            <span className="text-[10px] font-black uppercase tracking-widest text-[#8b949e]">{showSettings ? 'Settings' : 'Explorer'}</span>
            <div className="flex items-center space-x-2">
              {!showSettings && (
                <>
                  <button aria-label="Create new file" title="Create new file" onClick={() => setNewItem({ parentId: 'root', type: 'file' })} className="p-1 hover:bg-[#30363d] rounded text-[#8b949e] hover:text-white"><FilePlus className="w-4 h-4" /></button>
                  <button aria-label="Create new folder" title="Create new folder" onClick={() => setNewItem({ parentId: 'root', type: 'folder' })} className="p-1 hover:bg-[#30363d] rounded text-[#8b949e] hover:text-white"><FolderPlus className="w-4 h-4" /></button>
                  <button aria-label="Toggle node_modules visibility" title={showNodeModules ? 'Hide node_modules' : 'Show node_modules'} onClick={() => setShowNodeModules(s => !s)} className={`p-1 hover:bg-[#30363d] rounded ${showNodeModules ? 'text-white bg-[#2b3036]' : 'text-[#8b949e] hover:text-white'}`}><Package className="w-4 h-4" /></button>
                </>
              )}
              {isMobile && <button aria-label="Close sidebar" title="Close sidebar" onClick={() => setIsSidebarOpen(false)} className="p-1 text-[#8b949e]"><X className="w-5 h-5" /></button>} 
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
                <label className="sr-only" htmlFor="autosave-range">Auto-save delay</label>
                <input id="autosave-range" aria-label="Auto-save delay" type="range" min="100" max="5000" step="100" value={autoSaveInterval} onChange={(e) => setAutoSaveInterval(parseInt(e.target.value))} className="w-full h-1 bg-[#30363d] rounded-lg appearance-none cursor-pointer accent-blue-500" />
                <div className="flex justify-between text-[10px] font-bold text-blue-400"><span>Delay</span><span>{autoSaveInterval}ms</span></div>
              </div>
            </div>
          )}
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
            className="w-6 cursor-col-resize z-50 bg-transparent resizer-hover transition-colors flex items-center justify-center"
          >
            <div className="resizer-handle flex flex-col items-center justify-center pointer-events-none">
              <span className="block w-[2px] h-3 bg-[#484f58] rounded mb-1" />
              <span className="block w-[2px] h-3 bg-[#484f58] rounded mb-1" />
              <span className="block w-[2px] h-3 bg-[#484f58] rounded" />
            </div>
          </div>
        )} 
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
            className="w-6 cursor-col-resize z-50 bg-transparent resizer-hover transition-colors flex items-center justify-center"
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
          </div>
          <div className="flex-1 relative overflow-hidden">
            {activeFile ? <CodeEditor key={activeFileId} value={activeFile.content || ''} onChange={handleEditorChange} language={activeFile.name.split('.').pop() || 'html'} /> : <div className="h-full flex items-center justify-center opacity-10 font-black uppercase tracking-[0.5em]">DevForge IDE</div>}
          </div>
        </main>

        <div className="flex shrink-0 h-full relative">
          {(isPreviewOpen || isTerminalOpen) && (
            <aside className={`${isTerminalMaximized ? 'fixed inset-0 w-full z-[100]' : (isMobile ? 'fixed inset-x-0 bottom-0 h-[60vh] w-full z-[60]' : 'devforge-right')} bg-[#161b22] border-l border-[#30363d] flex flex-col shadow-2xl transition-all duration-300 overflow-hidden min-h-0`}>
              {isPreviewOpen && !isTerminalMaximized && (
                <div className={`${isTerminalOpen ? 'h-[50%]' : 'h-full'} flex flex-col border-b border-[#30363d]`}>
                  <div className="p-3 bg-[#1c2128] border-b border-[#30363d] flex justify-between items-center px-4 text-[10px] font-black text-[#8b949e] uppercase tracking-widest">
                    <div className="flex items-center space-x-2"><Globe className="w-3 h-3 text-blue-400" /><span>Preview</span></div>
                    <button aria-label="Close preview" title="Close preview" onClick={() => setIsPreviewOpen(false)} className="text-[#8b949e] hover:text-white"><X className="w-4 h-4" /></button>
                  </div>
                  <div className="flex-1 bg-white overflow-hidden"><Preview code={previewCode} dependencies={dependencies} /></div> 
                </div>
              )}
              {isTerminalOpen && (
                <div key={`terminal-${isTerminalMaximized}-${isTerminalOpen}`} className={`flex flex-col min-h-0 ${isPreviewOpen && !isTerminalMaximized ? 'h-[50%]' : 'flex-1'} bg-[#0d1117]`}>
                  <div className="p-3 bg-[#1c2128] border-b border-[#30363d] flex justify-between items-center px-4 text-[10px] font-black text-[#8b949e] uppercase tracking-widest">
                    <div className="flex items-center space-x-2"><TerminalIcon className="w-3 h-3 text-green-500" /><span>Terminal</span></div>
                    <div className="flex items-center space-x-3">
                      <button aria-label={isTerminalMaximized ? 'Restore terminal' : 'Maximize terminal'} title={isTerminalMaximized ? 'Restore terminal' : 'Maximize terminal'} onClick={() => setIsTerminalMaximized(!isTerminalMaximized)} className="p-1 hover:text-white transition-colors">
                        {isTerminalMaximized ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
                      </button>
                      <button aria-label="Close terminal" title="Close terminal" onClick={() => { setIsTerminalOpen(false); setIsTerminalMaximized(false); }} className="p-1 text-[#8b949e] hover:text-white"><X className="w-4 h-4" /></button>
                    </div>
                  </div>
                  <Terminal logs={terminalLogs} onCommand={handleCommand} onControlSignal={handleControlSignal} />
                </div>
              )}
            </aside>
          )}

          <div className="w-12 bg-[#0d1117] border-l border-[#30363d] flex flex-col items-center pt-8 space-y-6 shrink-0 z-40">
            <button aria-label="Toggle preview" title="Toggle preview" onClick={() => setIsPreviewOpen(!isPreviewOpen)} className={`p-2 rounded-lg transition-all ${isPreviewOpen ? 'text-blue-500 bg-blue-500/10' : 'text-[#484f58] hover:text-white'}`}><Globe className="w-5 h-5" /></button>
            <button aria-label="Toggle terminal" title="Toggle terminal" onClick={() => setIsTerminalOpen(!isTerminalOpen)} className={`p-2 rounded-lg transition-all ${isTerminalOpen ? 'text-green-500 bg-green-500/10' : 'text-[#484f58] hover:text-white'}`}><TerminalIcon className="w-5 h-5" /></button>
            <div className="flex-1" />
            <button aria-label="Open settings" title="Open settings" onClick={() => setShowSettings(!showSettings)} className={`p-2 rounded-lg transition-all ${showSettings ? 'text-blue-500 bg-blue-500/10' : 'text-[#484f58] hover:text-white'}`}><SettingsIcon className="w-5 h-5" /></button>
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
        <div ref={contextRef} className="fixed z-[110] bg-[#161b22] border border-[#30363d] shadow-2xl rounded-lg py-1.5 w-48 animate-in fade-in zoom-in duration-100" onClick={e => e.stopPropagation()}>
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