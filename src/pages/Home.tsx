import { useState, useEffect, useCallback } from 'react'
import { useSearchParams } from 'react-router-dom'
import SearchBar from '../components/SearchBar'
import AnswerCard from '../components/AnswerCard'
import LoadingSpinner from '../components/LoadingSpinner'
import { searchAnswers, type AnswerWithQuestion } from '../api/stackexchange'
import { searchSuggestions } from '../data/searchSuggestions'

export default function Home() {
  const [searchParams, setSearchParams] = useSearchParams()
  const queryFromUrl = searchParams.get('q') || ''

  const [results, setResults] = useState<AnswerWithQuestion[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [hasMore, setHasMore] = useState(false)
  const [page, setPage] = useState(1)
  const [hasSearched, setHasSearched] = useState(false)

  const doSearch = useCallback(async (query: string, pageNum: number, append: boolean = false) => {
    setLoading(true)
    setError(null)
    try {
      const data = await searchAnswers(query, pageNum)
      setResults((prev) => append ? [...prev, ...data.items] : data.items)
      setHasMore(data.hasMore)
      setPage(pageNum)
      setHasSearched(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (queryFromUrl) {
      doSearch(queryFromUrl, 1)
    }
  }, [queryFromUrl, doSearch])

  const handleSearch = (query: string) => {
    setSearchParams({ q: query })
  }

  const handleLoadMore = () => {
    if (queryFromUrl) {
      doSearch(queryFromUrl, page + 1, true)
    }
  }

  const showHero = !hasSearched && !queryFromUrl

  return (
    <div>
      {showHero && (
        <div className="bg-gradient-to-b from-skeet-dark via-skeet-gray to-gray-50 pt-10 pb-14 px-4">
          <div className="max-w-2xl mx-auto text-center">
            {/* Big Jon */}
            <img
              src="/jonskeet.png"
              alt="Jon Skeet"
              className="w-32 h-32 sm:w-36 sm:h-36 rounded-full object-cover mx-auto mb-5 avatar-glow border-4 border-skeet-dark"
            />
            <h2 className="text-3xl sm:text-4xl font-bold text-white mb-2">
              Ask Jon Skeet
            </h2>
            <p className="text-gray-400 max-w-md mx-auto mb-8 text-sm sm:text-base leading-relaxed">
              Thousands of answers. One legendary engineer.
              Search the most prolific knowledge base on Stack Overflow.
            </p>

            {/* Search bar */}
            <div className="max-w-xl mx-auto">
              <SearchBar
                initialQuery={queryFromUrl}
                onSearch={handleSearch}
                autoFocus
                size="large"
              />
            </div>

            {/* Suggestion chips */}
            <div className="mt-5 flex flex-wrap justify-center gap-2">
              {searchSuggestions.slice(0, 8).map((term) => (
                <button
                  key={term}
                  onClick={() => handleSearch(term)}
                  className="px-3 py-1 bg-white/10 hover:bg-skeet-orange/80 text-gray-300 hover:text-white text-xs rounded-full transition-colors"
                >
                  {term}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      <div className="max-w-4xl mx-auto px-4 py-6">
        {!showHero && (
          <SearchBar
            initialQuery={queryFromUrl}
            onSearch={handleSearch}
            size="normal"
          />
        )}

        {error && (
          <div className="mt-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
            {error}
          </div>
        )}

        {loading && results.length === 0 && (
          <LoadingSpinner />
        )}

        {results.length > 0 && (
          <div className="mt-6 space-y-3 animate-fade-in-up">
            {results.map((answer) => (
              <AnswerCard key={answer.answer_id} answer={answer} />
            ))}
          </div>
        )}

        {hasSearched && !loading && results.length === 0 && !error && (
          <div className="mt-12 text-center text-gray-400">
            <img
              src="/jonskeet.png"
              alt="Jon Skeet"
              className="w-16 h-16 rounded-full object-cover mx-auto mb-3 opacity-40 grayscale"
            />
            <p className="text-lg font-medium">No answers found.</p>
            <p className="text-sm mt-1">Even Jon Skeet hasn't answered everything. Yet.</p>
          </div>
        )}

        {hasMore && (
          <div className="mt-6 text-center">
            <button
              onClick={handleLoadMore}
              disabled={loading}
              className="px-6 py-2.5 bg-white border border-gray-200 hover:border-skeet-orange text-gray-700 hover:text-skeet-orange rounded-lg text-sm font-medium transition-all disabled:opacity-50 shadow-sm"
            >
              {loading ? 'Loading...' : 'Load more answers'}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
