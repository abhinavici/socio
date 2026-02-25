const TOKEN_KEY = "token";

const resolveSessionStorage = () => {
  if (typeof window === "undefined") {
    return null;
  }

  try {
    return window.sessionStorage;
  } catch {
    return null;
  }
};

const resolveLegacyStorage = () => {
  if (typeof window === "undefined") {
    return null;
  }

  try {
    return window.localStorage;
  } catch {
    return null;
  }
};

const migrateLegacyToken = () => {
  const storage = resolveSessionStorage();
  const legacyStorage = resolveLegacyStorage();

  if (!storage || !legacyStorage) {
    return storage;
  }

  const activeToken = storage.getItem(TOKEN_KEY);
  const legacyToken = legacyStorage.getItem(TOKEN_KEY);

  if (!activeToken && legacyToken) {
    storage.setItem(TOKEN_KEY, legacyToken);
  }

  if (legacyToken) {
    legacyStorage.removeItem(TOKEN_KEY);
  }

  return storage;
};

const decodeBase64Url = (value) => {
  const normalized = value.replace(/-/g, "+").replace(/_/g, "/");
  const padding = "=".repeat((4 - (normalized.length % 4)) % 4);
  return atob(normalized + padding);
};

export const getToken = () => {
  const storage = migrateLegacyToken();
  return storage ? storage.getItem(TOKEN_KEY) : null;
};

export const setToken = (token) => {
  const storage = migrateLegacyToken();
  if (!storage) {
    return;
  }

  storage.setItem(TOKEN_KEY, token);
};

export const clearToken = () => {
  const storage = migrateLegacyToken();
  const legacyStorage = resolveLegacyStorage();

  if (storage) {
    storage.removeItem(TOKEN_KEY);
  }

  if (legacyStorage) {
    legacyStorage.removeItem(TOKEN_KEY);
  }
};

export const readTokenPayload = (token) => {
  if (!token) {
    return null;
  }

  const parts = token.split(".");
  if (parts.length !== 3) {
    return null;
  }

  try {
    return JSON.parse(decodeBase64Url(parts[1]));
  } catch {
    return null;
  }
};

export const isTokenExpired = (token) => {
  const payload = readTokenPayload(token);

  if (!payload || typeof payload.exp !== "number") {
    return true;
  }

  return payload.exp * 1000 <= Date.now();
};

export const isTokenValid = (token) => Boolean(token) && !isTokenExpired(token);

export function removeToken() {
  localStorage.removeItem("token");
}

