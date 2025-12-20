export class PerformanceMonitor {
  private static instance: PerformanceMonitor
  private metrics: Map<string, number[]> = new Map()
  private marks: Map<string, number> = new Map()

  private constructor() {}

  static getInstance(): PerformanceMonitor {
    if (!PerformanceMonitor.instance) {
      PerformanceMonitor.instance = new PerformanceMonitor()
    }
    return PerformanceMonitor.instance
  }

  mark(name: string): void {
    this.marks.set(name, performance.now())
    
    if (typeof performance.mark === 'function') {
      performance.mark(name)
    }
  }

  measure(name: string, startMark: string, endMark?: string): number {
    const startTime = this.marks.get(startMark)
    if (!startTime) {
      console.warn(`Start mark "${startMark}" not found`)
      return 0
    }

    const endTime = endMark ? this.marks.get(endMark) : performance.now()
    if (!endTime) {
      console.warn(`End mark "${endMark}" not found`)
      return 0
    }

    const duration = endTime - startTime

    if (!this.metrics.has(name)) {
      this.metrics.set(name, [])
    }
    this.metrics.get(name)!.push(duration)

    if (typeof performance.measure === 'function') {
      try {
        performance.measure(name, startMark, endMark)
      } catch (e) {
        
      }
    }

    return duration
  }

  getMetrics(name: string): { avg: number; min: number; max: number; count: number } | null {
    const values = this.metrics.get(name)
    if (!values || values.length === 0) {
      return null
    }

    const avg = values.reduce((a, b) => a + b, 0) / values.length
    const min = Math.min(...values)
    const max = Math.max(...values)

    return { avg, min, max, count: values.length }
  }

  clear(): void {
    this.metrics.clear()
    this.marks.clear()
    
    if (typeof performance.clearMarks === 'function') {
      performance.clearMarks()
    }
    if (typeof performance.clearMeasures === 'function') {
      performance.clearMeasures()
    }
  }

  logMetrics(): void {
    if (!import.meta.env.DEV) return

    console.group('⚡ Performance Metrics')
    this.metrics.forEach((values, name) => {
      const stats = this.getMetrics(name)
      if (stats) {
        console.log(
          `${name}: avg=${stats.avg.toFixed(2)}ms, min=${stats.min.toFixed(2)}ms, max=${stats.max.toFixed(2)}ms (${stats.count} samples)`
        )
      }
    })
    console.groupEnd()
  }

  getMemoryUsage(): { used: number; total: number; percentage: number } | null {
    if ('memory' in performance) {
      const memory = (performance as any).memory
      const used = memory.usedJSHeapSize / 1048576
      const total = memory.totalJSHeapSize / 1048576
      const percentage = (used / total) * 100
      return { used, total, percentage }
    }
    return null
  }

  logMemoryUsage(): void {
    if (!import.meta.env.DEV) return

    const memory = this.getMemoryUsage()
    if (memory) {
      console.log(
        `💾 Memory: ${memory.used.toFixed(2)}MB / ${memory.total.toFixed(2)}MB (${memory.percentage.toFixed(1)}%)`
      )
    }
  }
}

export const performanceMonitor = PerformanceMonitor.getInstance()

export function withPerformance<T extends (...args: any[]) => any>(
  fn: T,
  name: string
): T {
  return ((...args: any[]) => {
    const startMark = `${name}-start-${Date.now()}`
    const endMark = `${name}-end-${Date.now()}`
    
    performanceMonitor.mark(startMark)
    const result = fn(...args)

    if (result instanceof Promise) {
      return result.finally(() => {
        performanceMonitor.mark(endMark)
        performanceMonitor.measure(name, startMark, endMark)
      })
    }

    performanceMonitor.mark(endMark)
    performanceMonitor.measure(name, startMark, endMark)
    return result
  }) as T
}
