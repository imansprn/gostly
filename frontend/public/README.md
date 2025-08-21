# Logo Instructions

## Converting SVG to PNG

The `logo.svg` file contains a custom logo for Gostly. To use it as a PNG:

### Option 1: Online Converters
1. Go to [Convertio](https://convertio.co/svg-png/) or [CloudConvert](https://cloudconvert.com/svg-to-png)
2. Upload `logo.svg`
3. Download as PNG
4. Rename to `logo.png` and place in this directory

### Option 2: Image Editors
- **Photoshop**: File → Open → Save As → PNG
- **GIMP**: File → Open → Export As → PNG
- **Sketch**: Export as PNG
- **Figma**: Export as PNG

### Option 3: Command Line (macOS)
```bash
# Using ImageMagick
brew install imagemagick
convert logo.svg logo.png

# Using sips (built-in)
sips -s format png logo.svg --out logo.png
```

## Logo Specifications
- **Size**: 32x32 pixels (will be scaled to 24x24 in the app)
- **Format**: PNG with transparency
- **Colors**: Blue to purple gradient with white elements
- **Style**: Network/globe icon representing proxy management

## File Structure
```
frontend/public/
├── logo.svg          # Source SVG file
├── logo.png          # Your PNG logo (create this)
└── README.md         # This file
```

## Custom Logo Design
Feel free to create your own logo! Just ensure:
- It's 32x32 pixels or larger
- Saved as `logo.png`
- Represents proxy/network management
- Has good contrast for visibility
