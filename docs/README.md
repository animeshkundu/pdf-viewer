# Documentation Index

## Project Documentation

This directory contains comprehensive architecture and design documentation for the PDF Viewer/Editor application.

---

## ⚠️ For AI Agents: Start Here

**MUST READ before making any changes:**

### [agent-instructions/](./agent-instructions/)
Critical protocol files for AI-enabled development:
- [00-core-philosophy.md](./agent-instructions/00-core-philosophy.md) - Docs=Code, CEO Model, First Principles
- [01-research-and-web.md](./agent-instructions/01-research-and-web.md) - Research requirements
- [02-testing-and-validation.md](./agent-instructions/02-testing-and-validation.md) - 90% coverage mandate
- [03-tooling-and-pipelines.md](./agent-instructions/03-tooling-and-pipelines.md) - Automation standards

### [specs/](./specs/)
**Specification-first development**: Write specs here BEFORE implementing features.

### [adrs/](./adrs/)
**AI-enabled ADR structure**: Document architectural decisions using the template.

---

## Core Documentation

### Architecture

#### [architecture/OVERVIEW.md](./architecture/OVERVIEW.md)
**System Architecture Overview** - High-level technical architecture
- Technology stack (React 19, TypeScript, Vite, Tailwind, shadcn/ui)
- Architecture diagram and data flow
- Service-Hook-Component pattern
- File structure organization
- Performance optimizations
- PWA capabilities

#### [architecture/SERVICES.md](./architecture/SERVICES.md)
**Services Documentation** - All services with API reference
- pdf.service.ts - Core PDF loading/rendering
- annotation.service.ts - Annotations with undo/redo
- split-merge.service.ts - Split, merge, extract, N-up, scale
- security.service.ts - Sanitize, auto-redact patterns
- conversion.service.ts - Images to PDF, HTML/MD to PDF
- ocr.service.ts - Tesseract.js OCR (lazy-loaded)
- compression.service.ts - Image compression
- comparison.service.ts - PDF visual diff

#### [ARCHITECTURE.md](./ARCHITECTURE.md)
**Legacy Architecture Document** - Original architecture overview

---

### Architecture Decision Records (ADRs)

#### [adr/001-client-side-only.md](./adr/001-client-side-only.md)
**100% Client-Side Architecture** - Why no server required
- Privacy and trust considerations
- Limitations (no encryption, large WASM bundles)
- Alternatives considered

#### [adr/002-lazy-loading-heavy-deps.md](./adr/002-lazy-loading-heavy-deps.md)
**Lazy Loading Heavy Dependencies** - Dynamic import() for large libraries
- Tesseract.js (~12MB) loaded on demand
- html2pdf.js loaded on demand
- User experience during loading

#### [adr/003-service-singleton-pattern.md](./adr/003-service-singleton-pattern.md)
**Service Singleton Pattern** - Business logic organization
- Singleton services with subscriber pattern
- React integration via hooks
- Undo/redo implementation

#### [ADR/](./ADR/)
**Additional ADRs** - Other architectural decisions
- [ADR-0001](./ADR/0001-pdf-rendering-library.md): Using PDF.js for PDF Rendering
- [ADR-0002](./ADR/0002-pdf-manipulation-library.md): Using pdf-lib for PDF Manipulation
- [ADR-0003](./ADR/0003-virtualized-rendering.md): Virtualized Page Rendering
- [ADR-0004](./ADR/0004-annotation-storage.md): Annotation Data Structure
- [ADR-0005](./ADR/0005-state-management.md): React Context for State
- And more...

---

### Planning & Research

#### [planning/FEATURE_ROADMAP.md](./planning/FEATURE_ROADMAP.md)
**Feature Roadmap** - Completed and planned features
- Phase 1-7: All complete (Split/Merge, Security, Conversion, OCR, Compression)
- Future phases: Certificate signatures, PDF/A compliance
- Out of scope features

#### [planning/PDF_EDITOR_ENHANCEMENT_PLAN.md](./planning/PDF_EDITOR_ENHANCEMENT_PLAN.md)
**Enhancement Plan** - Original Stirling-PDF feature matching plan
- Detailed implementation approach
- Library research findings
- Testing framework design

#### [research/LIBRARIES.md](./research/LIBRARIES.md)
**Library Choices and Rationale** - Why we chose each library
- PDF.js vs alternatives
- pdf-lib vs jsPDF vs PDFKit
- Tesseract.js for OCR
- pixelmatch for comparison
- Bundle size analysis

---

### Specifications

#### [TECHNICAL_SPEC.md](./TECHNICAL_SPEC.md)
**Technical Specification** - Detailed implementation patterns
- PDF.js integration examples
- Virtualized rendering implementation
- Annotation system data models
- Undo/redo system
- Performance monitoring

