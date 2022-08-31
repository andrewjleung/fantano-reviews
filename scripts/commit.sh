#!/bin/sh

message="auto-commit: update dataset on $(date)"
GIT=`which git`

cd ../tnd-reviews

# The VM doesn't have GitHub as a known host by default.
# https://serverfault.com/a/1098531
curl --silent https://api.github.com/meta | \
  python3 -c 'import json,sys;print(*["github.com " + x for x in json.load(sys.stdin)["ssh_keys"]], sep="\n")' \
  >> ~/.ssh/known_hosts

ssh -T git@github.com

${GIT} add reviews.csv all_videos.json && \
${GIT} commit -m "$message" && \
${GIT} push
