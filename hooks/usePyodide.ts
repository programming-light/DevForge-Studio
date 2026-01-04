
import { useState, useEffect, useCallback } from 'react';

declare global {
  interface Window {
    loadPyodide: any;
  }
}

const usePyodide = () => {
  const [pyodide, setPyodide] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    const initPyodide = async () => {
      try {
        if (!window.loadPyodide) {
          throw new Error('Pyodide script not loaded in index.html');
        }
        
        const py = await window.loadPyodide({
          indexURL: "https://cdn.jsdelivr.net/pyodide/v0.26.1/full/"
        });

        await py.loadPackage([]); 
        
        if (mounted) {
          setPyodide(py);
          setIsLoading(false);
        }
      } catch (err: any) {
        if (mounted) {
          setError(err.message);
          setIsLoading(false);
        }
      }
    };

    initPyodide();

    return () => {
      mounted = false;
    };
  }, []);

  const runPython = useCallback(async (code: string) => {
    if (!pyodide) {
      throw new Error('Pyodide is not loaded yet. Please wait a moment.');
    }

    try {
      // Ensure there is at least a pass if the code is empty
      const userCode = code.trim() === '' ? 'pass' : code;
      
      // Wrapper to capture output reliably and prevent indentation errors
      const wrapper = `
import sys
import io

# Setup stdout and stderr to capture print statements and errors
sys.stdout = io.StringIO()
sys.stderr = io.StringIO()

def __run_user_code__():
    try:
${userCode.split('\n').map(line => '        ' + line).join('\n')}
    except Exception as e:
        print(f"Python Runtime Error: {e}", file=sys.stderr)

__run_user_code__()

# Return captured values
stdout_val = sys.stdout.getvalue()
stderr_val = sys.stderr.getvalue()
(stdout_val, stderr_val)
      `;
      
      const result = await pyodide.runPythonAsync(wrapper);
      const [stdout, stderr] = result.toJs();
      
      if (stderr) {
        return `RUNTIME ERROR: ${stderr}`;
      }
      return stdout || '[No output]';
    } catch (err: any) {
      return `SYNTAX/EXECUTION ERROR: ${err.message}`;
    }
  }, [pyodide]);

  // Fix: Added pyodide to the return object to allow components (like WorkspaceMode) to access the underlying runtime.
  return { runPython, pyodide, isLoading, error };
};

export default usePyodide;
