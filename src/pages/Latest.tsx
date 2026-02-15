import { useState, useEffect, useCallback } from 'react'
import AnswerCard from '../components/AnswerCard'
import LoadingSpinner from '../components/LoadingSpinner'
import { getLatestAnswers, type AnswerWithQuestion } from '../api/stackexchange'

export default function Latest() {
  const [answers, setAnswers] = useState<AnswerWithQuestion[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [hasMore, setHasMore] = useState(false)
  const [page, setPage] = useState(1)

  const fetchPage = useCallback(async (pageNum: number, append: boolean = false) => {
    setLoading(true)
    setError(null)
    try {
      const data = await getLatestAnswers(pageNum)
      setAnswers((prev) => append ? [...prev, ...data.items] : data.items)
      setHasMore(data.hasMore)
      setPage(pageNum)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchPage(1)
  }, [fetchPage])

  const handleLoadMore = () => {
    fetchPage(page + 1, true)
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="flex items-center gap-3 mb-6">
        <img
          src="/jonskeet.png"
          alt="Jon Skeet"
          className="w-10 h-10 rounded-full object-cover border-2 border-skeet-orange/30"
        />
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Latest Answers</h2>
          <p className="text-gray-500 text-sm -mt-0.5">
            Fresh from the source. Updated live from Stack Overflow.
          </p>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
          {error}
        </div>
      )}

      {loading && answers.length === 0 && (
        <LoadingSpinner message="Fetching latest wisdom..." />
      )}

      {answers.length > 0 && (
        <div className="space-y-3 animate-fade-in-up">
          {answers.map((answer) => (
            <AnswerCard key={answer.answer_id} answer={answer} />
          ))}
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
  )
}
