# Development Setup: Server + React (Vite) Client

This project contains **two separate applications**:

- `server/` → Backend API (Node / Express / etc.)
- `react_client/` → Frontend React app using **Vite**

They run as **two independent dev servers** during development.

---

## Prerequisites

- Node.js (LTS recommended)
- npm (comes with Node)

Verify:

```bash
node -v
npm -v
```

---

## One-Time Setup

Run these once after cloning the repo (or if `node_modules` is deleted).

### Install Server Dependencies

```bash
cd server
npm install
```

### Install Client Dependencies

```bash
cd react_client
npm install
```

---

## Daily Development Workflow

You will use **two terminals**.

### Terminal 1 – Start the Backend Server

```bash
cd server
npm run dev
```

> If `npm run dev` does not exist, check `server/package.json` and use `npm start` instead.

The backend usually runs on something like:

```
http://localhost:3000
```

---

### Terminal 2 – Start the React (Vite) Client

```bash
cd react_client
npm run dev
```

Vite will print a local URL, usually:

```
http://localhost:5173
```

Open that URL in your browser.

---

## API Requests From React

### Recommended: Vite Proxy (No CORS Issues)

The client is configured to proxy API requests to the backend.

In `react_client/vite.config.js`:

```js
server: {
  proxy: {
    '/api': 'http://localhost:3000',
  },
}
```

### Usage in React

```js
fetch("/api/example");
```

This forwards the request to:

```
http://localhost:3000/api/example
```

---

## Debugging

### React Client

- Browser DevTools
- Console tab for errors
- Network tab for API requests
- Hot reload works automatically

### Backend Server

- Use `console.log`
- If using `nodemon`, changes auto-restart the server
- If changes don’t apply, restart the server manually

---

## The Quick Restart Checklist

When coming back to the project:

```bash
# Terminal 1
cd server
npm run dev

# Terminal 2
cd react_client
npm run dev
```

If something isn’t working:

1. Confirm both servers are running
2. Check ports (3000, 5173, etc.)
3. Restart both servers
4. Check `package.json` scripts

---

## Optional: Run Both Servers With One Command

From the project root:

```bash
npm install -D concurrently
```

Root `package.json`:

```json
{
    "scripts": {
        "dev": "concurrently \"cd server && npm run dev\" \"cd react_client && npm run dev\""
    }
}
```

Now start everything with:

```bash
npm run dev
```

---

## Notes

- Backend should be running **before** testing API calls
- Frontend and backend are intentionally decoupled
- This setup is optimized for fast local development
