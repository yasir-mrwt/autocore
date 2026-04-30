const ROLE_KEYS = {
  Buyer: {
    accessToken: "autocore_customer_access_token",
    refreshToken: "autocore_customer_refresh_token",
    userType: "autocore_customer_role",
  },
  Admin: {
    accessToken: "autocore_admin_access_token",
    refreshToken: "autocore_admin_refresh_token",
    userType: "autocore_admin_role",
  },
};

const normalizeRole = (role = "Buyer") => (role === "Admin" ? "Admin" : "Buyer");

const getKeys = (role) => ROLE_KEYS[normalizeRole(role)];

const authStorage = () => localStorage;

const clearFromAllStorage = (key) => {
  sessionStorage.removeItem(key);
  localStorage.removeItem(key);
};

export const setAccessToken = (accessToken, role = "Buyer") => {
  const keys = getKeys(role);
  if (accessToken) authStorage().setItem(keys.accessToken, accessToken);
  else clearFromAllStorage(keys.accessToken);
};

const setRefreshToken = (refreshToken, role = "Buyer") => {
  const keys = getKeys(role);
  if (refreshToken) authStorage().setItem(keys.refreshToken, refreshToken);
  else clearFromAllStorage(keys.refreshToken);
};

const setUserType = (userType) => {
  const role = normalizeRole(userType);
  authStorage().setItem(getKeys(role).userType, role);
};

export const setTokens = (accessToken, refreshToken, userType = "Buyer") => {
  const role = normalizeRole(userType);
  setAccessToken(accessToken, role);
  setRefreshToken(refreshToken, role);
  setUserType(role);
};

export const clearTokens = (role = "Buyer") => {
  const keys = getKeys(role);
  clearFromAllStorage(keys.accessToken);
  clearFromAllStorage(keys.refreshToken);
  clearFromAllStorage(keys.userType);
};

export const getAccessToken = (role = "Buyer") =>
  authStorage().getItem(getKeys(role).accessToken) || "";

export const getRefreshToken = (role = "Buyer") =>
  authStorage().getItem(getKeys(role).refreshToken) || "";

export const getUserType = (role = "Buyer") =>
  authStorage().getItem(getKeys(role).userType) || "";

export const hasStoredSession = (role = "Buyer") => Boolean(getAccessToken(role));

export const clearLegacyTokens = () => {
  ["accessToken", "refreshToken", "userType"].forEach((key) => {
    sessionStorage.removeItem(key);
    localStorage.removeItem(key);
  });
  Object.values(ROLE_KEYS).forEach((keys) => {
    sessionStorage.removeItem(keys.accessToken);
    sessionStorage.removeItem(keys.refreshToken);
    sessionStorage.removeItem(keys.userType);
  });
};
