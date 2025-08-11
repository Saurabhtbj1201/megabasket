const EmailTemplate = require('../models/emailTemplateModel');
const User = require('../models/userModel');
const EmailHistory = require('../models/emailHistoryModel');
const asyncHandler = require('express-async-handler');
const nodemailer = require('nodemailer');

// Configure email transporter with fallback for development
let transporter;

// Check if email credentials are available - Fix variable name mismatches with .env file
if ((process.env.EMAIL_USER || process.env.EMAIL_USER) && 
    (process.env.EMAIL_PASSWORD || process.env.EMAIL_PASS)) {
    transporter = nodemailer.createTransport({
        host: process.env.EMAIL_HOST || 'smtp.gmail.com',
        port: process.env.EMAIL_PORT || 587,
        secure: false, // true for 465, false for other ports
        service: process.env.EMAIL_SERVICE || undefined, // Only use if specifically set
        auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASSWORD || process.env.EMAIL_PASS // Check both possible env var names
        }
    });
    
    // Verify connection configuration
    transporter.verify(function(error, success) {
        if (error) {
            console.error('Email verification error:', error);
        } else {
            console.log('Email server is ready to take our messages');
        }
    });
} else {
    console.warn('Email credentials not found. Using test account for development.');
    // For development - create a fake testing account
    nodemailer.createTestAccount().then(testAccount => {
        transporter = nodemailer.createTransport({
            host: 'smtp.ethereal.email',
            port: 587,
            secure: false,
            auth: {
                user: testAccount.user,
                pass: testAccount.pass
            }
        });
    }).catch(error => {
        console.error('Failed to create test email account:', error);
    });
}

// @desc    Get all email templates
// @route   GET /api/email/templates
// @access  Private/Admin
const getEmailTemplates = asyncHandler(async (req, res) => {
    const templates = await EmailTemplate.find({}).sort({ createdAt: -1 });
    res.json(templates);
});

// @desc    Create a new email template
// @route   POST /api/email/templates
// @access  Private/Admin
const createEmailTemplate = asyncHandler(async (req, res) => {
    const { name, subject, body } = req.body;

    if (!name || !subject || !body) {
        res.status(400);
        throw new Error('Please provide name, subject and body for the template');
    }

    const template = await EmailTemplate.create({
        name,
        subject,
        body,
        createdBy: req.user._id
    });

    res.status(201).json(template);
});

// @desc    Update an email template
// @route   PUT /api/email/templates/:id
// @access  Private/Admin
const updateEmailTemplate = asyncHandler(async (req, res) => {
    const { name, subject, body } = req.body;
    const template = await EmailTemplate.findById(req.params.id);

    if (template) {
        template.name = name || template.name;
        template.subject = subject || template.subject;
        template.body = body || template.body;

        const updatedTemplate = await template.save();
        res.json(updatedTemplate);
    } else {
        res.status(404);
        throw new Error('Template not found');
    }
});

// @desc    Delete an email template
// @route   DELETE /api/email/templates/:id
// @access  Private/Admin
const deleteEmailTemplate = asyncHandler(async (req, res) => {
    const template = await EmailTemplate.findById(req.params.id);

    if (template) {
        await EmailTemplate.deleteOne({ _id: req.params.id });
        res.json({ message: 'Template removed' });
    } else {
        res.status(404);
        throw new Error('Template not found');
    }
});

// @desc    Get an email template by ID
// @route   GET /api/email/templates/:id
// @access  Private/Admin
const getEmailTemplateById = asyncHandler(async (req, res) => {
    const template = await EmailTemplate.findById(req.params.id);
    if (template) {
        res.json(template);
    } else {
        res.status(404);
        throw new Error('Template not found');
    }
});

// @desc    Get all users for email selection
// @route   GET /api/email/users
// @access  Private/Admin
const getEmailUsers = asyncHandler(async (req, res) => {
    const users = await User.find({ isAdmin: false }).select('name email');
    res.json(users);
});

// @desc    Get email sending history
// @route   GET /api/email/history
// @access  Private/Admin
const getEmailHistory = asyncHandler(async (req, res) => {
    try {
        // Fetch real email history from database
        const emailHistory = await EmailHistory.find({ sentBy: req.user._id })
            .sort({ sentAt: -1 });
        
        res.json(emailHistory);
    } catch (error) {
        console.error('Error fetching email history:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch email history',
            error: process.env.NODE_ENV === 'production' ? undefined : error.message
        });
    }
});

