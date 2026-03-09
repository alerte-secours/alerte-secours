#!/bin/bash

# Make script exit on first error
set -e

echo "🧹 Cleaning iOS build caches..."

# Clear React Native bundler cache
echo "📦 Clearing React Native bundler cache..."
rm -rf $TMPDIR/metro-* 2>/dev/null || true
rm -rf $TMPDIR/haste-map-* 2>/dev/null || true

# Clean Xcode build folder
echo "🗑️  Cleaning Xcode build folder..."
xcodebuild clean -workspace ios/alertesecours.xcworkspace -scheme AlerteSecours -configuration Release
rm -rf ios/build

# Clear Xcode derived data (optional but thorough)
echo "🧼 Clearing Xcode derived data..."
rm -rf ~/Library/Developer/Xcode/DerivedData/*

# Clean and reinstall pods
echo "♻️  Cleaning CocoaPods cache..."
cd ios
rm -rf Pods
rm -rf ~/Library/Caches/CocoaPods
pod cache clean --all
pod deintegrate
pod setup
pod install
cd ..

echo "✨ Cache cleaning completed! You can now rebuild your app."
