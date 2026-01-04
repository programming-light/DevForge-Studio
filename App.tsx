import React, { useState, useEffect, useCallback } from 'react';
import { AppMode, Lesson, Subject, FileNode } from './types';
import { INITIAL_LESSONS, INITIAL_WORKSPACE, INITIAL_SUBJECTS } from './constants';
import Navbar from './components/Navbar';
import AcademyMode from './components/AcademyMode';
import WorkspaceMode from './components/WorkspaceMode';
import AdminPortal from './components/AdminPortal';
import Dashboard from './components/Dashboard';
import JSZip from 'jszip';

const App: React.FC = () => {
  const [mode, setMode] = useState<AppMode>(() => {
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