const BASE_URL = 'https://api.stackexchange.com/2.3'
const SKEET_USER_ID = 22656
const SITE = 'stackoverflow'

// How many excerpt pages to search in parallel per user-facing "page"
const SEARCH_DEPTH = 5
const EXCERPTS_PER_PAGE = 100
const LATEST_PAGE_SIZE = 20

interface SearchExcerpt {
  answer_id?: number
  question_id: number
  item_type: 'question' | 'answer'
  score: number
  is_accepted?: boolean
  title: string
  tags: string[]
  excerpt: string
  creation_date: number
  last_activity_date: number
  owner: {
    user_id: number
    display_name: string
  }
}

export interface Answer {
  answer_id: number
  question_id: number
  score: number
  is_accepted: boolean
  creation_date: number
  last_activity_date: number
  body?: string
  owner: {
    user_id: number
    display_name: string
    reputation: number
    profile_image: string
  }
}

export interface AnswerWithQuestion {
  answer_id: number
  question_id: number
  score: number
  is_accepted: boolean
  creation_date: number
  last_activity_date: number
  body?: string
  excerpt?: string
  title: string
  tags: string[]
  question_link: string
  question_score: number
}

interface ApiResponse<T> {
  items: T[]
  has_more: boolean
  quota_max: number
  quota_remaining: number
}

async function fetchApi<T>(path: string, params: Record<string, string>): Promise<ApiResponse<T>> {
  const url = new URL(`${BASE_URL}${path}`)
  for (const [key, value] of Object.entries(params)) {
    url.searchParams.set(key, value)
  }
  url.searchParams.set('site', SITE)
  url.searchParams.set('key', 'rl_1fDhKMfngSSkHKvqUeu4eAApE')

  const response = await fetch(url.toString())
  if (!response.ok) {
    const text = await response.text().catch(() => '')
    if (response.status === 502) {
      throw new Error('Stack Exchange API is temporarily unavailable. Please try again in a moment.')
    }
    if (response.status === 400 && text.includes('throttle')) {
      throw new Error('Too many requests. The Stack Exchange API has rate limits. Please wait a moment and try again.')
    }
    throw new Error(`Stack Exchange API error: ${response.status}`)
  }
  return response.json()
}

/**
 * Search Jon Skeet's knowledge base.
 *
 * Uses /search/excerpts which searches full text across BOTH questions
 * and answers. We then filter client-side for results where Skeet is the
 * answer author. This is much better than the old approach of searching
 * questions and hoping Skeet answered them - it finds cases where the
 * search term appears in Skeet's answer even if not in the question title.
 *
 * We search multiple pages in parallel to cast a wide net, since Skeet's
 * answers are a small fraction of all results.
 */
