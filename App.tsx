import React, { useState, useEffect, useCallback } from 'react';
import { AppMode, Lesson, Subject, FileNode } from './types';
import { INITIAL_LESSONS, INITIAL_WORKSPACE, INITIAL_SUBJECTS } from './constants';
import Navbar from './components/Navbar';
import { getKV, setKV } from './src/storage/indexeddb';
import AcademyMode from './components/AcademyMode';
import WorkspaceMode from './components/WorkspaceMode';
import AdminPortal from './components/AdminPortal';
import Dashboard from './components/Dashboard';
import JSZip from 'jszip';

const App: React.FC = () => {
  // Sync initial state from URL (basic routing) or localStorage
  const [mode, setMode] = useState<AppMode>(() => {
    try {
      const path = window.location.pathname.replace(/\/+$/, '');
      const parts = path.split('/').filter(Boolean);
      if (parts[0] === 'workspace') return AppMode.WORKSPACE;
      if (parts[0] === 'academy') return AppMode.ACADEMY;
    } catch (e) {
      // ignore
    }

    const saved = localStorage.getItem('master_ide_mode');
    return saved ? (JSON.parse(saved) as AppMode) : AppMode.ACADEMY;
  });


  const [isAdmin, setIsAdmin] = useState(false);
  const [showAdminLogin, setShowAdminLogin] = useState(false);
  
  const [subjects, setSubjects] = useState<Subject[]>(() => {
    const saved = localStorage.getItem('master_ide_subjects');
    return saved ? JSON.parse(saved) : INITIAL_SUBJECTS;
  });

  const [lessons, setLessons] = useState<Lesson[]>(() => {
    const saved = localStorage.getItem('master_ide_lessons');
    return saved ? JSON.parse(saved) : INITIAL_LESSONS;
  });

  const [workspaceFiles, setWorkspaceFiles] = useState<FileNode[]>(() => {
    const saved = localStorage.getItem('master_ide_files');
    return saved ? JSON.parse(saved) : INITIAL_WORKSPACE;
  });

  // Load from IndexedDB if available (overrides localStorage for offline-first persistence)
  useEffect(() => {
    (async () => {
      try {
        const data = await getKV<FileNode[]>('workspace_files');
        if (data && Array.isArray(data) && data.length) {
          setWorkspaceFiles(data);
        }
      } catch (e) {
        // ignore
      }
    })();
  }, []);

  // Persist to IndexedDB when files change
  useEffect(() => {
    (async () => {
      try {
        await setKV('workspace_files', workspaceFiles);
      } catch (e) {
        // ignore
      }
    })();
  }, [workspaceFiles]);

  const [activeSubjectId, setActiveSubjectId] = useState<string | null>(() => {
    return localStorage.getItem('master_ide_active_subject');
  });

  const [activeLessonId, setActiveLessonId] = useState<string | null>(() => {
    return localStorage.getItem('master_ide_active_lesson');
  });

  const [activeFileId, setActiveFileId] = useState<string | null>(() => {
    return localStorage.getItem('master_ide_active_file') || 'index-html';
  });

  const [openFiles, setOpenFiles] = useState<string[]>(() => {
    const saved = localStorage.getItem('master_ide_open_files');
    return saved ? JSON.parse(saved) : ['index-html', 'style-css', 'script-js'];
  });

  const [autoSaveInterval, setAutoSaveInterval] = useState<number>(() => {
    const saved = localStorage.getItem('master_ide_autosave_interval');
    return saved ? parseInt(saved, 10) : 1000;
  });

  useEffect(() => localStorage.setItem('master_ide_mode', JSON.stringify(mode)), [mode]);
  useEffect(() => localStorage.setItem('master_ide_subjects', JSON.stringify(subjects)), [subjects]);
  useEffect(() => localStorage.setItem('master_ide_lessons', JSON.stringify(lessons)), [lessons]);
  useEffect(() => localStorage.setItem('master_ide_files', JSON.stringify(workspaceFiles)), [workspaceFiles]);
  useEffect(() => localStorage.setItem('master_ide_autosave_interval', autoSaveInterval.toString()), [autoSaveInterval]);

  // Search handler used by Navbar search box — finds first file name/content match and opens it
  const handleSearch = (query: string) => {
    const q = query.trim().toLowerCase();
    if (!q) return;
    const found = workspaceFiles.find(f => (f.name && f.name.toLowerCase().includes(q)) || (f.content && f.content.toLowerCase().includes(q)));
    if (found) {
      setMode(AppMode.WORKSPACE);
      setActiveFileId(found.id);
      setOpenFiles(prev => prev.includes(found.id) ? prev : [...prev, found.id]);
    } else {
      alert('No matching files found');
    }
  };
  
  useEffect(() => {
    if (activeSubjectId) localStorage.setItem('master_ide_active_subject', activeSubjectId);
    else localStorage.removeItem('master_ide_active_subject');
  }, [activeSubjectId]);
  useEffect(() => {
    if (activeLessonId) localStorage.setItem('master_ide_active_lesson', activeLessonId);
    else localStorage.removeItem('master_ide_active_lesson');
  }, [activeLessonId]);
  useEffect(() => {
    if (activeFileId) localStorage.setItem('master_ide_active_file', activeFileId);
  }, [activeFileId]);
  useEffect(() => localStorage.setItem('master_ide_open_files', JSON.stringify(openFiles)), [openFiles]);

  // Keep URL in sync with selected mode and active items
  useEffect(() => {
    const makePath = () => {
      if (mode === AppMode.WORKSPACE) {
        if (activeFileId) return `/workspace/file/${activeFileId}`;
        return '/workspace';
      }
      if (mode === AppMode.ACADEMY) {
        if (activeSubjectId && activeLessonId) return `/academy/subject/${activeSubjectId}/lesson/${activeLessonId}`;
        if (activeSubjectId) return `/academy/subject/${activeSubjectId}`;
        return '/academy';
      }
      return '/';
    };
    const path = makePath();
    if (window.location.pathname !== path) {
      window.history.pushState({}, '', path);
    }
  }, [mode, activeSubjectId, activeLessonId, activeFileId]);

  // Handle back/forward navigation
  useEffect(() => {
    const onPop = () => {
      const parts = window.location.pathname.replace(/\/+$/, '').split('/').filter(Boolean);
      if (parts[0] === 'workspace') {
        setMode(AppMode.WORKSPACE);
        if (parts[1] === 'file' && parts[2]) setActiveFileId(parts[2]);
      } else if (parts[0] === 'academy') {
        setMode(AppMode.ACADEMY);
        if (parts[1] === 'subject' && parts[2]) setActiveSubjectId(parts[2]);
        if (parts[3] === 'lesson' && parts[4]) setActiveLessonId(parts[4]);
      }
    };
    window.addEventListener('popstate', onPop);
    return () => window.removeEventListener('popstate', onPop);
  }, []);

  // If the app loads with a path, apply it to state (initial sync)
  useEffect(() => {
    const parts = window.location.pathname.replace(/\/+$/, '').split('/').filter(Boolean);
    if (parts[0] === 'workspace') {
      setMode(AppMode.WORKSPACE);
      if (parts[1] === 'file' && parts[2]) setActiveFileId(parts[2]);
    } else if (parts[0] === 'academy') {
      setMode(AppMode.ACADEMY);
      if (parts[1] === 'subject' && parts[2]) setActiveSubjectId(parts[2]);
      if (parts[3] === 'lesson' && parts[4]) setActiveLessonId(parts[4]);
    }
  }, []);

  // If an active item is chosen elsewhere, ensure mode follows so URL updates correctly
  useEffect(() => {
    if (activeFileId) setMode(AppMode.WORKSPACE);
  }, [activeFileId]);

  useEffect(() => {
    if (activeSubjectId) setMode(AppMode.ACADEMY);
  }, [activeSubjectId]);

  const handleUpdateLesson = (updatedLesson: Lesson) => {
    setLessons(prev => prev.map(l => l.id === updatedLesson.id ? updatedLesson : l));
  };

  const handleUpdateFile = useCallback((fileId: string, content: string) => {
    setWorkspaceFiles(prev => prev.map(f => f.id === fileId ? { ...f, content } : f));
  }, []);

  const handleRenameFile = (id: string, newName: string) => {
    setWorkspaceFiles(prev => prev.map(f => f.id === id ? { ...f, name: newName } : f));
  };

  const handleCreateFile = (name: string, type: 'file' | 'folder', parentId: string | null, content?: string) => {
    const id = `${type}-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`;
    const newNode: FileNode = { 
      id, 
      name, 
      type, 
      parentId: parentId || 'root', 
      content: type === 'file' ? (content ?? '') : undefined, 
      isOpen: true 
    };
    setWorkspaceFiles(prev => [...prev, newNode]);
    if (type === 'file') {
      setActiveFileId(id);
      setOpenFiles(prev => [...new Set([...prev, id])]);
    }
    return id; 
  };

  const handleDeleteFile = (id: string) => {
    if (id === 'root') return;
    const toDelete = new Set([id]);
    const findChildren = (pid: string) => {
      workspaceFiles.forEach(f => {
        if (f.parentId === pid) {
          toDelete.add(f.id);
          findChildren(f.id);
        }
      });
    };
    findChildren(id);
    
    setWorkspaceFiles(prev => prev.filter(f => !toDelete.has(f.id)));
    setOpenFiles(prev => prev.filter(fid => !toDelete.has(fid)));
    if (activeFileId && toDelete.has(activeFileId)) setActiveFileId(null);
  };

  const handleToggleFolder = (id: string) => {
    setWorkspaceFiles(prev => prev.map(f => f.id === id ? { ...f, isOpen: !f.isOpen } : f));
  };

  const handleDownloadProject = async () => {
    const zip = new JSZip();
    const addNodeToZip = (parentId: string | null, path: string) => {
      workspaceFiles.filter(f => f.parentId === parentId).forEach(f => {
        const fullPath = path ? `${path}/${f.name}` : f.name;
        if (f.type === 'file') {
          zip.file(fullPath, f.content || '');
        } else {
          addNodeToZip(f.id, fullPath);
        }
      });
    };
    addNodeToZip('root', '');
    const content = await zip.generateAsync({ type: 'blob' });
    const url = URL.createObjectURL(content);
    const a = document.createElement('a');
    a.href = url;
    a.download = `devforge-project-${Date.now()}.zip`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="flex flex-col h-screen overflow-hidden bg-[#0d1117] text-[#c9d1d9]">
      <Navbar 
        mode={mode} 
        setMode={setMode} 
        isAdmin={isAdmin} 
        openAdminLogin={() => setShowAdminLogin(true)} 
        onLogout={() => setIsAdmin(false)}
        activeSubjectId={activeSubjectId}
        onClearSubject={() => setActiveSubjectId(null)}
        onDownload={handleDownloadProject}
        onSearch={handleSearch}
      />

      <div className="flex-1 flex overflow-hidden">
        {mode === AppMode.ACADEMY ? (
          activeSubjectId ? (
            <AcademyMode 
              lessons={lessons.filter(l => l.subjectId === activeSubjectId)} 
              activeLessonId={activeLessonId || ''} 
              setActiveLessonId={setActiveLessonId} 
              isAdmin={isAdmin} 
              onUpdateLesson={handleUpdateLesson}
              setLessons={setLessons}
              subjectId={activeSubjectId}
            />
          ) : (
            <Dashboard 
              subjects={subjects} 
              onSelectSubject={setActiveSubjectId} 
              isAdmin={isAdmin}
              onAddSubject={() => {}}
              onDeleteSubject={() => {}}
            />
          )
        ) : (
          <div className="flex flex-col flex-1 overflow-hidden">
            <WorkspaceMode 
              files={workspaceFiles} 
              activeFileId={activeFileId} 
              setActiveFileId={setActiveFileId}
              openFiles={openFiles}
              setOpenFiles={setOpenFiles}
              onUpdateFile={handleUpdateFile}
              onRenameFile={handleRenameFile}
              onCreateFile={handleCreateFile}
              onDeleteFile={handleDeleteFile}
              onToggleFolder={handleToggleFolder}
              autoSaveInterval={autoSaveInterval}
              setAutoSaveInterval={setAutoSaveInterval}
            />
          </div>
        )}
      </div>

      {showAdminLogin && (
        <AdminPortal 
          onLogin={() => { setIsAdmin(true); setShowAdminLogin(false); }} 
          onClose={() => setShowAdminLogin(false)} 
        />
      )}
    </div>
  );
};

export default App;