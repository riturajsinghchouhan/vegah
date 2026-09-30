import { io } from 'socket.io-client';

let socket = null;
let socketToken = null;

/**
 * Resolve the auth token the same way the axios client does.
 *
 * This used to read only `token` / `accessToken` / `admin_token`. A logged-in
 * CUSTOMER has none of those -- their session lives in `evora-session` as JSON --
 * so the handshake went out with an empty token and the server rejected it with
 * "Authentication error: No token provided". The customer app therefore never had
 * a socket at all: booking approvals, rejections and trip reminders only appeared
 * after a manual reload. Admins were unaffected only because AdminLogin happens to
 * also write `admin_token`.
 */
const resolveToken = () => {
  try {
    const sessionStr = window.localStorage.getItem('evora-session');
    if (sessionStr) {
      const session = JSON.parse(sessionStr);
      if (session?.accessToken) return session.accessToken;
    }
  } catch (err) {
    console.warn('Could not parse evora-session for the socket token:', err);
  }

  return (
    window.localStorage.getItem('token') ||
    window.localStorage.getItem('accessToken') ||
    window.localStorage.getItem('admin_token') ||
    ''
  );
};

export const initSocket = () => {
  const token = resolveToken();

  // Reuse the live socket only when it was opened with the token we hold now.
  // Otherwise a socket opened before login (or after a different user signed in)
  // would be kept forever in its unauthenticated state.
  if (socket && socket.connected && socketToken === token) {
    return socket;
  }

  if (socket && socketToken !== token) {
    socket.disconnect();
    socket = null;
  }

  if (socket) {
    return socket;
  }

  socketToken = token;

  // Default to localhost:5000 if VITE_API_URL is relative or empty
  let serverUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';
  if (serverUrl.startsWith('/')) {
    serverUrl = 'http://localhost:5000';
  }
  // Strip trailing /api if present
  serverUrl = serverUrl.replace(/\/api$/, '');

  socket = io(serverUrl, {
    auth: {
      token,
    },
    transports: ['websocket', 'polling'],
    autoConnect: true,
    reconnection: true,
    reconnectionAttempts: 10,
    reconnectionDelay: 2000,
  });

  socket.on('connect', () => {
    console.log('⚡ Socket connected to server:', socket.id);
  });

  socket.on('connect_error', (error) => {
    console.warn('Socket connection warning/error:', error.message);
  });

  socket.on('disconnect', (reason) => {
    console.log('Socket disconnected:', reason);
  });

  return socket;
};

export const getSocket = () => {
  if (!socket) {
    return initSocket();
  }
  return socket;
};

export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
  // Cleared so the next initSocket() re-handshakes instead of matching a stale token.
  socketToken = null;
};
