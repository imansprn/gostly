# Release Process

This document describes how to create releases for Gostly with automated builds for multiple platforms.

## Automated Releases

### Creating a Release

1. **Create a Git Tag:**
   ```bash
   git tag v1.0.0
   git push origin v1.0.0
   ```

2. **Or use GitHub UI:**
   - Go to the "Releases" page in GitHub
   - Click "Create a new release"
   - Enter the tag name (e.g., `v1.0.0`)
   - The workflow will automatically build and attach the files

3. **Manual Workflow Dispatch:**
   - Go to Actions → Release workflow
   - Click "Run workflow"
   - Enter the tag name manually

### What Gets Built

The release workflow automatically builds:

- **macOS (Intel)**: `.dmg` file for Intel Macs
- **macOS (Apple Silicon)**: `.dmg` file for M1/M2 Macs  
- **Windows**: `.exe` executable file
- **Windows**: `.exe` installer package (NSIS)

### Release Files

Each release will contain:
- `gostly-darwin-amd64.dmg` - macOS Intel
- `gostly-darwin-arm64.dmg` - macOS Apple Silicon
- `gostly.exe` - Windows executable
- `gostly-installer.exe` - Windows installer

## Local Building

### Prerequisites

```bash
# Install Wails
go install github.com/wailsapp/wails/v2/cmd/wails@latest

# Install frontend dependencies
cd frontend && npm install && cd ..

# For macOS DMG creation
brew install create-dmg
```

### Build Commands

```bash
# Build all platforms
./scripts/build-release.sh all v1.0.0

# Build specific platform
./scripts/build-release.sh darwin v1.0.0
./scripts/build-release.sh windows v1.0.0
```

### Manual Build Steps

1. **Build Frontend:**
   ```bash
   cd frontend
   npm run build
   cd ..
   ```

2. **Build Application:**
   ```bash
   # macOS
   wails build -platform darwin/amd64 -clean
   wails build -platform darwin/arm64 -clean
   
   # Windows
   wails build -platform windows/amd64 -clean
   wails build -platform windows/amd64 -clean -nsis
   ```

## Configuration

The build configuration is managed in `wails.json`:

- **macOS**: Creates `.app` bundles and `.dmg` files
- **Windows**: Creates `.exe` files and NSIS installers
- **Icons**: Uses `build/appicon.png` and `appicon.icns`

## Troubleshooting

### Common Issues

1. **Frontend build fails:**
   - Ensure Node.js 20+ is installed
   - Run `npm ci` in the frontend directory

2. **Wails build fails:**
   - Ensure Go 1.23+ is installed
   - Check that frontend/dist exists

3. **DMG creation fails:**
   - Install create-dmg: `brew install create-dmg`
   - Ensure appicon.icns exists

4. **Windows installer fails:**
   - Check that NSIS template exists at `build/windows/installer.nsh`
   - Ensure all required files are present

### Workflow Debugging

- Check the Actions tab in GitHub for detailed logs
- Each platform builds in parallel
- Artifacts are uploaded and then attached to the release
