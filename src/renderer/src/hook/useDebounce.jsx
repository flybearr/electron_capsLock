import React, { useEffect, useCallback } from 'react'
import { debounce } from '../utils'
export default function useDebounce(value, delay, callback) {
  const debounceCallback = useCallback(
    debounce((newValue) => {
      callback(newValue)
    }, delay),
    []
  )
  // send text to main.js and fs opensetting.json , set the default text  , useCallback
  useEffect(() => {
    if (value) {
      debounceCallback(value)
    }
  }, [value])
  return null
}
