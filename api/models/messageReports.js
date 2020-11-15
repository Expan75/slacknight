const mongoose = require('mongoose');

// Module config for messageReport (user reporting abuse in messages)
const messageReportSchema = new mongoose.Schema({

    // report meta data
    reporter: {
        type: String,
        required: true
    },
    reported: {
        type: String,
        required: true
    },
    status: {
        type: String,
        default: "submitted",
        enum: ["submitted", "being viewed", "being processed", "completed"]
    },

    // Information related to the message that crossed the line
    slackMessageId: {
        type: String,
        required: true
    },
    messageId: {
        type: String,
        required: true
    },
    messageContent: {
        type: String,
        required: true
    },
    channel: {
        type: String,
        required: true
    },
    tags: {
        sexualHarrasment: {
            type: Boolean,
            default: false
        },
        racism: {
            type: Boolean,
            default: false
        },
        sexism: {
            type: Boolean,
            default: false
        },
        religiousPersecution: {
            type: Boolean,
            default: false
        },
        homophopia: {
            type: Boolean,
            default: false
        },
        other: {
            type: String,
        }
    },

    // workspace related info
    workspaceId: {
        type: String,
        required: true
    },

}, {
    timestamps: {
        createdAt: 'created_at',
        updatedAt: 'updated_at'
    }
});

const messageReport = mongoose.model('messageReport', messageReportSchema);
module.exports = messageReport;