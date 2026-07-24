// بسيط لإدارة التخزين المحلي للتوكين واليوزر

const TOKEN_KEY = "access_token";
const USER_KEY = "user";

export const saveAuthData = (token, user) => {
  if (token) {
    localStorage.setItem(TOKEN_KEY, token);
  }
  if (user) {
    localStorage.setItem(USER_KEY, JSON.stringify(user));
  }
};

export const getToken = () => {
  return localStorage.getItem(TOKEN_KEY);
};

export const getUserFromStorage = () => {
  const raw = localStorage.getItem(USER_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch (e) {
    console.error("Failed to parse stored user", e);
    return null;
  }
};

export const clearAuthData = () => {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
};
