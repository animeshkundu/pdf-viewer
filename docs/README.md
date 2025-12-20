# Documentation Index

## Project Documentation

This directory contains comprehensive architecture and design documentation for the PDF Viewer/Editor application.

### Documents

#### [PRD.md](../PRD.md)
**Product Requirements Document** - Core product vision and feature specifications
- Mission statement and experience qualities
- Essential features with detailed UX flows
- Edge case handling
- Design direction and specifications
- Complete component and interaction design

#### [ARCHITECTURE.md](./ARCHITECTURE.md)
**System Architecture** - High-level technical architecture
- Architecture overview and diagrams
- Technology stack and rationale
- Core module descriptions
- State management approach
- Performance optimization strategies
- File structure and organization

#### [TECHNICAL_SPEC.md](./TECHNICAL_SPEC.md)
**Technical Specification** - Detailed implementation patterns
- PDF.js integration examples
- Virtualized rendering implementation
- Annotation system data models
- pdf-lib export implementation
- Undo/redo system
- Signature storage
- Search implementation
- Performance monitoring
- Error handling patterns

#### [DESIGN_SYSTEM.md](./DESIGN_SYSTEM.md)
**Design System** - Visual design specifications
- Design principles
- Complete color palette with contrast ratios
- Typography system and scales
- Spacing system
- Component specifications
- Interaction states
- Animation specifications
- Responsive breakpoints
- Accessibility guidelines

#### [IMPLEMENTATION_PLAN.md](./IMPLEMENTATION_PLAN.md)
**Implementation Plan** - Development roadmap
- 8 development phases with tasks
- Acceptance criteria for each phase
- Technical dependencies
- Testing strategy
- Risk mitigation
- Success metrics

#### [USER_WORKFLOWS.md](./USER_WORKFLOWS.md)
**User Workflows & Edge Cases** - Real-world usage scenarios
- Core user workflows with step-by-step flows
- Edge case handling strategies
- Accessibility scenarios
- Error recovery procedures

#### [AGENT.md](./AGENT.md)
**Agent Development Guide** - Comprehensive guide for AI agents and LLMs
- Pre-work documentation review checklist
- Development workflow and standards
- Testing requirements (>90% coverage)
- Build and validation steps
- Documentation update guidelines
- ADR and history documentation process
- Common patterns and best practices
- Self-review checklist

#### [ADR/](./ADR/)
**Architecture Decision Records** - Documented architectural decisions
- [ADR-0001](./ADR/0001-pdf-rendering-library.md): Using PDF.js for PDF Rendering
- [ADR-0002](./ADR/0002-pdf-manipulation-library.md): Using pdf-lib for PDF Manipulation
- [ADR-0003](./ADR/0003-virtualized-rendering.md): Virtualized Page Rendering Strategy
- [ADR-0004](./ADR/0004-annotation-storage.md): Annotation Data Structure and Storage
- [ADR-0005](./ADR/0005-state-management.md): React Context for State Management
- [ADR-0006](./ADR/006-virtualized-rendering.md): ✅ Virtualized PDF Rendering with Intersection Observer (Phase 1)
- [ADR-0007](./ADR/007-keyboard-navigation.md): ✅ Keyboard Navigation Implementation (Phase 1)

#### [history/](./history/)
**Deprecated Features** - Historical record of removed/deprecated features
- Migration guides for deprecated APIs
- Reasons for deprecation
- Replacement recommendations
- Timeline of changes

---

## Quick Reference

### For AI Agents/LLMs (START HERE)
1. **ALWAYS** read [AGENT.md](./AGENT.md) first
2. Review relevant [ADRs](./ADR/) before making architectural changes
3. Check [history/](./history/) for deprecated features
4. Follow testing requirements (>90% coverage)
5. Update documentation with every change

### For Product/Design Review
1. Start with [PRD.md](../PRD.md) for product vision
2. Review [DESIGN_SYSTEM.md](./DESIGN_SYSTEM.md) for visual specifications
3. Check [USER_WORKFLOWS.md](./USER_WORKFLOWS.md) for UX flows

### For Development
1. Read [AGENT.md](./AGENT.md) for development workflow
2. Review [ARCHITECTURE.md](./ARCHITECTURE.md) for system overview
3. Check [ADR/](./ADR/) for architectural decisions
4. Reference [TECHNICAL_SPEC.md](./TECHNICAL_SPEC.md) for implementation patterns
5. Follow [IMPLEMENTATION_PLAN.md](./IMPLEMENTATION_PLAN.md) for task breakdown