// @desc    Send promotional email
// @route   POST /api/email/send
// @access  Private/Admin
const sendEmail = asyncHandler(async (req, res) => {
    const { subject, body, recipients, templateName } = req.body;

    if (!subject || !body || !recipients || recipients.length === 0) {
        res.status(400);
        throw new Error('Subject, body, and at least one recipient are required');
    }

    try {
        // Get user details for all recipients
        const users = await User.find({ _id: { $in: recipients } }).select('name email');
        
        if (users.length === 0) {
            return res.status(404).json({ 
                success: false,
                message: 'No valid recipients found with the provided IDs' 
            });
        }

        // Create email history record
        const emailHistoryRecord = {
            subject,
            body,
            recipients,
            recipientCount: recipients.length,
            sentBy: req.user._id,
            template: templateName || 'Custom Email'
        };

        // Check if email is configured
        if (!transporter) {
            // For development/demo, save history with demo status
            emailHistoryRecord.status = 'Demo';
            
            const historyEntry = await EmailHistory.create(emailHistoryRecord);
            
            // For development/demo, pretend it worked without actually sending
            console.log('Email transport not configured. Would have sent emails to:', users.map(u => u.email).join(', '));
            console.log('Subject:', subject);
            console.log('Body sample:', body.substring(0, 100) + '...');
            
            // Print configuration instructions to console
            console.log('\n=== EMAIL CONFIGURATION INSTRUCTIONS ===');
            console.log('To enable actual email sending, add these variables to your .env file:');
            console.log('EMAIL_SERVICE=gmail');
            console.log('EMAIL_USER=your-email@gmail.com');
            console.log('EMAIL_PASSWORD=your-app-password');
            console.log('\nFor Gmail:');
            console.log('1. Enable 2-step verification on your Google account');
            console.log('2. Generate an "App Password" for your application');
            console.log('3. Use that App Password in the EMAIL_PASSWORD field\n');
            
            return res.status(200).json({ 
                success: true, 
                message: `DEVELOPMENT MODE: Email would be sent to ${users.length} recipients`,
                demo: true,
                emails: users.map(u => u.email), // Include emails for debugging
                history: historyEntry
            });
        }
        
        // Add more detailed logging to trace issues
        console.log(`Sending email to ${users.length} recipients using service/host: ${process.env.EMAIL_SERVICE || process.env.EMAIL_HOST || 'default'}`);
        
        // Log all email-related environment variables (without showing actual credentials)
        console.log('Email configuration:', {
            host: process.env.EMAIL_HOST ? 'Set' : 'Not set',
            port: process.env.EMAIL_PORT || '587 (default)',
            service: process.env.EMAIL_SERVICE ? 'Set' : 'Not set',
            user: process.env.EMAIL_USER ? 'Set' : 'Not set',
            pass: (process.env.EMAIL_PASSWORD || process.env.EMAIL_PASS) ? 'Set' : 'Not set'
        });
        
        if (!process.env.EMAIL_USER || !(process.env.EMAIL_PASSWORD || process.env.EMAIL_PASS)) {
            console.warn('WARNING: Email configuration is incomplete. Check your .env file for EMAIL_USER and EMAIL_PASSWORD/EMAIL_PASS');
        }
        
        // Send emails to each user
        const emailPromises = users.map(user => {
            // Replace placeholders with actual user data
            const personalizedBody = body
                .replace(/{{name}}/g, user.name)
                .replace(/{{email}}/g, user.email);
                
            const mailOptions = {
                from: process.env.EMAIL_USER || 'noreply@megabasket.com',
                to: user.email,
                subject: subject,
                html: personalizedBody
            };
            
            console.log(`Prepared email for ${user.email}`);
            return transporter.sendMail(mailOptions);
        });
        
        // Add try/catch within Promise.all to catch specific email errors
        let results = [];
        try {
            results = await Promise.all(emailPromises);
            console.log('Email sending results:', results.map(r => r.messageId));
            
            // Save message IDs to history record
            emailHistoryRecord.messageIds = results.map(r => r.messageId);
            
            // Create email history entry with status "Delivered"
            const historyEntry = await EmailHistory.create(emailHistoryRecord);
            
        } catch (emailError) {
            console.error('Email sending failed:', emailError);
            
            // Save history with failed status
            emailHistoryRecord.status = 'Failed';
            await EmailHistory.create(emailHistoryRecord);
            
            // Check for common errors
            if (emailError.code === 'EAUTH') {
                return res.status(500).json({
                    success: false,
                    message: 'Email authentication failed. Check your credentials in .env file.',
                    error: emailError.message
                });
            } else if (emailError.code === 'ESOCKET') {
                return res.status(500).json({
                    success: false,
                    message: 'Network error when connecting to email server.',
                    error: emailError.message
                });
            }
            throw emailError; // Re-throw for general error handling
        }
        
        res.status(200).json({ 
            success: true, 
            message: `Email sent successfully to ${users.length} recipients`,
            messageIds: results.map(r => r.messageId)
        });
    } catch (error) {
        console.error('Email sending error:', error);
        
        // More detailed error message
        let errorMessage = 'Failed to send email';
        
        if (error.code === 'EAUTH') {
            errorMessage = 'Email authentication failed. Check your credentials.';
        } else if (error.code === 'ESOCKET') {
            errorMessage = 'Network error when connecting to email server.';
        } else if (error.command) {
            errorMessage = `SMTP command failed: ${error.command}`;
        }
        
        res.status(500).json({
            success: false,
            message: errorMessage,
            error: process.env.NODE_ENV === 'production' ? undefined : error.message
        });
    }
});

module.exports = { 
    getEmailTemplates, 
    createEmailTemplate, 
    updateEmailTemplate, 
    deleteEmailTemplate, 
    getEmailTemplateById,
    getEmailUsers,
    sendEmail,
    getEmailHistory
};
