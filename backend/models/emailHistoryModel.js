const mongoose = require('mongoose');

const emailHistorySchema = new mongoose.Schema({
    subject: {
        type: String,
        required: true
    },
    template: {
        type: String,
        default: 'Custom Email'
    },
    body: {
        type: String,
        required: true
    },
    recipients: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }],
    recipientCount: {
        type: Number,
        required: true
    },
    sentBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    status: {
        type: String,
        enum: ['Delivered', 'Failed', 'Pending', 'Demo'],
        default: 'Delivered'
    },
    messageIds: [String],
    sentAt: {
        type: Date,
        default: Date.now
    }
}, {
    timestamps: true
});

const EmailHistory = mongoose.model('EmailHistory', emailHistorySchema);

module.exports = EmailHistory;
