#!/bin/sh

eval "$(ssh-agent -s)"
touch /etc/secrets/id_ed25519_copy
cat /etc/secrets/id_ed25519 >> /etc/secrets/id_ed25519_copy
echo "" >> /etc/secrets/id_ed25519_copy
ssh-add /etc/secrets/id_ed25519_copy

GIT=`which git`
${GIT} clone git@github.com:andrewjleung/tnd-reviews.git

ls tnd-reviews
