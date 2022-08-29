#!/bin/bash

videoId=$1

cd ../generation
source ./.venv/bin/activate
python3 ./update_dataset.py $videoId