#### [DESIGN_SYSTEM.md](./DESIGN_SYSTEM.md)
**Design System** - Visual design specifications
- Color palette with contrast ratios
- Typography system
- Component specifications
- Animation specifications
- Accessibility guidelines

#### [PRD.md](../PRD.md)
**Product Requirements Document** - Core product vision
- Mission statement
- Essential features with UX flows
- Edge case handling

---

### Guides

#### [AGENT.md](./AGENT.md)
**Agent Development Guide** - For AI agents and LLMs
- Pre-work documentation checklist
- Development workflow and standards
- Testing requirements (>90% coverage)
- ADR documentation process

#### [USER_WORKFLOWS.md](./USER_WORKFLOWS.md)
**User Workflows & Edge Cases** - Real-world usage scenarios
- Core user workflows
- Error recovery procedures
- Accessibility scenarios

#### [MOBILE_GUIDE.md](./MOBILE_GUIDE.md)
**Mobile Guide** - Mobile-specific considerations

#### [BROWSER_SUPPORT.md](./BROWSER_SUPPORT.md)
**Browser Support** - Supported browsers and features

---

### History

#### [history/](./history/)
**Development History** - Phase completion records
- Phase completion summaries
- Implementation status tracking
- Deprecated features

---

## Quick Reference

### For New Developers
1. Read [architecture/OVERVIEW.md](./architecture/OVERVIEW.md) for system architecture
2. Review [architecture/SERVICES.md](./architecture/SERVICES.md) for API reference
3. Check ADRs for architectural decisions:
   - [adr/001-client-side-only.md](./adr/001-client-side-only.md)
   - [adr/002-lazy-loading-heavy-deps.md](./adr/002-lazy-loading-heavy-deps.md)
   - [adr/003-service-singleton-pattern.md](./adr/003-service-singleton-pattern.md)
4. See [research/LIBRARIES.md](./research/LIBRARIES.md) for library rationale
5. Follow [AGENT.md](./AGENT.md) for development workflow

### For Feature Development
1. Check [planning/FEATURE_ROADMAP.md](./planning/FEATURE_ROADMAP.md) for status
2. Review [architecture/SERVICES.md](./architecture/SERVICES.md) for existing patterns
3. Create ADR for new architectural decisions
4. Update roadmap when complete

### For Understanding Decisions
1. Read relevant ADR in [adr/](./adr/) or [ADR/](./ADR/)
2. Check [research/LIBRARIES.md](./research/LIBRARIES.md) for library choices
3. Review [planning/](./planning/) for historical context

---

## Key Technical Decisions Summary

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Architecture | 100% Client-Side | Privacy, no server costs, offline capable |
| PDF Rendering | PDF.js | Battle-tested, Mozilla-backed, text extraction |
| PDF Manipulation | pdf-lib | Zero deps, TypeScript, modify existing PDFs |
| OCR | Tesseract.js (lazy) | Client-side, 100+ languages, ~12MB lazy-loaded |
| State Management | Service Singletons + Hooks | Testable, undo/redo support, React integration |
| Heavy Dependencies | Lazy Loading | Fast initial load, on-demand features |

---

## Performance Targets

| Metric | Target |
|--------|--------|
| Initial Bundle | < 3MB |
| Time to Interactive | < 3s |
| Page Render | < 100ms |
| Memory (200 pages) | < 500MB |
| Export (100 pages) | < 5s |

---

## Completed Features (Phases 1-7)

- Core Viewing & Annotations
- Split, Merge, Extract, Scale, N-up
- Security (Sanitize, Auto-Redact)
- Format Conversion (Images, HTML, Markdown)
- OCR (8 languages)
- Compression & Comparison
- Enhanced Viewing (Presentation, Bookmarks, Info Panel)

See [planning/FEATURE_ROADMAP.md](./planning/FEATURE_ROADMAP.md) for details.

---

## Questions & Clarifications

| Topic | Document |
|-------|----------|
| System architecture | [architecture/OVERVIEW.md](./architecture/OVERVIEW.md) |
| Service APIs | [architecture/SERVICES.md](./architecture/SERVICES.md) |
| Why client-side only? | [adr/001-client-side-only.md](./adr/001-client-side-only.md) |
| Why lazy loading? | [adr/002-lazy-loading-heavy-deps.md](./adr/002-lazy-loading-heavy-deps.md) |
| Library choices | [research/LIBRARIES.md](./research/LIBRARIES.md) |
| Feature status | [planning/FEATURE_ROADMAP.md](./planning/FEATURE_ROADMAP.md) |
| Development workflow | [AGENT.md](./AGENT.md) |
