import React, { useState, useEffect, useRef } from 'react';
import { TerminalLog } from '../types';

interface FakeTerminalProps {
  logs?: TerminalLog[];
  onCommand?: (cmd: string) => void;
  onControlSignal?: (signal: string) => void;
  image?: string;
  onFileChange?: (path: string, content: string) => void; // Callback to update files in the project
}

interface PackageManager {
  install: (packages: string[]) => Promise<string>;
  uninstall: (packages: string[]) => Promise<string>;
  list: () => Promise<string>;
}

const FakeTerminal: React.FC<FakeTerminalProps> = ({ 
  logs = [], 
  onCommand, 
  onControlSignal, 
  image = 'node',
  onFileChange
}) => {
  const [input, setInput] = useState('');
  const [terminalLogs, setTerminalLogs] = useState<TerminalLog[]>(logs);
  const displayLogs = logs.length ? logs : terminalLogs;
  const commandHistory = useRef<string[]>([]);
  const historyIndex = useRef(-1);

  // Package managers for different environments
  const packageManagers: Record<string, PackageManager> = {
    node: {
      install: async (packages: string[]) => {
        // Simulate installation process with interactive prompts
        const outputLines = [
          `npm ${packages.length > 0 ? 'install' : ''} ${packages.join(' ')}`,
          'npm WARN using --force',
          'npm WARN deprecated package@1.0.0: Use package@2.x instead',
          'added 123 packages, and audited 456 packages',
          '123 packages are looking for funding',
          'run `npm fund` for details',
          'found 0 vulnerabilities'
        ];
        
        // Update package.json with installed packages
        if (onFileChange && packages.length > 0) {
          try {
            // Get current package.json or create a default one
            let packageJson: any = { dependencies: {}, devDependencies: {} };
            try {
              const currentContent = localStorage.getItem('package.json') || '{}';
              packageJson = JSON.parse(currentContent);
            } catch (e) {
              // Use default if file doesn't exist
            }
            
            // Add packages to dependencies
            packages.forEach(pkg => {
              if (pkg.startsWith('@') || pkg.includes('/')) {
                // Scoped package
                const [name, version] = pkg.split('@');
                packageJson.dependencies[name ? `@${name}` : pkg] = version ? `^${version}` : 'latest';
              } else if (pkg.startsWith('-D') || pkg.startsWith('--save-dev')) {
                // Dev dependency
                const actualPkg = pkg.startsWith('-D') ? pkg.substring(2) : pkg.substring(10);
                if (actualPkg.trim()) {
                  const [name, version] = actualPkg.trim().split('@');
                  packageJson.devDependencies[name] = version ? `^${version}` : 'latest';
                }
              } else if (!pkg.startsWith('-')) {
                // Regular dependency
                const [name, version] = pkg.split('@');
                packageJson.dependencies[name] = version ? `^${version}` : 'latest';
              }
            });
            
            // Save updated package.json
            onFileChange('package.json', JSON.stringify(packageJson, null, 2));
            
            // Simulate dependency loading process
            outputLines.push('');
            outputLines.push('Dependency installation completed!');
            outputLines.push('Dependencies will be available in the preview after refresh.');
          } catch (e) {
            console.error('Error updating package.json:', e);
          }
        }
        
        return outputLines.join('\n');
      },
      uninstall: async (packages: string[]) => {
        return `removed ${packages.length} packages`;
      },
      list: async () => {
        return 'package-a@1.0.0\npackage-b@2.1.0\npackage-c@3.2.1';
      }
    },
    python: {
      install: async (packages: string[]) => {
        // Simulate pip installation process with interactive prompts
        const outputLines = [
          `Collecting ${packages.join(' ')}`,
          '  Downloading package1-1.0.0-py3-none-any.whl (10 kB)',
          '  Downloading package2-2.1.0-py3-none-any.whl (15 kB)',
          'Installing collected packages: package1, package2',
          'Successfully installed package1-1.0.0 package2-2.1.0'
        ];
        
        // Update requirements.txt with installed packages
        if (onFileChange && packages.length > 0) {
          try {
            // Get current requirements.txt or create a default one
            let requirementsContent = '';
            try {
              requirementsContent = localStorage.getItem('requirements.txt') || '';
            } catch (e) {
              // Use empty string if file doesn't exist
            }
            
            // Parse existing requirements
            const existingPackages = requirementsContent.split('\n').filter(line => line.trim() !== '');
            
            // Add new packages
            const newPackages = [...new Set([...existingPackages, ...packages])];
            
            // Save updated requirements.txt
            onFileChange('requirements.txt', newPackages.join('\n'));
            
            // Simulate dependency loading process
            outputLines.push('');
            outputLines.push('Python dependency installation completed!');
            outputLines.push('Dependencies will be available in the preview after refresh.');
          } catch (e) {
            console.error('Error updating requirements.txt:', e);
          }
        }
        
        return outputLines.join('\n');
      },
      uninstall: async (packages: string[]) => {
        return `Uninstalled ${packages.join(' ')}`;
      },
      list: async () => {
        return 'package1==1.0.0\npackage2==2.1.0\npackage3==3.2.1';
      }
    }
  };

  // Command handlers
  const commandHandlers: Record<string, (args: string[]) => Promise<string>> = {
    // Node.js related commands
    'npm': async (args: string[]) => {
      if (args[0] === 'install' || args[0] === 'i') {
        const packages = args.slice(1).filter(arg => !arg.startsWith('-'));
        if (packages.length === 0) {
          // Install from package.json
          return 'npm install\nadded 42 packages, and audited 123 packages';
        }
        return await packageManagers.node.install(packages);
      } else if (args[0] === 'uninstall' || args[0] === 'un') {
        const packages = args.slice(1).filter(arg => !arg.startsWith('-'));
        return await packageManagers.node.uninstall(packages);
      } else if (args[0] === 'list' || args[0] === 'ls') {
        return await packageManagers.node.list();
      }
      return `npm ${args.join(' ')}\nSimulated npm command`;
    },
    'yarn': async (args: string[]) => {
      if (args[0] === 'add') {
        const packages = args.slice(1).filter(arg => !arg.startsWith('-'));
        return await packageManagers.node.install(packages);
      } else if (args[0] === 'remove') {
        const packages = args.slice(1).filter(arg => !arg.startsWith('-'));
        return await packageManagers.node.uninstall(packages);
      }
      return `yarn ${args.join(' ')}\nSimulated yarn command`;
    },
    'pnpm': async (args: string[]) => {
      if (args[0] === 'add') {
        const packages = args.slice(1).filter(arg => !arg.startsWith('-'));
        return await packageManagers.node.install(packages);
      } else if (args[0] === 'remove') {
        const packages = args.slice(1).filter(arg => !arg.startsWith('-'));
        return await packageManagers.node.uninstall(packages);
      }
      return `pnpm ${args.join(' ')}\nSimulated pnpm command`;
    },
    
    // Python related commands
    'pip': async (args: string[]) => {
      if (args[0] === 'install') {
        const packages = args.slice(1).filter(arg => !arg.startsWith('-'));
        if (packages.length === 0) {
          // Install from requirements.txt
          return 'Processing requirements.txt\nInstalling collected packages\nSuccessfully installed packages';
        }
        return await packageManagers.python.install(packages);
      } else if (args[0] === 'uninstall') {
        const packages = args.slice(1).filter(arg => !arg.startsWith('-'));
        return await packageManagers.python.uninstall(packages);
      } else if (args[0] === 'list') {
        return await packageManagers.python.list();
      }
      return `pip ${args.join(' ')}\nSimulated pip command`;
    },
    
    // General commands
    'ls': async () => 'file1.js  file2.py  package.json  requirements.txt',
    'dir': async () => 'file1.js  file2.py  package.json  requirements.txt',
    'pwd': async () => '/workspace',
    'whoami': async () => 'devforge-user',
    'clear': async () => {
      setTerminalLogs([]);
      return '';
    },
    'history': async () => commandHistory.current.join('\n'),
    'echo': async (args: string[]) => args.join(' '),
    'cat': async (args: string[]) => `Contents of ${args[0] || 'file'} would appear here...`,
    'mkdir': async (args: string[]) => `Directory created: ${args[0] || 'folder'}`,
    'touch': async (args: string[]) => `File created: ${args[0] || 'file'}`,
    'rm': async (args: string[]) => `File removed: ${args[0] || 'file'}`,
  };

  const executeCommand = async (command: string): Promise<string> => {
    const trimmedCommand = command.trim();
    if (!trimmedCommand) return '';

    // Add to command history
    commandHistory.current = [...commandHistory.current, trimmedCommand];
    if (commandHistory.current.length > 50) {
      commandHistory.current = commandHistory.current.slice(-50);
    }

    // Parse command and arguments
    const parts = trimmedCommand.split(' ');
    const cmd = parts[0].toLowerCase();
    const args = parts.slice(1);

    // Check if we have a handler for this command
    if (commandHandlers[cmd]) {
      try {
        return await commandHandlers[cmd](args);
      } catch (error) {
        return `Error executing ${cmd}: ${error instanceof Error ? error.message : String(error)}`;
      }
    }

    // Default response for unknown commands
    return `Command not found: ${cmd}. Available commands: ${Object.keys(commandHandlers).join(', ')}`;
  };

  const handleSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault();
    const trimmed = input.trim();
    if (!trimmed) return;

    // Add command to logs
    const commandLog: TerminalLog = {
      type: 'info',
      content: `$ ${trimmed}`,
      timestamp: new Date()
    };
    setTerminalLogs(prev => [...prev, commandLog]);

    try {
      // Execute the command
      const output = await executeCommand(trimmed);
      
      if (output) {
        const outputLog: TerminalLog = {
          type: 'log',
          content: output,
          timestamp: new Date()
        };
        setTerminalLogs(prev => [...prev, outputLog]);
      }
    } catch (error) {
      const errorLog: TerminalLog = {
        type: 'error',
        content: `Error: ${error instanceof Error ? error.message : String(error)}`,
        timestamp: new Date()
      };
      setTerminalLogs(prev => [...prev, errorLog]);
    }

    setInput('');
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (commandHistory.current.length > 0) {
        if (historyIndex.current < commandHistory.current.length - 1) {
          historyIndex.current++;
          setInput(commandHistory.current[commandHistory.current.length - 1 - historyIndex.current]);
        }
      }
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (historyIndex.current >= 0) {
        historyIndex.current--;
        if (historyIndex.current >= 0) {
          setInput(commandHistory.current[commandHistory.current.length - 1 - historyIndex.current]);
        } else {
          setInput('');
        }
      }
    }
  };

  const connectNativeTerminal = () => {
    alert(
      `To connect your native terminal:\n\n` +
      `1. Install the DevForge Studio native app\n` +
      `2. Or use our browser extension\n` +
      `3. Or connect via the DevForge CLI\n\n` +
      `Supported terminals:\n` +
      `- Windows: CMD or PowerShell\n` +
      `- Mac/Linux: Bash/Zsh\n` +
      `- Android: Termux\n\n` +
      `This will allow real npm/pip installations to your device.`
    );
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
        <div className="flex gap-2 items-center">
          <div className="flex items-center space-x-1">
            <span className="text-[8px] font-bold uppercase tracking-widest text-[#8b949e]">{image.toUpperCase()}</span>
            {image === 'node' ? (
              <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#58a6ff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 2a10 10 0 1 0 10 10 4 4 0 0 1-5-5 4 4 0 0 1-5 5 10 10 0 1 0 0-20z" />
              </svg>
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#30a982" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
              </svg>
            )}
          </div>
          <span className="text-[#58a6ff] font-bold">$</span>
          <input 
            value={input} 
            onChange={(e) => setInput(e.target.value)} 
            onKeyDown={handleKeyDown}
            className="flex-1 bg-transparent border-none outline-none font-mono text-xs text-white py-1 px-1 caret-white" 
            placeholder="Type a command..." 
            // Add mobile-specific attributes to prevent zooming and improve keyboard behavior
            inputMode="text"
            autoCapitalize="none"
            autoComplete="off"
            autoCorrect="off"
            spellCheck="false"
          />
        </div>
      </form>
    </div>
  );
};

export default FakeTerminal;
