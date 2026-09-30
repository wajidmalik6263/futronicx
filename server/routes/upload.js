const express = require('express');

const { getUploadMiddleware, isCloudinaryConfigured } = require('../config/cloudinary');
const uploadSite = getUploadMiddleware('site');

module.exports = function (pool, requireAdmin, _legacyUpload) {
    const router = express.Router();

    // POST /api/upload
    router.post('/', requireAdmin, uploadSite.single('image'), (req, res, next) => {
        try {
            if (!req.file) return res.status(400).json({ error: 'No image provided' });

            let imageUrl;
            if (isCloudinaryConfigured()) {
                imageUrl = req.file.path; // Cloudinary secure_url is stored in req.file.path
            } else {
                imageUrl = `/uploads/${req.file.filename}`;
            }

            res.status(201).json({ url: imageUrl });
        } catch (error) {
            next(error);
        }
    });

    return router;
};
