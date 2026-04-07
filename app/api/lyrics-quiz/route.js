import { Anthropic } from '@anthropic-ai/sdk'

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
})

export async function POST(request) {
  try {
    const { artists, count = 10 } = await request.json()

    if (!artists || artists.length === 0) {
      return Response.json({ error: 'No artists selected' }, { status: 400 })
    }

    const artistList = artists.join(', ')

    const prompt = `Generate exactly ${count} lyrics quiz questions for a fun music quiz for a child/teenager. The questions should be about songs by these artists: ${artistList}.

For each question, pick a well-known, CLEAN song by one of the listed artists. Give a line of lyrics, then a follow-up line with ONE word blanked out. Provide 4 multiple choice options (one correct, three plausible but wrong).

IMPORTANT RULES:
- Only use famous, well-known songs that a 10-14 year old in the UK would likely know
- Songs MUST be clean/family-friendly - no explicit content whatsoever
- Use British English spelling where relevant
- Spread questions fairly across the selected artists
- Make the wrong options plausible (same part of speech, similar theme) but clearly wrong to someone who knows the song
- The blanked word should be a key/memorable word, not a boring filler word like "the" or "and"
- Each question must be from a DIFFERENT song (no repeats)
- For lesser-known artists, pick their most famous/mainstream hits

Respond ONLY with a JSON array, no other text. Each element must have exactly this structure:
[
  {
    "artist": "Artist Name",
    "song": "Song Title",
    "lyric": "The context line before the blank",
    "blank": "The line with ___ where the missing word goes",
    "answer": "correctword",
    "options": ["correctword", "wrong1", "wrong2", "wrong3"]
  }
]

Make sure "options" always contains exactly 4 items including the correct answer. Do NOT wrap in markdown code blocks.`

    const message = await client.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 2000,
      messages: [{ role: 'user', content: prompt }],
    })

    const responseText = message.content[0].type === 'text' ? message.content[0].text.trim() : ''

    // Parse JSON - handle potential markdown wrapping
    let cleaned = responseText
    if (cleaned.startsWith('```')) {
      cleaned = cleaned.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '')
    }

    const questions = JSON.parse(cleaned)

    if (!Array.isArray(questions) || questions.length === 0) {
      throw new Error('Invalid response format')
    }

    // Validate and clean each question
    const validated = questions.map(q => ({
      artist: q.artist || 'Unknown',
      song: q.song || 'Unknown',
      lyric: q.lyric || '',
      blank: q.blank || '',
      answer: q.answer || '',
      options: Array.isArray(q.options) && q.options.length === 4 ? q.options : [q.answer, 'option2', 'option3', 'option4'],
    })).filter(q => q.answer && q.blank)

    return Response.json({ questions: validated })
  } catch (error) {
    console.error('Error generating lyrics quiz:', error)
    return Response.json(
      { error: 'Failed to generate quiz questions' },
      { status: 500 }
    )
  }
}
