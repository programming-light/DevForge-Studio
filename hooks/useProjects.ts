import { useState, useEffect, useCallback } from 'react';
import { FileNode, Project } from '../types';

const DB_NAME = 'ProjectDB';
const DB_VERSION = 1;
const STORE_NAME = 'projects';

const openDB = (): Promise<IDBDatabase> => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'id', autoIncrement: true });
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
};

export const useProjects = (
  files: FileNode[],
  onDeleteFile: (id: string) => void,
  onCreateFile: (name: string, type: 'file' | 'folder', parentId: string | null, content?: string) => string,
  setActiveFileId: (id: string | null) => void,
  setOpenFiles: React.Dispatch<React.SetStateAction<string[]>>
) => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);

  const loadProjects = useCallback(async () => {
    setLoading(true);
    try {
      const db = await openDB();
      const transaction = db.transaction(STORE_NAME, 'readonly');
      const store = transaction.objectStore(STORE_NAME);
      const getAllRequest = store.getAll();
      getAllRequest.onsuccess = () => {
        setProjects(getAllRequest.result);
        setLoading(false);
      };
      getAllRequest.onerror = (event) => {
        console.error('Error loading projects:', event);
        setLoading(false);
      };
    } catch (error) {
      console.error('Error opening IndexedDB for projects:', error);
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadProjects();
  }, [loadProjects]);

  const saveProject = useCallback(async (projectName: string) => {
    try {
      const db = await openDB();
      const transaction = db.transaction(STORE_NAME, 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      const projectData: Omit<Project, 'id'> = {
        name: projectName,
        files,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      const addRequest = store.add(projectData);
      addRequest.onsuccess = () => {
        loadProjects();
      };
      addRequest.onerror = (event) => {
        console.error('Error saving project:', event);
      };
    } catch (error) {
      console.error('Error opening IndexedDB for save:', error);
    }
  }, [files, loadProjects]);

  const loadProject = useCallback(async (projectId: number) => {
    try {
      const db = await openDB();
      const transaction = db.transaction(STORE_NAME, 'readonly');
      const store = transaction.objectStore(STORE_NAME);
      const getRequest = store.get(projectId);
      getRequest.onsuccess = () => {
        const project = getRequest.result as Project;
        if (project && project.files) {
          const currentFileIds = files.map(f => f.id).filter(id => id !== 'root');
          currentFileIds.forEach(id => onDeleteFile(id));
          project.files.forEach(file => {
            if (file.id !== 'root') {
              onCreateFile(file.name, file.type, file.parentId || null, file.content);
            }
          });
          const firstFile = project.files.find((f: FileNode) => f.type === 'file' && f.id !== 'root');
          if (firstFile) {
            setActiveFileId(firstFile.id);
            setOpenFiles([firstFile.id]);
          }
        }
      };
      getRequest.onerror = (event) => {
        console.error('Error loading project:', event);
      };
    } catch (error) {
      console.error('Error opening IndexedDB for load:', error);
    }
  }, [files, onDeleteFile, onCreateFile, setActiveFileId, setOpenFiles]);

  const deleteProject = useCallback(async (projectId: number) => {
    try {
      const db = await openDB();
      const transaction = db.transaction(STORE_NAME, 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      const deleteRequest = store.delete(projectId);
      deleteRequest.onsuccess = () => {
        loadProjects();
      };
      deleteRequest.onerror = (event) => {
        console.error('Error deleting project:', event);
      };
    } catch (error) {
      console.error('Error opening IndexedDB for delete:', error);
    }
  }, [loadProjects]);

  return { projects, loading, saveProject, loadProject, deleteProject };
};
