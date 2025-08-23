# 🚀 Release Please Guide

> **Automated Release Management for Gostly**

This guide explains how to use Release Please to automatically manage releases based on conventional commits.

## 📋 Overview

Release Please automatically:
- 📝 Generates changelogs from commit messages
- 🏷️ Creates version tags based on commit types
- 🔄 Opens release pull requests
- 🚀 Creates GitHub releases with Google Cloud Storage integration
- 📦 Manages version bumping automatically

## ✨ How It Works

### 1. **Conventional Commits**
Write commits following the [Conventional Commits](https://www.conventionalcommits.org/) specification:

```bash
# Feature (minor version bump)
feat: add SOCKS5 proxy support

# Bug fix (patch version bump)
fix: resolve connection timeout issue

# Documentation
docs: update installation guide

# Breaking change (major version bump)
feat!: change API response format
BREAKING CHANGE: API now returns JSON instead of XML
```

### 2. **Automatic Detection**
Release Please scans your commits and:
- Detects commit types (`feat:`, `fix:`, `docs:`, etc.)
- Determines version bump type (major/minor/patch)
- Generates changelog entries
- Creates release pull requests

### 3. **Release Process**
1. **Push to main** → Release Please detects changes
2. **Release PR created** → Review and merge
3. **GitHub release created** → With GCS download links
4. **Artifacts uploaded** → To Google Cloud Storage

## 🔧 Configuration

### **Basic Configuration (Recommended)**
According to the [official Release Please documentation](https://github.com/googleapis/release-please-action), the simplest configuration is:

```yaml
# .github/workflows/release-please.yml
on:
  push:
    branches: [main]
permissions:
  contents: write
  pull-requests: write
name: release-please
jobs:
  release-please:
    runs-on: ubuntu-latest
    steps:
      - uses: googleapis/release-please-action@v4
        with:
          token: ${{ secrets.RELEASE_PLEASE_TOKEN }}
          release-type: go
```

### **Advanced Configuration**
For our project, we use a more advanced setup with Google Cloud Storage integration:
Located in `release-please-config.json`:

```json
{
  "packages": {
    ".": {
      "release-type": "go",
      "package-name": "gostly",
      "changelog-path": "CHANGELOG.md",
      "version-file": "go.mod"
    }
  },
  "release-type": "go",
  "changelog-host": "https://github.com/imansprn/gostly"
}
```

**Note**: We use the built-in `release-type: go` strategy which automatically handles:
- Conventional commit parsing
- Go-specific versioning
- Changelog generation
- Release PR creation

### **Workflow Configuration**
The `.github/workflows/release.yml` workflow:
- Triggers on push to `main`
- Uses Release Please action
- Integrates with Google Cloud Storage
- Creates GitHub releases automatically

## 📝 Commit Types

| Type | Description | Version Bump | Example |
|------|-------------|--------------|---------|
| `feat:` | New features | Minor | `feat: add VMess protocol` |
| `fix:` | Bug fixes | Patch | `fix: resolve memory leak` |
| `docs:` | Documentation | None | `docs: update README` |
| `style:` | Code style | None | `style: format code` |
| `refactor:` | Code refactoring | None | `refactor: simplify logic` |
| `perf:` | Performance | None | `perf: optimize algorithm` |
| `test:` | Tests | None | `test: add unit tests` |
| `build:` | Build system | None | `build: update dependencies` |
| `ci:` | CI/CD | None | `ci: add GitHub Actions` |
| `chore:` | Maintenance | None | `chore: update deps` |

## 🚀 Creating Releases

### **Automatic Release**
1. **Write conventional commits:**
   ```bash
   git add .
   git commit -m "feat: add new proxy protocol support"
   git push origin main
   ```

2. **Release Please detects changes** and creates a release PR

3. **Review and merge** the release PR

4. **GitHub release created** automatically with:
   - Version tag (e.g., `v1.2.0`)
   - Changelog from commits
   - Download links to Google Cloud Storage

### **Manual Release**
If you need a manual release:

1. Go to **Actions** → **Release Please**
2. Click **Run workflow**
3. Fill in version details
4. Run the workflow

## 📦 Artifact Distribution

### **Google Cloud Storage**
Releases are automatically uploaded to:
- **Version-specific**: `gs://bucket/releases/v1.2.0/`
- **Latest**: `gs://bucket/latest/`

### **Public URLs**
- **Release files**: `https://storage.googleapis.com/bucket/releases/v1.2.0/`
- **Latest files**: `https://storage.googleapis.com/bucket/latest/`

### **Supported Platforms**
- Linux (AMD64, ARM64)
- macOS (Intel, Apple Silicon)
- Windows (AMD64)

## 🔍 Monitoring Releases

### **GitHub Actions**
- Check the **Actions** tab for workflow status
- Monitor release creation progress
- View artifact upload logs

### **Release History**
- All releases appear in **Releases** section
- Changelog automatically generated
- Download links to GCS artifacts

## 🛠️ Troubleshooting

### **Common Issues**

#### **Release not created**
- Check commit message format
- Ensure push is to `main` branch
- Verify workflow permissions

#### **Artifacts not uploaded**
- Check GCP credentials
- Verify bucket permissions
- Review workflow logs

#### **Version not bumped**
- Use proper commit types (`feat:`, `fix:`)
- Include `BREAKING CHANGE:` for major versions
- Check configuration file

### **Debugging**
1. **Check workflow logs** in Actions tab
2. **Verify commit messages** follow convention
3. **Review Release Please config**
4. **Check GCP permissions**

## 📚 Best Practices

### **Commit Messages**
- Use clear, descriptive messages
- Follow conventional commit format
- Reference issues when applicable

### **Release Frequency**
- Release when features are complete
- Don't rush releases for minor changes
- Use pre-releases for testing

### **Version Management**
- Let Release Please handle versioning
- Don't manually create tags
- Use semantic versioning principles

## 🔗 Resources

- [Conventional Commits](https://www.conventionalcommits.org/)
- [Release Please Documentation](https://github.com/googleapis/release-please)
- [Semantic Versioning](https://semver.org/)
- [GitHub Actions](https://docs.github.com/en/actions)

---

**🎉 Happy Releasing!**

With Release Please, managing releases becomes effortless. Just write good commit messages and let automation handle the rest!