### For Testing
1. Review [ADR-0006](./ADR/0006-testing-strategy.md) for testing strategy
2. Use [USER_WORKFLOWS.md](./USER_WORKFLOWS.md) for test scenarios
3. Check [IMPLEMENTATION_PLAN.md](./IMPLEMENTATION_PLAN.md) for acceptance criteria
4. Reference [TECHNICAL_SPEC.md](./TECHNICAL_SPEC.md) for edge cases
5. Maintain >90% code coverage

---

## Key Technical Decisions

### Why PDF.js?
- Industry-standard library by Mozilla
- Excellent browser support
- Active maintenance
- Comprehensive text layer support

### Why pdf-lib?
- Pure JavaScript, no dependencies
- Works in browser and Node
- Can modify existing PDFs
- Good documentation

### Why Client-Side Only?
- **Privacy**: Documents never leave user's device
- **Simplicity**: No server infrastructure needed
- **Cost**: Zero hosting costs
- **Reliability**: Works offline
- **Trust**: Users control their data

### Why React Hooks Over Redux?
- Simpler for this use case
- Less boilerplate
- React Context sufficient for global state
- Local state for performance-critical operations

### Why Spark KV Over LocalStorage?
- Higher storage limits
- Better API
- Built-in React hooks
- Async operations don't block UI

---

## Architecture Decisions

### State Management
**Decision**: React Context + hooks, no Redux
**Rationale**: App state is relatively simple, context provides enough structure without overhead

### Rendering Strategy
**Decision**: Virtualized rendering with Intersection Observer
**Rationale**: Only way to handle large documents without memory issues

### Annotation Storage
**Decision**: Store as separate layer, embed on export
**Rationale**: Preserves original PDF, allows undo/redo, easier state management

### Zoom Implementation
**Decision**: Re-render canvas at new scale
**Rationale**: Maintains quality at all zoom levels, acceptable performance trade-off

---

## Performance Targets

| Metric | Target | Rationale |
|--------|--------|-----------|
| **Initial Load** | < 3s for 50MB | User patience threshold |
| **Page Render** | < 100ms | Perceived as instant |
| **Scroll FPS** | 60fps | Smooth, no jank |
| **Memory Usage** | < 500MB for 200 pages | Browser stability |
| **Export Time** | < 5s for 100 pages | Acceptable wait |

---

## Development Priorities

1. **P0 - Critical**: Core viewing, annotations, export
2. **P1 - Important**: Search, keyboard shortcuts, mobile
3. **P2 - Nice to Have**: Advanced features, optimizations
4. **P3 - Future**: OCR, collaboration, cloud sync

---

## Future Enhancements (Out of MVP Scope)

- **OCR**: Text recognition for scanned PDFs
- **Form Filling**: Interactive form field support
- **Redaction**: Permanent text removal with black boxes
- **Page Extraction**: Save individual pages as separate PDFs
- **PDF Merging**: Combine multiple PDFs into one
- **Cloud Storage**: Save to Google Drive, Dropbox
- **Collaboration**: Share and comment with team
- **Templates**: Pre-made annotation templates
- **Batch Operations**: Process multiple files at once
- **Password Protection**: Encrypt output PDFs
- **Digital Signatures**: PKI-based cryptographic signatures
- **Dark Mode**: Eye-friendly night theme

---

## Getting Started

### For New Team Members
1. Read [AGENT.md](./AGENT.md) for complete development guide
2. Read [PRD.md](../PRD.md) to understand product vision
3. Review [ARCHITECTURE.md](./ARCHITECTURE.md) for system overview
4. Study [ADRs](./ADR/) to understand key decisions
5. Set up development environment (see main README.md)
6. Start with Phase 1 tasks in [IMPLEMENTATION_PLAN.md](./IMPLEMENTATION_PLAN.md)

### For Contributors
1. **MUST READ**: [AGENT.md](./AGENT.md) for workflow and standards
2. Check [IMPLEMENTATION_PLAN.md](./IMPLEMENTATION_PLAN.md) for open tasks
3. Review relevant [ADRs](./ADR/) before making changes
4. Reference [TECHNICAL_SPEC.md](./TECHNICAL_SPEC.md) for patterns
5. Follow [DESIGN_SYSTEM.md](./DESIGN_SYSTEM.md) for styling
6. Write tests (>90% coverage required)
7. Update documentation when making changes
8. Test against scenarios in [USER_WORKFLOWS.md](./USER_WORKFLOWS.md)

---

## Questions & Clarifications

For architecture questions: See [ARCHITECTURE.md](./ARCHITECTURE.md)
For design questions: See [DESIGN_SYSTEM.md](./DESIGN_SYSTEM.md)
For feature questions: See [PRD.md](../PRD.md)
For implementation questions: See [TECHNICAL_SPEC.md](./TECHNICAL_SPEC.md)