export async function searchAnswers(
  query: string,
  page: number = 1
): Promise<{ items: AnswerWithQuestion[]; hasMore: boolean; quotaRemaining: number }> {
  const startPage = (page - 1) * SEARCH_DEPTH + 1

  // Search multiple pages of excerpts in parallel
  const pagePromises = []
  for (let p = startPage; p < startPage + SEARCH_DEPTH; p++) {
    pagePromises.push(
      fetchApi<SearchExcerpt>('/search/excerpts', {
        q: query,
        page: String(p),
        pagesize: String(EXCERPTS_PER_PAGE),
        sort: 'relevance',
        order: 'desc',
      })
    )
  }

  const pageResults = await Promise.all(pagePromises)

  // Collect Skeet's answer excerpts, deduplicating by answer_id
  const skeetExcerpts = new Map<number, SearchExcerpt>()
  // Also collect question excerpts from Skeet (he asked some questions too,
  // but more importantly questions he answered may appear as question-type
  // excerpts where the search term is in the question title)
  const skeetQuestionIds = new Set<number>()
  let anyHasMore = false

  for (const result of pageResults) {
    if (result.has_more) anyHasMore = true
    for (const item of result.items) {
      if (
        item.item_type === 'answer' &&
        item.owner?.user_id === SKEET_USER_ID &&
        item.answer_id &&
        !skeetExcerpts.has(item.answer_id)
      ) {
        skeetExcerpts.set(item.answer_id, item)
      }
      // Track question IDs from search results - if Skeet answered any,
      // we want those too (the search term matched the question, and
      // Skeet has an answer there)
      if (item.item_type === 'question') {
        skeetQuestionIds.add(item.question_id)
      }
    }
  }

  // For questions that appeared in search results, check if Skeet answered
  // them (covers cases where the search term is in the question but not in
  // Skeet's answer text)
  if (skeetQuestionIds.size > 0) {
    const qIds = [...skeetQuestionIds].slice(0, 100)
    const answersData = await fetchApi<Answer>(
      '/questions/' + qIds.join(';') + '/answers',
      {
        pagesize: '100',
        sort: 'votes',
        order: 'desc',
      }
    )
    for (const a of answersData.items) {
      if (a.owner?.user_id === SKEET_USER_ID && !skeetExcerpts.has(a.answer_id)) {
        // Synthesize an excerpt entry from the answer
        skeetExcerpts.set(a.answer_id, {
          answer_id: a.answer_id,
          question_id: a.question_id,
          item_type: 'answer',
          score: a.score,
          is_accepted: a.is_accepted,
          title: '',
          tags: [],
          excerpt: '',
          creation_date: a.creation_date,
          last_activity_date: a.last_activity_date,
          owner: { user_id: a.owner.user_id, display_name: a.owner.display_name },
        })
      }
    }
  }

  if (skeetExcerpts.size === 0) {
    return { items: [], hasMore: false, quotaRemaining: pageResults[0]?.quota_remaining ?? 0 }
  }

  // Fetch question details for context (titles, tags, links)
  const questionIds = [...new Set([...skeetExcerpts.values()].map((e) => e.question_id))]
  const questionsData = await fetchApi<{
    question_id: number
    title: string
    tags: string[]
    score: number
    link: string
  }>(
    '/questions/' + questionIds.slice(0, 100).join(';'),
    {}
  )
  const questionMap = new Map(
    questionsData.items.map((q) => [q.question_id, q])
  )

  // Fetch full answer bodies for Skeet's answers
  const answerIds = [...skeetExcerpts.keys()]
  const bodiesData = await fetchApi<Answer>(
    '/answers/' + answerIds.slice(0, 100).join(';'),
    { filter: 'withbody' }
  )
  const bodyMap = new Map(bodiesData.items.map((a) => [a.answer_id, a]))

  // Keep best Skeet answer per question, ordered by score
  const bestPerQuestion = new Map<number, { excerpt: SearchExcerpt; answer?: Answer }>()
  for (const excerpt of skeetExcerpts.values()) {
    const answer = bodyMap.get(excerpt.answer_id!)
    const existing = bestPerQuestion.get(excerpt.question_id)
    if (!existing || excerpt.score > (existing.excerpt.score ?? 0)) {
      bestPerQuestion.set(excerpt.question_id, { excerpt, answer })
    }
  }

  // Build results sorted by answer score descending
  const items: AnswerWithQuestion[] = [...bestPerQuestion.values()]
    .sort((a, b) => b.excerpt.score - a.excerpt.score)
    .map(({ excerpt, answer }) => {
      const q = questionMap.get(excerpt.question_id)
      return {
        answer_id: excerpt.answer_id!,
        question_id: excerpt.question_id,
        score: answer?.score ?? excerpt.score,
        is_accepted: answer?.is_accepted ?? excerpt.is_accepted ?? false,
        creation_date: answer?.creation_date ?? excerpt.creation_date,
        last_activity_date: answer?.last_activity_date ?? excerpt.last_activity_date,
        body: answer?.body,
        excerpt: excerpt.excerpt,
        title: q?.title ?? excerpt.title ?? 'Unknown question',
        tags: q?.tags ?? excerpt.tags ?? [],
        question_link: q?.link ?? `https://stackoverflow.com/q/${excerpt.question_id}`,
        question_score: q?.score ?? 0,
      }
    })

  const worthPaging = items.length >= 3

  return {
    items,
    hasMore: anyHasMore && worthPaging,
    quotaRemaining: pageResults[pageResults.length - 1]?.quota_remaining ?? 0,
  }
}

/**
 * Get Jon Skeet's latest answers with their question context.
 */
export async function getLatestAnswers(
  page: number = 1
): Promise<{ items: AnswerWithQuestion[]; hasMore: boolean; quotaRemaining: number }> {
  const data = await fetchApi<Answer>('/users/' + SKEET_USER_ID + '/answers', {
    page: String(page),
    pagesize: String(LATEST_PAGE_SIZE),
    sort: 'creation',
    order: 'desc',
    filter: 'withbody',
  })

  if (data.items.length === 0) {
    return { items: [], hasMore: false, quotaRemaining: data.quota_remaining }
  }

  const questionIds = [...new Set(data.items.map((a) => a.question_id))]
  const questionsData = await fetchApi<{
    question_id: number
    title: string
    tags: string[]
    score: number
    link: string
  }>(
    '/questions/' + questionIds.join(';'),
    {}
  )

  const questionMap = new Map(
    questionsData.items.map((q) => [q.question_id, q])
  )

  const items: AnswerWithQuestion[] = data.items.map((a) => {
    const q = questionMap.get(a.question_id)
    return {
      answer_id: a.answer_id,
      question_id: a.question_id,
      score: a.score,
      is_accepted: a.is_accepted,
      creation_date: a.creation_date,
      last_activity_date: a.last_activity_date,
      body: a.body,
      title: q?.title ?? 'Unknown question',
      tags: q?.tags ?? [],
      question_link: q?.link ?? `https://stackoverflow.com/q/${a.question_id}`,
      question_score: q?.score ?? 0,
    }
  })

  return {
    items,
    hasMore: data.has_more,
    quotaRemaining: data.quota_remaining,
  }
}

/**
 * Get Jon Skeet's user profile info.
 */
export async function getUserInfo(): Promise<{
  reputation: number
  answerCount: number
  profileImage: string
}> {
  const data = await fetchApi<{
    reputation: number
    answer_count: number
    profile_image: string
  }>('/users/' + SKEET_USER_ID, {})

  const user = data.items[0]
  return {
    reputation: user?.reputation ?? 0,
    answerCount: user?.answer_count ?? 0,
    profileImage: user?.profile_image ?? '',
  }
}
