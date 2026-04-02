import { Anthropic } from '@anthropic-ai/sdk'

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
})

const FALLBACK_WORDS = {
  easy: ['TEAM', 'PLAN', 'LEAD', 'GOAL', 'WORK', 'IDEA', 'GROW', 'HELP'],
  medium: ['LEADER', 'OFFICE', 'GROWTH', 'CHANGE', 'VALUES', 'IMPACT', 'VISION', 'TALENT'],
  hard: ['STRATEGY', 'TEAMWORK', 'PROGRESS', 'BUSINESS', 'EMPLOYEE', 'CREATIVE', 'AMBITION', 'DECISION'],
}

export async function POST(request) {
  try {
    const { count = 7, difficulty = 'medium' } = await request.json()

    const diffRules = {
      easy: '4-5 letters, simple everyday words a child would know (age 8-9)',
      medium: '5-7 letters, workplace and leadership themed words (age 10-12)',
      hard: '7-10 letters, more advanced business and professional words (age 13-14)',
    }

    const prompt = `Generate ${count} words for a word scramble game. The words should be themed around leadership, teamwork, the workplace, or personal development.

Difficulty: ${difficulty} - ${diffRules[difficulty] || diffRules.medium}

RULES:
- Use British English spelling
- Words should be single words (no spaces or hyphens)
- All words should be real, common English words
- Each word should be different
- Make them fun and interesting, not boring

Respond with ONLY a JSON array of uppercase strings, e.g.: ["WORD1", "WORD2", "WORD3"]`

    const message = await client.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 200,
      messages: [{ role: 'user', content: prompt }],
    })

    const responseText = message.content[0].type === 'text' ? message.content[0].text : ''
    const jsonMatch = responseText.match(/\[[\s\S]*\]/)
    if (!jsonMatch) throw new Error('No JSON array')

    const words = JSON.parse(jsonMatch[0])
    if (!Array.isArray(words) || words.length === 0) throw new Error('Empty array')

    return Response.json({ words: words.map(w => w.toUpperCase()) })
  } catch (error) {
    console.error('Error generating words:', error)
    const { difficulty = 'medium' } = await request.json().catch(() => ({}))
    const fallbacks = FALLBACK_WORDS[difficulty] || FALLBACK_WORDS.medium
    const shuffled = [...fallbacks].sort(() => Math.random() - 0.5).slice(0, 7)
    return Response.json({ words: shuffled, fallback: true })
  }
}
