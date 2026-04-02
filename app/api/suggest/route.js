import { Anthropic } from '@anthropic-ai/sdk'

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
})

// Dependent picklist: Contact Type -> valid Relationships (from Salesforce)
const DEPENDENT_PICKLIST = {
  'Organisation': [
    'Board Member',
    'Budget Holder',
    'Chief Executive Officer',
    'Decision Maker',
    'Founder',
    'Line Manager',
    'Organisation',
    'Other',
    'Senior Leader',
    'Stakeholder',
  ],
  'Human Resources': [
    'Head of Leadership',
    'Head of Learning',
    'Head of People',
    'Head of Talent',
    'HR Contact',
    'Key HR',
    'Line Manager',
    'Senior HR',
  ],
}

const CONTACT_TYPES = Object.keys(DEPENDENT_PICKLIST)

export async function POST(request) {
  try {
    const { title, orgName, sector, industry, companySize } = await request.json()

    if (!title && !orgName) {
      return Response.json(
        { contactType: 'Organisation', relationship: 'Other', reasoning: 'No job title or organisation provided, so defaulting to Organisation / Other.' }
      )
    }

    // Build a readable picklist map for the prompt
    const picklistDescription = Object.entries(DEPENDENT_PICKLIST)
      .map(([type, rels]) => `Contact Type "${type}" -> valid Relationships: ${rels.join(', ')}`)
      .join('\n')

    const prompt = `You are helping classify contacts for the Forward Institute, a UK leadership organisation that works with senior leaders across sectors to develop responsible leadership. Given the following contact information, suggest the most appropriate Contact Type and Relationship values.

Contact job title: ${title || 'Not provided'}
Organisation: ${orgName || 'Unknown'}
Sector: ${sector || 'Unknown'}
Industry: ${industry || 'Unknown'}
Company Size: ${companySize || 'Unknown'}

DEPENDENT PICKLIST (you MUST pick a Relationship that is valid for the chosen Contact Type):
${picklistDescription}

IMPORTANT RULES:
- The Relationship MUST be from the valid list for the chosen Contact Type. This is a Salesforce dependent picklist - invalid combinations will be rejected.
- "Organisation" is the most common Contact Type - use it unless there's a clear reason not to
- If the job title contains HR, People, Talent, L&D, Learning & Development, Recruitment, or similar people/HR terms, use "Human Resources" as the Contact Type
- If the job title is unclear, a military rank, an abbreviation you don't recognise, or seems like jargon, default to contactType "Organisation" and relationship "Other"
- CEO, Chief Executive, Managing Director -> Organisation / Chief Executive Officer
- Senior titles (Director, Head of, VP, C-suite other than CEO) -> Organisation / Senior Leader
- Board, Trustee, Non-exec, NED -> Organisation / Board Member
- Founder, Co-founder, Owner -> Organisation / Founder
- Manager, Team Lead -> Organisation / Line Manager or Decision Maker depending on seniority
- Head of HR, HR Director, Chief People Officer, CHRO -> Human Resources / Key HR
- HR Manager, HR Business Partner -> Human Resources / HR Contact
- Head of Talent, Talent Director -> Human Resources / Head of Talent
- Head of Learning, L&D Director -> Human Resources / Head of Learning
- If someone has a budget or commissioning role -> Organisation / Budget Holder

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

    // Validate the combination is valid in the dependent picklist
    let contactType = result.contactType
    let relationship = result.relationship

    if (!DEPENDENT_PICKLIST[contactType]) {
      contactType = 'Organisation'
    }
    if (!DEPENDENT_PICKLIST[contactType].includes(relationship)) {
      relationship = 'Other'
      // If 'Other' isn't valid for this type, pick the first valid option
      if (!DEPENDENT_PICKLIST[contactType].includes('Other')) {
        relationship = DEPENDENT_PICKLIST[contactType][0]
      }
    }

    return Response.json({
      contactType,
      relationship,
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
