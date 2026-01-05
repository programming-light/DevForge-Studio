export type FileMap = Record<string, string>;

// WebContainer client removed. Use the server-side terminal at /ws/pty instead.
// This stub preserves the public API shape so importing code won't crash, but
// it will throw at runtime to make it obvious the WebContainer approach is gone.
export default class WebcontainerManager {
  async init() {
    throw new Error('WebContainer removed. Use server-side terminal via WebSocket at /ws/pty');
  }

  async writeFiles(_files: FileMap) {
    throw new Error('WebContainer removed. Use server-side terminal instead');
  }

  async runCommand(_command: string, _onOutput: (chunk: string) => void): Promise<number> {
    throw new Error('WebContainer removed. Use server-side terminal instead');
  }

  async getNodeVersion(): Promise<string> {
    throw new Error('WebContainer removed. Use server-side terminal instead');
  }

  async destroy() {
    // no-op
  }
} 
