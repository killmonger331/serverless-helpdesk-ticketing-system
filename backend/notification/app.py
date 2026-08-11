import json
import logging
import os
from typing import Any

import boto3

logger = logging.getLogger()
logger.setLevel(logging.INFO)

ses = boto3.client("ses")

SENDER_EMAIL = os.environ["SENDER_EMAIL"]