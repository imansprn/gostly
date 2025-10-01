## Gostly

Modern desktop app for managing GOST proxy configurations.

[![Go Version](https://img.shields.io/badge/Go-1.23+-blue.svg)](https://golang.org/)
[![React](https://img.shields.io/badge/React-18+-61dafb.svg)](https://reactjs.org/)
[![Wails](https://img.shields.io/badge/Wails-v2-38bdf8.svg)](https://wails.io/)
[![License](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)
[![Backend CI](https://img.shields.io/github/actions/workflow/status/imansprn/gostly/backend.yml?branch=main&label=Backend%20CI)](https://github.com/imansprn/gostly/actions/workflows/backend.yml)
[![Frontend CI](https://img.shields.io/github/actions/workflow/status/imansprn/gostly/frontend.yml?branch=main&label=Frontend%20CI)](https://github.com/imansprn/gostly/actions/workflows/frontend.yml)
[![Coverage](https://codecov.io/gh/imansprn/gostly/branch/main/graph/badge.svg)](https://codecov.io/gh/imansprn/gostly)
[![coverage-backend](https://codecov.io/gh/imansprn/gostly/branch/main/graph/badge.svg?flag=backend)](https://codecov.io/gh/imansprn/gostly?flags=backend)
[![coverage-frontend](https://codecov.io/gh/imansprn/gostly/branch/main/graph/badge.svg?flag=frontend)](https://codecov.io/gh/imansprn/gostly?flags=frontend)
[![Go Report Card](https://goreportcard.com/badge/github.com/imansprn/gostly)](https://goreportcard.com/report/github.com/imansprn/gostly)

---

## Features

- Proxy profiles: create, edit, delete, start, stop
- Protocols: SOCKS5, HTTP, TCP, UDP, Shadowsocks
- Monitoring: logs, timeline, status
- Config: JSON-based, simple validation

---

## Quick start

### Prerequisites
- Go 1.23+
- Node.js 18+
- Git
- GOST 3.0+

### Install

```bash
# Clone the repository
git clone https://github.com/imansprn/gostly.git
cd gostly/gostly

# Install Go dependencies
go mod tidy

# Install frontend dependencies
cd frontend && npm install && cd ..

# Run in development mode
wails dev
```

### Build

```bash
# Current platform
wails build

# Specific platforms
wails build -platform darwin/arm64
wails build -platform windows/amd64
wails build -platform linux/amd64
```

### Releases
Automated with Release Please. Use conventional commits (`feat:`, `fix:`, etc.).

---

## Architecture

| Layer | Tech |
|-------|------|
| Frontend | React + TypeScript (Vite, Tailwind) |
| Desktop | Wails v2 |
| Backend | Go 1.23 |
| Storage | SQLite |
| Proxy | GOST |

### CI/CD
- `frontend.yml`: type-check, lint, test, build
- `backend.yml`: lint (golangci-lint), test, coverage
- `release.yml`: release-please

---

## Usage

### Creating proxy profiles

1. **Open Gostly** → Navigate to "Proxy Configurations"
2. **Click "Add Proxy Rule"** → Fill in profile details
3. **Configure settings**:
   - **Name**: Descriptive profile name
   - **Protocol**: Choose GOST protocol type
   - **Listen Address**: Local binding (e.g., `:1080`)
   - **Remote Address**: Target server address
   - **Authentication**: Username/password if required
4. **Save & Start** the profile

### Managing services

- ▶️ **Start Service** - Click the start button
- ⏹️ **Stop Service** - Click the stop button
- ✏️ **Edit Profile** - Modify existing settings
- 🗑️ **Delete Profile** - Remove unused profiles

### Monitoring & logs

- 📊 **Dashboard** - Overview of all profiles and status
- 📝 **Logs & Monitoring** - Real-time GOST process output
- ⏰ **Activity Timeline** - Visual history of operations
- 🔍 **Search & Filter** - Quick profile discovery

---

## Configuration

### Supported GOST protocols

| Protocol | Type | Description | Use Case |
|----------|------|-------------|----------|
| `forward` | SOCKS5 | Forward Proxy | Client internet access |
| `reverse` | TCP | Reverse Proxy | Server load balancing |
| `http` | HTTP | HTTP Proxy | Web proxy with auth |
| `tcp` | TCP | TCP Forwarding | Direct port forwarding |
| `udp` | UDP | UDP Forwarding | UDP service proxy |
| `ss` | Shadowsocks | Encrypted Proxy | Secure proxy service |
| `vmess` | VMess | VMess Protocol | Advanced proxy protocol |
| `trojan` | Trojan | Trojan Protocol | Secure proxy tunnel |

### Environment variables

```bash
# GOST binary path (auto-detected)
export GOST_BINARY=/usr/local/bin/gost

# Database location (auto-configured)
export GOSTLY_DB_DIR=~/.config/gostly/

# Log level
export GOSTLY_LOG_LEVEL=info
```

---

## Testing & CI/CD

### Automated testing
Our consolidated CI/CD pipeline automatically runs:
- ✅ **Code quality checks** (linting, formatting)
- 🧪 **Go and frontend tests** with coverage reporting
- 🛡️ **Security scanning** (vulnerability checks)
- 🏗️ **Multi-platform builds** (Linux, macOS, Windows)

**Triggers:**
- Every push to `main` and `develop`
- Every pull request
- Manual workflow dispatch

### Local testing

#### Frontend tests
```bash
cd frontend
npm test                    # Run tests
npm run type-check         # TypeScript validation
```

#### Backend tests
```bash
# Run all tests
go test ./...

# Run with coverage
go test -v -race -coverprofile=coverage.out ./...

# View coverage
go tool cover -html=coverage.out
```

#### Full build test
```bash
# Test complete build process
wails build -debug
```

---

## Distribution

### Supported platforms

- **macOS** - `.app` bundle, `.dmg` installer
- **Windows** - `.exe` executable, `.msi` installer  
- **Linux** - `.deb`, `.rpm`, `.AppImage`

### Build commands

```bash
# Clean build
wails clean && wails build

# Cross-platform builds
wails build -platform darwin/amd64,linux/amd64,windows/amd64

# Development build
wails build -debug
```

---

## Contributing

We welcome contributions! Please see our [Contributing Guide](CONTRIBUTING.md) for details.

### Development setup

```bash
# Fork & clone
git clone https://github.com/YOUR_USERNAME/gostly.git
cd gostly/gostly

# Install dependencies
go mod tidy
cd frontend && npm install && cd ..

# Start development
wails dev
```

### Code standards

- **Go**: Follow `gofmt` and `golint` standards
- **TypeScript**: Use ESLint and Prettier
- **CSS**: Follow Tailwind CSS conventions
- **Commits**: Use [conventional commits](https://conventionalcommits.org/)

---

## License

This project is licensed under the **MIT License** - see the [LICENSE](LICENSE) file for details.

---

## Acknowledgments

– [GOST](https://github.com/ginuerzh/gost)
– [Wails](https://wails.io/)
– [React](https://reactjs.org/)
– [Go](https://golang.org/)

---

## Support

### Getting help

- 🐛 **Issues**: [GitHub Issues](https://github.com/imansprn/gostly/issues)
- 💬 **Discussions**: [GitHub Discussions](https://github.com/imansprn/gostly/discussions)
- 📚 **Documentation**: [Wiki](https://github.com/imansprn/gostly/wiki)

### Community

- **Discord**: Join our community server
- **Telegram**: Follow updates and announcements
- **Twitter**: Get the latest news

---

<div align="center">
  <p><strong>Made with ❤️ by the Gostly Team</strong></p>
  <p><em>Empowering developers to manage proxy infrastructure with elegance and simplicity</em></p>
</div>
