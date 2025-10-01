#!/bin/bash

# Build script for Gostly releases
# Usage: ./scripts/build-release.sh [platform] [version]

set -e

PLATFORM=${1:-"all"}
VERSION=${2:-"dev"}

echo "Building Gostly for platform: $PLATFORM"
echo "Version: $VERSION"

# Install dependencies
echo "Installing frontend dependencies..."
cd frontend
npm ci
echo "Building frontend..."
npm run build
cd ..

# Install Wails if not present
if ! command -v wails &> /dev/null; then
    echo "Installing Wails..."
    go install github.com/wailsapp/wails/v2/cmd/wails@latest
fi

# Build function
build_platform() {
    local platform=$1
    local arch=$2
    local full_platform="$platform/$arch"
    
    echo "Building for $full_platform..."
    
    if [ "$platform" = "darwin" ]; then
        wails build -platform "$full_platform" -clean -ldflags "-s -w -X main.version=$VERSION"
        
        # Create DMG for macOS
        if command -v create-dmg &> /dev/null; then
            echo "Creating DMG for $full_platform..."
            mkdir -p "dmg-$arch"
            cp -r "build/bin/gostly.app" "dmg-$arch/"
            create-dmg \
                --volname "Gostly" \
                --volicon "appicon.icns" \
                --window-pos 200 120 \
                --window-size 600 300 \
                --icon-size 100 \
                --icon "gostly.app" 175 120 \
                --hide-extension "gostly.app" \
                --app-drop-link 425 120 \
                "gostly-$full_platform.dmg" \
                "dmg-$arch/"
            rm -rf "dmg-$arch"
        else
            echo "create-dmg not found. Install with: brew install create-dmg"
        fi
    elif [ "$platform" = "windows" ]; then
        wails build -platform "$full_platform" -clean -ldflags "-s -w -X main.version=$VERSION"
        
        # Create installer
        echo "Creating Windows installer..."
        wails build -platform "$full_platform" -clean -ldflags "-s -w -X main.version=$VERSION" -nsis
    fi
}

# Build based on platform
case $PLATFORM in
    "darwin")
        build_platform "darwin" "amd64"
        build_platform "darwin" "arm64"
        ;;
    "windows")
        build_platform "windows" "amd64"
        ;;
    "all")
        build_platform "darwin" "amd64"
        build_platform "darwin" "arm64"
        build_platform "windows" "amd64"
        ;;
    *)
        echo "Unknown platform: $PLATFORM"
        echo "Supported platforms: darwin, windows, all"
        exit 1
        ;;
esac

echo "Build completed!"
echo "Output files:"
find build/bin -name "*.exe" -o -name "*.app" -o -name "*.dmg" 2>/dev/null || true
