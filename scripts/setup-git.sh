#!/bin/sh

eval "$(ssh-agent -s)"

# Render (hosting service) trims secret files, which causes `ssh-add` to fail
# since it expects a trailing newline. The `secrets` directory is RO, so we
# create a new file in the file system we can modify, copy the key over, then
# add the trailing newline.
touch gh_ssh_key
cat /etc/secrets/id_ed25519 >> gh_ssh_key
echo "" >> gh_ssh_key

# `ssh-add` ignores key files that are too permissive. This adds the proper
# permissions for an SSH key.
chmod 600 gh_ssh_key

# The VM doesn't have GitHub as a known host by default.
ssh-keyscan -H github.com >> ~/.ssh/known_hosts

# Finally add the key so that the dataset can be pulled and modified.
ssh-add gh_ssh_key

GIT=`which git`
${GIT} config --global user.email "andrewleung104@gmail.com"
${GIT} config --global user.name "Andrew Leung"
${GIT} clone git@github.com:andrewjleung/tnd-reviews.git
