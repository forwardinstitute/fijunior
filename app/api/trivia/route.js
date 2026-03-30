import { Anthropic } from '@anthropic-ai/sdk'

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
})

const FALLBACK_QUESTIONS = [
  { q: 'In what year was the National Health Service founded?', options: ['1948', '1952', '1965', '1939'], correct: 0 },
  { q: 'What is the tallest building in London?', options: ['The Shard', 'The Gherkin', 'Canary Wharf Tower', 'The Walkie Talkie'], correct: 0 },
  { q: 'How many people work in the UK civil service approximately?', options: ['500,000', '100,000', '2 million', '50,000'], correct: 0 },
  { q: 'Which company has the most employees worldwide?', options: ['Walmart', 'Amazon', 'Apple', 'McDonald\'s'], correct: 0 },
  { q: 'What percentage of FTSE 100 CEOs are women (roughly)?', options: ['10%', '25%', '50%', '5%'], correct: 0 },
  { q: 'What does ESG stand for in business?', options: ['Environmental, Social, Governance', 'Earnings, Sales, Growth', 'Executive Strategy Group', 'Essential Service Guidelines'], correct: 0 },
  { q: 'Which UK city is known as the "Steel City"?', options: ['Sheffield', 'Birmingham', 'Manchester', 'Leeds'], correct: 0 },
  { q: 'What is the most common day for meetings in UK offices?', options: ['Tuesday', 'Monday', 'Friday', 'Wednesday'], correct: 0 },
]

function shuffleWithCorrect(question) {
  const correctAnswer = question.options[question.correct]
  const shuffled = [...question.options]
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
  }
  return {
    q: question.q,
    options: shuffled,
    correct: shuffled.indexOf(correctAnswer),
  }
}

export async function POST(request) {
  try {
    const { count = 5 } = await request.json()

    const prompt = `Generate ${count} fun trivia questions suitable for teenagers (ages 8-14) visiting an office. Mix of topics: general knowledge, UK facts, science, leadership, history, pop culture, technology, nature, and the world of work.

IMPORTANT RULES:
- Questions should be genuinely interesting and challenging but not impossible
- Use British English
- Each question needs exactly 4 options with only ONE correct answer
- Make the wrong answers plausible (not obviously silly)
- Vary the position of the correct answer (don't always put it first!)
- Include a brief fun fact as explanation

Respond with ONLY a JSON array:
[
  {
    "q": "Question text?",
    "options": ["Option A", "Option B", "Option C", "Option D"],
    "correct": 0,
    "funFact": "Brief interesting fact about the answer"
  }
]

The "correct" field is the index (0-3) of the right answer.`

    const message = await client.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1500,
      messages: [{ role: 'user', content: prompt }],
    })

    const responseText = message.content[0].type === 'text' ? message.content[0].text : ''
    const jsonMatch = responseText.match(/\[[\s\S]*\]/)
    if (!jsonMatch) throw new Error('No JSON array in response')

    const questions = JSON.parse(jsonMatch[0])
    return Response.json({ questions })
  } catch (error) {
    console.error('Error generating trivia:', error)
    // Shuffle fallbacks and pick random subset
    const shuffled = FALLBACK_QUESTIONS
      .sort(() => Math.random() - 0.5)
      .slice(0, 5)
      .map(shuffleWithCorrect)
    return Response.json({ questions: shuffled, fallback: true })
  }
}
