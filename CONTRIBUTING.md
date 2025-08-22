# Contributing to Gostly

Thank you for your interest in contributing to Gostly! This document provides guidelines and information for contributors.

## 🤝 How to Contribute

### Types of Contributions

We welcome various types of contributions:

- **Bug Reports**: Help us identify and fix issues
- **Feature Requests**: Suggest new functionality
- **Code Contributions**: Submit pull requests with improvements
- **Documentation**: Help improve docs and examples
- **Testing**: Report bugs or suggest test improvements
- **Community**: Help other users and share knowledge

### Getting Started

1. **Fork** the repository
2. **Clone** your fork locally
3. **Create** a feature branch
4. **Make** your changes
5. **Test** thoroughly
6. **Submit** a pull request

## 🛠️ Development Setup

### Prerequisites

- Go 1.23+
- Node.js 18+
- Git
- GOST binary in PATH

### Local Setup

```bash
# Clone your fork
git clone https://github.com/YOUR_USERNAME/gostly.git
cd gostly/gostly

# Install Go dependencies
go mod tidy

# Install frontend dependencies
cd frontend
npm install
cd ..

# Run in development mode
wails dev
```

### Development Commands

```bash
# Start development server
wails dev

# Build application
wails build

# Run tests
go test ./...
cd frontend && npm test

# Format code
go fmt ./...
# Frontend formatting: npm run format (not configured - add prettier to package.json)

# Lint code
go vet ./...
# Frontend linting: npm run lint (not configured - add eslint to package.json)
```

## 📝 Code Style Guidelines

### Go Code

- Follow [Effective Go](https://golang.org/doc/effective_go.html)
- Use `gofmt` for formatting
- Run `go vet` before committing
- Add tests for new functionality
- Use meaningful variable and function names
- Add comments for complex logic

### TypeScript/React Code

- Follow [TypeScript Style Guide](https://google.github.io/styleguide/tsguide.html)
- Use functional components with hooks
- Prefer TypeScript over JavaScript
- Use meaningful component and prop names
- Add proper type definitions
- Follow React best practices

### CSS/Tailwind

- Use Tailwind CSS utility classes
- Follow mobile-first responsive design
- Maintain consistent spacing and colors
- Use semantic class names when custom CSS is needed

## 🧪 Testing Guidelines

### Backend Testing

- Write unit tests for all new functions
- Test error conditions and edge cases
- Use table-driven tests for multiple scenarios
- Mock external dependencies
- Aim for >80% code coverage

### Frontend Testing

- Test component rendering and interactions
- Mock API calls and external services
- Test user workflows end-to-end
- Use React Testing Library for component tests
- Test responsive behavior

### Integration Testing

- Test complete user workflows
- Verify data persistence
- Test cross-platform compatibility
- Validate GOST integration

## 📋 Pull Request Process

### Before Submitting

1. **Ensure tests pass** locally
2. **Update documentation** if needed
3. **Check code formatting** and linting
4. **Test on multiple platforms** if applicable
5. **Update CHANGELOG.md** with changes

### PR Description

Include the following in your PR description:

- **Summary**: Brief description of changes
- **Type**: Bug fix, feature, documentation, etc.
- **Testing**: How you tested the changes
- **Screenshots**: UI changes if applicable
- **Breaking Changes**: Any API changes
- **Related Issues**: Link to related issues

### PR Checklist

- [ ] Code follows style guidelines
- [ ] Tests pass locally
- [ ] Documentation updated
- [ ] No breaking changes introduced
- [ ] Changes tested on target platforms

## 🐛 Bug Reports

### Bug Report Template

```markdown
**Description**
Clear description of the bug

**Steps to Reproduce**
1. Step 1
2. Step 2
3. Step 3

**Expected Behavior**
What should happen

**Actual Behavior**
What actually happens

**Environment**
- OS: [e.g., macOS 13.0]
- Go Version: [e.g., 1.23.0]
- Node Version: [e.g., 18.17.0]
- GOST Version: [e.g., 2.11.1]

**Additional Context**
Any other relevant information
```

## 💡 Feature Requests

### Feature Request Template

```markdown
**Description**
Clear description of the feature

**Use Case**
Why this feature would be useful

**Proposed Solution**
How you think it should work

**Alternatives Considered**
Other approaches you've thought about

**Additional Context**
Any other relevant information
```

## 🚀 Release Process

### Versioning

We use [Semantic Versioning](https://semver.org/):

- **Major**: Breaking changes
- **Minor**: New features, backward compatible
- **Patch**: Bug fixes, backward compatible

### Release Checklist

- [ ] All tests pass
- [ ] Documentation updated
- [ ] CHANGELOG.md updated
- [ ] Version tags updated
- [ ] Release notes prepared
- [ ] Assets built for all platforms

## 📚 Documentation

### Documentation Standards

- Use clear, concise language
- Include code examples
- Add screenshots for UI features
- Keep documentation up-to-date
- Use consistent formatting

### Documentation Areas

- **README.md**: Project overview and quick start
- **API Documentation**: Backend API reference
- **User Guide**: Step-by-step usage instructions
- **Developer Guide**: Development setup and guidelines
- **CHANGELOG.md**: Version history and changes

## 🤝 Community Guidelines

### Code of Conduct

- Be respectful and inclusive
- Help newcomers learn
- Provide constructive feedback
- Focus on the code, not the person
- Follow project maintainers' decisions

### Communication

- Use GitHub Issues for bug reports
- Use GitHub Discussions for questions
- Be patient with responses
- Provide context and details
- Use clear, professional language

## 🏆 Recognition

### Contributors

We recognize contributors in several ways:

- **Contributors List**: Added to README.md
- **Release Notes**: Mentioned in release announcements
- **Special Thanks**: Acknowledged for significant contributions

### Contribution Levels

- **Contributor**: Any contribution
- **Maintainer**: Regular contributions and reviews
- **Core Team**: Project leadership and major decisions

## 📞 Getting Help

### Support Channels

- **GitHub Issues**: Bug reports and feature requests
- **GitHub Discussions**: Questions and community support
- **Documentation**: Self-service help
- **Code Examples**: Sample implementations

### Contact Maintainers

- **GitHub**: @gobliggg and team
- **Email**: [team@gostly.dev](mailto:team@gostly.dev)
- **Discord**: Join our community server

---

Thank you for contributing to Gostly! Your contributions help make this project better for everyone. 🚀
