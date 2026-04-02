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
  let level = 1
  try {
    const { difficulty } = await request.json()
    level = Math.min(5, Math.max(1, difficulty || 1))

    // Random theme seed for variety
    const themes = ['teamwork', 'leadership', 'office life', 'problem solving', 'creativity', 'communication', 'goals', 'helping others', 'making decisions', 'working together', 'new ideas', 'being brave', 'listening', 'learning new things']
    const theme = themes[Math.floor(Math.random() * themes.length)]

    const prompt = `Generate ONE unique typing practice sentence for a child/teenager. Theme: ${theme}.

Difficulty level: ${level}/5
- Level 1: Simple and fun, 5-8 words, easy vocabulary (age 8-9). Examples of the style: "Our team loves finding new ideas together." or "Every great plan starts with a good chat."
- Level 2: Slightly longer, 7-10 words, everyday vocabulary (age 9-10)
- Level 3: Medium, 10-14 words, slightly more complex (age 11-12)
- Level 4: Harder, 14-18 words, business vocabulary (age 13-14)
- Level 5: Expert, 18-22 words, professional language with commas and varied punctuation (age 14+)

IMPORTANT RULES:
- Be CREATIVE and VARIED - never use generic phrases like "Good leaders help their team"
- Use British English spelling (organisation not organization, colour not color)
- Make it interesting and fun, not dry or boring
- Each sentence should feel fresh and different
- Respond with ONLY the sentence, nothing else. No quotes, no explanation.`

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
    // Use fallback at the requested difficulty level
    const fallbacks = FALLBACK_SENTENCES[level] || FALLBACK_SENTENCES[1]
    const sentence = fallbacks[Math.floor(Math.random() * fallbacks.length)]
    return Response.json({ sentence, fallback: true })
  }
}
