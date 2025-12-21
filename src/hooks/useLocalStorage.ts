import { useState, useEffect, useCallback } from 'react'

/**
 * Custom hook to persist state in localStorage
 * This is a drop-in replacement for @github/spark/hooks useKV
 * 
 * @param key - The localStorage key
 * @param defaultValue - Default value if key doesn't exist
 * @returns [value, setValue, deleteValue] - Tuple similar to useState with additional delete function
 */
export function useLocalStorage<T>(
  key: string,
  defaultValue: T
): [T, (value: T | ((current: T) => T)) => void, () => void] {
  // Initialize state from localStorage or use default
  const [value, setValue] = useState<T>(() => {
    try {
      const item = window.localStorage.getItem(key)
      return item ? JSON.parse(item) : defaultValue
    } catch (error) {
      console.warn(`Error reading localStorage key "${key}":`, error)
      return defaultValue
    }
  })

  // Update localStorage when value changes
  useEffect(() => {
    try {
      window.localStorage.setItem(key, JSON.stringify(value))
    } catch (error) {
      console.warn(`Error setting localStorage key "${key}":`, error)
    }
  }, [key, value])

  // Wrapper for setValue that supports functional updates
  const setStoredValue = useCallback((newValue: T | ((current: T) => T)) => {
    setValue((currentValue) => {
      const valueToStore = newValue instanceof Function ? newValue(currentValue) : newValue
      return valueToStore
    })
  }, [])

  // Delete the key from localStorage and reset to default
  const deleteValue = useCallback(() => {
    try {
      window.localStorage.removeItem(key)
      setValue(defaultValue)
    } catch (error) {
      console.warn(`Error removing localStorage key "${key}":`, error)
    }
  }, [key, defaultValue])

  return [value, setStoredValue, deleteValue]
}
