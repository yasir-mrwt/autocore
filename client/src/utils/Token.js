export const setAccessToken = (accessToken) => {
  localStorage.setItem("accessToken", accessToken);
};

const setRefreshToken = (refreshToken) => {
  localStorage.setItem("refreshToken", refreshToken);
};

const setUserType = (userType) => {
  localStorage.setItem("userType", userType);
};

export const setTokens = (accessToken, refreshToken, userType) => {
  setAccessToken(accessToken);
  setRefreshToken(refreshToken);
  setUserType(userType);
};

export const getAccessToken = () => localStorage.getItem("accessToken") || "";
export const getRefreshToken = () => localStorage.getItem("refreshToken") || "";
export const getUserType = () => localStorage.getItem("userType") || "";
