import { describe, it, expect, beforeEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useLocalStorage } from '../useLocalStorage'

describe('useLocalStorage', () => {
  beforeEach(() => {
    // Clear localStorage before each test
    localStorage.clear()
  })

  it('should return default value when key does not exist', () => {
    const { result } = renderHook(() => useLocalStorage('test-key', 'default'))
    expect(result.current[0]).toBe('default')
  })

  it('should persist value to localStorage', () => {
    const { result } = renderHook(() => useLocalStorage('test-key', 'initial'))
    
    act(() => {
      result.current[1]('updated')
    })

    expect(result.current[0]).toBe('updated')
    expect(localStorage.getItem('test-key')).toBe(JSON.stringify('updated'))
  })

  it('should support functional updates', () => {
    const { result } = renderHook(() => useLocalStorage('test-key', 5))
    
    act(() => {
      result.current[1]((current) => current + 10)
    })

    expect(result.current[0]).toBe(15)
  })

  it('should delete value and reset to default', () => {
    const { result } = renderHook(() => useLocalStorage('test-key', 'default'))
    
    act(() => {
      result.current[1]('updated')
    })

    expect(result.current[0]).toBe('updated')
    
    act(() => {
      result.current[2]() // deleteValue
    })

    expect(result.current[0]).toBe('default')
    // After deletion, the hook sets it back to default, which gets persisted
    expect(localStorage.getItem('test-key')).toBe(JSON.stringify('default'))
  })

  it('should handle complex objects', () => {
    const defaultValue = { count: 0, name: 'test' }
    const { result } = renderHook(() => useLocalStorage('test-key', defaultValue))
    
    act(() => {
      result.current[1]({ count: 1, name: 'updated' })
    })

    expect(result.current[0]).toEqual({ count: 1, name: 'updated' })
  })

  it('should handle arrays', () => {
    const { result } = renderHook(() => useLocalStorage<number[]>('test-key', []))
    
    act(() => {
      result.current[1]((current) => [...current, 1, 2, 3])
    })

    expect(result.current[0]).toEqual([1, 2, 3])
  })
})
