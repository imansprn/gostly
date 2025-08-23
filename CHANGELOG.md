# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

> **Note**: This project now uses [Release Please](https://github.com/googleapis/release-please-action) for automated releases. 
> The changelog will be automatically updated based on conventional commit messages. 
> See [docs/RELEASE_PLEASE_GUIDE.md](docs/RELEASE_PLEASE_GUIDE.md) for more details.

## [Unreleased]

### Added
- Custom app icon system
- GOST debug method
- **Comprehensive CI/CD pipeline with automated testing and quality checks**
- **Release Please integration for automated semantic versioning**
- **GitHub Releases integration for artifact distribution**
- **Automated dependency update workflow**
- **Code coverage reporting with Codecov integration**
- **Frontend and backend testing infrastructure (Vitest, Go tests)**
- **Automated secret detection and security scanning**
- **TypeScript validation and linting checks**
- **Configuration templates for proxy setup**
- **Mock data system for development and testing**

### Changed
- Increased window size to 1400x900
- Fixed GOST detection in Applications folder
- **Consolidated GitHub Actions workflows to eliminate conflicts**
- **Restructured project documentation for better organization**
- **Moved hardcoded configurations to dedicated config files**
- **Updated artifact naming convention for better workflow integration**
- **Enhanced README.md with comprehensive CI/CD documentation**

### Fixed
- GOST "Not Available" error
- App icon display in dock
- **GitHub workflow trigger conflicts causing duplicate runs**
- **Go build issues with embed directives**
- **TypeScript type errors in mock data**
- **Hardcoded secrets in configuration templates**
- **Frontend build failures in CI pipeline**
- **Artifact upload and download mismatches**
- **Code quality workflow failures**

### Technical Improvements
- **Workflow Architecture**: Consolidated from 3 conflicting workflows to 3 coordinated workflows
  - `main.yml`: Comprehensive CI/CD pipeline (testing, quality, building)
  - `release.yml`: Automated release management with Release Please
  - `dependencies.yml`: Automated dependency updates
- **Build System**: Fixed Go build issues and improved frontend build process
- **Testing Infrastructure**: Added comprehensive test coverage for both frontend and backend
- **Security**: Implemented automated secret detection and vulnerability scanning
- **Documentation**: Restructured and consolidated project documentation
- **Code Quality**: Added automated linting, formatting, and type checking

### Breaking Changes
- **None**: All changes are backward compatible and improve existing functionality

## [1.0.0] - 2024-08-22

### Added
- Initial release of Gostly GOST Proxy Manager
- Proxy profile management system
- Real-time GOST process monitoring
- Activity logging and timeline
- Cross-platform support (macOS, Windows, Linux)
