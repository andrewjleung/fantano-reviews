#!/bin/sh

message="auto-commit: update dataset on $(date)"
GIT=`which git`

mv ../all_videos.json ../tnd-reviews/all_videos.json
mv ../reviews.csv ../tnd-reviews/reviews.csv
cd ../tnd-reviews

${GIT} add . && \
${GIT} commit -m "$message" && \
${GIT} push
