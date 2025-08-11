const express = require('express');
const router = express.Router();
const { protect, admin } = require('../middleware/authMiddleware');
const {
    getEmailTemplates,
    createEmailTemplate,
    updateEmailTemplate,
    deleteEmailTemplate,
    getEmailTemplateById,
    getEmailUsers,
    sendEmail,
    getEmailHistory
} = require('../controllers/emailController');

// Template routes
router.route('/templates')
    .get(protect, admin, getEmailTemplates)
    .post(protect, admin, createEmailTemplate);

router.route('/templates/:id')
    .get(protect, admin, getEmailTemplateById)
    .put(protect, admin, updateEmailTemplate)
    .delete(protect, admin, deleteEmailTemplate);

// User list for email recipients
router.route('/users').get(protect, admin, getEmailUsers);

// Send email route
router.route('/send').post(protect, admin, sendEmail);

// Email history route
router.route('/history').get(protect, admin, getEmailHistory);

module.exports = router;
