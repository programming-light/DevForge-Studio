import { FileNode } from '../types';

export const generatePreviewCode = (
  files: FileNode[],
  currentDirectory: string,
  dependencies: Record<string, string>,
  activeFileId: string | null,
  focusCurrentFile: boolean
): string => {
  const packageJsonFile = files.find(f => f.name === 'package.json');
  let isReactProject = false;
  if (packageJsonFile) {
    try {
      const pkg = JSON.parse(packageJsonFile.content || '{}');
      if (pkg.dependencies?.react || pkg.devDependencies?.react) {
        isReactProject = true;
      }
    } catch (e) { /* ignore */ }
  }

  // Find main files for the preview
  let htmlFile;

  // If focusCurrentFile is true, prioritize the active HTML file if it's an HTML file
  if (focusCurrentFile && activeFileId) {
    const activeFile = files.find(f => f.id === activeFileId);
    if (activeFile && activeFile.name.endsWith('.html')) {
      htmlFile = activeFile;
    }
  }

  // If not focusing on current file or no active HTML file, look for index.html in the current directory
  if (!htmlFile) {
    if (!isReactProject) {
      htmlFile = files.find(f => f.name === 'index.html' && f.parentId === currentDirectory);
    }
  }

  let cssFile = files.find(f => f.name === 'style.css' && f.parentId === currentDirectory);
  let jsFile = files.find(f => f.name === 'script.js' && f.parentId === currentDirectory);

  // If no index.html, try to find any HTML file in the current directory
  if (!htmlFile) {
    htmlFile = files.find(f => f.name.endsWith('.html') && f.parentId === currentDirectory);
  }

  // For React/Next.js templates, look for App.js, App.tsx, or main component files
  const appFile = files.find(f => f.name === 'App.jsx' || f.name === 'App.tsx' || f.name === 'App.js' || f.name === 'pages/index.js' || f.name === 'pages/index.tsx');

  // For other template types, look for main files
  const mainJsFile = files.find(f => f.name === 'main.js' || f.name === 'main.ts' || f.name === 'src/main.tsx' || f.name === 'src/main.jsx');

  // Check for Next.js project
  const hasNextConfig = files.some(f => f.name === 'next.config.js');
  const hasPagesDir = files.some(f => f.name === 'pages' && f.type === 'folder');
  const nextJsIndex = files.find(f => (f.name === 'index.js' || f.name === 'index.tsx') && f.parentId === 'pages');

  // Check for Electron project
  const hasMainJs = files.some(f => f.name === 'main.js' && f.parentId === 'root');
  const hasElectronConfig = files.some(f => {
    if (f.name === 'package.json' && f.parentId === 'root') {
      try {
        const packageJson = JSON.parse(f.content || '{}');
        return packageJson.devDependencies && packageJson.devDependencies.electron;
      } catch {
        return false;
      }
    }
    return false;
  });

  const html = htmlFile?.content || '';
  const css = cssFile?.content || '';
  const js = jsFile?.content || '';

  // Build preview based on template type
  const activeFile = files.find(f => f.id === activeFileId);

  if (activeFile && activeFile.name.endsWith('.js') && activeFile.content?.includes('http.createServer')) {
    // Basic Node.js HTTP server preview simulation
    const content = activeFile.content || '';
    
    const serverRegex = /http\.createServer\(([^)]+)\)/;
    const portRegex = /\.listen\(([^,)]+)/;
    
    const serverMatch = content.match(serverRegex);
    const portMatch = content.match(portRegex);

    if (serverMatch && serverMatch[1]) {
        const listener = serverMatch[1].trim();
        const port = portMatch ? portMatch[1] : '8080'; // Default port
        
        return `<!DOCTYPE html>
<html>
<head>
<title>Node.js Server Preview</title>
</head>
<body>
<h1>Simulated Node.js Server</h1>
<p>Server is "listening" on port: <strong>${port}</strong></p>
<p><em>Note: This is a simulation. The server is not actually running on a network port.</em></p>
<hr>
<h2>Simulated Response for GET /</h2>
<div id="response" style="white-space: pre-wrap; font-family: monospace; border: 1px solid #ccc; padding: 10px; background: #f5f5f5;"></div>
<script>
  try {
    const http = {
      createServer: (requestListener) => {
        const req = { url: '/', method: 'GET', headers: {} };
        let responseBody = '';
        let statusCode = 200;
        const res = {
          writeHead: (s, h) => { statusCode = s; },
          end: (data) => { responseBody += data || ''; },
          write: (data) => { responseBody += data || ''; },
        };
        try {
          requestListener(req, res);
          document.getElementById('response').textContent = responseBody;
        } catch (e) {
          document.getElementById('response').textContent = 'Error executing request listener:\\n' + e.stack;
        }
      }
    };
    
    const userCode = ${JSON.stringify(content)};
    const modifiedCode = userCode.replace(/\\.listen\\([^)]*\\)/, '');
    eval(modifiedCode);

  } catch (e) {
    document.getElementById('response').textContent = 'Error simulating server:\\n' + e.stack;
  }
</script>
</body>
</html>`;
    } else {
        return '<html><body>Could not simulate Node.js server. Unable to find http.createServer listener.</body></html>';
    }
  } else if (hasNextConfig && hasPagesDir && nextJsIndex) {
    // Next.js project preview
    const nextIndexContent = nextJsIndex.content || '';
    const nextAppContent = files.find(f => f.name === '_app.js' && f.parentId === 'pages')?.content || '';

    // Extract the component content from the page file
    let componentContent = nextIndexContent;

    // Remove import statements and export default for inline rendering
    componentContent = componentContent.replace(/import.*from.*/g, '');
    componentContent = componentContent.replace(/export default\s+/, '');

    // Create an HTML wrapper for Next.js
    return `<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<title>Next.js App</title>
<script src="https://unpkg.com/react@18/umd/react.development.js"></script>
<script src="https://unpkg.com/react-dom@18/umd/react-dom.development.js"></script>
<script src="https://unpkg.com/@babel/standalone/babel.min.js"></script>
<style>
  ${css}
  html, body {
    padding: 0;
    margin: 0;
    font-family: -apple-system, BlinkMacSystemFont, Segoe UI, Roboto, Oxygen,
      Ubuntu, Cantarell, Fira Sans, Droid Sans, Helvetica Neue, sans-serif;
  }
  * {
    box-sizing: border-box;
  }
</style>
</head>
<body ${!css ? 'style="background-color: white;"' : ''}>
<div id="root"></div>
<script type="text/babel">
  // Simulate Next.js rendering
  (() => {
    try {
      // Get the component content and process it
      const componentContent = ${JSON.stringify(nextIndexContent)};
      
      // Remove import statements and export default for inline rendering
      let code = componentContent.replace(/import[^';]*['"][^'"]*['"][^;]*;?/g, '');
      code = code.replace(/export\s+default\s+function\s+(\w+)/g, 'function Component');
      code = code.replace(/export\s+default\s+const\s+(\w+)\s*=/g, 'const Component =');
      code = code.replace(/export\s+default\s+/g, '');
      
      // Create the component function
      let Component;
      try {
        // Try different approaches to create the component
        if (code.includes('function Component')) {
          eval(code + '; window.NextJSComponent = Component;');
          Component = window.NextJSComponent;
        } else if (code.includes('const Component')) {
          eval(code + '; window.NextJSComponent = Component;');
          Component = window.NextJSComponent;
        } else {
          // If it's JSX directly, wrap it in a function
          const fullCode = 'function Component() { return (' + code + '); }';
          eval(fullCode + '; window.NextJSComponent = Component;');
          Component = window.NextJSComponent;
        }
      } catch (e) {
        // If eval fails, create a fallback component
        Component = function() {
          return React.createElement('div', null, 'Component loaded but could not render properly');
        };
      }
      
      // Render the component
      const rootElement = document.getElementById('root');
      const root = ReactDOM.createRoot(rootElement);
      root.render(React.createElement(Component));
    } catch (error) {
      console.error('Error rendering component:', error);
      document.getElementById('root').innerHTML = '<div style="color: red; padding: 20px;"><h3>Component Error:</h3><p>' + error.message + '</p></div>';
    }
  })();
</script>
</body>
</html>`;
  } else if (hasMainJs && hasElectronConfig) {
    // Electron project preview - show the HTML file that would be loaded
    const electronHtmlFile = files.find(f => f.name === 'index.html' && f.parentId === 'root');
    if (electronHtmlFile) {
      let electronContent = electronHtmlFile.content || '';

      // Add the renderer script content directly to the HTML
      const rendererFile = files.find(f => f.name === 'renderer.js' && f.parentId === 'root');
      if (rendererFile) {
        electronContent = electronContent.replace('</body>', `\n<script>${rendererFile.content}</script>\n</body>`);
      }

      return electronContent;
    } else {
      return '<html><body style="background-color: white;"><h1 style="color: black;">Electron Project Preview</h1><p style="color: black;">Electron projects require a desktop environment to run.</p></body></html>';
    }
  } else if (htmlFile) {
    // Standard HTML preview
    let processedHtml = html;
    if (processedHtml.includes('</head>')) { // Only inject if </head> exists
      if (css && !processedHtml.includes('style.css')) {
        processedHtml = processedHtml.replace('</head>', `<link rel="stylesheet" href="style.css">\n</head>`);
      }
      if (js && !processedHtml.includes('script.js')) {
        processedHtml = processedHtml.replace('</body>', `<script src="script.js"></script>\n</body>`);
      }
    } else { // Fallback if no head, just append
      processedHtml = `<!DOCTYPE html><html><head>${css ? `<style>${css}</style>` : ''}</head><body style="background-color: white;">${processedHtml}${js ? `<script>${js}</script>` : ''}</body></html>`;
      return processedHtml;
    }

    // Inject CSS and JS directly instead of referencing external files
    const finalHtml = processedHtml.replace('<link rel="stylesheet" href="style.css">', `<style>${css}</style>`).replace('<script src="script.js"></script>', `<script>${js}</script>`);

    // Ensure body has white background if no CSS is provided
    if (!css) {
      return finalHtml.replace('<body>', '<body style="background-color: white;">');
    }
    return finalHtml;
  } else if (appFile) {
    // React/Next.js template preview (non-Next.js React apps)
    const appContent = appFile.content || '';

    // Create a simple HTML wrapper for React components
    return `<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<title>React App</title>
<script src="https://unpkg.com/react@18/umd/react.development.js"></script>
<script src="https://unpkg.com/react-dom@18/umd/react-dom.development.js"></script>
<script src="https://unpkg.com/@babel/standalone/babel.min.js"></script>
<style>${css}</style>
</head>
<body ${!css ? 'style="background-color: white;"' : ''}>
<div id="root"></div>
<script type="text/babel">
  (() => {
    try {
      const appCode = ${JSON.stringify(appContent)};

      // Remove import statements and export default for inline rendering
      let code = appCode.replace(/import[^';]*['"][^'"]*['"][^;]*;?/g, '');
      code = code.replace(/export\s+default\s+function\s+(\w+)/g, 'function Component');
      code = code.replace(/export\s+default\s+const\s+(\w+)\s*=/g, 'const Component =');
      code = code.replace(/export\s+default/g, '');

      let Component;

      // Try to create the component
      try {
        if (code.includes('function Component')) {
          eval(code + '; window.ReactComponent = Component;');
          Component = window.ReactComponent;
        } else if (code.includes('const Component')) {
          eval(code + '; window.ReactComponent = Component;');
          Component = window.ReactComponent;
        } else {
          // If it's JSX directly, wrap it in a function
          const fullCode = 'function Component() { return (' + code + '); }';
          eval(fullCode + '; window.ReactComponent = Component;');
          Component = window.ReactComponent;
        }
      } catch (e) {
        Component = function() {
          return React.createElement('div', null, 'Component loaded but could not render properly.');
        };
      }
      
      // Render the component
      const rootElement = document.getElementById('root');
      const root = ReactDOM.createRoot(rootElement);
      root.render(React.createElement(Component));
    } catch (error) {
      console.error('Error rendering component:', error);
      document.getElementById('root').innerHTML = '<div style="color: red; padding: 20px;"><h3>Component Error:</h3><p>' + error.message + '</p></div>';
    }
  })();
</script>
</body>
</html>`;
  } else if (mainJsFile) {
    // For other JavaScript frameworks
    const mainContent = mainJsFile.content || '';
    return `<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<title>JavaScript App</title>
<style>${css}</style>
</head>
<body ${!css ? 'style="background-color: white;"' : ''}>
<div id="app"></div>
<script>
  ${mainContent}
</script>
</body>
</html>`;
  } else {
    // Fallback: try to find any HTML file
    const anyHtmlFile = files.find(f => f.name.endsWith('.html'));
    if (anyHtmlFile) {
      let content = anyHtmlFile.content || '<html><body>No content</body></html>';
      // Add white background if no CSS is present and no background styling exists
      if (!content.includes('background-color') && !content.includes('background:') && !content.includes('style="') && !content.includes("style='")) {
        if (content.includes('<body>')) {
          content = content.replace('<body>', '<body style="background-color: white;">');
        } else if (content.includes('<body ')) {
          // Check if body tag already has style attribute
          if (!content.match(/<body[^>]*style=/i)) {
            content = content.replace(/<body([^>]*)>/i, '<body$1 style="background-color: white;">');
          }
        } else { // If no body tag, add one with white background
          const htmlOpenRegex = new RegExp('<html>', 'i');
          const htmlCloseRegex = new RegExp('</html>', 'i');
          content = content.replace(htmlOpenRegex, '<html><body style="background-color: white;">');
          content = content.replace(htmlCloseRegex, '</body></html>');
        }
      }
      return content;
    }

    // If no HTML file, return a default preview with white background
    return '<html><body style="background-color: white;"><h1 style="color: black;">Project Preview</h1><p style="color: black;">Select an HTML file to see the preview.</p></body></html>';
  }
};
