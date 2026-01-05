# DevForge Studio

![DevForge Studio screenshot](https://github.com/user-attachments/assets/75de54b6-8a38-415e-9c92-fe93a0349c95)


## Run Locally

**Prerequisites:**  Node.js

1. Install dependencies:
   `npm install`
2. Run the app:
   `npm run dev`

---

## Terminal (Integrated & Sandboxed)

The IDE provides a simulated integrated terminal (Workspace mode) and a remote WebSocket-backed terminal for advanced/real execution. Basic supported commands are handled inside the IDE and update the file explorer in real time.

Supported (simulated) commands:

- `clear`, `ls`, `pwd`, `mkdir`, `touch`, `cd`, `cat`, `rm`
- `node <file.js>` (runs JS in-page), `python <file.py>` (via Pyodide if available)
- `npm install <pkg>` (simulated, updates `package.json`), `npx create vite@latest <name>` (scaffolds a project)
- `pip install <pkg>` (simulated, appends to `requirements.txt`)

How it works:

- When using the Workspace terminal, commands are simulated and routed to the in-memory VFS; file operations update the explorer immediately.
- If no workspace handler is present, the terminal will connect to the backend at the same origin (e.g. `ws://<host>/ws/pty`) and forward commands to a backend shell (be careful—server shell execution is not sandboxed and should be replaced with a safe sandbox for production use).

Tip: For a faster and more interactive frontend terminal experience, the UI uses `react-console-emulator`. You can add and extend commands in `components/Terminal.tsx`.

## Docker-backed sandbox terminal

You can run real `npm`, `npx`, `pnpm` and `pip` commands inside a container that is mounted to the workspace and connected to the IDE terminal via WebSocket.

Prerequisites: Docker installed and running on the host machine.

1. Start the app in development (single command starts the server and Vite dev middleware on the same port — default 3000):

   ```bash
   npm install
   npm run dev
   ```

   This runs the backend Express server which mounts Vite's dev middleware so both client and server are served from the same origin. Docker is optional: if Docker is available, the server can still spawn container sessions, otherwise it falls back to the local shell (not sandboxed).

Open the IDE and open the terminal — it will connect to `/ws/pty` on the same origin and spawn a container or local shell for the session. The container (if used) mounts the project folder at `/workspace`, so running `npm install` or `pip install` from the terminal will affect the workspace in the container (and any changes will be reflected in the IDE's file tree.

Notes:

- By default `node_modules` is hidden in the explorer to avoid slowing down the UI; toggle visibility using the package icon in the Explorer header.
- The server will attempt to install `python3` and `python3-pip` inside the container at startup for convenience, and for Node images it will try to enable `corepack` and install `pnpm`/`yarn` if missing. This may take a few seconds the first time you spawn a container.
- Use the `tools` command in the terminal (or it runs automatically on connect) to list detected versions of `node`, `npm`, `npx`, `pnpm`, `yarn`, `python`, and `pip` from the server session.
- The backend exposes session management endpoints for diagnostics:
  - `GET /sessions` — lists current container sessions (id, image, createdAt, lastActivity)
  - `POST /sessions/:id/kill` — force-kills a session container
- This PoC is intended for local/self-hosted use. If you expose the server remotely, add authentication and resource limits before allowing untrusted users to spawn containers.

---

## Open Source

DevForge Studio is now open source! We believe in the power of community and collaboration. Feel free to contribute, report issues, or suggest new features.
