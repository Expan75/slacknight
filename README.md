# General Documentation for Slacknight

Dev environment:

1. Clone repo down locally
2. Start the API server (cd <code>api/</code>) and use:

    $ npm start

3. In developmnet mode, you need to provide slack with a valid endpoint (for slack to pass on to you). For that, you need to supply and external endpoint reachable by slack. Use ngrok to set this up. In a new terminal, use:

    $ ./ngrok http ${API_SERVER_PORT}

4. This will enable slack messages to flow to the API as soon as you've confirmed the endpoint (the ngrok provided one) on Slack in the app settings.

5. Start the dataflow pipeline to engage sentiment analysis. cd into <code>/pipelines</code> using a new terminal window/tab and use the commands:

    $ source env/bin/activate # activates the python env

    $ python sentimentPipe.py \
    --input-topic $INPUT_TOPIC \
    --output-topic $OUPUT_TOPIC