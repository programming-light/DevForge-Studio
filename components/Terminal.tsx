
import React, { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import { TerminalLog } from '../types';
// Load the emulator robustly — some bundlers export it as default, other times as named
// @ts-ignore - no types bundled for this lib sometimes
import * as RCE from 'react-console-emulator';
const ConsoleComp: any = (RCE as any).default ?? (RCE as any).Console;

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
    };

    newWs.onmessage = event => {
      const content = event.data;
      setTerminalOutput(prev => [...prev, { type: 'log', content: content, timestamp: new Date() }]);
    };

    newWs.onerror = err => {
      setError('WebSocket connection error.');
      setTerminalOutput(prev => [...prev, { type: 'error', content: `WebSocket error: ${err?.message || String(err)}`, timestamp: new Date() }]);
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
  const endRef = useRef<HTMLDivElement>(null);

  // If onCommand is provided, operate in "integrated" fake mode (Workspace). Otherwise, use WebSocket.
  const isIntegrated = typeof onCommand === 'function';
  const { terminalOutput: wsOutput, sendCommand: sendToWs, sendSignal, isConnected, error: wsError } = useWebSocketTerminal(!isIntegrated, image);

  const displayLogs = logs.length ? logs : wsOutput;

  // small connected-image banner when connected to a container image
  const ConnectedBanner = () => (
    isConnected && image ? <div className="px-3 py-1 text-[11px] text-[#8b949e] bg-[#081017] border-b border-[#20303a]">Connected to container image: <span className="text-white ml-1">{image}</span></div> : null
  );

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [displayLogs]);

  // Capture Ctrl+C and Escape to send control signals when using the WS-backed terminal
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      // only when NOT using integrated fake mode
      if (isIntegrated) return;
      if ((e.ctrlKey && e.key === 'c') || e.key === 'Escape') {
        e.preventDefault();
        // Try to send signal over WebSocket first
        if (sendSignal) sendSignal('SIGINT');
        // Also call optional callback
        onControlSignal && onControlSignal('SIGINT');
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [isIntegrated, onControlSignal, sendSignal]);

  const run = useCallback((rawCmd: string) => {
    const trimmed = rawCmd.trim();
    if (!trimmed) return 'No command entered';

    if (isIntegrated && onCommand) {
      onCommand(trimmed);
      // Output is appended to the logs in parent; show a hint here
      return '';
    }

    // WebSocket fallback
    sendToWs(trimmed);
    return '';
  }, [isIntegrated, onCommand, sendToWs]);

  const makeCmd = useCallback((name: string, usage: string, help: string) => {
    return {
      description: help,
      usage,
      fn: (...args: any[]) => {
        const cmd = [name, ...args].join(' ').trim();
        return run(cmd);
      }
    };
  }, [run]);

  const commands = useMemo(() => ({
    clear: makeCmd('clear', 'clear', 'Clear the terminal output'),
    ls: makeCmd('ls', 'ls', 'List files in the current directory'),
    pwd: makeCmd('pwd', 'pwd', 'Print working directory'),
    mkdir: makeCmd('mkdir', 'mkdir <name>', 'Create a new folder'),
    touch: makeCmd('touch', 'touch <name>', 'Create a new file'),
    cd: makeCmd('cd', 'cd <path>', 'Change directory'),
    cat: makeCmd('cat', 'cat <file>', 'Print file contents'),
    node: makeCmd('node', 'node <file.js>', 'Run JavaScript file (simulated in workspace)'),
    npm: {
      description: 'npm commands (simulated)',
      usage: 'npm <subcommand> ...',
      fn: (...args: any[]) => {
        const cmd = ['npm', ...args].join(' ');
        return run(cmd);
      }
    },
    python: makeCmd('python', 'python <script.py>', 'Run python script (Pyodide if available)'),
    pip: {
      description: 'pip commands (simulated)',
      usage: 'pip install <pkg>',
      fn: (...args: any[]) => run(['pip', ...args].join(' ')),
    },
    help: {
      description: 'Show help',
      usage: 'help',
      fn: () => 'Supported commands: clear, ls, pwd, mkdir, touch, cd, cat, node, npm, python, pip'
    }
  }), [makeCmd, run]);

  return (
    <div className="flex-1 flex flex-col bg-[#0d1117] overflow-hidden cursor-text select-text">
      <div className="flex-1 flex flex-col">
        <ConnectedBanner />
        <div className="flex-1 p-4 overflow-y-auto font-mono text-xs leading-relaxed space-y-1 custom-scrollbar">
          {!isIntegrated && !isConnected && <div className="text-[#f85149]">Connecting to terminal server...</div>}
          {wsError && <div className="text-[#f85149]">WebSocket Error: {wsError}</div>}

          {displayLogs.map((log, i) => (
          <div key={i} className="flex group">
            <span className="text-[#484f58] shrink-0 mr-3 select-none opacity-40">[{log.timestamp.toLocaleTimeString([], { hour12: false })}]</span>
            <span className={`${
              log.type === 'error' ? 'text-[#f85149]' :
              log.type === 'info' ? 'text-[#58a6ff]' : 'text-[#e6edf3]'
            } break-all whitespace-pre-wrap flex-1`}>
              {log.content}
            </span>
          </div>
        ))}
        <div ref={endRef} />
      </div>

      <div className="border-t border-[#30363d] bg-[#161b22] p-2 flex flex-col min-h-0">
        <div className="flex-1 min-h-0">
          {ConsoleComp ? (
            <ConsoleComp
              commands={commands}
              welcomeMessage={false}
              promptLabel={"sh>"}
              noAutoScroll={false}
              noDefaults={true}
              autofocus={true}
              style={{ height: '100%', background: 'transparent', border: 'none', fontFamily: "'Fira Code', monospace", overflow: 'auto' }}
            />
          ) : (
            <div className="p-2">
              <div className="text-yellow-400">Terminal UI not available (react-console-emulator missing).</div>
              <div className="mt-2 flex">
                <input className="flex-1 bg-[#0b0f13] border border-[#30363d] rounded px-2 py-1 text-xs text-white" placeholder="Type a command and press Enter" onKeyDown={(e) => { if (e.key === 'Enter') { run((e.target as HTMLInputElement).value); (e.target as HTMLInputElement).value = ''; } }} />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Terminal;

