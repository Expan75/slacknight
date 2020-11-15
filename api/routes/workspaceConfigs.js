// workspaceConfig.js - Workspace configuration route module.
const express = require('express');
const WorkspaceConfig = require('../models/workspaceConfigs.js')
const router = express.Router();

// list all, TODO: ONLY FOR INTERAL USAGE & TESTING
router.get('/configs', (req, res) => {
    WorkspaceConfig.find({}, 'workspaceConfig')
        .then(data => res.json(data))
        .catch(err => res.json({
            statusCode: 500,
            message: `Error: Could not retrieve list of configs from server.`
        }))
});

// create
router.post('/configs', (req, res) => {
    console.log(req.body)
    if (req.body.workspaceConfig) {
        WorkspaceConfig.create(req.body)
            .then(data => res.json(data))
    } else {
        res.json({
            statusCode: 400,
            message: 'Error: Workspace configuration could not be created.'
        })
    }
})

// detail get
router.get('/configs/:id', (req, res) => {
    // should work with both /w mongo Uid and workspace id
    const docId = req.params.id;
    WorkspaceConfig.findOne({
            _id: docId
        })
        .then(data => res.json(data))
        .catch(() => res.json({
            statusCode: 404,
            message: `Error: Could not find a Workspace configuration with id "${docId}"`
        }));
});

// detail update
router.put('/configs/:id', (req, res) => {
    // TODO: should work with both /w mongo Uid and workspace id
    if (req.body.workspaceConfig) {
        const docId = req.params.id;
        const updatedDoc = req.body.workspaceConfig

        WorkspaceConfig.findByIdAndUpdate(docId, updatedDoc, {
                useFindAndModify: false
            })
            .then(data => res.json(data))
            .catch(error => res.json({
                statusCode: 404,
                message: `Error: Could not find & update a Workspace configuration with id "${docId}"`
            }));
    } else {
        res.json({
            statusCode: 400,
            messsage: 'Error: please provide a valid _id and the new document body.'
        });
    }
});

// delete detail config. Essentially defaults how processing pipes operate.
router.delete('/configs/:id', (req, res) => {
    const docId = req.params.id;
    WorkspaceConfig.findByIdAndDelete(docId)
        .then(data => res.json(data))
        .catch(error => res.json({
            statusCode: 400,
            messsage: 'Error: please provide a valid _id for a document to be deleted.'
        }));
});


// export
module.exports = router;