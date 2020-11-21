from __future__ import absolute_import

import argparse
import json
import logging
import pprint
from past.builtins import unicode

import apache_beam as beam
import apache_beam.transforms.window as window
from apache_beam.options.pipeline_options import PipelineOptions
from apache_beam.options.pipeline_options import SetupOptions
from apache_beam.options.pipeline_options import StandardOptions
from apache_beam.metrics import Metrics
from apache_beam.ml.gcp import naturallanguageml as nlp
from google.cloud import language
from google.cloud.language import types, enums, types
from google.protobuf.json_format import MessageToDict


# setup pretty print
pp = pprint.PrettyPrinter(indent=2)

# Features that nlp api extracts
features = nlp.types.AnnotateTextRequest.Features(
    extract_document_sentiment=True,
)


@beam.typehints.with_output_types(types.AnnotateTextResponse)
class Custom_AnnotateTextFn(beam.DoFn):
    def __init__(
        self,
        features,  # type: Union[Mapping[str, bool], types.AnnotateTextRequest.Features]
        timeout,  # type: Optional[float]
        metadata=None,  # type: Optional[Sequence[Tuple[str, str]]]
    ):
        self.features = features
        self.timeout = timeout
        self.metadata = metadata
        self.api_calls = Metrics.counter(self.__class__.__name__, "api_calls")
        self.client = None

    def setup(self):
        self.client = self._get_api_client()

    @staticmethod
    def _get_api_client():
        # type: () -> language.LanguageServiceClient
        return language.LanguageServiceClient()

    def process(self, element):
        response = self.client.annotate_text(
            document=nlp.Document.to_dict(element[1]),
            features=self.features,
            encoding_type=element[1].encoding,
            timeout=self.timeout,
            metadata=self.metadata,
        )
        self.api_calls.inc()
        yield (element[0], response)


def run(argv=None, save_main_session=True):
    """Build and run the pipeline."""
    parser = argparse.ArgumentParser()
    parser.add_argument(
        "--output-topic",
        required=True,
        help=(
            "Output PubSub topic of the form " '"projects/<PROJECT>/topics/<TOPIC>".'
        ),
    )
    group = parser.add_mutually_exclusive_group(required=True)
    group.add_argument(
        "--input-topic",
        help=("Input PubSub topic of the form " '"projects/<PROJECT>/topics/<TOPIC>".'),
    )
    group.add_argument(
        "--input-subscription",
        help=(
            "Input PubSub subscription of the form "
            '"projects/<PROJECT>/subscriptions/<SUBSCRIPTION>."'
        ),
    )
    known_args, pipeline_args = parser.parse_known_args(argv)

    # We use the save_main_session option because one or more DoFn's in this
    # workflow rely on global context (e.g., a module imported at module level).
    pipeline_options = PipelineOptions(pipeline_args)
    pipeline_options.view_as(SetupOptions).save_main_session = save_main_session
    pipeline_options.view_as(StandardOptions).streaming = True
    with beam.Pipeline(options=pipeline_options) as p:

        # Read from PubSub into a PCollection.
        if known_args.input_subscription:
            messages = p | beam.io.ReadFromPubSub(
                subscription=known_args.input_subscription
            ).with_output_types(bytes)
        else:
            messages = p | beam.io.ReadFromPubSub(
                topic=known_args.input_topic
            ).with_output_types(bytes)

        # Debug ingress
        def debug_print(pcol_element):
            pp.pprint(pcol_element)
            return pcol_element

        def mergeMessageEventWithSentiment(messageEvent, messageSentiment):
            for key, value in MessageToDict(messageSentiment).items():
                messageEvent[key] = value

            return messageEvent

        parsed_messages = (
            messages
            | "decode" >> beam.Map(lambda x: x.decode("utf-8"))
            | "parse json" >> beam.Map(lambda x: json.loads(x))
        )

        analysed_messages = (
            parsed_messages
            | "documentify"
            >> beam.Map(
                lambda message: (message, nlp.Document(content=message["text"]))
            )
            | "sentiment analysis"
            >> beam.ParDo(Custom_AnnotateTextFn(features, timeout=60))
            | "clean up object"
            >> beam.MapTuple(
                lambda messageEvent, messageSentiment: mergeMessageEventWithSentiment(
                    messageEvent, messageSentiment
                )
            )
            | "debugger print2" >> beam.Map(lambda x: debug_print(x))
        )
        # Write to PubSub.
        # pylint: disable=expression-not-assigned
        # output | beam.io.WriteToPubSub(known_args.output_topic)


if __name__ == "__main__":
    logging.getLogger().setLevel(logging.INFO)
    run()
