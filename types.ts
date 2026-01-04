export enum AppMode {
  ACADEMY = 'ACADEMY',
  WORKSPACE = 'WORKSPACE'
}

export enum Environment {
  STANDARD = 'STANDARD',
  NODEJS = 'NODEJS',
  PYTHON = 'PYTHON'
}

export interface Subject {
  id: string;
  title: string;
  icon: string;
  description: string;
  color: string;
}

export interface Lesson {
  id: string;
  subjectId: string;
  level: 1 | 2 | 3;
  title: string;
  description: string;
  initialCode: string;
  userCode?: string; 
  completed: boolean;
  validationRegex?: string; // Regex to check if the user's code is correct
  successMessage?: string;   // Custom message on success
  solution?: string;         // Hidden solution for the user
}

export interface FileNode {
  id: string;
  name: string;
  type: 'file' | 'folder';
  content?: string;
  parentId: string | null;
  isOpen?: boolean;
}

export interface TerminalLog {
  type: 'log' | 'error' | 'info';
  content: string;
  timestamp: Date;
}

export interface UserState {
  isAdmin: boolean;
  activeSubjectId: string | null;
  activeLessonId: string | null;
  completedLessons: string[];
  activeFileId: string | null;
  openFiles: string[];
}