import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Lesson, TerminalLog } from '../types';
import { CheckCircle, Play, X, Globe, Terminal as TerminalIcon, Menu, Sparkles, Code2, Link as LinkIcon, Eye, EyeOff, ChevronLeft } from 'lucide-react';
import CodeEditor from './CodeEditor';
import Preview from './Preview';
import Terminal from './Terminal';
import EntityLab from './EntityLab';
import usePyodide from '../hooks/usePyodide';

interface AcademyModeProps {
  lessons: Lesson[];
  activeLessonId: string;
  setActiveLessonId: (id: string) => void;
  isAdmin: boolean;
  onUpdateLesson: (lesson: Lesson) => void;
  setLessons: React.Dispatch<React.SetStateAction<Lesson[]>>;
  subjectId: string;
}

const MarkdownRenderer: React.FC<{ text: string }> = ({ text }) => {
  const parts = text.split(/(<div[\s\S]*?<\/div>)/g);
  
  return (
    <div className="space-y-6">
      {parts.map((part, idx) => {
        if (part.startsWith('<div')) {
          return <div key={idx} dangerouslySetInnerHTML={{ __html: part }} />;
        }

        const lines = part.split('\n');
        return lines.map((line, lIdx) => {
          if (line.startsWith('### ')) {
            return <h3 key={`${idx}-${lIdx}`} className="text-xl md:text-2xl font-black text-white mt-10 mb-6 border-l-4 border-blue-500 pl-5 uppercase tracking-tight">{line.replace('### ', '')}</h3>;
          }
          
          const textParts = line.split(/(\[.*?\]\(.*?\))/g);
          const formattedLine = textParts.map((tPart, i) => {
            const linkMatch = tPart.match(/\[(.*?)\]\((.*?)\)/);
            if (linkMatch) {
              return (
                <a key={i} href={linkMatch[2]} target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:text-blue-300 underline underline-offset-4 inline-flex items-center">
                  {linkMatch[1]} <LinkIcon className="w-3 h-3 ml-1" />
                </a>
              );
            }
            return tPart.split('**').map((innerPart, j) => j % 2 === 1 ? <strong key={j} className="text-white font-black tracking-wider px-0.5">{innerPart}</strong> : innerPart);
          });

          return line.trim() === '' ? <div key={`${idx}-${lIdx}`} className="h-2" /> : <p key={`${idx}-${lIdx}`} className="text-[#a1a1aa] leading-[1.8] text-[15px] md:text-lg font-medium">{formattedLine}</p>;
        });
      })}
    </div>
  );
};

