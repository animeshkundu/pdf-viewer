# PDF Viewer & Editor

A client-side web application for viewing, annotating, and editing PDF documents with zero server dependency, inspired by the minimalist excellence of macOS Preview.

## 🚀 Features

- **100% Client-Side**: All PDF processing happens in the browser - your documents never leave your device
- **View & Navigate**: Smooth scrolling, zoom controls, page thumbnails, text selection and search
- **Annotate**: Highlights, drawings, shapes, text boxes, sticky notes, and signatures
- **Edit**: Reorder, delete, and rotate pages
- **Export**: Save modified PDFs with embedded annotations
- **Privacy-First**: No uploads, no tracking, complete privacy
- **Free & Open Source**: No paywalls, no watermarks, no limits

## 📚 Documentation

Complete documentation is available in the `docs/` directory:

### Essential Reading

- **[docs/AGENT.md](docs/AGENT.md)** - **START HERE** for development workflow, testing, and standards
- **[docs/PRD.md](docs/PRD.md)** - Product requirements and feature specifications
- **[docs/README.md](docs/README.md)** - Documentation index and quick reference

### Architecture & Design

- **[docs/ARCHITECTURE.md](docs/ARCHITECTURE.md)** - System architecture and design patterns
- **[docs/TECHNICAL_SPEC.md](docs/TECHNICAL_SPEC.md)** - Detailed implementation patterns
- **[docs/DESIGN_SYSTEM.md](docs/DESIGN_SYSTEM.md)** - UI/UX guidelines and component library
- **[docs/ADR/](docs/ADR/)** - Architecture Decision Records
- **[docs/history/](docs/history/)** - Deprecated features and migration guides

### Performance & Compatibility

- **[docs/PERFORMANCE.md](docs/PERFORMANCE.md)** - Performance optimization guide and benchmarks
- **[docs/MOBILE_GUIDE.md](docs/MOBILE_GUIDE.md)** - Mobile and responsive design patterns
- **[docs/BROWSER_SUPPORT.md](docs/BROWSER_SUPPORT.md)** - Browser compatibility matrix

### Development

- **[docs/IMPLEMENTATION_PLAN.md](docs/IMPLEMENTATION_PLAN.md)** - Development roadmap and phases
- **[docs/USER_WORKFLOWS.md](docs/USER_WORKFLOWS.md)** - User workflows and edge cases

## 🛠️ Tech Stack

- **React 19** + **TypeScript 5.7** - UI framework
- **PDF.js** - PDF rendering
- **pdf-lib** - PDF manipulation
- **Tailwind CSS** + **shadcn/ui** - Styling and components
- **Vite** - Build tool
- **Vitest** - Testing framework

## 🏁 Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn

### Installation

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build
```

### Development

```bash
# Run tests
npm run test:unit

# Run tests with coverage
npm run test:coverage

# Run linter
npm run lint

# Type check
npm run build
```

## 🧪 Testing

This project maintains **>90% code coverage**. Every feature requires:
- Unit tests for business logic
- Component tests for UI
- E2E tests for user workflows

See [docs/ADR/0006-testing-strategy.md](docs/ADR/0006-testing-strategy.md) for details.

## 📖 Development Workflow

1. **Read [docs/AGENT.md](docs/AGENT.md)** - Understand workflow and standards
2. **Review ADRs** - Check [docs/ADR/](docs/ADR/) for architectural decisions
3. **Implement** - Follow patterns in [docs/TECHNICAL_SPEC.md](docs/TECHNICAL_SPEC.md)
4. **Test** - Write tests with >90% coverage
5. **Build & Lint** - Ensure `npm run build` and `npm run lint` pass
6. **Document** - Update relevant docs and create ADRs for significant decisions

## 🏗️ Architecture

```
┌─────────────────────────────────────────┐
│         React UI Layer                   │
│  Components, Context, Hooks              │
└─────────────────────────────────────────┘
                  ↓
┌─────────────────────────────────────────┐
│      Core Services Layer                 │
│  PDF, Annotation, Export, Storage        │
└─────────────────────────────────────────┘
                  ↓
┌─────────────────────────────────────────┐
│     External Libraries                   │
│  PDF.js, pdf-lib, Spark KV              │
└─────────────────────────────────────────┘
```

See [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) for details.

## 🎨 Design Principles

- **Minimalist**: Clean, uncluttered interface inspired by macOS Preview
- **Progressive Disclosure**: Advanced features revealed on demand
- **Performance**: Virtualized rendering for large documents
- **Accessibility**: WCAG AA compliant, keyboard navigation, screen reader support
- **Mobile-First**: Fully responsive design optimized for all devices

See [docs/DESIGN_SYSTEM.md](docs/DESIGN_SYSTEM.md) for complete design specifications.

## ⚡ Performance

The application is highly optimized for smooth performance:

- **60fps** scrolling even with 100+ page documents
- **<2s** load time for typical PDFs
- **<500MB** memory usage for large documents
- **Canvas caching** with intelligent eviction
- **Virtualized rendering** - only visible pages rendered
- **requestAnimationFrame** integration for smooth animations

See [docs/PERFORMANCE.md](docs/PERFORMANCE.md) for optimization details and benchmarks.

## 📱 Mobile & Browser Support

### Supported Browsers
- ✅ Chrome 90+ (Recommended)
- ✅ Firefox 88+
- ✅ Safari 14+ (macOS, iOS)
- ✅ Edge 90+

### Mobile Features
- Fully responsive down to 320px width
- Touch-optimized controls (44x44px minimum)
- Native gestures (pinch zoom, scroll)
- Mobile-optimized toolbar and sidebar
- Works offline once loaded

See [docs/BROWSER_SUPPORT.md](docs/BROWSER_SUPPORT.md) and [docs/MOBILE_GUIDE.md](docs/MOBILE_GUIDE.md) for details.

## 📝 Key Decisions

Major architectural decisions are documented as ADRs:

- [ADR-0001](docs/ADR/0001-pdf-rendering-library.md): Using PDF.js for rendering
- [ADR-0002](docs/ADR/0002-pdf-manipulation-library.md): Using pdf-lib for manipulation
- [ADR-0003](docs/ADR/0003-virtualized-rendering.md): Virtualized rendering strategy
- [ADR-0004](docs/ADR/0004-annotation-storage.md): Annotation data structure
- [ADR-0005](docs/ADR/0005-state-management.md): React Context for state management
- [ADR-0006](docs/ADR/0006-testing-strategy.md): Testing framework and strategy

## 🤝 Contributing

1. Read [docs/AGENT.md](docs/AGENT.md) for development guidelines
2. Check [docs/IMPLEMENTATION_PLAN.md](docs/IMPLEMENTATION_PLAN.md) for available tasks
3. Review relevant [ADRs](docs/ADR/) before making changes
4. Write tests (>90% coverage required)
5. Update documentation
6. Submit PR with description of changes

## 🔒 Privacy & Security

- **100% Client-Side**: Documents never leave your device
- **No Tracking**: No analytics or telemetry on document content
- **No Server**: No uploads, no storage, complete control
- **Open Source**: Full transparency, audit the code

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

The Spark Template files and resources from GitHub are licensed under the terms of the MIT license, Copyright GitHub, Inc.

## 🆘 Support

- **Documentation**: [docs/](docs/)
- **Issues**: GitHub Issues
- **Questions**: Check [docs/README.md](docs/README.md) for relevant documentation sections

---

**Built with ❤️ using React, TypeScript, and PDF.js**
