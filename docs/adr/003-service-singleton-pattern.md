# ADR-003: Service Singleton Pattern

## Status
Accepted

## Date
2025-01-XX (Original decision)
2026-02-03 (Documented)

## Context

The PDF viewer/editor needs to manage complex state and operations:
- PDF document state and caching
- Annotation history with undo/redo
- Progress tracking for long operations
- Resource cleanup and memory management

We needed to decide how to organize business logic and state:

1. **Everything in React state/context**: All logic in components and hooks
2. **Redux/Zustand**: External state management library
3. **Service classes**: Singleton services with React integration via hooks
4. **Event-driven architecture**: Pub/sub with event emitters

Key requirements:
- Testable without React rendering
- Shareable state across components
- Predictable state mutations
- Support for undo/redo
- Progress callbacks for async operations

## Decision

We will use **singleton service classes** that encapsulate business logic and state, with a **subscriber pattern** for reactivity that React hooks can subscribe to.

### Service Pattern

```typescript
class FeatureService {
  private static instance: FeatureService
  private listeners: Set<() => void> = new Set()
  private state: FeatureState = initialState

  private constructor() {}

  static getInstance(): FeatureService {
    if (!FeatureService.instance) {
      FeatureService.instance = new FeatureService()
    }
    return FeatureService.instance
  }

  // Subscriber pattern for reactivity
  subscribe(listener: () => void): () => void {
    this.listeners.add(listener)
    return () => this.listeners.delete(listener)
  }

  private notify(): void {
    this.listeners.forEach(listener => listener())
  }

  // State mutations notify subscribers
  doSomething(): void {
    this.state = { ...this.state, updated: true }
    this.notify()
  }

  // Getter for current state
  getState(): FeatureState {
    return this.state
  }
}

export const featureService = FeatureService.getInstance()
```

### React Hook Integration

```typescript
function useFeature() {
  const [state, setState] = useState(featureService.getState())

  useEffect(() => {
    // Subscribe to service changes
    const unsubscribe = featureService.subscribe(() => {
      setState(featureService.getState())
    })
    return unsubscribe
  }, [])

  return {
    ...state,
    doSomething: featureService.doSomething.bind(featureService)
  }
}
```

## Consequences

### Positive

1. **Testable**: Services can be unit tested without React
2. **Framework Agnostic**: Core logic doesn't depend on React
3. **Predictable**: Single source of truth, clear mutation points
4. **Performant**: Only subscribed components re-render
5. **Debuggable**: State changes traced to specific service methods
6. **Undo/Redo**: History management in service, not React state
7. **Resource Management**: Services control their own cleanup
8. **Progress Tracking**: Callbacks set on service, not threaded through props

### Negative

1. **Singletons**: Global state can make testing setup more complex
2. **Manual Subscription**: More boilerplate than built-in state management
3. **No DevTools**: Unlike Redux, no time-travel debugging out of box
4. **Memory Leaks**: Must remember to unsubscribe
5. **Concurrent Issues**: Must be careful with async operations

### Mitigations

| Issue | Mitigation |
|-------|------------|
| Singleton testing | Reset service state in test setup/teardown |
| Boilerplate | Consistent patterns make it predictable |
| DevTools | Console logging in development mode |
| Memory leaks | useEffect cleanup ensures unsubscription |
| Concurrency | Careful async/await patterns, cancellation tokens |

## Implementation Examples

### Annotation Service (with Undo/Redo)

```typescript
const MAX_HISTORY = 20

class AnnotationService {
  private annotations: Annotation[] = []
  private history: Annotation[][] = []
  private historyIndex = -1
  private listeners: Set<() => void> = new Set()

  private saveState(): void {
    // Truncate future history if we branched
    this.history = this.history.slice(0, this.historyIndex + 1)
    // Save current state
    this.history.push(JSON.parse(JSON.stringify(this.annotations)))
    // Limit history size
    if (this.history.length > MAX_HISTORY) {
      this.history.shift()
    } else {
      this.historyIndex++
    }
  }

  addAnnotation(annotation: Annotation): string {
    this.annotations.push(annotation)
    this.saveState()
    this.notify()
    return annotation.id
  }

  undo(): boolean {
    if (this.historyIndex > 0) {
      this.historyIndex--
      this.annotations = JSON.parse(JSON.stringify(this.history[this.historyIndex]))
      this.notify()
      return true
    }
    return false
  }

  redo(): boolean {
    if (this.historyIndex < this.history.length - 1) {
      this.historyIndex++
      this.annotations = JSON.parse(JSON.stringify(this.history[this.historyIndex]))
      this.notify()
      return true
    }
    return false
  }
}
```

### PDF Service (with Progress Callbacks)

```typescript
class PDFService {
  private progressCallback?: (progress: number) => void

  setProgressCallback(callback: (progress: number) => void): void {
    this.progressCallback = callback
  }

  async loadDocument(file: File): Promise<PDFDocumentProxy> {
    const loadingTask = pdfjsLib.getDocument({ data: await file.arrayBuffer() })

    loadingTask.onProgress = ({ loaded, total }) => {
      this.progressCallback?.(Math.round((loaded / total) * 100))
    }

    return loadingTask.promise
  }
}
```

### Hook with Context Provider

```typescript
const PDFContext = createContext<PDFContextValue | null>(null)

function PDFProvider({ children }: { children: ReactNode }) {
  const [document, setDocument] = useState<PDFDocumentProxy | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [progress, setProgress] = useState(0)

  const loadDocument = useCallback(async (file: File) => {
    setIsLoading(true)
    pdfService.setProgressCallback(setProgress)

    try {
      const doc = await pdfService.loadDocument(file)
      setDocument(doc)
    } finally {
      setIsLoading(false)
    }
  }, [])

  return (
    <PDFContext.Provider value={{ document, isLoading, progress, loadDocument }}>
      {children}
    </PDFContext.Provider>
  )
}

function usePDF() {
  const context = useContext(PDFContext)
  if (!context) throw new Error('usePDF must be within PDFProvider')
  return context
}
```

## Alternatives Considered

### Redux/Redux Toolkit
- **Pros**: DevTools, middleware, large ecosystem, proven patterns
- **Cons**: Boilerplate, learning curve, overkill for this app size
- **Why rejected**: Added complexity without proportional benefit

### Zustand
- **Pros**: Simple API, less boilerplate, TypeScript-friendly
- **Cons**: Another dependency, still React-specific
- **Why rejected**: Custom pattern gives us more control for undo/redo

### Pure React Context
- **Pros**: Built-in, no external dependencies
- **Cons**: Re-renders all consumers, complex for undo/redo, harder to test
- **Why rejected**: Performance and testability concerns

### MobX
- **Pros**: Automatic reactivity, observables, less boilerplate
- **Cons**: Magic can be confusing, larger bundle, proxy-based
- **Why rejected**: Explicit subscriptions preferred for clarity

## Success Metrics

| Metric | Target | Status |
|--------|--------|--------|
| Service test coverage | > 90% | Achieved |
| Memory leaks in E2E tests | 0 | Achieved |
| Undo/redo reliability | 100% | Achieved |
| Progress callback accuracy | Within 5% | Achieved |

## References

- [React useEffect Cleanup](https://react.dev/learn/synchronizing-with-effects#how-to-handle-the-effect-firing-twice-in-development)
- [Singleton Pattern](https://refactoring.guru/design-patterns/singleton)
- ADR-001: Client-Side Only Architecture
