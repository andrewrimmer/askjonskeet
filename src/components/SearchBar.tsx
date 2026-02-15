import { useState, useEffect, useRef } from 'react'
import { getRandomPlaceholder } from '../data/searchSuggestions'

interface SearchBarProps {
  initialQuery?: string
  onSearch: (query: string) => void
  autoFocus?: boolean
  size?: 'large' | 'normal'
}

export default function SearchBar({
  initialQuery = '',
  onSearch,
  autoFocus = false,
  size = 'normal',
}: SearchBarProps) {
  const [query, setQuery] = useState(initialQuery)
  const [placeholder] = useState(getRandomPlaceholder)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    setQuery(initialQuery)
  }, [initialQuery])

  useEffect(() => {
    if (autoFocus && inputRef.current) {
      inputRef.current.focus()
    }
  }, [autoFocus])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const trimmed = query.trim()
    if (trimmed) {
      onSearch(trimmed)
    }
  }

  const isLarge = size === 'large'

  return (
    <form onSubmit={handleSubmit} className="w-full">
      <div className={`flex gap-2 ${isLarge ? 'shadow-lg shadow-orange-500/10 rounded-xl' : ''}`}>
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={placeholder}
          className={`flex-1 border border-gray-300 focus:border-skeet-orange focus:ring-2 focus:ring-skeet-orange/20 outline-none transition-all ${
            isLarge
              ? 'text-lg py-3.5 px-5 rounded-l-xl'
              : 'text-base py-2 px-3 rounded-lg'
          }`}
        />
        <button
          type="submit"
          className={`bg-skeet-orange hover:bg-orange-600 text-white font-semibold transition-colors shrink-0 ${
            isLarge
              ? 'px-8 py-3.5 text-lg rounded-r-xl'
              : 'px-4 py-2 rounded-lg'
          }`}
        >
          Ask
        </button>
      </div>
    </form>
  )
}
