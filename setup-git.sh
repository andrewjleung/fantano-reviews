#!/bin/sh

eval "$(ssh-agent -s)"
echo "" >> /etc/secrets/id_ed25519
ssh-add /etc/secrets/id_ed25519

GIT=`which git`
${GIT} clone git@github.com:andrewjleung/tnd-reviews.git

ls tnd-reviews
