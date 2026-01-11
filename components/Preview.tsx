import React, { useMemo, useState, useEffect } from 'react';

interface PreviewProps {
  code: string;
  language?: string;
  dependencies?: Record<string, string>;
  showWelcome?: boolean;
}

const Preview: React.FC<PreviewProps> = ({ code, language = 'html', dependencies = {}, showWelcome = false }) => {
  const [isFullscreen, setIsFullscreen] = useState(false);
  
  // Add event listener to handle manual exit from fullscreen
  useEffect(() => {
    const handleFullscreenChange = () => {
      if (!document.fullscreenElement) {
        setIsFullscreen(false);
      }
    };
    
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    
    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
    };
  }, []);
  const srcDoc = useMemo(() => {
    if (showWelcome) {
      return `
        <!DOCTYPE html>
        <html>
          <head>
            <script src="https://cdn.tailwindcss.com"></script>
            <style>
              @keyframes float {
                0% { transform: translateY(0px); }
                50% { transform: translateY(-10px); }
                100% { transform: translateY(0px); }
              }
              .animate-float { animation: float 3s ease-in-out infinite; }
              body { background-color: #0d1117; color: #c9d1d9; margin: 0; display: flex; align-items: center; justify-content: center; min-height: 100vh; font-family: sans-serif; }
            </style>
          </head>
          <body>
            <div class="text-center p-10">
              <div class="animate-float mb-8">
                <div class="w-24 h-24 bg-gradient-to-br from-blue-600 to-indigo-700 rounded-3xl shadow-2xl flex items-center justify-center mx-auto">
                  <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="16 18 22 12 16 6"></polyline><polyline points="8 6 2 12 8 18"></polyline><line x1="12" y1="2" x2="12" y2="22"></line></svg>
                </div>
              </div>
              <h1 class="text-4xl font-black text-white mb-4 tracking-tighter">DevForge Studio</h1>
              <p class="text-xl text-[#8b949e] max-w-md mx-auto mb-8 font-medium leading-relaxed">
                Professional Engineering Environment.
              </p>
            </div>
          </body>
        </html>
      `;
    }

    const importMap = {
      imports: {
        "react": "https://esm.sh/react@19.0.0",
        "react-dom": "https://esm.sh/react-dom@19.0.0",
        "react-dom/client": "https://esm.sh/react-dom@19.0.0/client",
        ...dependencies
      }
    };

    const commonStyles = `
      body { 
        margin: 0; 
        padding: 20px; 
        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; 
        background: #0d1117; 
        color: #c9d1d9; 
        transition: all 0.3s ease;
      }
    `;

    const errorHandlerScript = `
      <script>
        // Suppress React DevTools and external error parsers (stackframe/error-stack-parser)
        window.__REACT_DEVTOOLS_GLOBAL_HOOK__ = { isDisabled: true };
        window.process = { env: { NODE_ENV: 'production' } };

        window.onerror = function(msg, url, line, col, error) {
          // If msg is an Event object, it's often a resource load failure (like stackframe failing to load)
          if (msg instanceof Event || (typeof msg === 'object' && msg !== null)) {
            // Check if it's a script load failure we want to ignore
            const target = msg.target || msg.srcElement;
            if (target && target.tagName === 'SCRIPT') {
              console.warn("DevForge blocked a background module load attempt:", target.src);
              return true; 
            }
            msg = error ? error.message : "Runtime Exception (Check Console)";
          }
          
          if (typeof msg === 'string' && (msg.includes('stackframe') || msg.includes('error-stack-parser'))) {
            return true; // Silent suppress for known noisy dev dependencies
          }

          const fullMessage = error && error.stack ? error.stack : (typeof msg === 'object' ? JSON.stringify(msg) : msg);
          
          const errorContainer = document.createElement('div');
          errorContainer.style = "color: #f85149; background: #161b22; border: 1px solid #30363d; padding: 15px; border-radius: 8px; font-family: monospace; font-size: 12px; white-space: pre-wrap; margin: 10px; z-index: 9999; position: relative;";
          errorContainer.innerHTML = '<h3 style="margin-top:0; font-size: 14px;">Environment Exception</h3>' + fullMessage;
          
          if (document.body) {
            document.body.prepend(errorContainer);
          } else {
            document.documentElement.prepend(errorContainer);
          }
          return true; 
        };

        window.addEventListener('unhandledrejection', function(event) {
          if (event.reason && typeof event.reason.message === 'string') {
            const m = event.reason.message;
            if (m.includes('stackframe') || m.includes('error-stack-parser')) {
              event.preventDefault();
              return;
            }
          }
        });
      </script>
    `;

    if (language === 'py' || language === 'python') {
      return `
        <html>
          <body style="background: #0d1117; color: #8b949e; font-family: sans-serif; display: flex; align-items: center; justify-content: center; height: 100vh; margin: 0; text-align: center;">
            <div><h2 style="color: #58a6ff;">Python Runtime Mode</h2><p>Results are in the Terminal.</p></div>
          </body>
        </html>
      `;
    }

    if (language === 'css') {
      return `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="UTF-8" />
            <style>
              ${commonStyles}
              ${code}
            </style>
            ${errorHandlerScript}
          </head>
          <body>
            <div class="container">
              <h1>CSS Practice Area</h1>
              <p>Apply styles to the classes below to see changes.</p>
              <div class="box">.box</div>
              <div class="card">
                <h3>.card h3</h3>
                <p>Card content text.</p>
                <button class="btn">.btn</button>
              </div>
            </div>
            <style>
              .container { border: 1px dashed #30363d; padding: 20px; border-radius: 12px; }
              .box { width: 80px; height: 80px; background: #21262d; border: 1px solid #30363d; display: flex; align-items: center; justify-content: center; margin: 15px 0; border-radius: 8px; font-family: monospace; }
              .card { background: #161b22; border: 1px solid #30363d; padding: 15px; border-radius: 12px; margin-top: 20px; }
              .btn { background: #238636; color: white; border: none; padding: 8px 16px; border-radius: 6px; cursor: pointer; margin-top: 10px; }
              h1 { margin-top: 0; color: #58a6ff; font-size: 24px; }
            </style>
          </body>
        </html>
      `;
    }

    const isRawWeb = language === 'html';

    if (isRawWeb) {
      const hasHtmlTag = code.toLowerCase().includes('<html');
      if (hasHtmlTag) return code.replace('<head>', '<head>' + errorHandlerScript);

      return `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="UTF-8" />
            <style>${commonStyles}</style>
            ${errorHandlerScript}
          </head>
          <body>${code}</body>
        </html>
      `;
    }

    return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="UTF-8" />
          <script type="importmap">${JSON.stringify(importMap)}</script>
          <script src="https://unpkg.com/@babel/standalone/babel.min.js"></script>
          <style>${commonStyles}</style>
          ${errorHandlerScript}
        </head>
        <body>
          <div id="root"></div>
          <script type="text/babel" data-type="module">
            import React from 'react';
            import { createRoot } from 'react-dom/client';
            try {
              ${code}
              const rootElement = document.getElementById('root');
              if (rootElement && !rootElement.hasChildNodes()) {
                if (typeof App !== 'undefined') {
                  createRoot(rootElement).render(<App />);
                } else if (typeof Main !== 'undefined') {
                  createRoot(rootElement).render(<Main />);
                }
              }
            } catch (err) {
              console.error(err);
              const root = document.getElementById('root');
              if (root) {
                root.innerHTML = '<div style="color: #f85149; background: #161b22; border: 1px solid #30363d; padding: 15px; border-radius: 8px; font-family: monospace;"><h3>Module Crash</h3>' + (err.stack || err.message || err) + '</div>';
              }
            }
          </script>
        </body>
      </html>
    `;
  }, [code, language, dependencies, showWelcome]);

  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
    
    // Request fullscreen if not already in fullscreen
    if (!isFullscreen) {
      const iframe = document.querySelector('iframe[title="DevForge Preview"]');
      if (iframe && iframe.requestFullscreen) {
        iframe.requestFullscreen().catch(e => console.log('Fullscreen request failed:', e));
      }
    } else {
      // Exit fullscreen if currently in fullscreen
      if (document.fullscreenElement) {
        document.exitFullscreen().catch(e => console.log('Fullscreen exit failed:', e));
      }
    }
  };

  return (
    <div className="w-full h-full relative">
      <div className="absolute top-2 right-2 z-10 flex gap-2">
        <button 
          onClick={toggleFullscreen}
          className="p-2 bg-[#161b22] border border-[#30363d] rounded-lg text-[#8b949e] hover:text-white hover:bg-[#30363d] transition-colors"
          title={isFullscreen ? 'Exit Fullscreen' : 'Enter Fullscreen'}
        >
          {isFullscreen ? (
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M8 3H5a2 2 0 0 0-2 2v3" />
              <path d="M21 8V5a2 2 0 0 0-2-2h-3" />
              <path d="M3 16v3a2 2 0 0 0 2 2h3" />
              <path d="M16 21h3a2 2 0 0 0 2-2v-3" />
            </svg>
          ) : (
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M8 3v3a2 2 0 0 1-2 2H3" />
              <path d="M21 8h-3a2 2 0 0 1-2-2V3" />
              <path d="M3 16h3a2 2 0 0 1 2 2v3" />
              <path d="M16 21v-3a2 2 0 0 1 2-2h3" />
            </svg>
          )}
        </button>
      </div>
      <iframe
        key={`${language}-${showWelcome}`}
        title="DevForge Preview"
        srcDoc={srcDoc}
        className={`w-full h-full border-none bg-[#0d1117] ${isFullscreen ? 'fixed inset-0 z-[100] w-screen h-screen' : ''}`}
        sandbox="allow-scripts allow-modals allow-same-origin"
      />
    </div>
  );
};

export default Preview;