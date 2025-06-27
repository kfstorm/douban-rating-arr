#!/usr/bin/env bash

# Exit on error, undefined variables, and pipe failures
set -euo pipefail

# Build script for Chrome and Firefox versions of the extension

# Define supported browsers
browsers=(chrome firefox)

# Clean and create build directory
rm -rf build
mkdir -p build

# Build both Chrome and Firefox versions
for browser in "${browsers[@]}"; do
    echo "Building $browser version..."
    mkdir -p "build/$browser"

    # Copy all files and create images directory
    cp -r *.js *.html *.css *.md LICENSE "manifest_$browser.json" "build/$browser/"
    mkdir -p "build/$browser/images"

    # Copy only icon PNG files from images directory
    cp images/icon*.png "build/$browser/images/"

    # Replace browser-specific manifest with manifest.json
    mv "build/$browser/manifest_$browser.json" "build/$browser/manifest.json"

    echo "$browser version files copied"
done

# Create zip files
echo "Creating zip files..."
for browser in "${browsers[@]}"; do
    cd "build/$browser" && zip -r "../douban-rating-arr-$browser.zip" . && cd ../..
done

echo "Build complete!"
for browser in "${browsers[@]}"; do
    echo "$browser version: build/douban-rating-arr-$browser.zip"
done
