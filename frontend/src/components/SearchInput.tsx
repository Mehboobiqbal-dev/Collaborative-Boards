import React, { useState, useEffect, useRef } from 'react'

interface SearchInputProps {
  placeholder?: string
  value: string
  onChange: (value: string) => void
  onSearch?: (query: string) => void
  className?: string
  debounceMs?: number
  showClearButton?: boolean
  disabled?: boolean
}

export const SearchInput: React.FC<SearchInputProps> = ({
  placeholder = "Search...",
  value,
  onChange,
  onSearch,
  className = "",
  debounceMs = 300,
  showClearButton = true,
  disabled = false
}) => {
  const [localValue, setLocalValue] = useState(value)
  const debounceRef = useRef<NodeJS.Timeout>()

  useEffect(() => {
    setLocalValue(value)
  }, [value])

  useEffect(() => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current)
    }

    debounceRef.current = setTimeout(() => {
      onChange(localValue)
      if (onSearch && localValue.trim()) {
        onSearch(localValue.trim())
      }
    }, debounceMs)

    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current)
      }
    }
  }, [localValue, onChange, onSearch, debounceMs])

  const handleClear = () => {
    setLocalValue('')
    onChange('')
    if (onSearch) {
      onSearch('')
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && onSearch) {
      onSearch(localValue.trim())
    }
  }

  return (
    <div className={`relative ${className}`}>
      <div className="relative">
        <input
          type="text"
          placeholder={placeholder}
          value={localValue}
          onChange={(e) => setLocalValue(e.target.value)}
          onKeyPress={handleKeyPress}
          disabled={disabled}
          className="w-full px-3 py-2 pl-10 pr-10 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
        />
        
        {/* Search Icon */}
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <svg
            className="h-5 w-5 text-gray-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
        </div>

        {/* Clear Button */}
        {showClearButton && localValue && (
          <button
            type="button"
            onClick={handleClear}
            className="absolute inset-y-0 right-0 pr-3 flex items-center hover:text-gray-600"
          >
            <svg
              className="h-5 w-5 text-gray-400 hover:text-gray-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        )}
      </div>
    </div>
  )
}

export default SearchInput
