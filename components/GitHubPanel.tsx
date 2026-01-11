import React, { useState, useEffect } from 'react';
import { X, Github, GitBranch, GitCommit, GitPullRequest, Plus, Check, AlertCircle } from 'lucide-react';

interface GitHubUser {
  login: string;
  name: string;
  avatar_url: string;
  bio?: string;
}

interface GitHubRepo {
  id: number;
  name: string;
  full_name: string;
  description?: string;
  private: boolean;
  html_url: string;
  clone_url: string;
}

interface GitStatusFile {
  path: string;
  status: 'modified' | 'added' | 'deleted' | 'untracked';
}

interface GitCommit {
  hash: string;
  message: string;
  author: string;
  date: string;
}

const GitHubPanel: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  files: any[];
  onCloneRepo: (repoUrl: string) => Promise<void>;
  onGitOperation: (operation: string, ...args: any[]) => Promise<any>;
}> = ({ isOpen, onClose, files, onCloneRepo, onGitOperation }) => {
  const [authStatus, setAuthStatus] = useState<'disconnected' | 'connecting' | 'connected'>('disconnected');
  const [user, setUser] = useState<GitHubUser | null>(null);
  const [repos, setRepos] = useState<GitHubRepo[]>([]);
  const [selectedRepo, setSelectedRepo] = useState<GitHubRepo | null>(null);
  const [gitStatus, setGitStatus] = useState<GitStatusFile[]>([]);
  const [gitLog, setGitLog] = useState<GitCommit[]>([]);
  const [commitMessage, setCommitMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Check if user is already authenticated
  useEffect(() => {
    const token = localStorage.getItem('github_token');
    if (token) {
      setAuthStatus('connecting');
      fetchUser(token);
    }
  }, []);

  const fetchUser = async (token: string) => {
    try {
      const response = await fetch('https://api.github.com/user', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/vnd.github.v3+json',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch user data');
      }

      const userData = await response.json();
      setUser(userData);
      setAuthStatus('connected');
      
      // Fetch user repositories
      fetchRepos(token);
    } catch (err) {
      console.error('Error fetching user:', err);
      setAuthStatus('disconnected');
      localStorage.removeItem('github_token');
    }
  };

  const fetchRepos = async (token: string) => {
    try {
      const response = await fetch('https://api.github.com/user/repos?sort=updated&direction=desc', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/vnd.github.v3+json',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch repositories');
      }

      const reposData = await response.json();
      setRepos(reposData);
    } catch (err) {
      console.error('Error fetching repositories:', err);
      setError('Failed to load repositories');
    }
  };

  const handleGitHubLogin = () => {
    // Generate a random state parameter for security
    const state = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
    
    // Store the state in localStorage for validation after redirect
    localStorage.setItem('oauth_state', state);
    
    // Redirect to GitHub OAuth
    const clientId = process.env.GITHUB_CLIENT_ID;
    const redirectUri = encodeURIComponent(window.location.origin + '/oauth/callback');
    const scope = 'repo,user';
    
    window.location.href = `https://github.com/login/oauth/authorize?client_id=${clientId}&redirect_uri=${redirectUri}&scope=${scope}&state=${state}`;
  };

  const handleGitHubLogout = () => {
    localStorage.removeItem('github_token');
    setAuthStatus('disconnected');
    setUser(null);
    setRepos([]);
    setSelectedRepo(null);
  };

  const handleCloneRepo = async (repo: GitHubRepo) => {
    if (!repo.clone_url) return;
    
    setLoading(true);
    setError(null);
    
    try {
      await gitCloneRepo(repo.clone_url);
      setSelectedRepo(repo);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to clone repository');
    } finally {
      setLoading(false);
    }
  };

  const handleGitStatus = async () => {
    try {
      const status = await gitOperation('status');
      setGitStatus(status);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to get git status');
    }
  };

  const handleGitAdd = async (filePath: string) => {
    try {
      await gitOperation('add', filePath);
      handleGitStatus(); // Refresh status
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add file');
    }
  };

  const handleGitCommit = async () => {
    if (!commitMessage.trim()) {
      setError('Commit message is required');
      return;
    }
    
    try {
      await gitOperation('commit', commitMessage);
      setCommitMessage('');
      handleGitStatus(); // Refresh status
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to commit');
    }
  };

  const handleGitPush = async () => {
    try {
      await gitOperation('push');
      setError(null); // Clear any previous errors
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to push changes');
    }
  };

  const handleGitPull = async () => {
    try {
      await gitOperation('pull');
      setError(null); // Clear any previous errors
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to pull changes');
    }
  };

  // Initialize git operations with actual isomorphic-git integration
  const gitCloneRepo = async (repoUrl: string) => {
    // This would integrate with isomorphic-git to clone the repository
    return await onCloneRepo(repoUrl);
  };
  
  const gitOperation = async (operation: string, ...args: any[]) => {
    // This would integrate with isomorphic-git for git operations
    return await onGitOperation(operation, ...args);
  };

  if (!isOpen) return null;

  return (
    <div className="absolute top-0 right-0 h-full w-80 bg-[#161b22] border-l border-[#30363d] flex flex-col z-[60] shadow-2xl">
      <div className="p-4 border-b border-[#30363d] flex justify-between items-center">
        <div className="flex items-center space-x-2">
          <Github className="w-4 h-4 text-white" />
          <span className="text-sm font-bold text-white">GitHub</span>
        </div>
        <button 
          onClick={onClose}
          className="p-1 rounded hover:bg-[#30363d] text-[#8b949e] hover:text-white"
          aria-label="Close GitHub panel"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {error && (
          <div className="bg-red-500/20 border border-red-500/30 rounded p-3 flex items-start">
            <AlertCircle className="w-4 h-4 text-red-400 mt-0.5 mr-2 flex-shrink-0" />
            <span className="text-red-400 text-sm">{error}</span>
          </div>
        )}

        {/* Auth Section */}
        <div className="bg-[#0d1117] rounded-lg border border-[#30363d] p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-xs font-bold text-white uppercase tracking-wider">Authentication</h3>
            {authStatus === 'connected' && (
              <button 
                onClick={handleGitHubLogout}
                className="text-xs text-red-400 hover:text-red-300"
              >
                Logout
              </button>
            )}
          </div>

          {authStatus === 'disconnected' ? (
            <button
              onClick={handleGitHubLogin}
              className="w-full py-2 px-3 bg-[#238636] hover:bg-[#2ea043] text-white rounded-md text-sm font-medium transition-colors flex items-center justify-center"
            >
              <Github className="w-4 h-4 mr-2" />
              Connect to GitHub
            </button>
          ) : authStatus === 'connecting' ? (
            <div className="flex items-center justify-center py-2">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              <span className="ml-2 text-sm text-[#8b949e]">Connecting...</span>
            </div>
          ) : user ? (
            <div className="flex items-center space-x-3">
              <img 
                src={user.avatar_url} 
                alt={user.login} 
                className="w-8 h-8 rounded-full border border-[#30363d]"
              />
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium text-white truncate">{user.name || user.login}</div>
                <div className="text-xs text-[#8b949e] truncate">{user.login}</div>
              </div>
            </div>
          ) : null}
        </div>

        {/* Repositories Section */}
        {authStatus === 'connected' && (
          <div className="bg-[#0d1117] rounded-lg border border-[#30363d] p-4">
            <h3 className="text-xs font-bold text-white uppercase tracking-wider mb-3">Repositories</h3>
            
            {repos.length === 0 ? (
              <div className="text-xs text-[#8b949e] py-2 text-center">No repositories found</div>
            ) : (
              <div className="space-y-2 max-h-40 overflow-y-auto">
                {repos.map(repo => (
                  <div 
                    key={repo.id} 
                    className={`p-2 rounded border ${selectedRepo?.id === repo.id ? 'border-blue-500 bg-blue-500/10' : 'border-[#30363d] hover:bg-[#1c2128]'} transition-colors`}
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium text-white truncate">{repo.name}</div>
                        <div className="text-xs text-[#8b949e] truncate">{repo.description}</div>
                      </div>
                      <button
                        onClick={() => handleCloneRepo(repo)}
                        disabled={loading}
                        className="ml-2 px-2 py-1 bg-[#0969da] hover:bg-[#1f7fdb] disabled:bg-[#0969da]/50 text-white rounded text-xs"
                      >
                        {loading && selectedRepo?.id === repo.id ? (
                          <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white"></div>
                        ) : 'Clone'}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Git Operations Section */}
        {authStatus === 'connected' && (
          <div className="bg-[#0d1117] rounded-lg border border-[#30363d] p-4">
            <div className="flex justify-between items-center mb-3">
              <h3 className="text-xs font-bold text-white uppercase tracking-wider">Source Control</h3>
              <div className="flex space-x-1">
                <button
                  onClick={handleGitPull}
                  className="p-1 rounded hover:bg-[#30363d] text-[#8b949e] hover:text-white"
                  title="Pull"
                >
                  <GitPullRequest className="w-4 h-4" />
                </button>
                <button
                  onClick={handleGitPush}
                  className="p-1 rounded hover:bg-[#30363d] text-[#8b949e] hover:text-white"
                  title="Push"
                >
                  <GitBranch className="w-4 h-4" />
                </button>
                <button
                  onClick={handleGitStatus}
                  className="p-1 rounded hover:bg-[#30363d] text-[#8b949e] hover:text-white"
                  title="Refresh Status"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Commit Message */}
            <div className="mb-3">
              <input
                type="text"
                value={commitMessage}
                onChange={(e) => setCommitMessage(e.target.value)}
                placeholder="Commit message"
                className="w-full bg-[#0d1117] border border-[#30363d] rounded px-3 py-2 text-sm text-white outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>

            <button
              onClick={handleGitCommit}
              disabled={!commitMessage.trim()}
              className={`w-full py-1.5 rounded text-sm font-medium transition-colors mb-3 ${
                commitMessage.trim() 
                  ? 'bg-[#238636] hover:bg-[#2ea043] text-white' 
                  : 'bg-[#238636]/50 text-white/50 cursor-not-allowed'
              }`}
            >
              Commit
            </button>

            {/* Changed Files */}
            {gitStatus.length > 0 ? (
              <div className="space-y-2 max-h-40 overflow-y-auto">
                {gitStatus.map((file, index) => (
                  <div 
                    key={index} 
                    className="p-2 bg-[#0d1117] rounded border border-[#30363d] flex justify-between items-center"
                  >
                    <div className="flex items-center space-x-2">
                      <div className={`w-2 h-2 rounded-full ${
                        file.status === 'modified' ? 'bg-yellow-500' :
                        file.status === 'added' ? 'bg-green-500' :
                        file.status === 'deleted' ? 'bg-red-500' : 'bg-blue-500'
                      }`}></div>
                      <span className="text-sm text-white truncate">{file.path}</span>
                    </div>
                    <button
                      onClick={() => handleGitAdd(file.path)}
                      className="p-1 rounded hover:bg-[#30363d] text-[#8b949e] hover:text-white"
                      title={`Add ${file.path}`}
                    >
                      <Check className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-xs text-[#8b949e] py-2 text-center">No changes to commit</div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default GitHubPanel;