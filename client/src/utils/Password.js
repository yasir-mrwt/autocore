import CryptoJS from "crypto-js";

// Encrypt the password before storing it
export const encryptPassword = (password) => {
  return CryptoJS.AES.encrypt(
    JSON.stringify(password),
    import.meta.env.VITE_CRYPTO_SECRET_KEY
  );
};

// Decrypt the password
export const decryptPassword = (encryptedPassword) => {
  if (!encryptedPassword) return null;
  const bytes = CryptoJS.AES.decrypt(
    encryptedPassword,
    import.meta.env.VITE_CRYPTO_SECRET_KEY
  );
  let decryptedPassword = bytes.toString(CryptoJS.enc.Utf8);
  // Remove leading and trailing quotes from the decrypted password
  decryptedPassword = decryptedPassword.replace(/^"(.*)"$/, "$1");
  return decryptedPassword;
};
