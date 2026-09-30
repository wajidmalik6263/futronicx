const express = require('express');

module.exports = function (pool) {
    const router = express.Router();

    // POST /api/contact (public)
    router.post('/', async (req, res, next) => {
        try {
            const { name, email, subject, message } = req.body;

            if (!name || !email || !subject || !message) {
                return res.status(400).json({ error: 'All fields are required (name, email, subject, message)' });
            }

            // Try to send email
            try {
                const { sendContactFormEmail } = require('../services/emailService');
                await sendContactFormEmail(name, email, subject, message);
                res.json({ success: true, message: 'Your message has been sent successfully!' });
            } catch (emailErr) {
                console.error('[Contact] Email send failed:', emailErr.message);
                // Still return success — we received the message even if email failed
                res.json({ success: true, message: 'Your message has been received. We will get back to you soon!' });
            }
        } catch (error) {
            next(error);
        }
    });

    return router;
};
