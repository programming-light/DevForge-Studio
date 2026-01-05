import React, { useEffect, useRef } from 'react';
import * as emmetMonaco from 'emmet-monaco-es';

declare global {
  interface Window {
    monaco: any;
    require: any;
    MonacoEnvironment: any;
  }
}

interface CodeEditorProps {
  value: string;
  onChange: (val: string) => void;
  language?: string;
}

const CodeEditor: React.FC<CodeEditorProps> = ({ value, onChange, language = 'html' }) => {
  const editorRef = useRef<HTMLDivElement>(null);
  const monacoEditorRef = useRef<any>(null);
  const isUpdatingRef = useRef(false);
  
  const onChangeRef = useRef(onChange);
  useEffect(() => { onChangeRef.current = onChange; }, [onChange]);

  useEffect(() => {
    const MONACO_VERSION = '0.52.2';
    const CDN_BASE = `https://cdn.jsdelivr.net/npm/monaco-editor@${MONACO_VERSION}/min`;

    const getWorkerBlob = async (url: string) => {
      try {
        const response = await fetch(url);
        const code = await response.text();
        return URL.createObjectURL(new Blob([code], { type: 'application/javascript' }));
      } catch (e) {
        console.error("Worker fetch failed", e);
        return "";
      }
    };

    const workerCache: Record<string, string> = {};

    window.MonacoEnvironment = {
      getWorkerUrl: async function (_workerId: string, label: string) {
        let path = 'vs/editor/editor.worker.js';
        if (label === 'json') path = 'vs/language/json/json.worker.js';
        else if (label === 'css' || label === 'scss' || label === 'less') path = 'vs/language/css/css.worker.js';
        else if (label === 'html' || label === 'handlebars' || label === 'razor') path = 'vs/language/html/html.worker.js';
        else if (label === 'javascript' || label === 'typescript') path = 'vs/language/typescript/ts.worker.js';
        
        const url = `${CDN_BASE}/${path}`;
        if (!workerCache[url]) {
          workerCache[url] = await getWorkerBlob(url);
        }
        return workerCache[url];
      }
    };

    const loadMonaco = () => {
      if (!window.monaco) {
        const script = document.createElement('script');
        script.src = `${CDN_BASE}/vs/loader.js`;
        script.async = true;
        script.onload = () => {
          window.require.config({ paths: { vs: `${CDN_BASE}/vs` } });
          window.require(['vs/editor/editor.main'], () => initEditor());
        };
        document.head.appendChild(script);
      } else {
        initEditor();
      }
    };

    const initEditor = () => {
      if (!editorRef.current || monacoEditorRef.current) return;
      const monaco = window.monaco;



      const monacoLang = language === 'py' ? 'python' : 
                         (language === 'js' || language === 'javascript') ? 'javascript' : 
                         language;

      monacoEditorRef.current = monaco.editor.create(editorRef.current, {
        value: value,
        language: monacoLang,
        theme: 'vs-dark',
        automaticLayout: false, 
        fontSize: 14,
        fontFamily: "'Fira Code', 'JetBrains Mono', 'Consolas', 'Courier New', monospace",
        fontLigatures: true,
        minimap: { enabled: false },
        lineNumbers: 'on',
        scrollBeyondLastLine: false,
        wordWrap: 'on',
        autoClosingBrackets: 'always',
        autoClosingTags: 'always',
        autoClosingQuotes: 'always',
        formatOnType: true,
        formatOnPaste: true,
        suggestSelection: 'first',
        suggestOnTriggerCharacters: true,
        acceptSuggestionOnEnter: 'on',
        tabSize: 2,
        quickSuggestions: { other: true, comments: true, strings: true },
        renderLineHighlight: 'all',
        renderWhitespace: 'all',
        smoothScrolling: true,
        'bracketPairColorization.enabled': true,
        scrollbar: {
          vertical: 'visible',
          horizontal: 'visible',
          useShadows: false,
          verticalScrollbarSize: 10,
          horizontalScrollbarSize: 10
        }
      });

      // Initialize Emmet support based on language - do this BEFORE editor creation
      // Enhanced Emmet support for more languages
      if (['html', 'xml', 'xhtml', 'php', 'twig', 'blade', 'handlebars', 'ejs', 'mjs'].includes(monacoLang)) {
        emmetMonaco.emmetHTML && emmetMonaco.emmetHTML(monaco, [monacoLang]);
      } else if (['css', 'scss', 'less', 'sass'].includes(monacoLang)) {
        emmetMonaco.emmetCSS && emmetMonaco.emmetCSS(monaco, [monacoLang]);
      } else if (['javascript', 'typescript', 'jsx', 'tsx'].includes(monacoLang)) {
        emmetMonaco.emmetJSX && emmetMonaco.emmetJSX(monaco, [monacoLang]);
      } else if (['python'].includes(monacoLang)) {
        emmetMonaco.emmetHTML && emmetMonaco.emmetHTML(monaco, [monacoLang]); // Python can benefit from HTML emmet in f-strings or templates
      }
      
      monacoEditorRef.current = monaco.editor.create(editorRef.current, {
        value: value,
        language: monacoLang,
        theme: 'vs-dark',
        automaticLayout: false, 
        fontSize: 14,
        fontFamily: "'Fira Code', 'JetBrains Mono', 'Consolas', 'Courier New', monospace",
        fontLigatures: true,
        minimap: { enabled: false },
        lineNumbers: 'on',
        scrollBeyondLastLine: false,
        wordWrap: 'on',
        autoClosingBrackets: 'always',
        autoClosingTags: 'always',
        autoClosingQuotes: 'always',
        formatOnType: true,
        formatOnPaste: true,
        suggestSelection: 'first',
        suggestOnTriggerCharacters: true,
        acceptSuggestionOnEnter: 'on',
        acceptSuggestionOnCommitCharacter: true,
        tabSize: 2,
        insertSpaces: true,
        quickSuggestions: { other: true, comments: true, strings: true },
        quickSuggestionsDelay: 100,
        renderLineHighlight: 'all',
        renderWhitespace: 'boundary',
        smoothScrolling: true,
        'bracketPairColorization.enabled': true,
        // Enable Emmet in the suggest widget
        emmet: {
          enabled: true,
          showExpandedAbbreviation: 'always',
          showAbbreviationSuggestions: true,
          variables: {}
        },
        scrollbar: {
          vertical: 'visible',
          horizontal: 'visible',
          useShadows: false,
          verticalScrollbarSize: 10,
          horizontalScrollbarSize: 10
        }
      });

      // Enable auto rename tag functionality for HTML/XML languages
      if (['html', 'xml', 'xhtml', 'php', 'twig', 'blade', 'handlebars', 'ejs', 'mjs', 'jsx', 'tsx'].includes(monacoLang)) {
        // Monaco editor has built-in auto rename tag functionality for HTML/XML languages
        // The functionality is enabled by default when using the HTML language mode
      }
      
      // Add Prettier formatting for CSS and other supported languages
      if (['css', 'scss', 'less', 'html', 'javascript', 'typescript', 'jsx', 'tsx', 'json', 'python'].includes(monacoLang)) {
        // Register formatting command for this editor instance
        monacoEditorRef.current.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyS, () => {
          monacoEditorRef.current.getAction('editor.action.formatDocument').run();
        });
      }
      
      // Add command for showing suggestions (Ctrl+Space)
      monacoEditorRef.current.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.Space, () => {
        monacoEditorRef.current.trigger('keyboard', 'editor.action.triggerSuggest', {});
      });

      const syncLayout = () => {
        if (monacoEditorRef.current) {
          monacoEditorRef.current.layout();
        }
      };

      if ((document as any).fonts) {
        (document as any).fonts.ready.then(syncLayout);
      }
      setTimeout(syncLayout, 500);
      setTimeout(syncLayout, 2000); 
      
      const resizeObserver = new ResizeObserver(() => syncLayout());
      resizeObserver.observe(editorRef.current);

      monacoEditorRef.current.onDidChangeModelContent(() => {
        if (!isUpdatingRef.current) {
          onChangeRef.current(monacoEditorRef.current.getValue());
        }
      });



      (monacoEditorRef.current as any)._resizeObserver = resizeObserver;
    };

    loadMonaco();
    return () => { 
      if (monacoEditorRef.current) {
        if (monacoEditorRef.current._resizeObserver) {
          monacoEditorRef.current._resizeObserver.disconnect();
        }
        monacoEditorRef.current.dispose();
        monacoEditorRef.current = null;
      }
    };
  }, [language]);

  useEffect(() => {
    if (monacoEditorRef.current && !isUpdatingRef.current) {
      const currentVal = monacoEditorRef.current.getValue();
      if (currentVal !== value) {
        isUpdatingRef.current = true;
        monacoEditorRef.current.setValue(value);
        isUpdatingRef.current = false;
      }
    }
  }, [value]);

  return (
    <div 
      ref={editorRef} 
      className="w-full h-full border-none outline-none overflow-hidden" 
      style={{ 
        fontVariantLigatures: 'none', 
        letterSpacing: '0px',
        WebkitFontSmoothing: 'antialiased',
        textAlign: 'left'
      }} 
    />
  );
};

export default CodeEditor;