"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.handleMediaUpload = exports.uploadMiddleware = void 0;
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const multer_1 = __importDefault(require("multer"));
const cloudinary_1 = require("cloudinary");
// Configure Cloudinary if environment variables are provided
if (process.env.CLOUDINARY_URL) {
    cloudinary_1.v2.config();
}
else if (process.env.CLOUDINARY_CLOUD_NAME &&
    process.env.CLOUDINARY_API_KEY &&
    process.env.CLOUDINARY_API_SECRET) {
    cloudinary_1.v2.config({
        cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
        api_key: process.env.CLOUDINARY_API_KEY,
        api_secret: process.env.CLOUDINARY_API_SECRET,
    });
}
const isCloudinaryConfigured = Boolean(process.env.CLOUDINARY_URL ||
    (process.env.CLOUDINARY_CLOUD_NAME &&
        process.env.CLOUDINARY_API_KEY &&
        process.env.CLOUDINARY_API_SECRET));
// Ensure uploads folder exists
const uploadsDir = path_1.default.join(process.cwd(), 'uploads');
if (!fs_1.default.existsSync(uploadsDir)) {
    fs_1.default.mkdirSync(uploadsDir, { recursive: true });
}
// Multer Storage Configuration
const storage = multer_1.default.diskStorage({
    destination: (_req, _file, cb) => {
        cb(null, uploadsDir);
    },
    filename: (_req, file, cb) => {
        const ext = path_1.default.extname(file.originalname) || (file.mimetype.includes('video') ? '.mp4' : '.jpg');
        const uniqueName = `agromarket-${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`;
        cb(null, uniqueName);
    },
});
exports.uploadMiddleware = (0, multer_1.default)({
    storage,
    limits: {
        fileSize: 100 * 1024 * 1024, // 100 MB max for videos/photos
    },
});
const handleMediaUpload = async (req, res) => {
    try {
        const file = req.file;
        if (!file) {
            res.status(400).json({ message: 'No media file provided in request' });
            return;
        }
        const host = req.get('host') || 'localhost:5000';
        const protocol = req.protocol || 'http';
        const relativeUrl = `/uploads/${file.filename}`;
        const fileUrl = `${protocol}://${host}${relativeUrl}`;
        const isVideo = file.mimetype.startsWith('video/') || file.filename.endsWith('.mp4') || file.filename.endsWith('.mov');
        // If Cloudinary is configured (e.g., in production to prevent ephemeral disk wipeout), upload to Cloudinary CDN
        if (isCloudinaryConfigured) {
            try {
                console.log(`☁️ [CLOUDINARY] Uploading ${file.filename} (${(file.size / (1024 * 1024)).toFixed(2)} MB)...`);
                const result = await cloudinary_1.v2.uploader.upload(file.path, {
                    resource_type: isVideo ? 'video' : 'auto',
                    folder: 'agromarket_media',
                    use_filename: true,
                    unique_filename: true,
                });
                // Clean up temporary local file after successful cloud upload
                try {
                    fs_1.default.unlinkSync(file.path);
                }
                catch {
                    // ignore cleanup error
                }
                console.log(`☁️ [CLOUDINARY SUCCESS] Permanent URL: ${result.secure_url}`);
                res.status(200).json({
                    success: true,
                    url: result.secure_url,
                    fullUrl: result.secure_url,
                    filename: file.filename,
                    mimetype: file.mimetype,
                    isVideo,
                    size: file.size,
                    provider: 'cloudinary',
                });
                return;
            }
            catch (cloudErr) {
                console.warn('⚠️ [CLOUDINARY FALLBACK] Cloud upload failed, falling back to local disk:', cloudErr?.message || cloudErr);
            }
        }
        console.log(`📁 [UPLOAD SUCCESS] Saved: ${file.filename} (${(file.size / (1024 * 1024)).toFixed(2)} MB) -> ${fileUrl}`);
        res.status(200).json({
            success: true,
            url: relativeUrl,
            fullUrl: fileUrl,
            filename: file.filename,
            mimetype: file.mimetype,
            isVideo,
            size: file.size,
            provider: 'local',
        });
    }
    catch (error) {
        console.error('❌ [UPLOAD ERROR]', error);
        res.status(500).json({ message: error.message || 'Media upload failed' });
    }
};
exports.handleMediaUpload = handleMediaUpload;
