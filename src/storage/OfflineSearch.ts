import { FileNode } from '../../types';
import { vfsStorage } from './VFSStorage';

export interface SearchResult {
  id: string;
  name: string;
  path: string;
  contentPreview: string;
  score: number; // 0-1, higher is more relevant
}

export class OfflineSearchService {
  private static instance: OfflineSearchService;
  private index: Map<string, FileNode> = new Map();

  private constructor() {}

  static getInstance(): OfflineSearchService {
    if (!OfflineSearchService.instance) {
      OfflineSearchService.instance = new OfflineSearchService();
    }
    return OfflineSearchService.instance;
  }

  async initialize(files: FileNode[]): Promise<void> {
    this.index.clear();
    for (const file of files) {
      this.index.set(file.id, file);
    }
  }

  async updateIndex(files: FileNode[]): Promise<void> {
    await this.initialize(files);
  }

  async search(query: string): Promise<SearchResult[]> {
    if (!query.trim()) {
      return [];
    }

    const q = query.toLowerCase().trim();
    const results: SearchResult[] = [];

    for (const [id, file] of this.index.entries()) {
      let score = 0;
      let contentPreview = '';

      // Score based on filename match
      if (file.name.toLowerCase().includes(q)) {
        score += 0.6; // High score for filename match
      }

      // Score based on content match (if it's a file with content)
      if (file.content && file.content.toLowerCase().includes(q)) {
        score += 0.4; // Lower score for content match
        // Get a preview snippet around the match
        const contentLower = file.content.toLowerCase();
        const matchIndex = contentLower.indexOf(q);
        const start = Math.max(0, matchIndex - 50);
        const end = Math.min(file.content.length, matchIndex + q.length + 50);
        contentPreview = '...' + file.content.substring(start, end) + '...';
      }

      if (score > 0) {
        results.push({
          id: file.id,
          name: file.name,
          path: this.getPathForFile(file),
          contentPreview,
          score
        });
      }
    }

    // Sort by score (highest first)
    return results.sort((a, b) => b.score - a.score);
  }

  private getPathForFile(file: FileNode): string {
    // In a real implementation, this would construct the full path based on parent relationships
    return `/${file.name}`;
  }

  async searchInVFS(query: string): Promise<SearchResult[]> {
    // This would search directly in the VFS if needed
    // For now, we'll use the indexed approach
    return this.search(query);
  }
}

export const offlineSearchService = OfflineSearchService.getInstance();