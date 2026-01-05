const express = require('express');
const http = require('http');
const WebSocket = require('ws');
const { spawn } = require('child_process');
const os = require('os');


const path = require('path');
const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

// In dev, mount Vite dev server as middleware so client + server run on the same port.
if (process.env.NODE_ENV !== 'production') {
  (async () => {
    try {
      const { createServer: createViteServer } = require('vite');
      const vite = await createViteServer({ server: { middlewareMode: 'ssr' }, appType: 'custom' });
      app.use(vite.middlewares);
      console.log('Vite dev middleware registered');
    } catch (e) {
      console.error('Could not start Vite dev middleware:', e);
    }
  })();
} else {
  // In production serve pre-built client from ../dist
  const staticPath = path.resolve(__dirname, '../dist');
  app.use(express.static(staticPath));
  app.get('*', (req, res) => res.sendFile(path.join(staticPath, 'index.html')));
}

// Session management for containers
const sessions = new Map(); // sessionId -> { container, image, createdAt, timer }
const SESSION_IDLE_MS = parseInt(process.env.SESSION_IDLE_MS || '') || 10 * 60 * 1000; // default 10min idle timeout
const ALLOWED_IMAGES = {
    node: 'node:18-bullseye',
    python: 'python:3.11-bullseye',
    ubuntu: 'ubuntu:22.04'
};

// Determine the shell based on the OS
const SHELL = os.platform() === 'win32' ? 'cmd.exe' : '/bin/bash';

