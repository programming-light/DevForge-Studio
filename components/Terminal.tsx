
import React, { useEffect, useRef, useState, useCallback } from 'react';
import { TerminalLog } from '../types';

interface TerminalProps {
  logs?: TerminalLog[]; // If provided, run in "fake" / host-integrated mode (Workspace)
  onCommand?: (cmd: string) => void; // Handler for commands when running in integrated mode
  onControlSignal?: (signal: string) => void; // Ctrl+C, Escape, etc.
  image?: string; // optional image key (node, python, ubuntu) for container sessions
}

const useWebSocketTerminal = (enabled: boolean, image?: string) => {
  const wsRef = useRef<WebSocket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [terminalOutput, setTerminalOutput] = useState<TerminalLog[]>([]);

  useEffect(() => {
    if (!enabled) return;

    const proto = window.location.protocol === 'https:' ? 'wss' : 'ws';
    const host = window.location.host; // use same-origin host and port
    const q = image ? `?image=${encodeURIComponent(image)}` : '';
    const newWs = new WebSocket(`${proto}://${host}/ws/pty${q}`); // Connect to container PTY endpoint on same port

    newWs.onopen = () => {
      wsRef.current = newWs;
      setIsConnected(true);
      setError(null);
      setTerminalOutput(prev => [...prev, { type: 'info', content: 'Connected to terminal server.', timestamp: new Date() }]);
      // send an initial resize hint (cols/rows) to container PTY
      try { newWs.send(JSON.stringify({ type: 'resize', cols: 120, rows: 30 })); } catch (e) {}
      // Ask server to check available tools (npm, pip, yarn, pnpm, etc.)
      try { newWs.send(JSON.stringify({ type: 'check_tools' })); } catch (e) {}
    };

    newWs.onmessage = event => {
      const raw = event.data;
      // Try to parse JSON structured events (tool info, etc.), else fall back to raw text
      try {
        const obj = JSON.parse(String(raw));
        if (obj && obj.type === 'tool') {
          setTerminalOutput(prev => [...prev, { type: 'info', content: `${obj.tool}: ${obj.version || obj.error}`, timestamp: new Date() }]);
          return;
        }
        if (obj && obj.type === 'info') {
          setTerminalOutput(prev => [...prev, { type: 'info', content: obj.message, timestamp: new Date() }]);
          return;
        }
      } catch (e) {
        // not JSON
      }
      const content = raw;
      setTerminalOutput(prev => [...prev, { type: 'log', content: content, timestamp: new Date() }]);
    };

    newWs.onerror = (event) => {
      setError('WebSocket connection error.');
      setTerminalOutput(prev => [...prev, { type: 'error', content: `WebSocket error: ${event instanceof ErrorEvent ? event.message : 'WebSocket error'}`, timestamp: new Date() }]);
      setIsConnected(false);
    };

    newWs.onclose = () => {
      wsRef.current = null;
      setIsConnected(false);
      setTerminalOutput(prev => [...prev, { type: 'info', content: 'Disconnected from terminal server.', timestamp: new Date() }]);
    };

    wsRef.current = newWs;

    return () => {
      try { newWs.close(); } catch (e) {}
    };
  }, [enabled, image]);

  const sendCommand = useCallback((command: string) => {
    if (!enabled) {
      setTerminalOutput(prev => [...prev, { type: 'error', content: 'WebSocket not enabled for this terminal.', timestamp: new Date() }]);
      return;
    }
    if (wsRef.current && isConnected) {
      wsRef.current.send(command);
      setTerminalOutput(prev => [...prev, { type: 'info', content: `$ ${command}`, timestamp: new Date() }]);
    } else {
      setTerminalOutput(prev => [...prev, { type: 'error', content: 'Not connected to terminal server.', timestamp: new Date() }]);
    }
  }, [isConnected, enabled]);

  const sendSignal = useCallback((signal: string) => {
    try {
      if (wsRef.current && isConnected) wsRef.current.send(JSON.stringify({ type: 'signal', signal }));
    } catch (e) {
      setTerminalOutput(prev => [...prev, { type: 'error', content: `Failed to send signal: ${String(e)}`, timestamp: new Date() }]);
    }
  }, [isConnected]);

  return { terminalOutput, sendCommand, sendSignal, isConnected, error };
};

const Terminal: React.FC<TerminalProps> = ({ logs = [], onCommand, onControlSignal, image }) => {
  // Minimal, robust terminal render to avoid build-time JSX parsing issues.
  const { terminalOutput: wsOutput, sendCommand: sendToWs } = useWebSocketTerminal(true, image);
  const displayLogs = logs.length ? logs : wsOutput;
  const [input, setInput] = useState('');

  const handleSubmit = (e?: React.FormEvent) => {
    e?.preventDefault();
    const trimmed = input.trim();
    if (!trimmed) return;
    sendToWs(trimmed);
    setInput('');
  };

  return (
    <div className="flex-1 flex flex-col bg-[#0d1117] overflow-hidden cursor-text select-text">
      <div className="flex-1 p-4 overflow-y-auto font-mono text-xs leading-relaxed space-y-1 custom-scrollbar">
        {displayLogs.map((log, i) => (
          <div key={i} className="break-all whitespace-pre-wrap">
            <strong className="text-[#58a6ff]">[{log.timestamp.toLocaleTimeString([], { hour12: false })}]</strong> <span className={log.type === 'error' ? 'text-[#f85149]' : (log.type === 'info' ? 'text-[#58a6ff]' : 'text-[#e6edf3]')}>{log.content}</span>
          </div>
        ))}
      </div>

      <form className="border-t border-[#30363d] bg-[#161b22] p-2" onSubmit={handleSubmit}>
        <div className="flex gap-2">
          <input value={input} onChange={(e) => setInput(e.target.value)} className="flex-1 bg-[#0b0f13] border border-[#30363d] rounded px-2 py-1 text-xs text-white" placeholder="Type a command and press Enter" />
          <button type="submit" className="px-3 py-1 bg-[#238636] rounded text-white">Run</button>
        </div>
      </form>
    </div>
  );
};

export default Terminal;

