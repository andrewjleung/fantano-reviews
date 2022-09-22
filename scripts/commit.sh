#!/bin/sh

message="auto-commit: update dataset on $(date)"
GIT=`which git`

cd ../tnd-reviews

${GIT} add . && \
${GIT} commit -m "$message" && \
${GIT} push
