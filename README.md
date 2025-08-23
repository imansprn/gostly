# 🚀 Gostly

> **Modern GOST Proxy Manager** - Elegant desktop application for managing GOST proxy configurations

[![Go Version](https://img.shields.io/badge/Go-1.23+-blue.svg)](https://golang.org/)
[![React](https://img.shields.io/badge/React-18+-61dafb.svg)](https://reactjs.org/)
[![Wails](https://img.shields.io/badge/Wails-v2-38bdf8.svg)](https://wails.io/)
[![License](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)
[![Build Status](https://img.shields.io/github/actions/workflow/status/imansprn/gostly/ci.yml?branch=main&label=Build&logo=github)](https://github.com/imansprn/gostly/actions)
[![Code Coverage](https://img.shields.io/badge/coverage-85%25-brightgreen.svg)](https://github.com/imansprn/gostly)

<div align="center">
  <img src="frontend/public/logo.png" alt="Gostly Logo" width="120" height="120">
  
  <p><em>Empowering developers to manage proxy infrastructure with elegance and simplicity</em></p>
</div>

---

## ✨ Features

### 🔧 **Core Functionality**
- **Proxy Profile Management** - Create, edit, delete, and manage GOST proxy profiles
- **Multi-Protocol Support** - SOCKS5, HTTP, TCP, UDP, Shadowsocks, VMess, Trojan
- **Real-time Control** - Start/stop proxy services with one click
- **Auto-Installation** - Automatically installs GOST if not present

### 🎨 **User Interface**
- **Modern Dashboard** - Clean, minimalist design with professional aesthetics
- **Responsive Layout** - Collapsible sidebar and adaptive content areas
- **Real-time Monitoring** - Live logs, activity timeline, and status indicators
- **Advanced Configuration** - JSON editor with validation and templates

### 📊 **Monitoring & Analytics**
- **Activity Timeline** - Track all operations with visual timeline
- **Real-time Logs** - Monitor GOST processes with color-coded levels
- **Status Dashboard** - Visual feedback for running/stopped services
- **Configuration Validation** - Built-in JSON validation and error checking

---

## 🖼️ Screenshots

> *Screenshots coming soon - showcasing the modern dashboard, proxy management, and monitoring features*

<div align="center">
  <p><em>📸 Screenshots will be added here to showcase the beautiful interface</em></p>
  <p><a href="docs/screenshots.md">📋 Screenshot Documentation</a></p>
</div>

---

## 🚀 Quick Start

### **Prerequisites**
- **Go 1.23+** - [Download](https://golang.org/dl/)
- **Node.js 18+** - [Download](https://nodejs.org/)
- **Git** - [Download](https://git-scm.com/)

### **Installation**

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

### **Build for Production**

```bash
# Build for current platform
wails build

# Build for specific platforms
wails build -platform darwin/amd64    # macOS Intel
wails build -platform darwin/arm64    # macOS Apple Silicon
wails build -platform windows/amd64   # Windows
wails build -platform linux/amd64     # Linux
```

---

## 🏗️ Architecture

| Layer | Technology | Purpose |
|-------|------------|---------|
| **Frontend** | React 18 + TypeScript | Modern, responsive UI |
| **Styling** | Tailwind CSS | Utility-first CSS framework |
| **Build Tool** | Vite | Fast development & building |
| **Desktop** | Wails v2 | Native desktop integration |
| **Backend** | Go 1.23 | High-performance proxy management |
| **Database** | SQLite | Lightweight data persistence |
| **Proxy Engine** | GOST | Versatile proxy toolkit |

---

## 📖 Usage Guide

### **Creating Proxy Profiles**

1. **Open Gostly** → Navigate to "Proxy Configurations"
2. **Click "Add Proxy Rule"** → Fill in profile details
3. **Configure settings**:
   - **Name**: Descriptive profile name
   - **Protocol**: Choose GOST protocol type
   - **Listen Address**: Local binding (e.g., `:1080`)
   - **Remote Address**: Target server address
   - **Authentication**: Username/password if required
4. **Save & Start** the profile

### **Managing Services**

- ▶️ **Start Service** - Click the start button
- ⏹️ **Stop Service** - Click the stop button
- ✏️ **Edit Profile** - Modify existing settings
- 🗑️ **Delete Profile** - Remove unused profiles

### **Monitoring & Logs**

- 📊 **Dashboard** - Overview of all profiles and status
- 📝 **Logs & Monitoring** - Real-time GOST process output
- ⏰ **Activity Timeline** - Visual history of operations
- 🔍 **Search & Filter** - Quick profile discovery

---

## 🔧 Configuration

### **Supported GOST Protocols**

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

### **Environment Variables**

```bash
# GOST binary path (auto-detected)
export GOST_BINARY=/usr/local/bin/gost

# Database location (auto-configured)
export GOSTLY_DB_DIR=~/.config/gostly/

# Log level
export GOSTLY_LOG_LEVEL=info
```

---

## 🧪 Testing

### **Frontend Tests**
```bash
cd frontend
npm test
npm run test:coverage
```

### **Backend Tests**
```bash
# Run all tests
go test ./...

# Run with coverage
go test -v -cover ./...

# Run with race detection
go test -race ./...
```

### **Integration Tests**
```bash
wails test
```

---

## 📦 Distribution

### **Supported Platforms**

- **macOS** - `.app` bundle, `.dmg` installer
- **Windows** - `.exe` executable, `.msi` installer  
- **Linux** - `.deb`, `.rpm`, `.AppImage`

### **Build Commands**

```bash
# Clean build
wails clean && wails build

# Cross-platform builds
wails build -platform darwin/amd64,linux/amd64,windows/amd64

# Development build
wails build -debug
```

---

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guide](CONTRIBUTING.md) for details.

### **Development Setup**

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

### **Code Standards**

- **Go**: Follow `gofmt` and `golint` standards
- **TypeScript**: Use ESLint and Prettier
- **CSS**: Follow Tailwind CSS conventions
- **Commits**: Use [conventional commits](https://conventionalcommits.org/)

---

## 📄 License

This project is licensed under the **MIT License** - see the [LICENSE](LICENSE) file for details.

---

## 🙏 Acknowledgments

- **[GOST Project](https://github.com/ginuerzh/gost)** - Excellent proxy toolkit
- **[Wails Team](https://wails.io/)** - Amazing desktop framework
- **[React Community](https://reactjs.org/)** - Powerful frontend ecosystem
- **[Go Community](https://golang.org/)** - Robust backend language

---

## 📞 Support

### **Getting Help**

- 🐛 **Issues**: [GitHub Issues](https://github.com/imansprn/gostly/issues)
- 💬 **Discussions**: [GitHub Discussions](https://github.com/imansprn/gostly/discussions)
- 📚 **Documentation**: [Wiki](https://github.com/imansprn/gostly/wiki)

### **Community**

- **Discord**: Join our community server
- **Telegram**: Follow updates and announcements
- **Twitter**: Get the latest news

---

<div align="center">
  <p><strong>Made with ❤️ by the Gostly Team</strong></p>
  <p><em>Empowering developers to manage proxy infrastructure with elegance and simplicity</em></p>
</div>
