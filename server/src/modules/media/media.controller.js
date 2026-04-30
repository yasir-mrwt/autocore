const { deleteAsset, uploadBuffer } = require("../../../Utils/cloudinary");

const MAX_IMAGE_SIZE = 5 * 1024 * 1024;
const ALLOWED_MIME_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];

const getUploadedFile = (req) =>
  req.files?.file || req.files?.image || req.files?.media || null;

const uploadAdminImage = async (req, res, next) => {
  try {
    const file = getUploadedFile(req);

    if (!file) {
      return res.status(400).json({ message: "Image file is required." });
    }

    if (!ALLOWED_MIME_TYPES.includes(file.mimetype)) {
      return res.status(400).json({
        message: "Only JPG, PNG, WEBP, or GIF images are allowed.",
      });
    }

    if (file.size > MAX_IMAGE_SIZE) {
      return res.status(413).json({ message: "Image must be 5MB or smaller." });
    }

    const result = await uploadBuffer(file, {
      context: {
        uploadedBy: req.user.id,
        source: "admin-dashboard",
      },
    });

    return res.status(201).json({
      message: "Image uploaded.",
      asset: {
        publicId: result.public_id,
        url: result.secure_url,
        width: result.width,
        height: result.height,
        format: result.format,
        bytes: result.bytes,
      },
    });
  } catch (error) {
    if (error.message === "Cloudinary is not configured.") {
      return res.status(503).json({
        message: "Cloudinary is not configured. Add CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, and CLOUDINARY_API_SECRET.",
      });
    }

    return next(error);
  }
};

const deleteAdminImage = async (req, res, next) => {
  try {
    const publicId = req.body.publicId || req.params.publicId;

    if (!publicId) {
      return res.status(400).json({ message: "Cloudinary publicId is required." });
    }

    const result = await deleteAsset(publicId);

    return res.status(200).json({
      message: "Image deleted.",
      result,
    });
  } catch (error) {
    if (error.message === "Cloudinary is not configured.") {
      return res.status(503).json({
        message: "Cloudinary is not configured. Add CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, and CLOUDINARY_API_SECRET.",
      });
    }

    return next(error);
  }
};

module.exports = {
  deleteAdminImage,
  uploadAdminImage,
};
