import catalogClient from "./catalogService";

export const normalizeCustomerUser = (user = {}) => ({
  ...user,
  _id: user.id,
  user_name: user.name,
  watch_list: user.watch_list || [],
  chat: user.chat || [],
});

export const customerLogin = async ({ email, password }) => {
  const { data } = await catalogClient.post("/auth/login", { email, password });
  return {
    ...data,
    user: normalizeCustomerUser(data.user),
  };
};

export const adminLogin = async ({ email, password }) => {
  const { data } = await catalogClient.post("/auth/admin/login", {
    email,
    password,
  }, { authRole: "Admin" });

  return {
    ...data,
    user: normalizeCustomerUser(data.user),
  };
};

export const customerRegister = async ({ email, password, user_name, name, phone }) => {
  const { data } = await catalogClient.post("/auth/register", {
    email,
    password,
    name: name || user_name,
    phone,
  });

  return {
    ...data,
    user: normalizeCustomerUser(data.user),
  };
};

export const getMe = async (role = "Buyer") => {
  const { data } = await catalogClient.get("/auth/me", { authRole: role });
  return {
    ...data,
    user: normalizeCustomerUser(data.user),
  };
};

export const updateProfile = async ({ name, phone }, role = "Buyer") => {
  const { data } = await catalogClient.patch(
    "/auth/me",
    { name, phone },
    { authRole: role }
  );
  return {
    ...data,
    user: normalizeCustomerUser(data.user),
  };
};

export const changePassword = async (
  { currentPassword, newPassword },
  role = "Buyer"
) => {
  const { data } = await catalogClient.patch(
    "/auth/me/password",
    { currentPassword, newPassword },
    { authRole: role }
  );
  return data;
};

export const requestPasswordReset = async (email) => {
  const { data } = await catalogClient.post("/auth/password-reset/request", {
    email,
  });
  return data;
};

export const confirmPasswordReset = async ({
  email,
  otp,
  newPassword,
  confirmPassword,
}) => {
  const { data } = await catalogClient.post("/auth/password-reset/confirm", {
    email,
    otp,
    newPassword,
    confirmPassword,
  });
  return data;
};

export const customerLogout = async (role = "Buyer") => {
  const endpoint = role === "Admin" ? "/auth/admin/logout" : "/auth/logout";
  const { data } = await catalogClient.post(endpoint, {}, { authRole: role });
  return data;
};
