// src/virtual-terminal/vfs.ts

export type FileEntry = {
  type: 'file';
  name: string;
  content: string;
  timestamp: Date;
};

export type DirectoryEntry = {
  type: 'directory';
  name: string;
  children: Map<string, FileEntry | DirectoryEntry>;
  timestamp: Date;
};

export type VFSEntry = FileEntry | DirectoryEntry;

export class VirtualFileSystem {
  private root: DirectoryEntry;
  private currentWorkingDirectory: string;

  constructor() {
    this.root = {
      type: 'directory',
      name: '/',
      children: new Map(),
      timestamp: new Date(),
    };
    this.currentWorkingDirectory = '/';
  }

  // Helper to normalize paths (e.g., /a/b/../c -> /a/c)
  private normalizePath(path: string): string {
    const parts = path.split('/').filter(p => p !== '');
    const stack: string[] = [];
    for (const part of parts) {
      if (part === '..') {
        if (stack.length > 0) {
          stack.pop();
        }
      } else if (part !== '.') {
        stack.push(part);
      }
    }
    return '/' + stack.join('/');
  }

  // Helper to get an entry by path
  private getEntry(path: string): VFSEntry | undefined {
    let currentEntry: VFSEntry = this.root;
    const parts = path.split('/').filter(p => p !== '');

    for (const part of parts) {
      if (currentEntry.type === 'directory') {
        const nextEntry = currentEntry.children.get(part);
        if (!nextEntry) {
          return undefined;
        }
        currentEntry = nextEntry;
      } else {
        return undefined; // Cannot traverse into a file
      }
    }
    return currentEntry;
  }

  // Helper to get parent directory and its name
  private getParentAndName(path: string): { parent: DirectoryEntry | undefined; name: string } {
    const normalizedPath = this.normalizePath(path);
    const parts = normalizedPath.split('/').filter(p => p !== '');
    const name = parts.pop() || '';
    const parentPath = '/' + parts.join('/');
    const parentEntry = this.getEntry(parentPath);

    if (parentEntry && parentEntry.type === 'directory') {
      return { parent: parentEntry, name };
    }
    return { parent: undefined, name };
  }

  // Public VFS methods
  mkdir(path: string): string | undefined {
    const normalizedPath = this.normalizePath(path);
    const { parent, name } = this.getParentAndName(normalizedPath);

    if (!parent) {
      return `mkdir: ${path}: No such file or directory`;
    }
    if (parent.children.has(name)) {
      return `mkdir: ${path}: File exists`;
    }

    const newDir: DirectoryEntry = {
      type: 'directory',
      name: name,
      children: new Map(),
      timestamp: new Date(),
    };
    parent.children.set(name, newDir);
    return undefined; // Success
  }

  touch(path: string): string | undefined {
    const normalizedPath = this.normalizePath(path);
    const { parent, name } = this.getParentAndName(normalizedPath);

    if (!parent) {
      return `touch: ${path}: No such file or directory`;
    }

    if (parent.children.has(name)) {
      const entry = parent.children.get(name);
      if (entry && entry.type === 'file') {
        entry.timestamp = new Date(); // Update timestamp
        return undefined;
      } else {
        return `touch: ${path}: Is a directory`;
      }
    }

    const newFile: FileEntry = {
      type: 'file',
      name: name,
      content: '',
      timestamp: new Date(),
    };
    parent.children.set(name, newFile);
    return undefined; // Success
  }

  writeFile(path: string, content: string): string | undefined {
    const normalizedPath = this.normalizePath(path);
    const { parent, name } = this.getParentAndName(normalizedPath);

    if (!parent) {
      return `writeFile: ${path}: No such file or directory`;
    }

    const existingEntry = parent.children.get(name);
    if (existingEntry && existingEntry.type === 'directory') {
      return `writeFile: ${path}: Is a directory`;
    }

    const newFile: FileEntry = {
      type: 'file',
      name: name,
      content: content,
      timestamp: new Date(),
    };
    parent.children.set(name, newFile);
    return undefined; // Success
  }

  readFile(path: string): string | undefined {
    const normalizedPath = this.normalizePath(path);
    const entry = this.getEntry(normalizedPath);

    if (!entry) {
      return `cat: ${path}: No such file or directory`;
    }
    if (entry.type === 'directory') {
      return `cat: ${path}: Is a directory`;
    }
    return entry.content;
  }

  ls(path: string = this.currentWorkingDirectory): string | undefined {
    const normalizedPath = this.normalizePath(path);
    const entry = this.getEntry(normalizedPath);

    if (!entry) {
      return `ls: ${path}: No such file or directory`;
    }
    if (entry.type === 'file') {
      return entry.name; // If it's a file, just return its name
    }

    const childrenNames = Array.from(entry.children.keys()).sort();
    return childrenNames.join('\n');
  }

  cd(path: string): string | undefined {
    const targetPath = path.startsWith('/') ? path : this.normalizePath(this.currentWorkingDirectory + '/' + path);
    const normalizedTargetPath = this.normalizePath(targetPath);
    const entry = this.getEntry(normalizedTargetPath);

    if (!entry) {
      return `cd: ${path}: No such file or directory`;
    }
    if (entry.type === 'file') {
      return `cd: ${path}: Not a directory`;
    }

    this.currentWorkingDirectory = normalizedTargetPath;
    return undefined; // Success
  }

  rm(path: string): string | undefined {
    const normalizedPath = this.normalizePath(path);
    const { parent, name } = this.getParentAndName(normalizedPath);

    if (!parent) {
      return `rm: ${path}: No such file or directory`;
    }
    if (!parent.children.has(name)) {
      return `rm: ${path}: No such file or directory`;
    }

    const entryToRemove = parent.children.get(name);
    if (entryToRemove && entryToRemove.type === 'directory' && entryToRemove.children.size > 0) {
      return `rm: ${path}: Directory not empty`;
    }

    parent.children.delete(name);
    return undefined; // Success
  }

  pwd(): string {
    return this.currentWorkingDirectory;
  }
}
