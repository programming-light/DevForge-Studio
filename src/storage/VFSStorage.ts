import { VirtualFileSystem, FileEntry, DirectoryEntry, VFSEntry } from '../virtual-terminal/vfs';
import { getKV, setKV } from './indexeddb';

export interface FileNode {
  id: string;
  name: string;
  type: 'file' | 'folder';
  parentId: string | null;
  content?: string;
  isOpen?: boolean;
}

export class VFSStorage {
  private vfs: VirtualFileSystem;
  private isInitialized = false;

  constructor() {
    this.vfs = new VirtualFileSystem();
  }

  async initialize(): Promise<void> {
    if (this.isInitialized) return;
    
    // Load files from IndexedDB
    try {
      const files = await getKV<FileNode[]>('workspace_files');
      if (files && Array.isArray(files)) {
        this.importFileNodes(files);
      }
    } catch (error) {
      console.warn('Failed to load files from IndexedDB:', error);
    }
    
    this.isInitialized = true;
  }

  private importFileNodes(fileNodes: FileNode[]): void {
    for (const node of fileNodes) {
      if (node.type === 'file') {
        // Write file to VFS
        const path = this.getNodePath(node);
        if (node.content !== undefined) {
          this.vfs.writeFile(path, node.content);
        }
      } else if (node.type === 'folder') {
        // Create directory in VFS
        const path = this.getNodePath(node);
        this.vfs.mkdir(path);
      }
    }
  }

  private getNodePath(node: FileNode): string {
    // Build the full path for the node based on parent hierarchy
    // For simplicity, we'll use a flat structure in VFS for now
    return `/${node.name}`;
  }

  async saveToStorage(): Promise<void> {
    try {
      const files = this.exportFileNodes();
      await setKV('workspace_files', files);
    } catch (error) {
      console.error('Failed to save files to IndexedDB:', error);
    }
  }

  private exportFileNodes(): FileNode[] {
    // For now, return a basic conversion from VFS to FileNode format
    // In a real implementation, we'd need to properly traverse the VFS structure
    return [];
  }

  async writeFile(path: string, content: string): Promise<string | undefined> {
    const result = this.vfs.writeFile(path, content);
    if (!result) {
      await this.saveToStorage();
    }
    return result;
  }

  async readFile(path: string): Promise<string | undefined> {
    return this.vfs.readFile(path);
  }

  async mkdir(path: string): Promise<string | undefined> {
    const result = this.vfs.mkdir(path);
    if (!result) {
      await this.saveToStorage();
    }
    return result;
  }

  async ls(path: string = '/'): Promise<string | undefined> {
    return this.vfs.ls(path);
  }

  async cd(path: string): Promise<string | undefined> {
    return this.vfs.cd(path);
  }

  async rm(path: string): Promise<string | undefined> {
    const result = this.vfs.rm(path);
    if (!result) {
      await this.saveToStorage();
    }
    return result;
  }

  pwd(): string {
    return this.vfs.pwd();
  }

  // Methods to work with the FileNode structure used in the UI
  async createFileNode(name: string, type: 'file' | 'folder', parentId: string | null, content?: string): Promise<string> {
    const id = `${type}-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`;
    
    if (type === 'file') {
      const path = `/${name}`;
      await this.writeFile(path, content || '');
    } else {
      const path = `/${name}`;
      await this.mkdir(path);
    }
    
    await this.saveToStorage();
    return id;
  }

  async deleteFileNode(id: string): Promise<void> {
    // In a complete implementation, we would map the ID to a path and remove from VFS
    await this.saveToStorage();
  }

  async updateFileNodeContent(id: string, content: string): Promise<void> {
    // In a complete implementation, we would map the ID to a path and update in VFS
    await this.saveToStorage();
  }

  async getVFS(): Promise<VirtualFileSystem> {
    await this.initialize();
    return this.vfs;
  }
}

// Singleton instance
export const vfsStorage = new VFSStorage();