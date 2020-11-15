// messageReports.js - Message report routes module.
const express = require('express');
const MessageReport = require('../models/messageReports.js')
const router = express.Router();

// list all, TODO: add auth
router.get('/reports', (req, res) => {
    MessageReport.find({}, 'messageReport')
        .then(data => res.json(data))
        .catch(err => res.json({
            statusCode: 500,
            message: `Error: Could not retrieve list of message reports from server.`
        }))
});

// create 
router.post('/reports', (req, res) => {
    console.log(req.body)
    if (req.body.messageReport) {
        MessageReport.create(req.body)
            .then(data => res.json(data))
    } else {
        res.json({
            statusCode: 400,
            message: 'Error: message report could not be created.'
        })
    }
})

// detail get
router.get('/reports/:id', (req, res) => {
    const docId = req.params.id;
    MessageReport.findOne({
            _id: docId
        })
        .then(data => res.json(data))
        .catch(() => res.json({
            statusCode: 404,
            message: `Error: Could not find a Report with id "${docId}"`
        }));
});

// detail update
router.put('/reports/:id', (req, res) => {
    if (req.body.messageReport) {
        const docId = req.params.id;
        const updatedDoc = req.body.messageReport

        MessageReport.findByIdAndUpdate(docId, updatedDoc, {
                useFindAndModify: false
            })
            .then(data => res.json(data))
            .catch(error => res.json({
                statusCode: 404,
                message: `Error: Could not find & update a report with id "${docId}"`
            }));
    } else {
        res.json({
            statusCode: 400,
            messsage: 'Error: please provide a valid _id and the new document body.'
        });
    }
});

// delete detail, mainly data rentention purposes
router.delete('/reports/:id', (req, res) => {
    const docId = req.params.id;
    MessageReport.findByIdAndDelete(docId)
        .then(data => res.json(data))
        .catch(error => res.json({
            statusCode: 400,
            messsage: 'Error: please provide a valid _id for a report to be deleted.'
        }));
});


// export
module.exports = router;