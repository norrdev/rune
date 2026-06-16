#!/bin/bash

Build the Tauri app
echo "Building for desktop..."
npm run tauri build

echo "Building for Android..."
npm run tauri -- android build --apk --target aarch64