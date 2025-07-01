import { useEffect, useState, useCallback } from 'react'

interface UseDebouncedValidationOptions {
  delay?: number
  validator?: (value: string) => string | undefined
}

export function useDebouncedValidation(value: string, options: UseDebouncedValidationOptions = {}) {
  const { delay = 500, validator } = options
  const [debouncedValue, setDebouncedValue] = useState(value)
  const [validationError, setValidationError] = useState<string | undefined>()
  const [isValidating, setIsValidating] = useState(false)

  useEffect(() => {
    setIsValidating(true)
    const timer = setTimeout(() => {
      setDebouncedValue(value)
      setIsValidating(false)
    }, delay)

    return () => {
      clearTimeout(timer)
    }
  }, [value, delay])

  useEffect(() => {
    if (validator && !isValidating && debouncedValue) {
      const error = validator(debouncedValue)
      setValidationError(error)
    }
  }, [debouncedValue, validator, isValidating])

  const validateImmediately = useCallback(() => {
    if (validator) {
      const error = validator(value)
      setValidationError(error)
      return error
    }
    return undefined
  }, [value, validator])

  return {
    debouncedValue,
    validationError,
    isValidating,
    validateImmediately,
  }
}
