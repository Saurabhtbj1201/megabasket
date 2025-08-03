const asyncHandler = require('express-async-handler');
const ContactSubmission = require('../models/contactModel.js');

// @desc    Submit a new contact form entry
// @route   POST /api/contact
// @access  Public
const submitContactForm = asyncHandler(async (req, res) => {
  const { name, email, phone, orderId, subject, message } = req.body;

  if (!name || !email || !subject || !message) {
    res.status(400);
    throw new Error('Please fill out all required fields.');
  }

  const submission = await ContactSubmission.create({
    name,
    email,
    phone,
    orderId,
    subject,
    message,
  });

  if (submission) {
    res.status(201).json({
      message: 'Your message has been submitted successfully.',
    });
  } else {
    res.status(400);
    throw new Error('Invalid data. Could not submit form.');
  }
});

// @desc    Get all contact submissions
// @route   GET /api/contact
// @access  Private/Admin
const getContactSubmissions = asyncHandler(async (req, res) => {
  const submissions = await ContactSubmission.find({}).sort({ createdAt: -1 });
  res.json(submissions);
});

// @desc    Update submission status
// @route   PUT /api/contact/:id/status
// @access  Private/Admin
const updateSubmissionStatus = asyncHandler(async (req, res) => {
  const submission = await ContactSubmission.findById(req.params.id);

  if (submission) {
    submission.status = req.body.status || submission.status;
    const updatedSubmission = await submission.save();
    res.json(updatedSubmission);
  } else {
    res.status(404);
    throw new Error('Submission not found');
  }
});

// @desc    Delete a contact submission
// @route   DELETE /api/contact/:id
// @access  Private/Admin
const deleteSubmission = asyncHandler(async (req, res) => {
  const submission = await ContactSubmission.findById(req.params.id);

  if (submission) {
    await ContactSubmission.deleteOne({ _id: req.params.id });
    res.json({ message: 'Submission removed' });
  } else {
    res.status(404);
    throw new Error('Submission not found');
  }
});

module.exports = { submitContactForm, getContactSubmissions, updateSubmissionStatus, deleteSubmission };
