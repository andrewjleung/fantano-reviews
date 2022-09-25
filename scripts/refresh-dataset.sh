#!/bin/bash

GIT=`which git`

cd ./tnd-reviews
${GIT} pull
cd ..

yarn install
npx tsx ./src/generateDatasets.ts

mv -f reviews.csv ./tnd-reviews
mv -f all_videos.json ./tnd-reviews

cd ./tnd-reviews

message="auto-commit: refresh dataset on $(date)"
${GIT} add reviews.csv all_videos.json && \
${GIT} commit -m "$message" && \
${GIT} push
