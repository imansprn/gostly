# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

> **Note**: This project now uses [Release Please](https://github.com/googleapis/release-please-action) for automated releases. 
> The changelog will be automatically updated based on conventional commit messages. 
> See [docs/RELEASE_PLEASE_GUIDE.md](docs/RELEASE_PLEASE_GUIDE.md) for more details.

## [1.0.32](https://github.com/imansprn/gostly/compare/v1.0.31...v1.0.32) (2025-10-01)


### Bug Fixes

* dragable form ([8c21117](https://github.com/imansprn/gostly/commit/8c21117bfcc0a49de3b14a71fb16e89ea9ab4d82))
* file release ([787ef0e](https://github.com/imansprn/gostly/commit/787ef0ee7a89efcfe6ff78478cd0fdb825bd1a18))

## 1.0.0 (2025-08-24)


### Features

* add automatically release on push main ([c573012](https://github.com/imansprn/gostly/commit/c5730126813d2b313eb60f0b1772b3cae7e2064b))
* fix GOST detection in Applications folder and add custom app icon ([6e13769](https://github.com/imansprn/gostly/commit/6e137696e3f47240671508d918922a3cbff8d45c))


### Bug Fixes

* build on amd64 and arm64 ([4108f4a](https://github.com/imansprn/gostly/commit/4108f4adeaa6944d8a446bb4bb4cbb6f28dbc748))
* Improve UI/UX design ([0c37126](https://github.com/imansprn/gostly/commit/0c37126e493ba0665dda9794b0ddfa91047adf65))

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
