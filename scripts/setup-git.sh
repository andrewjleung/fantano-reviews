#!/bin/sh

# TODO: This is an insecure way to go about authenticating with GItHub.
# Ideally I should be using SSH but getting the proper credentials setup in
# the deploy environment is quite difficult. This works for now.
TOKEN=$1
GIT=`which git`
${GIT} clone https://github.com/andrewjleung/tnd-reviews.git
cd tnd-reviews
${GIT} remote set-url origin https://andrewjleung:${TOKEN}@github.com/andrewjleung/tnd-reviews.git
${GIT} config user.name "Andrew Leung"
${GIT} config user.email "andrewleung104@gmail.com"
