import { Anthropic } from '@anthropic-ai/sdk'

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
})

const FALLBACK_SETS = [
  { items: ['Salmon', 'Trout', 'Tuna', 'Penguin'], odd: 'Penguin', hint: 'Three are fish, one is a bird' },
  { items: ['Mars', 'Jupiter', 'Saturn', 'Moon'], odd: 'Moon', hint: 'Three are planets, one orbits a planet' },
  { items: ['Python', 'Java', 'Cobra', 'Ruby'], odd: 'Cobra', hint: 'Three are programming languages, one is just a snake' },
  { items: ['Violin', 'Cello', 'Trumpet', 'Viola'], odd: 'Trumpet', hint: 'Three are string instruments, one is brass' },
  { items: ['Thames', 'Severn', 'Ben Nevis', 'Mersey'], odd: 'Ben Nevis', hint: 'Three are rivers, one is a mountain' },
  { items: ['Photosynthesis', 'Respiration', 'Digestion', 'Evaporation'], odd: 'Evaporation', hint: 'Three happen in living things, one is a physical process' },
  { items: ['Shakespeare', 'Dickens', 'Picasso', 'Austen'], odd: 'Picasso', hint: 'Three are writers, one is a painter' },
  { items: ['Spreadsheet', 'Database', 'Sandwich', 'Presentation'], odd: 'Sandwich', hint: 'Three are things you make on a computer, one you make in a kitchen' },
]

export async function POST(request) {
  try {
    const { count = 5 } = await request.json()

    const prompt = `Generate ${count} "Spot the Odd One Out" puzzles for teenagers (ages 8-14). Each puzzle has 4 items where 3 share a common theme and 1 is the odd one out.

IMPORTANT RULES:
- Make them genuinely tricky and interesting (not obvious!)
- The odd one out should require actual thinking
- Mix topics: science, geography, history, pop culture, nature, technology, music, sport, food, the workplace
- Use British English
- Include a hint that explains why the odd one is different
- Vary the position of the odd item (don't always put it in the same spot)

Respond with ONLY a JSON array:
[
  {
    "items": ["Item1", "Item2", "Item3", "Item4"],
    "odd": "TheOddItem",
    "hint": "Brief explanation of why"
  }
]`

    const message = await client.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1200,
      messages: [{ role: 'user', content: prompt }],
    })

    const responseText = message.content[0].type === 'text' ? message.content[0].text : ''
    const jsonMatch = responseText.match(/\[[\s\S]*\]/)
    if (!jsonMatch) throw new Error('No JSON array in response')

    const sets = JSON.parse(jsonMatch[0])
    return Response.json({ sets })
  } catch (error) {
    console.error('Error generating odd one out:', error)
    const shuffled = FALLBACK_SETS
      .sort(() => Math.random() - 0.5)
      .slice(0, count || 5)
    return Response.json({ sets: shuffled, fallback: true })
  }
}
