import { Anthropic } from '@anthropic-ai/sdk'

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
})

const CONTACT_TYPES = [
  'Organisation',
  'Human Resources',
  'Speaker',
  'Supplier',
  'FI Friend',
  'FI Staff Member',
  'FI Facilitator',
  'FI Faculty',
  'FI Board Member',
  'Fellow',
  'Exchange Participant',
]

const RELATIONSHIPS = [
  'Personal Assistant',
  'Line Manager',
  'Senior Leader',
  'Stakeholder',
  'Senior HR',
  'Key HR',
  'Chief Executive Officer',
  'Head of Talent',
  'Head of People',
  'Head of Leadership',
  'Board Member',
  'Founder',
  'HR Contact',
  'Dinner Host',
  'Cross-Programme',
  'Discovery Session',
  'Events Supplier',
  'Other',
]

export async function POST(request) {
  try {
    const { title, orgName, sector, industry, companySize } = await request.json()

    if (!title && !orgName) {
      return Response.json(
        { contactType: 'Organisation', relationship: 'Other', reasoning: 'No job title or organisation provided, so defaulting to Organisation / Other.' }
      )
    }

    const prompt = `You are helping classify contacts for the Forward Institute, a UK leadership organisation that works with senior leaders across sectors to develop responsible leadership. Given the following contact information, suggest the most appropriate Contact Type and Relationship values.

Contact job title: ${title || 'Not provided'}
Organisation: ${orgName || 'Unknown'}
Sector: ${sector || 'Unknown'}
Industry: ${industry || 'Unknown'}
Company Size: ${companySize || 'Unknown'}

Contact Type options: ${CONTACT_TYPES.join(', ')}
Relationship options: ${RELATIONSHIPS.join(', ')}

IMPORTANT RULES:
- If the job title is unclear, a military rank, an abbreviation you don't recognise, or seems like jargon rather than a standard business title, default to contactType "Organisation" and relationship "Other"
- "Organisation" is the most common Contact Type - use it unless there's a clear reason not to (e.g. the title mentions HR, recruitment, talent, or people)
- If the title contains HR, People, Talent, L&D, or similar, use "Human Resources" as the Contact Type
- PA, EA, or assistant titles should get relationship "Personal Assistant"
- CEO, Chief Executive, Managing Director should get relationship "Chief Executive Officer"
- Senior titles (Director, Head of, VP) at the organisation should get relationship "Senior Leader" or "Line Manager"

Respond ONLY with JSON: { "contactType": "...", "relationship": "...", "reasoning": "..." }
The reasoning should be 1-2 sentences explaining your suggestion in simple, friendly language a teenager could understand.`

    const message = await client.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 300,
      messages: [
        {
          role: 'user',
          content: prompt,
        },
      ],
    })

    const responseText =
      message.content[0].type === 'text' ? message.content[0].text : ''

    const jsonMatch = responseText.match(/\{[\s\S]*\}/)
    if (!jsonMatch) {
      throw new Error('Invalid JSON response from Claude')
    }

    const result = JSON.parse(jsonMatch[0])

    return Response.json({
      contactType: result.contactType,
      relationship: result.relationship,
      reasoning: result.reasoning,
    })
  } catch (error) {
    console.error('Error calling Claude API:', error)
    return Response.json(
      { error: 'Failed to get suggestion from Claude' },
      { status: 500 }
    )
  }
}
