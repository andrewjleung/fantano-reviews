#!/bin/bash

GIT=`which git`

cd ./tnd-reviews
${GIT} pull
cd ..

source ./generation/.venv/bin/activate
python3 ./generation/generate_dataset.py -f -d

mv -f reviews.csv ./tnd-reviews
mv -f all_videos.json ./tnd-reviews

cd ./tnd-reviews

message="auto-commit: refresh dataset on $(date)"
${GIT} add reviews.csv all_videos.json && \
${GIT} commit -m "$message" && \
${GIT} push
