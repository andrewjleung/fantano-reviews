#!/bin/sh

eval "$(ssh-agent -s)"
touch gh_ssh_key
cat /etc/secrets/id_ed25519 >> gh_ssh_key
echo "" >> gh_ssh_key
ssh-add gh_ssh_key

GIT=`which git`
${GIT} clone git@github.com:andrewjleung/tnd-reviews.git

ls tnd-reviews
