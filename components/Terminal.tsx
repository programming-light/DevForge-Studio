
import React, { useEffect, useRef, useState } from 'react';
import { TerminalLog } from '../types';

interface TerminalProps {
  logs: TerminalLog[];
  onCommand?: (cmd: string) => void;
  interactive?: {
    type: 'select' | 'input';
    options?: string[];
    selectedIndex?: number;
    onSelect?: (index: number) => void;
  } | null;
}

const Terminal: React.FC<TerminalProps> = ({ logs, onCommand, interactive }) => {
  const endRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const [command, setCommand] = useState('');
  const [history, setHistory] = useState<string[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [logs, interactive]);

  useEffect(() => {
    inputRef.current?.focus();
  }, [interactive]);

  const handleTerminalClick = () => {
    inputRef.current?.focus();
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (interactive && interactive.type === 'select') return;

    const trimmed = command.trim();
    if (trimmed && onCommand) {
      onCommand(trimmed);
      setHistory(prev => [trimmed, ...prev].slice(0, 50));
      setHistoryIndex(-1);
      setCommand('');
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (interactive && interactive.type === 'select') {
      const optionsCount = interactive.options?.length || 0;
      const currentIndex = interactive.selectedIndex || 0;

      if (e.key === 'ArrowUp') {
        e.preventDefault();
        const nextIndex = (currentIndex - 1 + optionsCount) % optionsCount;
        interactive.onSelect?.(nextIndex);
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        const nextIndex = (currentIndex + 1) % optionsCount;
        interactive.onSelect?.(nextIndex);
      } else if (e.key === 'Enter') {
        e.preventDefault();
        const selection = interactive.options?.[currentIndex] || '';
        onCommand?.(selection);
      }
      return;
    }

    if (e.key === 'ArrowUp') {
      e.preventDefault();
      const nextIndex = historyIndex + 1;
      if (nextIndex < history.length) {
        setHistoryIndex(nextIndex);
        setCommand(history[nextIndex]);
      }
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      const nextIndex = historyIndex - 1;
      if (nextIndex >= 0) {
        setHistoryIndex(nextIndex);
        setCommand(history[nextIndex]);
      } else {
        setHistoryIndex(-1);
        setCommand('');
      }
    }
  };

  return (
    <div 
      className="flex-1 flex flex-col bg-[#0d1117] overflow-hidden cursor-text select-text"
      onClick={handleTerminalClick}
    >
      <div className="flex-1 p-4 overflow-y-auto font-mono text-xs leading-relaxed space-y-1 custom-scrollbar">
        {logs.map((log, i) => (
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

        {interactive && interactive.type === 'select' && (
          <div className="mt-2 ml-10 space-y-1 animate-in fade-in slide-in-from-left-2 duration-200">
            {interactive.options?.map((opt, idx) => (
              <div 
                key={opt} 
                className={`flex items-center space-x-3 cursor-pointer group/opt ${idx === interactive.selectedIndex ? 'text-[#58a6ff]' : 'text-[#8b949e]'}`}
                onClick={() => {
                  interactive.onSelect?.(idx);
                  onCommand?.(opt);
                }}
              >
                <span className="w-4 flex justify-center">
                  {idx === interactive.selectedIndex ? (
                    <span className="text-[#58a6ff] font-bold animate-pulse">❯</span>
                  ) : (
                    <span className="text-[#30363d] opacity-0 group-hover/opt:opacity-100 transition-opacity">○</span>
                  )}
                </span>
                <span className={`${idx === interactive.selectedIndex ? 'font-bold text-[#e6edf3]' : ''}`}>
                  {opt}
                </span>
              </div>
            ))}
            <div className="text-[10px] text-[#484f58] mt-6 flex items-center space-x-3 border-t border-[#30363d] pt-4 select-none">
              <div className="flex items-center space-x-1">
                <span className="px-1.5 py-0.5 border border-[#30363d] rounded bg-[#161b22]">↑↓</span>
                <span>to navigate</span>
              </div>
              <div className="flex items-center space-x-1">
                <span className="px-1.5 py-0.5 border border-[#30363d] rounded bg-[#161b22]">Enter</span>
                <span>to confirm</span>
              </div>
            </div>
          </div>
        )}

        <div ref={endRef} />
      </div>
      
      <form onSubmit={handleSubmit} className="px-4 py-3 border-t border-[#30363d] bg-[#161b22] flex items-center">
        <div className="flex items-center shrink-0 select-none mr-2">
          {interactive?.type === 'input' ? (
            <span className="text-[#58a6ff] font-bold text-xs animate-pulse w-4 text-center">?</span>
          ) : (
            <div className="flex items-center space-x-1 w-8">
              <span className="text-[#3fb950] font-bold text-xs">➜</span>
              <span className="text-[#58a6ff] font-bold text-xs">~</span>
            </div>
          )}
        </div>
        <input 
          ref={inputRef}
          type="text"
          autoFocus
          autoComplete="off"
          spellCheck="false"
          autoCorrect="off"
          className="flex-1 bg-transparent border-none outline-none text-[#e6edf3] text-xs m-0 p-0 block leading-normal"
          style={{ 
            fontFamily: "'Fira Code', 'Fira Mono', 'DejaVu Sans Mono', monospace",
            boxSizing: 'border-box',
            fontVariantLigatures: 'none',
            letterSpacing: '0px'
          }}
          placeholder={interactive ? "" : "Type 'clear' to clear output..."}
          value={command}
          onChange={e => setCommand(e.target.value)}
          onKeyDown={handleKeyDown}
        />
      </form>
    </div>
  );
};

export default Terminal;
