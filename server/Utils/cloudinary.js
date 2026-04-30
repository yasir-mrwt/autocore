const cloudinary = require("cloudinary").v2;

const getCloudinaryConfig = () => ({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const isCloudinaryConfigured = () => {
  const config = getCloudinaryConfig();
  return Boolean(config.cloud_name && config.api_key && config.api_secret);
};

const configureCloudinary = () => {
  if (!isCloudinaryConfigured()) return false;
  cloudinary.config({
    ...getCloudinaryConfig(),
    secure: true,
  });
  return true;
};

const uploadBuffer = (file, options = {}) =>
  new Promise((resolve, reject) => {
    if (!configureCloudinary()) {
      reject(new Error("Cloudinary is not configured."));
      return;
    }

    const stream = cloudinary.uploader.upload_stream(
      {
        folder: process.env.CLOUDINARY_UPLOAD_FOLDER || "autocore/products",
        resource_type: "image",
        overwrite: false,
        ...options,
      },
      (error, result) => {
        if (error) reject(error);
        else resolve(result);
      }
    );

    stream.end(file.data);
  });

const deleteAsset = async (publicId) => {
  if (!configureCloudinary()) {
    throw new Error("Cloudinary is not configured.");
  }

  return cloudinary.uploader.destroy(publicId, {
    resource_type: "image",
  });
};

module.exports = {
  deleteAsset,
  isCloudinaryConfigured,
  uploadBuffer,
};
