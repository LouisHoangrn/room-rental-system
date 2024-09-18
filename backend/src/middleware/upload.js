/**
 * File Upload Middleware (Multer)
 *
 * Configures multer for handling file uploads:
 * - Room images: up to 5 files, stored in src/uploads/rooms/
 * - Avatars: single file, stored in src/uploads/avatars/
 *
 * Uses UUID-based filenames to prevent collisions.
 * Only allows image file types (jpeg, jpg, png, gif, webp).
 */

const multer = require("multer");
const path = require("path");
const fs = require("fs");
const { v4: uuidv4 } = require("uuid");

// Allowed image MIME types
const ALLOWED_MIME_TYPES = [
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/gif",
  "image/webp",
];

// Maximum file size: 5MB
const MAX_FILE_SIZE = 5 * 1024 * 1024;

/**
 * Ensure upload directories exist.
 * Creates them recursively if they don't.
 */
const ensureUploadDirs = () => {
  const dirs = [
    path.join(__dirname, "..", "uploads", "rooms"),
    path.join(__dirname, "..", "uploads", "avatars"),
  ];

  dirs.forEach((dir) => {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  });
};

// Create directories on module load
ensureUploadDirs();

/**
 * Create a multer diskStorage engine for a specific subfolder.
 *
 * @param {string} subfolder - Subfolder name under src/uploads/ (e.g. 'rooms', 'avatars')
 * @returns {multer.StorageEngine}
 */
const createStorage = (subfolder) => {
  return multer.diskStorage({
    destination: (req, file, cb) => {
      const uploadPath = path.join(__dirname, "..", "uploads", subfolder);
      // Ensure directory exists at upload time as well
      if (!fs.existsSync(uploadPath)) {
        fs.mkdirSync(uploadPath, { recursive: true });
      }
      cb(null, uploadPath);
    },
    filename: (req, file, cb) => {
      // Generate a unique filename: uuid + original extension
      const ext = path.extname(file.originalname).toLowerCase();
      const uniqueName = `${uuidv4()}${ext}`;
      cb(null, uniqueName);
    },
  });
};

/**
 * File filter that only accepts image files.
 * Rejects non-image uploads with a descriptive error message.
 */
const imageFileFilter = (req, file, cb) => {
  if (ALLOWED_MIME_TYPES.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(
      new Error(
        `Invalid file type: ${file.mimetype}. Only JPEG, PNG, GIF, and WebP images are allowed.`,
      ),
      false,
    );
  }
};

// ── Room Images Upload ─────────────────────────────────────────────────
// Accepts up to 5 image files under the field name "images"
const uploadRoomImages = multer({
  storage: createStorage("rooms"),
  fileFilter: imageFileFilter,
  limits: {
    fileSize: MAX_FILE_SIZE,
    files: 5,
  },
}).array("images", 5);

// ── Avatar Upload ──────────────────────────────────────────────────────
// Accepts a single image file under the field name "avatar"
const uploadAvatar = multer({
  storage: createStorage("avatars"),
  fileFilter: imageFileFilter,
  limits: {
    fileSize: MAX_FILE_SIZE,
    files: 1,
  },
}).single("avatar");

module.exports = { uploadRoomImages, uploadAvatar };
