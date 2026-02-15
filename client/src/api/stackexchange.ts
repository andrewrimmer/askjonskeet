export interface AnswerWithQuestion {
  answer_id: number
  question_id: number
  score: number
  is_accepted: boolean
  creation_date: number
  body?: string
  excerpt?: string
  title: string
  tags: string[]
  question_link: string
}

interface ApiSearchResult {
  answerId: number
  questionId: number
  title: string
  tags: string[]
  excerpt: string
  score: number
  isAccepted: boolean
  creationDate: number
}

interface ApiSearchResponse {
  items: ApiSearchResult[]
  total: number
}

function mapResult(r: ApiSearchResult): AnswerWithQuestion {
  return {
    answer_id: r.answerId,
    question_id: r.questionId,
    score: r.score,
    is_accepted: r.isAccepted,
    creation_date: r.creationDate,
    excerpt: r.excerpt,
    title: r.title,
    tags: r.tags,
    question_link: `https://stackoverflow.com/q/${r.questionId}`,
  }
}

/**
 * Search Jon Skeet's knowledge base via our Lucene-powered API.
 */
export async function searchAnswers(
  query: string,
  _page: number = 1
): Promise<{ items: AnswerWithQuestion[]; hasMore: boolean }> {
  const response = await fetch(`/api/search?q=${encodeURIComponent(query)}`)
  if (!response.ok) {
    throw new Error('Search failed. Please try again.')
  }

  const data: ApiSearchResponse = await response.json()
  return {
    items: data.items.map(mapResult),
    hasMore: false,
  }
}

/**
 * Get Jon Skeet's latest answers via our API.
 */
export async function getLatestAnswers(
  _page: number = 1
): Promise<{ items: AnswerWithQuestion[]; hasMore: boolean }> {
  const response = await fetch('/api/latest')
  if (!response.ok) {
    throw new Error('Failed to load latest answers.')
  }

  const data: ApiSearchResponse = await response.json()
  return {
    items: data.items.map(mapResult),
    hasMore: false,
  }
}
