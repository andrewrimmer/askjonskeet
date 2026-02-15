import type { AnswerWithQuestion } from '../api/stackexchange'
import { decodeHtml } from '../utils/html'

interface AnswerCardProps {
  answer: AnswerWithQuestion
}

function formatDate(timestamp: number): string {
  return new Date(timestamp * 1000).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}

function getExcerptFromBody(body: string | undefined, maxLength: number = 200): string {
  if (!body) return ''
  const stripped = body
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
  const plain = decodeHtml(stripped)
  if (plain.length <= maxLength) return plain
  return plain.slice(0, maxLength).replace(/\s\S*$/, '') + '...'
}

function cleanExcerpt(raw: string): string {
  // The API excerpt may contain <span class="highlight">...</span> for
  // matched terms. Strip all HTML tags and decode entities.
  return decodeHtml(
    raw.replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim()
  )
}

export default function AnswerCard({ answer }: AnswerCardProps) {
  const title = decodeHtml(answer.title)
  // Prefer the search-API excerpt (contains search-relevant snippet)
  // Fall back to deriving one from the full answer body (e.g. Latest page)
  const excerpt = answer.excerpt
    ? cleanExcerpt(answer.excerpt)
    : getExcerptFromBody(answer.body)
  const answerUrl = `https://stackoverflow.com/a/${answer.answer_id}`

  return (
    <a
      href={answerUrl}
      target="_blank"
      rel="noopener noreferrer"
      className="block bg-white border border-gray-200 rounded-xl p-4 hover:border-skeet-orange/50 hover:shadow-md hover:shadow-orange-500/5 transition-all group"
    >
      <div className="flex gap-3">
        {/* Score badge */}
        <div className="shrink-0 flex flex-col items-center gap-1">
          <div
            className={`w-12 h-12 rounded-lg flex items-center justify-center text-lg font-bold ${
              answer.is_accepted
                ? 'bg-green-50 text-green-700 ring-2 ring-green-300'
                : answer.score > 0
                  ? 'bg-orange-50 text-skeet-orange'
                  : 'bg-gray-100 text-gray-400'
            }`}
          >
            {answer.score}
          </div>
          {answer.is_accepted && (
            <svg className="w-5 h-5 text-green-500" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z" clipRule="evenodd" />
            </svg>
          )}
        </div>

        {/* Content */}
        <div className="min-w-0 flex-1">
          <h3 className="font-semibold text-gray-900 group-hover:text-skeet-orange transition-colors leading-snug">
            {title}
          </h3>

          {excerpt && (
            <p className="mt-1.5 text-sm text-gray-500 leading-relaxed line-clamp-2">
              {excerpt}
            </p>
          )}

          <div className="mt-2.5 flex flex-wrap items-center gap-2">
            {answer.tags.slice(0, 5).map((tag) => (
              <span key={tag} className="tag-pill">
                {tag}
              </span>
            ))}
            <span className="text-xs text-gray-400 ml-auto whitespace-nowrap">
              {formatDate(answer.creation_date)}
            </span>
          </div>
        </div>
      </div>
    </a>
  )
}
