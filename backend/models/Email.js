const mongoose = require('mongoose')

const emailSchema = new mongoose.Schema({

    subject: {
        type: String,
        required: true
    },

    body: {
        type: String,
        required: true
    },

    recipients: {
        type: [String],
        required: true
    },

    status: {
        type: String,
        enum: ['Sent', 'Failed'],
        default: 'Failed'
    },

    sentAt: {
        type: Date,
        default: Date.now
    }

})

const Email = mongoose.model('Email', emailSchema)

module.exports = Email