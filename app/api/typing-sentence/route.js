import { Anthropic } from '@anthropic-ai/sdk'

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
})

// Fallback sentences by difficulty if API fails
const FALLBACK_SENTENCES = {
  1: [
    'Hello and welcome to our team.',
    'We work together every day.',
    'The office is a busy place.',
  ],
  2: [
    'Good leaders listen to their teams.',
    'Working together helps everyone succeed.',
    'The best ideas come from teamwork.',
  ],
  3: [
    'Leadership means helping other people grow and develop.',
    'The Forward Institute brings leaders from different sectors together.',
    'A great leader always puts the needs of their team first.',
  ],
  4: [
    'Responsible leadership requires understanding different perspectives and making thoughtful decisions.',
    'The most effective organisations build cultures of trust, openness and collaboration.',
    'Cross-sector collaboration brings fresh thinking to problems that no single organisation can solve alone.',
  ],
  5: [
    'Building a more responsible future requires leaders who can navigate complexity with both courage and compassion.',
    'The Forward Institute works with senior leaders across sectors to develop the kind of leadership our society needs.',
    'Sustainable organisational change happens when leaders commit to ongoing reflection, honest dialogue and purposeful action.',
  ],
}

export async function POST(request) {
  try {
    const { difficulty } = await request.json()
    const level = Math.min(5, Math.max(1, difficulty || 1))

    const prompt = `Generate ONE typing practice sentence for a child/teenager. The sentence should be about leadership, teamwork, or office life - themed around the Forward Institute (a UK organisation that develops responsible leaders).

Difficulty level: ${level}/5
- Level 1: Very simple, 4-6 words, basic vocabulary (age 8)
- Level 2: Simple, 6-8 words, everyday vocabulary (age 9-10)
- Level 3: Medium, 8-12 words, slightly more complex (age 11-12)
- Level 4: Harder, 12-16 words, business vocabulary (age 13-14)
- Level 5: Expert, 16-20 words, professional language with punctuation (age 14+)

IMPORTANT: Use British English spelling (organisation not organization, colour not color, programme not program).
Respond with ONLY the sentence, nothing else. No quotes, no explanation.`

    const message = await client.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 100,
      messages: [{ role: 'user', content: prompt }],
    })

    const sentence =
      message.content[0].type === 'text'
        ? message.content[0].text.trim().replace(/^["']|["']$/g, '')
        : null

    if (!sentence) throw new Error('No sentence generated')

    return Response.json({ sentence })
  } catch (error) {
    console.error('Error generating sentence:', error)
    // Use fallback
    const level = Math.min(5, Math.max(1, 1))
    const fallbacks = FALLBACK_SENTENCES[level] || FALLBACK_SENTENCES[1]
    const sentence = fallbacks[Math.floor(Math.random() * fallbacks.length)]
    return Response.json({ sentence, fallback: true })
  }
}
