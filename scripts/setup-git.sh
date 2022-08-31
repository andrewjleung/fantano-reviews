#!/bin/sh

# Test SSH.
ssh -T git@github.com

GIT=`which git`
${GIT} clone git@github.com:andrewjleung/tnd-reviews.git
cd tnd-reviews
${GIT} config user.name "Andrew Leung"
${GIT} config user.email "andrewleung104@gmail.com"
