import React, { useEffect, useRef, useState } from 'react';
import { Terminal } from '@xterm/xterm';
import { FitAddon } from '@xterm/addon-fit';
import { WebLinksAddon } from '@xterm/addon-web-links';
import '@xterm/xterm/css/xterm.css';
import { TerminalLog } from '../types';

interface XTermTerminalProps {
  logs?: TerminalLog[]; // If provided, run in "fake" / host-integrated mode (Workspace)
  onCommand?: (cmd: string) => void; // Handler for commands when running in integrated mode
  onControlSignal?: (signal: string) => void; // Ctrl+C, Escape, etc.
  image?: string; // optional image key (node, python, ubuntu) for container sessions
}

const XTermTerminal: React.FC<XTermTerminalProps> = ({ 
  logs = [], 
  onCommand, 
  onControlSignal, 
  image 
}) => {
  const terminalRef = useRef<HTMLDivElement>(null);
  const [input, setInput] = useState('');
  const termRef = useRef<Terminal | null>(null);
  const fitAddonRef = useRef<FitAddon | null>(null);

  // Initialize terminal
  useEffect(() => {
    if (!terminalRef.current) return;

    const term = new Terminal({
      cursorBlink: true,
      fontSize: 14,
      theme: {
        background: '#0d1117',
        foreground: '#c9d1d9',
        cursor: '#c9d1d9',
        selection: '#21262d'
      }
    });

    const fitAddon = new FitAddon();
    term.loadAddon(fitAddon);
    
    const webLinksAddon = new WebLinksAddon();
    term.loadAddon(webLinksAddon);

    term.open(terminalRef.current);
    fitAddon.fit();
    
    termRef.current = term;
    fitAddonRef.current = fitAddon;

    // Write initial logs if any
    if (logs.length > 0) {
      logs.forEach(log => {
        term.writeln(`[${log.timestamp.toLocaleTimeString([], { hour12: false })}] ${log.content}`);
      });
    }

    // Handle terminal resize
    const handleResize = () => {
      if (fitAddonRef.current) {
        fitAddonRef.current.fit();
      }
    };

    window.addEventListener('resize', handleResize);

    // Handle command submission
    term.onData((data) => {
      if (onCommand) {
        // For now, we'll submit the command when Enter is pressed
        if (data === '\r') { // Enter key
          if (input.trim()) {
            onCommand(input);
            term.writeln(`\r\n$ ${input}`); // Echo the command
            setInput('');
          }
        } else if (data === '\u007F') { // Backspace
          if (input.length > 0) {
            setInput(prev => prev.slice(0, -1));
            term.write('\b \b'); // Erase character
          }
        } else if (data === '\x03') { // Ctrl+C
          if (onControlSignal) {
            onControlSignal('C');
          }
          term.write('^C\r\n'); // Show ^C
          setInput('');
        } else if (data.length === 1) {
          // Regular character input
          setInput(prev => prev + data);
          term.write(data);
        }
      }
    });

    return () => {
      window.removeEventListener('resize', handleResize);
      term.dispose();
    };
  }, [logs, onCommand, onControlSignal, image]);

  // Handle new logs
  useEffect(() => {
    if (termRef.current && logs.length > 0) {
      const lastLog = logs[logs.length - 1];
      termRef.current.writeln(`[${lastLog.timestamp.toLocaleTimeString([], { hour12: false })}] ${lastLog.content}`);
    }
  }, [logs]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (input.trim() && onCommand) {
      onCommand(input);
      setInput('');
    }
  };

  return (
    <div className="flex-1 flex flex-col bg-[#0d1117] overflow-hidden">
      <div ref={terminalRef} className="flex-1" />
      <form className="border-t border-[#30363d] bg-[#161b22] p-2" onSubmit={handleSubmit}>
        <div className="flex gap-2">
          <input 
            value={input} 
            onChange={(e) => setInput(e.target.value)} 
            className="flex-1 bg-[#0b0f13] border border-[#30363d] rounded px-2 py-1 text-xs text-white" 
            placeholder="Type a command and press Enter" 
          />
          <button type="submit" className="px-3 py-1 bg-[#238636] rounded text-white">Run</button>
        </div>
      </form>
    </div>
  );
};

export default XTermTerminal;