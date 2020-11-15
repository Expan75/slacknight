const mongoose = require('mongoose');


// Module config for configuration objects (1 per workspace)
const workspaceConfigSchema = new mongoose.Schema({
    workspaceId: String,


    // should add getters and setters for easy config via slack / commands
}, {
    timestamps: {
        createdAt: 'created_at',
        updatedAt: 'updated_at'
    }
})

const WorkspaceConfig = mongoose.model('workspaceConfig', workspaceConfigSchema);
module.exports = WorkspaceConfig;