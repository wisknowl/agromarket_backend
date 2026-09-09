"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const upload_controller_1 = require("./upload.controller");
const router = (0, express_1.Router)();
// Accept single file with field name 'file' or 'media'
router.post('/', upload_controller_1.uploadMiddleware.single('file'), upload_controller_1.handleMediaUpload);
router.post('/media', upload_controller_1.uploadMiddleware.single('media'), upload_controller_1.handleMediaUpload);
exports.default = router;
