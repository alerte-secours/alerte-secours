#!/bin/bash

set -e

# This is the publish script for self-hosted expo updates.

RELEASECHANNEL=$1
PROJECTPATH=$2
UPLOADKEY=$3
APISERVER=$4

showUsage () {
  printf "Usage: expo-publish-selfhosted.sh <release-channel> <expo-project-folder> <upload-key> <api-server> \n"
  printf "Example: expo-publish-selfhosted.sh staging ~/expo/myproject abc123def456 http://localhost:3000 \n"
}

###############################################################################
# Check that all the required parameters are present.
###############################################################################

# Checking Release Channel
if [ -z "$RELEASECHANNEL" ]; then
      printf "Error: missing release channel parameter.\n"
      showUsage
      exit 1
fi

# Checking Project Path
if [ -z "$PROJECTPATH" ]; then
      printf "Error: missing project folder directory release channel parameter.\n"
      showUsage
      exit 1
fi

# Checking Upload Key
if [ -z "$UPLOADKEY" ]; then
      printf "Error: missing upload key parameter.\n"
      showUsage
      exit 1
fi

# Checking API Server
if [ -z "$APISERVER" ]; then
      printf "Error: missing API Server parameter.\n"
      showUsage
      exit 1
fi


# Checking project path
cd $PROJECTPATH
if [ ! -f "app.json" ] && [ ! -f "app.config.js" ]; then
  printf "Error: app.json or app.config.js not found in $(pwd)\n"
  exit 1
fi

###############################################################################
# Publish the update
###############################################################################

# Getting project slug for project name and runtime version

if [ -f "app.json" ]; then
  SLUG=$(grep -o '"slug": "[^"]*' app.json | grep -o '[^"]*$')
  RUNTIMEVERSION=$(grep -o '"runtimeVersion": "[^"]*' app.json | grep -o '[^"]*$')
elif [ -f "app.config.js" ]; then
  SLUG=$(node -p "require('./app.config.js').expo.slug")
  RUNTIMEVERSION=$(node -p "require('./app.config.js').expo.runtimeVersion")
fi

BUILDFOLDER=/tmp/$SLUG-$RUNTIMEVERSION-$RELEASECHANNEL
BUILDNAME=$(basename $BUILDFOLDER)
PAYLOAD="$BUILDNAME.zip"

# Idempotent cleanup
rm -rf $BUILDFOLDER
rm -f $BUILDFOLDER.zip
mkdir $BUILDFOLDER

# Build update
yarn expo export --experimental-bundle --output-dir $BUILDFOLDER

# Add app.json/app.config.js & package.json to the build for info & Metadata
if [ -f "app.json" ]; then
  cp app.json $BUILDFOLDER/
else
  # Convert app.config.js to app.json and copy to build folder
  node -e "const fs = require('fs'); const config = require('./app.config.js').expo; fs.writeFileSync('$BUILDFOLDER/app.json', JSON.stringify({ expo: config }, null, 2));"
fi
cp package.json $BUILDFOLDER/

# Compress update
cd $BUILDFOLDER
zip -q "$BUILDNAME.zip" -r ./*
cd -

# Upload update
curl --location --request POST "$APISERVER/upload" \
--form "uri=@$BUILDFOLDER/$PAYLOAD" \
--header "project: $SLUG" \
--header "version: $RUNTIMEVERSION" \
--header "release-channel: $RELEASECHANNEL" \
--header "upload-key: $UPLOADKEY"  \
--header "git-branch: $(git rev-parse --abbrev-ref HEAD)" \
--header "git-commit: $(git log -n 1 --format="%H")"

# Cleanup
# rm -rf "$BUILDFOLDER"
# rm -f "$BUILDNAME.zip"

printf "\n\nPublish Done"
