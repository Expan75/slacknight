const bodyParser = require('body-parser');
const express = require('express');
const mongoose = require('mongoose');
const {
    createEventAdapter
} = require('@slack/events-api');
const {
    PubSub
} = require('@google-cloud/pubsub');

// route imports
const workspaceConfigRoutes = require('./routes/workspaceConfigs')
const messageReportRoutes = require('./routes/messageReports')

// Google PUB/SUB setup; sets up topics if there's not already created.
const primaryMessageTopicName = process.env.PRIMARY_MESSAGE_TOPIC_NAME
const pubSubClient = new PubSub();
pubSubClient.createTopic(primaryMessageTopicName)
    .then(`Generated new primary topic for message flow with name: ${ primaryMessageTopicName }`)
    .catch(error => {
        // Only throw error message if not that topic has aleady been created
        // https://googleapis.dev/nodejs/pubsub/latest/google.pubsub.v1.Publisher.html#createTopic1
        if (error.code === 6) {
            console.log(`Main message topic "${ primaryMessageTopicName }" already created.`)
        } else {
            console.log(`ERROR: ${error}`)
        }
    });

// DB auth and connection
const mongoURI = process.env.MONGO_URI
mongoose.connect(mongoURI, {
        useNewUrlParser: true,
        useUnifiedTopology: true
    }).then(() => console.log(`MongoDB connected successfully`))
    .catch(err => console.log(err));

// Slack auth and event listen setup
const slackSigningSecret = process.env.SLACK_SIGNING_SECRET;
const slackEvents = createEventAdapter(slackSigningSecret);

// Setup server /w express
const port = process.env.PORT || 8000;
const app = express();

// inject middleware, incl. slack event listen
app.use('/slack/events', slackEvents.expressMiddleware())
app.use(bodyParser.json());

///// EVENT HANDLING /////

// Events handling
slackEvents.on('message', async (event) => {
    // key val object supplied alongside data payload. Value needs to be string
    console.log(event)
    const mockConfigObj = {
        processMyData: 'true'
    }
    // forward by publishing message in primary topic (gcp Pub/Sub)
    const data = JSON.stringify(event)
    const dataBuffer = Buffer.from(data)
    const customAttributes = mockConfigObj

    // publishes and retains messageId (useful?)
    const messageId = await pubSubClient
        .topic(primaryMessageTopicName)
        .publish(dataBuffer, customAttributes)
    console.log(`Message ${messageId} published.`);
});

// All slack event errors in listeners are caught here.
slackEvents.on('error', (error) => {
    // TODO: Something proper...
    console.log(error.name); // e.g. TypeError
});

///// ROUTES /////

// Simple health check
app.get('/api/v1/health', (req, res) => {
    res.json({
        statusCode: 200,
        message: 'Everything is up and running...'
    })
});

// Registration of modularized routes
app.use('/api/v1', workspaceConfigRoutes);
app.use('/api/v1', messageReportRoutes);

app.listen(port, () => {
    console.log(`Listening for events on ${port}`);
});