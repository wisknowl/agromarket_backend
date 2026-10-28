"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.handleMediaUpload = exports.uploadMiddleware = void 0;
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const multer_1 = __importDefault(require("multer"));
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
        console.log(`📁 [UPLOAD SUCCESS] Saved: ${file.filename} (${(file.size / (1024 * 1024)).toFixed(2)} MB) -> ${fileUrl}`);
        res.status(200).json({
            success: true,
            url: relativeUrl,
            fullUrl: fileUrl,
            filename: file.filename,
            mimetype: file.mimetype,
            isVideo,
            size: file.size,
        });
    }
    catch (error) {
        console.error('❌ [UPLOAD ERROR]', error);
        res.status(500).json({ message: error.message || 'Media upload failed' });
    }
};
exports.handleMediaUpload = handleMediaUpload;
