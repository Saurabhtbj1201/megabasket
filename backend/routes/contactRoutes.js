const express = require('express');
const {
  submitContactForm,
  getContactSubmissions,
  updateSubmissionStatus,
  deleteSubmission,
} = require('../controllers/contactController.js');
const { protect, admin } = require('../middleware/authMiddleware');

const router = express.Router();

router
  .route('/')
  .post(submitContactForm)
  .get(protect, admin, getContactSubmissions);

router.route('/:id/status').put(protect, admin, updateSubmissionStatus);

router.route('/:id').delete(protect, admin, deleteSubmission);

module.exports = router;
