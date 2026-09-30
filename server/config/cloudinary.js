const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');

// 1. Check if Cloudinary is fully configured in environment variables
const isCloudinaryConfigured = () => {
    return !!(
        process.env.CLOUDINARY_CLOUD_NAME &&
        process.env.CLOUDINARY_API_KEY &&
        process.env.CLOUDINARY_API_SECRET
    );
};

// 2. Configure Cloudinary if credentials exist
if (isCloudinaryConfigured()) {
    cloudinary.config({
        cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
        api_key: process.env.CLOUDINARY_API_KEY,
        api_secret: process.env.CLOUDINARY_API_SECRET
    });
}

// Reusable constraints matching existing server.js file limits
const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
const ALLOWED_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.webp', '.gif'];

const fileFilter = (req, file, cb) => {
    if (ALLOWED_MIME_TYPES.includes(file.mimetype)) {
        cb(null, true);
    } else {
        cb(new Error('Only JPEG, PNG, WebP, and GIF images are allowed'));
    }
};

const limits = { fileSize: 5 * 1024 * 1024 }; // 5MB max

// 3. Export a function to generate multer upload middleware dynamically based on folder name
const getUploadMiddleware = (folderName) => {

    // Branch A: Cloudinary Storage
    if (isCloudinaryConfigured()) {
        const storage = new CloudinaryStorage({
            cloudinary: cloudinary,
            params: {
                folder: `gbmarket/${folderName}`,
                // Cloudinary syntax for allowed formats without leading dots
                allowed_formats: ['jpg', 'jpeg', 'png', 'webp', 'gif'],
            },
        });

        return multer({ storage, fileFilter, limits });
    }

    // Branch B: Local Disk Storage Fallback
    const uploadDir = path.join(__dirname, '..', 'uploads');
    if (!fs.existsSync(uploadDir)) {
        fs.mkdirSync(uploadDir, { recursive: true });
    }

    const storage = multer.diskStorage({
        destination: (req, file, cb) => cb(null, uploadDir),
        filename: (req, file, cb) => {
            const ext = path.extname(file.originalname).toLowerCase();
            const safeExt = ALLOWED_EXTENSIONS.includes(ext) ? ext : '.png';
            cb(null, `${uuidv4()}${safeExt}`);
        }
    });

    return multer({ storage, fileFilter, limits });
};

module.exports = {
    getUploadMiddleware,
    isCloudinaryConfigured
};