const AcademyMode: React.FC<AcademyModeProps> = ({ 
  lessons, activeLessonId, setActiveLessonId, isAdmin, onUpdateLesson, setLessons, subjectId
}) => {
  const currentLesson = lessons.find(l => l.id === activeLessonId) || lessons[0];
  const [code, setCode] = useState((currentLesson?.userCode ?? currentLesson?.initialCode) || '');
  const [logs, setLogs] = useState<TerminalLog[]>([]);
  const [isValid, setIsValid] = useState(false);
  const [showSolution, setShowSolution] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 1024);

  const isHTMLSubject = subjectId === 'html';
  const showTerminalEnabled = subjectId !== 'html';
  const showTerminalOnly = subjectId === 'js' || subjectId === 'py';

  const [isSidebarOpen, setIsSidebarOpen] = useState(window.innerWidth > 1024);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false); // Default to false as requested
  const [isTerminalOpen, setIsTerminalOpen] = useState(showTerminalOnly);

  const prevValidRef = useRef(false);
  const { runPython } = usePyodide();

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 1024);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    if (currentLesson) {
      setCode(currentLesson.userCode ?? currentLesson.initialCode);
      setIsValid(false);
      setShowSolution(false);
      setIsPreviewOpen(currentLesson.completed && isHTMLSubject); // Only open if already mastered
      setIsTerminalOpen(showTerminalOnly);
      prevValidRef.current = currentLesson.completed;
    }
  }, [currentLesson?.id, isHTMLSubject, showTerminalOnly]);

  useEffect(() => {
    if (currentLesson?.validationRegex) {
      if (code === currentLesson.initialCode && !currentLesson.completed) {
        setIsValid(false);
        return;
      }

      const regex = new RegExp(currentLesson.validationRegex, 'i');
      const passed = regex.test(code);
      setIsValid(passed);
      
      // Auto-expand preview on first success
      if (passed && !prevValidRef.current) {
        if (isHTMLSubject || subjectId === 'css') {
          setIsPreviewOpen(true);
        }
      }
      prevValidRef.current = passed;

      if (passed && !currentLesson.completed) {
        onUpdateLesson({ ...currentLesson, completed: true, userCode: code });
      }
    }
  }, [code, currentLesson, onUpdateLesson, isHTMLSubject, subjectId]);

  const handleRunCode = async () => {
    setLogs([]);
    if (!isTerminalOpen) setIsTerminalOpen(true);
    if (subjectId === 'js') {
      try { 
        new Function(code)(); 
        setLogs([{content: '✓ Script executed successfully.', type: 'info', timestamp: new Date()}]); 
      } 
      catch (err: any) { setLogs([{content: err.message, type: 'error', timestamp: new Date()}]); }
    } else if (subjectId === 'py') {
      try { 
        const result = await runPython(code); 
        if (result) setLogs([{content: String(result), type: 'log', timestamp: new Date()}]); 
      } 
      catch (err: any) { setLogs([{content: err.message, type: 'error', timestamp: new Date()}]); }
    }
  };

  return (
    <div className="flex-1 flex overflow-hidden bg-[#0d1117]">
      {/* Sidebar Overlay for Mobile */}
      {isMobile && isSidebarOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[60]" onClick={() => setIsSidebarOpen(false)} />
      )}
      
      <aside className={`${isSidebarOpen ? (isMobile ? 'w-72 fixed inset-y-0 left-0 z-[70]' : 'w-80') : 'w-0'} bg-[#161b22] border-r border-[#30363d] flex flex-col transition-all duration-300 overflow-hidden shrink-0`}>
        <div className="p-6 border-b border-[#30363d] bg-[#1c2128] flex justify-between items-center shrink-0">
          <span className="text-[10px] font-black text-[#8b949e] uppercase tracking-[0.3em]">Module Index</span>
          {isMobile && <button onClick={() => setIsSidebarOpen(false)} className="p-1 text-[#8b949e] hover:text-white"><X className="w-5 h-5" /></button>}
        </div>
        <div className="flex-1 overflow-y-auto no-scrollbar">
          {lessons.map(l => (
            <button key={l.id} onClick={() => { setActiveLessonId(l.id); if(isMobile) setIsSidebarOpen(false); }} className={`w-full text-left px-6 py-4 text-sm transition-all border-l-4 ${activeLessonId === l.id ? 'bg-[#21262d] border-[#58a6ff] text-white' : 'border-transparent text-[#8b949e] hover:bg-[#1c2128]'}`}>
              <div className="flex items-center justify-between">
                <div className="flex flex-col min-w-0">
                   <span className="truncate font-bold">{l.title}</span>
                   {l.completed && <span className="text-[9px] font-black text-green-500 uppercase tracking-widest mt-0.5">Mastered</span>}
                </div>
                {l.completed && <CheckCircle className="w-4 h-4 text-green-500 shrink-0" />}
              </div>
            </button>
          ))}
        </div>
        <div className="p-4 border-t border-[#30363d] bg-[#0d1117]">
          <button 
            onClick={() => setShowSolution(!showSolution)}
            className="w-full py-2 bg-[#21262d] hover:bg-[#30363d] border border-[#30363d] rounded-lg text-[10px] font-black uppercase tracking-widest text-[#8b949e] hover:text-white transition-all flex items-center justify-center space-x-2"
          >
            {showSolution ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
            <span>{showSolution ? 'Hide Solution' : 'Show Solution'}</span>
          </button>
        </div>
      </aside>

      <main className="flex-1 flex flex-col min-w-0 relative">
        <header className="h-16 bg-[#161b22] border-b border-[#30363d] flex items-center justify-between px-6 z-20">
          <div className="flex items-center space-x-4">
            <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="p-2 text-[#8b949e] hover:text-white"><Menu className="w-5 h-5" /></button>
            <div className="flex flex-col min-w-0">
              <span className="text-[9px] font-black text-blue-400 uppercase tracking-widest opacity-70 mb-0.5 truncate">Academy Lab</span>
              <h1 className="text-sm md:text-xl font-black text-white uppercase tracking-tighter leading-none truncate">{currentLesson.title}</h1>
            </div>
          </div>
          <div className="flex items-center space-x-3">
            {isValid && (
              <div className="flex items-center space-x-2 px-3 py-1.5 bg-green-500/10 text-green-400 rounded-lg border border-green-500/20 animate-in zoom-in">
                <Sparkles className="w-4 h-4" />
                <span className="text-[9px] font-black uppercase tracking-widest hidden sm:inline">Verified Correct</span>
              </div>
            )}
            {showTerminalOnly && <button onClick={handleRunCode} className="px-4 py-1.5 bg-green-600 hover:bg-green-500 text-white rounded-lg text-[10px] font-black uppercase"><Play className="w-3.5 h-3.5 inline mr-2" />Run Code</button>}
          </div>
        </header>

        <div className="flex-1 flex overflow-hidden relative">
          <div className="flex-1 flex flex-col overflow-y-auto no-scrollbar bg-[#0d1117]">
            <div className="p-6 md:p-14 border-b border-[#30363d] bg-gradient-to-b from-[#161b22] to-transparent shrink-0">
              {isValid && currentLesson.successMessage && (
                <div className="mb-8 p-6 bg-green-500/10 border border-green-500/30 rounded-2xl animate-in fade-in slide-in-from-top-4">
                  <p className="text-green-200 font-bold">{currentLesson.successMessage}</p>
                </div>
              )}
              <MarkdownRenderer text={currentLesson.description} />
              
              {showSolution && currentLesson.solution && (
                <div className="mt-8 p-6 bg-blue-500/5 border border-blue-500/20 rounded-2xl animate-in zoom-in duration-200">
                  <div className="flex items-center space-x-2 mb-4 text-blue-400 font-black text-[10px] uppercase tracking-widest">
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Suggested Implementation</span>
                  </div>
                  <pre className="text-sm font-mono text-[#c9d1d9] bg-[#0d1117] p-4 rounded-xl border border-[#30363d] overflow-x-auto">
                    {currentLesson.solution}
                  </pre>
                </div>
              )}

              {currentLesson.title.includes('Entities') && <EntityLab />}
            </div>

            <div className="flex-1 flex flex-col min-h-[400px]">
              <div className="h-10 bg-[#1c2128] border-b border-[#30363d] flex items-center justify-between px-6 shrink-0">
                <div className="flex items-center space-x-3">
                  <Code2 className="w-3.5 h-3.5 text-blue-400" />
                  <span className="text-[9px] font-black text-[#8b949e] uppercase tracking-[0.3em]">Source Input Practice</span>
                </div>
                <div className="flex items-center space-x-2 lg:hidden">
                  {!showTerminalOnly && (
                    <button onClick={() => setIsPreviewOpen(!isPreviewOpen)} className={`p-2 rounded-lg ${isPreviewOpen ? 'text-blue-400 bg-blue-500/10' : 'text-[#8b949e]'}`}><Globe className="w-4 h-4" /></button>
                  )}
                  {showTerminalEnabled && (
                    <button onClick={() => setIsTerminalOpen(!isTerminalOpen)} className={`p-2 rounded-lg ${isTerminalOpen ? 'text-green-400 bg-green-500/10' : 'text-[#8b949e]'}`}><TerminalIcon className="w-4 h-4" /></button>
                  )}
                </div>
              </div>
              <div className="flex-1 relative">
                <CodeEditor key={activeLessonId} value={code} onChange={setCode} language={subjectId === 'py' ? 'python' : (subjectId === 'js' ? 'javascript' : 'html')} />
              </div>
            </div>
          </div>

          {/* Collapsible / Expandable Aside (Preview & Terminal) */}
          {(isPreviewOpen || isTerminalOpen) && (
            <aside className={`${isMobile ? 'fixed inset-0 z-[100] w-full' : 'w-[500px] border-l border-[#30363d] relative shrink-0'} bg-[#161b22] flex flex-col shadow-2xl transition-all duration-300 overflow-hidden`}>
              {!showTerminalOnly && isPreviewOpen && (
                <div className={`flex flex-col ${isTerminalOpen ? 'h-1/2' : 'h-full'} border-b border-[#30363d]`}>
                  <div className="p-4 bg-[#1c2128] border-b border-[#30363d] flex justify-between items-center px-6 text-[10px] font-black text-[#8b949e] uppercase tracking-widest shrink-0">
                    <div className="flex items-center space-x-2"><Globe className="w-4 h-4 text-blue-400" /><span>Practice Preview</span></div>
                    <button onClick={() => setIsPreviewOpen(false)} className="p-1 hover:text-white transition-colors bg-[#0d1117] rounded-lg border border-[#30363d] lg:border-none lg:bg-transparent">
                      <X className="w-5 h-5 lg:w-4 lg:h-4" />
                    </button>
                  </div>
                  <div className="flex-1 relative overflow-hidden bg-white">
                    <Preview code={code} language={subjectId} />
                  </div>
                </div>
              )}
              {isTerminalOpen && showTerminalEnabled && (
                <div className={`flex flex-col ${!showTerminalOnly && isPreviewOpen ? 'h-1/2' : 'flex-1'} bg-[#0d1117]`}>
                  <div className="p-4 bg-[#1c2128] border-b border-[#30363d] flex justify-between items-center px-6 text-[10px] font-black text-[#8b949e] uppercase tracking-widest shrink-0">
                    <div className="flex items-center space-x-2"><TerminalIcon className="w-4 h-4 text-green-500" /><span>Console Output</span></div>
                    <button onClick={() => setIsTerminalOpen(false)} className="p-1 hover:text-white transition-colors bg-[#0d1117] rounded-lg border border-[#30363d] lg:border-none lg:bg-transparent">
                      <X className="w-5 h-5 lg:w-4 lg:h-4" />
                    </button>
                  </div>
                  <Terminal logs={logs} />
                </div>
              )}
              {isMobile && (
                <button 
                  onClick={() => { setIsPreviewOpen(false); setIsTerminalOpen(false); }}
                  className="fixed bottom-6 right-6 p-4 bg-blue-600 text-white rounded-full shadow-2xl flex items-center space-x-2 animate-in slide-in-from-bottom-10"
                >
                  <ChevronLeft className="w-5 h-5" />
                  <span className="text-xs font-black uppercase tracking-widest">Back to Code</span>
                </button>
              )}
            </aside>
          )}

          {/* Right Toolbar */}
          <div className="w-14 bg-[#0d1117] border-l border-[#30363d] hidden lg:flex flex-col items-center pt-8 space-y-8 z-30 shrink-0">
            {!showTerminalOnly && (
              <button onClick={() => setIsPreviewOpen(!isPreviewOpen)} className={`p-3 rounded-xl transition-all ${isPreviewOpen ? 'text-blue-400 bg-blue-500/10 border border-blue-500/20' : 'text-[#484f58] hover:text-white'}`}><Globe className="w-5 h-5" /></button>
            )}
            {showTerminalEnabled && (
              <button onClick={() => setIsTerminalOpen(!isTerminalOpen)} className={`p-3 rounded-xl transition-all ${isTerminalOpen ? 'text-green-400 bg-green-500/10 border border-green-500/20' : 'text-[#484f58] hover:text-white'}`}><TerminalIcon className="w-5 h-5" /></button>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default AcademyMode;