#!/bin/bash

virtualenv .env \
&& source .env/bin/activate \
&& pip install -r requirements.txt \
&& cd fantano-fetch \
&& python get_vids.py \
&& npm install \
&& node index.js
