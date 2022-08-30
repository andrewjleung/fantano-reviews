#!/bin/sh

eval "$(ssh-agent -s)"

touch ~/.ssh/id_ed25519
toucn ~/.ssh/id_ed25519.pub
cat /etc/secrets/id_ed25519 >> ~/.ssh/id_ed25519
cat /etc/secrets/id_ed25519.pub >> ~/.ssh/id_ed25519.pub

# Render (hosting service) trims secret files, which causes `ssh-add` to fail
# since it expects a trailing newline. The `secrets` directory is RO, so we
# create a new file in the file system we can modify, copy the key over, then
# add the trailing newline.
echo "" >> ~/.ssh/id_ed25519
echo "" >> ~/.ssh/id_ed25519.pub

# `ssh-add` ignores key files that are too permissive. This adds the proper
# permissions for an SSH key.
chmod 600 ~/.ssh/id_ed25519

# The VM doesn't have GitHub as a known host by default.
# https://serverfault.com/a/1098531
curl --silent https://api.github.com/meta | \
  python3 -c 'import json,sys;print(*["github.com " + x for x in json.load(sys.stdin)["ssh_keys"]], sep="\n")' \
  >> ~/.ssh/known_hosts

# Finally add the key so that the dataset can be pulled and modified.
ssh-add ~/.ssh/id_ed25519

GIT=`which git`
${GIT} clone git@github.com:andrewjleung/tnd-reviews.git
cd tnd-reviews
${GIT} config user.name "Andrew Leung"
${GIT} config user.email "andrewleung104@gmail.com"
