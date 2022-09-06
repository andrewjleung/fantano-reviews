#!/bin/sh

message="auto-commit: update dataset on $(date)"
GIT=`which git`

cd ../tnd-reviews

# Pulling before WON'T update the in-memory cache of video IDs used to prevent
# duplicate videos from being added. This assumes that no changes will be made
# to the datasets beyond the callback server auto-updating it or a refresh of
# the ENTIRE dataset. 
${GIT} stash
${GIT} pull
${GIT} stash apply
${GIT} add . && \
${GIT} commit -m "$message" && \
${GIT} push