wss.on('connection', async (ws, req) => {
    console.log('Client connected', req && req.url);

    // If the client connects to /ws/pty we will attempt to spawn a Docker container and attach a TTY
    if (req && req.url && req.url.startsWith('/ws/pty')) {
        const workspacePath = process.cwd(); // Mount server workspace into the container
        let imageKey = 'node';
        try {
            const url = new URL(req.url, 'http://localhost');
            const q = url.searchParams.get('image');
            if (q) imageKey = q.toLowerCase();
        } catch (e) {}
        const image = ALLOWED_IMAGES[imageKey] || ALLOWED_IMAGES.node;
        const sessionId = `s-${Date.now().toString(36)}-${Math.random().toString(36).slice(2,8)}`;

        // Try to load dockerode dynamically; if not available or docker daemon not running, fall back to server shell
        let docker = null;
        try {
            const Docker = require('dockerode');
            docker = new Docker();
        } catch (e) {
            console.warn('dockerode not available or docker daemon not running, falling back to local shell');
            try { ws.send('Docker not available on server; using local shell fallback.'); } catch (e) {}
        }

        if (!docker) {
            // Let the handler fall through to spawn a local shell (below) — do not return here
            console.log('Skipping Docker flow — using local shell fallback');
        } else {
            try {
                // Pull image if not present
                const images = await docker.listImages({ filters: { reference: [image] } });
                if (!images || images.length === 0) {
                    console.log(`Pulling Docker image ${image}...`);
                    await new Promise((resolve, reject) => {
                        docker.pull(image, (err, stream) => {
                            if (err) return reject(err);
                            docker.modem.followProgress(stream, (err) => err ? reject(err) : resolve());
                        });
                    });
                    console.log(`Image ${image} pulled.`);
                }

                const container = await docker.createContainer({
                    Image: image,
                    Tty: true,
                    Cmd: ['/bin/bash'],
                    Env: ['TERM=xterm-256color'],
                    User: 'node',
                    HostConfig: {
                        AutoRemove: true,
                        Binds: [`${workspacePath}:/workspace`],
                        Memory: 512 * 1024 * 1024,
                        NanoCpus: 1e9
                    },
                    WorkingDir: '/workspace'
                });

                await container.start();

                // Try to ensure python/pip are available (background install inside the container for convenience)
                try {
                    const execObj = await container.exec({ Cmd: ['bash','-lc','apt-get update -qq && apt-get install -y python3 python3-pip -qq'], AttachStdout: true, AttachStderr: true });
                    const execStream = await execObj.start({ hijack: true, stdin: false });
                    execStream.on('data', chunk => { try { ws.send(chunk.toString()); } catch (e) {} });
                } catch (e) {
                    console.warn('Could not install python inside container:', e.message || e);
                }

                // Attach to the container's stdio (TTY)
                const attachStream = await container.attach({ stream: true, stdin: true, stdout: true, stderr: true, hijack: true, tty: true });

                // Track session and implement idle autoremove
                const cleanup = async () => {
                    if (!sessions.has(sessionId)) return;
                    const s = sessions.get(sessionId);
                    try { await s.container.kill(); } catch (e) {}
                    try { await s.container.remove({ force: true }); } catch (e) {}
                    sessions.delete(sessionId);
                    try { ws.close(); } catch (e) {}
                };

                const resetTimer = () => {
                    const sess = sessions.get(sessionId);
                    if (!sess) return;
                    if (sess.timer) clearTimeout(sess.timer);
                    sess.timer = setTimeout(cleanup, SESSION_IDLE_MS);
                    sess.lastActivity = Date.now();
                };

                sessions.set(sessionId, { container, image, createdAt: Date.now(), lastActivity: Date.now(), timer: setTimeout(cleanup, SESSION_IDLE_MS) });

                ws.send(`Connected to Docker container shell (image=${image}, session=${sessionId}).`);

                attachStream.on('data', chunk => {
                    try { ws.send(chunk.toString()); } catch (e) { /* ignore send errors */ }
                });

                attachStream.on('end', () => { try { ws.close(); } catch (e) {} });

                ws.on('message', async (message) => {
                    try {
                        const s = message.toString();
                        // Reset idle timeout on activity
                        resetTimer();

                        // Accept JSON control messages like {"type":"resize","cols":80,"rows":24}
                        if (s.trim().startsWith('{')) {
                            try {
                                const obj = JSON.parse(s);
                                if (obj.type === 'resize' && container.resize) {
                                    await container.resize({ h: obj.rows, w: obj.cols });
                                }
                            } catch (err) { /* ignore control parse errors */ }
                            return;
                        }
                        // Write raw input into container stdin
                        attachStream.write(s);
                    } catch (err) {
                        console.error('Error writing to container stdin:', err);
                    }
                });

                ws.on('close', async () => {
                    try { await container.kill(); } catch (e) {};
                    try { await container.remove({ force: true }); } catch (e) {};
                    // cleanup session
                    const sess = sessions.get(sessionId);
                    if (sess && sess.timer) clearTimeout(sess.timer);
                    sessions.delete(sessionId);
                });

                ws.on('error', async (err) => {
                    console.error('WebSocket error:', err);
                    try { await container.kill(); } catch (e) {};
                    const sess = sessions.get(sessionId);
                    if (sess && sess.timer) clearTimeout(sess.timer);
                    sessions.delete(sessionId);
                });

                return;
            } catch (err) {
                console.error('Docker handler error:', err);
                try { ws.send(`Docker error: ${err.message}`); } catch (e) {}
                try { ws.close(); } catch (e) {}
                return;
            }
        }
    }

    // Fallback: use an interactive PTY (node-pty) for proper terminal behavior
    let ptyProcess = null;

    try {
      const pty = require('node-pty');
      ptyProcess = pty.spawn(SHELL, [], {
        name: 'xterm-256color',
        cols: 120,
        rows: 30,
        cwd: process.cwd(),
        env: process.env
      });

      // Stream PTY output to the websocket
      ptyProcess.on('data', data => {
        try { ws.send(String(data)); } catch (e) { /* ignore */ }
      });

      ptyProcess.on('exit', code => {
        try { ws.send(`\nShell process exited with code ${code}\n`); } catch (e) {}
        try { ws.close(); } catch (e) {}
      });

      ws.on('message', message => {
        const s = message.toString();
        // Accept JSON control messages like {"type":"resize","cols":80,"rows":24} or {"type":"signal","signal":"SIGINT"}
        if (s.trim().startsWith('{')) {
          try {
            const obj = JSON.parse(s);
            if (obj.type === 'resize' && ptyProcess.resize) {
              try { ptyProcess.resize(obj.cols, obj.rows); } catch (e) {}
              return;
            }
            if (obj.type === 'signal') {
              try { ptyProcess.kill(obj.signal); } catch (e) {}
              return;
            }
          } catch (err) {
            // not JSON — fall through
          }
        }

        // Write input to the PTY. Append CR if there is no trailing newline to emulate enter from a line-based client.
        try {
          const toWrite = s.endsWith('\n') ? s : (s + '\r');
          ptyProcess.write(toWrite);
        } catch (e) {
          console.error('Error writing to PTY:', e);
        }
      });

      ws.on('close', () => {
        try { ptyProcess.kill(); } catch (e) {}
      });

      ws.on('error', (error) => {
        console.error('WebSocket error:', error);
        try { ptyProcess.kill(); } catch (e) {}
      });

    } catch (e) {
      console.error('node-pty unavailable or failed, falling back to spawn():', e);
      // Last-resort fallback to spawn
      const shellProcess = spawn(SHELL, [], {
        env: process.env,
        cwd: process.cwd() // Start shell in the server's current working directory
      });

      ws.on('message', message => {
        const s = message.toString();
        console.log(`Received message: ${s}`);
        if (s.trim().startsWith('{')) {
          try {
            const obj = JSON.parse(s);
            if (obj.type === 'signal') {
              try { shellProcess.kill(obj.signal); } catch (e) {}
              return;
            }
          } catch (e) {
            // not valid JSON — fall through
          }
        }
        shellProcess.stdin.write(s + '\n');
      });

      shellProcess.stdout.on('data', data => {
        ws.send(data.toString());
      });

      shellProcess.stderr.on('data', data => {
        ws.send(data.toString());
      });

      shellProcess.on('close', code => {
        console.log(`Shell process exited with code ${code}`);
        ws.send(`\nShell process exited with code ${code}\n`);
        ws.close();
      });

      shellProcess.on('error', err => {
        console.error('Failed to start shell process:', err);
        ws.send(`\nError starting shell: ${err.message}\n`);
        ws.close();
      });

      ws.on('close', () => {
        console.log('Client disconnected');
        try { shellProcess.kill(); } catch (e) {}
      });

      ws.on('error', error => {
        console.error('WebSocket error:', error);
        try { shellProcess.kill(); } catch (e) {}
      });
    }
});

// Health endpoint — keep root free so Vite's middleware may serve the client in dev
app.get('/health', (req, res) => {
    res.send('OK');
});

app.get('/sessions', (req, res) => {
    const list = Array.from(sessions.entries()).map(([id, s]) => ({ id, image: s.image, createdAt: s.createdAt, lastActivity: s.lastActivity }));
    res.json(list);
});

app.post('/sessions/:id/kill', async (req, res) => {
    const id = req.params.id;
    if (!sessions.has(id)) return res.status(404).json({ error: 'No such session' });
    const s = sessions.get(id);
    try { await s.container.kill(); } catch (e) {}
    try { await s.container.remove({ force: true }); } catch (e) {}
    if (s.timer) clearTimeout(s.timer);
    sessions.delete(id);
    res.json({ ok: true });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`Server listening on port ${PORT}`);
});
