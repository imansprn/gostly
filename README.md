# 🚀 Gostly - GOST Proxy Manager

A modern, elegant desktop application for managing GOST proxy configurations with a beautiful React interface and Go backend.

![Gostly Dashboard](docs/screenshot.png)

## ✨ Features

### 🔧 Core Functionality
- **Proxy Profile Management**: Create, edit, delete, and manage GOST proxy profiles
- **Multiple Protocol Support**: SOCKS5, HTTP, TCP, UDP, Shadowsocks, and more
- **Real-time Process Control**: Start/stop proxy services with one click
- **Configuration Validation**: Automatic GOST configuration generation and validation

### 🎨 User Interface
- **Modern Dashboard**: Clean, minimalist design with professional aesthetics
- **Responsive Layout**: Collapsible sidebar and adaptive content areas
- **Search & Filter**: Quick profile search across all fields
- **Real-time Monitoring**: Live logs and activity timeline
- **Dark/Light Themes**: Elegant color schemes for different preferences

### 📊 Monitoring & Logs
- **Activity Timeline**: Track all profile operations with timestamps
- **Real-time Logs**: Monitor GOST processes and system events
- **Status Indicators**: Visual feedback for running/stopped services
- **Performance Metrics**: Monitor proxy performance and connections

### 🔒 Security & Authentication
- **User Authentication**: Username/password support for proxy services
- **Secure Storage**: Encrypted profile storage with SQLite
- **Process Isolation**: Secure GOST process management
- **Configuration Security**: Temporary config files with proper permissions

## 🏗️ Architecture

### Frontend
- **React 18** with TypeScript
- **Tailwind CSS** for styling
- **Vite** for fast development and building
- **Wails v2** for desktop app integration

### Backend
- **Go 1.23** for high-performance backend
- **SQLite** for data persistence
- **GOST Integration** for proxy management
- **Process Management** for service control

### Desktop Integration
- **Wails Framework** for native desktop experience
- **Cross-platform** support (macOS, Windows, Linux)
- **Native Performance** with web technologies
- **Auto-updates** and installation management

## 🚀 Quick Start

### Prerequisites
- **Go 1.23+** installed
- **Node.js 18+** and npm
- **GOST** binary in your PATH
- **Git** for cloning

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/gobliggg/gostly.git
   cd gostly/gostly
   ```

2. **Install dependencies**
   ```bash
   # Install Go dependencies
   go mod tidy
   
   # Install frontend dependencies
   cd frontend
   npm install
   cd ..
   ```

3. **Run in development mode**
   ```bash
   wails dev
   ```

4. **Build for production**
   ```bash
   wails build
   ```

### Development Commands

```bash
# Start development server
wails dev

# Build production app
wails build

# Build for specific platform
wails build -platform darwin/amd64
wails build -platform windows/amd64
wails build -platform linux/amd64

# Clean build artifacts
wails clean

# Generate bindings
wails generate module
```

## 📖 Usage Guide

### Creating Proxy Profiles

1. **Open Gostly** and navigate to "Proxy Configurations"
2. **Click "Add Proxy Rule"** to create a new profile
3. **Fill in the details**:
   - **Name**: Descriptive profile name
   - **Protocol Type**: Choose from available GOST protocols
   - **Listen Address**: Local binding address (e.g., `:1080`)
   - **Remote Address**: Target server address
   - **Authentication**: Username/password if required
4. **Save** the profile

### Managing Services

- **Start Service**: Click the "Start Service" button
- **Stop Service**: Click the "Stop Service" button
- **Edit Profile**: Click the edit icon to modify settings
- **Delete Profile**: Click the delete icon to remove

### Monitoring & Logs

- **Activity Timeline**: View all profile operations
- **Real-time Logs**: Monitor GOST process output
- **Status Indicators**: Check service health
- **Search & Filter**: Find specific profiles quickly

## 🔧 Configuration

### GOST Protocol Types

| Type | Description | Use Case |
|------|-------------|----------|
| `forward` | Forward Proxy (SOCKS5) | Client proxy for internet access |
| `reverse` | Reverse Proxy (TCP) | Server-side load balancing |
| `http` | HTTP Proxy | Web proxy with authentication |
| `tcp` | TCP Forwarding | Direct TCP port forwarding |
| `udp` | UDP Forwarding | UDP service forwarding |
| `ss` | Shadowsocks | Encrypted proxy service |

### Environment Variables

```bash
# GOST binary path (optional)
export GOST_BINARY=/usr/local/bin/gost

# Database location (auto-configured)
export GOSTLY_DB_DIR=~/.config/gostly/

# Log level
export GOSTLY_LOG_LEVEL=info
```

## 🧪 Testing

### Frontend Tests
```bash
cd frontend
npm test
npm run test:coverage
```

### Backend Tests
```bash
go test ./...
go test -v -cover ./...
```

### Integration Tests
```bash
wails test
```

## 📦 Building & Distribution

### Build Targets

```bash
# macOS
wails build -platform darwin/amd64
wails build -platform darwin/arm64

# Windows
wails build -platform windows/amd64

# Linux
wails build -platform linux/amd64
wails build -platform linux/arm64
```

### Package Formats

- **macOS**: `.app` bundle, `.dmg` installer
- **Windows**: `.exe` executable, `.msi` installer
- **Linux**: `.deb`, `.rpm`, `.AppImage`

### CI/CD Integration

The project includes GitHub Actions workflows for:
- **Automated Testing**: Run tests on every commit
- **Cross-platform Building**: Build for all supported platforms
- **Release Management**: Automated releases with assets
- **Code Quality**: Linting and security scanning

## 🤝 Contributing

### Development Setup

1. **Fork** the repository
2. **Create** a feature branch
3. **Make** your changes
4. **Test** thoroughly
5. **Submit** a pull request

### Code Style

- **Go**: Follow `gofmt` and `golint` standards
- **TypeScript**: Use ESLint and Prettier
- **CSS**: Follow Tailwind CSS conventions
- **Commits**: Use conventional commit messages

### Testing Guidelines

- **Unit Tests**: Cover all new functionality
- **Integration Tests**: Test component interactions
- **E2E Tests**: Verify complete user workflows
- **Performance Tests**: Ensure scalability

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **GOST Project**: For the excellent proxy toolkit
- **Wails Team**: For the amazing desktop framework
- **React Community**: For the powerful frontend ecosystem
- **Go Community**: For the robust backend language

## 📞 Support

### Getting Help

- **Issues**: [GitHub Issues](https://github.com/gobliggg/gostly/issues)
- **Discussions**: [GitHub Discussions](https://github.com/gobliggg/gostly/discussions)
- **Documentation**: [Wiki](https://github.com/gobliggg/gostly/wiki)

### Community

- **Discord**: Join our community server
- **Telegram**: Follow updates and announcements
- **Twitter**: Get the latest news

---

**Made with ❤️ by the Gostly Team**

*Empowering developers to manage proxy infrastructure with elegance and simplicity.*
