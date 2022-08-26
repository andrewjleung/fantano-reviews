#!/bin/sh

eval "$(ssh-agent -s)"
ssh-add /etc/secrets/id_ed25519

GIT=`which git`
${GIT} clone git@github.com:andrewjleung/tnd-reviews.git

ls tnd-reviews
