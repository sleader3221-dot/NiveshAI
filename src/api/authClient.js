const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '';
const TOKEN_KEY = 'token';
const USERS_KEY = 'mock_users';
const PASSWORD_RESET_KEY = 'mock_password_resets';

const isBrowser = typeof window !== 'undefined';

const getToken = () => {
  if (!isBrowser) return null;
  return window.localStorage.getItem(TOKEN_KEY);
};

const setToken = (token) => {
  if (!isBrowser) return;
  if (token) {
    window.localStorage.setItem(TOKEN_KEY, token);
  }
};

const clearToken = () => {
  if (!isBrowser) return;
  window.localStorage.removeItem(TOKEN_KEY);
};

const buildUrl = (path) => {
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  return `${API_BASE_URL}${normalizedPath}`;
};

const parseResponse = async (response) => {
  const contentType = response.headers.get('content-type') || '';
  const payload = contentType.includes('application/json') ? await response.json() : { message: await response.text() };
  const message = payload?.message || payload?.error || response.statusText || 'Request failed';
  const error = new Error(message);
  error.status = response.status;
  error.data = payload;
  return error;
};

const request = async (path, options = {}) => {
  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {})
  };

  const token = getToken();
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const response = await fetch(buildUrl(path), {
    ...options,
    headers,
    body: options.body ? JSON.stringify(options.body) : undefined,
  });

  if (!response.ok) {
    throw await parseResponse(response);
  }

  if (response.status === 204) {
    return null;
  }

  return response.json();
};

const getStoredMockUsers = () => {
  if (!isBrowser) return [];
  try {
    return JSON.parse(window.localStorage.getItem(USERS_KEY) || '[]');
  } catch {
    return [];
  }
};

const saveStoredMockUsers = (users) => {
  if (!isBrowser) return;
  window.localStorage.setItem(USERS_KEY, JSON.stringify(users));
};

const getStoredPasswordResets = () => {
  if (!isBrowser) return {};
  try {
    return JSON.parse(window.localStorage.getItem(PASSWORD_RESET_KEY) || '{}');
  } catch {
    return {};
  }
};

const saveStoredPasswordResets = (items) => {
  if (!isBrowser) return;
  window.localStorage.setItem(PASSWORD_RESET_KEY, JSON.stringify(items));
};

const createMockToken = (email) => {
  const payload = {
    email,
    iat: Date.now(),
    exp: Date.now() + 1000 * 60 * 60 * 24,
  };
  return `mock-jwt.${btoa(JSON.stringify(payload))}`;
};

const getMockUserFromToken = (token) => {
  if (!token || !token.startsWith('mock-jwt.')) return null;
  const parts = token.split('.');
  if (parts.length !== 2) return null;
  try {
    const payload = JSON.parse(atob(parts[1]));
    if (!payload.email || !payload.exp || Date.now() > payload.exp) return null;
    const users = getStoredMockUsers();
    return users.find((user) => user.email === payload.email) || null;
  } catch (err) {
    console.error('Failed to parse mock JWT:', err);
    return null;
  }
};

const mockLogin = async (email, password) => {
  const users = getStoredMockUsers();
  const user = users.find((u) => u.email === email.toLowerCase());
  if (!user || user.password !== password) {
    const error = new Error('Invalid email or password');
    error.status = 401;
    throw error;
  }

  const token = createMockToken(user.email);
  return {
    token,
    user: {
      email: user.email,
      full_name: user.full_name || user.email.split('@')[0],
    },
  };
};

const mockRegister = async (email, password) => {
  const users = getStoredMockUsers();
  const normalizedEmail = email.toLowerCase();
  if (users.some((u) => u.email === normalizedEmail)) {
    const error = new Error('Email already registered');
    error.status = 409;
    throw error;
  }

  const newUser = {
    email: normalizedEmail,
    password,
    full_name: normalizedEmail.split('@')[0],
  };
  users.push(newUser);
  saveStoredMockUsers(users);

  const token = createMockToken(normalizedEmail);
  return {
    token,
    user: {
      email: normalizedEmail,
      full_name: newUser.full_name,
    },
  };
};

const mockRequestPasswordReset = async (email) => {
  const users = getStoredMockUsers();
  const normalizedEmail = email.toLowerCase();
  if (!users.some((u) => u.email === normalizedEmail)) {
    return { message: 'If an account exists, a reset link has been sent.' };
  }

  const resetToken = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
  const resets = getStoredPasswordResets();
  resets[resetToken] = normalizedEmail;
  saveStoredPasswordResets(resets);
  return { message: 'Password reset requested', resetToken };
};

const mockResetPassword = async (token, newPassword) => {
  const resets = getStoredPasswordResets();
  const email = resets[token];
  if (!email) {
    const error = new Error('Invalid or expired reset token');
    error.status = 400;
    throw error;
  }

  const users = getStoredMockUsers();
  const userIndex = users.findIndex((u) => u.email === email);
  if (userIndex === -1) {
    const error = new Error('User not found');
    error.status = 404;
    throw error;
  }

  users[userIndex].password = newPassword;
  saveStoredMockUsers(users);
  delete resets[token];
  saveStoredPasswordResets(resets);
  return { message: 'Password reset successfully' };
};

const mockGetCurrentUser = async () => {
  const token = getToken();
  const user = getMockUserFromToken(token);
  if (!user) {
    const error = new Error('Unauthorized');
    error.status = 401;
    throw error;
  }

  return {
    email: user.email,
    full_name: user.full_name || user.email.split('@')[0],
  };
};

export const authClient = {
  getToken,
  setToken,
  clearToken,
  async login(email, password) {
    if (!API_BASE_URL) {
      return mockLogin(email, password);
    }
    return request('/auth/login', {
      method: 'POST',
      body: { email, password }
    });
  },
  async register(email, password) {
    if (!API_BASE_URL) {
      return mockRegister(email, password);
    }
    return request('/auth/register', {
      method: 'POST',
      body: { email, password }
    });
  },
  async requestPasswordReset(email) {
    if (!API_BASE_URL) {
      return mockRequestPasswordReset(email);
    }
    return request('/auth/forgot-password', {
      method: 'POST',
      body: { email }
    });
  },
  async resetPassword(token, newPassword) {
    if (!API_BASE_URL) {
      return mockResetPassword(token, newPassword);
    }
    return request('/auth/reset-password', {
      method: 'POST',
      body: { token, newPassword }
    });
  },
  async getCurrentUser() {
    if (!API_BASE_URL) {
      return mockGetCurrentUser();
    }
    return request('/auth/me', {
      method: 'GET'
    });
  },
  logout() {
    clearToken();
  }
};
