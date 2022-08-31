#!/bin/sh

message="auto-commit: update dataset on $(date)"
GIT=`which git`

cd ../tnd-reviews

ssh -T git@github.com

${GIT} add reviews.csv all_videos.json && \
${GIT} commit -m "$message" && \
${GIT} push
