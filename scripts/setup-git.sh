#!/bin/sh

TOKEN=`cat etc/secrets/gh_pat`
GIT=`which git`
${GIT} clone https://github.com/andrewjleung/tnd-reviews.git
cd tnd-reviews
${GIT} remote set-url origin https://andrewjleung:${TOKEN}@github.com/andrewjleung/tnd-reviews.git
${GIT} config user.name "Andrew Leung"
${GIT} config user.email "andrewleung104@gmail.com"
